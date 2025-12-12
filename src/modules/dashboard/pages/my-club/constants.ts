import type {
  ClubActivityStatus,
  ClubJoinRequestStatus,
  ClubStatus,
} from './services/myClubService';
import type { ClubCreationRequestStatus } from '../club-queue/services/clubCreationQueueService';

export const clubStatusClasses: Record<ClubStatus, string> = {
  ACTIVE: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  PENDING: 'text-amber-600 bg-amber-50 border-amber-200',
  REJECTED: 'text-rose-600 bg-rose-50 border-rose-200',
  INACTIVE: 'text-slate-600 bg-slate-50 border-slate-200',
  ARCHIVED: 'text-slate-500 bg-slate-100 border-slate-200',
};

export const requestStatusMeta: Record<
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

export const joinRequestStatusMeta: Record<
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

export const activityStatusMeta: Record<
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

export const detailTabs = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'members', label: 'Thành viên' },
  { id: 'activities', label: 'Hoạt động' },
  { id: 'requests', label: 'Yêu cầu tham gia' },
  { id: 'settings', label: 'Cài đặt' },
] as const;

export type DetailTab = (typeof detailTabs)[number]['id'];
