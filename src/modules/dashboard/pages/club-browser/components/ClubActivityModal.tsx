import { X } from 'lucide-react';
// Import type từ file service chứa đoạn code bạn vừa gửi (giả sử tên file là myClubService.ts)
import { type ClubActivity, type ClubSummary } from '../../my-club/services/myClubService'; 

interface ClubActivityModalProps {
  club: ClubSummary | null;
  activities: ClubActivity[];
  onClose: () => void;
}

const ClubActivityModal = ({ club, activities, onClose }: ClubActivityModalProps) => {
  if (!club) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Hoạt động cho {club.name}</h3>
            <p className="mt-1 text-sm text-slate-500">Các hoạt động đang diễn ra</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-2">
          {activities.length === 0 ? (
            <div className="text-sm text-slate-500">
              Không có hoạt động nào đang diễn ra.
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-base font-semibold text-slate-900">
                      {activity.title}
                    </div>

                    {activity.description && (
                      <div className="text-sm text-slate-600">
                        {activity.description}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-right text-xs text-slate-500">
                    {activity.startDate && (
                      <div>Bắt đầu: {new Date(activity.startDate).toLocaleString()}</div>
                    )}
                    {activity.endDate && (
                      <div>Kết thúc: {new Date(activity.endDate).toLocaleString()}</div>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <span className="inline-block rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
                    Địa điểm: {activity.location ?? 'Không rõ'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubActivityModal;