import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  Trash2,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

type FilterType =
  | "all"
  | "unread"
  | "read"
  | "info"
  | "warning"
  | "success"
  | "error";

const filterLabels: Record<FilterType, string> = {
  all: "Tất cả",
  unread: "Chưa đọc",
  read: "Đã đọc",
  info: "Thông tin",
  warning: "Cảnh báo",
  success: "Thành công",
  error: "Lỗi",
};

const NotificationPage = () => {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markManyAsRead,
    deleteNotification,
    deleteMany,
  } = useNotifications();

  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>(
    []
  );
  const notificationsPerPage = 5;

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm]);

  useEffect(() => {
    setSelectedNotifications((prev) =>
      prev.filter((id) => notifications.some((notif) => notif.id === id))
    );
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return notifications.filter((notif) => {
      const matchesFilter = (() => {
        if (filterType === "all") return true;
        if (filterType === "unread") return !notif.seen;
        if (filterType === "read") return notif.seen;
        return (notif.type ?? "").toLowerCase() === filterType.toLowerCase();
      })();

      if (!matchesFilter) return false;
      if (!query) return true;

      const haystack = `${notif.title ?? ""} ${notif.message ?? ""} ${
        notif.type ?? ""
      } ${notif.event ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [notifications, filterType, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / notificationsPerPage)
  );
  const startIndex = (currentPage - 1) * notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + notificationsPerPage
  );

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "warning":
        return <AlertCircle className="w-5 h-5" />;
      case "info":
        return <Info className="w-5 h-5" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "success":
        return "text-emerald-500";
      case "warning":
        return "text-amber-500";
      case "error":
        return "text-rose-500";
      case "info":
      default:
        return "text-orange-500";
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((nId) => nId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedNotifications.length === currentNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(currentNotifications.map((notif) => notif.id));
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
    } catch {
      // Error toast handled in context
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const ids = filteredNotifications.filter((n) => !n.seen).map((n) => n.id);
      if (!ids.length) return;
      await markManyAsRead(ids);
      setSelectedNotifications([]);
    } catch {
      // handled in context
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await deleteNotification(id);
      setSelectedNotifications((prev) => prev.filter((nId) => nId !== id));
    } catch {
      // handled in context
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedNotifications.length) return;
    try {
      await deleteMany(selectedNotifications);
      setSelectedNotifications([]);
    } catch {
      // handled in context
    }
  };

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = 0;
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-orange-400">Trung tâm thông báo</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">
              Thông báo <span className="text-orange-500">của tôi</span>
            </h1>
            <p className="mt-2 text-base text-slate-500">Quản lý và theo dõi tất cả thông báo của bạn ở một nơi.</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600">
                {unreadCount} chưa đọc
              </span>
            )}
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-400"
            >
              <Check className="h-4 w-4" />
              Đánh dấu tất cả đã đọc
            </button>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm thông báo..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  showFilters ? "border border-orange-300 bg-orange-50 text-orange-600" : "border border-slate-200 text-slate-600 hover:border-orange-200"
                }`}
              >
                <Filter className="h-4 w-4" /> Bộ lọc
              </button>
              {(["all", "unread", "read"] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold capitalize transition ${
                    filterType === filter
                      ? "border border-orange-300 bg-orange-50 text-orange-600"
                      : "border border-slate-200 text-slate-600 hover:border-orange-200"
                  }`}
                >
                  {filterLabels[filter]}
                </button>
              ))}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-500">Lọc theo loại</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["info", "success", "warning", "error"] as FilterType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold capitalize transition ${
                      filterType === type
                        ? "border border-orange-300 bg-orange-50 text-orange-600"
                        : "border border-slate-200 text-slate-600 hover:border-orange-200"
                    }`}
                  >
                    {getTypeIcon(type)}
                    {filterLabels[type]}
                  </button>
                ))}
                <button
                  onClick={() => setFilterType("all")}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-600"
                >
                  Đặt lại
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-600"
            >
              {selectedNotifications.length === currentNotifications.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedNotifications.length === 0}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold ${
                selectedNotifications.length === 0
                  ? "border-slate-200 text-slate-300"
                  : "border-rose-200 text-rose-500 hover:bg-rose-50"
              }`}
            >
              <Trash2 className="h-4 w-4" />
              Xóa mục đã chọn
            </button>
          </div>
          <span className="text-sm text-slate-500">{filteredNotifications.length} thông báo được tìm thấy</span>
        </section>

        <div ref={listRef} className="max-h-[520px] space-y-4 overflow-y-auto pr-1 scrollbar-thin">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-orange-200 bg-orange-50">
                <Bell className="h-7 w-7 text-orange-500" />
              </div>
              <p className="text-lg font-semibold text-slate-900">Không tìm thấy thông báo nào</p>
              <p className="mt-2 text-sm text-slate-500">Hãy thử điều chỉnh bộ lọc hoặc kiểm tra lại sau để biết các cập nhật.</p>
            </div>
          ) : (
            currentNotifications.map((notif, index) => {
              const isSelected = selectedNotifications.includes(notif.id);
              const typeColor = getTypeColor(notif.type);
              const category = notif.event ?? notif.type ?? "general";
              return (
                <div
                  key={notif.id}
                  className={`rounded-3xl border p-6 shadow-sm transition ${
                    notif.seen ? "border-slate-200 bg-white" : "border-orange-200 bg-orange-50/70"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <button onClick={() => toggleSelection(notif.id)} className="mt-1">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border-2 transition ${
                          isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </button>

                    <div className={`${typeColor} mt-1`}>{getTypeIcon(notif.type)}</div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className={`text-lg font-semibold ${notif.seen ? "text-slate-600" : "text-slate-900"}`}>
                          {notif.title}
                          {!notif.seen && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-orange-500" />}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock className="h-4 w-4" />
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 whitespace-pre-line">{notif.message}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 capitalize">{category}</span>
                        {notif.link && (
                          <a href={notif.link} className="text-orange-500 hover:text-orange-600">
                            Xem chi tiết
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!notif.seen && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-orange-500 transition hover:border-orange-300 hover:bg-orange-50"
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
            {error}
          </div>
        )}

        {filteredNotifications.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Hiển thị từ {startIndex + 1} đến {Math.min(startIndex + notificationsPerPage, filteredNotifications.length)} của {filteredNotifications.length} thông báo
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-orange-200 hover:text-orange-500 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`rounded-2xl border px-3 py-1.5 text-sm font-medium ${
                    currentPage === index + 1
                      ? "border-orange-300 bg-orange-50 text-orange-600"
                      : "border-slate-200 text-slate-600 hover:border-orange-200 hover:text-orange-600"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-orange-200 hover:text-orange-500 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(249, 115, 22, 0.3);
          border-radius: 999px;
        }

        .scrollbar-thin:hover::-webkit-scrollbar-thumb {
          background-color: rgba(249, 115, 22, 0.5);
        }
      `}</style>
    </div>
  );
};

export default NotificationPage;