interface FeaturesSectionProps {
  title: string;
  description: string;
}

export function FeaturesSection({ title, description }: FeaturesSectionProps) {
  return (
    <div className="rounded-none border border-white bg-zinc-950 p-6 hover:border-zinc-800 transition-colors">
      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 line-height-relaxed">{description}</p>
    </div>
  );
}