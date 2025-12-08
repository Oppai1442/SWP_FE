import { AlertTriangle, Calendar, CheckCircle2, Layers } from 'lucide-react';
import SummaryCard from './SummaryCard';

export interface ClubStats {
  totalClubs: number;
  activeClubs: number;
  pendingRequests: number;
  rejectedRequests: number;
}

interface StatsOverviewSectionProps {
  stats: ClubStats;
}

const StatsOverviewSection = ({ stats }: StatsOverviewSectionProps) => (
  <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <SummaryCard label="Tổng số câu lạc bộ" value={stats.totalClubs} icon={Layers} accent="bg-slate-900 text-white" />
    <SummaryCard
      label="Câu lạc bộ đang hoạt động"
      value={stats.activeClubs}
      icon={CheckCircle2}
      accent="bg-emerald-100 text-emerald-700"
    />
    <SummaryCard
      label="Yêu cầu đang chờ"
      value={stats.pendingRequests}
      icon={Calendar}
      accent="bg-amber-100 text-amber-700"
    />
    <SummaryCard
      label="Yêu cầu bị từ chối"
      value={stats.rejectedRequests}
      icon={AlertTriangle}
      accent="bg-rose-100 text-rose-700"
    />
  </section>
);

export default StatsOverviewSection;
