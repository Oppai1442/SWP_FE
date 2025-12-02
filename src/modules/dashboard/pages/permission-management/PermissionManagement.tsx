import { Shield, Users, Settings, Eye, Edit, ChevronDown, ChevronUp, Plus, Search, Save, RotateCcw, History, Crown, UserCheck, UserX, Zap, Lock, Key, Database, FileText, BarChart3, MessageSquare, Trash2, X, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { getPermissionsAPI, getRolesAPI } from "./services/permissionManagement";
import type { PermissionResponse, RoleResponse } from "./types";

interface Permission {
  id: number;
  name: string;
  category: string;
  icon: LucideIcon;
  description: string;
}

interface Role {
  id: number;
  name: string;
  icon: LucideIcon;
  color: string;
  users: number;
  description: string;
}

const permissionVisualConfig: Record<string, { icon: LucideIcon; category: string }> = {
  SYSTEM_VIEW_DASHBOARD: { icon: Eye, category: "Hệ thống" },
  SYSTEM_MANAGE_SETTINGS: { icon: Settings, category: "Hệ thống" },
  SYSTEM_VIEW_LOGS: { icon: History, category: "Hệ thống" },
  SYSTEM_MANAGE_ROLES: { icon: Shield, category: "Hệ thống" },
  USER_CREATE: { icon: Plus, category: "Người dùng" },
  USER_VIEW: { icon: Eye, category: "Người dùng" },
  USER_EDIT: { icon: Edit, category: "Người dùng" },
  USER_DELETE: { icon: Trash2, category: "Người dùng" },
  USER_LOCK: { icon: Lock, category: "Người dùng" },
  FINANCE_VIEW: { icon: BarChart3, category: "Tài chính" },
  FINANCE_EDIT: { icon: Edit, category: "Tài chính" },
  FINANCE_EXPORT: { icon: Database, category: "Tài chính" },
  SUPPORT_VIEW_TICKETS: { icon: MessageSquare, category: "Hỗ trợ" },
  SUPPORT_MANAGE_TICKETS: { icon: MessageSquare, category: "Hỗ trợ" },
  SUPPORT_ASSIGN_TICKETS: { icon: UserCheck, category: "Hỗ trợ" },
  CONTENT_CREATE: { icon: Plus, category: "Nội dung" },
  CONTENT_VIEW: { icon: Eye, category: "Nội dung" },
  CONTENT_EDIT: { icon: Edit, category: "Nội dung" },
  CONTENT_DELETE: { icon: Trash2, category: "Nội dung" },
  CONTENT_PUBLISH: { icon: Zap, category: "Nội dung" },
  API_ACCESS: { icon: Key, category: "API" },
  API_MANAGE_KEYS: { icon: Key, category: "API" },
};

const defaultPermissionVisual = { icon: Shield, category: "Khác" } satisfies {
  icon: LucideIcon;
  category: string;
};

const roleVisualConfig: Record<string, { icon: LucideIcon; color: string; description: string }> = {
  "Super Admin": { icon: Crown, color: "from-orange-500 to-orange-600", description: "Cấp truy cập cao nhất trên toàn nền tảng" },
  Admin: { icon: Shield, color: "from-orange-400 to-orange-500", description: "Quản trị viên hệ thống" },
  Manager: { icon: UserCheck, color: "from-amber-400 to-orange-500", description: "Trách nhiệm quản lý cấp cao" },
  Teacher: { icon: Users, color: "from-amber-300 to-orange-400", description: "Giảng viên và người hướng dẫn" },
  Assistant: { icon: UserCheck, color: "from-orange-300 to-orange-400", description: "Trợ giảng và thành viên hỗ trợ" },
  Student: { icon: Eye, color: "from-orange-200 to-orange-300", description: "Học viên đã đăng ký khóa học" },
  Moderator: { icon: UserX, color: "from-rose-300 to-orange-400", description: "Đội ngũ kiểm duyệt nội dung" },
  Examiner: { icon: FileText, color: "from-orange-200 to-orange-300", description: "Chuyên gia đánh giá và thi cử" },
  Analyst: { icon: BarChart3, color: "from-amber-400 to-orange-500", description: "Phân tích và báo cáo dữ liệu" },
  Support: { icon: MessageSquare, color: "from-orange-300 to-orange-400", description: "Đại diện hỗ trợ khách hàng" },
  Guest: { icon: Lock, color: "from-slate-200 to-slate-300", description: "Truy cập khách có giới hạn" },
  Auditor: { icon: Key, color: "from-orange-400 to-orange-500", description: "Kiểm toán và tuân thủ hệ thống" },
};

const defaultRoleVisual = {
  icon: Shield,
  color: "from-orange-400 to-orange-500",
  description: "Vai trò hệ thống",
} satisfies { icon: LucideIcon; color: string; description: string };

const PermissionManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set());
  const [showAddPermission, setShowAddPermission] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapPermissionResponseToUI = (permission: PermissionResponse): Permission => {
    const visual = permissionVisualConfig[permission.name] ?? defaultPermissionVisual;
    return {
      id: permission.id,
      name: permission.name,
      category: visual.category,
      icon: visual.icon,
      description: permission.description,
    };
  };

  const mapRoleResponseToUI = (role: RoleResponse) => {
    const visual = roleVisualConfig[role.name] ?? defaultRoleVisual;
    return {
      role: {
        id: role.id,
        name: role.name,
        icon: visual.icon,
        color: visual.color,
        users: role.userCount ?? 0,
        description: visual.description,
      } satisfies Role,
      permissionIds: Array.from(
        new Set((role.permissions ?? []).map((permission) => permission.id))
      ),
    };
  };

  useEffect(() => {
    const loadPermissionsAndRoles = async () => {
      try {
        setLoading(true);
        const [permissionsResponse, rolesResponse] = await Promise.all([
          getPermissionsAPI(),
          getRolesAPI(),
        ]);

        const mappedPermissions = permissionsResponse.map(mapPermissionResponseToUI);
        setPermissions(mappedPermissions);

        const mappedRoles = rolesResponse.map(mapRoleResponseToUI);
        const permissionMap = mappedRoles.reduce<Record<number, number[]>>((acc, current) => {
          acc[current.role.id] = current.permissionIds;
          return acc;
        }, {});

        setRoles(mappedRoles.map((entry) => entry.role));
        setRolePermissions(permissionMap);
        if (mappedRoles.length > 0) {
          const initialExpanded = new Set<number>(
            mappedRoles
              .slice(0, Math.min(4, mappedRoles.length))
              .map((entry) => entry.role.id)
          );
          setExpandedRoles(initialExpanded);
        }
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu quyền:', err);
        const message = err instanceof Error
          ? err.message
          : 'Lỗi khi tải quyền. Vui lòng thử lại sau.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    loadPermissionsAndRoles();
  }, []);

  const toggleRoleExpansion = (roleId: number) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const addPermissionToRole = (roleId: number, permissionId: number) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleId]: [...(prev[roleId] || []), permissionId]
    }));
    setShowAddPermission(null);
  };

  const removePermissionFromRole = (roleId: number, permissionId: number) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleId]: (prev[roleId] || []).filter(id => id !== permissionId)
    }));
  };

  const getAvailablePermissions = (roleId: number) => {
    const currentPermissions = rolePermissions[roleId] || [];
    return permissions.filter(permission =>
      !currentPermissions.includes(permission.id) &&
      (searchTerm === "" ||
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getRolePermissions = (roleId: number) => {
    const currentPermissions = rolePermissions[roleId] || [];
    return permissions.filter(permission => currentPermissions.includes(permission.id));
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-orange-50/30 to-white">
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
          <p className="text-sm font-medium text-slate-500">Đang tải quyền...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-orange-50/30 to-white">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-rose-400" />
          <p className="text-base font-semibold text-slate-900">{error}</p>
          <p className="text-sm text-slate-500">Vui lòng làm mới trang để thử lại.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white text-slate-900">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-orange-400">Truy cập ClubHub</p>
          <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
            Quản lý <span className="text-orange-500">Quyền</span>
          </h1>
          <p className="max-w-2xl text-base text-slate-500">
            Cấu hình quyền chi tiết cho mỗi vai trò để giữ cho nền tảng câu lạc bộ sinh viên an toàn và minh bạch.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Shield, value: roles.length, label: "Vai trò" },
            { icon: Key, value: permissions.length, label: "Quyền" },
            { icon: Users, value: roles.reduce((sum, role) => sum + role.users, 0), label: "Thành viên" },
            { icon: Eye, value: expandedRoles.size, label: "Đã mở rộng" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{stat.label}</span>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <stat.icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm vai trò hoặc quyền..."
                className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setExpandedRoles(new Set(roles.map((role) => role.id)))}
                className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-600 transition hover:border-orange-300 hover:bg-orange-100"
              >
                <ChevronDown className="h-4 w-4" />
                Mở rộng tất cả
              </button>
              <button
                onClick={() => setExpandedRoles(new Set())}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-orange-200 hover:text-orange-600"
              >
                <ChevronUp className="h-4 w-4" />
                Thu gọn tất cả
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredRoles.map((role) => {
            const IconComponent = role.icon;
            const isExpanded = expandedRoles.has(role.id);
            const rolePerms = getRolePermissions(role.id);
            const availablePerms = getAvailablePermissions(role.id);

            const level =
              rolePerms.length > 15 ? "Cao" : rolePerms.length > 8 ? "Trung bình" : rolePerms.length > 3 ? "Cơ bản" : "Giới hạn";

            return (
              <div key={role.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-300">
                <div className="cursor-pointer space-y-4 border-b border-slate-100 p-6" onClick={() => toggleRoleExpansion(role.id)}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r ${role.color} text-white shadow-sm`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900">{role.name}</p>
                        <p className="text-xs text-slate-500">{role.users} người dùng</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-orange-500" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </div>

                  <p className="text-sm text-slate-500">{role.description}</p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{rolePerms.length} quyền</span>
                    <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-500">
                      {level}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-4 p-6">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setShowAddPermission(showAddPermission === role.id ? null : role.id);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600 transition hover:border-orange-300 hover:bg-orange-100"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm quyền
                    </button>

                    {showAddPermission === role.id && availablePerms.length > 0 && (
                      <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">Các quyền có sẵn</p>
                        {availablePerms.map((permission) => {
                          const PermIcon = permission.icon;
                          return (
                            <button
                              key={permission.id}
                              type="button"
                              onClick={() => addPermissionToRole(role.id, permission.id)}
                              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 transition hover:border-orange-300 hover:bg-orange-50"
                            >
                              <span className="flex items-center gap-3">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                  <PermIcon className="h-4 w-4" />
                                </span>
                                <span className="flex flex-col">
                                  <span className="font-medium text-slate-900">{permission.name}</span>
                                  <span className="text-xs text-slate-500">{permission.description}</span>
                                </span>
                              </span>
                              <Plus className="h-4 w-4 text-orange-500" />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Shield className="h-4 w-4 text-orange-500" />
                        Quyền hiện tại ({rolePerms.length})
                      </p>

                      {rolePerms.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
                          <Lock className="mx-auto mb-3 h-6 w-6 opacity-60" />
                          Chưa có quyền nào được gán
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {rolePerms.map((permission) => {
                            const PermIcon = permission.icon;
                            return (
                              <div
                                key={permission.id}
                                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-orange-300"
                              >
                                <div className="flex flex-1 items-center gap-3">
                                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                                    <PermIcon className="h-4 w-4" />
                                  </span>
                                  <div>
                                    <p className="font-semibold text-slate-900">{permission.name}</p>
                                    <p className="text-xs text-slate-500">{permission.category}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removePermissionFromRole(role.id, permission.id)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-400">
                <Save className="h-4 w-4" />
                Lưu tất cả thay đổi
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-600">
                <RotateCcw className="h-4 w-4" />
                Khôi phục
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-600">
                <History className="h-4 w-4" />
                Lịch sử
              </button>
            </div>
            <p className="text-sm text-slate-500">Cập nhật lần cuối: 25/05/2025 14:30</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PermissionManagement;