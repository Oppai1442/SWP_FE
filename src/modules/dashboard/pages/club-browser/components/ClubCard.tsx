import {
  CalendarDays,
  Clock3,
  Image as ImageIcon,
  MapPin,
  Users,
} from 'lucide-react';
import { 
  type ClubSummary, 
  type ClubStatus, 
  type ClubJoinRequestStatus 
} from '../../my-club/services/myClubService';

// --- Constants & Helpers ---
const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: 'Thứ 2', TUESDAY: 'Thứ 3', WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5', FRIDAY: 'Thứ 6', SATURDAY: 'Thứ 7', SUNDAY: 'Chủ nhật',
};

const formatOperatingDays = (days?: string[] | null) => {
  if (!days || days.length === 0) return null;
  if (days.length === 7) return 'Hoạt động cả tuần';
  return days.map((day) => WEEKDAY_LABELS[day] ?? day).join(', ');
};

const STATUS_META: Record<ClubStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Đang hoạt động', className: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  PENDING: { label: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-600 border border-amber-100' },
  REJECTED: { label: 'Đã bị từ chối', className: 'bg-rose-50 text-rose-600 border border-rose-100' },
  INACTIVE: { label: 'Tạm dừng hoạt động', className: 'bg-slate-50 text-slate-600 border border-slate-200' },
  ARCHIVED: { label: 'Đã lưu trữ', className: 'bg-slate-100 text-slate-500 border border-slate-200' },
};

const getStatusMeta = (status: ClubStatus) =>
  STATUS_META[status] ?? { label: 'Không xác định', className: 'bg-slate-50 text-slate-600 border border-slate-200' };

// --- Main Component ---
interface ClubCardProps {
  club: ClubSummary;
  joinStatus?: ClubJoinRequestStatus;
  isLeader: boolean;
  hasJoinSettings: boolean;
  hasActiveActivities: boolean;
  onJoin: (club: ClubSummary) => void;
  onViewActivities: (clubId: number) => void;
}

const ClubCard = ({
  club,
  joinStatus,
  isLeader,
  hasJoinSettings,
  hasActiveActivities,
  onJoin,
  onViewActivities,
}: ClubCardProps) => {
  const statusMeta = getStatusMeta(club.status);
  const scheduleDays = formatOperatingDays(club.operatingDays);
  const scheduleHours = club.operatingStartTime && club.operatingEndTime
    ? `${club.operatingStartTime} - ${club.operatingEndTime}`
    : null;

  // Logic kiểm tra nút Join
  const isBlocked = joinStatus === 'PENDING' || joinStatus === 'APPROVED';
  const isJoinableStatus = club.status === 'ACTIVE';
  const hasInvite = Boolean(club.inviteCode);

  const disabled = !hasInvite || isBlocked || isLeader || !isJoinableStatus || (isJoinableStatus && !hasJoinSettings);

  let label = 'Tham gia câu lạc bộ';
  if (isLeader) label = 'Bạn là leader';
  else if (joinStatus === 'PENDING') label = 'Đang chờ';
  else if (joinStatus === 'APPROVED') label = 'Đã tham gia';
  else if (!isJoinableStatus) label = 'Chưa mở tham gia';
  else if (!hasInvite) label = 'Chưa có mã mời';
  else if (!hasJoinSettings) label = 'Chưa hoàn tất cài đặt';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-44 w-full overflow-hidden">
        {club.imageUrl ? (
          <img
            src={club.imageUrl}
            alt={club.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-slate-50 text-slate-400">
            <ImageIcon className="h-8 w-8 text-orange-400" />
            <span className="mt-2 text-xs font-semibold">Không có ảnh bìa</span>
          </div>
        )}
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-orange-400">
            #{club.code ?? '---'}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{club.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">
            {club.description ?? 'Câu lạc bộ này chưa có mô tả.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Users className="h-4 w-4 text-orange-400" />
            {club.memberCount ?? 0} thành viên
          </span>
          {club.meetingLocation && (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <MapPin className="h-4 w-4 text-orange-400" />
              {club.meetingLocation}
            </span>
          )}
        </div>
        {(scheduleDays || scheduleHours) && (
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
            {scheduleDays && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <CalendarDays className="h-4 w-4 text-orange-400" />
                {scheduleDays}
              </span>
            )}
            {scheduleHours && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Clock3 className="h-4 w-4 text-orange-400" />
                {scheduleHours}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Trưởng nhóm:{' '}
            <span className="font-semibold text-slate-700">
              {club.leaderName ?? '---'}
            </span>
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
            {club.category ?? 'Chung'}
          </span>
        </div>
        
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onViewActivities(club.id)}
            disabled={!hasActiveActivities}
            className={`inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-semibold transition ${
              !hasActiveActivities
                ? 'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Hoạt động
          </button>
          <button
            type="button"
            onClick={() => onJoin(club)}
            disabled={disabled}
            className={`ml-auto inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              disabled
                ? 'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400'
                : 'border border-orange-200 bg-white text-orange-500 hover:bg-orange-50'
            }`}
          >
            {label}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClubCard;
