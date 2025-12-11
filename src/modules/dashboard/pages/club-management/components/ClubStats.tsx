import { Users, AlertTriangle, type LucideIcon } from "lucide-react";
import type {
  ClubSummary,
  ClubStatus,
} from "../../my-club/services/myClubService";
import { useMemo } from "react";

interface SummaryCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
}

const SummaryCard = ({
  label,
  value,
  icon: Icon,
  accent,
}: SummaryCardProps) => (
  <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">
          {value ?? 0}
        </p>
      </div>
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}
      >
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </div>
);

interface ClubStatsProps {
  clubs: ClubSummary[];
}

export const ClubStats = ({ clubs }: ClubStatsProps) => {
  const stats = useMemo(() => {
    const result: Record<"total" | ClubStatus, number> = {
      total: clubs.length,
      ACTIVE: 0,
      PENDING: 0,
      REJECTED: 0,
      INACTIVE: 0,
      ARCHIVED: 0,
    };
    clubs.forEach((club) => {
      if (result[club.status] !== undefined) result[club.status] += 1;
    });
    return result;
  }, [clubs]);

  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        label="Tổng số CLB"
        value={stats.total}
        icon={Users}
        accent="bg-slate-900 text-white"
      />
      <SummaryCard
        label="Đang hoạt động"
        value={stats.ACTIVE}
        icon={Users}
        accent="bg-emerald-100 text-emerald-700"
      />
      <SummaryCard
        label="Đang chờ duyệt"
        value={stats.PENDING}
        icon={AlertTriangle}
        accent="bg-amber-100 text-amber-700"
      />
      <SummaryCard
        label="Bị từ chối"
        value={stats.REJECTED}
        icon={AlertTriangle}
        accent="bg-rose-100 text-rose-700"
      />
    </section>
  );
};
