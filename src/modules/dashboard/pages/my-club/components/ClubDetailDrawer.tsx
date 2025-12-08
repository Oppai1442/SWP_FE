import { Fragment, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  type ClubActivity,
  type ClubDetail,
  type ClubJoinRequest,
  type ClubJoinRequestStatus,
  type ClubMember,
  type ClubSettingInfo,
  type ClubActivityStatus,
} from '../services/myClubService';
import { formatDate, formatDateTime, buildVietQrUrl, formatJoinFeeValue } from '../utils';
import type { ActivityFormState, BankInstructionForm } from '../types';
import { activityStatusMeta, detailTabs, joinRequestStatusMeta, type DetailTab } from '../constants';
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
} from 'lucide-react';
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
  joinQueueFilter: ClubJoinRequestStatus | 'all';
  isJoinQueueLoading: boolean;
  onJoinQueueFilterChange: (value: ClubJoinRequestStatus | 'all') => void;
  onRefreshJoinQueue: () => void;
  onDecideJoinRequest: (requestId: number, status: ClubJoinRequestStatus, note?: string | null) => void;
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
  onClose: () => void;
}

type DrawerClubMember = ClubMember & { __virtual?: boolean };

const resolveLeaderId = (club?: Pick<ClubDetail, 'leaderId' | 'presidentId'>) =>
  club?.leaderId ?? club?.presidentId ?? null;

const resolveLeaderName = (club?: Pick<ClubDetail, 'leaderName' | 'presidentName'>) =>
  club?.leaderName ?? club?.presidentName ?? 'Club leader';

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
  onClose,
}: ClubDetailDrawerProps) => {
  const isEditingActivity = Boolean(editingActivityId);
  const showMemberActions = canManage || Boolean(currentMember);
  const leaderId = resolveLeaderId(club);
  const leaderName = resolveLeaderName(club);
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
        role: 'PRESIDENT',
        status: 'ACTIVE',
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
      const exists = unique.some((member) => member.memberId === memberToAdd.memberId);
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
        role: 'PRESIDENT',
        status: 'ACTIVE',
        joinedAt: club.createdAt ?? club.updatedAt ?? null,
        notes: null,
        __virtual: true,
      });
    }
    return unique;
  }, [club, members, selfMember, leaderId, leaderName]);
  const handleCopyInviteCode = async () => {
    if (!club.inviteCode) {
      toast.error('Invite code not available.');
      return;
    }
    try {
      await navigator.clipboard.writeText(club.inviteCode);
      toast.success('Invite code copied.');
    } catch (error) {
      console.error(error);
      toast.error('Unable to copy invite code.');
    }
  };

  const handleDecision = (requestId: number, status: ClubJoinRequestStatus) => {
    const note =
      status === 'REJECTED'
        ? window.prompt('Add a rejection note (optional)') ?? undefined
        : undefined;
    onDecideJoinRequest(requestId, status, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40">
      <div className="h-full w-full max-w-4xl overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-400">Club</p>
            <h3 className="text-xl font-semibold text-slate-900">{club.name}</h3>
            <p className="text-xs text-slate-500">#{club.code ?? 'N/A'}</p>
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
                  activeTab === tab.id
                    ? 'bg-white text-orange-600 shadow'
                    : 'text-slate-500 hover:text-orange-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetailItem label="Status" value={club.status} />
              <DetailItem label="Category" value={club.category ?? 'N/A'} />
              <DetailItem label="Founded" value={formatDate(club.foundedDate)} />
              <DetailItem label="Members" value={`${club.memberCount ?? 0}`} />
              <DetailItem label="Meeting location" value={club.meetingLocation ?? 'Not provided'} />
              <DetailItem label="Mission" value={club.mission ?? 'Not provided'} />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="mt-6 space-y-4">
              {selfMember && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Your membership</p>
                      <p className="text-xs text-slate-500">
                        Role:{' '}
                        <span className="font-semibold text-slate-800">{selfMember.role}</span>
                        {selfMember.joinedAt && (
                          <span className="ml-2">Joined {formatDate(selfMember.joinedAt)}</span>
                        )}
                      </p>
                      {isCurrentLeader && (
                        <p className="text-xs text-amber-600">
                          Transfer leadership to another member before leaving this club.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={onLeaveClub}
                      disabled={isCurrentLeader || isLeavingClub || !currentMember}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                        isCurrentLeader || !currentMember
                          ? 'cursor-not-allowed border-amber-200 text-amber-500'
                          : 'border-slate-200 text-slate-600 hover:border-orange-200 hover:text-orange-500 disabled:opacity-60'
                      }`}
                    >
                      <LogOut className="h-4 w-4" />
                      {isCurrentLeader
                        ? 'Transfer leadership to leave'
                        : isLeavingClub
                          ? 'Leaving...'
                          : 'Leave club'}
                    </button>
                  </div>
                </div>
              )}
              {!membersVisible ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-700">
                  Member list is hidden by the club leader.
                </div>
              ) : isMembersLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : displayedMembers.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">No members to display.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Member</th>
                        <th className="px-4 py-3 text-left">Role</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Joined</th>
                        {showMemberActions && <th className="px-4 py-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedMembers.map((member) => {
                        const rowLoading = Boolean(memberActionLoading[member.id]);
                        const isSelf = Boolean(selfMember) && member.memberId === selfMember?.memberId;
                        const isSelfActual =
                          Boolean(currentMember) && member.memberId === currentMember?.memberId;
                        const isLeader = leaderId === member.memberId;
                        const isVirtual = Boolean((member as DrawerClubMember).__virtual);
                        return (
                          <tr key={member.id} className="text-slate-700">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {member.memberName ?? 'Unknown'}
                            </td>
                            <td className="px-4 py-3 text-slate-500">{member.role}</td>
                            <td className="px-4 py-3 text-slate-500">{member.status}</td>
                            <td className="px-4 py-3 text-slate-500">{formatDate(member.joinedAt)}</td>
                            {showMemberActions && (
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap justify-end gap-2">
                                  {canManage && !isLeader && !isVirtual && (
                                    <button
                                      type="button"
                                      onClick={() => onTransferLeadership(member)}
                                      disabled={rowLoading}
                                      className="inline-flex items-center gap-1 rounded-2xl border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-500 transition hover:bg-orange-50 disabled:opacity-50"
                                    >
                                      <Crown className="h-3.5 w-3.5" />
                                      Leader
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
                                      Remove
                                    </button>
                                  )}
                                  {isSelf && (
                                    <button
                                      type="button"
                                      onClick={onLeaveClub}
                                      disabled={rowLoading || isCurrentLeader || isLeavingClub || !isSelfActual}
                                      className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500 disabled:opacity-50"
                                    >
                                      <LogOut className="h-3.5 w-3.5" />
                                      {isCurrentLeader ? 'Transfer first' : isLeavingClub ? 'Leaving...' : 'Leave'}
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
          {activeTab === 'activities' && (
            <div className="mt-6 space-y-4">
              {canManage && (
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {isEditingActivity ? 'Update activity' : 'Create activity'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {isEditingActivity
                          ? 'Adjust the selected activity details and publish the changes.'
                          : 'Only leaders can add new club activities.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditingActivity && (
                        <button
                          type="button"
                          onClick={onCancelActivityEdit}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-amber-200 hover:text-amber-500"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onSubmitActivity}
                        disabled={isCreatingActivity}
                        className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
                      >
                        {isCreatingActivity && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isEditingActivity ? 'Save changes' : 'Publish'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Title
                      <input
                        type="text"
                        value={activityForm.title}
                        onChange={(event) => onActivityFormChange('title', event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="Orientation day"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                      <input
                        type="text"
                        value={activityForm.location}
                        onChange={(event) => onActivityFormChange('location', event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="Auditorium A2"
                      />
                    </label>
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Start date
                      <input
                        type="datetime-local"
                        value={activityForm.startDate}
                        onChange={(event) => onActivityFormChange('startDate', event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      End date
                      <input
                        type="datetime-local"
                        value={activityForm.endDate}
                        onChange={(event) => onActivityFormChange('endDate', event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      />
                    </label>
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Budget
                      <input
                        type="number"
                        min="0"
                        value={activityForm.budget}
                        onChange={(event) => onActivityFormChange('budget', event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="500000"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                      <select
                        value={activityForm.status}
                        onChange={(event) =>
                          onActivityFormChange('status', event.target.value as ClubActivityStatus)
                        }
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      >
                        <option value="PLANNING">Planning</option>
                        <option value="APPROVED">Approved</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Description
                      <textarea
                        value={activityForm.description}
                        onChange={(event) =>
                          onActivityFormChange('description', event.target.value)
                        }
                        rows={3}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="Share agenda or expectations."
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
                <p className="py-8 text-center text-sm text-slate-500">No activities published yet.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`rounded-2xl border bg-white px-4 py-3 shadow-sm ${
                        editingActivityId === activity.id ? 'border-orange-200' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-slate-500">{activity.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${
                              activityStatusMeta[activity.status].className
                            }`}
                          >
                            {activityStatusMeta[activity.status].label}
                          </span>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => onEditActivity(activity)}
                              className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                        {activity.startDate && (
                          <span>
                            Starts{' '}
                            <strong className="text-slate-900">
                              {formatDateTime(activity.startDate)}
                            </strong>
                          </span>
                        )}
                        {activity.endDate && (
                          <span>
                            Ends{' '}
                            <strong className="text-slate-900">
                              {formatDateTime(activity.endDate)}
                            </strong>
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
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Join requests</p>
                  <p className="text-xs text-slate-500">
                    Review payment evidence before admitting new members.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={joinQueueFilter}
                    onChange={(event) =>
                      onJoinQueueFilterChange(event.target.value as ClubJoinRequestStatus | 'all')
                    }
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="all">All</option>
                  </select>
                  <button
                    type="button"
                    onClick={onRefreshJoinQueue}
                    disabled={isJoinQueueLoading}
                    className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500 disabled:opacity-60"
                  >
                    <RefreshCcw className={`h-3.5 w-3.5 ${isJoinQueueLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
              {isJoinQueueLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : joinRequests.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No requests matched the selected status.
                </p>
              ) : (
                joinRequests.map((request) => {
                  const statusMeta = joinRequestStatusMeta[request.status];
                  const decisionLoading = Boolean(decisionLoadingMap[request.id]);
                  return (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {request.applicantName ?? 'Unknown applicant'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Submitted {formatDateTime(request.createdAt)}
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
                      {request.paymentProofUrl ? (
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2">
                            <img
                              src={request.paymentProofUrl}
                              alt="Payment proof"
                              className="h-48 w-full rounded-xl object-cover"
                            />
                          </div>
                          <div className="flex flex-col justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Payment proof
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {request.applicantName ?? 'Applicant'}
                              </p>
                              <p className="text-xs text-slate-500">
                                Ensure the transfer details match before approving.
                              </p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <a
                                href={request.paymentProofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-500 transition hover:bg-orange-50"
                              >
                                <Image className="h-3.5 w-3.5" />
                                View full size
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-700">
                          Applicant has not attached payment evidence.
                        </p>
                      )}
                      {request.status === 'PENDING' && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleDecision(request.id, 'REJECTED')}
                            disabled={decisionLoading || !canManage}
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-50"
                          >
                            {decisionLoading ? 'WorkingGǪ' : 'Reject'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecision(request.id, 'APPROVED')}
                            disabled={decisionLoading || !canManage}
                            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
                          >
                            {decisionLoading ? 'WorkingGǪ' : 'Approve'}
                          </button>
                        </div>
                      )}
                      {!canManage && request.status === 'PENDING' && (
                        <p className="mt-3 text-xs text-slate-500">
                          Only club leaders can approve or reject requests.
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="mt-6 space-y-3">
              {isSettingsLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <Fragment>
                  <SettingItem
                    icon={Users}
                    label="Require approval"
                    value={settings?.requireApproval ?? true}
                  />
                  <SettingItem
                    icon={Users2}
                    label="Allow waitlist"
                    value={settings?.allowWaitlist ?? true}
                  />
                  <SettingItem
                    icon={Settings2}
                    label="Notifications"
                    value={settings?.enableNotifications ?? true}
                  />
                  <BankInstructionCard
                    club={club}
                    canManage={canManage}
                    settings={settings}
                    bankForm={bankForm}
                    onChange={onBankFormChange}
                    onSave={onSaveBankSettings}
                    isSaving={isBankSettingsSaving}
                  />
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
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
                          Refresh
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
                        Copy
                      </button>
                    </div>
                  </div>
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
        value ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
      }`}
    >
      <Icon className="h-4 w-4" />
    </span>
    <div className="flex-1">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-xs text-slate-500">{value ? 'Enabled' : 'Disabled'}</p>
    </div>
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
        value ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {value ? 'ON' : 'OFF'}
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
    settings?.joinFee !== undefined && settings?.joinFee !== null ? settings.joinFee : 0;
  const amountForPreview = canManage ? formAmount : configuredAmount;
  const bankId = canManage ? bankForm.bankId : settings?.bankId ?? '';
  const accountNo = canManage ? bankForm.bankAccountNumber : settings?.bankAccountNumber ?? '';
  const accountName =
    (canManage ? bankForm.bankAccountName : settings?.bankAccountName) ??
    settings?.clubName ??
    club.name ??
    '';
  const transferNote =
    (canManage ? bankForm.bankTransferNote : settings?.bankTransferNote) ??
    settings?.clubCode ??
    club.code ??
    club.name ??
    '';
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
        <p className="text-sm font-semibold text-slate-900">Bank instructions</p>
        <p className="text-xs text-slate-500">
          Members pay via VietQR, then submit their join request for leader approval.
        </p>
      </div>
      {canManage ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Bank ID
              <input
                type="text"
                value={bankForm.bankId}
                onChange={(event) => onChange('bankId', event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="e.g. ACB"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account number
              <input
                type="text"
                value={bankForm.bankAccountNumber}
                onChange={(event) => onChange('bankAccountNumber', event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="0123456789"
              />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account name
              <input
                type="text"
                value={bankForm.bankAccountName}
                onChange={(event) => onChange('bankAccountName', event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="NGUYEN VAN A"
              />
            </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Transfer note
                <input
                  type="text"
                  value={bankForm.bankTransferNote}
                  onChange={(event) => onChange('bankTransferNote', event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder={`JOIN-${club.code ?? 'MYCLUB'}`}
              />
            </label>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Join fee (VND)
              <input
                type="number"
                min="0"
                value={bankForm.joinFee}
                onChange={(event) => onChange('joinFee', event.target.value)}
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
              {isSaving ? 'SavingGǪ' : 'Save instructions'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2 text-sm">
          {isConfigured ? (
            <Fragment>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Bank</span>
                <span className="font-semibold text-slate-900">{bankId}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Account</span>
                <span className="font-semibold text-slate-900">{accountNo}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Account name</span>
                <span className="font-semibold text-slate-900">{accountName}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Join fee</span>
                <span className="font-semibold text-slate-900">
                  {formatJoinFeeValue(amountForPreview)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span className="text-slate-500">Transfer note</span>
                <span className="font-semibold text-slate-900">{transferNote}</span>
              </div>
            </Fragment>
          ) : (
            <p className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-amber-700">
              Leaders have not configured bank instructions yet.
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
          <p className="mt-2 text-xs text-slate-500">Scan QR to pay {formatJoinFeeValue(amountForPreview)}</p>
        </div>
      )}
    </div>
  );
};


export default ClubDetailDrawer;
