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

const formatTimeRange = (start?: string | null, end?: string | null) => {
  if (!start) return "Chưa cập nhật thời gian";

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
    return `${startTime} - ${endTime}`;
  }

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

const getActivityStatus = (start?: string | null, end?: string | null) => {
  const now = new Date();
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  if (startDate && startDate > now) {
    return {
      label: "Sắp diễn ra",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    };
  }
  if (startDate && endDate && now >= startDate && now <= endDate) {
    return {
      label: "Đang diễn ra",
      color: "bg-green-100 text-green-700 border-green-200",
    };
  }
  if (endDate && now > endDate) {
    return {
      label: "Đã kết thúc",
      color: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }
  return {
    label: "Lên kế hoạch",
    color: "bg-slate-100 text-slate-500 border-slate-200",
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 flex flex-col w-full max-w-3xl max-h-[90vh] rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-sm">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Danh sách Hoạt động</h3>
              <p className="text-sm font-medium text-slate-500">
                CLB: <span className="text-orange-600">{club.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="group flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
          >
            <X className="h-6 w-6 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          {sortedActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-white p-6 shadow-sm mb-4">
                <AlertCircle className="h-12 w-12 text-slate-300" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Chưa có hoạt động
              </h4>
              <p className="mt-2 text-base text-slate-500 max-w-xs">
                Câu lạc bộ này hiện chưa có hoạt động nào được công bố.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {sortedActivities.map((activity) => {
                const dateBlock = formatDateBlock(activity.startDate);
                const status = getActivityStatus(
                  activity.startDate,
                  activity.endDate
                );

                return (
                  <div
                    key={activity.id}
                    className="group relative flex flex-col sm:flex-row gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/10"
                  >
                    {/* Left: Date Block */}
                    <div className="hidden sm:flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 shadow-sm group-hover:bg-orange-100 transition-colors">
                      <span className="text-sm font-bold uppercase tracking-wider opacity-80">
                        {dateBlock.month}
                      </span>
                      <span className="text-4xl font-extrabold leading-none mt-1">
                        {dateBlock.day}
                      </span>
                    </div>

                    {/* Right: Content */}
                    <div className="flex flex-1 flex-col">
                      {/* Top: Status & Title */}
                      <div className="flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <h4
                          className="text-lg sm:text-xl font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors"
                          title={activity.title}
                        >
                          {activity.title}
                        </h4>
                        <span
                          className={`self-start sm:self-center shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide border shadow-sm ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      
                      {/* Mobile Date Block */}
                      <div className="flex sm:hidden items-center gap-2 mb-3 text-orange-600 font-bold bg-orange-50 p-2 rounded-lg w-fit">
                         <CalendarDays className="h-4 w-4"/> 
                         <span>{dateBlock.day} {dateBlock.month}</span>
                      </div>

                      {/* Description */}
                      {activity.description && (
                        <p className="mb-4 line-clamp-2 text-base text-slate-600 leading-relaxed">
                          {activity.description}
                        </p>
                      )}

                      {/* Footer Metadata (Đã bỏ hover) */}
                      <div className="mt-auto grid grid-cols-1 gap-3 pt-2">
                        {/* Thời gian */}
                        <div className="flex items-start gap-4 rounded-xl bg-slate-50 p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm text-slate-400">
                             <Clock className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col justify-center">
                            <span className="text-xs font-semibold uppercase text-slate-400 mb-0.5">Thời gian</span>
                            <span className="text-base font-bold text-slate-800 leading-snug">
                                {formatTimeRange(
                                activity.startDate,
                                activity.endDate
                                )}
                            </span>
                          </div>
                        </div>
                        
                        {/* Địa điểm */}
                        <div className="flex items-start gap-4 rounded-xl bg-slate-50 p-3">
                           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm text-slate-400">
                             <MapPin className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col justify-center">
                            <span className="text-xs font-semibold uppercase text-slate-400 mb-0.5">Địa điểm</span>
                            <span className="text-base font-bold text-slate-800 leading-snug">
                                {activity.location || "Chưa cập nhật địa điểm"}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* End Footer Metadata */}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 bg-white px-6 py-4 text-sm font-medium text-slate-500 text-center shrink-0">
          Hiển thị tổng cộng <span className="text-slate-900 font-bold">{activities.length}</span> hoạt động.
        </div>
      </div>
    </div>
  );
};

export default ClubActivityModal;