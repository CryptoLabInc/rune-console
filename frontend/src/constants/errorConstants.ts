import { ERROR_CODES } from "@/constants/apiConstants";
import { L } from "@/locales";

/**
 * Backend error code → user-facing copy, shared by every screen that surfaces
 * the shared error envelope (parseErrorCode). The same code can read
 * differently per flow (e.g. USER_NOT_FOUND during add vs batch), so maps are
 * grouped by context rather than merged into one — pick the map that matches
 * the flow. For unmapped codes each call site picks its own fallback: the
 * generic retry copy, or the raw backend code itself where that diagnostic
 * detail is worth showing (member removal / user delete failure modals).
 *
 * Each entry is a getter so it re-resolves against the active language on a
 * live switch — a plain `L.*` value would freeze at module-eval time.
 */

/** Team CRUD failures (SC-06/07 — create · rename · delete). */
export const TEAM_REASON: Record<string, string> = {
  get [ERROR_CODES.TEAM_NAME_DUPLICATE]() {
    return L.teams.dupName;
  },
  get [ERROR_CODES.TEAM_NAME_INVALID]() {
    return L.teams.invalidTeamName;
  },
  get [ERROR_CODES.TEAM_HAS_CHILDREN]() {
    return L.teams.cannotDeleteHasChildren;
  },
};

/** Per-target failure reasons from the batch endpoints (bulk role change,
    membership removal, user delete) — listed in MemberBatchFailureModal. */
export const BATCH_REASON: Record<string, string> = {
  get [ERROR_CODES.USER_NOT_FOUND]() {
    return L.teams.userNotFound;
  },
  get [ERROR_CODES.NOT_TEAM_MEMBER]() {
    return L.teams.notTeamMember;
  },
  get [ERROR_CODES.TEAM_NOT_FOUND]() {
    return L.members.teamNotFound;
  },
};

/** Add-member flow failures (SC-06 팀에 멤버 추가) — the add context words
    the same codes differently (USER_NOT_FOUND = unregistered account). */
export const ADD_MEMBER_REASON: Record<string, string> = {
  get [ERROR_CODES.ALREADY_TEAM_MEMBER]() {
    return L.teams.alreadyInvited;
  },
  get [ERROR_CODES.USER_NOT_FOUND]() {
    return L.teams.notRegistered;
  },
  get [ERROR_CODES.CANNOT_INVITE_ADMIN]() {
    return L.teams.cannotAddAdmin;
  },
  get [ERROR_CODES.MAIL_UPSTREAM_ERROR]() {
    return L.teams.inviteSendFailed;
  },
};
