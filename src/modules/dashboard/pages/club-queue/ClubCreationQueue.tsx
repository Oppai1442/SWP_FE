import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  LayoutGrid,
  RefreshCcw,
  Search,
  X,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  decideClubCreationRequestAPI,
  getClubCreationRequestsAPI,
  type ClubCreationRequest,
  type ClubCreationRequestStatus,
} from "./services/clubCreationQueueService";
import { showToast } from "@/utils";

// --- Types & Constants ---
type StatusFilter = ClubCreationRequestStatus | "all";
const ITEMS_PER_PAGE = 10;

const STATUS_CONFIG: Record<
  ClubCreationRequestStatus,
  { label: string; color: string; icon: any }
> = {
  PENDING: {
    label: "Chờ duyệt",
    color: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20",
    icon: Clock,
  },
  APPROVED: {
    label: "Đã duyệt",
    color:
      "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Đã từ chối",
    color: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20",
    icon: XCircle,
  },
};

const formatDate = (date: string | null) => {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

// --- Main Component ---
const ClubCreationQueue = () => {
  // State
  const [requests, setRequests] = useState<ClubCreationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [selectedRequest, setSelectedRequest] =
    useState<ClubCreationRequest | null>(null);
  const [decisionMode, setDecisionMode] =
    useState<ClubCreationRequestStatus | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // --- Logic Hooks ---
  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getClubCreationRequestsAPI(statusFilter);
      const normalized = Array.isArray((data as any)?.data)
        ? (data as any).data
        : data;
      setRequests(Array.isArray(normalized) ? normalized : []);
    } catch (error) {
      console.error(error);
      showToast("error", "Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchQuery.trim().toLowerCase()),
      400
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  // Filtering & Pagination Logic
  const filteredRequests = useMemo(() => {
    let result = [...requests];
    if (debouncedSearch) {
      result = result.filter((req) =>
        `${req.clubName ?? ""} ${req.submittedByName ?? ""}`
          .toLowerCase()
          .includes(debouncedSearch)
      );
    }
    return result.sort((a, b) =>
      (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "")
    );
  }, [debouncedSearch, requests]);

  const totalCount = filteredRequests.length;
  const pageCount = Math.max(Math.ceil(totalCount / ITEMS_PER_PAGE), 1);
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const currentItems = filteredRequests.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  useEffect(() => setCurrentPage(1), [debouncedSearch, statusFilter]);

  // Stats Logic
  const stats = useMemo(() => {
    const totals = {
      total: requests.length,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    requests.forEach((req) => {
      if (totals[req.status] !== undefined) totals[req.status]++;
    });
    return totals;
  }, [requests]);

  // Actions
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRequests();
    setIsRefreshing(false);
    showToast("success", "Đã cập nhật dữ liệu mới nhất");
  };

  const handleDecisionSubmit = async () => {
    if (!selectedRequest || !decisionMode) return;
    try {
      setIsSubmittingDecision(true);
      const payload = {
        status: decisionMode,
        note: decisionNote?.trim() || null,
      };
      const updated = await decideClubCreationRequestAPI(
        selectedRequest.id,
        payload
      );
      const normalized = (updated as any)?.data ?? updated;

      setRequests((prev) =>
        prev.map((req) =>
          req.id === normalized.id ? { ...req, ...normalized } : req
        )
      );

      showToast(
        "success",
        decisionMode === "APPROVED"
          ? "Đã duyệt yêu cầu thành công."
          : "Đã từ chối yêu cầu."
      );
      closeModal();
    } catch (error) {
      showToast("error", "Có lỗi xảy ra khi xử lý yêu cầu.");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setDecisionMode(null);
    setDecisionNote("");
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      {/* Header Section */}
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <LayoutGrid size={18} />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Phê duyệt Club
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500 ml-10">
              Quản lý và xét duyệt các yêu cầu tạo câu lạc bộ mới.
            </p>
          </div>
          <button
            onClick={() => void handleRefresh()}
            disabled={isRefreshing || isLoading}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-orange-200 hover:text-orange-600 disabled:opacity-70"
          >
            <RefreshCcw
              className={`h-4 w-4 transition-transform ${
                isRefreshing ? "animate-spin" : "group-hover:rotate-180"
              }`}
            />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Tổng yêu cầu"
            value={stats.total}
            icon={LayoutGrid}
            color="blue"
          />
          <StatCard
            label="Chờ xử lý"
            value={stats.PENDING}
            icon={Clock}
            color="amber"
            isActive={true}
          />
          <StatCard
            label="Đã duyệt"
            value={stats.APPROVED}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            label="Đã từ chối"
            value={stats.REJECTED}
            icon={XCircle}
            color="rose"
          />
        </div>

        {/* Main Content Area */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Filters & Search Toolbar */}
          <div className="border-b border-slate-100 bg-white p-4 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên club hoặc người gửi..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-1 border border-slate-200">
                  {(["all", "PENDING", "APPROVED", "REJECTED"] as const).map(
                    (tab) => (
                      <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition-all ${
                          statusFilter === tab
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {tab === "all" ? "Tất cả" : STATUS_CONFIG[tab].label}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Thông tin Club</th>
                  <th className="px-6 py-4">Người gửi</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableSkeleton rows={5} cols={5} />
                ) : filteredRequests.length === 0 ? (
                  <EmptyState />
                ) : (
                  currentItems.map((request) => (
                    <tr
                      key={request.id}
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                            {request.clubName || "Chưa đặt tên"}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            #{request.clubId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                            {request.submittedByName?.[0] || "?"}
                          </div>
                          <div>
                            <div className="font-medium text-slate-700">
                              {request.submittedByName || "Ẩn danh"}
                            </div>
                            <div className="text-xs text-slate-400">
                              ID: {request.submittedById}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-500">
                        {formatDate(request.submittedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* UPDATE: Removed opacity-0 and group-hover classes.
                           Buttons are now always visible.
                        */}
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                          >
                            <Eye size={14} />
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && filteredRequests.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
              <p className="text-sm text-slate-500">
                Hiển thị{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min(
                    filteredRequests.length,
                    (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1
                  )}
                </span>
                {" - "}
                <span className="font-semibold text-slate-900">
                  {Math.min(
                    filteredRequests.length,
                    safeCurrentPage * ITEMS_PER_PAGE
                  )}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-semibold text-slate-900">
                  {totalCount}
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={safeCurrentPage === 1}
                  className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, safeCurrentPage - 3),
                    Math.min(pageCount, safeCurrentPage + 2)
                  )
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] rounded-lg border px-3 py-1 text-sm font-medium transition-colors ${
                        page === safeCurrentPage
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(pageCount, prev + 1))
                  }
                  disabled={safeCurrentPage === pageCount}
                  className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {selectedRequest && (
        <DetailModal
          request={selectedRequest}
          isOpen={!!selectedRequest}
          onClose={closeModal}
          onDecide={(mode: ClubCreationRequestStatus) => {
            setDecisionMode(mode);
            setDecisionNote("");
          }}
          decisionMode={decisionMode}
          decisionNote={decisionNote}
          setDecisionNote={setDecisionNote}
          onSubmitDecision={handleDecisionSubmit}
          isSubmitting={isSubmittingDecision}
          onCancelDecision={() => {
            setDecisionMode(null);
            setDecisionNote("");
          }}
        />
      )}
    </div>
  );
};

// --- Sub-Components ---

const StatCard = ({ label, value, icon: Icon, color, isActive }: any) => {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white p-5 transition-all ${
        isActive
          ? "ring-2 ring-orange-100 border-orange-200 shadow-md"
          : "border-slate-100 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className={`rounded-xl p-3 ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: ClubCreationRequestStatus }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${config.color}`}
    >
      <Icon size={12} className="stroke-[2.5]" />
      {config.label}
    </span>
  );
};

const EmptyState = () => (
  <tr>
    <td colSpan={5} className="py-24 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="rounded-full bg-slate-50 p-4 mb-3">
          <Search className="h-8 w-8 text-slate-300" />
        </div>
        <p className="text-base font-semibold text-slate-900">
          Không tìm thấy dữ liệu
        </p>
        <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
          Không có yêu cầu nào khớp với bộ lọc hiện tại của bạn. Hãy thử thay
          đổi từ khóa hoặc bộ lọc trạng thái.
        </p>
      </div>
    </td>
  </tr>
);

const TableSkeleton = ({ rows, cols }: { rows: number; cols: number }) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r} className="animate-pulse">
        {Array.from({ length: cols }).map((__, c) => (
          <td key={c} className="px-6 py-4">
            <div className="h-4 w-24 rounded bg-slate-100" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// --- Modal Component ---
const DetailModal = ({
  request,
  isOpen,
  onClose,
  onDecide,
  decisionMode,
  decisionNote,
  setDecisionNote,
  onSubmitDecision,
  isSubmitting,
  onCancelDecision,
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-wider text-orange-500 uppercase">
                Yêu cầu tạo mới
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500 font-mono">
                #{request.id}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {request.clubName ?? "Chưa đặt tên"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <InfoItem
              label="Trưởng nhóm"
              value={request.submittedByName}
              subValue={`ID: ${request.submittedById}`}
            />
            <InfoItem
              label="Thời gian gửi"
              value={formatDate(request.submittedAt)}
            />
            <InfoItem
              label="Mã định danh Club"
              value={`#${request.clubId}`}
              mono
            />
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Trạng thái hiện tại
              </p>
              <StatusBadge status={request.status} />
            </div>
          </div>

          {/* Admin Note if exists */}
          {request.note && (
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <AlertCircle size={12} /> Ghi chú từ hệ thống
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {request.note}
              </p>
            </div>
          )}

          {/* Decision Section */}
          {request.status === "PENDING" && (
            <div
              className={`mt-6 rounded-2xl border transition-all duration-300 overflow-hidden ${
                decisionMode
                  ? decisionMode === "APPROVED"
                    ? "bg-emerald-50/50 border-emerald-100"
                    : "bg-rose-50/50 border-rose-100"
                  : "bg-white border-transparent"
              }`}
            >
              {!decisionMode ? (
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => onDecide("APPROVED")}
                    className="flex-1 group flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:shadow-sm transition-all"
                  >
                    <CheckCircle2
                      size={18}
                      className="group-hover:scale-110 transition-transform"
                    />
                    Phê duyệt Club
                  </button>
                  <button
                    onClick={() => onDecide("REJECTED")}
                    className="flex-1 group flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 hover:shadow-sm transition-all"
                  >
                    <XCircle
                      size={18}
                      className="group-hover:scale-110 transition-transform"
                    />
                    Từ chối
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-bold ${
                        decisionMode === "APPROVED"
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {decisionMode === "APPROVED"
                        ? "Xác nhận duyệt yêu cầu"
                        : "Xác nhận từ chối yêu cầu"}
                    </h4>
                    <button
                      onClick={onCancelDecision}
                      className="text-xs font-medium text-slate-500 hover:underline"
                    >
                      Quay lại
                    </button>
                  </div>

                  <textarea
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder={
                      decisionMode === "APPROVED"
                        ? "Thêm lời nhắn chúc mừng (tùy chọn)..."
                        : "Nhập lý do từ chối (bắt buộc nếu cần)..."
                    }
                    className="w-full rounded-xl border border-white/50 bg-white/80 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 outline-none"
                    rows={3}
                    autoFocus
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={onCancelDecision}
                      disabled={isSubmitting}
                      className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white/50"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={onSubmitDecision}
                      disabled={isSubmitting}
                      className={`inline-flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-bold text-white shadow-sm transition-all ${
                        decisionMode === "APPROVED"
                          ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                          : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
                      } disabled:opacity-70`}
                    >
                      {isSubmitting && (
                        <RefreshCcw size={14} className="animate-spin" />
                      )}
                      {decisionMode === "APPROVED"
                        ? "Duyệt ngay"
                        : "Từ chối ngay"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, subValue, mono }: any) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
      {label}
    </p>
    <p
      className={`font-semibold text-slate-900 ${
        mono ? "font-mono tracking-tight" : ""
      }`}
    >
      {value || "---"}
    </p>
    {subValue && <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>}
  </div>
);

export default ClubCreationQueue;
