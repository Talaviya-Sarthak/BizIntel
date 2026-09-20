import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function FloatingCopilotBadge() {
  const { isAuthenticated } = useAuth();
  const targetHref = isAuthenticated ? '/ai-assistant' : '/signin';

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Link
        to={targetHref}
        aria-label="Open BizIntel AI Copilot"
        className="group relative flex items-center gap-2.5 rounded-full border border-white/[0.14] bg-[#0c0d12]/95 text-white shadow-2xl backdrop-blur-xl px-4 py-2 text-xs font-medium hover:border-[#d2f831]/50 hover:shadow-[0_0_28px_rgba(210,248,49,0.3)] transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer"
      >
        {/* Pulsating Live Status Indicator */}
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-emerald-400" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        </span>

        {/* Copilot Icon */}
        <div className="size-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
          <Sparkles className="size-3" />
        </div>

        {/* Text Wordmark & Tag */}
        <span className="font-mono text-xs font-bold tracking-tight text-white">
          BizIntel AI
        </span>

        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#d2f831] border border-lime-500/25">
          COPILOT
        </span>
      </Link>
    </div>
  );
}

export default FloatingCopilotBadge;
