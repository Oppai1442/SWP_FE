import { deleteData, getData, postData, putData } from '@/services/api/apiService';
import { buildQuery } from '@/utils';

export type ClubStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'PENDING' | 'REJECTED';

export interface ClubSummary {
  id: number;
  code: string | null;
  inviteCode?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  status: ClubStatus;
  meetingLocation?: string | null;
  mission?: string | null;
  foundedDate?: string | null;
  memberCount?: number | null;
  advisorId?: number | null;
  advisorName?: string | null;
  presidentId?: number | null;
  presidentName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type ClubDetail = ClubSummary;

export interface CreateClubPayload {
  code?: string;
  name: string;
  description?: string;
  category?: string;
  meetingLocation?: string;
  mission?: string;
  foundedDate?: string | null;
  advisorId?: number | null;
  presidentId?: number | null;
}

export type ClubMemberRole = 'PRESIDENT' | 'VICE_PRESIDENT' | 'TREASURER' | 'SECRETARY' | 'LEAD' | 'MEMBER';
export type ClubMemberStatus = 'ACTIVE' | 'ONBOARDING' | 'PENDING' | 'SUSPENDED' | 'LEFT';

export interface ClubMember {
  id: number;
  clubId: number;
  clubName?: string | null;
  memberId: number;
  memberName: string;
  role: ClubMemberRole;
  status: ClubMemberStatus;
  joinedAt?: string | null;
  notes?: string | null;
}

export interface ClubSettingInfo {
  id: number;
  clubId: number;
  clubName?: string | null;
  clubCode?: string | null;
  requireApproval?: boolean | null;
  allowWaitlist?: boolean | null;
  enableNotifications?: boolean | null;
  joinFee?: number | null;
  bankId?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  bankTransferNote?: string | null;
}

export type ClubJoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ClubJoinRequest {
  id: number;
  clubId: number;
  clubName?: string | null;
  applicantId?: number | null;
  applicantName?: string | null;
  motivation?: string | null;
  paymentProofUrl?: string | null;
  status: ClubJoinRequestStatus;
  reviewerId?: number | null;
  reviewerName?: string | null;
  reviewerNote?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StorageObjectInfo {
  bucket: string;
  key: string;
  url: string;
  contentType: string;
  size: number;
}

export interface JoinClubByInvitePayload {
  inviteCode: string;
  motivation?: string;
  paymentProofUrl: string;
}

export type ClubActivityStatus = 'PLANNING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';

export interface ClubActivity {
  id: number;
  clubId: number;
  clubName?: string | null;
  title: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  budget?: number | null;
  status: ClubActivityStatus;
  createdById?: number | null;
  createdByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateClubActivityPayload {
  title: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: string;
  budget?: number | null;
  status?: ClubActivityStatus;
  createdById?: number | null;
}

export interface UpdateClubPayload {
  code?: string | null;
  name?: string;
  description?: string | null;
  category?: string | null;
  status?: ClubStatus;
  meetingLocation?: string | null;
  mission?: string | null;
  foundedDate?: string | null;
  advisorId?: number | null;
  presidentId?: number | null;
}

export interface UpdateClubMemberPayload {
  clubId?: number;
  memberId?: number;
  role?: ClubMemberRole;
  status?: ClubMemberStatus;
  notes?: string | null;
}

const unwrap = <T>(response: any): T => (response?.data ?? response) as T;

export const getClubsAPI = async (status: ClubStatus | 'all' = 'all') => {
  const query = buildQuery({
    status: status !== 'all' ? status : undefined,
  });
  const response = await getData<ClubSummary[]>(`/clubs${query ? `?${query}` : ''}`);
  return unwrap<ClubSummary[]>(response);
};

export const getClubDetailAPI = async (clubId: number) => {
  const response = await getData<ClubDetail>(`/clubs/${clubId}`);
  return unwrap<ClubDetail>(response);
};

export const createClubAPI = async (payload: CreateClubPayload) => {
  const response = await postData<ClubDetail>('/clubs', payload);
  return unwrap<ClubDetail>(response);
};

export const updateClubAPI = async (clubId: number, payload: UpdateClubPayload) => {
  const response = await putData<ClubDetail>(`/clubs/${clubId}`, payload);
  return unwrap<ClubDetail>(response);
};

export const getClubMembersAPI = async (clubId: number) => {
  const query = buildQuery({ clubId });
  const response = await getData<ClubMember[]>(`/club-members?${query}`);
  return unwrap<ClubMember[]>(response);
};

export const updateClubMemberAPI = async (memberId: number, payload: UpdateClubMemberPayload) => {
  const response = await putData<ClubMember>(`/club-members/${memberId}`, payload);
  return unwrap<ClubMember>(response);
};

export const removeClubMemberAPI = async (memberId: number) => {
  await deleteData<void>(`/club-members/${memberId}`);
};

export const getClubSettingsAPI = async (clubId: number) => {
  const response = await getData<ClubSettingInfo>(`/club-settings/${clubId}`);
  return unwrap<ClubSettingInfo>(response);
};

export const updateClubSettingsAPI = async (
  clubId: number,
  payload: Partial<ClubSettingInfo>
) => {
  const response = await putData<ClubSettingInfo>(`/club-settings/${clubId}`, payload);
  return unwrap<ClubSettingInfo>(response);
};

export const getClubSettingsByInviteCodeAPI = async (inviteCode: string) => {
  const response = await getData<ClubSettingInfo>(`/club-settings/invite-code/${inviteCode}`);
  return unwrap<ClubSettingInfo>(response);
};

export const refreshInviteCodeAPI = async (clubId: number) => {
  const response = await postData<ClubDetail>(`/clubs/${clubId}/invite-code/refresh`, {});
  return unwrap<ClubDetail>(response);
};

export const uploadPaymentProofAPI = async (clubId: number, file: File) => {
  const formData = new FormData();
  formData.append('clubId', String(clubId));
  formData.append('file', file);
  const response = await postData<StorageObjectInfo>(`/storage/payment-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap<StorageObjectInfo>(response);
};

export const joinClubByInviteCodeAPI = async (payload: JoinClubByInvitePayload) => {
  const response = await postData(`/club-queue/join-code`, payload);
  return unwrap(response);
};

export const getClubJoinRequestsAPI = async (
  clubId: number,
  status: ClubJoinRequestStatus | 'all' = 'all'
) => {
  const query = buildQuery({
    clubId,
    status: status === 'all' ? undefined : status,
  });
  const response = await getData<ClubJoinRequest[]>(`/club-queue${query ? `?${query}` : ''}`);
  return unwrap<ClubJoinRequest[]>(response);
};

export const getJoinRequestHistoryAPI = async (
  status: ClubJoinRequestStatus | 'all' = 'all'
) => {
  const query = buildQuery({
    status: status === 'all' ? undefined : status,
  });
  const response = await getData<ClubJoinRequest[]>(`/club-queue${query ? `?${query}` : ''}`);
  return unwrap<ClubJoinRequest[]>(response);
};

export interface ReviewJoinRequestPayload {
  status: ClubJoinRequestStatus;
  reviewerId?: number | null;
  note?: string | null;
}

export const reviewClubJoinRequestAPI = async (
  requestId: number,
  payload: ReviewJoinRequestPayload
) => {
  const response = await putData<ClubJoinRequest>(`/club-queue/${requestId}/decision`, payload);
  return unwrap<ClubJoinRequest>(response);
};

export const getClubActivitiesAPI = async (clubId: number) => {
  const query = buildQuery({ clubId });
  const response = await getData<ClubActivity[]>(`/club-activities?${query}`);
  return unwrap<ClubActivity[]>(response);
};

export const createClubActivityAPI = async (
  clubId: number,
  payload: CreateClubActivityPayload
) => {
  const response = await postData<ClubActivity>(`/club-activities`, {
    clubId,
    ...payload,
  });
  return unwrap<ClubActivity>(response);
};

export const updateClubActivityAPI = async (
  activityId: number,
  payload: Partial<CreateClubActivityPayload> & { clubId?: number }
) => {
  const response = await putData<ClubActivity>(`/club-activities/${activityId}`, payload);
  return unwrap<ClubActivity>(response);
};
