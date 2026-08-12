import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button, Spinner } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { toApiError } from '../../../lib/api';
import {
  PlusIcon,
  GridIcon,
  TrashIcon,
} from '../../../components/ui/icons';
import {
  useCreateWidget,
  useDashboard,
  useDeleteDashboard,
  useDeleteWidget,
} from '../hooks/useDashboards';
import { useAnalyses } from '../hooks/useAnalyses';
import { useMetrics } from '../hooks/useMetrics';
import { WidgetRenderer } from '../components/WidgetRenderer';
import type {
  DataMartWidgetSize,
  DataMartWidgetType,
} from '../types';

const WIDGET_TYPES: { value: DataMartWidgetType; label: string }[] = [
  { value: 'kpi', label: 'KPI' },
  { value: 'table', label: 'Table' },
  { value: 'bar', label: 'Bar chart' },
  { value: 'line', label: 'Line chart' },
  { value: 'pie', label: 'Donut chart' },
  { value: 'scatter', label: 'Scatter plot' },
  { value: 'area', label: 'Area chart' },
];

const WIDGET_SIZES: { value: DataMartWidgetSize; label: string }[] = [
  { value: 'full', label: 'Full width' },
  { value: 'half', label: 'Half width' },
  { value: 'third', label: 'One third' },
];

export function DashboardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dashboardQuery = useDashboard(id);
  const analysesQuery = useAnalyses(1000);
  const metricsQuery = useMetrics();
  const createWidget = useCreateWidget(id);
  const deleteWidget = useDeleteWidget(id);
  const deleteDashboard = useDeleteDashboard();

  const [addOpen, setAddOpen] = useState(false);
  const [widgetType, setWidgetType] = useState<DataMartWidgetType>('bar');
  const [widgetSize, setWidgetSize] = useState<DataMartWidgetSize>('full');
  const [widgetTitle, setWidgetTitle] = useState('');
  const [sourceKind, setSourceKind] = useState<'analysis' | 'metric'>('analysis');
  const [analysisId, setAnalysisId] = useState('');
  const [metricId, setMetricId] = useState('');
  const [widgetXKey, setWidgetXKey] = useState('');
  const [widgetYKey, setWidgetYKey] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const dashboard = dashboardQuery.data;
  const widgets = useMemo(
    () =>
      dashboard
        ? [...dashboard.widgets].sort((a, b) => a.position - b.position)
        : [],
    [dashboard],
  );

  // Output columns of the selected saved analysis — dimensions and metric
  // aliases mirror the result columns returned by the query, so a widget can
  // pin which dimension (X) and metric (Y) it displays.
  const selectedAnalysis =
    analysesQuery.data?.items.find((analysis) => analysis.id === analysisId) ?? null;
  const analysisXOptions = useMemo(
    () => [...new Set((selectedAnalysis?.queryConfig.dimensions ?? []).map((dimension) => dimension.column))],
    [selectedAnalysis],
  );
  const analysisYOptions = useMemo(
    () => [...new Set((selectedAnalysis?.queryConfig.metrics ?? []).map((metric) => metric.alias))],
    [selectedAnalysis],
  );

  function openAdd() {
    setWidgetType('bar');
    setWidgetSize('full');
    setWidgetTitle('');
    setSourceKind('analysis');
    setAnalysisId('');
    setMetricId('');
    setWidgetXKey('');
    setWidgetYKey('');
    setAddOpen(true);
  }

  function buildWidgetConfiguration(): Record<string, unknown> {
    if (sourceKind === 'metric') {
      // A reusable metric always evaluates to a single `value` column.
      return widgetType === 'table' ? {} : { yKey: 'value', valueKey: 'value' };
    }
    const configuration: Record<string, unknown> = {};
    if (widgetType === 'kpi') {
      if (widgetYKey) configuration.valueKey = widgetYKey;
    } else {
      if (widgetXKey) configuration.xKey = widgetXKey;
      if (widgetYKey) configuration.yKey = widgetYKey;
    }
    return configuration;
  }

  async function handleAdd() {
    const source = sourceKind === 'analysis' ? analysisId : metricId;
    if (!source) return;
    try {
      await createWidget.mutateAsync({
        type: widgetType,
        title: widgetTitle.trim() || (widgetType === 'kpi' ? 'KPI' : 'Chart'),
        analysisId: sourceKind === 'analysis' ? source : null,
        metricId: sourceKind === 'metric' ? source : null,
        configuration: buildWidgetConfiguration(),
        position: widgets.length,
        size: widgetSize,
      });
      setAddOpen(false);
    } catch {
      // surfaced via createWidget.errorMessage
    }
  }

  async function handleDeleteWidget(widgetId: string) {
    setDeleteError(null);
    try {
      await deleteWidget.mutateAsync(widgetId);
    } catch (error) {
      setDeleteError(toApiError(error).message);
    }
  }

  async function handleDeleteDashboard() {
    if (!id) return;
    try {
      await deleteDashboard.mutateAsync(id);
      navigate('/datamart/dashboards');
    } catch {
      // surfaced via deleteDashboard.errorMessage
    }
  }

  if (dashboardQuery.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-24">
        <Spinner size="md" />
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboard) {
    return (
      <ErrorState message={toApiError(dashboardQuery.error).message} onRetry={() => dashboardQuery.refetch()} />
    );
  }

  const gridClass =
    dashboard.layout === '1'
      ? 'grid-cols-1'
      : dashboard.layout === '3'
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2';

  const colSpan: Record<DataMartWidgetSize, string> = {
    full: dashboard.layout === '1' ? '' : 'sm:col-span-2 lg:col-span-3',
    half: '',
    third: '',
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={dashboard.name}
        description={dashboard.description ?? `${dashboard.layout}-column layout · ${widgets.length} widget${widgets.length === 1 ? '' : 's'}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => void handleDeleteDashboard()}>
              <TrashIcon className="h-4 w-4" />
              Delete
            </Button>
            <Button variant="primary" onClick={openAdd}>
              <PlusIcon className="h-4 w-4" />
              Add widget
            </Button>
          </>
        }
      />

      {widgets.length === 0 ? (
        <EmptyState
          icon={GridIcon}
          title="This dashboard is empty"
          description="Add a widget bound to a saved analysis or a reusable metric."
          action={
            <Button onClick={openAdd}>
              <PlusIcon className="h-4 w-4" />
              Add widget
            </Button>
          }
        />
      ) : (
        <div className={clsx('grid gap-4', gridClass)}>
          {widgets.map((widget) => (
            <section
              key={widget.id}
              className={clsx(
                'flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5',
                colSpan[widget.size],
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="truncate text-sm font-semibold text-white">{widget.title}</h3>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                    {widget.type}
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete widget ${widget.title}`}
                    title="Delete widget"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-red-400/10 hover:text-red-300"
                    onClick={() => void handleDeleteWidget(widget.id)}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <WidgetRenderer widget={widget} />
            </section>
          ))}
        </div>
      )}

      {deleteError ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
          {deleteError}
        </p>
      ) : null}

      {deleteDashboard.error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
          {toApiError(deleteDashboard.error).message}
        </p>
      ) : null}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add widget"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={createWidget.isPending}
              disabled={
                sourceKind === 'analysis' ? !analysisId : !metricId
              }
              onClick={() => void handleAdd()}
            >
              Add
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            id="widget-title"
            label="Title"
            placeholder="e.g. Revenue by month"
            value={widgetTitle}
            onChange={(event) => setWidgetTitle(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              value={widgetType}
              onChange={(event) => setWidgetType(event.target.value as DataMartWidgetType)}
              options={WIDGET_TYPES}
            />
            <Select
              label="Size"
              value={widgetSize}
              onChange={(event) => setWidgetSize(event.target.value as DataMartWidgetSize)}
              options={WIDGET_SIZES}
            />
          </div>
          <Select
            label="Source"
            value={sourceKind}
            onChange={(event) => setSourceKind(event.target.value as 'analysis' | 'metric')}
            options={[
              { value: 'analysis', label: 'Saved analysis' },
              { value: 'metric', label: 'Reusable metric' },
            ]}
          />
          {sourceKind === 'analysis' ? (
            <Select
              label="Analysis"
              value={analysisId}
              onChange={(event) => {
                setAnalysisId(event.target.value);
                setWidgetXKey('');
                setWidgetYKey('');
              }}
              options={[
                { value: '', label: 'Select an analysis', disabled: true },
                ...(analysesQuery.data?.items ?? []).map((analysis) => ({
                  value: analysis.id,
                  label: analysis.name,
                })),
              ]}
            />
          ) : (
            <Select
              label="Metric"
              value={metricId}
              onChange={(event) => setMetricId(event.target.value)}
              options={[
                { value: '', label: 'Select a metric', disabled: true },
                ...(metricsQuery.data?.items ?? []).map((metric) => ({
                  value: metric.id,
                  label: metric.name,
                })),
              ]}
            />
          )}

          {sourceKind === 'analysis' && analysisId ? (
            widgetType === 'kpi' ? (
              <Select
                label="Metric to display"
                value={widgetYKey}
                onChange={(event) => setWidgetYKey(event.target.value)}
                options={[
                  { value: '', label: 'Auto (first value)', disabled: true },
                  ...analysisYOptions.map((name) => ({ value: name, label: name })),
                ]}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Dimension (X)"
                  value={widgetXKey}
                  onChange={(event) => setWidgetXKey(event.target.value)}
                  options={[
                    { value: '', label: 'Auto', disabled: true },
                    ...analysisXOptions.map((name) => ({ value: name, label: name })),
                  ]}
                />
                <Select
                  label="Metric (Y)"
                  value={widgetYKey}
                  onChange={(event) => setWidgetYKey(event.target.value)}
                  options={[
                    { value: '', label: 'Auto', disabled: true },
                    ...analysisYOptions.map((name) => ({ value: name, label: name })),
                  ]}
                />
              </div>
            )
          ) : null}
          {createWidget.error ? (
            <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3 py-2 text-sm text-red-300">
              {toApiError(createWidget.error).message}
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}