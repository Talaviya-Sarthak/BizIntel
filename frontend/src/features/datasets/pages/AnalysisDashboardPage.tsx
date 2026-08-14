import { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Spinner } from '../../../components/ui/Button';
import { useDataset, useDeleteDataset } from '../hooks/useDatasets';
import {
  useDatasetOverview,
  useDatasetQuality,
  useDatasetAnalyticsColumns,
  useCorrelation,
  useFullStatistics,
  useMissingValueAnalysis,
  useOutlierAnalysis,
  useBusinessInsights,
  useAISummary,
} from '../hooks/useDatasetAnalytics';
import { DatasetHeader } from '../components/workspace/DatasetHeader';
import { AnalysisSidebar } from '../components/analysis/AnalysisSidebar';
import type { AnalysisSection } from '../components/analysis/AnalysisSidebar';
import { DatasetOverviewSection } from '../components/analysis/DatasetOverviewSection';
import { ChartsSection } from '../components/analysis/ChartsSection';
import { StatisticalAnalysisSection } from '../components/analysis/StatisticalAnalysisSection';
import { MissingValuesSection } from '../components/analysis/MissingValuesSection';
import { OutlierSection } from '../components/analysis/OutlierSection';
import { CorrelationSection } from '../components/analysis/CorrelationSection';
import { CategoricalInsightsSection } from '../components/analysis/CategoricalInsightsSection';
import { DataQualityScoreSection } from '../components/analysis/DataQualityScoreSection';
import { BusinessInsightsSection } from '../components/analysis/BusinessInsightsSection';
import { AISummarySection } from '../components/analysis/AISummarySection';
import { ExportPanel } from '../components/analysis/ExportPanel';
import { toApiError } from '../../../lib/api';
import { DeleteDatasetDialog } from '../components/DeleteDatasetDialog';

export function AnalysisDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chartRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const datasetQuery = useDataset(id);
  const columnsQuery = useDatasetAnalyticsColumns(id);
  const deleteMutation = useDeleteDataset();

  const [activeSection, setActiveSection] = useState<AnalysisSection>('overview');
  const [showDelete, setShowDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Data queries
  const overviewQuery = useDatasetOverview(id);
  const qualityQuery = useDatasetQuality(id);
  const fullStatsQuery = useFullStatistics(id);
  const missingQuery = useMissingValueAnalysis(id);
  const outlierQuery = useOutlierAnalysis(id);
  const businessQuery = useBusinessInsights(id);
  const aiSummaryQuery = useAISummary(id);

  const columns = columnsQuery.data?.columns ?? [];
  const numericColumns = useMemo(
    () => columns.filter((c) => c.category === 'integer' || c.category === 'float' || c.category === 'decimal'),
    [columns],
  );
  const categoricalColumns = useMemo(
    () => columns.filter((c) => c.category === 'string' || c.category === 'uuid' || c.category === 'boolean'),
    [columns],
  );
  const dateColumns = useMemo(
    () => columns.filter((c) => c.category === 'date' || c.category === 'time' || c.category === 'datetime'),
    [columns],
  );

  const correlationQuery = useCorrelation(
    id,
    numericColumns.length >= 2
      ? { columns: numericColumns.slice(0, 12).map((c) => c.name) }
      : undefined,
  );

  async function handleDelete() {
    if (!id) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/datasets');
    } catch (error) {
      setDeleteError(toApiError(error).message);
    }
  }

  function handleRefresh() {
    if (id) {
      void queryClient.invalidateQueries({ queryKey: ['dataset', id, 'analytics'] });
    }
  }

  function handleRegisterChartRef(key: string, el: HTMLDivElement | null) {
    if (el) chartRefs.current.set(key, el);
    else chartRefs.current.delete(key);
  }

  if (datasetQuery.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-24">
        <Spinner size="md" />
      </div>
    );
  }

  if (datasetQuery.isError || !datasetQuery.data) {
    return (
      <ErrorState
        message={toApiError(datasetQuery.error).message}
        onRetry={() => datasetQuery.refetch()}
      />
    );
  }

  const dataset = datasetQuery.data.dataset;
  const isReady = dataset.status === 'READY';
  const isFailed = dataset.status === 'FAILED';

  return (
    <div className="flex flex-col gap-6">
      <DatasetHeader
        dataset={dataset}
        columnsCount={columnsQuery.data?.total ?? dataset.columnCount ?? undefined}
        refreshing={false}
        onRefresh={handleRefresh}
        downloading={false}
        onDownload={() => {}}
        onDelete={() => {
          setDeleteError(null);
          setShowDelete(true);
        }}
      />

      {isFailed && dataset.errorMessage ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-5">
          <p className="mt-0.5 text-sm font-medium text-red-300">Dataset could not be processed.</p>
          <p className="mt-1 text-sm leading-relaxed text-red-200/70">{dataset.errorMessage}</p>
        </div>
      ) : null}

      {isReady ? (
        <div className="flex gap-6 items-start">
          {/* Sidebar Navigation */}
          <AnalysisSidebar
            activeSection={activeSection}
            onChange={setActiveSection}
            columns={columns}
            numericColumns={numericColumns}
            categoricalColumns={categoricalColumns}
            dateColumns={dateColumns}
          />

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            {activeSection === 'overview' && (
              <DatasetOverviewSection
                datasetId={dataset.id}
                dataset={dataset}
                overview={overviewQuery.data}
                quality={qualityQuery.data}
                columns={columns}
                loading={overviewQuery.isLoading || qualityQuery.isLoading}
                error={overviewQuery.error?.message ?? qualityQuery.error?.message}
                onRetry={() => {
                  overviewQuery.refetch();
                  qualityQuery.refetch();
                }}
              />
            )}

            {activeSection === 'charts' && (
              <ChartsSection
                datasetId={dataset.id}
                numericColumns={numericColumns}
                categoricalColumns={categoricalColumns}
                dateColumns={dateColumns}
                correlation={correlationQuery.data}
                onRegisterRef={handleRegisterChartRef}
              />
            )}

            {activeSection === 'statistics' && (
              <StatisticalAnalysisSection
                datasetId={dataset.id}
                statistics={fullStatsQuery.data?.statistics}
                loading={fullStatsQuery.isLoading}
                error={fullStatsQuery.error?.message}
                onRetry={() => fullStatsQuery.refetch()}
              />
            )}

            {activeSection === 'missing' && (
              <MissingValuesSection
                datasetId={dataset.id}
                data={missingQuery.data}
                loading={missingQuery.isLoading}
                error={missingQuery.error?.message}
                onRetry={() => missingQuery.refetch()}
              />
            )}

            {activeSection === 'outliers' && (
              <OutlierSection
                datasetId={dataset.id}
                data={outlierQuery.data}
                loading={outlierQuery.isLoading}
                error={outlierQuery.error?.message}
                onRetry={() => outlierQuery.refetch()}
              />
            )}

            {activeSection === 'correlation' && (
              <CorrelationSection
                datasetId={dataset.id}
                correlation={correlationQuery.data}
                loading={correlationQuery.isLoading}
                error={correlationQuery.error?.message}
                onRetry={() => correlationQuery.refetch()}
              />
            )}

            {activeSection === 'categorical' && (
              <CategoricalInsightsSection
                datasetId={dataset.id}
                columns={categoricalColumns}
              />
            )}

            {activeSection === 'quality' && (
              <DataQualityScoreSection
                datasetId={dataset.id}
                quality={qualityQuery.data}
                loading={qualityQuery.isLoading}
                error={qualityQuery.error?.message}
                onRetry={() => qualityQuery.refetch()}
              />
            )}

            {activeSection === 'business' && (
              <BusinessInsightsSection
                datasetId={dataset.id}
                data={businessQuery.data}
                loading={businessQuery.isLoading}
                error={businessQuery.error?.message}
                onRetry={() => businessQuery.refetch()}
              />
            )}

            {activeSection === 'ai-summary' && (
              <AISummarySection
                datasetId={dataset.id}
                data={aiSummaryQuery.data}
                loading={aiSummaryQuery.isLoading}
                error={aiSummaryQuery.error?.message}
                onRetry={() => aiSummaryQuery.refetch()}
              />
            )}

            {activeSection === 'export' && (
              <ExportPanel
                datasetId={dataset.id}
                dataset={dataset}
                overview={overviewQuery.data}
                quality={qualityQuery.data}
                statistics={fullStatsQuery.data?.statistics}
                chartRefs={chartRefs.current}
              />
            )}
          </main>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          {isFailed ? (
            <p className="text-sm text-slate-400">
              The analysis dashboard is unavailable because the dataset failed to process.
            </p>
          ) : (
            <p className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Spinner size="sm" />
              This dataset is still being processed. Refresh shortly.
            </p>
          )}
        </div>
      )}

      {deleteError ? (
        <p className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
          {deleteError}
        </p>
      ) : null}

      <DeleteDatasetDialog
        open={showDelete}
        dataset={dataset}
        deleting={deleteMutation.isPending}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
