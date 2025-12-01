import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Menu, X, Bell, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Assets } from "@/assets";
import { useNotifications } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { ROUTES } from "@/constant/routes";

const DEFAULT_AVATAR_URL =
  "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg";

const Navbar = () => {
  const { loading, user, logOut, renderAuth, showAuthModal } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markManyAsRead,
  } = useNotifications();

  const dropdownRef = useRef(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleNotification = () =>
    setNotificationOpen((prev) => !prev);

  const handleClickOutside = useCallback((event) => {
    const target = event.target;
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(target)
    ) {
      setDropdownOpen(false);
    }
    if (
      notificationRef.current &&
      !notificationRef.current.contains(target)
    ) {
      setNotificationOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleItemClick = (action?: string) => {
    if (action === "logout") {
      logOut();
    }
    setDropdownOpen(false);
    setMenuOpen(false);
  };

  const handleNotificationClick = async (id: number, link?: string | null) => {
    await markAsRead(id);
    if (link) {
      navigate(link);
      setNotificationOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((item) => !item.seen).map((item) => item.id);
    if (unreadIds.length === 0) return;
    await markManyAsRead(unreadIds);
  };

  const latestNotifications = notifications.slice(0, 5);

  const navLinks = [
    { path: ROUTES.HOME.getPath(), label: "Overview" },
    { path: ROUTES.TOS.getPath(), label: "ToS" },
    { path: ROUTES.POLICY.getPath(), label: "Policies" },
    { path: ROUTES.CONTACT.getPath(), label: "Support" },
  ];

  const menuItems = [
    // Primary entry depends on role
    user?.role?.name === "ROLE_ADMIN"
      ? {
        icon: User,
        label: "Dashboard",
        onClick: () => handleItemClick(),
        href: ROUTES.DASHBOARD.getPath(),
      }
      : {
        icon: User,
        label: "My Requests",
        onClick: () => handleItemClick(),
        href: ROUTES.DASHBOARD.child.MY_REQUESTS.getPath(),
      },
    {
      icon: Settings,
      label: "Settings",
      onClick: () => handleItemClick(),
      href: ROUTES.DASHBOARD.child.ACCOUNT_SETTINGS.getPath(),
    },
    {
      icon: LogOut,
      label: "Logout",
      onClick: () => handleItemClick("logout"),
      isButton: true,
    },
  ];

  const avatarUrl =
    user?.avatarUrl && user.avatarUrl.trim().length > 0
      ? user.avatarUrl.trim()
      : DEFAULT_AVATAR_URL;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-slate-200 text-slate-900 py-4 z-[100] shadow-sm">
        <div className="container mx-auto px-4 md:px-12 flex items-center justify-between relative">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={Assets.Images.Logo}
              alt="ClubHub"
              className="h-12 w-auto cursor-pointer"
            />
            <div className="leading-tight hidden sm:block">
              <p className="text-lg font-semibold tracking-wide">ClubHub</p>
              <p className="text-[10px] uppercase tracking-[0.4em] text-orange-300">FPT University</p>
            </div>
          </Link>

          {/* Hamburger icon (mobile) */}
          <button
            className="md:hidden text-slate-900 p-2 hover:bg-slate-100 rounded-xl transition-colors"
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Centered Nav */}
          <ul
            className={`absolute md:static top-full left-0 right-0 w-full md:w-auto bg-white md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-b md:border-b-0 border-slate-200 flex-col md:flex-row flex items-center gap-2 md:gap-1 py-4 md:py-0 mt-4 md:mt-0
              ${isMenuOpen ? "flex" : "hidden md:flex"}`}
          >
            {navLinks.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  className="px-4 py-2 rounded-xl font-medium text-slate-500 hover:text-orange-500 hover:bg-orange-50 transition-all duration-300 block"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Auth + Avatar */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Notification Button */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={toggleNotification}
                    className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors group"
                  >
                    <Bell className="w-5 h-5 text-slate-500 group-hover:text-orange-500 transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {Math.min(unreadCount, 9)}
                        {unreadCount > 9 && "+"}
                      </span>
                    )}
                  </button>

                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white backdrop-blur-xl rounded-2xl shadow-2xl shadow-orange-500/10 border border-slate-200 z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <div>
                          <p className="text-sm text-slate-900 font-medium">Notifications</p>
                          <p className="text-xs text-slate-500 font-light">
                            You have {unreadCount} unread notifications
                          </p>
                        </div>
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-orange-500 hover:text-orange-400 font-medium"
                        >
                          Mark all as read
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-orange-200">
                        {latestNotifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-slate-400 font-light text-sm">
                            No notifications yet
                          </div>
                        ) : (
                          latestNotifications.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleNotificationClick(item.id, item.link ?? undefined)}
                              className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-orange-50 transition-all duration-300 ${!item.seen ? "bg-orange-50 border-l-2 border-l-orange-400" : ""
                                }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm text-slate-900 font-medium">{item.title}</p>
                                  <p className="text-xs text-slate-500 font-light mt-1 line-clamp-2">
                                    {item.message}
                                  </p>
                                </div>
                                {!item.seen && (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-500">
                                    <Check className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-light mt-2">
                                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                              </p>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-3 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setNotificationOpen(false);
                            navigate(ROUTES.DASHBOARD.child.NOTIFICATION_MANAGEMENT.getPath());
                          }}
                          className="w-full text-sm font-medium text-orange-500 hover:text-orange-400"
                        >
                          View all notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div ref={dropdownRef} className="relative flex items-center gap-2">
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all duration-300 group"
                  >
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full ring-2 ring-slate-200 group-hover:ring-orange-400 transition-all"
                    />
                    <span className="font-light hidden lg:block">{user.username}</span>
                    <svg
                      className={`w-4 h-4 text-slate-500 group-hover:text-orange-500 transition-all duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                      {/* Menu Header */}
                      <div className="px-4 py-4 border-b border-slate-100 bg-gradient-to-br from-orange-50 to-white">
                        <p className="text-sm font-medium text-slate-900">Welcome back</p>
                        <p className="text-xs text-slate-500 mt-1 font-light">Manage your account</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {menuItems.map((item, index) => {
                          const IconComponent = item.icon;

                          if (item.isButton) {
                            return (
                              <button
                                key={index}
                                onClick={item.onClick}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:text-orange-500 hover:bg-orange-50 transition-all duration-200 group"
                              >
                                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-orange-100 transition-all duration-200">
                                  <IconComponent className="w-4 h-4 text-slate-500 group-hover:text-orange-500 transition-colors" />
                                </div>
                                <span>{item.label}</span>
                              </button>
                            );
                          }

                          return (
                            <a
                              key={index}
                              href={item.href}
                              onClick={item.onClick}
                              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:text-orange-500 hover:bg-orange-50 transition-all duration-200 group"
                            >
                              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-orange-100 transition-all duration-200">
                                <IconComponent className="w-4 h-4 text-slate-500 group-hover:text-orange-500 transition-colors" />
                              </div>
                              <span>{item.label}</span>
                            </a>
                          );
                        })}
                      </div>

                      {/* Menu Footer */}
                      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                        <p className="text-xs text-slate-500 text-center font-light">Version 1.0.0</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showAuthModal("signIn")}
                  className="px-6 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 bg-white hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all duration-300"
                >
                  Sign In
                </button>
                <button
                  onClick={() => showAuthModal("signUp")}
                  className="px-6 py-2 rounded-xl bg-orange-500 font-medium text-white hover:bg-orange-600 hover:scale-105 hover:shadow-lg hover:shadow-orange-200 transition-all duration-300"
                >
                  Sign Up
                </button>
              </div>
            )}

          </div>
        </div>
      </nav>

      {renderAuth()}
    </>
  );
};

export default Navbar;
