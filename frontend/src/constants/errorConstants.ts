import { ERROR_CODES } from "@/constants/apiConstants";

/**
 * Backend error code → user-facing Korean copy, shared by every screen that
 * surfaces the shared error envelope (parseErrorCode). The same code can read
 * differently per flow (e.g. USER_NOT_FOUND during add vs batch), so maps are
 * grouped by context rather than merged into one — pick the map that matches
 * the flow. For unmapped codes each call site picks its own fallback: the
 * generic retry copy, or the raw backend code itself where that diagnostic
 * detail is worth showing (member removal / user delete failure modals).
 */

/** Duplicate-name copy — shared by the server reason map and the client-side
    duplicate check in the create/rename team modals (must stay identical). */
export const TEAM_NAME_DUPLICATE_TEXT =
  "같은 상위 팀에 동일한 이름이 이미 있습니다.";

/** Team CRUD failures (SC-06/07 — create · rename · delete). */
export const TEAM_REASON: Record<string, string> = {
  [ERROR_CODES.TEAM_NAME_DUPLICATE]: TEAM_NAME_DUPLICATE_TEXT,
  [ERROR_CODES.TEAM_NAME_INVALID]: "팀 이름 형식이 올바르지 않습니다.",
  [ERROR_CODES.TEAM_HAS_CHILDREN]: "하위 팀이 있어 삭제할 수 없습니다.",
};

/** Per-target failure reasons from the batch endpoints (bulk role change,
    membership removal, user delete) — listed in MemberBatchFailureModal. */
export const BATCH_REASON: Record<string, string> = {
  [ERROR_CODES.USER_NOT_FOUND]: "사용자를 찾을 수 없습니다",
  [ERROR_CODES.NOT_TEAM_MEMBER]: "팀 멤버가 아닙니다",
  [ERROR_CODES.TEAM_NOT_FOUND]: "팀을 찾을 수 없습니다",
};

/** Generic retry copy for an unmapped batch code (e.g. a transient
    INTERNAL). Used by the role-change flows; the removal/delete failure
    modals instead surface the raw code as a diagnostic hint. */
export const BATCH_REASON_FALLBACK = "처리에 실패했습니다. 다시 시도해 주세요.";

/** Add-member flow failures (SC-06 팀에 멤버 추가) — the add context words
    the same codes differently (USER_NOT_FOUND = unregistered account). */
export const ADD_MEMBER_REASON: Record<string, string> = {
  [ERROR_CODES.ALREADY_TEAM_MEMBER]: "이미 초대된 사용자입니다.",
  [ERROR_CODES.USER_NOT_FOUND]: "등록되지 않은 계정입니다.",
  [ERROR_CODES.CANNOT_INVITE_ADMIN]: "콘솔 관리자 계정은 추가할 수 없습니다.",
  [ERROR_CODES.MAIL_UPSTREAM_ERROR]:
    "초대 코드 전송에 실패했습니다. 다시 시도해 주세요.",
};
