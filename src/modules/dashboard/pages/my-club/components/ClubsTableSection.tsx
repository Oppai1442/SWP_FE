import type { ReactNode } from 'react';
import type { ClubStatus, ClubSummary } from '../services/myClubService';
import LoadingRows from './LoadingRows';
import { ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react';
import { clubStatusClasses } from '../constants';

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
  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm kiếm câu lạc bộ..."
          className="w-full rounded-2xl border border-slate-200 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(event) => onStatusFilterChange(event.target.value as ClubStatus | 'all')}
        className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-48"
      >
        <option value="all">Tất cả trạng thái</option>
        <option value="ACTIVE">Hoạt động</option>
        <option value="PENDING">Đang chờ</option>
        <option value="REJECTED">Bị từ chối</option>
        <option value="INACTIVE">Không hoạt động</option>
        <option value="ARCHIVED">Đã lưu trữ</option>
      </select>
    </div>

    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-slate-400">
            <th className="py-3 pr-4">Câu lạc bộ</th>
            <th className="px-4 py-3">Danh mục</th>
            <th className="px-4 py-3">Thành viên</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            <LoadingRows columns={5} rows={rowsPerPage} />
          ) : clubs.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-10 text-center text-sm text-slate-500">
                Không có câu lạc bộ nào phù hợp với bộ lọc của bạn. Hãy thử điều chỉnh tìm kiếm.
              </td>
            </tr>
          ) : (
            clubs.map((club) => (
              <tr key={club.id} className="text-slate-700">
                <td className="py-4 pr-4">
                  <div className="font-semibold text-slate-900">{club.name}</div>
                  <div className="text-xs text-slate-400">#{club.code ?? 'Không áp dụng'}</div>
                  <div className="text-xs text-slate-400">
                    Leader: <span className="font-medium text-slate-600">{club.leaderName ?? 'Chưa được phân công'}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-500">{club.category ?? '-'}</td>
                <td className="px-4 py-4 text-slate-500">{club.memberCount ?? 0}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                      clubStatusClasses[club.status] ?? 'border-slate-200 text-slate-500 bg-slate-50'
                    }`}
                  >
                    {club.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  {renderAction ? (
                    renderAction(club)
                  ) : onViewClub ? (
                    <button
                      type="button"
                      onClick={() => onViewClub(club)}
                      disabled={club.status !== 'ACTIVE'}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        club.status !== 'ACTIVE'
                          ? 'cursor-not-allowed border-slate-100 text-slate-300'
                          : 'border-slate-200 text-slate-600 hover:border-orange-200 hover:text-orange-500'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Xem
                    </button>
                 ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {!isLoading && clubs.length > 0 && (
      <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Hiển thị{' '}
          <span className="font-semibold text-slate-900">
            {(currentPage - 1) * rowsPerPage + 1}-{Math.min(filteredCount, currentPage * rowsPerPage)}
          </span>{' '}
          của <span className="font-semibold text-slate-900">{filteredCount}</span> câu lạc bộ
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-orange-500 disabled:opacity-40"
          >
            <ChevronLeft className="mr-1 inline h-3.5 w-3.5" />
            Trước
          </button>
          <div className="text-xs font-semibold text-slate-700">
            Trang {currentPage} / {pageCount}
          </div>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage === pageCount}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-orange-500 disabled:opacity-40"
          >
            Tiếp theo
            <ChevronRight className="ml-1 inline h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )}
  </div>
);

export default ClubsTableSection;
