import type { ComponentType, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Edit3,
  Trash2,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import type { UserMini, UserRole, UserStatus } from '@/types';
import {
  deleteUserAPI,
  getAllUserAPI,
  getUserDetailAPI,
  getUserSummaryAPI,
  updateUserProfileAPI,
  type UpdateUserPayload,
  type UsersSummaryResponse,
} from './services/UserManagement';

type RoleFilter = UserRole | 'all';
type StatusFilter = UserStatus | 'all';

interface PageMeta {
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

interface EditingUserState {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
}

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
  const [users, setUsers] = useState<UserMini[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageMeta, setPageMeta] = useState<PageMeta>({
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: ITEMS_PER_PAGE,
  });
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [summary, setSummary] = useState<UsersSummaryResponse>({
    totalUser: 0,
    activeUser: 0,
    inactiveUser: 0,
    adminUser: 0,
  });
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<EditingUserState | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserMini | null>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const sectionId = entry.target.getAttribute('data-section');
          if (!sectionId) return;

          setVisibleSections((prev) => {
            if (prev.has(sectionId)) return prev;
            const next = new Set(prev);
            next.add(sectionId);
            return next;
          });
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll<HTMLElement>('[data-section]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true);
      const data = await getUserSummaryAPI();
      setSummary(data);
    } catch (error) {
      toast.error('Tải tóm tắt người dùng thất bại. Vui lòng thử lại.');
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(
    async (page: number) => {
      const targetPage = page < 1 ? 1 : page;
      const pageIndex = targetPage - 1;

      try {
        setIsUsersLoading(true);
        const data = await getAllUserAPI(pageIndex, ITEMS_PER_PAGE, debouncedSearch, roleFilter, statusFilter);

        if (data.totalPages > 0 && pageIndex >= data.totalPages) {
          void fetchUsers(data.totalPages);
          return;
        }

        setUsers(data.content ?? []);
        setPageMeta({
          totalPages: data.totalPages ?? 0,
          totalElements: data.totalElements ?? data.content?.length ?? 0,
          number: data.number ?? pageIndex,
          size: data.size ?? ITEMS_PER_PAGE,
        });
        setCurrentPage((data.number ?? pageIndex) + 1);
      } catch (error) {
        toast.error('Tải danh sách người dùng thất bại. Vui lòng thử lại.');
      } finally {
        setIsUsersLoading(false);
      }
    },
    [debouncedSearch, roleFilter, statusFilter]
  );

  const goToPage = useCallback(
    (page: number) => {
      void fetchUsers(page);
    },
    [fetchUsers]
  );

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    goToPage(1);
  }, [debouncedSearch, roleFilter, statusFilter, goToPage]);

  const currentUsers = users;
  const totalCount = pageMeta.totalElements ?? currentUsers.length;
  const pageSize = pageMeta.size || ITEMS_PER_PAGE;
  const safeTotalPages =
    pageMeta.totalPages && pageMeta.totalPages > 0
      ? pageMeta.totalPages
      : totalCount > 0
      ? Math.max(Math.ceil(totalCount / pageSize), 1)
      : 0;
  const showPagination = safeTotalPages > 1;
  const pageRangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageRangeEnd = totalCount === 0 ? 0 : Math.min(pageRangeStart + currentUsers.length - 1, totalCount);

  const pageButtons = useMemo(() => {
    if (!showPagination) return [];

    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(safeTotalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    const buttons: number[] = [];
    for (let page = start; page <= end; page += 1) {
      buttons.push(page);
    }
    return buttons;
  }, [currentPage, safeTotalPages, showPagination]);

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const stats = useMemo(
    () => [
      { label: 'Tổng số người dùng', value: summary.totalUser, icon: Users, type: 'total' as const },
      { label: 'Hoạt động', value: summary.activeUser, icon: null, type: 'active' as const },
      { label: 'Không hoạt động', value: summary.inactiveUser, icon: null, type: 'inactive' as const },
      { label: 'Quản trị viên', value: summary.adminUser, icon: null, type: 'admin' as const },
    ],
    [summary]
  );

  const getRoleConfig = useCallback((role: UserRole | string) => {
    const map: Record<UserRole, { className: string; label: string }> = {
      ROLE_ADMIN: { className: 'border-orange-200 bg-orange-50 text-orange-600', label: 'Quản trị viên' },
      ROLE_USER: { className: 'border-slate-200 bg-slate-50 text-slate-600', label: 'Người dùng' },
    };
    return map[role as UserRole] ?? { className: 'border-slate-200 bg-slate-50 text-slate-500', label: role };
  }, []);

  const getStatusConfig = useCallback((status: UserStatus | string) => {
    const map: Record<string, { className: string; label: string; indicator: string }> = {
      ACTIVE: { className: 'border-emerald-200 bg-emerald-50 text-emerald-600', label: 'Hoạt động', indicator: 'bg-emerald-500' },
      INACTIVE: { className: 'border-amber-200 bg-amber-50 text-amber-600', label: 'Không hoạt động', indicator: 'bg-amber-500' },
      DISABLE: { className: 'border-slate-200 bg-slate-50 text-slate-500', label: 'Vô hiệu hóa', indicator: 'bg-slate-400' },
      LOCKED: { className: 'border-rose-200 bg-rose-50 text-rose-600', label: 'Bị khóa', indicator: 'bg-rose-500' },
      SUSPENDED: { className: 'border-orange-200 bg-orange-50 text-orange-600', label: 'Bị đình chỉ', indicator: 'bg-orange-500' },
    };
    return map[status] ?? { className: 'border-slate-200 bg-slate-50 text-slate-500', label: status, indicator: 'bg-slate-400' };
  }, []);

  const openEditModal = useCallback(async (userId: number) => {
    setIsEditLoading(true);
    try {
      const response = await getUserDetailAPI(userId);
      const detail = response?.data;
      if (!detail) throw new Error('Không có dữ liệu người dùng');

      const nameParts = (detail.fullName ?? '').split(' ').filter(Boolean);
      const [firstName, ...rest] = nameParts;

      setEditingUser({
        id: detail.id,
        fullName: detail.fullName,
        email: detail.email,
        role: detail.role as UserRole,
        status: detail.status as UserStatus,
        firstName: firstName ?? '',
        lastName: rest.join(' '),
      });
    } catch (error) {
      toast.error('Tải chi tiết người dùng thất bại. Vui lòng thử lại.');
      closeEditModal();
    } finally {
      setIsEditLoading(false);
    }
  }, []);

  const handleEdit = (user: UserMini) => {
    setIsEditModalOpen(true);
    setEditingUser(null);
    void openEditModal(user.id);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    const trimmedFirst = editingUser.firstName.trim();
    const trimmedLast = editingUser.lastName.trim();
    if (!trimmedFirst && !trimmedLast) {
      toast.error('Vui lòng cung cấp ít nhất một trường tên.');
      return;
    }

    setIsEditSubmitting(true);
    const payload: UpdateUserPayload = {
      firstName: trimmedFirst,
      lastName: trimmedLast,
    };

    try {
      const response = await updateUserProfileAPI(payload);
      if (!response?.data) {
        throw new Error(response?.message || 'Cập nhật thất bại');
      }

      toast.success(response.message || 'Cập nhật người dùng thành công.');
      closeEditModal();

      await Promise.allSettled([fetchUsers(currentPage), fetchSummary()]);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Cập nhật người dùng thất bại. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    setIsDeleteSubmitting(true);
    try {
      const response = await deleteUserAPI(userToDelete.id);
      if (!response?.data) {
        throw new Error(response?.message || 'Xóa thất bại');
      }

      toast.success(response.message || 'Xóa người dùng thành công.');
      closeDeleteModal();

      await Promise.allSettled([fetchUsers(currentPage), fetchSummary()]);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Xóa người dùng thất bại. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    icon: Icon,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    icon?: ComponentType<{ className?: string }>;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-orange-200 hover:text-orange-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white text-slate-900">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div
          data-section="header"
          className={`flex flex-col items-start gap-4 transition-all duration-1000 lg:flex-row lg:items-center lg:justify-between ${
            visibleSections.has('header') ? 'opacity-100 translate-y-0' : 'translate-y-10 opacity-0'
          }`}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-orange-400">Quản trị ClubHub</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 md:text-5xl">
              Quản lý <span className="text-orange-500">Người dùng</span>
            </h1>
            <p className="mt-2 text-base text-slate-500">
              Quản lý tài khoản người dùng hệ thống và quyền của họ ở cấp độ Club.
            </p>
          </div>
        </div>

        <div data-section="stats" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const accentClass =
              stat.type === 'inactive'
                ? 'border-rose-100 bg-rose-50 text-rose-500'
                : stat.type === 'admin'
                ? 'border-purple-100 bg-purple-50 text-purple-500'
                : stat.type === 'active'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                : 'border-orange-100 bg-orange-50 text-orange-500';

            return (
              <div
                key={stat.label}
                className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 ${
                  visibleSections.has('stats') ? 'opacity-100 translate-y-0' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${accentClass}`}>
                    {stat.icon ? (
                      <stat.icon className="h-6 w-6" />
                    ) : stat.type === 'active' ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    ) : stat.type === 'inactive' ? (
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                    )}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-slate-900">
                  {isSummaryLoading ? <span className="animate-pulse text-slate-400">--</span> : stat.value}
                </p>
              </div>
            );
          })}
        </div>

        <div
          data-section="filters"
          className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-1000 ${
            visibleSections.has('filters') ? 'opacity-100 translate-y-0' : 'translate-y-10 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="ROLE_ADMIN">Admin</option>
                <option value="ROLE_USER">User</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LOCKED">Locked</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DISABLE">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        <div
          data-section="table"
          className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-1000 ${
            visibleSections.has('table') ? 'opacity-100 translate-y-0' : 'translate-y-10 opacity-0'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Thông tin người dùng', 'Vai trò', 'Trạng thái', 'Hành động'].map((heading) => (
                    <th key={heading} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isUsersLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10">
                      <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                        Đang tải người dùng...
                      </div>
                    </td>
                  </tr>
                ) : currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                      Không tìm thấy người dùng nào với bộ lọc đã chọn.
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => {
                    const roleConfig = getRoleConfig(user.role);
                    const statusConfig = getStatusConfig(user.status);

                    return (
                      <tr key={user.id} className="transition hover:bg-orange-50/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-600">
                              <span className="text-sm font-semibold">
                                {user.fullName
                                  .split(' ')
                                  .filter(Boolean)
                                  .map((namePart) => namePart[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${roleConfig.className}`}>
                            {roleConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${statusConfig.className}`}>
                            <span className={`h-2 w-2 rounded-full ${statusConfig.indicator}`} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              disabled={isEditLoading || isEditSubmitting}
                              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-orange-200 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setUserToDelete(user);
                                setIsDeleteModalOpen(true);
                              }}
                              disabled={isDeleteSubmitting}
                              className="rounded-full border border-slate-200 p-2 text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <div>
              {isUsersLoading
                ? 'Đang tải người dùng...'
                : totalCount === 0
                ? 'Không có người dùng để hiển thị'
                : `Hiển thị ${pageRangeStart}-${pageRangeEnd} của ${totalCount}`}
            </div>
            {showPagination && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={isUsersLoading || currentPage === 1}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-orange-200 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageButtons.map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    disabled={isUsersLoading}
                    className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                      currentPage === page
                        ? 'border-orange-400 bg-orange-50 text-orange-600'
                        : 'border-slate-200 text-slate-500 hover:border-orange-200 hover:text-orange-600'
                    } ${isUsersLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={isUsersLoading || (safeTotalPages !== 0 && currentPage >= safeTotalPages)}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-orange-200 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Chỉnh sửa người dùng" icon={Edit3}>
          {isEditLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                Đang tải chi tiết người dùng...
              </div>
            </div>
          ) : editingUser ? (
            <>
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-orange-50/50 p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-200 bg-white text-orange-500">
                    <span className="text-lg font-semibold">
                      {editingUser.fullName
                        .split(' ')
                        .filter(Boolean)
                        .map((namePart) => namePart[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">{editingUser.fullName}</p>
                    <p className="text-sm text-slate-500">{editingUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">Tên</label>
                    <input
                      type="text"
                      value={editingUser.firstName}
                      onChange={(event) =>
                        setEditingUser((prev) => (prev ? { ...prev, firstName: event.target.value } : prev))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">Họ</label>
                    <input
                      type="text"
                      value={editingUser.lastName}
                      onChange={(event) =>
                        setEditingUser((prev) => (prev ? { ...prev, lastName: event.target.value } : prev))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">Vai trò</label>
                    {(() => {
                      const roleBadge = getRoleConfig(editingUser.role);
                      return (
                        <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium ${roleBadge.className}`}>
                          {roleBadge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">Trạng thái</label>
                    {(() => {
                      const statusBadge = getStatusConfig(editingUser.status);
                      return (
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${statusBadge.className}`}>
                          <span className={`h-2 w-2 rounded-full ${statusBadge.indicator}`} />
                          {statusBadge.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Chỉ có thể cập nhật tên và họ từ giao diện này. Cập nhật vai trò hoặc trạng thái cần hỗ trợ từ backend.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeEditModal}
                  disabled={isEditSubmitting}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm text-slate-500 transition hover:border-orange-200 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={isEditSubmitting || isEditLoading}
                  className="flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isEditSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-sm text-slate-400">Chưa chọn người dùng.</div>
          )}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Xác nhận xóa" icon={AlertTriangle}>
          {userToDelete ? (
            <>
              <div className="mb-6 flex items-start gap-4 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-500" />
                <div>
                  <p className="text-base font-semibold text-slate-900">Bạn có chắc chắn muốn xóa người dùng này không?</p>
                  <p className="mt-1 text-sm text-slate-500">Hành động này không thể hoàn tác.</p>
                  <p className="mt-2 text-sm font-medium text-rose-500">
                    {userToDelete.fullName} ({userToDelete.email})
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleteSubmitting}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm text-slate-500 transition hover:border-orange-200 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleteSubmitting}
                  className="flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleteSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Xóa người dùng</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-sm text-slate-400">Chưa chọn người dùng.</div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default UserManagement;
