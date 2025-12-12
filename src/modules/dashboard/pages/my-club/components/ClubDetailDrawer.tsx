import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { toast } from "react-hot-toast";
import {
  type ClubActivity,
  type ClubDetail,
  type ClubJoinRequest,
  type ClubJoinRequestStatus,
  type ClubMember,
  type ClubSettingInfo,
} from "../services/myClubService";
import {
  formatDate,
  formatDateTime,
  buildVietQrUrl,
  formatJoinFeeValue,
} from "../utils";
import type { ActivityFormState, BankInstructionForm } from "../types";
import {
  detailTabs,
  joinRequestStatusMeta,
  type DetailTab,
} from "../constants";
import {
  Crown,
  Image,
  Loader2,
  LogOut,
  RefreshCcw,
  Settings2,
  UserMinus,
  Users,
  Users2,
  X,
} from "lucide-react";
import { showToast } from "@/utils";

interface ClubDetailDrawerProps {
  club: ClubDetail;
  members: ClubMember[];
  membersVisible: boolean;
  settings?: ClubSettingInfo;
  activeTab: DetailTab;
  isMembersLoading: boolean;
  isSettingsLoading: boolean;
  onTabChange: (tab: DetailTab) => void;
  canManage: boolean;
  onRefreshInviteCode: (clubId: number) => void;
  bankForm: BankInstructionForm;
  onBankFormChange: (field: keyof BankInstructionForm, value: string) => void;
  onSaveBankSettings: () => void;
  isBankSettingsSaving: boolean;
  joinRequests: ClubJoinRequest[];
  joinQueueFilter: ClubJoinRequestStatus | "all";
  isJoinQueueLoading: boolean;
  onJoinQueueFilterChange: (value: ClubJoinRequestStatus | "all") => void;
  onRefreshJoinQueue: () => void;
  onDecideJoinRequest: (
    requestId: number,
    status: ClubJoinRequestStatus,
    note?: string | null
  ) => void;
  decisionLoadingMap: Record<number, boolean>;
  activities: ClubActivity[];
  isActivitiesLoading: boolean;
  activityForm: ActivityFormState;
  onActivityFormChange: (field: keyof ActivityFormState, value: string) => void;
  onSubmitActivity: () => void;
  onEditActivity: (activity: ClubActivity) => void;
  onCancelActivityEdit: () => void;
  editingActivityId: number | null;
  isCreatingActivity: boolean;
  currentMember: ClubMember | null;
  isCurrentLeader: boolean;
  memberActionLoading: Record<number, boolean>;
  isLeavingClub: boolean;
  onTransferLeadership: (member: ClubMember) => void;
  onKickMember: (member: ClubMember) => void;
  onLeaveClub: () => void;
  onUpdateClubImage: (clubId: number, file: File) => void;
  isImageUpdating: boolean;
  onUpdateClubOverview: (
    clubId: number,
    payload: Partial<{
      category: string | null;
      meetingLocation: string | null;
      description: string | null;
      mission: string | null;
      operatingDays: string[];
      operatingStartTime: string | null;
      operatingEndTime: string | null;
    }>
  ) => Promise<ClubDetail | void>;
  onClose: () => void;
}

type DrawerClubMember = ClubMember & { __virtual?: boolean };

type OverviewFormState = {
  category: string;
  meetingLocation: string;
  description: string;
  mission: string;
  operatingDays: string[];
  operatingStartTime: string;
  operatingEndTime: string;
};

const WEEKDAY_OPTIONS = [
  { value: "MONDAY", label: "Thứ 2" },
  { value: "TUESDAY", label: "Thứ 3" },
  { value: "WEDNESDAY", label: "Thứ 4" },
  { value: "THURSDAY", label: "Thứ 5" },
  { value: "FRIDAY", label: "Thứ 6" },
  { value: "SATURDAY", label: "Thứ 7" },
  { value: "SUNDAY", label: "Chủ nhật" },
] as const;

const WEEKDAY_LABELS: Record<string, string> = WEEKDAY_OPTIONS.reduce(
  (acc, day) => ({ ...acc, [day.value]: day.label }),
  {} as Record<string, string>
);
const resolveLeaderId = (club?: Pick<ClubDetail, "leaderId" | "presidentId">) =>
  club?.leaderId ?? club?.presidentId ?? null;

const resolveLeaderName = (
  club?: Pick<ClubDetail, "leaderName" | "presidentName">
) => club?.leaderName ?? club?.presidentName ?? "Trưởng nhóm câu lạc bộ";

const GMT7_OFFSET_MS = 7 * 60 * 60 * 1000;
const MIN_ACTIVITY_DURATION_MS = 2 * 60 * 60 * 1000;
const MIN_OPERATING_START = "05:00";
const MAX_OPERATING_END = "19:00";

const runtimeStatusMeta = {
  upcoming: {
    label: "Sắp diễn ra",
    className: "border-amber-200 bg-amber-50 text-amber-600",
  },
  ongoing: {
    label: "Đang diễn ra",
    className: "border-emerald-200 bg-emerald-50 text-emerald-600",
  },
  past: {
    label: "Đã qua",
    className: "border-slate-200 bg-slate-50 text-slate-500",
  },
} as const;

const toGmt7Millis = (value?: string | null) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return timestamp + GMT7_OFFSET_MS;
};

const ROLE_LABELS: Record<string, string> = {
  PRESIDENT: "Trưởng câu lạc bộ",
  MEMBER: "Thành viên",
};

const formatRoleLabel = (role?: string | null) =>
  role ? ROLE_LABELS[role] ?? role : "---";

const getRuntimeStatusMeta = (activity: ClubActivity) => {
  const now = Date.now() + GMT7_OFFSET_MS;
  const start = toGmt7Millis(activity.startDate);
  const end = toGmt7Millis(activity.endDate);

  if (start && now < start) {
    return runtimeStatusMeta.upcoming;
  }

  if (start && end) {
    if (now >= start && now <= end) {
      return runtimeStatusMeta.ongoing;
    }
    if (now > end) {
      return runtimeStatusMeta.past;
    }
  }

  if (start && !end) {
    return now >= start ? runtimeStatusMeta.past : runtimeStatusMeta.upcoming;
  }

  if (!start && end) {
    return now <= end ? runtimeStatusMeta.ongoing : runtimeStatusMeta.past;
  }

  return runtimeStatusMeta.upcoming;
};

const ClubDetailDrawer = ({
  club,
  members,
  membersVisible,
  settings,
  activeTab,
  isMembersLoading,
  isSettingsLoading,
  onTabChange,
  canManage,
  onRefreshInviteCode,
  bankForm,
  onBankFormChange,
  onSaveBankSettings,
  isBankSettingsSaving,
  joinRequests,
  joinQueueFilter,
  isJoinQueueLoading,
  onJoinQueueFilterChange,
  onRefreshJoinQueue,
  onDecideJoinRequest,
  decisionLoadingMap,
  activities,
  isActivitiesLoading,
  activityForm,
  onActivityFormChange,
  onSubmitActivity,
  onEditActivity,
  onCancelActivityEdit,
  editingActivityId,
  isCreatingActivity,
  currentMember,
  isCurrentLeader,
  memberActionLoading,
  isLeavingClub,
  onTransferLeadership,
  onKickMember,
  onLeaveClub,
  onUpdateClubImage,
  isImageUpdating,
  onUpdateClubOverview,
  onClose,
}: ClubDetailDrawerProps) => {
  const memberTabs = useMemo<DetailTab[]>(
    () => ["overview", "members", "activities"],
    []
  );
  const visibleTabs = useMemo(
    () =>
      canManage
        ? detailTabs
        : detailTabs.filter((tab) => memberTabs.includes(tab.id)),
    [canManage, memberTabs]
  );
  const resolvedTab = useMemo<DetailTab>(() => {
    if (canManage || memberTabs.includes(activeTab)) {
      return activeTab;
    }
    return "overview";
  }, [activeTab, canManage, memberTabs]);
  const isEditingActivity = Boolean(editingActivityId);
  const showMemberActions = canManage || Boolean(currentMember);
  const leaderId = resolveLeaderId(club);
  const leaderName = resolveLeaderName(club);
  const [isOverviewEditing, setIsOverviewEditing] = useState(false);
  const [isOverviewSaving, setIsOverviewSaving] = useState(false);
  const [overviewForm, setOverviewForm] = useState<OverviewFormState>(() =>
    buildOverviewFormState(club)
  );
  const selfMember = useMemo<DrawerClubMember | null>(() => {
    if (currentMember) {
      return currentMember as DrawerClubMember;
    }
    if (isCurrentLeader && leaderId) {
      return {
        id: -Math.abs(leaderId),
        clubId: club.id,
        memberId: leaderId,
        memberName: leaderName,
        role: "PRESIDENT",
        status: "ACTIVE",
        joinedAt: club.createdAt ?? club.updatedAt ?? null,
        notes: null,
        __virtual: true,
      };
    }
    return null;
  }, [club, currentMember, isCurrentLeader, leaderId, leaderName]);
  const displayedMembers = useMemo<DrawerClubMember[]>(() => {
    const unique = [...members] as DrawerClubMember[];
    const addMember = (memberToAdd?: DrawerClubMember | null) => {
      if (!memberToAdd) return;
      const exists = unique.some(
        (member) => member.memberId === memberToAdd.memberId
      );
      if (!exists) {
        unique.push(memberToAdd);
      }
    };
    addMember(selfMember);
    if (leaderId) {
      addMember({
        id: -Math.abs(leaderId),
        clubId: club.id,
        memberId: leaderId,
        memberName: leaderName,
        role: "PRESIDENT",
        status: "ACTIVE",
        joinedAt: club.createdAt ?? club.updatedAt ?? null,
        notes: null,
        __virtual: true,
      });
    }
    return unique;
  }, [club, members, selfMember, leaderId, leaderName]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const overviewOperatingDays = formatOperatingDays(club.operatingDays);
  const overviewOperatingHours = formatOperatingHours(
    club.operatingStartTime,
    club.operatingEndTime
  );

  useEffect(() => {
    setOverviewForm(buildOverviewFormState(club));
    setIsOverviewEditing(false);
  }, [club]);

  const handleOverviewFieldChange = <K extends keyof OverviewFormState>(
    field: K,
    value: OverviewFormState[K]
  ) => {
    setOverviewForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleOverviewDay = (dayValue: string) => {
    setOverviewForm((prev) => {
      const set = new Set(prev.operatingDays);
      if (set.has(dayValue)) {
        set.delete(dayValue);
      } else {
        set.add(dayValue);
      }
      return {
        ...prev,
        operatingDays: Array.from(set),
      };
    });
  };

  const handleOverviewCancel = () => {
    setOverviewForm(buildOverviewFormState(club));
    setIsOverviewEditing(false);
  };

  const handleOverviewSave = async () => {
    const { operatingStartTime, operatingEndTime } = overviewForm;
    if (
      (operatingStartTime && !operatingEndTime) ||
      (!operatingStartTime && operatingEndTime)
    ) {
      showToast("error", "Vui lòng nhập đầy đủ giờ bắt đầu và kết thúc.");
      return;
    }
    if (operatingStartTime && operatingStartTime < MIN_OPERATING_START) {
      showToast("error", "Giờ bắt đầu không được trước 05:00.");
      return;
    }
    if (operatingEndTime && operatingEndTime > MAX_OPERATING_END) {
      showToast("error", "Giờ kết thúc không được sau 19:00.");
      return;
    }
    if (
      operatingStartTime &&
      operatingEndTime &&
      operatingStartTime >= operatingEndTime
    ) {
      showToast("error", "Giờ kết thúc cần sau giờ bắt đầu.");
      return;
    }
    try {
      setIsOverviewSaving(true);
      await onUpdateClubOverview(club.id, {
        category: overviewForm.category.trim() || null,
        meetingLocation: overviewForm.meetingLocation.trim() || null,
        description: overviewForm.description.trim() || null,
        mission: overviewForm.mission.trim() || null,
        operatingDays: overviewForm.operatingDays,
        operatingStartTime: overviewForm.operatingStartTime || null,
        operatingEndTime: overviewForm.operatingEndTime || null,
      });
      showToast("success", "Đã cập nhật thông tin câu lạc bộ.");
      setIsOverviewEditing(false);
    } catch (error) {
      console.error(error);
      showToast("error", "Không thể cập nhật thông tin câu lạc bộ.");
    } finally {
      setIsOverviewSaving(false);
    }
  };
  const handleClubImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpdateClubImage(club.id, file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleActivitySubmit = () => {
    const { startDate, endDate } = activityForm;

    // 1. Kiểm tra thiếu
    if (!startDate || !endDate) {
      showToast("error", "Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc.");
      return;
    }

    // 2. Chuẩn hóa timezone (tránh việc new Date parse lệch múi giờ)
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startTime = start.getTime();
    const endTime = end.getTime();

    // 3. Kiểm tra parse lỗi
    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
      showToast("error", "Thời gian hoạt động không hợp lệ.");
      return;
    }

    // 4. Kiểm tra start >= end
    if (startTime >= endTime) {
      showToast("error", "Ngày bắt đầu phải đứng trước ngày kết thúc.");
      return;
    }

    // 5. Kiểm tra duration tối thiểu
    if (endTime - startTime < MIN_ACTIVITY_DURATION_MS) {
      showToast("error", "Mỗi hoạt động cần kéo dài ít nhất 2 giờ.");
      return;
    }

    // 6. (Optional) Kiểm tra không được chọn trước thời điểm hiện tại
    const now = Date.now();
    if (startTime < now) {
      showToast("error", "Thời gian bắt đầu không được ở quá khứ.");
      return;
    }

    // 7. (Optional) Giới hạn duration tối đa (VD: không quá 24h)
    const MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
    if (endTime - startTime > MAX_DURATION_MS) {
      showToast("error", "Thời lượng hoạt động không được vượt quá 24 giờ.");
      return;
    }

    // 8. (Optional) Kiểm tra sai format giờ (nếu UI tách ngày + giờ)
    // Ví dụ người dùng nhập 32:70 → vẫn parse được nhưng sai
    if (
      start.toString() === "Invalid Date" ||
      end.toString() === "Invalid Date"
    ) {
      showToast("error", "Định dạng thời gian không hợp lệ.");
      return;
    }

    // 9. (Optional) Kiểm tra năm/tháng nằm ngoài phạm vi hợp lý
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    if (
      startYear < 2000 ||
      startYear > 2100 ||
      endYear < 2000 ||
      endYear > 2100
    ) {
      showToast("error", "Thời gian nằm ngoài phạm vi cho phép.");
      return;
    }

    // Nếu mọi thứ OK
    onSubmitActivity();
  };

  // const handleCopyInviteCode = async () => {
  //   if (!club.inviteCode) {
  //     showToast("error", "Mã mời không có sẵn.");
  //     return;
  //   }

  //   try {
  //     await navigator.clipboard.writeText(club.inviteCode);
  //     showToast("success", "Đã sao chép mã mời.");
  //   } catch (error) {
  //     console.error(error);
  //     showToast("error", "Không thể sao chép mã mời.");
  //   }
  // };

  const handleDecision = (requestId: number, status: ClubJoinRequestStatus) => {
    const note =
      status === "REJECTED"
        ? window.prompt("Thêm ghi chú từ chối (tùy chọn)") ?? undefined
        : undefined;
    onDecideJoinRequest(requestId, status, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40">
      <div className="h-full w-full max-w-4xl overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-400">
              Câu lạc bộ
            </p>
            <h3 className="text-xl font-semibold text-slate-900">
              {club.name}
            </h3>
            <p className="text-xs text-slate-500">#{club.code ?? "N/A"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:text-orange-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  resolvedTab === tab.id
                    ? "bg-white text-orange-600 shadow"
                    : "text-slate-500 hover:text-orange-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {resolvedTab === "overview" && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetailItem label="Trạng thái" value={club.status} />
              <DetailItem label="Danh mục" value={club.category ?? "Chưa có"} />
              <DetailItem
                label="Ngày thành lập"
                value={formatDate(club.foundedDate)}
              />

              {/* --- ĐÃ SỬA: CỘNG THÊM 1 VÀO SỐ LƯỢNG THÀNH VIÊN --- */}
              <DetailItem
                label="Thành viên"
                value={`${(club.memberCount ?? 0) + 1}`}
              />

              <DetailItem
                label="Địa điểm họp"
                value={club.meetingLocation ?? "Chưa cập nhật"}
              />
              <DetailItem
                label="Sứ mệnh"
                value={club.mission ?? "Chưa cập nhật"}
              />
              <DetailItem
                label="Mô tả"
                value={club.description ?? "Chưa cập nhật"}
              />
              <DetailItem
                label="Ngày hoạt động"
                value={overviewOperatingDays ?? "Chưa cấu hình"}
              />
              <DetailItem
                label="Giờ hoạt động"
                value={overviewOperatingHours ?? "Chưa cấu hình"}
              />
            </div>
          )}

          {resolvedTab === "overview" && canManage && (
            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Chỉnh sửa thông tin
                  </p>
                  <p className="text-xs text-slate-500">
                    Cập nhật danh mục, địa điểm, sứ mệnh và lịch hoạt động của
                    câu lạc bộ.
                  </p>
                </div>
                {!isOverviewEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsOverviewEditing(true)}
                    className="rounded-2xl border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-500 transition hover:bg-orange-50"
                  >
                    Chỉnh sửa
                  </button>
                ) : null}
              </div>
              {isOverviewEditing && (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Danh mục
                      <input
                        type="text"
                        value={overviewForm.category}
                        onChange={(event) =>
                          handleOverviewFieldChange(
                            "category",
                            event.target.value
                          )
                        }
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="Thể thao, Văn hóa..."
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Địa điểm họp
                      <input
                        type="text"
                        value={overviewForm.meetingLocation}
                        onChange={(event) =>
                          handleOverviewFieldChange(
                            "meetingLocation",
                            event.target.value
                          )
                        }
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="Tòa nhà A..."
                      />
                    </label>
                  </div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sứ mệnh
                    <textarea
                      value={overviewForm.mission}
                      onChange={(event) =>
                        handleOverviewFieldChange("mission", event.target.value)
                      }
                      rows={3}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder="Sứ mệnh của câu lạc bộ..."
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mô tả
                    <textarea
                      value={overviewForm.description}
                      onChange={(event) =>
                        handleOverviewFieldChange(
                          "description",
                          event.target.value
                        )
                      }
                      rows={3}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder="Thêm thông tin khác về câu lạc bộ..."
                    />
                  </label>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ngày hoạt động
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {WEEKDAY_OPTIONS.map((day) => {
                        const selected = overviewForm.operatingDays.includes(
                          day.value
                        );
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleOverviewDay(day.value)}
                            className={`rounded-2xl border px-3 py-1.5 text-xs font-semibold transition ${
                              selected
                                ? "border-orange-400 bg-orange-50 text-orange-600"
                                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-200 hover:text-orange-500"
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Giờ bắt đầu
                      <input
                        type="time"
                        value={overviewForm.operatingStartTime}
                        onChange={(event) =>
                          handleOverviewFieldChange(
                            "operatingStartTime",
                            event.target.value
                          )
                        }
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Giờ kết thúc
                      <input
                        type="time"
                        value={overviewForm.operatingEndTime}
                        onChange={(event) =>
                          handleOverviewFieldChange(
                            "operatingEndTime",
                            event.target.value
                          )
                        }
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleOverviewCancel}
                      className="rounded-2xl border border-transparent px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                      disabled={isOverviewSaving}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleOverviewSave}
                      disabled={isOverviewSaving}
                      className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow shadow-orange-500/30 disabled:opacity-60"
                    >
                      {isOverviewSaving && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {resolvedTab === "members" && (
            <div className="mt-6 space-y-4">
              {selfMember && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Tư cách thành viên của bạn
                      </p>
                      <p className="text-xs text-slate-500">
                        Vai trò:{" "}
                        <span className="font-semibold text-slate-800">
                          {formatRoleLabel(selfMember.role)}
                        </span>
                        {selfMember.joinedAt && (
                          <span className="ml-2">
                            Đã tham gia {formatDate(selfMember.joinedAt)}
                          </span>
                        )}
                      </p>
                      {isCurrentLeader && (
                        <p className="text-xs text-amber-600">
                          Chuyển giao chức trưởng club cho thành viên khác trước
                          khi rời câu lạc bộ này.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={onLeaveClub}
                      disabled={
                        isCurrentLeader || isLeavingClub || !currentMember
                      }
                      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                        isCurrentLeader || !currentMember
                          ? "cursor-not-allowed border-amber-200 text-amber-500"
                          : "border-slate-200 text-slate-600 hover:border-orange-200 hover:text-orange-500 disabled:opacity-60"
                      }`}
                    >
                      <LogOut className="h-4 w-4" />
                      {isCurrentLeader
                        ? "Chuyển giao chức trưởng club để rời đi"
                        : isLeavingClub
                        ? "Đang rời đi..."
                        : "Rời câu lạc bộ"}
                    </button>
                  </div>
                </div>
              )}
              {!membersVisible ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-700">
                  Danh sách thành viên bị trưởng nhóm câu lạc bộ ẩn.
                </div>
              ) : isMembersLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : displayedMembers.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">
                  Không có thành viên nào để hiển thị.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Thành viên</th>
                        <th className="px-4 py-3 text-left">Vai trò</th>
                        <th className="px-4 py-3 text-left">Tham gia</th>
                        {showMemberActions && (
                          <th className="px-4 py-3 text-right">Hành động</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedMembers.map((member) => {
                        const rowLoading = Boolean(
                          memberActionLoading[member.id]
                        );
                        const isSelf =
                          Boolean(selfMember) &&
                          member.memberId === selfMember?.memberId;
                        const isSelfActual =
                          Boolean(currentMember) &&
                          member.memberId === currentMember?.memberId;
                        const isLeader = leaderId === member.memberId;
                        const isVirtual = Boolean(
                          (member as DrawerClubMember).__virtual
                        );
                        return (
                          <tr key={member.id} className="text-slate-700">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {member.memberName ?? "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {formatRoleLabel(member.role)}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {formatDate(member.joinedAt)}
                            </td>
                            {showMemberActions && (
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap justify-end gap-2">
                                  {canManage && !isLeader && !isVirtual && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onTransferLeadership(member)
                                      }
                                      disabled={rowLoading}
                                      className="inline-flex items-center gap-1 rounded-2xl border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-500 transition hover:bg-orange-50 disabled:opacity-50"
                                    >
                                      <Crown className="h-3.5 w-3.5" />
                                      Trưởng nhóm
                                    </button>
                                  )}
                                  {canManage && !isSelf && !isVirtual && (
                                    <button
                                      type="button"
                                      onClick={() => onKickMember(member)}
                                      disabled={rowLoading || isLeader}
                                      className="inline-flex items-center gap-1 rounded-2xl border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 disabled:opacity-50"
                                    >
                                      <UserMinus className="h-3.5 w-3.5" />
                                      Xóa
                                    </button>
                                  )}
                                  {isSelf && (
                                    <button
                                      type="button"
                                      onClick={onLeaveClub}
                                      disabled={
                                        rowLoading ||
                                        isCurrentLeader ||
                                        isLeavingClub ||
                                        !isSelfActual
                                      }
                                      className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500 disabled:opacity-50"
                                    >
                                      <LogOut className="h-3.5 w-3.5" />
                                      {isCurrentLeader
                                        ? "Chuyển giao trước"
                                        : isLeavingClub
                                        ? "Đang rời đi..."
                                        : "Rời đi"}
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {resolvedTab === "activities" && (
            <div className="mt-6 space-y-4">
              {canManage && (
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {isEditingActivity
                          ? "Cập nhật hoạt động"
                          : "Tạo hoạt động"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {isEditingActivity
                          ? "Điều chỉnh chi tiết hoạt động đã chọn và xuất bản các thay đổi."
                          : "Chỉ trưởng nhóm mới có thể thêm hoạt động câu lạc bộ mới."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditingActivity && (
                        <button
                          type="button"
                          onClick={onCancelActivityEdit}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-amber-200 hover:text-amber-500"
                        >
                          Hủy bỏ
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleActivitySubmit}
                        disabled={isCreatingActivity}
                        className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
                      >
                        {isCreatingActivity && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {isEditingActivity ? "Lưu thay đổi" : "Tạo sự kiện"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tiêu đề
                      <input
                        type="text"
                        value={activityForm.title}
                        onChange={(event) =>
                          onActivityFormChange("title", event.target.value)
                        }
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="Ngày định hướng"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Địa điểm
                      <input
                        type="text"
                        value={activityForm.location}
                        onChange={(event) =>
                          onActivityFormChange("location", event.target.value)
                        }
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="Thính phòng A2"
                      />
                    </label>
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ngày bắt đầu
                      <input
                        type="datetime-local"
                        value={activityForm.startDate}
                        onChange={(event) =>
                          onActivityFormChange("startDate", event.target.value)
                        }
                        required
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ngày kết thúc
                      <input
                        type="datetime-local"
                        value={activityForm.endDate}
                        onChange={(event) =>
                          onActivityFormChange("endDate", event.target.value)
                        }
                        required
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      />
                    </label>
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ngân sách
                      <input
                        type="number"
                        min="0"
                        value={activityForm.budget}
                        onChange={(event) =>
                          onActivityFormChange("budget", event.target.value)
                        }
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="500000"
                      />
                    </label>
                    <div />
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Mô tả
                      <textarea
                        value={activityForm.description}
                        onChange={(event) =>
                          onActivityFormChange(
                            "description",
                            event.target.value
                          )
                        }
                        rows={3}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="Chia sẻ chương trình hoặc mong đợi."
                      />
                    </label>
                  </div>
                </div>
              )}
              {isActivitiesLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Chưa có hoạt động nào được xuất bản.
                </p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => {
                    const statusMeta = getRuntimeStatusMeta(activity);
                    return (
                      <div
                        key={activity.id}
                        className={`rounded-2xl border bg-white px-4 py-3 shadow-sm ${
                          editingActivityId === activity.id
                            ? "border-orange-200"
                            : "border-slate-100"
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {activity.title}
                            </p>
                            {activity.description && (
                              <p className="text-xs text-slate-500">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${statusMeta.className}`}
                            >
                              {statusMeta.label}
                            </span>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => onEditActivity(activity)}
                                className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500"
                              >
                                Sửa
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                          {activity.startDate && (
                            <span>
                              Bắt đầu{" "}
                              <strong className="text-slate-900">
                                {formatDateTime(activity.startDate)}
                              </strong>
                            </span>
                          )}
                          {activity.endDate && (
                            <span>
                              Kết thúc{" "}
                              <strong className="text-slate-900">
                                {formatDateTime(activity.endDate)}
                              </strong>
                            </span>
                          )}
                          {activity.location && (
                            <span>
                              Địa điểm{" "}
                              <strong className="text-slate-900">
                                {activity.location}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {resolvedTab === "requests" && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Yêu cầu tham gia
                  </p>
                  <p className="text-xs text-slate-500">
                    Xem xét bằng chứng thanh toán trước khi chấp nhận thành viên
                    mới.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={joinQueueFilter}
                    onChange={(event) =>
                      onJoinQueueFilterChange(
                        event.target.value as ClubJoinRequestStatus | "all"
                      )
                    }
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="PENDING">Đang chờ</option>
                    <option value="APPROVED">Đã phê duyệt</option>
                    <option value="REJECTED">Bị từ chối</option>
                    <option value="all">Tất cả</option>
                  </select>
                  <button
                    type="button"
                    onClick={onRefreshJoinQueue}
                    disabled={isJoinQueueLoading}
                    className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500 disabled:opacity-60"
                  >
                    <RefreshCcw
                      className={`h-3.5 w-3.5 ${
                        isJoinQueueLoading ? "animate-spin" : ""
                      }`}
                    />
                    Làm mới
                  </button>
                </div>
              </div>
              {isJoinQueueLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : joinRequests.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Không có yêu cầu nào phù hợp với trạng thái đã chọn.
                </p>
              ) : (
                joinRequests.map((request) => {
                  const statusMeta = joinRequestStatusMeta[request.status];
                  const decisionLoading = Boolean(
                    decisionLoadingMap[request.id]
                  );
                  return (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {request.applicantName ?? "Ứng viên không xác định"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Đã gửi {formatDateTime(request.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      {request.motivation && (
                        <p className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          {request.motivation}
                        </p>
                      )}
                      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Mã chuyển khoản
                        </p>
                        {request.transferCode ? (
                          <p className="mt-2 break-all font-mono text-sm font-semibold text-slate-900">
                            {request.transferCode}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-slate-500">
                            Chưa có mã chuyển khoản. Cần yêu cầu bổ sung trước
                            khi phê duyệt.
                          </p>
                        )}
                      </div>
                      {request.status === "PENDING" && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleDecision(request.id, "REJECTED")
                            }
                            disabled={decisionLoading || !canManage}
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-50"
                          >
                            {decisionLoading ? "Đang xử lý" : "Từ chối"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDecision(request.id, "APPROVED")
                            }
                            disabled={decisionLoading || !canManage}
                            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
                          >
                            {decisionLoading ? "Đang xử lý" : "Phê duyệt"}
                          </button>
                        </div>
                      )}
                      {!canManage && request.status === "PENDING" && (
                        <p className="mt-3 text-xs text-slate-500">
                          Chỉ trưởng nhóm câu lạc bộ mới có thể phê duyệt hoặc
                          từ chối yêu cầu.
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {resolvedTab === "settings" && (
            <div className="mt-6 space-y-3">
              {isSettingsLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <Fragment>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                      {club.imageUrl ? (
                        <img
                          src={club.imageUrl}
                          alt={club.name}
                          className="h-60 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-60 flex-col items-center justify-center gap-2 text-slate-400">
                          <Image className="h-8 w-8 text-orange-400" />
                          <p className="text-sm font-semibold text-slate-500">
                            Chưa có ảnh câu lạc bộ
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Ảnh câu lạc bộ
                      </p>
                      <p className="text-xs text-slate-500">
                        {canManage
                          ? "Cập nhật ảnh bìa để thể hiện bản sắc câu lạc bộ."
                          : "Chỉ trưởng nhóm mới có thể thay đổi ảnh này."}
                      </p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isImageUpdating}
                          className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-500 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isImageUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Image className="h-4 w-4" />
                          )}
                          {isImageUpdating
                            ? "Đang cập nhật..."
                            : "Cập nhật ảnh"}
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleClubImageChange}
                  />
                  {/* <SettingItem
                    icon={Users}
                    label="Yêu cầu phê duyệt"
                    value={settings?.requireApproval ?? true}
                  />
                  <SettingItem
                    icon={Users2}
                    label="Cho phép danh sách chờ"
                    value={settings?.allowWaitlist ?? true}
                  />
                  <SettingItem
                    icon={Settings2}
                    label="Thông báo"
                    value={settings?.enableNotifications ?? true}
                  /> */}
                  <BankInstructionCard
                    club={club}
                    canManage={canManage}
                    settings={settings}
                    bankForm={bankForm}
                    onChange={onBankFormChange}
                    onSave={onSaveBankSettings}
                    isSaving={isBankSettingsSaving}
                  />
                  {/* <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Invite code</p>
                        <p className="text-xs text-slate-500">
                          Share this code so members can join instantly.
                        </p>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onRefreshInviteCode(club.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-500 transition hover:bg-orange-50"
                        >
                          Làm mới
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <code className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
                        {club.inviteCode ?? 'Unavailable'}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyInviteCode}
                        className="rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500"
                      >
                        Sao chép
                      </button>
                    </div>
                  </div> */}
                </Fragment>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
interface DetailItemProps {
  label: string;
  value: string | number;
}

const DetailItem = ({ label, value }: DetailItemProps) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

interface SettingItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: boolean;
}

const SettingItem = ({ icon: Icon, label, value }: SettingItemProps) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
        value ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
      }`}
    >
      <Icon className="h-4 w-4" />
    </span>
    <div className="flex-1">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-xs text-slate-500">{value ? "Đã bật" : "Đã tắt"}</p>
    </div>
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
        value ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
      }`}
    >
      {value ? "BẬT" : "TẮT"}
    </span>
  </div>
);

interface BankInstructionCardProps {
  club: ClubDetail;
  canManage: boolean;
  settings?: ClubSettingInfo;
  bankForm: BankInstructionForm;
  onChange: (field: keyof BankInstructionForm, value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const BankInstructionCard = ({
  club,
  canManage,
  settings,
  bankForm,
  onChange,
  onSave,
  isSaving,
}: BankInstructionCardProps) => {
  const formAmount = Number(bankForm.joinFee || 0);
  const configuredAmount =
    settings?.joinFee !== undefined && settings?.joinFee !== null
      ? settings.joinFee
      : 0;
  const amountForPreview = canManage ? formAmount : configuredAmount;
  const bankId = canManage ? bankForm.bankId : settings?.bankId ?? "";
  const accountNo = canManage
    ? bankForm.bankAccountNumber
    : settings?.bankAccountNumber ?? "";
  const accountName =
    (canManage ? bankForm.bankAccountName : settings?.bankAccountName) ??
    settings?.clubName ??
    club.name ??
    "";
  const transferNote =
    settings?.clubCode ?? club.code ?? club.name ?? "";
  const qrUrl = buildVietQrUrl({
    bankId,
    bankAccountNumber: accountNo,
    bankAccountName: accountName,
    amount: amountForPreview,
    content: transferNote,
  });
  const isConfigured = Boolean(bankId && accountNo);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          Hướng dẫn ngân hàng
        </p>
        <p className="text-xs text-slate-500">
          Thành viên thanh toán qua VietQR, sau đó gửi yêu cầu tham gia để
          trưởng nhóm phê duyệt.
        </p>
      </div>
      {canManage ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mã ngân hàng
              <input
                type="text"
                value={bankForm.bankId}
                onChange={(event) => onChange("bankId", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="ví dụ: ACB"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Số tài khoản
              <input
                type="text"
                value={bankForm.bankAccountNumber}
                onChange={(event) =>
                  onChange("bankAccountNumber", event.target.value)
                }
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="0123456789"
              />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tên tài khoản
              <input
                type="text"
                value={bankForm.bankAccountName}
                onChange={(event) =>
                  onChange("bankAccountName", event.target.value)
                }
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="NGUYEN VAN A"
              />
            </label>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phí tham gia (VND)
              <input
                type="number"
                min="0"
                value={bankForm.joinFee}
                onChange={(event) => onChange("joinFee", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="50000"
              />
            </label>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="rounded-2xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
            >
              {isSaving ? "Đang lưu" : "Lưu"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2 text-sm">
          {isConfigured ? (
            <Fragment>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Ngân hàng</span>
                <span className="font-semibold text-slate-900">{bankId}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Tài khoản</span>
                <span className="font-semibold text-slate-900">
                  {accountNo}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Tên tài khoản</span>
                <span className="font-semibold text-slate-900">
                  {accountName}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Phí tham gia</span>
                <span className="font-semibold text-slate-900">
                  {formatJoinFeeValue(amountForPreview)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Ghi chú chuyển khoản</span>
                <span className="font-semibold text-slate-900">
                  {transferNote}
                </span>
              </div>
            </Fragment>
          ) : (
            <p className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-amber-700">
              Trưởng nhóm chưa cấu hình hướng dẫn ngân hàng.
            </p>
          )}
        </div>
      )}
      {isConfigured && qrUrl && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-center">
          <img
            src={qrUrl}
            alt="VietQR"
            className="mx-auto h-36 w-36 rounded-2xl border border-white bg-white object-contain p-3 shadow-inner"
          />
          <p className="mt-2 text-xs text-slate-500">
            Quét QR để thanh toán {formatJoinFeeValue(amountForPreview)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClubDetailDrawer;

const buildOverviewFormState = (club: ClubDetail): OverviewFormState => ({
  category: club.category ?? "",
  meetingLocation: club.meetingLocation ?? "",
  description: club.description ?? "",
  mission: club.mission ?? "",
  operatingDays: club.operatingDays ?? [],
  operatingStartTime: club.operatingStartTime ?? "",
  operatingEndTime: club.operatingEndTime ?? "",
});

const formatOperatingDays = (days?: string[] | null) => {
  if (!days || days.length === 0) {
    return null;
  }
  if (days.length === WEEKDAY_OPTIONS.length) {
    return "Hoạt động cả tuần";
  }
  return days.map((day) => WEEKDAY_LABELS[day] ?? day).join(", ");
};

const formatOperatingHours = (start?: string | null, end?: string | null) => {
  if (!start || !end) {
    return null;
  }
  return `${start} - ${end}`;
};
