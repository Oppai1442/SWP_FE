import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import {
  CalendarDays,
  Clock3,
  Image as ImageIcon,
  Layers,
  MapPin,
  RefreshCcw,
  Search,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

import JoinClubModal, { type JoinClubForm } from '../my-club/components/JoinClubModal';
import {
  getClubsAPI,
  getClubSettingsAPI,
  getClubSettingsByInviteCodeAPI,
  joinClubByInviteCodeAPI,
  uploadPaymentProofAPI,
  type ClubSettingInfo,
  type ClubStatus,
  type ClubSummary,
  getJoinRequestHistoryAPI,
  type ClubJoinRequest,
  type ClubJoinRequestStatus,
  getClubActivitiesAPI,
  type ClubActivity,
} from '../my-club/services/myClubService';
import { showToast } from '@/utils';

const CLUBS_PER_PAGE = 8;

const STATUS_META: Record<ClubStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Sẵn sàng đón thành viên',
    className: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  },
  PENDING: {
    label: 'Chờ kiểm duyệt',
    className: 'bg-amber-50 text-amber-600 border border-amber-100',
  },
  REJECTED: {
    label: 'Đã bị từ chối',
    className: 'bg-rose-50 text-rose-600 border border-rose-100',
  },
  INACTIVE: {
    label: 'Tạm dừng hoạt động',
    className: 'bg-slate-50 text-slate-600 border border-slate-200',
  },
  ARCHIVED: {
    label: 'Đã lưu trữ',
    className: 'bg-slate-100 text-slate-500 border border-slate-200',
  },
};

const getStatusMeta = (status: ClubStatus) =>
  STATUS_META[status] ?? {
    label: 'Không xác định',
    className: 'bg-slate-50 text-slate-600 border border-slate-200',
  };

const isSettingsComplete = (settings?: ClubSettingInfo | null) =>
  Boolean(
    settings &&
    settings.bankId?.trim() &&
    settings.bankAccountNumber?.trim() &&
    settings.bankAccountName?.trim() &&
    settings.bankTransferNote?.trim() &&
    settings.joinFee !== undefined &&
    settings.joinFee !== null
  );

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật',
};

const formatOperatingDays = (days?: string[] | null) => {
  if (!days || days.length === 0) {
    return null;
  }
  if (days.length === 7) {
    return 'Hoạt động cả tuần';
  }
  return days.map((day) => WEEKDAY_LABELS[day] ?? day).join(', ');
};

const formatOperatingHours = (start?: string | null, end?: string | null) => {
  if (!start || !end) {
    return null;
  }
  return `${start} - ${end}`;
};

const extractArrayResponse = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return ((payload as { data: unknown[] }).data ?? []) as T[];
  }
  return [];
};

const extractValue = <T,>(payload: unknown): T | undefined => {
  if (
    payload &&
    typeof payload === 'object' &&
    Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const ClubBrowser = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClubStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubSummary | null>(null);
  const [joinForm, setJoinForm] = useState<JoinClubForm>({ inviteCode: '', motivation: '' });
  const [isJoining, setIsJoining] = useState(false);
  const [isManualInviteFlow, setIsManualInviteFlow] = useState(false);
  const [joinPreview, setJoinPreview] = useState<ClubSettingInfo | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<{ url: string | null; fileName: string | null }>({
    url: null,
    fileName: null,
  });
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [paymentProofError, setPaymentProofError] = useState<string | null>(null);
  const [manualInviteCode, setManualInviteCode] = useState('');
  const [isResolvingInviteCode, setIsResolvingInviteCode] = useState(false);
  const [joinStatusMap, setJoinStatusMap] = useState<Record<number, ClubJoinRequestStatus>>({});
  const [clubSettingsMap, setClubSettingsMap] = useState<Record<number, ClubSettingInfo | null>>({});
  const [activitiesMap, setActivitiesMap] = useState<Record<number, ClubActivity[]>>({});
  const isLeaderOfClub = (club?: Pick<ClubSummary, 'leaderId'> | null) =>
    Boolean(club?.leaderId && user?.id && club.leaderId === user.id);
  const [activitiesModalClubId, setActivitiesModalClubId] = useState<number | null>(null);

  const isJoinStatusBlocked = (status?: ClubJoinRequestStatus) =>
    status === 'PENDING' || status === 'APPROVED';

  const getJoinStatus = (clubId?: number | null) => {
    if (!clubId) return undefined;
    return joinStatusMap[clubId];
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchClubs = useCallback(async () => {
    try {
      setIsLoadingClubs(true);
      const data = await getClubsAPI('all');
      const normalized = extractArrayResponse<ClubSummary>(data);
      setClubs(normalized);

      const activitiesPromises = normalized.map(async (club) => {
        try {
          const activities = await getClubActivitiesAPI(club.id);
          return {
            clubId: club.id,
            activities: extractArrayResponse<ClubActivity>(activities),
          };
        } catch (err) {
          console.warn(`Failed to load activities for club ${club.id}:`, err);
          return { clubId: club.id, activities: [] as ClubActivity[] };
        }
      });

      const settingsPromises = normalized.map(async (club) => {
        try {
          const settings = await getClubSettingsAPI(club.id);
          return {
            clubId: club.id,
            settings: extractValue<ClubSettingInfo>(settings) ?? null,
          };
        } catch (err) {
          console.warn(`Failed to load settings for club ${club.id}:`, err);
          return { clubId: club.id, settings: null };
        }
      });

      const [activitiesResults, settingsResults] = await Promise.all([
        Promise.all(activitiesPromises),
        Promise.all(settingsPromises),
      ]);

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
      showToast('error', 'Không thể tải câu lạc bộ.');
    } finally {
      setIsLoadingClubs(false);
    }
  }, []);

  const fetchJoinStatuses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const history = await getJoinRequestHistoryAPI('all');
      const normalized = Array.isArray(history) ? (history as ClubJoinRequest[]) : history ?? [];
      const map: Record<number, ClubJoinRequestStatus> = {};
      normalized.forEach((request) => {
        if (!request?.clubId) return;
        if (request.status === 'PENDING' || request.status === 'APPROVED') {
          map[request.clubId] = request.status;
        }
      });
      setJoinStatusMap(map);
    } catch (error) {
      console.error(error);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchClubs();
  }, [fetchClubs]);

  useEffect(() => {
    void fetchJoinStatuses();
  }, [fetchJoinStatuses]);

  const filteredClubs = useMemo(() => {
    const visibleClubs = clubs.filter((club) => {
      if (club.status === 'PENDING') {
        return false;
      }
      if (club.status === 'ACTIVE') {
        return isSettingsComplete(clubSettingsMap[club.id]);
      }
      return true;
    });

    return visibleClubs
      .filter((club) => (statusFilter === 'all' ? true : club.status === statusFilter))
      .filter((club) => {
        if (!debouncedSearch) return true;
        const haystack = `${club.name ?? ''} ${club.code ?? ''} ${club.category ?? ''}`.toLowerCase();
        return haystack.includes(debouncedSearch);
      })
      .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  }, [clubSettingsMap, clubs, debouncedSearch, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const paginatedClubs = filteredClubs.slice(
    (currentPage - 1) * CLUBS_PER_PAGE,
    currentPage * CLUBS_PER_PAGE
  );
  const pageCount = Math.max(Math.ceil(filteredClubs.length / CLUBS_PER_PAGE), 1);

  const handleManualInviteJoin = async () => {
    const code = manualInviteCode.trim();
    if (!code) {
      showToast('error', 'Nhập mã mời để tiếp tục.');
      return;
    }
    try {
      setIsResolvingInviteCode(true);
      const settings = await getClubSettingsByInviteCodeAPI(code);
      if (!settings?.clubId) {
        showToast('error', 'Không thể giải quyết mã mời này.');
        return;
      }
      if (!isSettingsComplete(settings)) {
        showToast('error', 'C?u l?c b? n?y ch?a ho?n t?t c?i ??t tham gia.');
        return;
      }
      const existing = clubs.find((club) => club.id === settings.clubId);
      const fallbackStatus: ClubStatus =
        existing?.status ?? (settings.clubStatus ?? 'ACTIVE');
      if (fallbackStatus !== 'ACTIVE') {
        showToast('error', 'CA›u l §­c b ¯T nAÿy ch’øa mA¼A tham gia.');
        return;
      }
      const fallback: ClubSummary =
        existing ?? {
          id: settings.clubId,
          code: settings.clubCode ?? null,
          inviteCode: code,
          name: settings.clubName ?? 'Club',
          status: fallbackStatus,
          description: null,
          category: null,
          meetingLocation: null,
          operatingDays: null,
          operatingStartTime: null,
          operatingEndTime: null,
          mission: null,
          foundedDate: null,
          memberCount: null,
          advisorId: null,
          advisorName: null,
          presidentId: null,
          presidentName: null,
          leaderId: null,
          leaderName: null,
          createdAt: null,
          updatedAt: null,
        };
      const status = getJoinStatus(fallback.id);
      if (isJoinStatusBlocked(status)) {
        showToast('error',
          status === 'PENDING'
            ? 'Bạn đã có yêu cầu đang chờ xử lý cho câu lạc bộ này.'
            : 'Bạn đã là thành viên của câu lạc bộ này.'
        );
        return;
      }
      if (isLeaderOfClub(existing ?? fallback)) {
        showToast('error', 'Bạn đang là leader của câu lạc bộ này.');
        return;
      }
      setClubSettingsMap((prev) => ({
        ...prev,
        [settings.clubId]: settings,
      }));
      setJoinPreview(settings);
      setPreviewError(null);
      setIsPreviewLoading(false);
      openJoinModal({ ...fallback, inviteCode: code }, true);
      setManualInviteCode('');
    } catch (error) {
      console.error(error);
      showToast('error', 'Không tìm thấy mã mời.');
    } finally {
      setIsResolvingInviteCode(false);
    }
  };


  const openJoinModal = (club: ClubSummary, manual = false) => {
    if (club.status !== 'ACTIVE') {
      showToast('error', 'C?u l?c b? n?y ch?a m? tham gia.');
      return;
    }
    if (!manual && !club.inviteCode) {
      showToast('error', 'C?u l?c b? n?y ch?a k?ch ho?t t?nh n?ng tham gia b?ng m? m?i.');
      return;
    }
    if (!manual) {
      const clubSettings = clubSettingsMap[club.id];
      if (!isSettingsComplete(clubSettings)) {
        showToast('error', 'C?u l?c b? n?y ch?a ho?n t?t c?i ??t tham gia.');
        return;
      }
    }
    if (isLeaderOfClub(club)) {
      showToast('error', 'B?n ?ang l? leader c?a c?u l?c b? n?y.');
      return;
    }
    const status = getJoinStatus(club.id);
    if (isJoinStatusBlocked(status)) {
      showToast('error',
        status === 'PENDING'
          ? 'B?n ?? c? y?u c?u ?ang ch? x? l? cho c?u l?c b? n?y.'
          : 'B?n ?? l? th?nh vi?n c?a c?u l?c b? n?y.'
      );
      return;
    }
    setSelectedClub(club);
    setIsManualInviteFlow(manual);
    setJoinForm({ inviteCode: club.inviteCode ?? '', motivation: '' });
    setJoinPreview(null);
    setPreviewError(null);
    setIsPreviewLoading(false);
    setPaymentProof({ url: null, fileName: null });
    setPaymentProofError(null);
    setIsJoinModalOpen(true);
  };

  const closeJoinModal = () => {
    setIsJoinModalOpen(false);
    setSelectedClub(null);
    setIsManualInviteFlow(false);
    setJoinPreview(null);
    setPreviewError(null);
    setIsPreviewLoading(false);
    setPaymentProof({ url: null, fileName: null });
    setPaymentProofError(null);
  };

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
        setJoinPreview(extractValue<ClubSettingInfo>(data) ?? null);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          setJoinPreview(null);
          setPreviewError('Không thể tải hướng dẫn thanh toán.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsPreviewLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isJoinModalOpen, selectedClub]);

  const handlePaymentProofUpload = useCallback(
    async (file: File) => {
      if (!selectedClub?.id) {
        showToast('error', 'Chọn một câu lạc bộ trước khi tải lên bằng chứng thanh toán.');
        return;
      }
      if (!file.type?.startsWith('image/')) {
        showToast('error', 'Bằng chứng thanh toán phải là một hình ảnh.');
        return;
      }
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        showToast('error', 'Bằng chứng thanh toán phải dưới 10MB.');
        return;
      }
      try {
        setIsUploadingProof(true);
        setPaymentProofError(null);
        const uploaded = await uploadPaymentProofAPI(selectedClub.id, file);
        setPaymentProof({ url: uploaded.url, fileName: file.name });
        showToast('success', 'Bằng chứng thanh toán đã được tải lên.');
      } catch (error) {
        console.error(error);
        setPaymentProofError('Không thể tải lên bằng chứng thanh toán.');
        showToast('error', 'Không thể tải lên bằng chứng thanh toán.');
      } finally {
        setIsUploadingProof(false);
      }
    },
    [selectedClub]
  );

  const handleRemovePaymentProof = () => {
    setPaymentProof({ url: null, fileName: null });
    setPaymentProofError(null);
  };

  const handleJoinClub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const inviteCode = (isManualInviteFlow ? joinForm.inviteCode : selectedClub?.inviteCode)?.trim();
    if (!inviteCode) {
      showToast('error', 'Câu lạc bộ này không có mã mời.');
      return;
    }
    if (!paymentProof.url) {
      showToast('error', 'Tải lên bằng chứng thanh toán của bạn trước khi gửi.');
      return;
    }
    try {
      setIsJoining(true);
      await joinClubByInviteCodeAPI({
        inviteCode,
        motivation: joinForm.motivation.trim() || undefined,
        paymentProofUrl: paymentProof.url,
      });
      showToast('success', 'Yêu cầu tham gia đã được gửi.');
      if (selectedClub?.id) {
        setJoinStatusMap((prev) => ({ ...prev, [selectedClub.id]: 'PENDING' }));
      }
      closeJoinModal();
    } catch (error) {
      console.error(error);
      showToast('error', 'Không thể gửi yêu cầu tham gia.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-10">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-400">Khám phá câu lạc bộ</p>
          <h1 className="text-2xl font-semibold text-slate-900">Duyệt tất cả các câu lạc bộ sinh viên</h1>
          <p className="text-sm text-slate-500">Lọc câu lạc bộ, xem số liệu thống kê và gửi yêu cầu tham gia trực tiếp từ danh sách này.</p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
          <div className="text-sm text-slate-500">Tổng số câu lạc bộ</div>
          <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <Layers className="h-5 w-5 text-orange-400" />
            {clubs.length}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
          <div className="text-sm text-slate-500">Câu lạc bộ đang hoạt động</div>
          <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-emerald-600">
            <Users className="h-5 w-5 text-emerald-400" />
            {clubs.filter((club) => club.status === 'ACTIVE').length}
          </p>
        </div>
      </section>

      <section className="mt-6">
        <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/40 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Bạn đã có mã mời?</p>
              <p className="text-xs text-slate-500">Dán mã vào đây để gửi yêu cầu tham gia ngay cả khi câu lạc bộ không được liệt kê ở trên.</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <input
                type="text"
                value={manualInviteCode}
                onChange={(event) => setManualInviteCode(event.target.value)}
                placeholder="Nhập mã mời"
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                disabled={isResolvingInviteCode}
              />
              <button
                type="button"
                onClick={handleManualInviteJoin}
                disabled={isResolvingInviteCode}
                className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResolvingInviteCode ? 'Đang kiểm tra...' : 'Tham gia bằng mã'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
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
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ClubStatus | 'all')}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-52"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="REJECTED">Bị từ chối</option>
                <option value="INACTIVE">Không hoạt động</option>
                <option value="ARCHIVED">Đã lưu trữ</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => void fetchClubs()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500 disabled:opacity-60"
              disabled={isLoadingClubs}
            >
              <RefreshCcw className={`h-4 w-4 ${isLoadingClubs ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {isLoadingClubs ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  className="h-64 animate-pulse rounded-3xl border border-slate-100 bg-slate-50"
                />
              ))}
            </div>
          ) : paginatedClubs.length === 0 ? (
            <p className="mt-8 text-center text-sm text-slate-500">
              Không có câu lạc bộ nào phù hợp với bộ lọc của bạn. Thử điều chỉnh tìm kiếm hoặc bộ lọc trạng thái.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedClubs.map((club) => {

                const requestStatus = getJoinStatus(club.id);
                const isBlocked = isJoinStatusBlocked(requestStatus);
                const isLeader = isLeaderOfClub(club);
                const clubSettings = clubSettingsMap[club.id];
                const hasJoinSettings = isSettingsComplete(clubSettings);
                const isJoinableStatus = club.status === 'ACTIVE';
                const hasInvite = Boolean(club.inviteCode);
                const disabled =
                  !hasInvite || isBlocked || isLeader || !isJoinableStatus || (isJoinableStatus && !hasJoinSettings);
                const label = isLeader
                  ? 'Bạn là leader'
                  : requestStatus === 'PENDING'
                    ? 'Đang chờ'
                    : requestStatus === 'APPROVED'
                      ? 'Đã tham gia'
                      : !isJoinableStatus
                        ? 'Chưa mở tham gia'
                        : !hasInvite
                          ? 'Chưa có mã mời'
                          : !hasJoinSettings
                            ? 'Chưa hoàn tất cài đặt'
                            : 'Tham gia câu lạc bộ';
                const statusMeta = getStatusMeta(club.status);
                const scheduleDays = formatOperatingDays(club.operatingDays);
                const scheduleHours = formatOperatingHours(club.operatingStartTime, club.operatingEndTime);

                return (
                  <div
                    key={club.id}
                    className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
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
                          #{club.code ?? 'CHƯA ĐƯỢC LIỆT KÊ'}
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
                            {club.leaderName ?? 'Chưa được chỉ định'}
                          </span>
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                          {club.category ?? 'Chung'}
                        </span>
                      </div>
                      {(() => {
                        const now = new Date();
                        const currentActivities = (activitiesMap[club.id] ?? []).filter((activity) => {
                          const startDate = activity.startDate ? new Date(activity.startDate) : null;
                          const endDate = activity.endDate ? new Date(activity.endDate) : null;
                          const hasStarted = !startDate || startDate <= now;
                          const hasNotEnded = !endDate || endDate >= now;
                          return hasStarted && hasNotEnded;
                        });
                        const hasCurrent = currentActivities.length > 0;
                        return (
                          <div className="mt-4 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setActivitiesModalClubId(club.id)}
                              disabled={!hasCurrent}
                              className={`inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-semibold transition ${!hasCurrent
                                ? 'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                              Hoạt động
                            </button>
                            <button
                              type="button"
                              onClick={() => openJoinModal(club)}
                              disabled={disabled}
                              className={`ml-auto inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition ${disabled
                                ? 'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400'
                                : 'border border-orange-200 bg-white text-orange-500 hover:bg-orange-50'
                                }`}
                            >
                              {label}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoadingClubs && paginatedClubs.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Hiển thị{' '}
                <span className="font-semibold text-slate-900">
                  {(currentPage - 1) * CLUBS_PER_PAGE + 1}-{Math.min(filteredClubs.length, currentPage * CLUBS_PER_PAGE)}
                </span>{' '}
                trong số <span className="font-semibold text-slate-900">{filteredClubs.length}</span> câu lạc bộ
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
                  onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
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


      {
        isJoinModalOpen && selectedClub && (
          <JoinClubModal
            form={joinForm}
            isSubmitting={isJoining}
            preview={joinPreview}
            isPreviewLoading={isPreviewLoading}
            previewError={previewError}
            paymentProofUrl={paymentProof.url}
            paymentProofFileName={paymentProof.fileName}
            isUploadingProof={isUploadingProof}
            proofError={paymentProofError}
            allowUpload={Boolean(selectedClub)}
            onUploadProof={handlePaymentProofUpload}
            onRemoveProof={handleRemovePaymentProof}
            onChange={(field, value) => setJoinForm((prev) => ({ ...prev, [field]: value }))}
            onSubmit={handleJoinClub}
            onClose={closeJoinModal}
            modalTitle={`Tham gia ${selectedClub.name}`}
            showInviteCodeInput={isManualInviteFlow}
            inviteCodeHint={
              isManualInviteFlow
                ? 'Cung cấp mã mời bạn nhận được từ trưởng nhóm câu lạc bộ.'
                : 'Mã mời được xử lý tự động cho yêu cầu này.'
            }
          />
        )
      }
      {activitiesModalClubId !== null && (
        (() => {
          const club = clubs.find((c) => c.id === activitiesModalClubId) ?? null;
          const now = new Date();
          const activities = club ? (activitiesMap[club.id] ?? []).filter((activity) => {
            const startDate = activity.startDate ? new Date(activity.startDate) : null;
            const endDate = activity.endDate ? new Date(activity.endDate) : null;
            const hasStarted = !startDate || startDate <= now;
            const hasNotEnded = !endDate || endDate >= now;
            return hasStarted && hasNotEnded;
          }) : [];
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setActivitiesModalClubId(null)} />
              <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Hoạt động cho {club?.name ?? 'Câu lạc bộ'}</h3>
                    <p className="mt-1 text-sm text-slate-500">Các hoạt động đang diễn ra</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivitiesModalClubId(null)}
                    className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-sm"
                  >
                    Đóng
                  </button>
                </div>
                <div className="mt-4 space-y-3">
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
                            {/* Title */}
                            <div className="text-base font-semibold text-slate-900">
                              {activity.title}
                            </div>

                            {/* Description */}
                            {activity.description && (
                              <div className="text-sm text-slate-600">
                                {activity.description}
                              </div>
                            )}
                          </div>

                          {/* Date Info */}
                          <div className="text-xs text-right text-slate-500 space-y-1">
                            {activity.startDate && (
                              <div>Bắt đầu: {new Date(activity.startDate).toLocaleString()}</div>
                            )}
                            {activity.endDate && (
                              <div>Kết thúc: {new Date(activity.endDate).toLocaleString()}</div>
                            )}
                          </div>
                        </div>

                        {/* Location Highlight */}
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
        })()
      )}
    </div >
  );
};

export default ClubBrowser;
