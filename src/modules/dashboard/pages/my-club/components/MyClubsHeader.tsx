import { Compass, Plus, RefreshCcw } from 'lucide-react';

interface MyClubsHeaderProps {
  onRefresh: () => void;
  onCreate: () => void;
  isRefreshing: boolean;
  exploreHref: string;
}

const MyClubsHeader = ({ onRefresh, onCreate, isRefreshing, exploreHref }: MyClubsHeaderProps) => (
  <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-orange-400">Câu lạc bộ của tôi</p>
      <h1 className="text-2xl font-semibold text-slate-900">Quản lý câu lạc bộ của bạn</h1>
      <p className="text-sm text-slate-500">
        Tạo câu lạc bộ mới, theo dõi phê duyệt đang chờ xử lý và xem xét hoạt động thành viên trong một chế độ xem.
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-orange-200 hover:text-orange-500"
        disabled={isRefreshing}
      >
        <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Làm mới      </button>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
      >
        <Plus className="h-4 w-4" />
        Tạo câu lạc bộ
      </button>
    </div>
  </header>
);

export default MyClubsHeader;
