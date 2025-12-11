import {
  CalendarDays,
  Clock3,
  Image as ImageIcon,
  MapPin,
  Users,
  Banknote,
  ChevronRight,
  PartyPopper,
} from "lucide-react";
import {
  type ClubSummary,
  // type ClubStatus,
  type ClubJoinRequestStatus,
} from "../../my-club/services/myClubService";

// --- Helpers ---
const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: "T2",
  TUESDAY: "T3",
  WEDNESDAY: "T4",
  THURSDAY: "T5",
  FRIDAY: "T6",
  SATURDAY: "T7",
  SUNDAY: "CN",
};

const formatOperatingDays = (days?: string[] | null) => {
  if (!days || days.length === 0) return null;
  if (days.length === 7) return "Cả tuần";
  return days.map((day) => WEEKDAY_LABELS[day] ?? day).join(", ");
};

const formatMoney = (amount?: number | null) => {
  if (amount === undefined || amount === null)
    return { text: "---", color: "text-slate-500 bg-slate-100" };
  if (amount === 0)
    return {
      text: "Miễn phí",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    };
  const formatted = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
  return { text: formatted, color: "text-blue-600 bg-blue-50 border-blue-100" };
};

// --- PHẦN ẨN (COMMENTED OUT) THEO YÊU CẦU ---
/*
const STATUS_META: Record<ClubStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: "Hoạt động",
    className: "bg-emerald-500 text-white shadow-emerald-200",
  },
  PENDING: {
    label: "Chờ duyệt",
    className: "bg-amber-500 text-white shadow-amber-200",
  },
  REJECTED: {
    label: "Từ chối",
    className: "bg-rose-500 text-white shadow-rose-200",
  },
  INACTIVE: {
    label: "Tạm dừng",
    className: "bg-slate-500 text-white shadow-slate-200",
  },
  ARCHIVED: {
    label: "Lưu trữ",
    className: "bg-slate-400 text-white shadow-slate-200",
  },
};

const getStatusMeta = (status: ClubStatus) =>
  STATUS_META[status] ?? { label: "N/A", className: "bg-slate-400 text-white" };
*/

// --- Main Component ---
interface ClubCardProps {
  club: ClubSummary;
  joinStatus?: ClubJoinRequestStatus;
  joinFee?: number | null;
  isLeader: boolean;
  hasJoinSettings: boolean;
  hasActiveActivities: boolean;
  onJoin: (club: ClubSummary) => void;
  onViewActivities: (clubId: number) => void;
}

const ClubCard = ({
  club,
  joinStatus,
  joinFee,
  isLeader,
  hasJoinSettings,
  hasActiveActivities,
  onJoin,
  onViewActivities,
}: ClubCardProps) => {
  // const statusMeta = getStatusMeta(club.status); // <-- Đã ẩn dòng này
  
  const scheduleDays = formatOperatingDays(club.operatingDays);
  const scheduleHours =
    club.operatingStartTime && club.operatingEndTime
      ? `${club.operatingStartTime.slice(0, 5)} - ${club.operatingEndTime.slice(
          0,
          5
        )}`
      : null;

  // Logic nút bấm
  const isBlocked = joinStatus === "PENDING" || joinStatus === "APPROVED";
  const isJoinableStatus = club.status === "ACTIVE";
  const hasInvite = Boolean(club.inviteCode);
  const disabled =
    !hasInvite ||
    isBlocked ||
    isLeader ||
    !isJoinableStatus ||
    (isJoinableStatus && !hasJoinSettings);

  let label = "Tham gia câu lạc bộ";
  if (isLeader) label = "Bạn là Leader";
  else if (joinStatus === "PENDING") label = "Đang chờ";
  else if (joinStatus === "APPROVED") label = "Thành viên";
  else if (!isJoinableStatus) label = "Đóng";
  else if (!hasJoinSettings) label = "Chưa hoàn tất cài đặt";

  const feeInfo = formatMoney(joinFee);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10">
      {/* 1. Hình ảnh cover */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        {club.imageUrl ? (
          <img
            src={club.imageUrl}
            alt={club.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-slate-300">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        {/* --- Badge trạng thái (ĐÃ ẨN) --- */}
        {/* <span
          className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-lg ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span> 
        */}

        {/* Badge Category */}
        <span className="absolute right-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 backdrop-blur-sm shadow-sm">
          {club.category ?? "Chung"}
        </span>
      </div>

      {/* 2. Nội dung chính */}
      <div className="flex flex-1 flex-col p-4">
        {/* Header: Mã + Tên + Mô tả */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
              #{club.code ?? "---"}
            </span>
          </div>
          <h3
            className="mt-1 line-clamp-1 text-base font-bold text-slate-800"
            title={club.name ?? ""}
          >
            {club.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-500">
            {club.description ?? "Chưa có mô tả cho câu lạc bộ này."}
          </p>
        </div>

        {/* Info Grid: Thống kê quan trọng */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {/* Phí gia nhập (Đã sửa theo yêu cầu trước) */}
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${feeInfo.color} bg-opacity-50 border-opacity-50`}
          >
            <Banknote className="h-5 w-5 shrink-0 opacity-70" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-medium opacity-70 leading-none mb-0.5">
                Phí gia nhập
              </span>
              <span className="truncate text-xs font-bold leading-none">
                {feeInfo.text}
              </span>
            </div>
          </div>

          {/* Số thành viên */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-slate-600">
            <Users className="h-5 w-5 shrink-0 text-orange-400" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-medium opacity-70 leading-none mb-0.5">
                Thành viên
              </span>
              <span className="truncate text-xs font-semibold leading-none">
                {club.memberCount ?? 1}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Info: Địa điểm & Thời gian */}
        <div className="mt-auto space-y-2 border-t border-slate-100 pt-3">
          {/* Location */}
          <div className="flex items-start gap-2 text-xs text-slate-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="line-clamp-1">
              {club.meetingLocation || "Chưa cập nhật địa điểm"}
            </span>
          </div>

          {/* Time */}
          {scheduleDays || scheduleHours ? (
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div className="flex flex-col">
                {scheduleDays && <span>{scheduleDays}</span>}
                {scheduleHours && (
                  <span className="text-[10px] text-slate-400">
                    {scheduleHours}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Lịch chưa cập nhật</span>
            </div>
          )}
        </div>

        {/* Footer: Leader & Buttons */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => onViewActivities(club.id)}
            disabled={!hasActiveActivities}
            className="group/btn flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
            title="Xem hoạt động"
          >
          <PartyPopper className="h-4 w-4" />
          </button>

          <button
            onClick={() => onJoin(club)}
            disabled={disabled}
            className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              disabled
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-orange-500/25 active:scale-95"
            }`}
          >
            {label}
            {!disabled && <ChevronRight className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClubCard;
