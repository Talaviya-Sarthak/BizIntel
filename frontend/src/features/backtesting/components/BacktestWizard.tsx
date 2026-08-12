import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { StrategyCard } from './StrategyCard';
import { ParameterForm } from './ParameterForm';
import { useStrategies, useCreateBacktest } from '../hooks/useBacktest';
import { toApiError } from '../../../lib/api';
import type { CreateBacktestInput } from '../types';

const STEPS = [
  'Select Dataset',
  'Select Strategy',
  'Configure Parameters',
  'Capital & Costs',
  'Date Range',
  'Review & Run',
] as const;

interface WizardData {
  dataset_id: string;
  strategy_id: string;
  name: string;
  parameters: Record<string, number>;
  initial_capital: number;
  commission: number;
  slippage: number;
  start_date: string;
  end_date: string;
}

const INITIAL: WizardData = {
  dataset_id: '',
  strategy_id: '',
  name: '',
  parameters: {},
  initial_capital: 100000,
  commission: 0.001,
  slippage: 0.001,
  start_date: '',
  end_date: '',
};

export function BacktestWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: strategies, isLoading: loadingStrategies } = useStrategies();
  const createBacktest = useCreateBacktest();

  const selectedStrategy = useMemo(
    () => strategies?.find((s) => s.id === data.strategy_id),
    [strategies, data.strategy_id]
  );

  function updateField<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateParam(name: string, value: number) {
    setData((prev) => ({
      ...prev,
      parameters: { ...prev.parameters, [name]: value },
    }));
  }

  function validateCurrentStep(): boolean {
    const errs: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!data.dataset_id.trim()) errs.dataset_id = 'Dataset ID is required';
        if (!data.name.trim()) errs.name = 'Backtest name is required';
        break;
      case 1:
        if (!data.strategy_id) errs.strategy_id = 'Select a strategy';
        break;
      case 2:
        if (selectedStrategy) {
          for (const p of selectedStrategy.parameters) {
            const val = data.parameters[p.name] ?? p.default;
            if (val < p.min || val > p.max) {
              errs[p.name] = `${p.label} must be between ${p.min} and ${p.max}`;
            }
          }
        }
        break;
      case 3:
        if (data.initial_capital <= 0) errs.initial_capital = 'Must be greater than 0';
        if (data.commission < 0) errs.commission = 'Cannot be negative';
        if (data.slippage < 0) errs.slippage = 'Cannot be negative';
        break;
      case 4:
        if (data.start_date && data.end_date && data.start_date > data.end_date) {
          errs.end_date = 'End date must be after start date';
        }
        break;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateCurrentStep()) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    const input: CreateBacktestInput = {
      dataset_id: data.dataset_id.trim(),
      strategy_id: data.strategy_id,
      name: data.name.trim(),
      parameters: selectedStrategy
        ? Object.fromEntries(
            selectedStrategy.parameters.map((p) => [p.name, data.parameters[p.name] ?? p.default])
          )
        : {},
      initial_capital: data.initial_capital,
      commission: data.commission,
      slippage: data.slippage,
    };

    if (data.start_date) input.start_date = data.start_date;
    if (data.end_date) input.end_date = data.end_date;

    try {
      const result = await createBacktest.mutateAsync(input);
      navigate(`/backtesting/${result.id}`);
    } catch (error) {
      const apiError = toApiError(error);
      setErrors({ submit: apiError.message });
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    i < step
                      ? 'bg-cyan-400 text-slate-950'
                      : i === step
                        ? 'bg-cyan-400/20 text-cyan-300 ring-1 ring-cyan-400/30'
                        : 'bg-white/5 text-slate-500 ring-1 ring-white/10'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="mt-2 hidden text-[10px] text-slate-500 sm:block">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-[1px] w-6 sm:w-12 ${
                    i < step ? 'bg-cyan-400/40' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        {step === 0 && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-white">Backtest Details</h3>
            <Input
              id="backtest-name"
              label="Backtest Name"
              placeholder="e.g. SMA Crossover on AAPL"
              value={data.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={errors.name}
            />
            <Input
              id="dataset-id"
              label="Dataset ID"
              placeholder="Enter dataset identifier"
              value={data.dataset_id}
              onChange={(e) => updateField('dataset_id', e.target.value)}
              error={errors.dataset_id}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-white">Choose Strategy</h3>
            {loadingStrategies ? (
              <div className="py-12 text-center text-sm text-slate-500">Loading strategies...</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {strategies?.map((s) => (
                  <StrategyCard
                    key={s.id}
                    strategy={s}
                    selected={data.strategy_id === s.id}
                    onSelect={(id) => {
                      updateField('strategy_id', id);
                      const strat = strategies?.find((st) => st.id === id);
                      if (strat) {
                        const defaults = Object.fromEntries(
                          strat.parameters.map((p) => [p.name, p.default])
                        );
                        setData((prev) => ({ ...prev, parameters: defaults }));
                      }
                    }}
                  />
                ))}
              </div>
            )}
            {errors.strategy_id && (
              <p className="text-xs text-red-400">{errors.strategy_id}</p>
            )}
          </div>
        )}

        {step === 2 && selectedStrategy && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {selectedStrategy.name} Parameters
              </h3>
              <p className="mt-1 text-xs text-slate-400">{selectedStrategy.description}</p>
            </div>
            <ParameterForm
              parameters={selectedStrategy.parameters}
              values={data.parameters}
              onChange={updateParam}
              errors={errors}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-white">Capital & Transaction Costs</h3>
            <Input
              id="initial-capital"
              type="number"
              label="Initial Capital ($)"
              value={data.initial_capital}
              min={0}
              step={1000}
              onChange={(e) => updateField('initial_capital', parseFloat(e.target.value) || 0)}
              error={errors.initial_capital}
            />
            <Input
              id="commission"
              type="number"
              label="Commission Rate"
              value={data.commission}
              min={0}
              max={0.1}
              step={0.0001}
              onChange={(e) => updateField('commission', parseFloat(e.target.value) || 0)}
              error={errors.commission}
            />
            <p className="text-[11px] text-slate-500">Fraction of trade value (e.g. 0.001 = 0.1%)</p>
            <Input
              id="slippage"
              type="number"
              label="Slippage Rate"
              value={data.slippage}
              min={0}
              max={0.1}
              step={0.0001}
              onChange={(e) => updateField('slippage', parseFloat(e.target.value) || 0)}
              error={errors.slippage}
            />
            <p className="text-[11px] text-slate-500">Estimated slippage per trade (e.g. 0.001 = 0.1%)</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-white">Date Range</h3>
            <p className="text-xs text-slate-400">
              Leave blank to use the full dataset range.
            </p>
            <Input
              id="start-date"
              type="date"
              label="Start Date"
              value={data.start_date}
              onChange={(e) => updateField('start_date', e.target.value)}
              error={errors.start_date}
            />
            <Input
              id="end-date"
              type="date"
              label="End Date"
              value={data.end_date}
              onChange={(e) => updateField('end_date', e.target.value)}
              error={errors.end_date}
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-white">Review & Run</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryRow label="Name" value={data.name || '—'} />
              <SummaryRow label="Strategy" value={selectedStrategy?.name ?? '—'} />
              <SummaryRow label="Dataset" value={data.dataset_id || '—'} />
              <SummaryRow label="Initial Capital" value={`$${data.initial_capital.toLocaleString()}`} />
              <SummaryRow label="Commission" value={`${(data.commission * 100).toFixed(2)}%`} />
              <SummaryRow label="Slippage" value={`${(data.slippage * 100).toFixed(2)}%`} />
              <SummaryRow label="Start Date" value={data.start_date || 'Full range'} />
              <SummaryRow label="End Date" value={data.end_date || 'Full range'} />
            </div>

            {selectedStrategy && (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-400">Parameters</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedStrategy.parameters.map((p) => (
                    <SummaryRow
                      key={p.name}
                      label={p.label}
                      value={String(data.parameters[p.name] ?? p.default)}
                    />
                  ))}
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                <p className="text-xs text-red-400">{errors.submit}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={step === 0}
        >
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={createBacktest.isPending}
          >
            Run Backtest
          </Button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-2.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-medium text-white">{value}</span>
    </div>
  );
}
