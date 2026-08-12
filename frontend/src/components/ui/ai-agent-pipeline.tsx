import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const messages = [
  'Received: "Analyze Q3 retail revenue & strategy performance..."',
  "Ingesting transactional data → Neon PostgreSQL persistence",
  "DuckDB analytics engine: 1.2M rows processed in 240ms",
  "Running strategy backtest: Look-ahead bias check PASSED",
  "Injecting schema context into Retail AI Assistant (1,204 tokens)",
  "LLM inference: 3 analytical tools dispatched in parallel",
  "Tool: datamart_query → 12 KPIs generated, 0 errors",
  "Tool: backtest_exec → CAGR +24.8%, Sharpe ratio 2.1",
  "Tool: ai_recommendation → Insight summary ready for console",
  "Workflow complete. PS-05 Enterprise Intelligence ready.",
];

function AnimatedDot({
  path,
  duration,
  delay,
  size,
  opacity,
}: {
  path: string;
  duration: number;
  delay: number;
  size: number;
  opacity: number;
}) {
  return (
    <circle r={size} fill="#06b6d4" opacity={opacity}>
      <animateMotion
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={path}
      />
    </circle>
  );
}

function PulsingDot({
  cx,
  cy,
  color,
  duration,
  delay = 0,
}: {
  cx: number;
  cy: number;
  color: string;
  duration: number;
  delay?: number;
}) {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={2.8}
      fill={color}
      animate={{ opacity: [0.15, 1, 0.15] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function StatusIndicator({
  cx,
  cy,
  color,
  pulsing = false,
  duration = 1.9,
  delay = 0,
}: {
  cx: number;
  cy: number;
  color: string;
  pulsing?: boolean;
  duration?: number;
  delay?: number;
}) {
  if (pulsing) {
    return (
      <motion.circle
        cx={cx}
        cy={cy}
        r={3}
        fill={color}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    );
  }
  return <circle cx={cx} cy={cy} r={3} fill={color} opacity={0.95} />;
}

export interface EnterpriseAIPipelineProps {
  className?: string;
}

export default function EnterpriseAIPipeline({ className }: EnterpriseAIPipelineProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2700);

    return () => {
      clearInterval(messageInterval);
    };
  }, []);

  const paths = {
    p1: "M116,88 L158,88",
    p2: "M268,88 L306,88",
    p3: "M411,88 C425,88 435,50 448,50",
    p4: "M411,88 L448,88",
    p5: "M411,88 C425,88 435,126 448,126",
  };

  return (
    <div className={cn("bg-zinc-950/90 border border-zinc-800/80 rounded-xl overflow-hidden font-sans w-full max-w-[620px] mx-auto shadow-2xl backdrop-blur-sm", className)}>
      {/* Header */}
      <div className="px-[18px] py-[11px] border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
        <div className="flex items-center gap-[7px]">
          <motion.span
            className="w-[6px] h-[6px] rounded-full bg-emerald-400 inline-block"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-[10px] text-zinc-400 tracking-[0.1em] font-mono font-semibold">
            BizIntel
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">
          3 services · 0 errors
        </span>
      </div>

      {/* SVG Pipeline Visualization */}
      <svg width="100%" viewBox="0 0 580 172" className="block">
        <defs>
          <marker
            id="ma"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path
              d="M2 1.5L7.5 5L2 8.5"
              fill="none"
              stroke="rgba(6,182,212,0.6)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        {/* Connection Paths */}
        <path
          d={paths.p1}
          fill="none"
          stroke="rgba(6,182,212,0.3)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
          markerEnd="url(#ma)"
        />
        <path
          d={paths.p2}
          fill="none"
          stroke="rgba(6,182,212,0.3)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
          markerEnd="url(#ma)"
        />
        <path
          d={paths.p3}
          fill="none"
          stroke="rgba(6,182,212,0.2)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />
        <path
          d={paths.p4}
          fill="none"
          stroke="rgba(6,182,212,0.2)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />
        <path
          d={paths.p5}
          fill="none"
          stroke="rgba(6,182,212,0.2)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />

        {/* Animated dots along paths */}
        <AnimatedDot path={paths.p1} duration={1.05} delay={0} size={2.5} opacity={1} />
        <AnimatedDot path={paths.p1} duration={1.05} delay={0.35} size={1.8} opacity={0.65} />
        <AnimatedDot path={paths.p1} duration={1.05} delay={0.7} size={1.3} opacity={0.35} />

        <AnimatedDot path={paths.p2} duration={0.88} delay={0.18} size={2.5} opacity={1} />
        <AnimatedDot path={paths.p2} duration={0.88} delay={0.62} size={1.8} opacity={0.65} />

        <AnimatedDot path={paths.p3} duration={1.3} delay={0.08} size={2.2} opacity={0.9} />
        <AnimatedDot path={paths.p3} duration={1.3} delay={0.65} size={1.5} opacity={0.55} />

        <AnimatedDot path={paths.p4} duration={1.15} delay={0.28} size={2.2} opacity={0.9} />
        <AnimatedDot path={paths.p4} duration={1.15} delay={0.85} size={1.5} opacity={0.55} />

        <AnimatedDot path={paths.p5} duration={1.4} delay={0.45} size={2.2} opacity={0.9} />
        <AnimatedDot path={paths.p5} duration={1.4} delay={1.0} size={1.5} opacity={0.55} />

        {/* Trigger Node */}
        <rect
          x="16"
          y="66"
          width="100"
          height="44"
          rx="8"
          fill="#141417"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.8"
        />
        <text
          x="66"
          y="83"
          textAnchor="middle"
          fontSize="9.5"
          fill="rgba(255,255,255,0.35)"
          fontFamily="system-ui"
          letterSpacing=".07em"
        >
          INPUT QUERY
        </text>
        <text
          x="66"
          y="100"
          textAnchor="middle"
          fontSize="11.5"
          fill="rgba(255,255,255,0.9)"
          fontFamily="system-ui"
          fontWeight="500"
        >
          User Trigger
        </text>

        {/* Vector DB / DuckDB Node */}
        <rect
          x="158"
          y="66"
          width="110"
          height="44"
          rx="8"
          fill="#141417"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.8"
        />
        <text
          x="213"
          y="83"
          textAnchor="middle"
          fontSize="9.5"
          fill="rgba(255,255,255,0.35)"
          fontFamily="system-ui"
          letterSpacing=".07em"
        >
          NEON + DUCKDB
        </text>
        <text
          x="213"
          y="100"
          textAnchor="middle"
          fontSize="11.5"
          fill="rgba(255,255,255,0.9)"
          fontFamily="system-ui"
          fontWeight="500"
        >
          Data Analytics
        </text>

        {/* LLM Agent Node */}
        <rect
          x="306"
          y="53"
          width="105"
          height="70"
          rx="10"
          fill="#09182a"
          stroke="#06b6d4"
          strokeWidth="1"
        />
        <rect x="318" y="53.5" width="80" height="1" rx="0.5" fill="rgba(6,182,212,0.6)" />
        <text
          x="358"
          y="78"
          textAnchor="middle"
          fontSize="9.5"
          fill="rgba(6,182,212,0.85)"
          fontFamily="system-ui"
          letterSpacing=".07em"
          fontWeight="600"
        >
          RETAIL AI AGENT
        </text>
        <text
          x="358"
          y="97"
          textAnchor="middle"
          fontSize="12.5"
          fill="#fff"
          fontFamily="system-ui"
          fontWeight="500"
        >
          Processing
        </text>
        <PulsingDot cx={346} cy={113} color="#06b6d4" duration={1.2} delay={0} />
        <PulsingDot cx={358} cy={113} color="#06b6d4" duration={1.2} delay={0.4} />
        <PulsingDot cx={370} cy={113} color="#06b6d4" duration={1.2} delay={0.8} />

        {/* Output Nodes */}
        <rect
          x="448"
          y="35"
          width="116"
          height="30"
          rx="7"
          fill="#141417"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.8"
        />
        <text
          x="490"
          y="53.5"
          textAnchor="middle"
          fontSize="10.5"
          fill="rgba(255,255,255,0.8)"
          fontFamily="system-ui"
        >
          Backtest KPI
        </text>
        <StatusIndicator cx={550} cy={43} color="#22c55e" />

        <rect
          x="448"
          y="73"
          width="116"
          height="30"
          rx="7"
          fill="#141417"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.8"
        />
        <text
          x="490"
          y="91.5"
          textAnchor="middle"
          fontSize="10.5"
          fill="rgba(255,255,255,0.8)"
          fontFamily="system-ui"
        >
          DataMart SQL
        </text>
        <StatusIndicator cx={550} cy={81} color="#f59e0b" pulsing duration={1.9} />

        <rect
          x="448"
          y="111"
          width="116"
          height="30"
          rx="7"
          fill="#141417"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.8"
        />
        <text
          x="490"
          y="129.5"
          textAnchor="middle"
          fontSize="10.5"
          fill="rgba(255,255,255,0.8)"
          fontFamily="system-ui"
        >
          AI Insights
        </text>
        <StatusIndicator cx={550} cy={119} color="#f59e0b" pulsing duration={2.2} delay={0.35} />
      </svg>

      {/* Message Display */}
      <div className="border-t border-zinc-800/80 px-[18px] py-[9px] h-[52px] bg-zinc-950/60">
        <div className="flex gap-2 items-start h-full">
          <span className="text-cyan-400/80 font-mono text-[13px] leading-[1.5] shrink-0 font-bold">
            ›
          </span>
          <div className="relative flex-1 overflow-hidden h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={messageIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="font-mono text-[11px] text-zinc-300 leading-[1.55] absolute inset-0"
              >
                {messages[messageIndex]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export { EnterpriseAIPipeline as AIPipeline };
