import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { RefreshCcw, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/utils";

import JoinClubModal, {
  type JoinClubForm,
} from "../my-club/components/JoinClubModal";

import {
  getClubsAPI,
  getClubSettingsAPI,
  //{** / getClubSettingsByInviteCodeAPI **/}
  joinClubByInviteCodeAPI,
  getJoinRequestHistoryAPI,
  getMyMembershipsAPI,
  getClubActivitiesAPI,
  // Types
  type ClubSettingInfo,
  type ClubStatus,
  type ClubSummary,
  type ClubJoinRequest,
  type ClubJoinRequestStatus,
  type ClubActivity,
} from "../my-club/services/myClubService";

import ClubCard from "./components/ClubCard";
import ClubActivityModal from "./components/ClubActivityModal";

// ==========================================
// CẤU HÌNH & HELPER TOÀN CỤC
// ==========================================

const CLUBS_PER_PAGE = 8;

/**
 * Kiểm tra xem CLB đã cài đặt đầy đủ thông tin tham gia chưa
 * (Tài khoản ngân hàng, phí tham gia)
 */
const isSettingsComplete = (settings?: ClubSettingInfo | null) =>
  Boolean(
    settings &&
      settings.bankId?.trim() &&
      settings.bankAccountNumber?.trim() &&
      settings.bankAccountName?.trim() &&
      settings.joinFee !== undefined &&
      settings.joinFee !== null
  );

// ==========================================
// COMPONENT CHÍNH: CLUB BROWSER
// ==========================================

const ClubBrowser = () => {
  const { user } = useAuth();

  // ------------------------------------------
  // 1. QUẢN LÝ STATE (TRẠNG THÁI)
  // ------------------------------------------

  // A. Dữ liệu chính (Danh sách CLB & Maps dữ liệu kèm theo)
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  
  // Lưu trữ trạng thái tham gia, cài đặt, và hoạt động theo ID của CLB
  const [joinStatusMap, setJoinStatusMap] = useState<Record<number, ClubJoinRequestStatus>>({});
  const [clubSettingsMap, setClubSettingsMap] = useState<Record<number, ClubSettingInfo | null>>({});
  const [activitiesMap, setActivitiesMap] = useState<Record<number, ClubActivity[]>>({});

  // B. Bộ lọc & Phân trang (Filter & Pagination)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClubStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // C. Modal Tham gia (Join Modal)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubSummary | null>(null);
  const [joinForm, setJoinForm] = useState<JoinClubForm>({
    inviteCode: "",
    motivation: "",
  });
  const [isJoining, setIsJoining] = useState(false);
  const [isManualInviteFlow, setIsManualInviteFlow] = useState(false);

  // D. Thông tin thanh toán & Upload (Trong Modal Tham gia)
  const [joinPreview, setJoinPreview] = useState<ClubSettingInfo | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [transferCode, setTransferCode] = useState('');

  // E. Modal Danh sách Hoạt động (Activity Modal)
  const [activitiesModalClubId, setActivitiesModalClubId] = useState<number | null>(null);

  // F. Manual Invite Code (Đã comment - giữ nguyên)
  // const [manualInviteCode, setManualInviteCode] = useState('');
  // const [isResolvingInviteCode, setIsResolvingInviteCode] = useState(false);

  // ------------------------------------------
  // 2. HELPER FUNCTIONS (NỘI BỘ)
  // ------------------------------------------

  // Tạo mã giao dịch ngẫu nhiên cho chuyển khoản
  const createTransferCode = () => {
    let rawCode: string;
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      rawCode = crypto.randomUUID();
    } else {
      rawCode = `JOIN${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 10)}`.toUpperCase();
    }
    return rawCode.replace(/-/g, '');
  };

  // Kiểm tra user hiện tại có phải Leader không
  const isLeaderOfClub = (club?: Pick<ClubSummary, "leaderId"> | null) =>
    Boolean(club?.leaderId && user?.id && club.leaderId === user.id);

  // Kiểm tra trạng thái tham gia có bị chặn (Đang chờ hoặc Đã tham gia)
  const isJoinStatusBlocked = (status?: ClubJoinRequestStatus) =>
    status === "PENDING" || status === "APPROVED";

  // Lấy trạng thái tham gia của một CLB cụ thể
  const getJoinStatus = (clubId?: number | null) => {
    if (!clubId) return undefined;
    return joinStatusMap[clubId];
  };

  // ------------------------------------------
  // 3. EFFECTS & DATA FETCHING
  // ------------------------------------------

  // Debounce cho thanh tìm kiếm (tránh render liên tục khi gõ)
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim().toLowerCase()),
      300
    );
    return () => clearTimeout(timer);
  }, [search]);

  // Hàm tải dữ liệu CLB (Kèm theo Settings và Activities)
  const fetchClubs = useCallback(async () => {
    try {
      setIsLoadingClubs(true);
      // B1: Lấy danh sách tất cả CLB
      const clubsData = await getClubsAPI("all");
      setClubs(clubsData);

      // B2: Chạy song song (Parallel) lấy Activities và Settings cho từng CLB
      const activitiesPromises = clubsData.map(async (club) => {
        try {
          const acts = await getClubActivitiesAPI(club.id);
          return { clubId: club.id, activities: acts };
        } catch (err) {
          console.warn(`Failed to load activities for club ${club.id}:`, err);
          return { clubId: club.id, activities: [] as ClubActivity[] };
        }
      });

      const settingsPromises = clubsData.map(async (club) => {
        try {
          const setts = await getClubSettingsAPI(club.id);
          return { clubId: club.id, settings: setts };
        } catch (err) {
          console.warn(`Failed to load settings for club ${club.id}:`, err);
          return { clubId: club.id, settings: null };
        }
      });

      // B3: Đợi tất cả request hoàn thành
      const [activitiesResults, settingsResults] = await Promise.all([
        Promise.all(activitiesPromises),
        Promise.all(settingsPromises),
      ]);

      // B4: Cập nhật State Map
      const newActivitiesMap: Record<number, ClubActivity[]> = {};
      activitiesResults.forEach(({ clubId, activities }) => {
        newActivitiesMap[clubId] = activities;
      });
      setActivitiesMap(newActivitiesMap);

      const newSettingsMap: Record<number, ClubSettingInfo | null> = {};
      settingsResults.forEach(({ clubId, settings }) => {
        newSettingsMap[clubId] = settings;
      });
      setClubSettingsMap(newSettingsMap);
    } catch (error) {
      console.error(error);
      showToast("error", "Không thể tải câu lạc bộ.");
    } finally {
      setIsLoadingClubs(false);
    }
  }, []);

  // Hàm tải trạng thái tham gia của User (Lịch sử request & Membership active)
  const fetchJoinStatuses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [history, memberships] = await Promise.all([
        getJoinRequestHistoryAPI("all"),
        getMyMembershipsAPI("ACTIVE"),
      ]);
      const normalizedHistory: ClubJoinRequest[] = Array.isArray(history)
        ? history
        : [];
      const activeMembershipIds = new Set(
        (Array.isArray(memberships) ? memberships : [])
          .map((membership) => membership?.clubId)
          .filter((clubId): clubId is number => typeof clubId === "number")
      );

      const map: Record<number, ClubJoinRequestStatus> = {};
      normalizedHistory.forEach((request) => {
        if (!request?.clubId) return;
        if (request.status === "PENDING") {
          map[request.clubId] = "PENDING";
        } else if (request.status === "APPROVED" && activeMembershipIds.has(request.clubId)) {
          map[request.clubId] = "APPROVED";
        }
      });
      setJoinStatusMap(map);
    } catch (error) {
      console.error(error);
    }
  }, [user?.id]);

  // Kích hoạt fetch dữ liệu lần đầu
  useEffect(() => {
    void fetchClubs();
  }, [fetchClubs]);

  useEffect(() => {
    void fetchJoinStatuses();
  }, [fetchJoinStatuses]);

  // ------------------------------------------
  // 4. LOGIC LỌC & PHÂN TRANG (MEMOIZED)
  // ------------------------------------------

  const filteredClubs = useMemo(() => {
    // 1. Lọc cơ bản: Chỉ lấy ACTIVE và đã Cài đặt xong (Settings Complete)
    const visibleClubs = clubs.filter((club) => {
      if (club.status !== "ACTIVE") {
        return false;
      }
      return isSettingsComplete(clubSettingsMap[club.id]);
    });

    return visibleClubs
      // 2. Lọc theo trạng thái (Dropdown filter - nếu có)
      .filter((club) =>
        statusFilter === "all" ? true : club.status === statusFilter
      )
      // 3. Lọc theo từ khóa tìm kiếm
      .filter((club) => {
        if (!debouncedSearch) return true;
        const haystack = `${club.name ?? ""} ${club.code ?? ""} ${
          club.category ?? ""
        }`.toLowerCase();
        return haystack.includes(debouncedSearch);
      })
      // 4. Sắp xếp (Mới nhất lên đầu)
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  }, [clubSettingsMap, clubs, debouncedSearch, statusFilter]);

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  // Cắt danh sách cho trang hiện tại
  const paginatedClubs = filteredClubs.slice(
    (currentPage - 1) * CLUBS_PER_PAGE,
    currentPage * CLUBS_PER_PAGE
  );
  
  const pageCount = Math.max(
    Math.ceil(filteredClubs.length / CLUBS_PER_PAGE),
    1
  );

  // ------------------------------------------
  // 5. XỬ LÝ SỰ KIỆN (HANDLERS)
  // ------------------------------------------

  // (Phần xử lý Manual Invite đã ẩn - giữ nguyên)
  // const handleManualInviteJoin = async () => { ... }

  // Mở modal tham gia CLB
  const openJoinModal = (club: ClubSummary, manual = false) => {
    // Các logic kiểm tra điều kiện (Status, Leader, Blocked...)
    if (club.status !== "ACTIVE") {
      showToast("error", "Câu lạc bộ này chưa mở tham gia.");
      return;
    }
    // if (!manual && !club.inviteCode) { ... }
    if (!manual) {
      const clubSettings = clubSettingsMap[club.id];
      if (!isSettingsComplete(clubSettings)) {
        showToast("error", "Câu lạc bộ này chưa hoàn tất cài đặt tham gia.");
        return;
      }
    }
    if (isLeaderOfClub(club)) {
      showToast("error", "Bạn đang là leader của câu lạc bộ này.");
      return;
    }
    const status = getJoinStatus(club.id);
    if (isJoinStatusBlocked(status)) {
      showToast(
        "error",
        status === "PENDING"
          ? "Bạn đã có yêu cầu đang chờ xử lý."
          : "Bạn đã là thành viên."
      );
      return;
    }

    // Set state để mở modal
    setSelectedClub(club);
    setIsManualInviteFlow(manual);
    setJoinForm({ inviteCode: club.inviteCode ?? "", motivation: "" });
    setJoinPreview(null);
    setPreviewError(null);
    setIsPreviewLoading(false);
    setTransferCode(createTransferCode());
    setIsJoinModalOpen(true);
  };

  // Đóng modal tham gia
  const closeJoinModal = () => {
    setIsJoinModalOpen(false);
    setSelectedClub(null);
    setIsManualInviteFlow(false);
    setJoinPreview(null);
    setPreviewError(null);
    setIsPreviewLoading(false);
    setTransferCode("");
  };

  // Effect: Tải thông tin thanh toán (Settings) khi mở modal
  useEffect(() => {
    if (!isJoinModalOpen || !selectedClub) {
      setJoinPreview(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }
    let cancelled = false;
    setIsPreviewLoading(true);
    setPreviewError(null);
    
    getClubSettingsAPI(selectedClub.id)
      .then((data) => {
        if (cancelled) return;
        setJoinPreview(data);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          setJoinPreview(null);
          setPreviewError("Không thể tải hướng dẫn thanh toán.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isJoinModalOpen, selectedClub]);

  // Gửi yêu cầu tham gia (Submit Form)
  const handleJoinClub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const inviteCode = (
      isManualInviteFlow ? joinForm.inviteCode : selectedClub?.inviteCode
    )?.trim();

    if (!inviteCode) {
      showToast("error", "Câu lạc bộ này không có mã mời.");
      return;
    }
    if (!transferCode) {
      showToast("error", "Không thể tạo mã chuyển khoản.");
      return;
    }

    try {
      setIsJoining(true);
      await joinClubByInviteCodeAPI({
        inviteCode,
        motivation: joinForm.motivation.trim() || undefined,
        transferCode,
      });
      showToast("success", "Yêu cầu tham gia đã được gửi.");
      
      // Cập nhật lại trạng thái local ngay lập tức
      if (selectedClub?.id) {
        setJoinStatusMap((prev) => ({ ...prev, [selectedClub.id]: "PENDING" }));
      }
      closeJoinModal();
    } catch (error) {
      console.error(error);
      showToast("error", "Không thể gửi yêu cầu tham gia.");
    } finally {
      setIsJoining(false);
    }
  };

  // ------------------------------------------
  // 6. RENDER GIAO DIỆN
  // ------------------------------------------

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-10">
      
      {/* --- Header --- */}
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-400">
            Khám phá các câu lạc bộ
          </p>
          {/* <h1 className="text-2xl font-semibold text-slate-900">...</h1> */}
        </div>
      </header>

      {/* --- Stats Section (Đã ẩn) --- */}
      {/* <section>...</section> */}

      {/* --- Manual Invite Section (Đã ẩn) --- */}
      {/* <section className="mt-6">...</section> */}

      {/* --- Search & Filter Section --- */}
      <section className="mt-8">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          
          {/* Thanh công cụ: Tìm kiếm & Refresh */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm kiếm câu lạc bộ theo tên, mã hoặc danh mục..."
                  className="w-full rounded-2xl border border-slate-200 py-2.5 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
              {/* Select Status (Đã ẩn) */}
            </div>
            <button
              type="button"
              onClick={() => void fetchClubs()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500 disabled:opacity-60"
              disabled={isLoadingClubs}
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoadingClubs ? "animate-spin" : ""}`}
              />
              Làm mới
            </button>
          </div>

          {/* Nội dung danh sách (Loading / Empty / List) */}
          {isLoadingClubs ? (
            // Skeleton Loading
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-64 animate-pulse rounded-3xl border border-slate-100 bg-slate-50"
                />
              ))}
            </div>
          ) : paginatedClubs.length === 0 ? (
            // Empty State
            <p className="mt-8 text-center text-sm text-slate-500">
              Không có câu lạc bộ nào phù hợp với bộ lọc của bạn.
            </p>
          ) : (
            // Grid Danh sách CLB
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedClubs.map((club) => {
                // Logic: Kiểm tra hoạt động đang diễn ra (Started & Not Ended)
                const now = new Date();
                const currentActivities = (activitiesMap[club.id] ?? []).filter(
                  (activity) => {
                    const startDate = activity.startDate
                      ? new Date(activity.startDate)
                      : null;
                    const endDate = activity.endDate
                      ? new Date(activity.endDate)
                      : null;
                    const hasStarted = !startDate || startDate <= now;
                    const hasNotEnded = !endDate || endDate >= now;
                    return hasStarted && hasNotEnded;
                  }
                );

                return (
                  <ClubCard
                    key={club.id}
                    club={club}
                    joinStatus={getJoinStatus(club.id)}
                    isLeader={isLeaderOfClub(club)}
                    hasJoinSettings={isSettingsComplete(
                      clubSettingsMap[club.id]
                    )}
                    joinFee={clubSettingsMap[club.id]?.joinFee}
                    hasActiveActivities={currentActivities.length > 0}
                    onJoin={() => openJoinModal(club)}
                    onViewActivities={(id) => setActivitiesModalClubId(id)}
                  />
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoadingClubs && paginatedClubs.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Hiển thị{" "}
                <span className="font-semibold text-slate-900">
                  {(currentPage - 1) * CLUBS_PER_PAGE + 1}-
                  {Math.min(filteredClubs.length, currentPage * CLUBS_PER_PAGE)}
                </span>{" "}
                trong số{" "}
                <span className="font-semibold text-slate-900">
                  {filteredClubs.length}
                </span>{" "}
                câu lạc bộ
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-orange-500 disabled:opacity-40"
                >
                  Trang trước
                </button>
                <div className="text-xs font-semibold text-slate-700">
                  Trang {currentPage} / {pageCount}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(Math.min(pageCount, currentPage + 1))
                  }
                  disabled={currentPage >= pageCount}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-orange-500 disabled:opacity-40"
                >
                  Trang tiếp
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* --- Modal: Form Tham gia --- */}
      {isJoinModalOpen && selectedClub && (
        <JoinClubModal
          form={joinForm}
          isSubmitting={isJoining}
          preview={joinPreview}
          isPreviewLoading={isPreviewLoading}
          previewError={previewError}
          transferCode={transferCode}
          onRefreshTransferCode={() => setTransferCode(createTransferCode())}
          onChange={(field, value) =>
            setJoinForm((prev) => ({ ...prev, [field]: value }))
          }
          onSubmit={handleJoinClub}
          onClose={closeJoinModal}
          modalTitle={`Tham gia ${selectedClub.name}`}
          showInviteCodeInput={isManualInviteFlow}
          // inviteCodeHint={...}
        />
      )}

      {/* --- Modal: Danh sách Hoạt động --- */}
      {activitiesModalClubId !== null && (
        <ClubActivityModal
          club={clubs.find((c) => c.id === activitiesModalClubId) ?? null}
          activities={(() => {
            // Logic lấy activities của CLB đang chọn và filter theo thời gian (giống logic ở trên)
            const club = clubs.find((c) => c.id === activitiesModalClubId);
            const now = new Date();
            return club
              ? (activitiesMap[club.id] ?? []).filter((activity) => {
                  const startDate = activity.startDate
                    ? new Date(activity.startDate)
                    : null;
                  const endDate = activity.endDate
                    ? new Date(activity.endDate)
                    : null;
                  const hasStarted = !startDate || startDate <= now;
                  const hasNotEnded = !endDate || endDate >= now;
                  return hasStarted && hasNotEnded;
                })
              : [];
          })()}
          onClose={() => setActivitiesModalClubId(null)}
        />
      )}
    </div>
  );
};

export default ClubBrowser;