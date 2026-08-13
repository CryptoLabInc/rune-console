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
    title: "초대 코드 재전송",
    success: "초대 코드를 재전송했습니다.",
    failure: "초대 코드 재전송에 실패했습니다. 다시 시도해 주세요.",
    /** Per-account reason row in the batch-failure modal. */
    failedReason: "재전송 실패",
  },
  addMembership: {
    title: "팀 추가",
    success: "팀에 추가되었습니다.",
    alreadyMember: "이미 소속된 팀입니다.",
    failure: "팀 추가에 실패했습니다. 다시 시도해 주세요.",
  },
  /* Role-change and remove-failure results render INSIDE
     RoleChangeConfirmModal/MembershipRemoveModal (SC-06 E-1/E-2) — only
     the full-success removal toast goes through showNotice. */
  removeMembership: {
    title: MODAL_TITLES.removeMembership,
    success: "멤버십이 제거되었습니다.",
  },
  deactivateSession: {
    title: MODAL_TITLES.deactivateSession,
    success: "세션을 비활성화했습니다.",
    alreadyExpired: "이미 만료된 세션입니다.",
    failure: "세션 비활성화에 실패했습니다. 다시 시도해 주세요.",
  },
  cancelInvitation: {
    title: MODAL_TITLES.cancelInvitation,
    success: "초대를 취소했습니다.",
    nothingToCancel: "취소할 초대가 없습니다.",
    failure: "초대 취소에 실패했습니다. 다시 시도해 주세요.",
  },
  createTeam: {
    title: "팀 생성",
    success: "팀이 생성되었습니다.",
  },
  renameTeam: {
    title: MODAL_TITLES.renameTeam,
    success: "팀 이름이 변경되었습니다.",
  },
  deleteTeam: {
    title: "팀 삭제",
    success: "팀이 삭제되었습니다.",
  },
  addTeamMember: {
    title: "멤버 추가",
    success: "멤버를 추가했습니다.",
  },
  deleteMember: {
    title: "멤버 삭제",
    success: "멤버를 삭제했습니다.",
  },
} as const;
