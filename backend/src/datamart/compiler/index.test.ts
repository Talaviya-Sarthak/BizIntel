import { describe, expect, it } from 'vitest';
import type { DatasetColumn } from '../../models/dataset.model.js';
import { ApiError } from '../../utils/httpError.js';
import {
  DataMartQueryCompiler,
  type DataMartDatasetSchema,
  type DataMartSchemaLoader,
} from './index.js';
import type { DataMartQuery } from '../types/index.js';

function column(columnName: string, dataType: string): DatasetColumn {
  return {
    id: `id_${columnName}`,
    datasetId: 'ds',
    columnName,
    dataType,
    nullable: true,
    ordinalPosition: 0,
    uniqueCount: null,
    nullCount: null,
    createdAt: new Date(),
  };
}

const salesSchema: DataMartDatasetSchema = {
  id: 'sales',
  name: 'Sales',
  storagePath: 'C:/data/sales.csv',
  status: 'READY',
  columns: [
    column('region', 'VARCHAR'),
    column('amount', 'DOUBLE'),
    column('units', 'BIGINT'),
    column('order_date', 'DATE'),
  ],
};

const customersSchema: DataMartDatasetSchema = {
  id: 'customers',
  name: 'Customers',
  storagePath: 'C:/data/customers.csv',
  status: 'READY',
  columns: [
    column('customer_id', 'VARCHAR'),
    column('tier', 'VARCHAR'),
    column('region', 'VARCHAR'),
  ],
};

const loader: DataMartSchemaLoader = async (id) => {
  if (id === 'sales') return salesSchema;
  if (id === 'customers') return customersSchema;
  throw new Error(`Unknown dataset ${id}`);
};

const compiler = new DataMartQueryCompiler();

function baseQuery(overrides: Partial<DataMartQuery> = {}): DataMartQuery {
  return {
    datasets: ['sales'],
    dimensions: [],
    metrics: [{ column: 'amount', aggregation: 'sum', alias: 'total' }],
    filters: undefined as never,
    joins: [],
    sort: [],
    limit: 100,
    offset: 0,
    ...overrides,
  };
}

async function expectCode(fn: () => Promise<unknown> | unknown, code: string): Promise<void> {
  try {
    await fn();
    expect.unreachable('expected an ApiError');
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe(code);
  }
}

describe('DataMartQueryCompiler', () => {
  it('compiles a simple aggregate over the base dataset', async () => {
    const plan = await compiler.compile(baseQuery(), loader);
    expect(plan.dataSql).toContain('sum(d0."amount") AS __dm_m0');
    expect(plan.dataSql).toContain('FROM read_csv(\'C:/data/sales.csv\', header=true, sample_size=-1) AS d0');
    expect(plan.countSql).toContain('SELECT count(*) AS n');
    expect(plan.dataSql).toContain('LIMIT ? OFFSET ?');
    expect(plan.params).toEqual([100, 0]);
    expect(plan.columns).toHaveLength(1);
    expect(plan.columns[0]).toMatchObject({ alias: '__dm_m0', name: 'total', kind: 'metric' });
  });

  it('compiles dimensions with group by', async () => {
    const plan = await compiler.compile(
      baseQuery({
        dimensions: [{ column: 'region' }],
        metrics: [{ column: 'amount', aggregation: 'sum', alias: 'total' }],
      }),
      loader,
    );
    expect(plan.dataSql).toContain('d0."region" AS __dm_d0');
    expect(plan.dataSql).toContain('GROUP BY __dm_d0');
    expect(plan.dataSql).toContain('sum(d0."amount") AS __dm_m0');
  });

  it('compiles date grouping with date_trunc', async () => {
    const plan = await compiler.compile(
      baseQuery({
        dimensions: [{ column: 'order_date', granularity: 'month' }],
        metrics: [{ column: 'amount', aggregation: 'sum', alias: 'total' }],
      }),
      loader,
    );
    expect(plan.dataSql).toContain(
      `date_trunc('month', CAST(d0."order_date" AS TIMESTAMP)) AS __dm_d0`,
    );
  });

  it('rejects date grouping on a non-date column', async () => {
    await await expectCode(
      () =>
        compiler.compile(
          baseQuery({ dimensions: [{ column: 'region', granularity: 'month' }] }),
          loader,
        ),
      'DATAMART_INVALID_QUERY',
    );
  });

  it('compiles filters with parameters', async () => {
    const plan = await compiler.compile(
      baseQuery({
        dimensions: [{ column: 'region' }],
        filters: {
          conjunction: 'AND' as const,
          nodes: [
            { column: 'region', operator: 'eq', value: 'EU' },
            { column: 'amount', operator: 'gt', value: 100 },
          ],
        },
      }),
      loader,
    );
    expect(plan.dataSql).toContain('WHERE (d0."region" = ? AND d0."amount" > ?)');
    expect(plan.params).toEqual(['EU', 100, 100, 0]);
  });

  it('compiles count and count(*)', async () => {
    const countCol = await compiler.compile(
      baseQuery({
        metrics: [{ column: 'region', aggregation: 'count', alias: 'rows' }],
      }),
      loader,
    );
    expect(countCol.dataSql).toContain('count(d0."region") AS __dm_m0');

    const countAll = await compiler.compile(
      baseQuery({
        metrics: [{ aggregation: 'count', alias: 'rows' }],
      }),
      loader,
    );
    expect(countAll.dataSql).toContain('count(*) AS __dm_m0');
  });

  it('compiles count_distinct', async () => {
    const plan = await compiler.compile(
      baseQuery({
        metrics: [{ column: 'region', aggregation: 'count_distinct', alias: 'regions' }],
      }),
      loader,
    );
    expect(plan.dataSql).toContain('count(DISTINCT d0."region") AS __dm_m0');
  });

  it('rejects numeric aggregates over non-numeric columns', async () => {
    await await expectCode(
      () =>
        compiler.compile(
          baseQuery({
            metrics: [{ column: 'region', aggregation: 'sum', alias: 'bad' }],
          }),
          loader,
        ),
      'DATAMART_INVALID_QUERY',
    );
  });

  it('compiles a formula metric', async () => {
    const plan = await compiler.compile(
      baseQuery({
        metrics: [
          {
            formula: 'SUM(amount) / SUM(units)',
            alias: 'avg_price',
          },
        ],
      }),
      loader,
    );
    expect(plan.dataSql).toContain(
      '(sum(d0."amount") / sum(d0."units")) AS __dm_m0',
    );
  });

  it('rejects formulas with unknown columns', async () => {
    await await expectCode(
      () =>
        compiler.compile(
          baseQuery({
            metrics: [{ formula: 'SUM(nope)', alias: 'x' }],
          }),
          loader,
        ),
      'DATAMART_INVALID_METRIC',
    );
  });

  it('rejects a constant formula in a grouped query', async () => {
    await await expectCode(
      () =>
        compiler.compile(
          baseQuery({
            dimensions: [{ column: 'region' }],
            metrics: [{ formula: '42', alias: 'forty_two' }],
          }),
          loader,
        ),
      'DATAMART_INVALID_METRIC',
    );
  });

  it('compiles a left join between datasets', async () => {
    const plan = await compiler.compile(
      baseQuery({
        datasets: ['sales', 'customers'],
        joins: [
          {
            type: 'left',
            leftDataset: 'sales',
            leftColumn: 'region',
            rightDataset: 'customers',
            rightColumn: 'tier',
          },
        ],
        dimensions: [{ column: 'tier' }],
        metrics: [{ column: 'amount', aggregation: 'sum', alias: 'total' }],
      }),
      loader,
    );
    expect(plan.dataSql).toContain("LEFT JOIN read_csv('C:/data/customers.csv', header=true, sample_size=-1) AS d1");
    expect(plan.dataSql).toContain('ON d0."region" = d1."tier"');
    expect(plan.dataSql).toContain('d1."tier" AS __dm_d0');
  });

  it('rejects ambiguous columns across datasets', async () => {
    // `region` exists in both datasets, so any unqualified reference is ambiguous.
    await await expectCode(
      () =>
        compiler.compile(
          baseQuery({
            datasets: ['sales', 'customers'],
            joins: [
              {
                type: 'left',
                leftDataset: 'sales',
                leftColumn: 'region',
                rightDataset: 'customers',
                rightColumn: 'region',
              },
            ],
            metrics: [{ column: 'region', aggregation: 'count', alias: 'total' }],
          }),
          loader,
        ),
      'DATAMART_AMBIGUOUS_COLUMN',
    );
  });

  it('rejects a join on a dataset outside the query', async () => {
    await await expectCode(
      () =>
        compiler.compile(
          baseQuery({
            datasets: ['sales'],
            joins: [
              {
                type: 'left',
                leftDataset: 'sales',
                leftColumn: 'region',
                rightDataset: 'missing',
                rightColumn: 'tier',
              },
            ],
          }),
          loader,
        ),
      'DATAMART_INVALID_QUERY',
    );
  });

  it('sorts by a selected dimension or metric', async () => {
    const plan = await compiler.compile(
      baseQuery({
        dimensions: [{ column: 'region' }],
        metrics: [{ column: 'amount', aggregation: 'sum', alias: 'total' }],
        sort: [{ column: 'total', direction: 'desc' }],
      }),
      loader,
    );
    expect(plan.dataSql).toContain('ORDER BY __dm_m0 DESC');
  });

  it('rejects sorting by a column that is not selected', async () => {
    await await expectCode(
      () =>
        compiler.compile(
          baseQuery({
            metrics: [{ column: 'amount', aggregation: 'sum', alias: 'total' }],
            sort: [{ column: 'units', direction: 'asc' }],
          }),
          loader,
        ),
      'DATAMART_INVALID_SORT',
    );
  });

  it('clamps limit and offset', async () => {
    const plan = await compiler.compile(
      baseQuery({ limit: 999_999, offset: -5 }),
      loader,
    );
    expect(plan.params[plan.params.length - 2]).toBe(10_000);
    expect(plan.params[plan.params.length - 1]).toBe(0);
  });

  it('rejects an empty datasets list', async () => {
    await await expectCode(
      () => compiler.compile(baseQuery({ datasets: [] }), loader),
      'DATAMART_INVALID_QUERY',
    );
  });

  it('rejects a query with no dimensions or metrics', async () => {
    await await expectCode(
      () => compiler.compile(baseQuery({ dimensions: [], metrics: [] }), loader),
      'DATAMART_INVALID_QUERY',
    );
  });
});