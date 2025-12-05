import type { ComponentType } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCcw,
  Search,
  Users,
  X,
} from 'lucide-react';
import {
  getClubsAPI,
  getClubDetailAPI,
  getClubMembersAPI,
  getClubActivitiesAPI,
  getClubSettingsAPI,
  getClubJoinRequestsAPI,
  type ClubSummary,
  type ClubDetail,
  type ClubStatus,
  type ClubMember,
  type ClubMemberStatus,
  type ClubActivity,
  type ClubSettingInfo,
  type ClubJoinRequest,
} from '../my-club/services/myClubService';
import { formatDate, formatDateTime } from '../my-club/utils';

const statusLabels: Record<ClubStatus, string> = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
};

const statusClasses: Record<ClubStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
  REJECTED: 'bg-rose-50 text-rose-600 border-rose-200',
  INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200',
  ARCHIVED: 'bg-slate-100 text-slate-500 border-slate-200',
};

const detailTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'activities', label: 'Activities' },
  { id: 'settings', label: 'Settings' },
  { id: 'history', label: 'Join history' },
] as const;

type DetailTab = (typeof detailTabs)[number]['id'];

const ITEMS_PER_PAGE = 10;

const ClubManagement = () => {
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ClubStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedClub, setSelectedClub] = useState<ClubSummary | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [clubDetail, setClubDetail] = useState<ClubDetail | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [activities, setActivities] = useState<ClubActivity[]>([]);
  const [settings, setSettings] = useState<ClubSettingInfo | null>(null);
  const [joinHistory, setJoinHistory] = useState<ClubJoinRequest[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchClubs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getClubsAPI('all');
      setClubs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error('Unable to load clubs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClubs();
  }, [fetchClubs]);

  const filteredClubs = useMemo(() => {
    return clubs
      .filter((club) => (statusFilter === 'all' ? true : club.status === statusFilter))
      .filter((club) => {
        if (!debouncedSearch) return true;
        const haystack = [club.name, club.code, club.category].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(debouncedSearch);
      })
      .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  }, [clubs, statusFilter, debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearch]);

  const totalCount = filteredClubs.length;
  const pageCount = Math.max(Math.ceil(totalCount / ITEMS_PER_PAGE), totalCount > 0 ? 1 : 0);
  const safePage = Math.min(currentPage, pageCount || 1);
  const currentItems = filteredClubs.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const result: Record<'total' | ClubStatus, number> = {
      total: clubs.length,
      ACTIVE: 0,
      PENDING: 0,
      REJECTED: 0,
      INACTIVE: 0,
      ARCHIVED: 0,
    };
    clubs.forEach((club) => {
      result[club.status] += 1;
    });
    return result;
  }, [clubs]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchClubs();
      toast.success('Club list refreshed.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const openDetail = useCallback(async (club: ClubSummary) => {
    setSelectedClub(club);
    setDetailTab('overview');
    setIsDetailLoading(true);
    try {
      const [detail, membersData, activitiesData, settingsData, historyData] = await Promise.all([
        getClubDetailAPI(club.id),
        getClubMembersAPI(club.id),
        getClubActivitiesAPI(club.id),
        getClubSettingsAPI(club.id),
        getClubJoinRequestsAPI(club.id, 'all'),
      ]);
      setClubDetail(detail ?? club);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      setSettings(settingsData ?? null);
      setJoinHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error(error);
      toast.error('Unable to load club details.');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const closeDetail = () => {
    setSelectedClub(null);
    setClubDetail(null);
    setMembers([]);
    setActivities([]);
    setSettings(null);
    setJoinHistory([]);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-orange-400">Club management</p>
          <h1 className="text-2xl font-semibold text-slate-900">System clubs</h1>
          <p className="text-sm text-slate-500">Monitor every club, review their members and activity health.</p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-500 shadow-sm transition hover:bg-orange-50 disabled:opacity-70"
          disabled={isRefreshing || isLoading}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total clubs" value={stats.total} icon={Users} accent="bg-slate-900 text-white" />
        <SummaryCard label="Active" value={stats.ACTIVE} icon={Users} accent="bg-emerald-100 text-emerald-700" />
        <SummaryCard label="Pending" value={stats.PENDING} icon={AlertTriangle} accent="bg-amber-100 text-amber-700" />
        <SummaryCard label="Rejected" value={stats.REJECTED} icon={AlertTriangle} accent="bg-rose-100 text-rose-700" />
      </section>

      <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by club name, code or category"
              className="w-full rounded-2xl border border-slate-200 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ClubStatus | 'all')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-48"
          >
            <option value="all">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="py-3 pr-4">Club</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableLoading rows={ITEMS_PER_PAGE} columns={5} />
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-slate-500">
                    No clubs matched your filters.
                  </td>
                </tr>
              ) : (
                currentItems.map((club) => (
                  <tr key={club.id} className="text-slate-700">
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-slate-900">{club.name}</div>
                      <div className="text-xs text-slate-400">#{club.code ?? 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{club.category ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{club.memberCount ?? 0}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[club.status]}`}
                      >
                        {statusLabels[club.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void openDetail(club)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && !isLoading && currentItems.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {(safePage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(totalCount, safePage * ITEMS_PER_PAGE)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{totalCount}</span> clubs
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-orange-500 disabled:opacity-40"
              >
                <ChevronLeft className="mr-1 inline h-3.5 w-3.5" /> Prev
              </button>
              <div className="text-xs font-semibold text-slate-700">
                Page {safePage} / {pageCount}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
                disabled={safePage === pageCount}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-orange-500 disabled:opacity-40"
              >
                Next <ChevronRight className="ml-1 inline h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedClub && (
        <ClubDetailDrawer
          clubSummary={selectedClub}
          club={clubDetail}
          members={members}
          activities={activities}
          settings={settings}
          history={joinHistory}
          activeTab={detailTab}
          onTabChange={setDetailTab}
          isLoading={isDetailLoading}
          onClose={closeDetail}
        />
      )}
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}

const SummaryCard = ({ label, value, icon: Icon, accent }: SummaryCardProps) => (
  <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value ?? 0}</p>
      </div>
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </div>
);

interface TableLoadingProps {
  rows: number;
  columns: number;
}

const TableLoading = ({ rows, columns }: TableLoadingProps) => (
  <>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <tr key={rowIdx} className="animate-pulse">
        {Array.from({ length: columns }).map((__, colIdx) => (
          <td key={colIdx} className="py-4">
            <div className="h-4 w-full rounded-full bg-slate-100" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

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

const ClubDetailDrawer = ({
  clubSummary,
  club,
  members,
  activities,
  settings,
  history,
  activeTab,
  onTabChange,
  isLoading,
  onClose,
}: ClubDetailDrawerProps) => {
  const resolved = club ?? (clubSummary as ClubDetail);
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40">
      <div className="h-full w-full max-w-4xl overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-400">Club</p>
            <h3 className="text-xl font-semibold text-slate-900">{resolved.name}</h3>
            <p className="text-xs text-slate-500">#{resolved.code ?? 'N/A'}</p>
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
            {detailTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <DetailContent
              tab={activeTab}
              club={resolved}
              members={members}
              activities={activities}
              settings={settings}
              history={history}
            />
          )}
        </div>
      </div>
    </div>
  );
};

interface DetailContentProps {
  tab: DetailTab;
  club: ClubDetail;
  members: ClubMember[];
  activities: ClubActivity[];
  settings: ClubSettingInfo | null;
  history: ClubJoinRequest[];
}

const DetailContent = ({ tab, club, members, activities, settings, history }: DetailContentProps) => {
  if (tab === 'overview') {
    return (
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <DetailItem label="Category" value={club.category ?? 'N/A'} />
        <DetailItem label="Status" value={club.status} />
        <DetailItem label="President" value={club.presidentName ?? 'N/A'} />
        <DetailItem label="Advisor" value={club.advisorName ?? 'N/A'} />
        <DetailItem label="Members" value={String(club.memberCount ?? 0)} />
        <DetailItem label="Founded" value={formatDate(club.foundedDate)} />
        <DetailItem label="Mission" value={club.mission ?? 'Not provided'} />
        <DetailItem label="Meeting location" value={club.meetingLocation ?? 'Not provided'} />
      </div>
    );
  }

  if (tab === 'members') {
    const shouldInjectLeader =
      Boolean(club.presidentId && club.presidentName) &&
      !members.some((member) => member.memberId === club.presidentId || member.role === 'PRESIDENT');

    const resolvedMembers: ClubMember[] = shouldInjectLeader
      ? [
          ...members,
          {
            id: -(club.presidentId ?? club.id ?? Date.now()),
            clubId: club.id,
            clubName: club.name,
            memberId: club.presidentId ?? 0,
            memberName: club.presidentName ?? 'Club leader',
            role: 'PRESIDENT',
            status: 'ACTIVE' as ClubMemberStatus,
            joinedAt: club.createdAt ?? club.foundedDate ?? null,
            notes: 'Club leader',
          },
        ]
      : members;

    return resolvedMembers.length === 0 ? (
      <p className="py-6 text-sm text-slate-500">No members recorded.</p>
    ) : (
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Member</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resolvedMembers.map((member) => (
              <tr key={member.id} className="text-slate-700">
                <td className="px-4 py-3 font-medium text-slate-900">{member.memberName ?? 'Unknown'}</td>
                <td className="px-4 py-3 text-slate-500">{member.role}</td>
                <td className="px-4 py-3 text-slate-500">{member.status}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(member.joinedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'activities') {
    return activities.length === 0 ? (
      <p className="py-6 text-sm text-slate-500">No activities recorded.</p>
    ) : (
      <div className="mt-6 space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                {activity.description && <p className="text-xs text-slate-500">{activity.description}</p>}
              </div>
              <span className="text-xs font-semibold uppercase text-slate-500">{activity.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              {activity.startDate && (
                <span>
                  Starts{' '}
                  <strong className="text-slate-900">{formatDate(activity.startDate)}</strong>
                </span>
              )}
              {activity.endDate && (
                <span>
                  Ends{' '}
                  <strong className="text-slate-900">{formatDate(activity.endDate)}</strong>
                </span>
              )}
              {activity.location && (
                <span>
                  Location <strong className="text-slate-900">{activity.location}</strong>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'settings') {
    if (!settings) {
      return <p className="py-6 text-sm text-slate-500">Settings are not configured.</p>;
    }
    return (
      <div className="mt-6 space-y-3">
        <DetailItem label="Require approval" value={String(settings.requireApproval ?? true)} />
        <DetailItem label="Allow waitlist" value={String(settings.allowWaitlist ?? true)} />
        <DetailItem label="Notifications" value={String(settings.enableNotifications ?? true)} />
        <DetailItem label="Bank" value={settings.bankId ?? '—'} />
        <DetailItem label="Account" value={settings.bankAccountNumber ?? '—'} />
        <DetailItem label="Account name" value={settings.bankAccountName ?? '—'} />
        <DetailItem label="Transfer note" value={settings.bankTransferNote ?? '—'} />
      </div>
    );
  }

  return history.length === 0 ? (
    <p className="py-6 text-sm text-slate-500">No join history found.</p>
  ) : (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left">Member</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Submitted</th>
            <th className="px-4 py-3 text-left">Reviewed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {history.map((request) => (
            <tr key={request.id} className="text-slate-700">
              <td className="px-4 py-3 font-medium text-slate-900">{request.applicantName ?? 'Unknown'}</td>
              <td className="px-4 py-3 text-slate-500">{request.status}</td>
              <td className="px-4 py-3 text-slate-500">{formatDateTime(request.createdAt)}</td>
              <td className="px-4 py-3 text-slate-500">{formatDateTime(request.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface DetailItemProps {
  label: string;
  value: string;
}

const DetailItem = ({ label, value }: DetailItemProps) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

export default ClubManagement;



