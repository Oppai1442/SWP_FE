import { getData, postData } from '@/services/api/apiService';
import { buildQuery } from '@/utils';

export type ClubCreationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ClubCreationRequest {
  id: number;
  clubId: number | null;
  clubName: string | null;
  status: ClubCreationRequestStatus;
  submittedById: number | null;
  submittedByName: string | null;
  reviewedById: number | null;
  reviewedByName: string | null;
  note: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface ClubCreationQueueDecisionPayload {
  status: ClubCreationRequestStatus;
  note?: string | null;
  reviewerId?: number | null;
}

export const getClubCreationRequestsAPI = async (status: ClubCreationRequestStatus | 'all' = 'all') => {
  const query = buildQuery({
    status: status === 'all' ? undefined : status,
  });
  const response = await getData<ClubCreationRequest[]>(
    `/club-queue/creation${query ? `?${query}` : ''}`
  );
  return response.data ?? response;
};

export const decideClubCreationRequestAPI = async (requestId: number, payload: ClubCreationQueueDecisionPayload) => {
  const response = await postData<ApiResponse<ClubCreationRequest>>(
    `/club-queue/creation/${requestId}/decision`,
    payload
  );
  return response.data ?? response;
};
