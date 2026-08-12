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
    icon: <TrendingUp className="h-6 w-6 stroke-[2]" />,
  },
  {
    title: "DataMart SQL Analytics",
    description:
      "Transform raw transactional datasets into industrial-grade BI powered by DuckDB analytical processing.",
    icon: <Database className="h-6 w-6 stroke-[2]" />,
  },
  {
    title: "Retail AI Assistant",
    description:
      "Query enterprise datasets in natural language and receive dataset-aware, explainable recommendations.",
    icon: <Sparkles className="h-6 w-6 stroke-[2]" />,
  },
  {
    title: "Unified Intelligence Workspace",
    description:
      "Converge quantitative research, analytics, and AI into a single auditable interface without tool sprawl.",
    icon: <Layers className="h-6 w-6 stroke-[2]" />,
  },
  {
    title: "Interactive KPI Dashboards",
    description:
      "Explore key performance metrics and drill deep into multi-dimensional enterprise datasets live.",
    icon: <BarChart2 className="h-6 w-6 stroke-[2]" />,
  },
  {
    title: "Enterprise-Grade Security",
    description:
      "Protected by JWT authorization, HTTP-only cookies, bcrypt hashing, and strict schema validation.",
    icon: <ShieldCheck className="h-6 w-6 stroke-[2]" />,
  },
  {
    title: "Serverless Scalable Infrastructure",
    description:
      "Built on Neon Serverless PostgreSQL and versioned REST API architecture designed for high throughput.",
    icon: <Server className="h-6 w-6 stroke-[2]" />,
  },
  {
    title: "Evidence-Based Decision Support",
    description:
      "Ground executive and operational decisions in reproducible, auditable dataset evidence.",
    icon: <Target className="h-6 w-6 stroke-[2]" />,
  },
];

export function FeaturesSectionWithHoverEffects({
  features = DEFAULT_FEATURES,
}: FeaturesSectionWithHoverEffectsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 max-w-7xl mx-auto bg-black">
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
        "flex flex-col py-8 px-2 relative group/feature border-white/20 transition-all duration-200 bg-ink-card hover:bg-black",
        "border-b md:border-r",
        (index + 1) % 4 === 0 && "lg:border-r-0",
        index >= 4 && "border-b-0"
      )}
    >
      <div className="mb-4 relative z-10 px-8 text-white group-hover/feature:text-lime transition-colors duration-200">
        {icon}
      </div>
      <div className="text-sm font-bold mb-2 relative z-10 px-8">
        <div className="absolute left-0 inset-y-0 h-5 group-hover/feature:h-7 w-1 bg-white/20 group-hover/feature:bg-lime transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-1.5 transition-all duration-200 inline-block text-white font-bold uppercase tracking-wider text-xs">
          {title}
        </span>
      </div>
      <p className="text-xs text-muted leading-relaxed max-w-xs relative z-10 px-8">
        {description}
      </p>
    </div>
  );
};
