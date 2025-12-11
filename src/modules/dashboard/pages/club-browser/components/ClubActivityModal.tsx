import { X, MapPin, Clock, CalendarDays, AlertCircle } from "lucide-react";
import {
  type ClubActivity,
  type ClubSummary,
} from "../../my-club/services/myClubService";

interface ClubActivityModalProps {
  club: ClubSummary | null;
  activities: ClubActivity[];
  onClose: () => void;
}

const formatDateBlock = (dateStr?: string | null) => {
  if (!dateStr) return { day: "--", month: "---" };
  const date = new Date(dateStr);
  return {
    day: date.getDate(),
    month: `Thg ${date.getMonth() + 1}`,
  };
};

// --- CẬP NHẬT HÀM NÀY ---
const formatTimeRange = (start?: string | null, end?: string | null) => {
  if (!start) return "Chưa cập nhật";

  const startDate = new Date(start);
  const startTime = startDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!end) return `Từ ${startTime}`;

  const endDate = new Date(end);
  const endTime = endDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isSameDay = startDate.toDateString() === endDate.toDateString();

  if (isSameDay) {
    // Cùng ngày: 07:00 - 11:00
    return `${startTime} - ${endTime}`;
  }

  // Khác ngày: 07:00 09/12 - 17:00 10/12
  const startDay = startDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
  const endDay = endDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });

  return `${startTime} ${startDay} - ${endTime} ${endDay}`;
};
// ------------------------

const getActivityStatus = (start?: string | null, end?: string | null) => {
  const now = new Date();
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  if (startDate && startDate > now) {
    return {
      label: "Sắp diễn ra",
      color: "bg-blue-50 text-blue-600 border-blue-100",
    };
  }
  if (startDate && endDate && now >= startDate && now <= endDate) {
    return {
      label: "Đang diễn ra",
      color: "bg-green-50 text-green-600 border-green-100",
    };
  }
  if (endDate && now > endDate) {
    return {
      label: "Đã kết thúc",
      color: "bg-slate-50 text-slate-500 border-slate-100",
    };
  }
  return {
    label: "Lên kế hoạch",
    color: "bg-slate-50 text-slate-500 border-slate-100",
  };
};

const ClubActivityModal = ({
  club,
  activities,
  onClose,
}: ClubActivityModalProps) => {
  if (!club) return null;

  const sortedActivities = [...activities].sort((a, b) => {
    const dateA = new Date(a.startDate || 0).getTime();
    const dateB = new Date(b.startDate || 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[85vh] rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Hoạt Động</h3>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {club.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {sortedActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <AlertCircle className="h-8 w-8 text-slate-400" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-slate-900">
                Chưa có hoạt động
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                Câu lạc bộ này hiện chưa có hoạt động nào được công bố.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedActivities.map((activity) => {
                const dateBlock = formatDateBlock(activity.startDate);
                const status = getActivityStatus(
                  activity.startDate,
                  activity.endDate
                );

                return (
                  <div
                    key={activity.id}
                    className="group relative flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
                  >
                    {/* Date Block */}
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                      <span className="text-xs font-medium uppercase">
                        {dateBlock.month}
                      </span>
                      <span className="text-xl font-bold leading-none">
                        {dateBlock.day}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between gap-2">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className="text-base font-bold text-slate-800 line-clamp-1"
                            title={activity.title}
                          >
                            {activity.title}
                          </h4>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {activity.description}
                          </p>
                        )}
                      </div>

                      {/* Footer Metadata */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 border-t border-slate-50 pt-2 mt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-medium">
                            {formatTimeRange(
                              activity.startDate,
                              activity.endDate
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span
                            className="truncate max-w-[150px]"
                            title={activity.location || ""}
                          >
                            {activity.location || "Chưa cập nhật địa điểm"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white px-6 py-4 text-xs text-slate-400 text-center rounded-b-3xl">
          Hiển thị {activities.length} hoạt động.
        </div>
      </div>
    </div>
  );
};

export default ClubActivityModal;
