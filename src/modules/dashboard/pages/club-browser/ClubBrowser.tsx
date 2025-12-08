import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Layers, RefreshCcw, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

import JoinClubModal, { type JoinClubForm } from '../my-club/components/JoinClubModal';
import ClubsTableSection from '../my-club/components/ClubsTableSection';
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
} from '../my-club/services/myClubService';

const CLUBS_PER_PAGE = 8;

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
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải câu lạc bộ.');
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
    return clubs
      .filter((club) => (statusFilter === 'all' ? true : club.status === statusFilter))
      .filter((club) => {
        if (!debouncedSearch) return true;
        const haystack = `${club.name ?? ''} ${club.code ?? ''} ${club.category ?? ''}`.toLowerCase();
        return haystack.includes(debouncedSearch);
      })
      .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  }, [clubs, debouncedSearch, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const paginatedClubs = filteredClubs.slice(
    (currentPage - 1) * CLUBS_PER_PAGE,
    currentPage * CLUBS_PER_PAGE
  );

  const handleManualInviteJoin = async () => {
    const code = manualInviteCode.trim();
    if (!code) {
      toast.error('Nhập mã mời để tiếp tục.');
      return;
    }
    try {
      setIsResolvingInviteCode(true);
      const settings = await getClubSettingsByInviteCodeAPI(code);
      if (!settings?.clubId) {
        toast.error('Không thể giải quyết mã mời này.');
        return;
      }
      const existing = clubs.find((club) => club.id === settings.clubId);
      const fallback: ClubSummary =
        existing ?? {
          id: settings.clubId,
          code: settings.clubCode ?? null,
          inviteCode: code,
          name: settings.clubName ?? 'Club',
          status: 'ACTIVE',
          description: null,
          category: null,
          meetingLocation: null,
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
        toast.error(
          status === 'PENDING'
            ? 'Bạn đã có yêu cầu đang chờ xử lý cho câu lạc bộ này.'
            : 'Bạn đã là thành viên của câu lạc bộ này.'
        );
        return;
      }
      setJoinPreview(settings);
      setPreviewError(null);
      setIsPreviewLoading(false);
      openJoinModal({ ...fallback, inviteCode: code }, true);
      setManualInviteCode('');
    } catch (error) {
      console.error(error);
      toast.error('Không tìm thấy mã mời.');
    } finally {
      setIsResolvingInviteCode(false);
    }
  };

  const openJoinModal = (club: ClubSummary, manual = false) => {
    if (!manual && !club.inviteCode) {
      toast.error('Câu lạc bộ này chưa kích hoạt tính năng tham gia bằng mã mời.');
      return;
    }
    const status = getJoinStatus(club.id);
    if (isJoinStatusBlocked(status)) {
      toast.error(
        status === 'PENDING'
          ? 'You already have a pending request for this club.'
          : 'You are already a member of this club.'
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
        toast.error('Chọn một câu lạc bộ trước khi tải lên bằng chứng thanh toán.');
        return;
      }
      if (!file.type?.startsWith('image/')) {
        toast.error('Bằng chứng thanh toán phải là một hình ảnh.');
        return;
      }
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error('Bằng chứng thanh toán phải dưới 10MB.');
        return;
      }
      try {
        setIsUploadingProof(true);
        setPaymentProofError(null);
        const uploaded = await uploadPaymentProofAPI(selectedClub.id, file);
        setPaymentProof({ url: uploaded.url, fileName: file.name });
        toast.success('Bằng chứng thanh toán đã được tải lên.');
      } catch (error) {
        console.error(error);
        setPaymentProofError('Không thể tải lên bằng chứng thanh toán.');
        toast.error('Không thể tải lên bằng chứng thanh toán.');
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
      toast.error('Câu lạc bộ này không có mã mời.');
      return;
    }
    if (!paymentProof.url) {
      toast.error('Tải lên bằng chứng thanh toán của bạn trước khi gửi.');
      return;
    }
    try {
      setIsJoining(true);
      await joinClubByInviteCodeAPI({
        inviteCode,
        motivation: joinForm.motivation.trim() || undefined,
        paymentProofUrl: paymentProof.url,
      });
      toast.success('Yêu cầu tham gia đã được gửi.');
      if (selectedClub?.id) {
        setJoinStatusMap((prev) => ({ ...prev, [selectedClub.id]: 'PENDING' }));
      }
      closeJoinModal();
    } catch (error) {
      console.error(error);
      toast.error('Không thể gửi yêu cầu tham gia.');
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
        <button
          type="button"
          onClick={() => void fetchClubs()}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-orange-200 hover:text-orange-500"
          disabled={isLoadingClubs}
        >
Refresh</button>
        </button>
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
        <ClubsTableSection
          search={search}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          isLoading={isLoadingClubs}
          clubs={paginatedClubs}
          filteredCount={filteredClubs.length}
          currentPage={currentPage}
        pageCount={Math.max(Math.ceil(filteredClubs.length / CLUBS_PER_PAGE), 1)}
        rowsPerPage={CLUBS_PER_PAGE}
        onPageChange={setCurrentPage}
        renderAction={(club) => (
            (() => {
              const status = getJoinStatus(club.id);
              const isBlocked = isJoinStatusBlocked(status);
              const disabled = !club.inviteCode || isBlocked;
              const label =
                status === 'PENDING' ? 'Đang chờ' : status === 'APPROVED' ? 'Đã tham gia' : 'Tham gia';
              return (
                <button
                  type="button"
                  onClick={() => openJoinModal(club)}
                  disabled={disabled}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    disabled
                      ? 'cursor-not-allowed border-slate-200 text-slate-400'
                      : 'border-orange-200 text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  {label}
                </button>
              );
            })()
          )}
        />
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
    </div>
  );
};

export default ClubBrowser;
