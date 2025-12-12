import { Eye, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type {
  ClubSummary,
  ClubStatus,
} from "../../my-club/services/myClubService";
import { useState, useMemo, useEffect } from "react";

// --- Constants & Helpers ---
const statusLabels: Record<ClubStatus, string> = {
  ACTIVE: "Hoạt động",
  PENDING: "Đang chờ",
  REJECTED: "Bị từ chối",
  INACTIVE: "Không hoạt động",
  ARCHIVED: "Đã lưu trữ",
};

const statusClasses: Record<ClubStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-600 border-amber-200",
  REJECTED: "bg-rose-50 text-rose-600 border-rose-200",
  INACTIVE: "bg-slate-100 text-slate-500 border-slate-200",
  ARCHIVED: "bg-slate-100 text-slate-500 border-slate-200",
};

const ITEMS_PER_PAGE = 10;

// --- Sub-component: Loading Skeleton ---
const TableLoading = () => (
  <>
    {Array.from({ length: 5 }).map((_, rowIdx) => (
      <tr key={rowIdx} className="animate-pulse">
        {Array.from({ length: 5 }).map((__, colIdx) => (
          <td key={colIdx} className="py-4">
            <div className="h-4 w-full rounded-full bg-slate-100" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

interface ClubListTableProps {
  clubs: ClubSummary[];
  isLoading: boolean;
  onOpenDetail: (club: ClubSummary) => void;
}

export const ClubListTable = ({
  clubs,
  isLoading,
  onOpenDetail,
}: ClubListTableProps) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClubStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim().toLowerCase()),
      350
    );
    return () => clearTimeout(timer);
  }, [search]);

  // Filter Logic
  const filteredClubs = useMemo(() => {
    return clubs
      .filter((club) =>
        statusFilter === "all" ? true : club.status === statusFilter
      )
      .filter((club) => {
        if (!debouncedSearch) return true;
        const haystack = [club.name, club.code, club.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(debouncedSearch);
      })
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  }, [clubs, statusFilter, debouncedSearch]);

  // Pagination Logic
  useEffect(() => setCurrentPage(1), [statusFilter, debouncedSearch]);
  const totalCount = filteredClubs.length;
  const pageCount = Math.max(
    Math.ceil(totalCount / ITEMS_PER_PAGE),
    totalCount > 0 ? 1 : 0
  );
  const safePage = Math.min(currentPage, pageCount || 1);
  const currentItems = filteredClubs.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  return (
    <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên, mã hoặc danh mục..."
            className="w-full rounded-2xl border border-slate-200 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ClubStatus | "all")
          }
          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm sm:w-48"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="PENDING">Đang chờ</option>
          <option value="REJECTED">Bị từ chối</option>
          <option value="INACTIVE">Không hoạt động</option>
          <option value="ARCHIVED">Đã lưu trữ</option>
        </select>
      </div>

      {/* Table */}
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
              <TableLoading />
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-slate-500">
                  Không tìm thấy dữ liệu.
                </td>
              </tr>
            ) : (
              currentItems.map((club) => (
                <tr
                  key={club.id}
                  className="text-slate-700 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-4 pr-4">
                    <div className="font-semibold text-slate-900">
                      {club.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      #{club.code ?? "N/A"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500">
                    {club.category ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-slate-500">
                    {(club.memberCount ?? 1) + 0}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                        statusClasses[club.status]
                      }`}
                    >
                      {statusLabels[club.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => onOpenDetail(club)}
                      disabled={club.status !== "ACTIVE"}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        club.status !== "ACTIVE"
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:border-orange-200 hover:text-orange-500"
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" /> Xem
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && !isLoading && (
        <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Hiển thị{" "}
            <span className="font-semibold">
              {(safePage - 1) * ITEMS_PER_PAGE + 1}-
              {Math.min(totalCount, safePage * ITEMS_PER_PAGE)}
            </span>{" "}
            của {totalCount}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-xl border p-2 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
              disabled={safePage === pageCount}
              className="rounded-xl border p-2 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
