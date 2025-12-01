import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useSTOMP } from "@/context/STOMP";
import {
  deleteNotificationAPI,
  fetchUserNotificationsAPI,
  markNotificationAsReadAPI,
} from "@/services/notification/notificationService";
import type {
  NotificationDTO,
  NotificationItem,
  PageResponse,
} from "@/types/notification";
import { toast } from "react-hot-toast";

type NotificationContextValue = {
  notifications: NotificationItem[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  refresh: (options?: { page?: number; size?: number }) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markManyAsRead: (ids: number[]) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteMany: (ids: number[]) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

const mapNotification = (dto: NotificationDTO): NotificationItem => ({
  id: dto.id,
  title: dto.title ?? "",
  message: dto.message ?? "",
  type: dto.type ?? "info",
  event: dto.event ?? null,
  link: dto.link ?? null,
  seen: dto.seen ?? false,
  createdAt: dto.createdAt ?? new Date().toISOString(),
  seenAt: dto.seenAt ?? null,
  userId: dto.user?.id ?? null,
});

const mergeNotifications = (
  current: NotificationItem[],
  incoming: NotificationItem
) => {
  const existingIndex = current.findIndex((item) => item.id === incoming.id);
  if (existingIndex === -1) {
    return [incoming, ...current].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const updated = [...current];
  updated[existingIndex] = { ...updated[existingIndex], ...incoming };
  return updated.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { subscribe } = useSTOMP();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<(() => void) | null>(null);
  const currentPageRef = useRef<{ page: number; size: number }>({
    page: 0,
    size: 50,
  });

  const fetchNotifications = useCallback(
    async ({
      page,
      size,
    }: {
      page?: number;
      size?: number;
    } = {}): Promise<void> => {
      if (!user?.id) {
        setNotifications([]);
        return;
      }

      const params = {
        page: page ?? currentPageRef.current.page,
        size: size ?? currentPageRef.current.size,
      };

      try {
        setLoading(true);
        setError(null);
        const response: PageResponse<NotificationDTO> =
          await fetchUserNotificationsAPI(user.id, params);
        currentPageRef.current = params;

        const items = response.content.map(mapNotification);
        setNotifications((prev) => {
          const map = new Map<number, NotificationItem>();
          [...items, ...prev].forEach((item) => {
            map.set(item.id, item);
          });
          return Array.from(map.values()).sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      } catch (err: any) {
        console.error("Failed to load notifications", err);
        setError(err?.message ?? "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setError(null);
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
      return;
    }

    fetchNotifications();
  }, [user?.id, fetchNotifications]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const destination = `/topic/notification/user/${user.id}`;
    const unsubscribe = subscribe(destination, (message) => {
      try {
        const parsed: NotificationDTO = JSON.parse(message.body);
        const mapped = mapNotification(parsed);
        setNotifications((prev) => mergeNotifications(prev, mapped));
      } catch (err) {
        console.error("Failed to parse notification message", err);
      }
    });

    subscriptionRef.current = unsubscribe;

    return () => {
      unsubscribe?.();
      subscriptionRef.current = null;
    };
  }, [user?.id, subscribe]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await markNotificationAsReadAPI(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, seen: true, seenAt: new Date().toISOString() }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
      toast.error("Unable to mark notification as read.");
      throw err;
    }
  }, []);

  const markManyAsRead = useCallback(async (ids: number[]) => {
    const uniqueIds = Array.from(new Set(ids));
    await Promise.all(uniqueIds.map((id) => markAsRead(id).catch(() => null)));
  }, [markAsRead]);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await deleteNotificationAPI(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
      toast.error("Unable to delete notification.");
      throw err;
    }
  }, []);

  const deleteMany = useCallback(async (ids: number[]) => {
    const uniqueIds = Array.from(new Set(ids));
    await Promise.all(
      uniqueIds.map((id) => deleteNotification(id).catch(() => null))
    );
  }, [deleteNotification]);

  const contextValue = useMemo<NotificationContextValue>(() => {
    const unreadCount = notifications.filter((item) => !item.seen).length;
    return {
      notifications,
      loading,
      error,
      unreadCount,
      refresh: fetchNotifications,
      markAsRead,
      markManyAsRead,
      deleteNotification,
      deleteMany,
    };
  }, [
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markManyAsRead,
    deleteNotification,
    deleteMany,
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const value = useContext(NotificationContext);
  if (!value) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return value;
};
