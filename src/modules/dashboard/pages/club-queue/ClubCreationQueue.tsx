import type { ComponentType } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle,
  Check,
  Clock,
  Eye,
  RefreshCcw,
  Search,
  Users,
  X,
} from 'lucide-react';
import {
  decideClubCreationRequestAPI,
  getClubCreationRequestsAPI,
  type ClubCreationRequest,
  type ClubCreationRequestStatus,
} from './services/clubCreationQueueService';

type StatusFilter = ClubCreationRequestStatus | 'all';

const ITEMS_PER_PAGE = 10;

const statusLabels: Record<ClubCreationRequestStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
};

const statusClasses: Record<ClubCreationRequestStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-600 border-rose-200',
};

const formatDate = (date: string | null) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const ClubCreationQueue = () => {
  const [requests, setRequests] = useState<ClubCreationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ClubCreationRequest | null>(null);
  const [decisionMode, setDecisionMode] = useState<ClubCreationRequestStatus | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getClubCreationRequestsAPI(statusFilter);
      const normalized = Array.isArray((data as any)?.data) ? (data as any).data : data;
      setRequests(Array.isArray(normalized) ? normalized : []);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải hàng đợi club. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim().toLowerCase()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    if (!debouncedSearch) {
      return [...requests].sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
    }

    return requests
      .filter((req) => {
        const haystack = `${req.clubName ?? ''} ${req.submittedByName ?? ''}`.toLowerCase();
        return haystack.includes(debouncedSearch);
      })
      .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
  }, [debouncedSearch, requests]);

  const totalCount = filteredRequests.length;
  const safeCurrentPage = Math.min(currentPage, Math.max(Math.ceil(totalCount / ITEMS_PER_PAGE), 1));
  const pageStart = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredRequests.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const stats = useMemo(() => {
    const totals: Record<'total' | ClubCreationRequestStatus, number> = {
      total: requests.length,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    requests.forEach((req) => {
      totals[req.status] += 1;
    });
    return totals;
  }, [requests]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchRequests();
      toast.success('Hàng đợi đã được cập nhật');
    } finally {
      setIsRefreshing(false);
    }
  };

  const openDecisionModal = (request: ClubCreationRequest, mode: ClubCreationRequestStatus) => {
    setSelectedRequest(request);
    setDecisionMode(mode);
    setDecisionNote('');
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setDecisionMode(null);
    setDecisionNote('');
  };

  const handleDecisionSubmit = async () => {
    if (!selectedRequest || !decisionMode || selectedRequest.status !== 'PENDING') {
      closeModal();
      return;
    }
    try {
      setIsSubmittingDecision(true);
      const payload = {
        status: decisionMode,
        note: decisionNote?.trim() ? decisionNote.trim() : null,
      };
      const updated = await decideClubCreationRequestAPI(selectedRequest.id, payload);
      const normalized = (updated as any)?.data ?? updated;
      setRequests((prev) =>
        prev.map((req) => (req.id === normalized.id ? { ...req, ...normalized } : req))
      );
      toast.success(
        decisionMode === 'APPROVED'
          ? 'Yêu cầu club đã được duyệt thành công.'
          : 'Yêu cầu club đã bị từ chối.'
      );
      closeModal();
    } catch (error) {
      console.error(error);
      toast.error('Không thể gửi quyết định. Vui lòng thử lại.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const pageCount = Math.max(Math.ceil(totalCount / ITEMS_PER_PAGE), totalCount > 0 ? 1 : 0);
  const pageButtons = useMemo(() => {
    if (pageCount <= 1) return [];
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, safeCurrentPage - half);
    let end = Math.min(pageCount, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    const buttons: number[] = [];
    for (let i = start; i <= end; i += 1) {
      buttons.push(i);
    }
    return buttons;
  }, [pageCount, safeCurrentPage]);

  const isEmpty = !isLoading && totalCount === 0;

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-orange-400">Hàng đợi Club</p>
          <h1 className="text-2xl font-semibold text-slate-900">Yêu cầu tạo Club</h1>
          <p className="text-sm text-slate-500">
            Xem xét và phê duyệt các yêu cầu tạo club mới từ các trưởng nhóm sinh viên.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-500 shadow-sm transition hover:bg-orange-50 disabled:opacity-70"
          disabled={isRefreshing || isLoading}
        >
          <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Tổng số yêu cầu"
          value={stats.total}
          icon={Users}
          accent="bg-slate-900 text-white"
        />
        <SummaryCard
          label="Chờ duyệt"
          value={stats.PENDING}
          icon={Clock}
          accent="bg-amber-100 text-amber-700"
        />
        <SummaryCard
          label="Club đã duyệt"
          value={stats.APPROVED}
          icon={Check}
          accent="bg-emerald-100 text-emerald-700"
        />
        <SummaryCard
          label="Đã từ chối"
          value={stats.REJECTED}
          icon={AlertTriangle}
          accent="bg-rose-100 text-rose-700"
        />
      </section>

      <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm kiếm theo club hoặc trưởng nhóm..."
                className="w-full rounded-2xl border border-slate-200 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-48"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="py-3 pr-4">Club</th>
                <th className="px-4 py-3">Trưởng nhóm</th>
                <th className="px-4 py-3">Ngày gửi</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableLoading rows={ITEMS_PER_PAGE} columns={5} />
              ) : isEmpty ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="space-y-2 text-slate-500">
                      <p className="text-base font-semibold text-slate-700">Không có gì để xem xét</p>
                      <p className="text-sm">Không có yêu cầu tạo club nào khớp với bộ lọc của bạn.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((request) => (
                  <tr key={request.id} className="text-slate-700">
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-slate-900">{request.clubName ?? 'N/A'}</div>
                      <div className="text-xs text-slate-400">#{request.clubId ?? 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">{request.submittedByName ?? 'Không rõ'}</div>
                      <div className="text-xs text-slate-400">ID {request.submittedById ?? 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(request.submittedAt)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[request.status]
                          }`}
                      >
                        {statusLabels[request.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(request)}
                          className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Xem
                        </button>
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => openDecisionModal(request, 'APPROVED')}
                              className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
                            >
                              <Check className="mr-1.5 h-3.5 w-3.5" />
                              Duyệt
                            </button>
                            <button
                              type="button"
                              onClick={() => openDecisionModal(request, 'REJECTED')}
                              className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                            >
                              <X className="mr-1.5 h-3.5 w-3.5" />
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && !isLoading && !isEmpty && (
          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Hiển thị{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(totalCount, pageStart + 1)}-{Math.min(totalCount, pageStart + currentItems.length)}
              </span>{' '}
              của <span className="font-semibold text-slate-900">{totalCount}</span> yêu cầu
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-orange-500 disabled:opacity-40"
              >
                Trước
              </button>
              {pageButtons.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    page === safeCurrentPage
                      ? 'bg-orange-500 text-white shadow'
                      : 'text-slate-600 hover:text-orange-500'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
                disabled={safeCurrentPage === pageCount}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-orange-500 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          isDecisionMode={!!decisionMode}
          decisionMode={decisionMode}
          decisionNote={decisionNote}
          setDecisionNote={setDecisionNote}
          onClose={closeModal}
          onDecide={handleDecisionSubmit}
          isSubmitting={isSubmittingDecision}
          onApprove={() => openDecisionModal(selectedRequest, 'APPROVED')}
          onReject={() => openDecisionModal(selectedRequest, 'REJECTED')}
        />
      )}
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}

const SummaryCard = ({ label, value, icon: Icon, accent }: SummaryCardProps) => (
  <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value ?? 0}</p>
      </div>
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </div>
);

interface TableLoadingProps {
  rows: number;
  columns: number;
}

const TableLoading = ({ rows, columns }: TableLoadingProps) => (
  <>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <tr key={rowIdx} className="animate-pulse">
        {Array.from({ length: columns }).map((__, colIdx) => (
          <td key={colIdx} className="py-4">
            <div className="h-4 w-full rounded-full bg-slate-100" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

interface RequestDetailModalProps {
  request: ClubCreationRequest;
  isDecisionMode: boolean;
  decisionMode: ClubCreationRequestStatus | null;
  decisionNote: string;
  setDecisionNote: (value: string) => void;
  onDecide: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  onApprove: () => void;
  onReject: () => void;
}

const RequestDetailModal = ({
  request,
  isDecisionMode,
  decisionMode,
  decisionNote,
  setDecisionNote,
  onDecide,
  onClose,
  isSubmitting,
  onApprove,
  onReject,
}: RequestDetailModalProps) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 py-6 sm:items-center">
    <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-400">Chi tiết yêu cầu</p>
          <h3 className="text-lg font-semibold text-slate-900">{request.clubName ?? 'Club chưa có tên'}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-orange-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Mã Club" value={`#${request.clubId ?? 'N/A'}`} />
          <DetailItem label="Trạng thái" value={statusLabels[request.status]} />
          <DetailItem label="Trưởng nhóm" value={request.submittedByName ?? 'Không rõ'} />
          <DetailItem label="Gửi lúc" value={formatDate(request.submittedAt)} />
        </div>

        {request.note && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Ghi chú của quản trị viên</p>
            <p className="mt-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {request.note}
            </p>
          </div>
        )}

        {request.status === 'PENDING' && !isDecisionMode && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100"
            >
              <Check className="mr-2 h-4 w-4" />
              Duyệt
            </button>
            <button
              type="button"
              onClick={onReject}
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
            >
              <X className="mr-2 h-4 w-4" />
              Từ chối
            </button>
          </div>
        )}

        {isDecisionMode && (
          <div className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
            <p className="text-sm font-semibold text-orange-700">
              {decisionMode === 'APPROVED' ? 'Duyệt yêu cầu tạo club' : 'Từ chối yêu cầu tạo club'}
            </p>
            <textarea
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder="Thêm ghi chú (tùy chọn) cho trưởng nhóm..."
              rows={3}
              className="w-full rounded-2xl border border-orange-200 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-transparent px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={onDecide}
                disabled={isSubmitting}
                className={`inline-flex items-center rounded-2xl px-5 py-2 text-sm font-semibold text-white transition ${
                  decisionMode === 'APPROVED' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
                } disabled:opacity-60`}
              >
                {isSubmitting ? 'Đang gửi...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

interface DetailItemProps {
  label: string;
  value: string;
}

const DetailItem = ({ label, value }: DetailItemProps) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
  </div>
);

export default ClubCreationQueue;