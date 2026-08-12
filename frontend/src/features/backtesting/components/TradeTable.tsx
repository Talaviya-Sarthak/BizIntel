import { useState } from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import type { BacktestTrade } from '../types';

interface TradeTableProps {
  trades: BacktestTrade[];
  pageSize?: number;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TradeTable({ trades, pageSize = 20 }: TradeTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(trades.length / pageSize);
  const pageTrades = trades.slice(page * pageSize, (page + 1) * pageSize);

  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Trade Log
        </h3>
        <div className="py-12 text-center text-sm text-slate-500">No trades executed</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Trade Log
        </h3>
        <span className="text-[10px] text-slate-500">
          {trades.length} trade{trades.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10">
              <th className="pb-3 font-medium text-slate-500">Timestamp</th>
              <th className="pb-3 font-medium text-slate-500">Side</th>
              <th className="pb-3 text-right font-medium text-slate-500">Qty</th>
              <th className="pb-3 text-right font-medium text-slate-500">Price</th>
              <th className="pb-3 text-right font-medium text-slate-500">Exec Price</th>
              <th className="pb-3 text-right font-medium text-slate-500">Commission</th>
              <th className="pb-3 text-right font-medium text-slate-500">Slippage</th>
              <th className="pb-3 text-right font-medium text-slate-500">P&L</th>
            </tr>
          </thead>
          <tbody>
            {pageTrades.map((trade) => (
              <tr
                key={trade.id}
                className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
              >
                <td className="py-2.5 text-slate-300">
                  {format(new Date(trade.timestamp), 'MMM dd, HH:mm')}
                </td>
                <td className="py-2.5">
                  <span
                    className={clsx(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      trade.side === 'BUY'
                        ? 'bg-emerald-400/10 text-emerald-400'
                        : 'bg-red-400/10 text-red-400'
                    )}
                  >
                    {trade.side}
                  </span>
                </td>
                <td className="py-2.5 text-right text-white">{trade.quantity}</td>
                <td className="py-2.5 text-right text-white">{formatCurrency(trade.price)}</td>
                <td className="py-2.5 text-right text-white">{formatCurrency(trade.execution_price)}</td>
                <td className="py-2.5 text-right text-slate-400">{formatCurrency(trade.commission)}</td>
                <td className="py-2.5 text-right text-slate-400">{formatCurrency(trade.slippage_amount)}</td>
                <td
                  className={clsx(
                    'py-2.5 text-right font-medium',
                    trade.pnl === null
                      ? 'text-slate-500'
                      : trade.pnl > 0
                        ? 'text-emerald-400'
                        : trade.pnl < 0
                          ? 'text-red-400'
                          : 'text-slate-400'
                  )}
                >
                  {trade.pnl !== null ? formatCurrency(trade.pnl) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-[10px] text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
