import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { Button, Spinner } from '../../../components/ui/Button';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useDatasets } from '../../datasets/hooks/useDatasets';
import { toApiError } from '../../../lib/api';
import { CheckCircleIcon, ChevronRightIcon, PlayIcon, XCircleIcon } from '../../../components/ui/icons';
import { useCompatibility, useCreateBacktest, useDatasetDateRange, useStrategies } from '../hooks/useBacktesting';
import { ParameterFields } from '../components/ParameterFields';
import { BacktestErrorPanel } from '../components/BacktestErrorPanel';
import type { StrategyMetadata } from '../types';

const STEPS = ['Dataset', 'Strategy', 'Parameters', 'Execution', 'Date range', 'Review & run'];

export function NewBacktestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDataset = searchParams.get('dataset') ?? undefined;

  const datasetsQuery = useDatasets();
  const strategiesQuery = useStrategies();
  const createMutation = useCreateBacktest();

  const [step, setStep] = useState(0);
  const [datasetId, setDatasetId] = useState<string | undefined>(preselectedDataset);
  const [strategyId, setStrategyId] = useState<string | undefined>();
  const [parameters, setParameters] = useState<Record<string, number | boolean>>({});
  const [capital, setCapital] = useState('10000');
  const [commissionPct, setCommissionPct] = useState('0');
  const [slippagePct, setSlippagePct] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [name, setName] = useState('');

  const readyDatasets = useMemo(
    () => (datasetsQuery.data?.datasets ?? []).filter((dataset) => dataset.status === 'READY'),
    [datasetsQuery.data],
  );
  const compatibility = useCompatibility(datasetId);
  const dateRangeQuery = useDatasetDateRange(datasetId);
  const strategy = useMemo(
    () => strategiesQuery.data?.find((entry) => entry.id === strategyId),
    [strategiesQuery.data, strategyId],
  );

  useEffect(() => {
    if (strategy) {
      setParameters({ ...strategy.defaults });
    }
  }, [strategy]);

  useEffect(() => {
    setStartDate('');
    setEndDate('');
  }, [datasetId]);

  function selectStrategy(next: StrategyMetadata) {
    setStrategyId(next.id);
    setParameters({ ...next.defaults });
  }

  const numericCapital = Number(capital || 0);
  const numericCommission = Number(commissionPct) / 100;
  const numericSlippage = Number(slippagePct) / 100;

  const availableStart = dateRangeQuery.data?.startDate?.slice(0, 10);
  const availableEnd = dateRangeQuery.data?.endDate?.slice(0, 10);
  const startOutOfRange = Boolean(startDate && availableStart && startDate < availableStart);
  const endOutOfRange = Boolean(endDate && availableEnd && endDate > availableEnd);

  const datasetStepValid = Boolean(datasetId) && compatibility.data?.compatible === true;
  const executionStepValid =
    Number.isFinite(numericCapital) &&
    numericCapital >= 100 &&
    Number.isFinite(numericCommission) &&
    numericCommission >= 0 &&
    numericCommission <= 0.05 &&
    Number.isFinite(numericSlippage) &&
    numericSlippage >= 0 &&
    numericSlippage <= 0.05;
  const dateStepValid =
    (!startDate || !endDate || new Date(endDate) >= new Date(startDate)) &&
    !startOutOfRange &&
    !endOutOfRange;

  function canContinue(): boolean {
    if (step === 0) return Boolean(datasetStepValid);
    if (step === 1) return Boolean(strategyId);
    if (step === 2) return true;
    if (step === 3) return executionStepValid;
    if (step === 4) return dateStepValid;
    return false;
  }

  async function handleRun() {
    if (!datasetId || !strategy) return;
    try {
      const summary = await createMutation.mutateAsync({
        datasetId,
        strategyId: strategy.id,
        parameters,
        initialCapital: numericCapital,
        commission: numericCommission,
        slippage: numericSlippage,
        startDate: startDate || null,
        endDate: endDate || null,
        name: name.trim() || undefined,
      });
      navigate(`/backtesting/${summary.id}`);
    } catch {
      // error surfaced via createMutation.errorMessage
    }
  }

  if (datasetsQuery.isLoading || strategiesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#181818] py-20">
        <Spinner size="md" />
      </div>
    );
  }

  if (datasetsQuery.isError || strategiesQuery.isError) {
    return (
      <ErrorState
        message={datasetsQuery.error ? toApiError(datasetsQuery.error).message : toApiError(strategiesQuery.error).message}
        onRetry={() => {
          void datasetsQuery.refetch();
          void strategiesQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-white/[0.06] pb-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">New Backtest Strategy Run</h1>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          Configure a strategy run against a dataset&apos;s OHLCV columns. Signals execute at the
          next bar&apos;s open with commission and slippage applied.
        </p>
      </div>

      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-2">
        {STEPS.map((label, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(index)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                  active
                    ? 'border-white/40 bg-zinc-800 text-white shadow-xs'
                    : done
                      ? 'border-white/[0.06] bg-[#161616] text-zinc-300 hover:border-white/20'
                      : 'border-white/[0.04] text-zinc-500',
                )}
              >
                {done ? <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-400" /> : null}
                <span>
                  <span className="mr-1 text-zinc-500">{index + 1}.</span>
                  {label}
                </span>
              </button>
              {index < STEPS.length - 1 ? <span className="h-px w-3 bg-white/[0.06]" /> : null}
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border border-white/[0.06] bg-[#181818] p-5 sm:p-6 shadow-sm">
        {step === 0 ? (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Choose a dataset</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                The dataset must contain OHLCV columns (date, open, high, low, close). Only ready
                datasets can be backtested.
              </p>
            </div>
            {readyDatasets.length === 0 ? (
              <p className="text-xs text-zinc-400">
                No ready datasets available yet. <span className="text-zinc-200 underline">Upload a CSV</span> first.
              </p>
            ) : (
              <Select
                label="Dataset"
                value={datasetId ?? ''}
                onChange={(event) => setDatasetId(event.target.value || undefined)}
                options={[
                  { value: '', label: 'Select a dataset', disabled: true },
                  ...readyDatasets.map((dataset) => ({
                    value: dataset.id,
                    label: `${dataset.name} · ${dataset.rowCount?.toLocaleString() ?? '?'} rows`,
                  })),
                ]}
              />
            )}
            {datasetId ? (
              compatibility.isLoading ? (
                <p className="text-xs text-zinc-400">Checking market-data compatibility…</p>
              ) : compatibility.isError ? (
                <ErrorState message={toApiError(compatibility.error).message} onRetry={() => compatibility.refetch()} />
              ) : compatibility.data && !compatibility.data.compatible ? (
                <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4">
                  <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div>
                    <p className="text-xs font-semibold text-red-300">Dataset is not market data</p>
                    <ul className="mt-1 list-inside list-disc text-xs text-red-200/70">
                      {compatibility.data.issues.slice(0, 4).map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-xs text-emerald-300">
                  <CheckCircleIcon className="h-4 w-4 shrink-0" />
                  OHLCV columns detected
                  {compatibility.data?.volumeColumn ? ' (with volume)' : ''}.
                </div>
              )
            ) : null}
          </section>
        ) : null}

        {step === 1 ? (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Choose a strategy</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Each strategy is deterministic and long-only. Signals execute at the next bar open.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {(strategiesQuery.data ?? []).map((entry) => {
                const selected = strategyId === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => selectStrategy(entry)}
                    className={clsx(
                      'flex flex-col gap-2 rounded-xl border p-4 text-left transition-all',
                      selected
                        ? 'border-white/40 bg-zinc-800 text-white shadow-xs'
                        : 'border-white/[0.06] bg-[#141414] hover:border-white/20 text-zinc-300',
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-100">{entry.name}</span>
                      {selected ? <CheckCircleIcon className="h-4 w-4 text-white" /> : null}
                    </span>
                    <span className="text-[11px] leading-relaxed text-zinc-400">{entry.description}</span>
                    <span className="mt-auto text-[10px] uppercase font-semibold tracking-wider text-zinc-400">
                      {entry.parameters.length} parameter{entry.parameters.length === 1 ? '' : 's'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Strategy parameters</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Tune {strategy?.name} for this run. Defaults are pre-filled.
              </p>
            </div>
            {strategy ? (
              <ParameterFields
                parameters={strategy.parameters}
                values={parameters}
                onChange={(field, value) => setParameters((current) => ({ ...current, [field]: value }))}
              />
            ) : null}
            <p className="rounded-lg border border-white/[0.06] bg-zinc-900 px-4 py-3 text-xs leading-relaxed text-zinc-400">
              {strategy?.executionModel}
            </p>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Execution settings</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Capital is deployed in whole shares. Commission and slippage are applied on every fill.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                id="capital"
                label="Initial capital (USD)"
                type="number"
                min={100}
                step={100}
                value={capital}
                onChange={(event) => setCapital(event.target.value)}
                error={
                  capital && Number(capital) < 100 ? 'Minimum capital is $100' : undefined
                }
              />
              <Input
                id="commission"
                label="Commission (%)"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={commissionPct}
                onChange={(event) => setCommissionPct(event.target.value)}
                error={
                  commissionPct &&
                  (Number(commissionPct) < 0 || Number(commissionPct) > 5)
                    ? 'Commission must be 0–5%'
                    : undefined
                }
              />
              <Input
                id="slippage"
                label="Slippage (%)"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={slippagePct}
                onChange={(event) => setSlippagePct(event.target.value)}
                error={
                  slippagePct &&
                  (Number(slippagePct) < 0 || Number(slippagePct) > 5)
                    ? 'Slippage must be 0–5%'
                    : undefined
                }
              />
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Date range (optional)</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Leave both empty to run over the entire dataset history.
              </p>
            </div>
            {dateRangeQuery.isLoading ? (
              <p className="text-xs text-zinc-400">Checking available date range…</p>
            ) : dateRangeQuery.isError ? (
              <p className="text-xs text-red-300">{toApiError(dateRangeQuery.error).message}</p>
            ) : availableStart && availableEnd ? (
              <p className="text-xs text-zinc-400 font-mono">
                {dateRangeQuery.data?.dateColumn} spans{' '}
                <span className="font-semibold text-zinc-200">{availableStart}</span> →{' '}
                <span className="font-semibold text-zinc-200">{availableEnd}</span> (
                {dateRangeQuery.data?.totalRows.toLocaleString() ?? '?'} rows).
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="start-date"
                label="Start date"
                type="date"
                value={startDate}
                min={availableStart || undefined}
                max={endDate || availableEnd || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
              <Input
                id="end-date"
                label="End date"
                type="date"
                value={endDate}
                min={startDate || availableStart || undefined}
                max={availableEnd || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
            {!dateStepValid ? (
              <p className="text-xs text-red-300">
                {endDate && startDate && new Date(endDate) < new Date(startDate)
                  ? 'End date must be after the start date.'
                  : startOutOfRange
                    ? `Start date must be on or after ${availableStart}.`
                    : endOutOfRange
                      ? `End date must be on or before ${availableEnd}.`
                      : 'The selected date range is outside the dataset.'}
              </p>
            ) : null}
          </section>
        ) : null}

        {step === 5 ? (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Review & run</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Verify the configuration before executing your backtest run.
              </p>
            </div>

            <Input
              id="name"
              label="Name (optional)"
              placeholder={strategy ? `${strategy.name} backtest` : undefined}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <dl className="grid gap-x-6 gap-y-2 rounded-xl border border-white/[0.06] bg-zinc-900 p-4 text-xs sm:grid-cols-2">
              <ReviewItem label="Dataset" value={datasetsQuery.data?.datasets.find((d) => d.id === datasetId)?.name ?? '—'} />
              <ReviewItem label="Strategy" value={strategy?.name ?? '—'} />
              <ReviewItem label="Initial capital" value={capital || '—'} />
              <ReviewItem label="Commission" value={`${commissionPct || '0'}%`} />
              <ReviewItem label="Slippage" value={`${slippagePct || '0'}%`} />
              <ReviewItem
                label="Date range"
                value={startDate || endDate ? `${startDate || 'start'} → ${endDate || 'end'}` : 'Full history'}
              />
              {strategy
                ? strategy.parameters.map((def) => (
                    <ReviewItem key={def.name} label={def.label} value={String(parameters[def.name] ?? def.default)} />
                  ))
                : null}
            </dl>

            {createMutation.isError ? (
              <BacktestErrorPanel error={createMutation.error} />
            ) : null}
          </section>
        ) : null}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            className="text-zinc-400 hover:text-white"
          >
            <ChevronRightIcon className="h-3.5 w-3.5 rotate-180" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button variant="primary" disabled={!canContinue()} onClick={() => setStep((current) => current + 1)} className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs">
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              loading={createMutation.isPending}
              disabled={!datasetId || !strategy}
              onClick={() => void handleRun()}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              {createMutation.isPending ? 'Running backtest…' : 'Run backtest'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 border-b border-white/[0.03]">
      <dt className="text-[10.5px] uppercase font-semibold tracking-wider text-zinc-400">{label}</dt>
      <dd className="text-right font-semibold text-zinc-200 font-mono">{value}</dd>
    </div>
  );
}
