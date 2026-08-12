import { clsx } from 'clsx';
import { Button } from '../../../components/ui/Button';
import { formatNumber } from '../../../utils/format';
import type { TradeRecord } from '../types';
import { formatCurrency, formatShortDate } from '../utils/formatting';

const PAGE_SIZE = 50;

interface TradeTableProps {
  trades: TradeRecord[];
  total: number;
  offset: number;
  onPageChange: (offset: number) => void;
}

/** Paginated executed-order table with realized P&L highlighting. */
export function TradeTable({ trades, total, offset, onPageChange }: TradeTableProps) {
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center text-sm text-slate-500">
        No trades were executed — the strategy never entered a position in this period.
      </div>
    );
  }

  function goToPage(nextOffset: number) {
    if (nextOffset < 0) nextOffset = 0;
    const maxOffset = Math.max(0, total - PAGE_SIZE);
    if (nextOffset > maxOffset) nextOffset = maxOffset;
    onPageChange(nextOffset);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Commission</th>
              <th className="px-4 py-3 text-right font-medium">Slippage</th>
              <th className="px-4 py-3 text-right font-medium">P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id ?? `${trade.timestamp}-${trade.side}-${trade.quantity}`} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-slate-300">{formatShortDate(trade.timestamp)}</td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                      trade.side === 'BUY' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300',
                    )}
                  >
                    {trade.side}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-200">
                  {formatNumber(trade.quantity)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-200">
                  {trade.price.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-400">{formatCurrency(trade.commission)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-400">{formatCurrency(trade.slippageCost)}</td>
                <td
                  className={clsx(
                    'px-4 py-3 text-right font-semibold tabular-nums',
                    trade.pnl === null ? 'text-slate-500' : trade.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300',
                  )}
                >
                  {trade.pnl === null ? '—' : formatCurrency(trade.pnl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <p className="text-xs text-slate-500">
            {formatNumber(total)} trades · page {formatNumber(page)} of {formatNumber(totalPages)}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => goToPage(offset - PAGE_SIZE)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => goToPage(offset + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
