import type { ClubJoinRequest, ClubSummary } from '../services/myClubService';
import { formatDateTime } from '../utils';
import { Loader2, RefreshCcw } from 'lucide-react';

interface JoinedClubsSectionProps {
  joinedClubs: ClubJoinRequest[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectClub: (club: ClubSummary) => void;
}

const JoinedClubsSection = ({ joinedClubs, isLoading, onRefresh, onSelectClub }: JoinedClubsSectionProps) => (
  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">Câu lạc bộ tôi đã tham gia</p>
        <p className="text-xs text-slate-500">Yêu cầu tham gia đã được phê duyệt mà bạn có thể truy cập.</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500"
      >
        <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        Làm mới
      </button>
    </div>
    {isLoading ? (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    ) : joinedClubs.length === 0 ? (
      <p className="py-8 text-center text-sm text-slate-500">Bạn chưa tham gia câu lạc bộ nào.</p>
    ) : (
      <div className="mt-4 space-y-3">
        {joinedClubs.map((request) => (
          <button
            key={request.id}
            type="button"
            onClick={() =>
              onSelectClub({
                id: request.clubId!,
                name: request.clubName ?? 'Câu lạc bộ đã tham gia',
                code: null,
                status: 'ACTIVE',
              } as ClubSummary)
            }
            className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-left transition hover:border-orange-200 hover:bg-orange-50/40"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{request.clubName ?? 'Câu lạc bộ chưa đặt tên'}</p>
              <p className="text-xs text-slate-500">
                Đã tham gia {formatDateTime(request.updatedAt ?? request.createdAt)}
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
              Xem
            </span>
          </button>
        ))}
      </div>
    )}
  </div>
);

export default JoinedClubsSection;
