import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image,
  Layers,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  Users,
  Users2,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  createClubAPI,
  createClubActivityAPI,
  getClubActivitiesAPI,
  getClubJoinRequestsAPI,
  getClubsAPI,
  getClubDetailAPI,
  getClubMembersAPI,
  getClubSettingsAPI,
  getClubSettingsByInviteCodeAPI,
  getJoinRequestHistoryAPI,
  joinClubByInviteCodeAPI,
  refreshInviteCodeAPI,
  reviewClubJoinRequestAPI,
  updateClubSettingsAPI,
  uploadPaymentProofAPI,
  type ClubDetail,
  type ClubJoinRequest,
  type ClubJoinRequestStatus,
  type ClubMember,
  type ClubActivity,
  type ClubActivityStatus,
  type ClubSettingInfo,
  type ClubStatus,
  type ClubSummary,
} from './services/myClubService';
import SummaryCard from './components/SummaryCard';
import LoadingRows from './components/LoadingRows';
import CreateClubModal, { type CreateClubForm } from './components/CreateClubModal';
import JoinClubModal, { type JoinClubForm } from './components/JoinClubModal';
import { buildVietQrUrl, formatDate, formatDateTime, formatJoinFeeValue } from './utils';
import {
  getClubCreationRequestsAPI,
  type ClubCreationRequest,
  type ClubCreationRequestStatus,
} from '../club-queue/services/clubCreationQueueService';
import type { BankInstructionForm } from './types';

const CLUBS_PER_PAGE = 6;
const clubStatusClasses: Record<ClubStatus, string> = {
  ACTIVE: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  PENDING: 'text-amber-600 bg-amber-50 border-amber-200',
  REJECTED: 'text-rose-600 bg-rose-50 border-rose-200',
  INACTIVE: 'text-slate-600 bg-slate-50 border-slate-200',
  ARCHIVED: 'text-slate-500 bg-slate-100 border-slate-200',
};

const requestStatusMeta: Record<
  ClubCreationRequestStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Pending',
    className: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  APPROVED: {
    label: 'Approved',
    className: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'text-rose-600 bg-rose-50 border-rose-200',
  },
};

const joinRequestStatusMeta: Record<
  ClubJoinRequestStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Pending',
    className: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  APPROVED: {
    label: 'Approved',
    className: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'text-rose-600 bg-rose-50 border-rose-200',
  },
};

const activityStatusMeta: Record<
  ClubActivityStatus,
  { label: string; className: string }
> = {
  PLANNING: {
    label: 'Planning',
    className: 'text-slate-600 bg-slate-100 border-slate-200',
  },
  APPROVED: {
    label: 'Approved',
    className: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'text-rose-600 bg-rose-50 border-rose-200',
  },
};

const detailTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'activities', label: 'Activities' },
  { id: 'requests', label: 'Join requests' },
  { id: 'settings', label: 'Settings' },
] as const;

type DetailTab = (typeof detailTabs)[number]['id'];

const ACTIVITY_FORM_DEFAULT = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  location: '',
  budget: '',
  status: 'PLANNING' as ClubActivityStatus,
};

type ActivityFormState = typeof ACTIVITY_FORM_DEFAULT;

const MyClubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [clubStatusFilter, setClubStatusFilter] = useState<ClubStatus | 'all'>('all');
  const [clubSearch, setClubSearch] = useState('');
  const [debouncedClubSearch, setDebouncedClubSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);

  const [requests, setRequests] = useState<ClubCreationRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestFilter, setRequestFilter] = useState<ClubCreationRequestStatus | 'all'>('all');
  const [requestSearch, setRequestSearch] = useState('');
  const [debouncedRequestSearch, setDebouncedRequestSearch] = useState('');

  const [selectedClub, setSelectedClub] = useState<ClubDetail | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [clubDetailCache, setClubDetailCache] = useState<Record<number, ClubDetail>>({});
  const [membersCache, setMembersCache] = useState<Record<number, ClubMember[]>>({});
  const [settingsCache, setSettingsCache] = useState<Record<number, ClubSettingInfo>>({});
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateClubForm>({
    name: '',
    description: '',
    category: '',
    meetingLocation: '',
    mission: '',
    foundedDate: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinForm, setJoinForm] = useState<JoinClubForm>({
    inviteCode: '',
    motivation: '',
  });
  const [isJoining, setIsJoining] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankId: '',
    bankAccountNumber: '',
    bankAccountName: '',
    bankTransferNote: '',
    joinFee: '',
  });
  const [isSavingBankSettings, setIsSavingBankSettings] = useState(false);
  const [joinPreview, setJoinPreview] = useState<ClubSettingInfo | null>(null);
  const [isJoinPreviewLoading, setIsJoinPreviewLoading] = useState(false);
  const [joinPreviewError, setJoinPreviewError] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<{
    url: string | null;
    fileName: string | null;
    clubId: number | null;
  }>({
    url: null,
    fileName: null,
    clubId: null,
  });
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [paymentProofError, setPaymentProofError] = useState<string | null>(null);
  const [joinQueueCache, setJoinQueueCache] = useState<Record<number, ClubJoinRequest[]>>({});
  const [isJoinQueueLoading, setIsJoinQueueLoading] = useState(false);
  const [joinQueueFilter, setJoinQueueFilter] = useState<ClubJoinRequestStatus | 'all'>('PENDING');
  const [joinQueueDecisionMap, setJoinQueueDecisionMap] = useState<Record<number, boolean>>({});
  const [myJoinRequests, setMyJoinRequests] = useState<ClubJoinRequest[]>([]);
  const [isLoadingJoinHistory, setIsLoadingJoinHistory] = useState(false);
  const [joinHistoryFilter, setJoinHistoryFilter] = useState<ClubJoinRequestStatus | 'all'>('all');
  const [activitiesCache, setActivitiesCache] = useState<Record<number, ClubActivity[]>>({});
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
  const [activityForm, setActivityForm] = useState(ACTIVITY_FORM_DEFAULT);
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedClubSearch(clubSearch.trim().toLowerCase());
    }, 350);
    return () => clearTimeout(timer);
  }, [clubSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRequestSearch(requestSearch.trim().toLowerCase());
    }, 350);
    return () => clearTimeout(timer);
  }, [requestSearch]);

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingRequests(true);
      const data = await getClubCreationRequestsAPI();
      const normalized = Array.isArray((data as any)?.data) ? (data as any).data : data;
      const mine = (normalized ?? []).filter(
        (request: ClubCreationRequest) => request.submittedById === user.id
      );
      setRequests(mine);
    } catch (error) {
      console.error(error);
      toast.error('Unable to load your club requests.');
    } finally {
      setIsLoadingRequests(false);
    }
  }, [user?.id]);

const fetchJoinHistory = useCallback(
    async (status: ClubJoinRequestStatus | 'all' = 'all') => {
      if (!user?.id) return;
      try {
        setIsLoadingJoinHistory(true);
        const data = await getJoinRequestHistoryAPI(status);
        const mine = (data ?? []).filter(
          (request: ClubJoinRequest) => request.applicantId === user.id
        );
        setMyJoinRequests(mine);
      } catch (error) {
        console.error(error);
        toast.error('Unable to load your join requests.');
      } finally {
        setIsLoadingJoinHistory(false);
      }
    },
  [user?.id]
);

  const fetchActivities = useCallback(async (clubId: number) => {
    if (!clubId) return;
    try {
      setIsActivitiesLoading(true);
      const data = await getClubActivitiesAPI(clubId);
      setActivitiesCache((prev) => ({ ...prev, [clubId]: data ?? [] }));
    } catch (error) {
      console.error(error);
      toast.error('Unable to load club activities.');
    } finally {
      setIsActivitiesLoading(false);
    }
  }, []);
  const fetchClubs = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingClubs(true);
      const data = await getClubsAPI('all');
      const normalized = Array.isArray((data as any)?.data) ? (data as any).data : data;
      const mine = (normalized ?? []).filter((club: ClubSummary) => {
        return club.presidentId === user.id || club.advisorId === user.id;
      });
      setClubs(mine);
    } catch (error) {
      console.error(error);
      toast.error('Unable to load your clubs.');
    } finally {
      setIsLoadingClubs(false);
    }
  }, [user?.id]);

  const fetchJoinQueue = useCallback(async (clubId: number) => {
    if (!clubId) return;
    try {
      setIsJoinQueueLoading(true);
      const data = await getClubJoinRequestsAPI(clubId);
      setJoinQueueCache((prev) => ({ ...prev, [clubId]: data }));
    } catch (error) {
      console.error(error);
      toast.error('Unable to load join requests.');
    } finally {
      setIsJoinQueueLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchClubs(), fetchRequests(), fetchJoinHistory()]);
  }, [fetchClubs, fetchRequests, fetchJoinHistory]);

  const canManageClub = useCallback(
    (club?: { advisorId?: number | null; presidentId?: number | null }) => {
      if (!club || !user) return false;
      const roleName = user.role?.name ?? '';
      if (roleName === 'ROLE_ADMIN' || roleName === 'ROLE_STAFF') {
        return true;
      }
      return club.presidentId === user.id || club.advisorId === user.id;
    },
    [user]
  );

  const handleRefreshInviteCode = useCallback(async (clubId: number) => {
    try {
      const updated = await refreshInviteCodeAPI(clubId);
      setClubDetailCache((prev) => ({ ...prev, [clubId]: updated }));
      setSelectedClub(updated);
      setClubs((prev) =>
        prev.map((club) =>
          club.id === clubId ? { ...club, inviteCode: updated.inviteCode ?? club.inviteCode } : club
        )
      );
      toast.success('Invite code refreshed.');
    } catch (error) {
      console.error(error);
      toast.error('Unable to refresh invite code.');
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void refreshAll();
  }, [user?.id, refreshAll]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchJoinHistory();
  }, [user?.id, fetchJoinHistory]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchJoinHistory(joinHistoryFilter);
  }, [joinHistoryFilter, user?.id, fetchJoinHistory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [clubStatusFilter, debouncedClubSearch]);

  const filteredClubs = useMemo(() => {
    return clubs
      .filter((club) => (clubStatusFilter === 'all' ? true : club.status === clubStatusFilter))
      .filter((club) => {
        if (!debouncedClubSearch) return true;
        const haystack = `${club.name ?? ''} ${club.code ?? ''} ${club.category ?? ''}`.toLowerCase();
        return haystack.includes(debouncedClubSearch);
      })
      .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  }, [clubs, clubStatusFilter, debouncedClubSearch]);

  const clubPageCount = Math.max(Math.ceil(filteredClubs.length / CLUBS_PER_PAGE), 1);
  const paginatedClubs = filteredClubs.slice(
    (currentPage - 1) * CLUBS_PER_PAGE,
    currentPage * CLUBS_PER_PAGE
  );

  const filteredRequests = useMemo(() => {
    return requests
      .filter((request) => (requestFilter === 'all' ? true : request.status === requestFilter))
      .filter((request) => {
        if (!debouncedRequestSearch) return true;
        const haystack = `${request.clubName ?? ''} ${request.note ?? ''}`.toLowerCase();
        return haystack.includes(debouncedRequestSearch);
      })
      .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
  }, [requests, requestFilter, debouncedRequestSearch]);

  const stats = useMemo(() => {
    const activeClubs = clubs.filter((club) => club.status === 'ACTIVE').length;
    const pendingRequests = requests.filter((req) => req.status === 'PENDING').length;
    const rejectedRequests = requests.filter((req) => req.status === 'REJECTED').length;
    return {
      totalClubs: clubs.length,
      activeClubs,
      pendingRequests,
      rejectedRequests,
    };
  }, [clubs, requests]);

  const selectedClubMembers = selectedClub ? membersCache[selectedClub.id] ?? [] : [];
  const selectedClubSettings = selectedClub ? settingsCache[selectedClub.id] : undefined;
  const membersVisible = selectedClubSettings?.allowWaitlist ?? true;
  const selectedClubCanManage = selectedClub ? canManageClub(selectedClub) : false;
  const selectedClubJoinRequests = selectedClub ? joinQueueCache[selectedClub.id] ?? [] : [];
  const selectedClubActivities = selectedClub ? activitiesCache[selectedClub.id] ?? [] : [];
  const filteredJoinRequests = useMemo(() => {
    if (joinQueueFilter === 'all') {
      return selectedClubJoinRequests;
    }
    return selectedClubJoinRequests.filter((request) => request.status === joinQueueFilter);
  }, [selectedClubJoinRequests, joinQueueFilter]);

  const joinedClubs = useMemo(() => {
    const approved = myJoinRequests.filter((request) => request.status === 'APPROVED');
    const uniqueMap = new Map<number, ClubJoinRequest>();
    approved.forEach((request) => {
      if (request.clubId && !uniqueMap.has(request.clubId)) {
        uniqueMap.set(request.clubId, request);
      }
    });
    return Array.from(uniqueMap.values());
  }, [myJoinRequests]);

  const filteredJoinHistory = useMemo(() => {
    const base =
      joinHistoryFilter === 'all'
        ? myJoinRequests
        : myJoinRequests.filter((request) => request.status === joinHistoryFilter);
    return [...base].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [myJoinRequests, joinHistoryFilter]);

  useEffect(() => {
    if (!selectedClub) {
      setBankForm({
        bankId: '',
        bankAccountNumber: '',
        bankAccountName: '',
        bankTransferNote: '',
        joinFee: '',
      });
      return;
    }
    if (!selectedClubSettings) {
      setBankForm((prev) => ({
        ...prev,
        bankTransferNote: selectedClub.code ?? selectedClub.name ?? '',
      }));
      return;
    }
    setBankForm({
      bankId: selectedClubSettings.bankId ?? '',
      bankAccountNumber: selectedClubSettings.bankAccountNumber ?? '',
      bankAccountName: selectedClubSettings.bankAccountName ?? '',
      bankTransferNote:
        selectedClubSettings.bankTransferNote ??
        selectedClubSettings.clubCode ??
        selectedClubSettings.clubName ??
        '',
      joinFee:
        selectedClubSettings.joinFee !== undefined && selectedClubSettings.joinFee !== null
          ? String(selectedClubSettings.joinFee)
          : '',
    });
  }, [selectedClub, selectedClubSettings]);

  useEffect(() => {
    setJoinQueueFilter('PENDING');
  }, [selectedClub?.id]);

  useEffect(() => {
    if (!isJoinModalOpen) {
      setJoinPreview(null);
      setJoinPreviewError(null);
      setIsJoinPreviewLoading(false);
      return;
    }
    const code = joinForm.inviteCode.trim();
    if (code.length < 6) {
      setJoinPreview(null);
      setJoinPreviewError(null);
      return;
    }
    let cancelled = false;
    setIsJoinPreviewLoading(true);
    getClubSettingsByInviteCodeAPI(code)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setJoinPreview(data);
        setJoinPreviewError(null);
      })
      .catch((error) => {
        console.error(error);
        if (cancelled) return;
        setJoinPreview(null);
        setJoinPreviewError('Invite code not found.');
      })
      .finally(() => {
        if (!cancelled) {
          setIsJoinPreviewLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isJoinModalOpen, joinForm.inviteCode]);

  useEffect(() => {
    setPaymentProof((prev) => {
      if (!joinPreview?.clubId) {
        return { url: null, fileName: null, clubId: null };
      }
      if (prev.clubId && prev.clubId !== joinPreview.clubId) {
        return { url: null, fileName: null, clubId: null };
      }
      return prev;
    });
  }, [joinPreview?.clubId]);

  const openCreateModal = () => {
    setCreateForm({
      name: '',
      description: '',
      category: '',
      meetingLocation: '',
      mission: '',
      foundedDate: '',
    });
    setIsCreateModalOpen(true);
  };

  const openJoinModal = () => {
    setJoinForm({
      inviteCode: '',
      motivation: '',
    });
    setJoinPreview(null);
    setJoinPreviewError(null);
    setIsJoinPreviewLoading(false);
    setPaymentProof({ url: null, fileName: null, clubId: null });
    setPaymentProofError(null);
    setIsJoinModalOpen(true);
  };

  const closeJoinModal = () => {
    setIsJoinModalOpen(false);
    setJoinPreview(null);
    setJoinPreviewError(null);
    setIsJoinPreviewLoading(false);
    setPaymentProof({ url: null, fileName: null, clubId: null });
    setPaymentProofError(null);
  };

  const handlePaymentProofUpload = useCallback(
    async (file: File) => {
      if (!joinPreview?.clubId) {
        toast.error('Enter a valid invite code before uploading evidence.');
        return;
      }
      if (!file.type?.startsWith('image/')) {
        toast.error('Payment evidence must be an image file.');
        return;
      }
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error('Payment evidence must be smaller than 10MB.');
        return;
      }
      try {
        setIsUploadingProof(true);
        setPaymentProofError(null);
        const uploaded = await uploadPaymentProofAPI(joinPreview.clubId, file);
        setPaymentProof({
          url: uploaded.url,
          fileName: file.name,
          clubId: joinPreview.clubId,
        });
        toast.success('Payment evidence uploaded.');
      } catch (error) {
        console.error(error);
        setPaymentProofError('Unable to upload payment evidence.');
        toast.error('Unable to upload payment evidence.');
      } finally {
        setIsUploadingProof(false);
      }
    },
    [joinPreview?.clubId]
  );

  const handleRemovePaymentProof = useCallback(() => {
    setPaymentProof({ url: null, fileName: null, clubId: joinPreview?.clubId ?? null });
    setPaymentProofError(null);
  }, [joinPreview?.clubId]);

  const handleCreateClub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.name.trim()) {
      toast.error('Club name is required.');
      return;
    }

    try {
      setIsCreating(true);
      await createClubAPI({
        ...createForm,
        foundedDate: createForm.foundedDate || null,
        presidentId: user?.id ?? null,
      });
      toast.success('Club request submitted successfully.');
      setIsCreateModalOpen(false);
      await refreshAll();
    } catch (error) {
      console.error(error);
      toast.error('Unable to submit club request.');
    } finally {
      setIsCreating(false);
    }
  };
  const openClubDetails = async (club: Pick<ClubSummary, 'id'> & Partial<ClubSummary>) => {
    if (!club?.id) return;
    try {
      setDetailTab('overview');
      if (!clubDetailCache[club.id]) {
        const detail = await getClubDetailAPI(club.id);
        setClubDetailCache((prev) => ({ ...prev, [club.id]: detail }));
        setSelectedClub(detail);
      } else {
        setSelectedClub(clubDetailCache[club.id]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to load club details.');
    }
  };

  const handleJoinClub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!joinForm.inviteCode.trim()) {
      toast.error('Invite code is required.');
      return;
    }
    if (!joinPreview?.clubId) {
      toast.error('Please enter a valid invite code first.');
      return;
    }
    if (!paymentProof.url) {
      toast.error('Upload your payment evidence before submitting.');
      return;
    }

    try {
      setIsJoining(true);
      await joinClubByInviteCodeAPI({
        inviteCode: joinForm.inviteCode.trim(),
        motivation: joinForm.motivation.trim() || undefined,
        paymentProofUrl: paymentProof.url,
      });
      toast.success('Join request submitted successfully.');
      setIsJoinModalOpen(false);
      setPaymentProof({ url: null, fileName: null, clubId: null });
      await fetchRequests();
    } catch (error) {
      console.error(error);
      toast.error('Unable to submit join request.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleActivityFormChange = useCallback(
    (field: keyof ActivityFormState, value: string) => {
      setActivityForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleCreateActivity = useCallback(async () => {
    if (!selectedClub) return;
    if (!activityForm.title.trim()) {
      toast.error('Activity title is required.');
      return;
    }
    try {
      setIsCreatingActivity(true);
      const payload = {
        title: activityForm.title.trim(),
        description: activityForm.description.trim() || undefined,
        startDate: activityForm.startDate || undefined,
        endDate: activityForm.endDate || undefined,
        location: activityForm.location.trim() || undefined,
        budget: activityForm.budget ? Number(activityForm.budget) : undefined,
        status: activityForm.status,
        createdById: user?.id ?? undefined,
      };
      const created = await createClubActivityAPI(selectedClub.id, payload);
      setActivitiesCache((prev) => ({
        ...prev,
        [selectedClub.id]: [created, ...(prev[selectedClub.id] ?? [])],
      }));
      setActivityForm(ACTIVITY_FORM_DEFAULT);
      toast.success('Activity added.');
    } catch (error) {
      console.error(error);
      toast.error('Unable to create activity.');
    } finally {
      setIsCreatingActivity(false);
    }
  }, [activityForm, selectedClub, user?.id]);

  const handleBankFormChange = useCallback(
    (field: keyof typeof bankForm, value: string) => {
      setBankForm((prev) => ({ ...prev, [field]: value }));
    },
    [setBankForm]
  );

  const handleSaveBankSettings = useCallback(async () => {
    if (!selectedClub) {
      return;
    }
    const payload = {
      bankId: bankForm.bankId.trim(),
      bankAccountNumber: bankForm.bankAccountNumber.trim(),
      bankAccountName: bankForm.bankAccountName.trim(),
      bankTransferNote: bankForm.bankTransferNote.trim(),
      joinFee: bankForm.joinFee.trim(),
    };
    if (!payload.bankId || !payload.bankAccountNumber) {
      toast.error('Bank ID and account number are required.');
      return;
    }
    const parsedFee = payload.joinFee ? Number(payload.joinFee) : 0;
    if (Number.isNaN(parsedFee) || parsedFee < 0) {
      toast.error('Join fee must be zero or greater.');
      return;
    }
    try {
      setIsSavingBankSettings(true);
      const updated = await updateClubSettingsAPI(selectedClub.id, {
        joinFee: parsedFee,
        bankId: payload.bankId,
        bankAccountNumber: payload.bankAccountNumber,
        bankAccountName: payload.bankAccountName,
        bankTransferNote: payload.bankTransferNote,
      });
      setSettingsCache((prev) => ({ ...prev, [selectedClub.id]: updated }));
      toast.success('Bank instructions updated.');
    } catch (error) {
      console.error(error);
      toast.error('Unable to save bank instructions.');
    } finally {
      setIsSavingBankSettings(false);
    }
  }, [bankForm, selectedClub, setSettingsCache]);

  const handleRefreshJoinQueue = useCallback(() => {
    if (!selectedClub?.id) return;
    void fetchJoinQueue(selectedClub.id);
  }, [fetchJoinQueue, selectedClub]);

  const handleJoinRequestDecision = useCallback(
    async (requestId: number, status: ClubJoinRequestStatus, note?: string | null) => {
      if (!selectedClub?.id || !user?.id) {
        toast.error('Missing context for decision.');
        return;
      }
      try {
        setJoinQueueDecisionMap((prev) => ({ ...prev, [requestId]: true }));
        const payload = {
          status,
          reviewerId: user.id,
          note: note?.trim() ? note.trim() : undefined,
        };
        const updated = await reviewClubJoinRequestAPI(requestId, payload);
        setJoinQueueCache((prev) => {
          const current = prev[selectedClub.id] ?? [];
          return {
            ...prev,
            [selectedClub.id]: current.map((item) => (item.id === updated.id ? updated : item)),
          };
        });
        toast.success(status === 'APPROVED' ? 'Request approved.' : 'Request rejected.');
      } catch (error) {
        console.error(error);
        toast.error('Unable to update request.');
      } finally {
        setJoinQueueDecisionMap((prev) => ({ ...prev, [requestId]: false }));
      }
    },
    [selectedClub, user?.id]
  );

  useEffect(() => {
    if (!selectedClub) return;
    if (detailTab === 'members' && !membersCache[selectedClub.id]) {
      setIsMembersLoading(true);
      getClubMembersAPI(selectedClub.id)
        .then((data) => {
          const normalized = Array.isArray((data as any)?.data) ? (data as any).data : data;
          setMembersCache((prev) => ({ ...prev, [selectedClub.id]: normalized ?? [] }));
        })
        .catch((error) => {
          console.error(error);
          toast.error('Unable to load members.');
        })
        .finally(() => setIsMembersLoading(false));
    }
    if (detailTab === 'settings' && !settingsCache[selectedClub.id]) {
      setIsSettingsLoading(true);
      getClubSettingsAPI(selectedClub.id)
        .then((data) => {
          setSettingsCache((prev) => ({ ...prev, [selectedClub.id]: (data as any)?.data ?? data }));
        })
        .catch((error) => {
          console.error(error);
          toast.error('Unable to load club settings.');
        })
        .finally(() => setIsSettingsLoading(false));
    }
    if (detailTab === 'requests' && !joinQueueCache[selectedClub.id]) {
      void fetchJoinQueue(selectedClub.id);
    }
    if (detailTab === 'activities' && !activitiesCache[selectedClub.id]) {
      void fetchActivities(selectedClub.id);
    }
  }, [
    detailTab,
    selectedClub,
    membersCache,
    settingsCache,
    joinQueueCache,
    activitiesCache,
    fetchJoinQueue,
    fetchActivities,
  ]);

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-10">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-400">My Club</p>
          <h1 className="text-2xl font-semibold text-slate-900">Manage your clubs</h1>
          <p className="text-sm text-slate-500">
            Create new clubs, track pending approvals, and review member activity in one view.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-orange-200 hover:text-orange-500"
            disabled={isLoadingClubs || isLoadingRequests}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoadingClubs ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openJoinModal}
            className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-500 shadow-sm transition hover:bg-orange-50"
          >
            Join club
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Create club
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total clubs"
          value={stats.totalClubs}
          icon={Layers}
          accent="bg-slate-900 text-white"
        />
        <SummaryCard
          label="Active clubs"
          value={stats.activeClubs}
          icon={CheckCircle2}
          accent="bg-emerald-100 text-emerald-700"
        />
        <SummaryCard
          label="Pending requests"
          value={stats.pendingRequests}
          icon={Calendar}
          accent="bg-amber-100 text-amber-700"
        />
      <SummaryCard
        label="Rejected requests"
        value={stats.rejectedRequests}
        icon={AlertTriangle}
        accent="bg-rose-100 text-rose-700"
      />
    </section>
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Clubs I've joined</p>
            <p className="text-xs text-slate-500">Approved join requests you can access.</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchJoinHistory(joinHistoryFilter)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isLoadingJoinHistory ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {isLoadingJoinHistory ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : joinedClubs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            You haven't joined any clubs yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {joinedClubs.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() =>
                  void openClubDetails({
                    id: request.clubId!,
                    name: request.clubName ?? 'Joined club',
                    code: null,
                    status: 'ACTIVE',
                  } as ClubSummary)
                }
                className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-left transition hover:border-orange-200 hover:bg-orange-50/40"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {request.clubName ?? 'Unnamed club'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Joined {formatDateTime(request.updatedAt ?? request.createdAt)}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                  View
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Join request history</p>
            <p className="text-xs text-slate-500">Track every attempt to join a club.</p>
          </div>
          <select
            value={joinHistoryFilter}
            onChange={(event) =>
              setJoinHistoryFilter(event.target.value as ClubJoinRequestStatus | 'all')
            }
            className="rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        {isLoadingJoinHistory ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filteredJoinHistory.length === 0 ? (
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
                {filteredJoinHistory.map((request) => (
                  <tr key={request.id} className="text-slate-700">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-slate-900">{request.clubName ?? 'Unknown'}</p>
                      {request.motivation && (
                        <p className="text-xs text-slate-500">{request.motivation}</p>
                      )}
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
    </section>
    <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={clubSearch}
                onChange={(event) => setClubSearch(event.target.value)}
                placeholder="Search clubs..."
                className="w-full rounded-2xl border border-slate-200 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <select
              value={clubStatusFilter}
              onChange={(event) => setClubStatusFilter(event.target.value as ClubStatus | 'all')}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-48"
            >
              <option value="all">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-3 pr-4">Club</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingClubs ? (
                  <LoadingRows columns={5} rows={CLUBS_PER_PAGE} />
                ) : paginatedClubs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-slate-500">
                      No clubs matched your filters. Try adjusting the search.
                    </td>
                  </tr>
                ) : (
                  paginatedClubs.map((club) => (
                    <tr key={club.id} className="text-slate-700">
                      <td className="py-4 pr-4">
                        <div className="font-semibold text-slate-900">{club.name}</div>
                        <div className="text-xs text-slate-400">#{club.code ?? 'N/A'}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{club.category ?? 'â€”'}</td>
                      <td className="px-4 py-4 text-slate-500">{club.memberCount ?? 0}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                            clubStatusClasses[club.status] ?? 'border-slate-200 text-slate-500 bg-slate-50'
                          }`}
                        >
                          {club.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => void openClubDetails(club)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoadingClubs && paginatedClubs.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {(currentPage - 1) * CLUBS_PER_PAGE + 1}-
                  {Math.min(filteredClubs.length, currentPage * CLUBS_PER_PAGE)}
                </span>{' '}
                of <span className="font-semibold text-slate-900">{filteredClubs.length}</span> clubs
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-orange-500 disabled:opacity-40"
                >
                  <ChevronLeft className="mr-1 inline h-3.5 w-3.5" />
                  Prev
                </button>
                <div className="text-xs font-semibold text-slate-700">
                  Page {currentPage} / {clubPageCount}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(clubPageCount, prev + 1))}
                  disabled={currentPage === clubPageCount}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-orange-500 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="ml-1 inline h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Creation requests</p>
              <p className="text-xs text-slate-500">Track approvals for new clubs you submitted.</p>
            </div>
            <select
              value={requestFilter}
              onChange={(event) =>
                setRequestFilter(event.target.value as ClubCreationRequestStatus | 'all')
              }
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-40"
            >
              <option value="all">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={requestSearch}
                onChange={(event) => setRequestSearch(event.target.value)}
                placeholder="Search request..."
                className="w-full rounded-2xl border border-slate-200 py-2 pl-10 pr-4 text-xs outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {isLoadingRequests ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No requests matched your filters.
              </p>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{request.clubName ?? 'Untitled'}</p>
                      <p className="text-xs text-slate-500">
                        Submitted {formatDate(request.submittedAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${
                        requestStatusMeta[request.status].className
                      }`}
                    >
                      {requestStatusMeta[request.status].label}
                    </span>
                  </div>
                  {request.note && (
                    <p className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                      {request.note}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      {isJoinModalOpen && (
        <JoinClubModal
          form={joinForm}
          isSubmitting={isJoining}
          preview={joinPreview}
          isPreviewLoading={isJoinPreviewLoading}
          previewError={joinPreviewError}
          paymentProofUrl={paymentProof.url}
          paymentProofFileName={paymentProof.fileName}
          isUploadingProof={isUploadingProof}
          proofError={paymentProofError}
          allowUpload={Boolean(joinPreview?.clubId)}
          onUploadProof={handlePaymentProofUpload}
          onRemoveProof={handleRemovePaymentProof}
          onClose={closeJoinModal}
          onChange={(field, value) => setJoinForm((prev) => ({ ...prev, [field]: value }))}
          onSubmit={handleJoinClub}
        />
      )}

      {isCreateModalOpen && (
        <CreateClubModal
          form={createForm}
          isSubmitting={isCreating}
          onClose={() => setIsCreateModalOpen(false)}
          onChange={(field, value) => setCreateForm((prev) => ({ ...prev, [field]: value }))}
          onSubmit={handleCreateClub}
        />
      )}

      {selectedClub && (
        <ClubDetailDrawer
          club={selectedClub}
          members={selectedClubMembers}
          membersVisible={membersVisible}
          settings={selectedClubSettings}
          activeTab={detailTab}
          isMembersLoading={isMembersLoading}
          isSettingsLoading={isSettingsLoading}
          onTabChange={setDetailTab}
          canManage={selectedClubCanManage}
          onRefreshInviteCode={handleRefreshInviteCode}
          bankForm={bankForm}
          onBankFormChange={handleBankFormChange}
          onSaveBankSettings={handleSaveBankSettings}
          isBankSettingsSaving={isSavingBankSettings}
          joinRequests={filteredJoinRequests}
          joinQueueFilter={joinQueueFilter}
          isJoinQueueLoading={isJoinQueueLoading}
          onJoinQueueFilterChange={setJoinQueueFilter}
          onRefreshJoinQueue={handleRefreshJoinQueue}
          onDecideJoinRequest={handleJoinRequestDecision}
          decisionLoadingMap={joinQueueDecisionMap}
          activities={selectedClubActivities}
          isActivitiesLoading={isActivitiesLoading}
          activityForm={activityForm}
          onActivityFormChange={handleActivityFormChange}
          onCreateActivity={handleCreateActivity}
          isCreatingActivity={isCreatingActivity}
          onClose={() => setSelectedClub(null)}
        />
      )}
    </div>
  );
};

interface ClubDetailDrawerProps {
  club: ClubDetail;
  members: ClubMember[];
  membersVisible: boolean;
  settings?: ClubSettingInfo;
  activeTab: DetailTab;
  isMembersLoading: boolean;
  isSettingsLoading: boolean;
  onTabChange: (tab: DetailTab) => void;
  canManage: boolean;
  onRefreshInviteCode: (clubId: number) => void;
  bankForm: BankInstructionForm;
  onBankFormChange: (field: keyof BankInstructionForm, value: string) => void;
  onSaveBankSettings: () => void;
  isBankSettingsSaving: boolean;
  joinRequests: ClubJoinRequest[];
  joinQueueFilter: ClubJoinRequestStatus | 'all';
  isJoinQueueLoading: boolean;
  onJoinQueueFilterChange: (value: ClubJoinRequestStatus | 'all') => void;
  onRefreshJoinQueue: () => void;
  onDecideJoinRequest: (requestId: number, status: ClubJoinRequestStatus, note?: string | null) => void;
  decisionLoadingMap: Record<number, boolean>;
  activities: ClubActivity[];
  isActivitiesLoading: boolean;
  activityForm: ActivityFormState;
  onActivityFormChange: (field: keyof ActivityFormState, value: string) => void;
  onCreateActivity: () => void;
  isCreatingActivity: boolean;
  onClose: () => void;
}

const ClubDetailDrawer = ({
  club,
  members,
  membersVisible,
  settings,
  activeTab,
  isMembersLoading,
  isSettingsLoading,
  onTabChange,
  canManage,
  onRefreshInviteCode,
  bankForm,
  onBankFormChange,
  onSaveBankSettings,
  isBankSettingsSaving,
  joinRequests,
  joinQueueFilter,
  isJoinQueueLoading,
  onJoinQueueFilterChange,
  onRefreshJoinQueue,
  onDecideJoinRequest,
  decisionLoadingMap,
  activities,
  isActivitiesLoading,
  activityForm,
  onActivityFormChange,
  onCreateActivity,
  isCreatingActivity,
  onClose,
}: ClubDetailDrawerProps) => {
  const handleCopyInviteCode = async () => {
    if (!club.inviteCode) {
      toast.error('Invite code not available.');
      return;
    }
    try {
      await navigator.clipboard.writeText(club.inviteCode);
      toast.success('Invite code copied.');
    } catch (error) {
      console.error(error);
      toast.error('Unable to copy invite code.');
    }
  };

  const handleDecision = (requestId: number, status: ClubJoinRequestStatus) => {
    const note =
      status === 'REJECTED'
        ? window.prompt('Add a rejection note (optional)') ?? undefined
        : undefined;
    onDecideJoinRequest(requestId, status, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40">
      <div className="h-full w-full max-w-4xl overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-400">Club</p>
            <h3 className="text-xl font-semibold text-slate-900">{club.name}</h3>
            <p className="text-xs text-slate-500">#{club.code ?? 'N/A'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:text-orange-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {detailTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-white text-orange-600 shadow'
                    : 'text-slate-500 hover:text-orange-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetailItem label="Status" value={club.status} />
              <DetailItem label="Category" value={club.category ?? 'N/A'} />
              <DetailItem label="Founded" value={formatDate(club.foundedDate)} />
              <DetailItem label="Members" value={`${club.memberCount ?? 0}`} />
              <DetailItem label="Meeting location" value={club.meetingLocation ?? 'Not provided'} />
              <DetailItem label="Mission" value={club.mission ?? 'Not provided'} />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="mt-6">
              {!membersVisible ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-700">
                  Member list is hidden by the club leader.
                </div>
              ) : isMembersLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : members.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">No members to display.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Member</th>
                        <th className="px-4 py-3 text-left">Role</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.map((member) => (
                        <tr key={member.id} className="text-slate-700">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {member.memberName ?? 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{member.role}</td>
                          <td className="px-4 py-3 text-slate-500">{member.status}</td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(member.joinedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="mt-6 space-y-4">
              {canManage && (
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Create activity</p>
                      <p className="text-xs text-slate-500">Only leaders can add new club activities.</p>
                    </div>
                    <button
                      type="button"
                      onClick={onCreateActivity}
                      disabled={isCreatingActivity}
                      className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
                    >
                      {isCreatingActivity && <Loader2 className="h-4 w-4 animate-spin" />}
                      Publish
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Title
                      <input
                        type="text"
                        value={activityForm.title}
                        onChange={(event) => onActivityFormChange('title', event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="Orientation day"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                      <input
                        type="text"
                        value={activityForm.location}
                        onChange={(event) => onActivityFormChange('location', event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="Auditorium A2"
                      />
                    </label>
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Start date
                      <input
                        type="date"
                        value={activityForm.startDate}
                        onChange={(event) => onActivityFormChange('startDate', event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      End date
                      <input
                        type="date"
                        value={activityForm.endDate}
                        onChange={(event) => onActivityFormChange('endDate', event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      />
                    </label>
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Budget
                      <input
                        type="number"
                        min="0"
                        value={activityForm.budget}
                        onChange={(event) => onActivityFormChange('budget', event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="500000"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                      <select
                        value={activityForm.status}
                        onChange={(event) =>
                          onActivityFormChange('status', event.target.value as ClubActivityStatus)
                        }
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      >
                        <option value="PLANNING">Planning</option>
                        <option value="APPROVED">Approved</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Description
                      <textarea
                        value={activityForm.description}
                        onChange={(event) =>
                          onActivityFormChange('description', event.target.value)
                        }
                        rows={3}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="Share agenda or expectations."
                      />
                    </label>
                  </div>
                </div>
              )}
              {isActivitiesLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : selectedClubActivities.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No activities published yet.</p>
              ) : (
                <div className="space-y-3">
                  {selectedClubActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-slate-500">{activity.description}</p>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${
                            activityStatusMeta[activity.status].className
                          }`}
                        >
                          {activityStatusMeta[activity.status].label}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                        {activity.startDate && (
                          <span>
                            Starts <strong className="text-slate-900">{formatDate(activity.startDate)}</strong>
                          </span>
                        )}
                        {activity.endDate && (
                          <span>
                            Ends <strong className="text-slate-900">{formatDate(activity.endDate)}</strong>
                          </span>
                        )}
                        {activity.location && (
                          <span>
                            Location <strong className="text-slate-900">{activity.location}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Join requests</p>
                  <p className="text-xs text-slate-500">
                    Review payment evidence before admitting new members.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={joinQueueFilter}
                    onChange={(event) =>
                      onJoinQueueFilterChange(event.target.value as ClubJoinRequestStatus | 'all')
                    }
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="all">All</option>
                  </select>
                  <button
                    type="button"
                    onClick={onRefreshJoinQueue}
                    disabled={isJoinQueueLoading}
                    className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500 disabled:opacity-60"
                  >
                    <RefreshCcw className={`h-3.5 w-3.5 ${isJoinQueueLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
              {isJoinQueueLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : joinRequests.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No requests matched the selected status.
                </p>
              ) : (
                joinRequests.map((request) => {
                  const statusMeta = joinRequestStatusMeta[request.status];
                  const decisionLoading = Boolean(decisionLoadingMap[request.id]);
                  return (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {request.applicantName ?? 'Unknown applicant'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Submitted {formatDateTime(request.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      {request.motivation && (
                        <p className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          {request.motivation}
                        </p>
                      )}
                      {request.paymentProofUrl ? (
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2">
                            <img
                              src={request.paymentProofUrl}
                              alt="Payment proof"
                              className="h-48 w-full rounded-xl object-cover"
                            />
                          </div>
                          <div className="flex flex-col justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Payment proof
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {request.applicantName ?? 'Applicant'}
                              </p>
                              <p className="text-xs text-slate-500">
                                Ensure the transfer details match before approving.
                              </p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <a
                                href={request.paymentProofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-500 transition hover:bg-orange-50"
                              >
                                <Image className="h-3.5 w-3.5" />
                                View full size
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-700">
                          Applicant has not attached payment evidence.
                        </p>
                      )}
                      {request.status === 'PENDING' && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleDecision(request.id, 'REJECTED')}
                            disabled={decisionLoading || !canManage}
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-50"
                          >
                            {decisionLoading ? 'Working…' : 'Reject'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecision(request.id, 'APPROVED')}
                            disabled={decisionLoading || !canManage}
                            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
                          >
                            {decisionLoading ? 'Working…' : 'Approve'}
                          </button>
                        </div>
                      )}
                      {!canManage && request.status === 'PENDING' && (
                        <p className="mt-3 text-xs text-slate-500">
                          Only club leaders can approve or reject requests.
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="mt-6 space-y-3">
              {isSettingsLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <Fragment>
                  <SettingItem
                    icon={Users}
                    label="Require approval"
                    value={settings?.requireApproval ?? true}
                  />
                  <SettingItem
                    icon={Users2}
                    label="Allow waitlist"
                    value={settings?.allowWaitlist ?? true}
                  />
                  <SettingItem
                    icon={Settings2}
                    label="Notifications"
                    value={settings?.enableNotifications ?? true}
                  />
                  <BankInstructionCard
                    club={club}
                    canManage={canManage}
                    settings={settings}
                    bankForm={bankForm}
                    onChange={onBankFormChange}
                    onSave={onSaveBankSettings}
                    isSaving={isBankSettingsSaving}
                  />
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Invite code</p>
                        <p className="text-xs text-slate-500">
                          Share this code so members can join instantly.
                        </p>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onRefreshInviteCode(club.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-500 transition hover:bg-orange-50"
                        >
                          Refresh
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <code className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
                        {club.inviteCode ?? 'Unavailable'}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyInviteCode}
                        className="rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </Fragment>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
interface DetailItemProps {
  label: string;
  value: string | number;
}

const DetailItem = ({ label, value }: DetailItemProps) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

interface SettingItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: boolean;
}

const SettingItem = ({ icon: Icon, label, value }: SettingItemProps) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
        value ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
      }`}
    >
      <Icon className="h-4 w-4" />
    </span>
    <div className="flex-1">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-xs text-slate-500">{value ? 'Enabled' : 'Disabled'}</p>
    </div>
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
        value ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {value ? 'ON' : 'OFF'}
    </span>
  </div>
);

interface BankInstructionCardProps {
  club: ClubDetail;
  canManage: boolean;
  settings?: ClubSettingInfo;
  bankForm: BankInstructionForm;
  onChange: (field: keyof BankInstructionForm, value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const BankInstructionCard = ({
  club,
  canManage,
  settings,
  bankForm,
  onChange,
  onSave,
  isSaving,
}: BankInstructionCardProps) => {
  const formAmount = Number(bankForm.joinFee || 0);
  const configuredAmount =
    settings?.joinFee !== undefined && settings?.joinFee !== null ? settings.joinFee : 0;
  const amountForPreview = canManage ? formAmount : configuredAmount;
  const bankId = canManage ? bankForm.bankId : settings?.bankId ?? '';
  const accountNo = canManage ? bankForm.bankAccountNumber : settings?.bankAccountNumber ?? '';
  const accountName =
    (canManage ? bankForm.bankAccountName : settings?.bankAccountName) ??
    settings?.clubName ??
    club.name ??
    '';
  const transferNote =
    (canManage ? bankForm.bankTransferNote : settings?.bankTransferNote) ??
    settings?.clubCode ??
    club.code ??
    club.name ??
    '';
  const qrUrl = buildVietQrUrl({
    bankId,
    bankAccountNumber: accountNo,
    bankAccountName: accountName,
    amount: amountForPreview,
    content: transferNote,
  });
  const isConfigured = Boolean(bankId && accountNo);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">Bank instructions</p>
        <p className="text-xs text-slate-500">
          Members pay via VietQR, then submit their join request for leader approval.
        </p>
      </div>
      {canManage ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Bank ID
              <input
                type="text"
                value={bankForm.bankId}
                onChange={(event) => onChange('bankId', event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="e.g. ACB"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account number
              <input
                type="text"
                value={bankForm.bankAccountNumber}
                onChange={(event) => onChange('bankAccountNumber', event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="0123456789"
              />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account name
              <input
                type="text"
                value={bankForm.bankAccountName}
                onChange={(event) => onChange('bankAccountName', event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="NGUYEN VAN A"
              />
            </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Transfer note
                <input
                  type="text"
                  value={bankForm.bankTransferNote}
                  onChange={(event) => onChange('bankTransferNote', event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder={`JOIN-${club.code ?? 'MYCLUB'}`}
              />
            </label>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Join fee (VND)
              <input
                type="number"
                min="0"
                value={bankForm.joinFee}
                onChange={(event) => onChange('joinFee', event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="50000"
              />
            </label>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="rounded-2xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save instructions'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2 text-sm">
          {isConfigured ? (
            <Fragment>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Bank</span>
                <span className="font-semibold text-slate-900">{bankId}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Account</span>
                <span className="font-semibold text-slate-900">{accountNo}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Account name</span>
                <span className="font-semibold text-slate-900">{accountName}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Join fee</span>
                <span className="font-semibold text-slate-900">
                  {formatJoinFeeValue(amountForPreview)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Transfer note</span>
                <span className="font-semibold text-slate-900">{transferNote}</span>
              </div>
            </Fragment>
          ) : (
            <p className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-amber-700">
              Leaders have not configured bank instructions yet.
            </p>
          )}
        </div>
      )}
      {isConfigured && qrUrl && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-center">
          <img
            src={qrUrl}
            alt="VietQR"
            className="mx-auto h-36 w-36 rounded-2xl border border-white bg-white object-contain p-3 shadow-inner"
          />
          <p className="mt-2 text-xs text-slate-500">Scan QR to pay {formatJoinFeeValue(amountForPreview)}</p>
        </div>
      )}
    </div>
  );
};

export default MyClubs;
