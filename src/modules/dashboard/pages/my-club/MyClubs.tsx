import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,

} from 'react';

import { toast } from 'react-hot-toast';


import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constant/routes';

import {
  createClubAPI,
  createClubActivityAPI,
  getClubActivitiesAPI,
  getClubJoinRequestsAPI,
  getClubsAPI,
  getClubDetailAPI,
  getClubMembersAPI,
  getClubSettingsAPI,
  getJoinRequestHistoryAPI,
  refreshInviteCodeAPI,
  removeClubMemberAPI,
  reviewClubJoinRequestAPI,
  updateClubMemberAPI,
  updateClubSettingsAPI,
  updateClubActivityAPI,
  updateClubAPI,
  uploadClubImageAPI,
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


import CreateClubModal, { type CreateClubForm } from './components/CreateClubModal';

import ClubDetailDrawer from './components/ClubDetailDrawer';





import MyClubsHeader from './components/MyClubsHeader';

import StatsOverviewSection, { type ClubStats } from './components/StatsOverviewSection';

import MembershipOverviewSection from './components/MembershipOverviewSection';

import ClubListsSection from './components/ClubListsSection';

import {
  getClubCreationRequestsAPI,
  type ClubCreationRequest,
  type ClubCreationRequestStatus,

} from '../club-queue/services/clubCreationQueueService';

import type { ActivityFormState, BankInstructionForm } from './types';

import type { DetailTab } from './constants';
import { showToast } from '@/utils';



const CLUBS_PER_PAGE = 6;

const ACTIVITY_FORM_DEFAULT: ActivityFormState = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  location: '',
  budget: '',
  status: 'PLANNING' as ClubActivityStatus,

};



const getClubLeaderId = (club?: { leaderId?: number | null; presidentId?: number | null }) =>
  club?.leaderId ?? club?.presidentId ?? null;


const formatDateTimeLocalInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;

};



const toIsoOrUndefined = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();

};



function extractArrayResponse<T>(payload: unknown): T[] {
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

}



function extractValue<T>(payload: unknown): T | undefined {
  if (
    payload &&
    typeof payload === 'object' &&
    Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;

}



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
    imageUrl: '',
    imageFileName: '',
    meetingLocation: '',
    mission: '',
    foundedDate: '',
    operatingDays: [],
    operatingStartTime: '',
    operatingEndTime: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingClubImage, setIsUploadingClubImage] = useState(false);
  const [clubImageError, setClubImageError] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState<BankInstructionForm>({
    bankId: '',
    bankAccountNumber: '',
    bankAccountName: '',
    bankTransferNote: '',
    joinFee: '',
  });
  const [isSavingBankSettings, setIsSavingBankSettings] = useState(false);
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
  const [memberActionLoading, setMemberActionLoading] = useState<Record<number, boolean>>({});
  const [isLeavingClub, setIsLeavingClub] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [isUpdatingClubImage, setIsUpdatingClubImage] = useState(false);


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
      const normalized = extractArrayResponse<ClubCreationRequest>(data);
      const mine = normalized.filter((request) => request.submittedById === user.id);
      setRequests(mine);
    } catch (error) {
      console.error(error);
      showToast('error', 'Không thể tải yêu cầu câu lạc bộ của bạn.');
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
        showToast('error', 'Không thể tải yêu cầu tham gia của bạn.');
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
      showToast('error', 'Không thể tải hoạt động câu lạc bộ.');
    } finally {
      setIsActivitiesLoading(false);
    }
  }, []);
  const fetchClubs = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingClubs(true);
      const data = await getClubsAPI('all');
      const normalized = extractArrayResponse<ClubSummary>(data);
      const mine = normalized.filter((club) => {
        if (!user) return false;
        const roleName = user.role?.name ?? '';
        if (roleName === 'ROLE_ADMIN' || roleName === 'ROLE_STAFF') {
          return true;
        }
        const leaderId = getClubLeaderId(club);
        return leaderId === user.id || club.advisorId === user.id;
      });
      setClubs(mine);
    } catch (error) {
      console.error(error);
      showToast('error', 'Không thể tải câu lạc bộ của bạn.');
    } finally {
      setIsLoadingClubs(false);
    }
  }, [user]);


  const fetchJoinQueue = useCallback(async (clubId: number) => {
    if (!clubId) return;
    try {
      setIsJoinQueueLoading(true);
      const data = await getClubJoinRequestsAPI(clubId);
      setJoinQueueCache((prev) => ({ ...prev, [clubId]: data }));
    } catch (error) {
      console.error(error);
      showToast('error', 'Không thể tải yêu cầu tham gia.');
    } finally {
      setIsJoinQueueLoading(false);
    }
  }, []);


  const refreshAll = useCallback(async () => {
    await Promise.all([fetchClubs(), fetchRequests(), fetchJoinHistory()]);
  }, [fetchClubs, fetchRequests, fetchJoinHistory]);


  const canManageClub = useCallback(
    (club?: { advisorId?: number | null; leaderId?: number | null; presidentId?: number | null }) => {
      if (!club || !user) return false;
      const roleName = user.role?.name ?? '';
      if (roleName === 'ROLE_ADMIN' || roleName === 'ROLE_STAFF') {
        return true;
      }
      const leaderId = getClubLeaderId(club);
      return leaderId === user.id || club.advisorId === user.id;
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
      showToast('success', 'Mã mời đã được làm mới.');
    } catch (error) {
      console.error(error);
      showToast('error', 'Không thể làm mới mã mời.');
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
    setEditingActivityId(null);
    setActivityForm(ACTIVITY_FORM_DEFAULT);
  }, [selectedClub?.id]);


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


  const stats = useMemo<ClubStats>(() => {
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
  const currentMemberRecord = useMemo(() => {
    if (!selectedClub || !user?.id) return null;
    return selectedClubMembers.find((member) => member.memberId === user.id) ?? null;
  }, [selectedClub, selectedClubMembers, user?.id]);
  const currentLeaderMember = useMemo(() => {
    return selectedClubMembers.find((member) => member.role === 'PRESIDENT') ?? null;
  }, [selectedClubMembers]);
  const isCurrentLeader = getClubLeaderId(selectedClub) === user?.id;
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


  const openCreateModal = () => {
    setCreateForm({
      name: '',
      description: '',
      category: '',
      imageUrl: '',
      imageFileName: '',
      meetingLocation: '',
      mission: '',
      foundedDate: '',
      operatingDays: [],
      operatingStartTime: '',
      operatingEndTime: '',
    });
    setClubImageError(null);
    setIsCreateModalOpen(true);
  };


  const handleCreateClub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.name.trim()) {
      showToast('error', 'Tên câu lạc bộ là bắt buộc.');
      return;
    }
    if (!createForm.operatingDays.length) {
      showToast('error', 'Chọn ít nhất một ngày hoạt động.');
      return;
    }
    if (!createForm.operatingStartTime || !createForm.operatingEndTime) {
      showToast('error', 'Cung cấp đầy đủ giờ bắt đầu và kết thúc.');
      return;
    }
    if (createForm.operatingStartTime >= createForm.operatingEndTime) {
      showToast('error', 'Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }

    try {
      setIsCreating(true);
      const { imageFileName: _imageFileName, ...payload } = createForm;
      await createClubAPI({
        ...payload,
        imageUrl: payload.imageUrl || undefined,
        foundedDate: payload.foundedDate || null,
      });
      showToast('success', 'Yêu cầu tạo câu lạc bộ đã được gửi thành công.');
      setIsCreateModalOpen(false);
      await refreshAll();
    } catch (error) {
      console.error(error);
      showToast('error', 'Không thể gửi yêu cầu câu lạc bộ.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClubImageUpload = async (file: File) => {
    if (!file.type?.startsWith('image/')) {
      showToast('error', 'Hãy chọn hình ảnh cho câu lạc bộ.');
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('error', 'Hình ảnh không được vượt quá 5MB.');
      return;
    }
    try {
      setIsUploadingClubImage(true);
      setClubImageError(null);
      const uploaded = await uploadClubImageAPI(file);
      setCreateForm((prev) => ({
        ...prev,
        imageUrl: uploaded.url ?? '',
        imageFileName: file.name,
      }));
      showToast('success', 'Tải hình ảnh câu lạc bộ thành công.');
    } catch (error) {
      console.error(error);
      setClubImageError('Không thể tải hình ảnh.');
      showToast('error', 'Không thể tải hình ảnh.');
    } finally {
      setIsUploadingClubImage(false);
    }
  };

  const handleUpdateClubImage = async (clubId: number, file: File) => {
    if (!file.type?.startsWith('image/')) {
      showToast('error', 'Hãy chọn hình ảnh hợp lệ.');
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('error', 'Hình ảnh không được vượt quá 5MB.');
      return;
    }
    try {
      setIsUpdatingClubImage(true);
      const uploaded = await uploadClubImageAPI(file, clubId);
      const newUrl = uploaded.url ?? '';
      await updateClubAPI(clubId, { imageUrl: newUrl });
      setClubs((prev) => prev.map((club) => (club.id === clubId ? { ...club, imageUrl: newUrl } : club)));
      setSelectedClub((prev) => (prev?.id === clubId ? { ...prev, imageUrl: newUrl } : prev));
      setClubDetailCache((prev) =>
        prev[clubId] ? { ...prev, [clubId]: { ...prev[clubId], imageUrl: newUrl } } : prev
      );
      showToast('success', 'Đã cập nhật ảnh câu lạc bộ.');
    } catch (error) {
      console.error(error);
      showToast('error', 'Không thể cập nhật ảnh câu lạc bộ.');
    } finally {
      setIsUpdatingClubImage(false);
    }
  };

  const handleRemoveClubImage = () => {
    setCreateForm((prev) => ({
      ...prev,
      imageUrl: '',
      imageFileName: '',
    }));
    setClubImageError(null);
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
      showToast('error', 'Không thể tải chi tiết câu lạc bộ.');
    }
  };


  const setMemberLoadingState = useCallback((ids: Array<number | undefined>, loading: boolean) => {
    setMemberActionLoading((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        if (!id) return;
        if (loading) {
          next[id] = true;
        } else {
          delete next[id];
        }
      });
      return next;
    });
  }, []);


  const resetActivityForm = useCallback(() => {
    setActivityForm(ACTIVITY_FORM_DEFAULT);
    setEditingActivityId(null);
  }, []);


  const handleActivityFormChange = useCallback(
    (field: keyof ActivityFormState, value: string) => {
      setActivityForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );


  const handleEditActivity = useCallback(
    (activity: ClubActivity) => {
      setEditingActivityId(activity.id);
      setActivityForm({
        title: activity.title ?? '',
        description: activity.description ?? '',
        startDate: formatDateTimeLocalInput(activity.startDate),
        endDate: formatDateTimeLocalInput(activity.endDate),
        location: activity.location ?? '',
        budget:
          activity.budget !== undefined && activity.budget !== null ? String(activity.budget) : '',
        status: activity.status ?? 'PLANNING',
      });
      setDetailTab('activities');
    },
    [setDetailTab]
  );


  const handleSubmitActivity = useCallback(async () => {
    if (!selectedClub) return;
    if (!activityForm.title.trim()) {
      showToast('error', 'Tiêu đề hoạt động là bắt buộc.');
      return;
    }
    try {
      setIsCreatingActivity(true);
      const payload = {
        title: activityForm.title.trim(),
        description: activityForm.description.trim() || undefined,
        startDate: toIsoOrUndefined(activityForm.startDate),
        endDate: toIsoOrUndefined(activityForm.endDate),
        location: activityForm.location.trim() || undefined,
        budget: activityForm.budget ? Number(activityForm.budget) : undefined,
        status: activityForm.status,
        createdById: user?.id ?? undefined,
      };
      if (editingActivityId) {
        const updated = await updateClubActivityAPI(editingActivityId, {
          ...payload,
          clubId: selectedClub.id,
        });
        setActivitiesCache((prev) => ({
          ...prev,
          [selectedClub.id]: (prev[selectedClub.id] ?? []).map((activity) =>
            activity.id === updated.id ? updated : activity
          ),
        }));
        showToast('success', 'Hoạt động đã được cập nhật.');
      } else {
        const created = await createClubActivityAPI(selectedClub.id, payload);
        setActivitiesCache((prev) => ({
          ...prev,
          [selectedClub.id]: [created, ...(prev[selectedClub.id] ?? [])],
        }));
        showToast('success', 'Hoạt động đã được thêm.');
      }
      resetActivityForm();
    } catch (error) {
      console.error(error);
      showToast('error', editingActivityId ? 'Không thể cập nhật hoạt động.' : 'Không thể tạo hoạt động.');
    } finally {
      setIsCreatingActivity(false);
    }
  }, [activityForm, selectedClub, user?.id, editingActivityId, resetActivityForm]);


  const handleCancelActivityEdit = useCallback(() => {
    resetActivityForm();
  }, [resetActivityForm]);


  const handleTransferLeadership = useCallback(
    async (targetMember: ClubMember) => {
      if (!selectedClub) return;
      const clubId = selectedClub.id;
      if (targetMember.memberId === getClubLeaderId(selectedClub)) {
        showToast('error', 'Thành viên này đã là trưởng nhóm.');
        return;
      }
      const confirmed = window.confirm(
        `Chuyển giao quyền lãnh đạo của ${selectedClub.name} cho ${targetMember.memberName ?? 'thành viên này'}?`
      );
      if (!confirmed) {
        return;
      }
      const previousLeaderId = currentLeaderMember?.id;
      const affectedIds = [targetMember.id, previousLeaderId].filter(
        (id): id is number => Boolean(id)
      );
      setMemberLoadingState(affectedIds, true);
      try {
        await updateClubMemberAPI(targetMember.id, { role: 'PRESIDENT' });
        if (previousLeaderId && previousLeaderId !== targetMember.id) {
          await updateClubMemberAPI(previousLeaderId, { role: 'MEMBER' });
        }
        const updatedClub = {
          ...selectedClub,
          leaderId: targetMember.memberId ?? null,
          leaderName: targetMember.memberName,
          presidentId: targetMember.memberId ?? null,
          presidentName: targetMember.memberName,
        };
        setSelectedClub((prev) => (prev && prev.id === clubId ? updatedClub : prev));
        setClubDetailCache((prev) => ({
          ...prev,
          [clubId]: {
            ...(prev[clubId] ?? selectedClub),
            leaderId: targetMember.memberId ?? null,
            leaderName: targetMember.memberName,
            presidentId: targetMember.memberId ?? null,
            presidentName: targetMember.memberName,
          },
        }));
        setClubs((prev) =>
          prev.map((club) =>
            club.id === clubId
              ? {
                ...club,
                leaderId: targetMember.memberId ?? null,
                leaderName: targetMember.memberName,
                presidentId: targetMember.memberId ?? null,
                presidentName: targetMember.memberName,
              }
              : club
          )
        );
        setMembersCache((prev) => ({
          ...prev,
          [clubId]: (prev[clubId] ?? selectedClubMembers).map((member) => {
            if (member.id === targetMember.id) {
              return { ...member, role: 'PRESIDENT' };
            }
            if (previousLeaderId && member.id === previousLeaderId && previousLeaderId !== targetMember.id) {
              return { ...member, role: 'MEMBER' };
            }
            return member;
          }),
        }));
        showToast('success', 'Quyền lãnh đạo đã được chuyển giao.');
      } catch (error) {
        console.error(error);
        showToast('error', 'Không thể chuyển giao quyền lãnh đạo.');
      } finally {
        setMemberLoadingState(affectedIds, false);
      }
    },
    [
      selectedClub,
      currentLeaderMember,
      setMemberLoadingState,
      setClubDetailCache,
      setMembersCache,
      setClubs,
      selectedClubMembers,
    ]
  );


  const handleKickMember = useCallback(
    async (member: ClubMember) => {
      if (!selectedClub) return;
      const clubId = selectedClub.id;
      if (member.memberId === getClubLeaderId(selectedClub)) {
        showToast('error', 'Hãy chuyển giao quyền lãnh đạo trước khi xóa thành viên này.');
        return;
      }
      const confirmed = window.confirm(
        `Xóa ${member.memberName ?? 'thành viên này'} khỏi ${selectedClub.name}?`
      );
      if (!confirmed) {
        return;
      }
      setMemberLoadingState([member.id], true);
      try {
        await removeClubMemberAPI(member.id);
        setMembersCache((prev) => ({
          ...prev,
          [clubId]: (prev[clubId] ?? []).filter((item) => item.id !== member.id),
        }));
        setSelectedClub((prev) => {
          if (!prev || prev.id !== clubId) return prev;
          const nextCount = Math.max((prev.memberCount ?? 0) - 1, 0);
          return { ...prev, memberCount: nextCount };
        });
        setClubDetailCache((prev) => {
          const existing = prev[clubId];
          if (!existing) return prev;
          const nextCount = Math.max((existing.memberCount ?? 0) - 1, 0);
          return { ...prev, [clubId]: { ...existing, memberCount: nextCount } };
        });
        setClubs((prev) =>
          prev.map((club) => {
            if (club.id !== clubId) return club;
            const nextCount = Math.max((club.memberCount ?? 0) - 1, 0);
            return { ...club, memberCount: nextCount };
          })
        );
        showToast('success', 'Đã xóa thành viên khỏi câu lạc bộ.');
      } catch (error) {
        console.error(error);
        showToast('error', 'Không thể xóa thành viên.');
      } finally {
        setMemberLoadingState([member.id], false);
      }
    },
    [selectedClub, setMemberLoadingState, setMembersCache, setSelectedClub, setClubDetailCache, setClubs]
  );


  const handleLeaveClub = useCallback(async () => {
    if (!selectedClub || !currentMemberRecord) {
      showToast('error', 'Bạn không phải là thành viên của câu lạc bộ này.');
      return;
    }
    const clubId = selectedClub.id;
    if (isCurrentLeader) {
      showToast('error', 'Hãy chuyển giao quyền lãnh đạo trước khi rời câu lạc bộ.');
      return;
    }
    const confirmed = window.confirm('Rời khỏi câu lạc bộ này? Bạn sẽ mất quyền truy cập vào các tài nguyên của nó.');
    if (!confirmed) {
      return;
    }
    setIsLeavingClub(true);
    setMemberLoadingState([currentMemberRecord.id], true);
    try {
      await removeClubMemberAPI(currentMemberRecord.id);
      setMembersCache((prev) => ({
        ...prev,
        [clubId]: (prev[clubId] ?? []).filter((member) => member.id !== currentMemberRecord.id),
      }));
      setSelectedClub((prev) => {
        if (!prev || prev.id !== clubId) return prev;
        const nextCount = Math.max((prev.memberCount ?? 0) - 1, 0);
        return { ...prev, memberCount: nextCount };
      });
      setClubDetailCache((prev) => {
        const existing = prev[clubId];
        if (!existing) return prev;
        const nextCount = Math.max((existing.memberCount ?? 0) - 1, 0);
        return { ...prev, [clubId]: { ...existing, memberCount: nextCount } };
      });
      setClubs((prev) =>
        prev.map((club) => {
          if (club.id !== clubId) return club;
          const nextCount = Math.max((club.memberCount ?? 0) - 1, 0);
          return { ...club, memberCount: nextCount };
        })
      );
      showToast('success', 'Bạn đã rời khỏi câu lạc bộ.');
    } catch (error) {
      console.error(error);
      showToast('error', 'Không thể rời câu lạc bộ.');
    } finally {
      setIsLeavingClub(false);
      setMemberLoadingState([currentMemberRecord.id], false);
    }
  }, [
    selectedClub,
    currentMemberRecord,
    isCurrentLeader,
    setMemberLoadingState,
    setMembersCache,
    setSelectedClub,
    setClubDetailCache,
    setClubs,
  ]);


  const handleBankFormChange = useCallback(
    (field: keyof BankInstructionForm, value: string) => {
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
      showToast('error', 'Mã ngân hàng và số tài khoản là bắt buộc.');
      return;
    }
    const parsedFee = payload.joinFee ? Number(payload.joinFee) : 0;
    if (Number.isNaN(parsedFee) || parsedFee < 0) {
      showToast('error', 'Phí tham gia phải bằng 0 hoặc lớn hơn.');
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
      showToast('success', 'Hướng dẫn ngân hàng đã được cập nhật.');
    } catch (error) {
      console.error(error);
      showToast('error', 'Không thể lưu hướng dẫn ngân hàng.');
    } finally {
      setIsSavingBankSettings(false);
    }
  }, [bankForm, selectedClub, setSettingsCache]);

  const handleUpdateClubOverview = useCallback(
    async (
      clubId: number,
      payload: Partial<{
        category: string | null;
        meetingLocation: string | null;
        mission: string | null;
        operatingDays: string[];
        operatingStartTime: string | null;
        operatingEndTime: string | null;
      }>
    ) => {
      const updated = await updateClubAPI(clubId, payload);
      const updatedData = updated ?? (payload as Partial<ClubDetail>);
      setClubs((prev) =>
        prev.map((club) => (club.id === clubId ? { ...club, ...updatedData } : club))
      );
      setSelectedClub((prev) => (prev?.id === clubId ? { ...prev, ...updatedData } : prev));
      setClubDetailCache((prev) =>
        prev[clubId]
          ? {
            ...prev,
            [clubId]: {
              ...prev[clubId],
              ...updatedData,
            },
          }
          : prev
      );
      return updated;
    },
    []
  );

  const handleRefreshJoinQueue = useCallback(() => {
    if (!selectedClub?.id) return;
    void fetchJoinQueue(selectedClub.id);
  }, [fetchJoinQueue, selectedClub]);


  const handleJoinRequestDecision = useCallback(
    async (requestId: number, status: ClubJoinRequestStatus, note?: string | null) => {
      if (!selectedClub?.id || !user?.id) {
        showToast('error', 'Thiếu ngữ cảnh cho quyết định.');
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
        showToast('success', 'Yêu cầu đã được chấp thuận.');
      } catch (error) {
        console.error(error);
        showToast('error', 'Yêu cầu đã bị từ chối.');
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
          const normalized = extractArrayResponse<ClubMember>(data);
          setMembersCache((prev) => ({ ...prev, [selectedClub.id]: normalized }));
        })
        .catch((error) => {
          console.error(error);
          showToast('error', 'Không thể tải thành viên.');
        })
        .finally(() => setIsMembersLoading(false));
    }
    if (detailTab === 'settings' && !settingsCache[selectedClub.id]) {
      setIsSettingsLoading(true);
      getClubSettingsAPI(selectedClub.id)
        .then((data) => {
          const resolved = extractValue<ClubSettingInfo>(data);
          setSettingsCache((prev) => ({ ...prev, [selectedClub.id]: resolved }));
        })
        .catch((error) => {
          console.error(error);
          showToast('error', 'Không thể tải cài đặt câu lạc bộ.');
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
      <MyClubsHeader
        onRefresh={() => void refreshAll()}
        onCreate={openCreateModal}
        isRefreshing={isLoadingClubs || isLoadingRequests}
        exploreHref={ROUTES.DASHBOARD.child.CLUB_BROWSER.getPath()}
      />


      <StatsOverviewSection stats={stats} />


      <MembershipOverviewSection
        joinedProps={{
          joinedClubs,
          isLoading: isLoadingJoinHistory,
          onRefresh: () => void fetchJoinHistory(joinHistoryFilter),
          onSelectClub: (club) => void openClubDetails(club),
        }}
        historyProps={{
          joinHistory: filteredJoinHistory,
          isLoading: isLoadingJoinHistory,
          filter: joinHistoryFilter,
          onFilterChange: setJoinHistoryFilter,
        }}
      />


      <ClubListsSection
        clubsTableProps={{
          search: clubSearch,
          statusFilter: clubStatusFilter,
          onSearchChange: setClubSearch,
          onStatusFilterChange: setClubStatusFilter,
          isLoading: isLoadingClubs,
          clubs: paginatedClubs,
          filteredCount: filteredClubs.length,
          currentPage,
          pageCount: clubPageCount,
          rowsPerPage: CLUBS_PER_PAGE,
          onPageChange: setCurrentPage,
          onViewClub: (club) => void openClubDetails(club),
        }}
        creationRequestProps={{
          requests: filteredRequests,
          isLoading: isLoadingRequests,
          statusFilter: requestFilter,
          search: requestSearch,
          onStatusFilterChange: setRequestFilter,
          onSearchChange: setRequestSearch,
        }}
      />


      {isCreateModalOpen && (
        <CreateClubModal
          form={createForm}
          isSubmitting={isCreating}
          onUploadImage={handleClubImageUpload}
          onRemoveImage={handleRemoveClubImage}
          isUploadingImage={isUploadingClubImage}
          imageError={clubImageError}
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
          onSubmitActivity={handleSubmitActivity}
          onEditActivity={handleEditActivity}
          onCancelActivityEdit={handleCancelActivityEdit}
          editingActivityId={editingActivityId}
          isCreatingActivity={isCreatingActivity}
          currentMember={currentMemberRecord}
          isCurrentLeader={isCurrentLeader}
          memberActionLoading={memberActionLoading}
          isLeavingClub={isLeavingClub}
          onTransferLeadership={handleTransferLeadership}
          onKickMember={handleKickMember}
          onLeaveClub={handleLeaveClub}
          onUpdateClubImage={handleUpdateClubImage}
          onUpdateClubOverview={handleUpdateClubOverview}
          isImageUpdating={isUpdatingClubImage}
          onClose={() => setSelectedClub(null)}
        />
      )}
    </div>
  );

};

export default MyClubs;