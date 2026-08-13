import { useState } from "react";

import Button from "@/components/elements/Button";
import MemberStatus from "@/components/elements/MemberStatus";
import StatusBadge from "@/components/elements/StatusBadge";
import DrawerLayout from "@/components/layout/DrawerLayout";
import MemberBatchFailureModal from "@/components/teams/MemberBatchFailureModal";
import CancelInvitationModal from "@/components/users/CancelInvitationModal";
import MemberDeleteModal from "@/components/users/MemberDeleteModal";
import MembershipRemoveModal from "@/components/users/MembershipRemoveModal";
import MembershipSection from "@/components/users/MembershipSection";
import RoleChangeConfirmModal from "@/components/users/RoleChangeConfirmModal";
import SessionDeactivateModal from "@/components/users/SessionDeactivateModal";
import { useMembershipDrafts } from "@/hooks/useMembershipDrafts";
import { parseErrorCode } from "@/api/parseError";
import { useNoticeStore } from "@/state/store/noticeStore";
import { formatDate, formatDateTime } from "@/utils/formatDate";
import {
  ERROR_CODES,
  INVITATION_STATUS,
  SESSION_STATUS,
} from "@/constants/apiConstants";
import { BTN_TEXT, TABLE_HEADERS } from "@/constants/commonConstants";
import { NOTICE_TEXT } from "@/constants/noticeConstants";
import { INVITATION_STATUS_VAR } from "@/constants/styleConstants";
import { CHIP_STATUS } from "@/constants/userConstants";
import type { TBatchResult, TTeamTree } from "@/types/teamTypes";
import type { TUserListItem } from "@/types/userTypes";
import { L } from "@/locales";

const styles = {
  /* Status chip sits to the left of the access-time text, vertically
     centered (SC-13 header row). */
  statusRow: "flex items-center gap-2",
  accessTime: "text-faint font-mono text-xs",
  sectionHead: "flex items-center gap-2",
  bulkRow: "pt-2 flex justify-end gap-2",
};

/** Per-status header timestamp (SC-13 no.1 — D13). Session takes priority:
    an online member shows last access; otherwise the invitation axis drives it. */
const subtitleFor = (user: TUserListItem): string => {
  if (user.sessionStatus === SESSION_STATUS.online) {
    return L.members.lastAccessed(formatDate(user.lastAccessAt));
  }
  switch (user.invitationStatus) {
    case INVITATION_STATUS.redeemed:
      return L.members.redeemedAwaiting;
    case INVITATION_STATUS.pending:
    case INVITATION_STATUS.expired:
      return L.members.lastInviteSentAt(formatDateTime(user.lastInvitedAt));
  }
};

type TDrawerModal =
  | "role-confirm"
  | "remove"
  | "delete"
  | "deactivate"
  | "cancel-invitation"
  | null;

interface MemberDetailDrawerProps {
  user: TUserListItem;
  onClose: () => void;
  /** Applies staged role changes (this user, listed teams only); resolves
      the batch result — partial failures render inline (SC-13). */
  onUpdateRoles: (
    changes: { teamId: string; role: string }[],
  ) => Promise<TBatchResult>;
  /** Removes this user's memberships in the listed teams (no cascade);
      resolves the batch result. */
  onRemoveMemberships: (teamIds: string[]) => Promise<TBatchResult>;
  /** Adds this user to a team (SC-13 no.2 — POST /users/{id}/memberships). */
  onAddMembership: (teamId: string, role: string) => Promise<void>;
  /** Issues a new invite code (WT) — status never changes (D10). */
  onResendCode: () => Promise<void>;
  /** Deletes the account — the caller also closes this drawer (SC-15). */
  onDeleteMember: () => Promise<void>;
  /** Destroys the user's console session token (D12). */
  onDeactivateSession: () => Promise<void>;
  /** Force-expires every unused invite code for this account (D15) —
      the account itself is not deleted. */
  onCancelInvitation: () => Promise<void>;
  /** Real team tree (GET /teams/tree) — drives the sub-team notice. */
  teams: TTeamTree;
}

/**
 * MemberDetailDrawer is the 멤버 상세 drawer (SC-13): per-status
 * timestamp, membership list with staged role edits (applied through
 * the role-change confirm modal) and checkbox bulk removal (SC-14),
 * invite-code actions, and member delete (SC-15). Mount with
 * key={user.userId} so switching members resets the staged state.
 * The membership machine lives in useMembershipDrafts; this component
 * composes it with the account-level actions and the confirm modals.
 */
const MemberDetailDrawer = ({
  user,
  onClose,
  onUpdateRoles,
  onRemoveMemberships,
  onAddMembership,
  onResendCode,
  onDeleteMember,
  onDeactivateSession,
  onCancelInvitation,
  teams,
}: MemberDetailDrawerProps) => {
  const drafts = useMembershipDrafts({
    user,
    teams,
    onUpdateRoles,
    onRemoveMemberships,
    onAddMembership,
  });
  const [openModal, setOpenModal] = useState<TDrawerModal>(null);
  const [resending, setResending] = useState(false);
  const showNotice = useNoticeStore((state) => state.showNotice);
  const closeModal = () => setOpenModal(null);

  const handleResend = async () => {
    setResending(true);
    try {
      await onResendCode();
      showNotice(
        NOTICE_TEXT.resendInvitation.title,
        NOTICE_TEXT.resendInvitation.success,
        "info",
      );
    } catch {
      showNotice(
        NOTICE_TEXT.resendInvitation.title,
        NOTICE_TEXT.resendInvitation.failure,
        "error",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <DrawerLayout
        isOpen
        title={user.username}
        subtitle={user.account}
        headerAction={<MemberStatus status={CHIP_STATUS[user.sessionStatus]} />}
        onClose={onClose}
        footer={
          <div className="col-span-2 flex justify-end">
            <Button
              btnText={BTN_TEXT.close}
              btnSize="md"
              btnColor="grayOutline"
              className="w-20"
              handleClick={onClose}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          <div className={styles.statusRow}>
            <StatusBadge
              label={INVITATION_STATUS_VAR[user.invitationStatus].label}
              color={INVITATION_STATUS_VAR[user.invitationStatus].color}
            />
            <span className={styles.accessTime}>{subtitleFor(user)}</span>
          </div>

          <div className="flex flex-col gap-2 self-end">
            <div className={"flex items-center gap-2"}>
              <Button
                btnText={BTN_TEXT.resendInvitationCode}
                btnSize="sm"
                btnColor="mintOutline"
                className="w-fit"
                disabled={resending}
                handleClick={handleResend}
              />
              {/* Only meaningful while an unused, unexpired code exists —
              cancel forces it to expire (D15). */}
              <Button
                btnText={BTN_TEXT.cancelInvitation}
                btnSize="sm"
                btnColor="grayOutline"
                className="w-fit"
                disabled={user.invitationStatus !== INVITATION_STATUS.pending}
                handleClick={() => setOpenModal("cancel-invitation")}
              />
            </div>
          </div>
        </div>

        <hr />

        <MembershipSection
          memberships={drafts.memberships}
          changesCount={drafts.changes.length}
          selectedCount={drafts.selected.length}
          allChecked={drafts.allChecked}
          onCheck={drafts.setChecked}
          onCheckAll={drafts.setAllChecked}
          onRoleChange={drafts.stageRole}
          onResetChanges={drafts.resetStaged}
          onOpenRoleConfirm={() => setOpenModal("role-confirm")}
          onOpenRemove={() => setOpenModal("remove")}
          addOpen={drafts.addOpen}
          addTeamId={drafts.addTeamId}
          addRole={drafts.addRole}
          adding={drafts.adding}
          addableTeams={drafts.addableTeams}
          onAddTeamIdChange={drafts.setAddTeamId}
          onAddRoleChange={drafts.setAddRole}
          onToggleAddRow={drafts.toggleAddRow}
          onAdd={drafts.handleAdd}
        />

        <hr />

        <section className="flex flex-col gap-4">
          <div className={styles.sectionHead}>
            <b className="text-md">{L.nav.users}</b>
          </div>

          {/* Account-level actions: 세션 비활성화 · 멤버 삭제 (SC-15) —
              moved out of the header/status rows so they live with member
              management, still away from the footer's 닫기. */}
          <div className={styles.bulkRow}>
            {/* Destroys the session token → 세션 만료 (D12; confirm
                dialog follows). Enabled only while sessionStatus is
                "online" (D13). */}
            <Button
              btnText={BTN_TEXT.deactivateSession}
              btnSize="sm"
              btnColor="redOutline"
              className="w-fit"
              disabled={user.sessionStatus !== SESSION_STATUS.online}
              handleClick={() => setOpenModal("deactivate")}
            />
            <Button
              btnText={BTN_TEXT.deleteMember}
              btnSize="sm"
              btnColor="redFilled"
              className="w-fit"
              handleClick={() => setOpenModal("delete")}
            />
          </div>
        </section>
      </DrawerLayout>

      {openModal === "role-confirm" && (
        <RoleChangeConfirmModal
          subjectLabel={TABLE_HEADERS.team}
          changes={drafts.changes.map((m) => ({
            label: m.teamName,
            from: m.baseRole,
            to: m.role,
          }))}
          onConfirm={drafts.confirmRoleChanges}
          onClose={closeModal}
        />
      )}

      {openModal === "remove" && (
        <MembershipRemoveModal
          targets={drafts.selected.map((m) => ({
            account: user.account,
            teamId: m.teamId,
            teamName: m.teamName,
            role: m.role,
          }))}
          subteamNotice={drafts.subteamNotice}
          onConfirm={drafts.confirmRemovals}
          onClose={closeModal}
        />
      )}

      {openModal === "delete" && (
        <MemberDeleteModal
          targets={[
            {
              account: user.account,
              memberships: drafts.memberships.map((m) => ({
                teamName: m.teamName,
                role: m.baseRole,
              })),
            },
          ]}
          onConfirm={onDeleteMember}
          onClose={closeModal}
        />
      )}

      {openModal === "deactivate" && (
        <SessionDeactivateModal
          account={user.account}
          onConfirm={async () => {
            try {
              await onDeactivateSession();
              closeModal();
              showNotice(
                NOTICE_TEXT.deactivateSession.title,
                NOTICE_TEXT.deactivateSession.success,
                "info",
              );
            } catch (err) {
              const code =
                err instanceof Response ? await parseErrorCode(err) : "";
              closeModal();
              showNotice(
                NOTICE_TEXT.deactivateSession.title,
                code === ERROR_CODES.SESSION_NOT_ACTIVE
                  ? NOTICE_TEXT.deactivateSession.alreadyExpired
                  : NOTICE_TEXT.deactivateSession.failure,
                "error",
              );
            }
          }}
          onClose={closeModal}
        />
      )}

      {openModal === "cancel-invitation" && (
        <CancelInvitationModal
          account={user.account}
          onConfirm={async () => {
            try {
              await onCancelInvitation();
              closeModal();
              showNotice(
                NOTICE_TEXT.cancelInvitation.title,
                NOTICE_TEXT.cancelInvitation.success,
                "info",
              );
            } catch (err) {
              const code =
                err instanceof Response ? await parseErrorCode(err) : "";
              closeModal();
              showNotice(
                NOTICE_TEXT.cancelInvitation.title,
                code === ERROR_CODES.INVITATION_NOT_PENDING
                  ? NOTICE_TEXT.cancelInvitation.nothingToCancel
                  : NOTICE_TEXT.cancelInvitation.failure,
                "error",
              );
            }
          }}
          onClose={closeModal}
        />
      )}

      {drafts.batchFailures && (
        <MemberBatchFailureModal
          failures={drafts.batchFailures}
          onClose={drafts.closeBatchFailures}
        />
      )}
    </>
  );
};

export default MemberDetailDrawer;
