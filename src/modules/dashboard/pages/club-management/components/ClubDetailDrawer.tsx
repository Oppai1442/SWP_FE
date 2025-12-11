// components/ClubDetailDrawer.tsx

import { X, ImageIcon, Loader2 } from "lucide-react";
import type {
  ClubSummary,
  ClubDetail,
  ClubMember,
  ClubActivity,
  ClubSettingInfo,
  ClubJoinRequest,
  ClubMemberStatus,
} from "../../my-club/services/myClubService";
import { formatDate, formatDateTime } from "../../my-club/utils";

// --- Constants ---
const detailTabs = [
  { id: "overview", label: "Tổng quan" },
  { id: "members", label: "Thành viên" },
  { id: "activities", label: "Hoạt động" },
  { id: "settings", label: "Cài đặt" },
  { id: "history", label: "Lịch sử tham gia" },
] as const;

type DetailTab = (typeof detailTabs)[number]["id"];

// --- Sub-Component: Hiển thị 1 dòng thông tin ---
const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

// --- Sub-Component: Nội dung chính của từng Tab ---
interface DetailContentProps {
  tab: DetailTab;
  club: ClubDetail;
  members: ClubMember[];
  activities: ClubActivity[];
  settings: ClubSettingInfo | null;
  history: ClubJoinRequest[];
}

const DetailContent = ({
  tab,
  club,
  members = [],
  activities = [],
  settings,
  history = [],
}: DetailContentProps) => {
  // --- Logic chung: Xử lý danh sách thành viên & Leader ---
  // Mục đích: Dùng chung cho cả tab "Tổng quan" (để đếm số lượng) và tab "Thành viên" (để hiển thị)
  const leaderId = club.leaderId ?? club.presidentId;
  const leaderName =
    club.leaderName ?? club.presidentName ?? "Trưởng nhóm câu lạc bộ";

  // Kiểm tra xem Leader đã có trong danh sách members chưa
  const isLeaderInList = members.some(
    (member) => member.memberId === leaderId || member.role === "PRESIDENT"
  );

  // Nếu chưa có, ta tạo một danh sách ảo bao gồm cả Leader
  const resolvedMembers: ClubMember[] =
    Boolean(leaderId && leaderName) && !isLeaderInList
      ? [
          ...members,
          {
            id: -(leaderId ?? club.id ?? Date.now()),
            clubId: club.id,
            clubName: club.name,
            memberId: leaderId ?? 0,
            memberName: leaderName,
            role: "PRESIDENT",
            status: "ACTIVE" as ClubMemberStatus,
            joinedAt: club.createdAt ?? club.foundedDate ?? null,
            notes: "Club leader",
          },
        ]
      : members;

  // Tính tổng số thành viên thực tế (bao gồm Leader)
  const realMemberCount = resolvedMembers.length;

  // --- 1. Tab Tổng quan ---
  if (tab === "overview") {
    return (
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <DetailItem label="Danh mục" value={club.category ?? "Không áp dụng"} />
        <DetailItem label="Trạng thái" value={club.status} />
        <DetailItem label="Leader" value={leaderName} />
        {/* Đã sửa: Sử dụng số lượng thực tế đã tính toán thay vì club.memberCount */}
        <DetailItem label="Số thành viên" value={String(realMemberCount)} />
        <DetailItem
          label="Ngày thành lập"
          value={formatDate(club.foundedDate)}
        />
        <DetailItem
          label="Sứ mệnh"
          value={club.mission ?? "Chưa được cung cấp"}
        />
        <DetailItem
          label="Địa điểm sinh hoạt"
          value={club.meetingLocation ?? "Chưa được cung cấp"}
        />
      </div>
    );
  }

  // --- 2. Tab Thành viên ---
  if (tab === "members") {
    return resolvedMembers.length === 0 ? (
      <p className="py-6 text-sm text-slate-500">
        Không có thành viên nào được ghi nhận.
      </p>
    ) : (
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Thành viên</th>
              <th className="px-4 py-3 text-left">Vai trò</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-left">Tham gia lúc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resolvedMembers.map((member) => (
              <tr key={member.id} className="text-slate-700">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {member.memberName ?? "Không rõ"}
                </td>
                <td className="px-4 py-3 text-slate-500">{member.role}</td>
                <td className="px-4 py-3 text-slate-500">{member.status}</td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDate(member.joinedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // --- 3. Tab Hoạt động ---
  if (tab === "activities") {
    return activities.length === 0 ? (
      <p className="py-6 text-sm text-slate-500">
        Không có hoạt động nào được ghi nhận.
      </p>
    ) : (
      <div className="mt-6 space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
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
              <span className="text-xs font-semibold uppercase text-slate-500">
                {activity.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              {activity.startDate && (
                <span>
                  Bắt đầu{" "}
                  <strong className="text-slate-900">
                    {formatDate(activity.startDate)}
                  </strong>
                </span>
              )}
              {activity.endDate && (
                <span>
                  Kết thúc{" "}
                  <strong className="text-slate-900">
                    {formatDate(activity.endDate)}
                  </strong>
                </span>
              )}
              {activity.location && (
                <span>
                  Địa điểm{" "}
                  <strong className="text-slate-900">{activity.location}</strong>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // --- 4. Tab Cài đặt (Đã thêm QR Code) ---
  if (tab === "settings") {
    if (!settings)
      return (
        <p className="py-6 text-sm text-slate-500">
          Cài đặt chưa được cấu hình.
        </p>
      );

    // Tạo link QR VietQR
    const qrUrl =
      settings.bankId && settings.bankAccountNumber
        ? `https://img.vietqr.io/image/${settings.bankId}-${
            settings.bankAccountNumber
          }-compact.png?amount=${settings.joinFee ?? 0}&addInfo=${encodeURIComponent(
            settings.bankTransferNote ?? ""
          )}&accountName=${encodeURIComponent(settings.bankAccountName ?? "")}`
        : null;

    return (
      <div className="mt-6 space-y-4">
        {/* Phần hiển thị QR Code */}
        {qrUrl && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-6">
            <div className="rounded-lg bg-white p-2 shadow-sm">
               <img src={qrUrl} alt="Mã QR Chuyển khoản" className="h-48 w-48 object-contain" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Quét mã để thanh toán phí gia nhập
            </p>
            <p className="text-xs font-bold text-orange-500 mt-1">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(settings.joinFee ?? 0)}
            </p>
          </div>
        )}

        {/* Thông tin chi tiết */}
        <div className="grid gap-4 md:grid-cols-2">
            <DetailItem
              label="Ngân hàng"
              value={settings.bankId ?? "—"}
            />
            <DetailItem
              label="Số tài khoản"
              value={settings.bankAccountNumber ?? "—"}
            />
            <DetailItem
              label="Tên tài khoản"
              value={settings.bankAccountName ?? "—"}
            />
            <DetailItem
              label="Phí gia nhập"
              value={settings.joinFee ? `${settings.joinFee.toLocaleString()} VND` : "Miễn phí"}
            />
        </div>
        
        <div className="space-y-3">
             <DetailItem
              label="Ghi chú chuyển khoản"
              value={settings.bankTransferNote ?? "—"}
            />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
            <DetailItem
              label="Yêu cầu phê duyệt"
              value={settings.requireApproval ? "Có" : "Không"}
            />
            <DetailItem
              label="Danh sách chờ"
              value={settings.allowWaitlist ? "Cho phép" : "Không"}
            />
            <DetailItem
              label="Thông báo"
              value={settings.enableNotifications ? "Bật" : "Tắt"}
            />
        </div>
      </div>
    );
  }

  // --- 5. Tab Lịch sử ---
  return history.length === 0 ? (
    <p className="py-6 text-sm text-slate-500">
      Không tìm thấy lịch sử tham gia.
    </p>
  ) : (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left">Thành viên</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
            <th className="px-4 py-3 text-left">Đã gửi</th>
            <th className="px-4 py-3 text-left">Đã xem xét</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {history.map((request) => (
            <tr key={request.id} className="text-slate-700">
              <td className="px-4 py-3 font-medium text-slate-900">
                {request.applicantName ?? "Không xác định"}
              </td>
              <td className="px-4 py-3 text-slate-500">{request.status}</td>
              <td className="px-4 py-3 text-slate-500">
                {formatDateTime(request.createdAt)}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {formatDateTime(request.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Main Drawer Component ---
interface ClubDetailDrawerProps {
  clubSummary: ClubSummary;
  club: ClubDetail | null;
  members: ClubMember[];
  activities: ClubActivity[];
  settings: ClubSettingInfo | null;
  history: ClubJoinRequest[];
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  isLoading: boolean;
  onClose: () => void;
}

export const ClubDetailDrawer = ({
  clubSummary,
  club,
  activeTab,
  onTabChange,
  isLoading,
  onClose,
  ...rest
}: ClubDetailDrawerProps) => {
  const resolved = club ?? (clubSummary as ClubDetail);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40">
      <div className="h-full w-full max-w-4xl overflow-y-auto bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-400">
              Câu lạc bộ
            </p>
            <h3 className="text-xl font-semibold text-slate-900">
              {resolved.name}
            </h3>
            <p className="text-xs text-slate-500">#{resolved.code ?? "N/A"}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 hover:text-orange-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Ảnh đại diện (View Only) */}
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 h-64 relative w-full">
            {resolved.imageUrl ? (
              <img
                src={resolved.imageUrl}
                alt={resolved.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2">
                <ImageIcon className="h-8 w-8 text-orange-400" />
                <p className="text-sm font-semibold text-slate-500">
                  Chưa có ảnh đại diện
                </p>
              </div>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {detailTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === t.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {isLoading ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Loader2 className="animate-spin h-5 w-5" />
            </div>
          ) : (
            <DetailContent tab={activeTab} club={resolved} {...rest} />
          )}
        </div>
      </div>
    </div>
  );
};