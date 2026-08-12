import { DashboardLayout } from '../../dashboard/components/DashboardLayout';
import { BacktestWizard } from '../components/BacktestWizard';

export function BacktestCreatePage() {
  return (
    <DashboardLayout activeNav="Backtesting">
      <div className="space-y-6">
        <div>
          <span className="section-label">Backtesting</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">Create Backtest</h2>
          <p className="mt-2 text-sm text-slate-400">
            Configure and run a historical strategy backtest.
          </p>
        </div>
        <BacktestWizard />
      </div>
    </DashboardLayout>
  );
}
