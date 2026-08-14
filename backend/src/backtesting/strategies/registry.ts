import type { Strategy } from './types.js';
import { smaCrossoverStrategy } from './smaCrossover.js';
import { rsiStrategy } from './rsi.js';
import { bollingerBandsStrategy } from './bollingerBands.js';

/**
 * Strategy registry — the single source of truth for available strategies.
 *
 * Strategies are intentionally stateless singletons: each backtest run gets a
 * fresh `createState()` instance, so running the same strategy concurrently
 * never shares indicator state.
 */
const STRATEGIES: Strategy[] = [
  smaCrossoverStrategy,
  rsiStrategy,
  bollingerBandsStrategy,
];

const BY_ID = new Map<string, Strategy>(STRATEGIES.map((strategy) => [strategy.id, strategy]));

export const strategyRegistry = {
  list(): Strategy[] {
    return STRATEGIES;
  },

  get(id: string): Strategy | undefined {
    return BY_ID.get(id);
  },

  has(id: string): boolean {
    return BY_ID.has(id);
  },
};
