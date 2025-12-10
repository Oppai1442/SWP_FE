import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Layers, RefreshCcw, Search, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/utils';

import JoinClubModal, { type JoinClubForm } from '../my-club/components/JoinClubModal';

import {
  getClubsAPI,
  getClubSettingsAPI,
  getClubSettingsByInviteCodeAPI,
  joinClubByInviteCodeAPI,
  uploadPaymentProofAPI,
  getJoinRequestHistoryAPI,
  getClubActivitiesAPI,
  // Types
  type ClubSettingInfo,
  type ClubStatus,
  type ClubSummary,
  type ClubJoinRequest, // Đã được sử dụng ở dưới
  type ClubJoinRequestStatus,
  type ClubActivity,
} from '../my-club/services/myClubService';

import ClubCard from './components/ClubCard';
import ClubActivityModal from './components/ClubActivityModal';

const CLUBS_PER_PAGE = 8;

// Helper: Kiểm tra settings
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

const ClubBrowser = () => {
  const { user } = useAuth();
  
  // --- STATE ---
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClubStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal tham gia
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubSummary | null>(null);
  const [joinForm, setJoinForm] = useState<JoinClubForm>({ inviteCode: '', motivation: '' });
  const [isJoining, setIsJoining] = useState(false);
  const [isManualInviteFlow, setIsManualInviteFlow] = useState(false);
  
  // Thông tin thanh toán & Upload
  const [joinPreview, setJoinPreview] = useState<ClubSettingInfo | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<{ url: string | null; fileName: string | null }>({
    url: null,
    fileName: null,
  });
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [paymentProofError, setPaymentProofError] = useState<string | null>(null);
  
  // Manual Invite Code
  const [manualInviteCode, setManualInviteCode] = useState('');
  const [isResolvingInviteCode, setIsResolvingInviteCode] = useState(false);
  
  // Data Maps
  const [joinStatusMap, setJoinStatusMap] = useState<Record<number, ClubJoinRequestStatus>>({});
  const [clubSettingsMap, setClubSettingsMap] = useState<Record<number, ClubSettingInfo | null>>({});
  const [activitiesMap, setActivitiesMap] = useState<Record<number, ClubActivity[]>>({});
  
  // Modal Activities
  const [activitiesModalClubId, setActivitiesModalClubId] = useState<number | null>(null);

  // Helper local
  const isLeaderOfClub = (club?: Pick<ClubSummary, 'leaderId'> | null) =>
    Boolean(club?.leaderId && user?.id && club.leaderId === user.id);

  const isJoinStatusBlocked = (status?: ClubJoinRequestStatus) =>
    status === 'PENDING' || status === 'APPROVED';

  const getJoinStatus = (clubId?: number | null) => {
    if (!clubId) return undefined;
    return joinStatusMap[clubId];
  };

  // --- EFFECTS ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch logic đã được đơn giản hóa vì API service tự unwrap data
  const fetchClubs = useCallback(async () => {
    try {
      setIsLoadingClubs(true);
      // API trả về trực tiếp mảng ClubSummary[]
      const clubsData = await getClubsAPI('all');
      setClubs(clubsData);

      // Fetch Activities & Settings song song
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
      // SỬA Ở ĐÂY: Ép kiểu rõ ràng cho normalized để dùng type ClubJoinRequest
      const normalized: ClubJoinRequest[] = Array.isArray(history) ? history : [];
      
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

  // --- FILTERS & PAGINATION ---
  const filteredClubs = useMemo(() => {
    const visibleClubs = clubs.filter((club) => {
      if (club.status !== 'ACTIVE') {
        return false;
      }
      return isSettingsComplete(clubSettingsMap[club.id]);
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

  // --- HANDLERS ---
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
        showToast('error', 'Câu lạc bộ này chưa hoàn tất cài đặt tham gia.');
        return;
      }

      const existing = clubs.find((club) => club.id === settings.clubId);
      const fallbackStatus: ClubStatus = existing?.status ?? (settings.clubStatus ?? 'ACTIVE');
      
      if (fallbackStatus !== 'ACTIVE') {
        showToast('error', 'Câu lạc bộ này chưa mở tham gia.');
        return;
      }

      const fallback: ClubSummary = existing ?? {
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
        showToast('error', status === 'PENDING' ? 'Bạn đã có yêu cầu đang chờ xử lý.' : 'Bạn đã là thành viên.');
        return;
      }
      if (isLeaderOfClub(existing ?? fallback)) {
        showToast('error', 'Bạn đang là leader của câu lạc bộ này.');
        return;
      }

      setClubSettingsMap((prev) => ({ ...prev, [settings.clubId]: settings }));
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
      showToast('error', 'Câu lạc bộ này chưa mở tham gia.');
      return;
    }
    if (!manual && !club.inviteCode) {
      showToast('error', 'Câu lạc bộ này chưa kích hoạt tính năng tham gia bằng mã mời.');
      return;
    }
    if (!manual) {
      const clubSettings = clubSettingsMap[club.id];
      if (!isSettingsComplete(clubSettings)) {
        showToast('error', 'Câu lạc bộ này chưa hoàn tất cài đặt tham gia.');
        return;
      }
    }
    if (isLeaderOfClub(club)) {
      showToast('error', 'Bạn đang là leader của câu lạc bộ này.');
      return;
    }
    const status = getJoinStatus(club.id);
    if (isJoinStatusBlocked(status)) {
      showToast('error', status === 'PENDING' ? 'Bạn đã có yêu cầu đang chờ xử lý.' : 'Bạn đã là thành viên.');
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
        setJoinPreview(data); // Đã unwrap
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          setJoinPreview(null);
          setPreviewError('Không thể tải hướng dẫn thanh toán.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isJoinModalOpen, selectedClub]);

  const handlePaymentProofUpload = useCallback(async (file: File) => {
    if (!selectedClub?.id) {
      showToast('error', 'Chọn một câu lạc bộ trước khi tải lên.');
      return;
    }
    if (!file.type?.startsWith('image/')) {
      showToast('error', 'Bằng chứng thanh toán phải là hình ảnh.');
      return;
    }
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('error', 'File phải dưới 10MB.');
      return;
    }
    try {
      setIsUploadingProof(true);
      setPaymentProofError(null);
      // API uploadPaymentProofAPI trả về StorageObjectInfo có trường url
      const uploaded = await uploadPaymentProofAPI(selectedClub.id, file);
      setPaymentProof({ url: uploaded.url, fileName: file.name });
      showToast('success', 'Đã tải lên bằng chứng thanh toán.');
    } catch (error) {
      console.error(error);
      setPaymentProofError('Không thể tải lên bằng chứng thanh toán.');
      showToast('error', 'Không thể tải lên.');
    } finally {
      setIsUploadingProof(false);
    }
  }, [selectedClub]);

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
      showToast('error', 'Tải lên bằng chứng thanh toán trước khi gửi.');
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

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-10">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-400">Khám phá câu lạc bộ</p>
          <h1 className="text-2xl font-semibold text-slate-900">Duyệt tất cả các câu lạc bộ sinh viên</h1>
          <p className="text-sm text-slate-500">Lọc câu lạc bộ, xem số liệu thống kê và gửi yêu cầu tham gia.</p>
        </div>
      </header>

      {/* <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </section> */}

      <section className="mt-6">
        <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/40 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Bạn đã có mã mời?</p>
              <p className="text-xs text-slate-500">Dán mã vào đây để gửi yêu cầu tham gia ngay cả khi câu lạc bộ không được liệt kê.</p>
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
              Không có câu lạc bộ nào phù hợp với bộ lọc của bạn.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedClubs.map((club) => {
                const now = new Date();
                const currentActivities = (activitiesMap[club.id] ?? []).filter((activity) => {
                  const startDate = activity.startDate ? new Date(activity.startDate) : null;
                  const endDate = activity.endDate ? new Date(activity.endDate) : null;
                  const hasStarted = !startDate || startDate <= now;
                  const hasNotEnded = !endDate || endDate >= now;
                  return hasStarted && hasNotEnded;
                });

                return (
                  <ClubCard
                    key={club.id}
                    club={club}
                    joinStatus={getJoinStatus(club.id)}
                    isLeader={isLeaderOfClub(club)}
                    hasJoinSettings={isSettingsComplete(clubSettingsMap[club.id])}
                    hasActiveActivities={currentActivities.length > 0}
                    onJoin={() => openJoinModal(club)}
                    onViewActivities={(id) => setActivitiesModalClubId(id)}
                  />
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

      {isJoinModalOpen && selectedClub && (
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
      )}

      {activitiesModalClubId !== null && (
        <ClubActivityModal
          club={clubs.find((c) => c.id === activitiesModalClubId) ?? null}
          activities={(() => {
            const club = clubs.find((c) => c.id === activitiesModalClubId);
            const now = new Date();
            return club
              ? (activitiesMap[club.id] ?? []).filter((activity) => {
                  const startDate = activity.startDate ? new Date(activity.startDate) : null;
                  const endDate = activity.endDate ? new Date(activity.endDate) : null;
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
