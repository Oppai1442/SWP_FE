interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const SummaryCard = ({ label, value, icon: Icon, accent }: SummaryCardProps) => (
  <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value ?? 0}</p>
      </div>
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </div>
);

export default SummaryCard;
