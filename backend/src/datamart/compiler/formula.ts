import { ApiError } from '../../utils/httpError';
import { DATAMART_ERROR_CODES } from '../types';
import {
  AGGREGATION_FUNCTIONS,
  NUMERIC_AGGREGATIONS,
  type DataMartAggregation,
} from '../types';

/**
 * Safe expression grammar for calculated metrics.
 *
 * Supported (whitelisted, compiled — never arbitrary execution):
 *
 *   Expr      := Term (('+' | '-') Term)*
 *   Term      := Factor (('*' | '/') Factor)*
 *   Factor    := NUMBER | COLUMN | AGG | '(' Expr ')'
 *   AGG       := AGG_NAME '(' [DISTINCT] COLUMN | '*' ')'
 *
 * Constraints enforced here:
 *   - Only approved aggregation functions may be used (see DATAMART_AGGREGATIONS).
 *   - Aggregations cannot be nested (e.g. SUM(SUM(x)) is rejected).
 *   - A bare column outside an aggregation is rejected (would break GROUP BY).
 *   - Division by a constant zero is rejected.
 *   - Column identifiers are resolved against the dataset schema and quoted;
 *     user values are never interpolated into the SQL.
 */

export interface FormulaContext {
  /** Returns the qualified SQL identifier for a column, or `null` if unknown. */
  resolveColumnSql(name: string): string | null;
  /**
   * Optional: used to reject aggregates that require a numeric column
   * (sum/avg/median/stddev/variance) at compile time with a clear error.
   */
  isNumericColumn?: (name: string) => boolean;
}

export interface CompiledFormula {
  /** Safe SQL expression (identifiers quoted, values inline only as literals). */
  sql: string;
  hasAggregation: boolean;
}

const AGG_NAMES = new Set<string>(Object.keys(AGGREGATION_FUNCTIONS));

const NUMERIC_ONLY_AGGREGATES = new Set<DataMartAggregation>(NUMERIC_AGGREGATIONS);

type FormulaNode =
  | { kind: 'number'; value: number; raw: string }
  | { kind: 'column'; name: string }
  | {
      kind: 'aggregation';
      fn: DataMartAggregation;
      distinct: boolean;
      column: string | null;
    }
  | { kind: 'binary'; op: string; left: FormulaNode; right: FormulaNode };

interface Token {
  kind: 'number' | 'ident' | 'op' | 'lparen' | 'rparen' | 'comma' | 'distinct';
  value: string;
}

function invalid(message: string): ApiError {
  return ApiError.badRequest(DATAMART_ERROR_CODES.INVALID_METRIC, message);
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

const DELIMITERS = new Set(['+', '-', '*', '/', '(', ')', ',']);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let buffer = '';

  const flush = (): void => {
    if (buffer.length === 0) return;
    const raw = buffer;
    buffer = '';
    const trimmed = raw.trim();
    if (trimmed.length === 0) return;
    // `distinct` is a keyword and may be glued to the following column by
    // whitespace (e.g. `COUNT(DISTINCT customer_id)`), which is not a
    // delimiter. Split it off so it parses as its own token.
    const distinctMatch = /^distinct\b/i.exec(trimmed);
    if (distinctMatch) {
      tokens.push({ kind: 'distinct', value: 'distinct' });
      const rest = trimmed.slice(distinctMatch[0].length).trim();
      if (rest.length > 0) tokens.push(identToken(rest));
      return;
    }
    tokens.push(identToken(trimmed));
  };

  for (const char of input) {
    if (DELIMITERS.has(char)) {
      flush();
      if (char === '(') tokens.push({ kind: 'lparen', value: char });
      else if (char === ')') tokens.push({ kind: 'rparen', value: char });
      else if (char === ',') tokens.push({ kind: 'comma', value: char });
      else tokens.push({ kind: 'op', value: char });
    } else {
      buffer += char;
    }
  }
  flush();
  return tokens;
}

function identToken(value: string): Token {
  if (Number.isFinite(Number(value))) {
    return { kind: 'number', value };
  }
  return { kind: 'ident', value };
}

// ---------------------------------------------------------------------------
// Parser (recursive descent)
// ---------------------------------------------------------------------------

class Parser {
  private readonly tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): FormulaNode {
    if (this.tokens.length === 0) throw invalid('A metric formula cannot be empty');
    const node = this.parseExpr();
    if (!this.atEnd()) {
      throw invalid(`Unexpected token "${this.peek().value}" in metric formula`);
    }
    return node;
  }

  private parseExpr(): FormulaNode {
    let left = this.parseTerm();
    while (this.matchOp('+') || this.matchOp('-')) {
      const op = this.previous().value;
      const right = this.parseTerm();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parseTerm(): FormulaNode {
    let left = this.parseFactor();
    while (this.matchOp('*') || this.matchOp('/')) {
      const op = this.previous().value;
      const right = this.parseFactor();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parseFactor(): FormulaNode {
    const token = this.advance();

    if (token.kind === 'number') {
      return { kind: 'number', value: Number(token.value), raw: token.value };
    }

    if (token.kind === 'lparen') {
      const inner = this.parseExpr();
      this.consume('rparen', 'Expected ")" in metric formula');
      return inner;
    }

    if (token.kind === 'ident') {
      if (this.check('lparen')) {
        return this.parseAggregation(token.value);
      }
      return { kind: 'column', name: token.value };
    }

    throw invalid(`Unexpected token "${token.value}" in metric formula`);
  }

  private parseAggregation(name: string): FormulaNode {
    if (!AGG_NAMES.has(name.toLowerCase())) {
      throw invalid(`Unknown function "${name}" in metric formula`);
    }
    this.consume('lparen', `Expected "(" after ${name}`);

    let distinct = false;
    if (this.check('distinct')) {
      this.advance();
      distinct = true;
    }

    let column: string | null = null;
    if (this.check('rparen')) {
      // count() — allowed, equivalent to count(*)
    } else if (this.check('op') && this.peek().value === '*') {
      this.advance();
      if (distinct) throw invalid('COUNT(DISTINCT *) is not supported');
    } else {
      const token = this.advance();
      if (token.kind !== 'ident') {
        throw invalid('Aggregation argument must be a column name');
      }
      column = token.value;
    }

    this.consume('rparen', `Expected ")" after ${name} argument`);
    return {
      kind: 'aggregation',
      fn: name.toLowerCase() as DataMartAggregation,
      distinct,
      column,
    };
  }

  // --- helpers -----------------------------------------------------------
  private peek(): Token {
    return this.tokens[this.pos] ?? { kind: 'ident', value: '' };
  }

  private previous(): Token {
    return this.tokens[this.pos - 1] ?? { kind: 'ident', value: '' };
  }

  private advance(): Token {
    if (!this.atEnd()) this.pos += 1;
    return this.previous();
  }

  private atEnd(): boolean {
    return this.pos >= this.tokens.length;
  }

  private check(kind: Token['kind']): boolean {
    return !this.atEnd() && this.tokens[this.pos]!.kind === kind;
  }

  private matchOp(op: string): boolean {
    if (!this.check('op') || this.peek().value !== op) return false;
    this.pos += 1;
    return true;
  }

  private consume(kind: Token['kind'], message: string): void {
    if (this.check(kind)) {
      this.pos += 1;
      return;
    }
    throw invalid(message);
  }
}

// ---------------------------------------------------------------------------
// Compile + validate
// ---------------------------------------------------------------------------

export function compileFormula(input: string, context: FormulaContext): CompiledFormula {
  const trimmed = input.trim();
  if (trimmed.length === 0) throw invalid('A metric formula cannot be empty');
  if (trimmed.length > 1000) throw invalid('Metric formula is too long');

  const ast = new Parser(tokenize(trimmed)).parse();
  validate(ast, context);

  const sql = toSql(ast, context);
  return { sql, hasAggregation: containsAggregation(ast) };
}

/** Walks the AST enforcing the safety constraints described above. */
function validate(node: FormulaNode, context: FormulaContext): void {
  switch (node.kind) {
    case 'number':
      return;
    case 'column':
      // The grammar only allows columns inside aggregation arguments, which are
      // validated in the `aggregation` case; a bare column anywhere else would
      // break GROUP BY and is therefore rejected.
      throw invalid(
        `"${node.name}" must be wrapped in an aggregation function (e.g. SUM(${node.name}))`,
      );
    case 'aggregation': {
      if (node.column) {
        if (!context.resolveColumnSql(node.column)) {
          throw invalid(`Unknown column "${node.column}" in metric formula`);
        }
        if (
          NUMERIC_ONLY_AGGREGATES.has(node.fn) &&
          context.isNumericColumn &&
          !context.isNumericColumn(node.column)
        ) {
          throw invalid(
            `"${node.fn}" requires a numeric column; "${node.column}" is not numeric`,
          );
        }
      }
      return;
    }
    case 'binary': {
      if (node.op === '/' && isConstantZero(node.right)) {
        throw invalid('Division by zero in metric formula');
      }
      validate(node.left, context);
      validate(node.right, context);
      return;
    }
  }
}

function containsAggregation(node: FormulaNode): boolean {
  if (node.kind === 'aggregation') return true;
  if (node.kind === 'binary') {
    return containsAggregation(node.left) || containsAggregation(node.right);
  }
  return false;
}

function isConstantZero(node: FormulaNode): boolean {
  return node.kind === 'number' && Number(node.value) === 0;
}

/** Renders the validated AST to SQL with safely quoted identifiers. */
function toSql(node: FormulaNode, context: FormulaContext): string {
  switch (node.kind) {
    case 'number':
      return node.raw;
    case 'column':
      return context.resolveColumnSql(node.name)!;
    case 'aggregation': {
      const fn = AGGREGATION_FUNCTIONS[node.fn];
      if (node.distinct) {
        return `${fn}(DISTINCT ${context.resolveColumnSql(node.column!)})`;
      }
      if (node.column) {
        return `${fn}(${context.resolveColumnSql(node.column)})`;
      }
      return `${fn}(*)`;
    }
    case 'binary': {
      return `(${toSql(node.left, context)} ${node.op} ${toSql(node.right, context)})`;
    }
  }
}
