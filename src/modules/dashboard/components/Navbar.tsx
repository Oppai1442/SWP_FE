import type { FC, MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constant/routes";
import { useNotifications } from "@/context/NotificationContext";

const DEFAULT_AVATAR_URL =
  "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg";

type NavbarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
};

const Navbar: FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { loading, user, logOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markManyAsRead } = useNotifications();
  const latestNotifications = notifications.slice(0, 8);
  const navigate = useNavigate();

  const avatarUrl =
    user?.avatarUrl && user.avatarUrl.trim().length > 0
      ? user.avatarUrl.trim()
      : DEFAULT_AVATAR_URL;

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;
    if (
      notificationRef.current &&
      !notificationRef.current.contains(target) &&
      userMenuRef.current &&
      !userMenuRef.current.contains(target)
    ) {
      setNotificationOpen(false);
      setUserMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((item) => !item.seen).map((item) => item.id);
    if (!unreadIds.length) return;
    await markManyAsRead(unreadIds);
  };

  const handleNotificationClick = async (notification: (typeof notifications)[number]) => {
    await markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      setNotificationOpen(false);
    }
  };

  const handleLogout = () => {
    logOut();
    navigate(ROUTES.HOME.path);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-orange-400 hover:text-orange-500"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="text-left text-lg font-semibold text-slate-900"
            >
              Văn phòng ClubHub
            </button>
            <span className="text-xs uppercase tracking-[0.4em] text-orange-400">Các club FPTU</span>
          </div>
        </div>

        <div className="hidden flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 md:flex md:max-w-lg">
          <Search
            className={`h-4 w-4 flex-shrink-0 transition-colors ${
              searchFocused ? "text-orange-500" : "text-slate-400"
            }`}
          />
          <input
            type="text"
            placeholder="Tìm club, thành viên, yêu cầu..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* <div className="hidden items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 sm:flex sm:gap-2">
            <ArrowLeftRight className="h-4 w-4 text-orange-500" />
            Đang đăng nhập dưới vai trò {user?.role?.name?.replace("ROLE_", "") ?? "USER"}
          </div> */}

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setNotificationOpen((prev) => !prev);
                setUserMenuOpen(false);
              }}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-orange-400 hover:text-orange-500"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">
                  {Math.min(unreadCount, 9)}{unreadCount > 9 ? "+" : ""}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Thông báo</p>
                    <p className="text-xs text-slate-500">{unreadCount} chưa đọc</p>
                  </div>
                  <button
                    onClick={markAllAsRead}
                    className="inline-flex items-center gap-1 rounded-full border border-orange-200 px-3 py-1 text-xs text-orange-500 hover:bg-orange-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Đánh dấu tất cả
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {latestNotifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      Hiện chưa có thông báo mới
                    </div>
                  ) : (
                    latestNotifications.map((notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`flex w-full flex-col gap-1 border-b border-slate-100 px-5 py-3 text-left text-sm ${
                          notification.seen ? "bg-white" : "bg-orange-50"
                        } hover:bg-orange-50/80`}
                      >
                        <div className="flex items-start gap-2">
                          <Check
                            className={`h-4 w-4 flex-shrink-0 ${
                              notification.seen ? "text-slate-300" : "text-orange-500"
                            }`}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 line-clamp-2">{notification.title}</p>
                            {notification.message && (
                              <p className="text-xs text-slate-500 line-clamp-2">{notification.message}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setUserMenuOpen((prev) => !prev);
                setNotificationOpen(false);
              }}
              className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:border-orange-400 hover:text-orange-500"
            >
              <img
                src={avatarUrl}
                alt={user?.username ?? "Avatar"}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = DEFAULT_AVATAR_URL;
                }}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="hidden text-left text-sm font-medium md:block">
                <p className="text-slate-900">{user?.fullName ?? user?.username ?? "Ẩn danh"}</p>
                <p className="text-xs text-slate-400">{loading ? "Đang tải..." : user?.email}</p>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition ${userMenuOpen ? "rotate-180 text-orange-500" : "text-slate-400"}`}
              />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{user?.fullName ?? user?.username}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <div className="p-2">
                  <a
                    href={ROUTES.DASHBOARD.child.ACCOUNT_SETTINGS.getPath()}
                    className="flex items-center gap-3 rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-orange-50"
                  >
                    <User className="h-4 w-4" /> Hồ sơ
                  </a>
                  <a
                    href={ROUTES.DASHBOARD.child.ACCOUNT_SETTINGS.getPath()}
                    className="flex items-center gap-3 rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-orange-50"
                  >
                    <Settings className="h-4 w-4" /> Thiết lập
                  </a>
                  <hr className="my-2 border-slate-100" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
