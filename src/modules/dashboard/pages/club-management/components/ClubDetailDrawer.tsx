// components/ClubDetailDrawer.tsx

import { X, ImageIcon, Loader2 } from "lucide-react";
import type {
  ClubSummary,
  ClubDetail,
  ClubActivity,
  ClubStatus,
} from "../../my-club/services/myClubService";
import { formatDate } from "../../my-club/utils";

const detailTabs = [
  { id: "overview", label: "Tổng quan" },
  { id: "activities", label: "Hoạt động" },
] as const;

type DetailTab = (typeof detailTabs)[number]["id"];

const statusLabels: Record<ClubStatus, string> = {
  ACTIVE: "Hoạt động",
  PENDING: "Đang chờ duyệt",
  REJECTED: "Bị từ chối",
  INACTIVE: "Ngưng hoạt động",
  ARCHIVED: "Đã lưu trữ",
};

// --- Sub-Components ---
const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

interface DetailContentProps {
  tab: DetailTab;
  club: ClubDetail;
  activities: ClubActivity[];
}

const DetailContent = ({ tab, club, activities }: DetailContentProps) => {
  // 1. Tab Tổng quan
  if (tab === "overview") {
    return (
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <DetailItem label="Danh mục" value={club.category ?? "Chưa cập nhật"} />
        <DetailItem
          label="Trạng thái"
          value={statusLabels[club.status] ?? club.status}
        />
        <DetailItem
          label="Leader"
          value={club.leaderName ?? club.presidentName ?? "Chưa cập nhật"}
        />
        {/* <DetailItem label="Cố vấn" value={club.advisorName ?? 'Không áp dụng'} /> */}
        <DetailItem
          label="Số lượng thành viên"
          value={String(club.memberCount ?? 0)}
        />
        <DetailItem
          label="Ngày thành lập"
          value={formatDate(club.foundedDate)}
        />
        <DetailItem label="Sứ mệnh" value={club.mission ?? "Chưa cập nhật"} />
        <DetailItem
          label="Địa điểm sinh hoạt"
          value={club.meetingLocation ?? "Chưa cập nhật"}
        />
      </div>
    );
  }

  // 2. Tab Hoạt động
  if (tab === "activities") {
    return activities.length === 0 ? (
      <p className="py-6 text-sm text-slate-500 text-center">
        Không có hoạt động nào được ghi nhận.
      </p>
    ) : (
      <div className="mt-6 space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-xs text-slate-500 mt-1">
                    {activity.description}
                  </p>
                )}
              </div>
              <span className="text-xs font-semibold uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                {activity.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 border-t border-slate-50 pt-2">
              {activity.startDate && (
                <span>
                  Bắt đầu:{" "}
                  <strong className="text-slate-900">
                    {formatDate(activity.startDate)}
                  </strong>
                </span>
              )}
              {activity.endDate && (
                <span>
                  Kết thúc:{" "}
                  <strong className="text-slate-900">
                    {formatDate(activity.endDate)}
                  </strong>
                </span>
              )}
              {activity.location && (
                <span>
                  Địa điểm:{" "}
                  <strong className="text-slate-900">
                    {activity.location}
                  </strong>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

// --- Main Drawer Component ---
interface ClubDetailDrawerProps {
  clubSummary: ClubSummary;
  club: ClubDetail | null;
  activities: ClubActivity[];
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  isLoading: boolean;
  onClose: () => void;
}

export const ClubDetailDrawer = ({
  clubSummary,
  club,
  activities,
  activeTab,
  onTabChange,
  isLoading,
  onClose,
}: ClubDetailDrawerProps) => {
  const resolved = club ?? (clubSummary as ClubDetail);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40">
      <div className="h-full w-full max-w-4xl overflow-y-auto bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-400">
              Câu lạc bộ
            </p>
            <h3 className="text-xl font-semibold text-slate-900">
              {resolved.name}
            </h3>
            <p className="text-xs text-slate-500">
              Mã: #{resolved.code ?? "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 hover:text-orange-500 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Image View Only */}
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 h-64 relative w-full">
            {resolved.imageUrl ? (
              <img
                src={resolved.imageUrl}
                alt={resolved.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2">
                <ImageIcon className="h-8 w-8 text-orange-400 opacity-50" />
                <p className="text-sm font-semibold text-slate-500">
                  Chưa có ảnh bìa
                </p>
              </div>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {detailTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === t.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {isLoading ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Loader2 className="animate-spin h-6 w-6 text-orange-400" />
            </div>
          ) : (
            <DetailContent
              tab={activeTab}
              club={resolved}
              activities={activities}
            />
          )}
        </div>
      </div>
    </div>
  );
};
