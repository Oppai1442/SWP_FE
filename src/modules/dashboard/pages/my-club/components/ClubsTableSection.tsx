import type { ReactNode } from 'react';
import type { ClubStatus, ClubSummary } from '../services/myClubService';
import LoadingRows from './LoadingRows';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Users,
  Shield,
  Filter,
  LayoutGrid,
} from 'lucide-react';

interface ClubsTableSectionProps {
  search: string;
  statusFilter: ClubStatus | 'all';
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ClubStatus | 'all') => void;
  isLoading: boolean;
  clubs: ClubSummary[];
  filteredCount: number;
  currentPage: number;
  pageCount: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onViewClub?: (club: ClubSummary) => void;
  renderAction?: (club: ClubSummary) => ReactNode;
}

const STATUS_META: Record<ClubStatus, { label: string; className: string; iconColor: string }> = {
  ACTIVE: {
    label: 'Hoạt động',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20',
    iconColor: 'bg-emerald-500'
  },
  PENDING: {
    label: 'Chờ duyệt',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20',
    iconColor: 'bg-amber-500'
  },
  REJECTED: {
    label: 'Từ chối',
    className: 'bg-rose-50 text-rose-700 ring-1 ring-rose-500/20',
    iconColor: 'bg-rose-500'
  },
  INACTIVE: {
    label: 'Tạm dừng',
    className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/20',
    iconColor: 'bg-slate-500'
  },
  ARCHIVED: {
    label: 'Lưu trữ',
    className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-500/20',
    iconColor: 'bg-slate-400'
  },
};

const getStatusMeta = (status: ClubStatus) =>
  STATUS_META[status] ?? {
    label: 'Unknown',
    className: 'bg-slate-50 text-slate-600',
    iconColor: 'bg-slate-400'
  };

const ClubsTableSection = ({
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  isLoading,
  clubs,
  filteredCount,
  currentPage,
  pageCount,
  rowsPerPage,
  onPageChange,
  onViewClub,
  renderAction,
}: ClubsTableSectionProps) => (
  <div className="flex flex-col gap-6 lg:col-span-2">
    
    {/* --- THANH CÔNG CỤ (Floating Style) --- */}
    <div className="sticky top-0 z-10 flex flex-col gap-3 rounded-2xl bg-white/80 p-2 backdrop-blur-xl shadow-sm ring-1 ring-slate-900/5 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm tên hoặc mã CLB..."
          className="h-10 w-full rounded-xl border-none bg-slate-100 pl-10 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as ClubStatus | 'all')}
            className="h-10 cursor-pointer appearance-none rounded-xl border-none bg-slate-100 pl-9 pr-8 text-sm font-medium text-slate-700 transition-all focus:bg-white focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="INACTIVE">Tạm dừng</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
          <LayoutGrid className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-30" />
        </div>
      </div>
    </div>

    {/* --- DANH SÁCH CLB (Style: Separated Cards) --- */}
    <div className="min-h-[400px]">
      <table className="w-full border-separate border-spacing-y-3">
        {/* Ẩn Header bảng đi vì giao diện card không cần thiết, nhưng giữ thẻ thead cho a11y nếu cần, hoặc bỏ luôn */}
        <thead className="sr-only">
          <tr>
            <th>Club Info</th>
            <th>Stats</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        
        <tbody>
          {isLoading ? (
             // Giữ loading rows đơn giản hoặc customize lại
             <tr className="bg-white"><td colSpan={4}><LoadingRows columns={1} rows={5} /></td></tr>
          ) : clubs.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-100">
                  <Search className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Không tìm thấy kết quả</h3>
                <p className="mt-1 text-sm text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
              </td>
            </tr>
          ) : (
            clubs.map((club) => {
              const statusMeta = getStatusMeta(club.status);
              return (
                <tr 
                  key={club.id} 
                  className="group relative transition-transform duration-300 hover:-translate-y-1"
                >
                  {/* Dùng 1 td duy nhất hoặc chia cột nhưng style background cho cả tr không hoạt động tốt với border-spacing, 
                      nên ta style các td đầu/cuối bo tròn */}
                  
                  {/* Cột 1: Thông tin chính */}
                  <td className="w-full rounded-l-2xl bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-slate-100 sm:w-auto sm:max-w-md">
                    <div className="flex items-start gap-4">
                      {/* Avatar lớn */}
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-900/5">
                        {club.imageUrl ? (
                          <img src={club.imageUrl} alt={club.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <Shield className="h-7 w-7" />
                          </div>
                        )}
                      </div>
                      
                      {/* Text Info */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {club.category ?? 'General'}
                           </span>
                           <span className="text-[10px] font-medium text-slate-400">#{club.code}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 line-clamp-1 text-base group-hover:text-orange-600 transition-colors">
                          {club.name}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                           <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span className="font-medium">{(club.memberCount ?? 0) + 1}</span> thành viên
                           </span>
                           {club.leaderName && (
                             <span className="hidden sm:inline-flex items-center gap-1">
                                <span className="h-1 w-1 rounded-full bg-slate-300"/>
                                Leader: {club.leaderName}
                             </span>
                           )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Status & Action (Gộp chung để layout gọn trên mobile/desktop) */}
                  <td className="whitespace-nowrap rounded-r-2xl bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-slate-100 text-right align-middle">
                    <div className="flex items-center justify-end gap-4">
                      {/* Status Badge */}
                      <div className={`hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.iconColor}`} />
                        {statusMeta.label}
                      </div>

                      {/* Action Button */}
                      {renderAction ? (
                        renderAction(club)
                      ) : onViewClub ? (
                        <button
                          type="button"
                          onClick={() => onViewClub(club)}
                          disabled={club.status !== 'ACTIVE'}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                            club.status === 'ACTIVE'
                              ? 'bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white hover:shadow-md hover:shadow-orange-500/20'
                              : 'cursor-not-allowed bg-slate-50 text-slate-300'
                          }`}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>

    {/* --- PAGINATION (Minimalist Style) --- */}
    {!isLoading && clubs.length > 0 && (
      <div className="flex flex-col items-center justify-between gap-4 py-2 sm:flex-row">
        <p className="text-xs font-medium text-slate-500">
          Đang xem <span className="text-slate-900">{(currentPage - 1) * rowsPerPage + 1}-{Math.min(filteredCount, currentPage * rowsPerPage)}</span> / {filteredCount}
        </p>
        
        <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="min-w-[3rem] text-center text-xs font-bold text-slate-700">
             {currentPage} / {pageCount}
          </span>

          <button
            onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage === pageCount}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )}
  </div>
);

export default ClubsTableSection;