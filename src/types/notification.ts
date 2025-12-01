export type NotificationType = 'info' | 'warning' | 'success' | 'error' | string;

export interface NotificationDTO {
  id: number;
  title: string;
  message: string | null;
  type: NotificationType;
  event: string | null;
  link: string | null;
  seen: boolean;
  createdAt: string;
  seenAt?: string | null;
  user?: {
    id: number;
  } | null;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  event: string | null;
  link: string | null;
  seen: boolean;
  createdAt: string;
  seenAt?: string | null;
  userId?: number | null;
}

