import type { ClubCreationRequest, ClubCreationRequestStatus } from '../../club-queue/services/clubCreationQueueService';
import { formatDateTime } from '../utils';
import { requestStatusMeta } from '../constants';
import { Loader2 } from 'lucide-react';

interface CreationRequestsSectionProps {
  requests: ClubCreationRequest[];
  isLoading: boolean;
  statusFilter: ClubCreationRequestStatus | 'all';
  search: string;
  onStatusFilterChange: (value: ClubCreationRequestStatus | 'all') => void;
  onSearchChange: (value: string) => void;
}

const CreationRequestsSection = ({
  requests,
  isLoading,
  statusFilter,
  search,
  onStatusFilterChange,
  onSearchChange,
}: CreationRequestsSectionProps) => (
  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">Creation requests</p>
        <p className="text-xs text-slate-500">Track approvals for new clubs you submitted.</p>
      </div>
      <select
        value={statusFilter}
        onChange={(event) => onStatusFilterChange(event.target.value as ClubCreationRequestStatus | 'all')}
        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-40"
      >
        <option value="all">All</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>
    </div>
    <div className="mt-4">
      <input
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search requests..."
        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
      />
    </div>
    {isLoading ? (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    ) : requests.length === 0 ? (
      <p className="py-8 text-center text-sm text-slate-500">No requests found.</p>
    ) : (
      <div className="mt-4 space-y-3">
        {requests.map((request) => {
          const statusMeta = requestStatusMeta[request.status];
          return (
            <div key={request.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{request.clubName ?? 'Unnamed club'}</p>
                  <p className="text-xs text-slate-500">Submitted {formatDateTime(request.submittedAt)}</p>
                  {request.note && <p className="text-xs text-slate-500">Note: {request.note}</p>}
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${statusMeta.className}`}
                >
                  {statusMeta.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default CreationRequestsSection;
