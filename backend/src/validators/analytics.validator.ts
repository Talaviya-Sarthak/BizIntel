import { z } from 'zod';
import {
  ANALYTICS_AGGREGATIONS,
  FILTER_OPERATORS,
  TIME_GRANULARITIES,
  type AggregationFunction,
  type FilterNode,
  type GroupByRequest,
  type TimeSeriesRequest,
} from '../types/analytics';

/** `:column` path parameter — just a non-empty identifier. */
export const analyticsColumnParamsSchema = z.object({
  column: z.string().trim().min(1, 'Column name is required'),
});

export const analyticsBucketsQuerySchema = z.object({
  buckets: z.coerce.number().int().min(5).max(200).optional(),
});

export const analyticsTopValuesQuerySchema = z.object({
  top: z.coerce.number().int().min(1).max(50).optional(),
});

/**
 * A filter condition. `value`/`value2` are intentionally `unknown` — their
 * correctness is checked in AnalyticsService against the column's category.
 */
const filterConditionSchema = z.object({
  column: z.string().trim().min(1, 'Filter column is required'),
  operator: z.enum(FILTER_OPERATORS),
  value: z.unknown().optional(),
  value2: z.unknown().optional(),
});

/** Recursive boolean filter tree (conditions OR nested groups). */
const filterNodeSchema: z.ZodType<FilterNode> = z.lazy(() =>
  z.union([
    filterConditionSchema,
    z.object({
      conjunction: z.enum(['AND', 'OR']),
      nodes: z.array(filterNodeSchema).max(50, 'Too many filter clauses'),
    }),
  ]),
);

export const analyticsGroupBySchema = z.object({
  groupBy: z.string().trim().min(1, 'Group-by column is required'),
  aggregation: z.enum(ANALYTICS_AGGREGATIONS).default('count'),
  metric: z.string().trim().min(1).optional(),
  topN: z.number().int().min(1).max(100).optional(),
});

export const analyticsTimeSeriesSchema = z.object({
  dateColumn: z.string().trim().min(1, 'Date column is required'),
  metric: z.string().trim().min(1).optional(),
  aggregation: z.enum(ANALYTICS_AGGREGATIONS).default('sum'),
  granularity: z.enum(TIME_GRANULARITIES).default('month'),
});

export const analyticsCorrelationSchema = z
  .object({
    columns: z.array(z.string().trim().min(1)).max(12, 'At most 12 columns').optional(),
  })
  .strict();

export const analyticsScatterSchema = z
  .object({
    x: z.string().trim().min(1, 'X axis column is required'),
    y: z.string().trim().min(1, 'Y axis column is required'),
    sample: z.number().int().min(1).max(5000).optional(),
  })
  .strict();

export const analyticsExplorerSchema = z
  .object({
    columns: z.array(z.string().trim().min(1)).max(100, 'At most 100 columns').optional(),
    filters: filterNodeSchema.optional(),
    search: z
      .object({
        term: z.string().trim().max(200, 'Search term is too long').optional(),
        columns: z.array(z.string().trim().min(1)).max(50).optional(),
      })
      .optional(),
    sort: z
      .object({
        column: z.string().trim().min(1, 'Sort column is required'),
        direction: z.enum(['asc', 'desc']).default('asc'),
      })
      .optional(),
    page: z.number().int().min(1).max(1_000_000).optional(),
    pageSize: z.number().int().min(1).max(500).optional(),
  })
  .strict();

export type AnalyticsGroupByInput = z.infer<typeof analyticsGroupBySchema> & GroupByRequest;
export type AnalyticsTimeSeriesInput = z.infer<typeof analyticsTimeSeriesSchema> &
  TimeSeriesRequest;
export type AggregationInput = AggregationFunction;
