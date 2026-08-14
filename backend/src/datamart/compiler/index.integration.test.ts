import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DatasetColumn } from '../../models/dataset.model.js';
import { duckdbService } from '../../services/duckdb.service.js';
import { DataMartQueryCompiler, type DataMartDatasetSchema } from './index.js';
import type { DataMartQuery } from '../types/index.js';

/**
 * End-to-end coverage for the compiler: builds the fixtures, compiles real
 * queries and executes them against actual CSV files via DuckDB. Guards the
 * `dataSql`/`countSql`/`params` contract that the service relies on.
 */

let dir: string;
let salesPath: string;
let customersPath: string;

const SALES = [
  'region,amount,units,order_date',
  'North,100,2,2024-01-05',
  'North,150,3,2024-01-12',
  'South,200,5,2024-02-01',
  'South,250,1,2024-03-10',
].join('\n');

const CUSTOMERS = [
  'customer_id,tier,customer_region',
  'C1,gold,North',
  'C2,silver,North',
  'C3,gold,South',
].join('\n');

function column(name: string, dataType: string, ordinal: number): DatasetColumn {
  return {
    id: `col-${name}`,
    datasetId: 'ds',
    columnName: name,
    dataType,
    nullable: true,
    ordinalPosition: ordinal,
    uniqueCount: null,
    nullCount: null,
    createdAt: new Date(),
  };
}

function salesSchema(storagePath: string): DataMartDatasetSchema {
  return {
    id: 'sales',
    name: 'Sales',
    storagePath,
    status: 'READY',
    columns: [
      column('region', 'VARCHAR', 1),
      column('amount', 'DOUBLE', 2),
      column('units', 'BIGINT', 3),
      column('order_date', 'DATE', 4),
    ],
  };
}

function customersSchema(storagePath: string): DataMartDatasetSchema {
  return {
    id: 'customers',
    name: 'Customers',
    storagePath,
    status: 'READY',
    columns: [
      column('customer_id', 'VARCHAR', 1),
      column('tier', 'VARCHAR', 2),
      column('customer_region', 'VARCHAR', 3),
    ],
  };
}

async function run(query: DataMartQuery, loader: (id: string) => Promise<DataMartDatasetSchema>) {
  const compiler = new DataMartQueryCompiler();
  const compiled = await compiler.compile(query, loader);
  const base = query.datasets[0]!;
  const baseSchema = await loader(base);
  const raw = await duckdbService.runQuery(baseSchema.storagePath!, compiled.dataSql, compiled.params);
  const counts = await duckdbService.runQuery(baseSchema.storagePath!, compiled.countSql, compiled.countParams);
  const rows = raw.map((row) => {
    const out: Record<string, unknown> = {};
    for (const column of compiled.columns) {
      const value = row[column.alias];
      if (column.name in out) out[column.alias] = value;
      else out[column.name] = value;
    }
    return out;
  });
  return { compiled, rows, totalRows: Number(counts[0]?.n ?? 0) };
}

beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'datamart-int-'));
  salesPath = path.join(dir, 'sales.csv');
  customersPath = path.join(dir, 'customers.csv');
  await fs.writeFile(salesPath, SALES, 'utf8');
  await fs.writeFile(customersPath, CUSTOMERS, 'utf8');
});

afterAll(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe('DataMartQueryCompiler end-to-end (DuckDB)', () => {
  it('executes a grouped aggregation against a single dataset', async () => {
    const query: DataMartQuery = {
      datasets: ['sales'],
      dimensions: [{ column: 'region' }],
      metrics: [{ column: 'amount', aggregation: 'sum', alias: 'total' }],
      sort: [{ column: 'total', direction: 'desc' }],
      limit: 10,
      offset: 0,
    };
    const { rows, totalRows, compiled } = await run(query, async (id) => salesSchema(salesPath));
    expect(totalRows).toBe(2);
    expect(rows).toEqual([
      { region: 'South', total: 450 },
      { region: 'North', total: 250 },
    ]);
    expect(compiled.columns.map((c) => c.name)).toEqual(['region', 'total']);
  });

  it('executes a date_trunc dimension with a count metric', async () => {
    const query: DataMartQuery = {
      datasets: ['sales'],
      dimensions: [{ column: 'order_date', granularity: 'month' }],
      metrics: [{ aggregation: 'count', alias: 'n' }],
      sort: [
        { column: 'n', direction: 'desc' },
        { column: 'order_date', direction: 'asc' },
      ],
      limit: 10,
      offset: 0,
    };
    const { rows, totalRows } = await run(query, async (id) => salesSchema(salesPath));
    expect(totalRows).toBe(3);
    expect(rows).toEqual([
      { order_date: '2024-01-01T00:00:00.000Z', n: 2 },
      { order_date: '2024-02-01T00:00:00.000Z', n: 1 },
      { order_date: '2024-03-01T00:00:00.000Z', n: 1 },
    ]);
  });

  it('executes a formula metric with aggregations', async () => {
    const query: DataMartQuery = {
      datasets: ['sales'],
      dimensions: [{ column: 'region' }],
      metrics: [{ formula: 'SUM(amount) / SUM(units)', alias: 'avg_price' }],
      sort: [{ column: 'region', direction: 'asc' }],
      limit: 10,
      offset: 0,
    };
    const { rows } = await run(query, async (id) => salesSchema(salesPath));
    expect(rows).toEqual([
      { region: 'North', avg_price: 50 },
      { region: 'South', avg_price: 75 },
    ]);
  });

  it('executes a join with a filter and reports the exact total', async () => {
    const query: DataMartQuery = {
      datasets: ['sales', 'customers'],
      dimensions: [{ column: 'region' }],
      metrics: [{ column: 'units', aggregation: 'sum', alias: 'total_units' }],
      filters: { column: 'region', operator: 'eq', value: 'South' },
      joins: [
        {
          type: 'left',
          leftDataset: 'sales',
          leftColumn: 'region',
          rightDataset: 'customers',
          rightColumn: 'customer_region',
        },
      ],
      sort: [],
      limit: 10,
      offset: 0,
    };
    const loader = async (id: string) => {
      if (id === 'sales') return salesSchema(salesPath);
      return customersSchema(customersPath);
    };
    const { rows, totalRows } = await run(query, loader);
    expect(totalRows).toBe(1);
    expect(rows).toEqual([{ region: 'South', total_units: 6 }]);
  });

  it('executes a left join producing every base row with the count query intact', async () => {
    const query: DataMartQuery = {
      datasets: ['sales', 'customers'],
      dimensions: [{ column: 'region' }],
      metrics: [{ aggregation: 'count', alias: 'n' }],
      joins: [
        {
          type: 'left',
          leftDataset: 'sales',
          leftColumn: 'region',
          rightDataset: 'customers',
          rightColumn: 'customer_region',
        },
      ],
      sort: [{ column: 'region', direction: 'asc' }],
      limit: 10,
      offset: 0,
    };
    const loader = async (id: string) => {
      if (id === 'sales') return salesSchema(salesPath);
      return customersSchema(customersPath);
    };
    const { rows, totalRows } = await run(query, loader);
    expect(totalRows).toBe(2);
    expect(rows).toEqual([
      { region: 'North', n: 4 },
      { region: 'South', n: 2 },
    ]);
  });

  it('applies LIMIT/OFFSET while the count query reports the full total', async () => {
    const query: DataMartQuery = {
      datasets: ['sales'],
      dimensions: [{ column: 'region' }],
      metrics: [{ column: 'amount', aggregation: 'sum', alias: 'total' }],
      sort: [{ column: 'total', direction: 'desc' }],
      limit: 1,
      offset: 1,
    };
    const { rows, totalRows } = await run(query, async (id) => salesSchema(salesPath));
    expect(totalRows).toBe(2);
    expect(rows).toEqual([{ region: 'North', total: 250 }]);
  });
});