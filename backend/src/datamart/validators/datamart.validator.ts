import { z } from 'zod';
import { FILTER_OPERATORS, TIME_GRANULARITIES } from '../../types/analytics.js';
import {
  DATAMART_AGGREGATIONS,
  METRIC_FORMATS,
  type FilterNode,
  type DataMartQueryMetric,
  type MetricDefinition,
} from '../types/index.js';

/** `:id` path parameter — UUIDs only. */
export const datamartIdParamsSchema = z.object({
  id: z.string().uuid('A valid id is required'),
});

/** `:widgetId` path parameter for nested widget routes. */
export const datamartWidgetIdParamsSchema = z.object({
  widgetId: z.string().uuid('A valid widget id is required'),
});

/**
 * Combined `:id` + `:widgetId` path params for nested widget routes. Both
 * params must survive validation, so they are parsed together (a single
 * zod object strips unknown keys, which would drop one of them).
 */
export const datamartWidgetParamsSchema = z.object({
  id: z.string().uuid('A valid id is required'),
  widgetId: z.string().uuid('A valid widget id is required'),
});

export const datamartListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * A filter condition. `value`/`value2` are intentionally `unknown` — their
 * correctness is checked by the compiler against the resolved column type.
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

const dimensionSchema = z.object({
  column: z.string().trim().min(1, 'Dimension column is required').max(200),
  granularity: z.enum(TIME_GRANULARITIES).optional(),
});

const queryMetricSchema: z.ZodType<DataMartQueryMetric> = z
  .object({
    column: z.string().trim().min(1).max(200).optional(),
    aggregation: z.enum(DATAMART_AGGREGATIONS).optional(),
    formula: z.string().trim().min(1).max(500).optional(),
    alias: z.string().trim().min(1).max(200),
  })
  .refine(
    (metric) =>
      metric.formula !== undefined ||
      (metric.column !== undefined && metric.aggregation !== undefined) ||
      (metric.aggregation === 'count' && metric.column === undefined),
    { message: 'A metric must define column+aggregation or a formula' },
  );

const joinSchema = z.object({
  type: z.enum(['inner', 'left']),
  leftDataset: z.string().uuid('leftDataset must reference a dataset id'),
  leftColumn: z.string().trim().min(1).max(200),
  rightDataset: z.string().uuid('rightDataset must reference a dataset id'),
  rightColumn: z.string().trim().min(1).max(200),
});

const sortSchema = z.object({
  column: z.string().trim().min(1).max(200),
  direction: z.enum(['asc', 'desc']),
});

/** The structured query configuration compiled into safe DuckDB SQL. */
export const datamartQuerySchema = z.object({
  datasets: z
    .array(z.string().uuid('Dataset ids must be valid UUIDs'))
    .min(1, 'At least one dataset is required')
    .max(8, 'Up to 8 datasets can be queried at once')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Duplicate dataset ids are not allowed',
    }),
  dimensions: z.array(dimensionSchema).max(50, 'At most 50 dimensions').default([]),
  metrics: z.array(queryMetricSchema).max(50, 'At most 50 metrics').default([]),
  filters: filterNodeSchema.optional(),
  joins: z.array(joinSchema).max(20, 'At most 20 joins').default([]),
  sort: z.array(sortSchema).max(20, 'At most 20 sort keys').default([]),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'limit must be at least 1')
    .max(10000, 'limit cannot exceed 10000')
    .default(1000),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
});

export const datamartExecuteSchema = z.object({
  query: datamartQuerySchema,
});

const tagsSchema = z.array(z.string().trim().min(1).max(50)).max(50).default([]);

export const createAnalysisSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  query: datamartQuerySchema,
  tags: tagsSchema,
});

export const updateAnalysisSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(1000).nullable().optional(),
    query: datamartQuerySchema.optional(),
    tags: tagsSchema.optional(),
  })
  .strict();

export const datamartRunsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const metricDefinitionSchema: z.ZodType<MetricDefinition> = z
  .discriminatedUnion('kind', [
    z.object({
      kind: z.literal('aggregate'),
      column: z.string().trim().min(1, 'aggregate metrics require a column').max(200),
      aggregation: z.enum(DATAMART_AGGREGATIONS),
    }),
    z.object({
      kind: z.literal('formula'),
      formula: z.string().trim().min(1).max(500),
    }),
  ]);

export const createMetricSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).nullable().optional(),
  datasetId: z.string().uuid('A valid dataset id is required'),
  definition: metricDefinitionSchema,
  format: z.enum(METRIC_FORMATS).default('number'),
});

export const updateMetricSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().max(1000).nullable().optional(),
    definition: metricDefinitionSchema.optional(),
    format: z.enum(METRIC_FORMATS).optional(),
  })
  .strict();

const dashboardSchemaBase = {
  name: z.string().trim().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  layout: z.enum(['1', '2', '3']).default('2'),
};

export const createDashboardSchema = z.object(dashboardSchemaBase);

export const updateDashboardSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(1000).nullable().optional(),
    layout: z.enum(['1', '2', '3']).optional(),
  })
  .strict();

const widgetConfigurationSchema = z.record(z.unknown()).default({});

export const createWidgetSchema = z
  .object({
    type: z.enum(['kpi', 'table', 'bar', 'line', 'pie', 'scatter', 'area']),
    title: z.string().trim().min(1).max(200),
    analysisId: z.string().uuid('A valid analysis id is required').nullable().optional(),
    metricId: z.string().uuid('A valid metric id is required').nullable().optional(),
    configuration: widgetConfigurationSchema,
    position: z.coerce.number().int().min(0).default(0),
    size: z.enum(['full', 'half', 'third']).default('full'),
  })
  .refine(
    (widget) => (widget.analysisId !== undefined && widget.analysisId !== null) !== (widget.metricId !== undefined && widget.metricId !== null),
    { message: 'A widget must bind to exactly one source: an analysis or a metric' },
  );

export const updateWidgetSchema = z
  .object({
    type: z.enum(['kpi', 'table', 'bar', 'line', 'pie', 'scatter', 'area']).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    analysisId: z.string().uuid().nullable().optional(),
    metricId: z.string().uuid().nullable().optional(),
    configuration: widgetConfigurationSchema.optional(),
    position: z.coerce.number().int().min(0).optional(),
    size: z.enum(['full', 'half', 'third']).optional(),
  })
  .strict();

export const reorderWidgetsSchema = z.object({
  orderedIds: z.array(z.string().uuid()).max(100, 'Too many widgets'),
});

export const comparisonQuerySchema = z.object({
  datasetA: z.string().uuid('A valid dataset id is required'),
  datasetB: z.string().uuid('A valid dataset id is required'),
});

export const datamartMetricDatasetQuerySchema = z.object({
  datasetId: z.string().uuid('A valid dataset id is required').optional(),
});