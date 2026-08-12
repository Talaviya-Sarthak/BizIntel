import React from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Database,
  Sparkles,
  Layers,
  BarChart2,
  ShieldCheck,
  Server,
  Target,
} from "lucide-react";

export interface FeatureItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface FeaturesSectionWithHoverEffectsProps {
  features?: FeatureItem[];
}

const DEFAULT_FEATURES: FeatureItem[] = [
  {
    title: "Quantitative Strategy Backtesting",
    description:
      "Run historical strategy simulations with bias-aware execution and drawdown benchmark comparisons.",
    icon: <TrendingUp className="h-6 w-6 stroke-[1.75]" />,
  },
  {
    title: "DataMart SQL Analytics",
    description:
      "Transform raw transactional datasets into industrial-grade BI powered by DuckDB analytical processing.",
    icon: <Database className="h-6 w-6 stroke-[1.75]" />,
  },
  {
    title: "Retail AI Assistant",
    description:
      "Query enterprise datasets in natural language and receive dataset-aware, explainable recommendations.",
    icon: <Sparkles className="h-6 w-6 stroke-[1.75]" />,
  },
  {
    title: "Unified Intelligence Workspace",
    description:
      "Converge quantitative research, analytics, and AI into a single auditable interface without tool sprawl.",
    icon: <Layers className="h-6 w-6 stroke-[1.75]" />,
  },
  {
    title: "Interactive KPI Dashboards",
    description:
      "Explore key performance metrics and drill deep into multi-dimensional enterprise datasets live.",
    icon: <BarChart2 className="h-6 w-6 stroke-[1.75]" />,
  },
  {
    title: "Enterprise-Grade Security",
    description:
      "Protected by JWT authorization, HTTP-only cookies, bcrypt hashing, and strict schema validation.",
    icon: <ShieldCheck className="h-6 w-6 stroke-[1.75]" />,
  },
  {
    title: "Serverless Scalable Infrastructure",
    description:
      "Built on Neon Serverless PostgreSQL and versioned REST API architecture designed for high throughput.",
    icon: <Server className="h-6 w-6 stroke-[1.75]" />,
  },
  {
    title: "Evidence-Based Decision Support",
    description:
      "Ground executive and operational decisions in reproducible, auditable dataset evidence.",
    icon: <Target className="h-6 w-6 stroke-[1.75]" />,
  },
];

export function FeaturesSectionWithHoverEffects({
  features = DEFAULT_FEATURES,
}: FeaturesSectionWithHoverEffectsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-6 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-8 px-2 relative group/feature border-zinc-800/80 transition-colors duration-200",
        (index === 0 || index === 4) && "lg:border-l border-zinc-800/80",
        index < 4 && "lg:border-b border-zinc-800/80"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-t from-zinc-900/90 via-zinc-900/30 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-b from-zinc-900/90 via-zinc-900/30 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-8 text-zinc-400 group-hover/feature:text-cyan-400 transition-colors duration-200">
        {icon}
      </div>
      <div className="text-sm font-bold mb-2 relative z-10 px-8">
        <div className="absolute left-0 inset-y-0 h-5 group-hover/feature:h-7 w-1 rounded-tr-full rounded-br-full bg-zinc-800 group-hover/feature:bg-cyan-400 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-1.5 transition duration-200 inline-block text-zinc-100 font-semibold tracking-tight">
          {title}
        </span>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed max-w-xs relative z-10 px-8">
        {description}
      </p>
    </div>
  );
};
