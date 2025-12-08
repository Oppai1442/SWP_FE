import type { ClubJoinRequest, ClubJoinRequestStatus } from '../services/myClubService';
import { formatDateTime } from '../utils';
import { joinRequestStatusMeta } from '../constants';
import { Eye, Loader2 } from 'lucide-react';

interface JoinHistorySectionProps {
  joinHistory: ClubJoinRequest[];
  isLoading: boolean;
  filter: ClubJoinRequestStatus | 'all';
  onFilterChange: (value: ClubJoinRequestStatus | 'all') => void;
}

const JoinHistorySection = ({
  joinHistory,
  isLoading,
  filter,
  onFilterChange,
}: JoinHistorySectionProps) => (
  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">Join request history</p>
        <p className="text-xs text-slate-500">Track every attempt to join a club.</p>
      </div>
      <select
        value={filter}
        onChange={(event) => onFilterChange(event.target.value as ClubJoinRequestStatus | 'all')}
        className="rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
      >
        <option value="all">All</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>
    </div>
    {isLoading ? (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    ) : joinHistory.length === 0 ? (
      <p className="py-8 text-center text-sm text-slate-500">No join requests found.</p>
    ) : (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="py-3 pr-4">Club</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {joinHistory.map((request) => (
              <tr key={request.id} className="text-slate-700">
                <td className="py-3 pr-4">
                  <p className="font-semibold text-slate-900">{request.clubName ?? 'Unknown'}</p>
                  {request.motivation && <p className="text-xs text-slate-500">{request.motivation}</p>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      joinRequestStatusMeta[request.status].className
                    }`}
                  >
                    {joinRequestStatusMeta[request.status].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(request.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {request.paymentProofUrl ? (
                    <a
                      href={request.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-500 transition hover:bg-orange-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default JoinHistorySection;
