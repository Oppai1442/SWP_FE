import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bell,
  Camera,
  CheckCircle,
  Link2,
  Mail,
  MapPin,
  Palette,
  Phone,
  Save,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { getAccountDataAPI, saveData } from "./services/AccountSettings";
import type { AccountDataResponse, UserUpdateProfile } from "./types";

const DEFAULT_AVATAR_URL =
  "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg";

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [visibleSections, setVisibleSections] = useState(new Set<string>());
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const defaultProfileData: AccountDataResponse = useMemo(
    () => ({
      fullName: "",
      firstName: "",
      lastName: "",
      joinDate: "",
      email: "",
      phone: "",
      userCode: "",
      avatarUrl: DEFAULT_AVATAR_URL,
    }),
    []
  );
  const [profileData, setProfileData] = useState<AccountDataResponse>(defaultProfileData);
  const formattedJoinDate = useMemo(() => {
    if (!profileData.joinDate) return "Không rõ";
    const date = new Date(profileData.joinDate);
    if (Number.isNaN(date.getTime())) return "Không rõ";
    return date.toLocaleString("vi-VN", { year: "numeric", month: "long" });
  }, [profileData.joinDate]);
  const avatarPreviewUrl = useMemo(() => {
    const trimmed = profileData.avatarUrl?.trim();
    return trimmed || DEFAULT_AVATAR_URL;
  }, [profileData.avatarUrl]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.dataset.section) {
            setVisibleSections((prev) => new Set([...prev, entry.target.dataset.section as string]));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab]);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const data = await getAccountDataAPI();
      const rawAvatar =
        (typeof data?.avatarUrl === "string" ? data.avatarUrl : undefined) ??
        (typeof (data as any)?.avatarURL === "string" ? (data as any).avatarURL : undefined);
      const normalizedAvatar =
        typeof rawAvatar === "string" && rawAvatar.trim().length > 0
          ? rawAvatar.trim()
          : defaultProfileData.avatarUrl;

      setProfileData({
        fullName: data?.fullName ?? defaultProfileData.fullName,
        firstName: data?.firstName ?? defaultProfileData.firstName,
        lastName: data?.lastName ?? defaultProfileData.lastName,
        joinDate: data?.joinDate ?? defaultProfileData.joinDate,
        email: data?.email ?? defaultProfileData.email,
        phone: data?.phone ?? defaultProfileData.phone,
        userCode: data?.userCode ?? defaultProfileData.userCode,
        avatarUrl: normalizedAvatar,
      });
    } catch (error) {
      toast.error("Tải dữ liệu tài khoản thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoadingProfile(false);
    }
  }, [defaultProfileData]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleProfileUpdate = (field: keyof AccountDataResponse, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: UserUpdateProfile = {
        ...profileData,
        joinDate: profileData.joinDate,
        avatarUrl: profileData.avatarUrl?.trim() || DEFAULT_AVATAR_URL,
      };
      const isSuccess = await saveData(payload);
      if (isSuccess) {
        toast.success("Cập nhật thông tin tài khoản thành công.");
        await loadProfile();
      } else {
        toast.error("Cập nhật tài khoản thất bại. Vui lòng thử lại.");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Cập nhật tài khoản thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Hồ sơ", icon: User },
    { id: "preferences", label: "Tùy chọn", icon: Palette },
    { id: "security", label: "Bảo mật", icon: Shield },
    { id: "notifications", label: "Thông báo", icon: Bell },
    { id: "data", label: "Dữ liệu & Quyền riêng tư", icon: Trash2 },
  ];

  const preferences = [
    { id: "dark", label: "Chế độ tối", enabled: true },
    { id: "contrast", label: "Độ tương phản cao", enabled: false },
    { id: "motion", label: "Giảm chuyển động", enabled: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div
          data-section="header"
          className={`space-y-3 transition-all duration-700 ${
            visibleSections.has("header") ? "opacity-100" : "opacity-0 translate-y-3"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-orange-400">Hồ sơ của tôi</p>
          <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
            Cài đặt <span className="text-orange-500">tài khoản</span>
          </h1>
          <p className="text-base text-slate-500">Quản lý hồ sơ, tùy chọn và kiểm soát quyền riêng tư của bạn ở một nơi.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "border-orange-300 bg-orange-50 text-orange-600 shadow-sm"
                      : "border-transparent text-slate-500 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                  }`}
                  style={{ transitionDelay: `${index * 40}ms` }}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-orange-500" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-6 lg:col-span-3">
            {activeTab === "profile" && (
              <>
                <div
                  data-section="profile-header"
                  className={`rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition ${
                    visibleSections.has("profile-header") ? "opacity-100" : "opacity-0 translate-y-3"
                  }`}
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="relative">
                      <div className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                        <img
                          src={avatarPreviewUrl}
                          alt={`${profileData.firstName || "Người dùng"} ${profileData.lastName || "Ảnh đại diện"}`}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = DEFAULT_AVATAR_URL;
                          }}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.focus()}
                        className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-500 shadow-sm transition hover:scale-105"
                        aria-label="Cập nhật ảnh đại diện bằng liên kết hình ảnh"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h2 className="text-3xl font-semibold text-slate-900">
                        {profileData.firstName} {profileData.lastName}
                      </h2>
                      <p className="text-sm text-slate-500">@{profileData.fullName}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-orange-500" />
                          <span className="font-semibold text-orange-500">Đang hoạt động</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <span>Tham gia vào {formattedJoinDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  data-section="profile-form"
                  className={`rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition ${
                    visibleSections.has("profile-form") ? "opacity-100" : "opacity-0 translate-y-3"
                  }`}
                >
                  <h3 className="mb-6 text-2xl font-semibold text-slate-900">
                    Thông tin <span className="text-orange-500">cá nhân</span>
                  </h3>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-600">Liên kết ảnh đại diện</label>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          <img
                            src={avatarPreviewUrl}
                            alt="Xem trước ảnh đại diện"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = DEFAULT_AVATAR_URL;
                            }}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="relative flex-1">
                          <Link2 className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 transition group-focus-within:text-orange-500" />
                          <input
                            ref={avatarInputRef}
                            id="account-avatar-url"
                            type="url"
                            inputMode="url"
                            value={profileData.avatarUrl}
                            onChange={(e) => handleProfileUpdate("avatarUrl", e.target.value)}
                            onBlur={(e) => {
                              const trimmed = e.target.value.trim();
                              handleProfileUpdate("avatarUrl", trimmed || DEFAULT_AVATAR_URL);
                            }}
                            placeholder="https://example.com/avatar-cua-ban.jpg"
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                          />
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Dán một liên kết HTTPS trực tiếp đến hình ảnh hồ sơ của bạn. Để trống để giữ ảnh đại diện mặc định.
                      </p>
                    </div>

                    {["firstName", "lastName"].map((field) => (
                      <div key={field}>
                        <label className="mb-2 block text-sm font-medium text-slate-600">
                          { field === "firstName" ? "Tên" : "Họ"}
                        </label>
                        <input
                          type="text"
                          value={profileData[field as keyof AccountDataResponse] as string}
                          onChange={(e) => handleProfileUpdate(field as keyof AccountDataResponse, e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                    ))}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleProfileUpdate("email", e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Điện thoại</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => handleProfileUpdate("phone", e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">Vị trí</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          value={profileData.userCode}
                          onChange={(e) => handleProfileUpdate("userCode", e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "preferences" && (
              <div
                data-section="preferences"
                className={`rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition ${
                  visibleSections.has("preferences") ? "opacity-100" : "opacity-0 translate-y-3"
                }`}
              >
                <h3 className="mb-6 text-2xl font-semibold text-slate-900">
                  Tùy chọn <span className="text-orange-500">giao diện</span>
                </h3>
                <div className="space-y-6">
                  {preferences.map((pref, index) => (
                    <div
                      key={pref.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-orange-50/40 p-4 transition hover:border-orange-300"
                      style={{ transitionDelay: `${index * 80}ms` }}
                    >
                      <span className="text-sm font-semibold text-slate-700">{pref.label}</span>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          pref.enabled ? "bg-orange-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                            pref.enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!["profile", "preferences"].includes(activeTab) && (
              <div
                data-section="coming-soon"
                className={`rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition ${
                  visibleSections.has("coming-soon") ? "opacity-100" : "opacity-0 translate-y-3"
                }`}
              >
                <div className="py-16">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50">
                    {tabs.find((t) => t.id === activeTab)?.icon &&
                      React.createElement(tabs.find((t) => t.id === activeTab).icon, {
                        className: "h-8 w-8 text-orange-500",
                      })}
                  </div>
                  <h3 className="mb-2 text-2xl font-semibold text-slate-900">
                    Cài đặt <span className="text-orange-500">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                  </h3>
                  <p className="text-sm text-slate-500">Sắp ra mắt...</p>
                </div>
              </div>
            )}

            <div
              data-section="save-button"
              className={`flex justify-end transition ${
                visibleSections.has("save-button") ? "opacity-100" : "opacity-0 translate-y-3"
              }`}
            >
              <button
                onClick={handleSave}
                disabled={isSaving || isLoadingProfile}
                className="inline-flex items-center gap-3 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {isSaving ? (
                  <>
                    <Save className="h-4 w-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;