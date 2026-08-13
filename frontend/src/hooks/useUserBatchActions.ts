import type { Dispatch, SetStateAction } from "react";

import {
  useDeleteUsers,
  useInviteMutation,
  useResendInvitation,
} from "@/hooks/mutations/useInvitationMutations";
import {
  toBatchFailureRows,
  useBatchFailureModal,
} from "@/hooks/useBatchFailureModal";
import { parseErrorCode } from "@/api/parseError";
import { useNoticeStore } from "@/state/store/noticeStore";
import { ERROR_CODES } from "@/constants/apiConstants";
import { NOTICE_TEXT } from "@/constants/noticeConstants";
import type { TTeamMemberRole } from "@/types/teamTypes";
import type {
  TInvitePayload,
  TInviteResult,
  TUserListItem,
} from "@/types/userTypes";

interface UseUserBatchActionsOptions {
  /** Selection reconciliation — deleted targets drop out, failed ones
      stay selected for a retry. */
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  /** Called with the ids that were actually deleted (drawer close-out). */
  onDeleted: (deletedIds: string[]) => void;
}

/**
 * useUserBatchActions owns the SC-11 bulk flows — invite (SC-12), invite-
 * code resend, and batch delete (SC-15) — including their notice/batch-
 * failure surfaces. Pure orchestration over the invitation mutations; the
 * page supplies selection reconciliation and the drawer close-out.
 */
export const useUserBatchActions = ({
  setSelectedIds,
  onDeleted,
}: UseUserBatchActionsOptions) => {
  const invite = useInviteMutation();
  const resend = useResendInvitation();
  const deleteUsersMutation = useDeleteUsers();
  const { batchFailures, showBatchFailures, closeBatchFailures } =
    useBatchFailureModal();
  const showNotice = useNoticeStore((state) => state.showNotice);

  /** POST /invitations — server judges duplicates and target states; only
      the staged team/role sets are sent (buildInvitePreview's sub-team
      expansion is display-only, the server performs the real expansion). */
  const inviteMember = async (
    payload: TInvitePayload,
  ): Promise<TInviteResult> => {
    try {
      await invite.mutateAsync({
        account: payload.email,
        username: payload.username,
        memberships: payload.sets.map((set) => ({
          teamId: set.teamId,
          role: set.role as TTeamMemberRole,
        })),
      });
      return "success";
    } catch (err) {
      if (err instanceof Response) {
        const code = await parseErrorCode(err);
        return code === ERROR_CODES.ALREADY_TEAM_MEMBER
          ? "duplicate-account"
          : "error";
      }
      return "error";
    }
  };

  /** POST /invitations/resend for one account (drawer action). */
  const resendCode = (userId: string) => resend.mutateAsync(userId);

  /** POST /invitations/resend (per target) — status never changes (D10).
      Selection stays intact on partial failure so the user can retry. */
  const resendCodes = async (targets: TUserListItem[]) => {
    const results = await Promise.allSettled(
      targets.map((u) => resend.mutateAsync(u.userId)),
    );
    const failed = targets.filter((_, i) => results[i].status === "rejected");
    if (failed.length === 0) {
      showNotice(
        NOTICE_TEXT.resendInvitation.title,
        NOTICE_TEXT.resendInvitation.success,
        "info",
      );
      return;
    }
    showBatchFailures(
      failed.map((u) => ({
        account: u.account,
        reason: NOTICE_TEXT.resendInvitation.failedReason,
      })),
    );
  };

  /** DELETE /users (batch) — memberships, session token, and unused
      invite codes go together (D13). Full success clears the targets
      from selection and closes the drawer if it pointed at one of
      them; partial failure shows the failure modal (account + reason)
      and leaves the still-failed ids selected for retry. Throws only
      on full failure, so MemberDeleteModal/the drawer's onDeleteMember
      contract (resolve unless every target failed) is unaffected. */
  const deleteMembers = async (targets: TUserListItem[]) => {
    const userIds = targets.map((u) => u.userId);
    const result = await deleteUsersMutation.mutateAsync(userIds);
    const failedIds = new Set(result.failed.map((f) => f.id));
    const succeededIds = userIds.filter((id) => !failedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      succeededIds.forEach((id) => next.delete(id));
      return next;
    });
    onDeleted(succeededIds);

    if (result.failed.length === 0) {
      showNotice(
        NOTICE_TEXT.deleteMember.title,
        NOTICE_TEXT.deleteMember.success,
        "info",
      );
      return;
    }
    if (succeededIds.length === 0) {
      throw new Error("delete failed for every target");
    }
    showBatchFailures(
      toBatchFailureRows(
        result.failed,
        (id) => targets.find((u) => u.userId === id)?.account ?? id,
        (code) => code,
      ),
    );
  };

  return {
    inviteMember,
    resendCode,
    resendCodes,
    deleteMembers,
    batchFailures,
    closeBatchFailures,
  };
};
