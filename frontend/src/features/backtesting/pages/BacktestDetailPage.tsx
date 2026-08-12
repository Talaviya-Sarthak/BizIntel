import { useParams, useNavigate } from 'react-router-dom';
import { useBacktest } from '../hooks/useBacktest';
import { BacktestResultDashboard } from '../components/BacktestResultDashboard';
import { Button } from '../../../components/ui/Button';

export function BacktestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useBacktest(id ?? null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/backtesting')}>
            ← Back
          </Button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-sm text-slate-500">
          Loading backtest results...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/backtesting')}>
            ← Back
          </Button>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-12 text-center">
          <p className="text-sm text-red-400">Failed to load backtest results.</p>
          <p className="mt-2 text-xs text-slate-500">
            The backtest may have been deleted or you may not have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/backtesting')}>
          ← Back
        </Button>
      </div>

      <BacktestResultDashboard backtest={data.backtest} metrics={data.metrics} />
    </div>
  );
}
