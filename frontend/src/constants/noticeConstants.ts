import { L } from "@/locales";
import { MODAL_TITLES } from "@/constants/commonConstants";

/**
 * showNotice copy grouped per flow — {title, success, failure, ...} so a
 * flow's wording lives in one place instead of inline at each call site.
 * Titles reuse MODAL_TITLES where the notice reports the outcome of that
 * modal's action; flows without a matching modal title keep their own.
 * Keys beyond success/failure are code-specific bodies (e.g. alreadyMember
 * for ALREADY_TEAM_MEMBER) picked by the call site's error handling.
 */
export const NOTICE_TEXT = {
  resendInvitation: {
    get title() {
      return L.btn.resendInvitationCode;
    },
    get success() {
      return L.members.inviteCodeResent;
    },
    get failure() {
      return L.members.resendCodeFailed;
    },
    /** Per-account reason row in the batch-failure modal. */
    get failedReason() {
      return L.members.resendFailedShort;
    },
  },
  addMembership: {
    get title() {
      return L.members.addTeamTitle;
    },
    get success() {
      return L.members.addedToTeam;
    },
    get alreadyMember() {
      return L.members.alreadyTeamMember;
    },
    get failure() {
      return L.members.addTeamFailed;
    },
  },
  /* Role-change and remove-failure results render INSIDE
     RoleChangeConfirmModal/MembershipRemoveModal (SC-06 E-1/E-2) — only
     the full-success removal toast goes through showNotice. */
  removeMembership: {
    title: MODAL_TITLES.removeMembership,
    get success() {
      return L.teams.membershipsRemoved;
    },
  },
  deactivateSession: {
    title: MODAL_TITLES.deactivateSession,
    get success() {
      return L.members.sessionDeactivated;
    },
    get alreadyExpired() {
      return L.members.sessionAlreadyExpired;
    },
    get failure() {
      return L.members.deactivateFailed;
    },
  },
  cancelInvitation: {
    title: MODAL_TITLES.cancelInvitation,
    get success() {
      return L.members.invitationCanceled;
    },
    get nothingToCancel() {
      return L.members.noInvitationToCancel;
    },
    get failure() {
      return L.members.cancelInvitationFailed;
    },
  },
  createTeam: {
    get title() {
      return L.teams.createTeamTitle;
    },
    get success() {
      return L.teams.teamCreated;
    },
  },
  renameTeam: {
    title: MODAL_TITLES.renameTeam,
    get success() {
      return L.teams.teamRenamed;
    },
  },
  deleteTeam: {
    get title() {
      return L.teams.deleteTeamTitle;
    },
    get success() {
      return L.teams.teamDeleted;
    },
  },
  addTeamMember: {
    get title() {
      return L.teams.addMemberTitle;
    },
    get success() {
      return L.teams.memberAdded;
    },
  },
  deleteMember: {
    get title() {
      return L.btn.deleteMember;
    },
    get success() {
      return L.members.membersDeleted;
    },
  },
} as const;
