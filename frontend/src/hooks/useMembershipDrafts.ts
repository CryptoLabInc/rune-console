import { useState } from "react";

import {
  toBatchFailureRows,
  useBatchFailureModal,
} from "@/hooks/useBatchFailureModal";
import { usePageScopedSelection } from "@/hooks/usePageScopedSelection";
import { parseErrorCode } from "@/api/parseError";
import { useNoticeStore } from "@/state/store/noticeStore";
import { buildTeamOptions } from "@/utils/buildTeamOptions";
import { getTeamDescendantIds } from "@/utils/teamHierarchy";
import { ERROR_CODES } from "@/constants/apiConstants";
import { BATCH_REASON_FALLBACK } from "@/constants/errorConstants";
import { NOTICE_TEXT } from "@/constants/noticeConstants";
import type { TBatchResult, TTeamTree } from "@/types/teamTypes";
import type { TUserListItem } from "@/types/userTypes";

/** One membership row as rendered: server truth (baseRole) with the
    staged edits (role pick, checkbox) applied on top. */
export type TMembershipDraft = {
  teamId: string;
  teamName: string;
  baseRole: string;
  role: string;
  checked: boolean;
};

interface UseMembershipDraftsOptions {
  user: TUserListItem;
  /** Real team tree (GET /teams/tree) — add picker + sub-team notice. */
  teams: TTeamTree;
  onUpdateRoles: (
    changes: { teamId: string; role: string }[],
  ) => Promise<TBatchResult>;
  onRemoveMemberships: (teamIds: string[]) => Promise<TBatchResult>;
  onAddMembership: (teamId: string, role: string) => Promise<void>;
}

/**
 * useMembershipDrafts owns the SC-13 membership machine. Server truth
 * (user.memberships) flows straight from props — never copied into
 * state — so the fresher GET /users/{id} payload and every post-mutation
 * refetch render immediately. Only the user's own edits are staged (role
 * picks + checkbox selection), re-applied as a diff on top of whatever
 * the server currently says. The confirm flows reconcile batch results:
 * succeeded targets un-stage (the refetch delivers their new truth),
 * failed ones stay staged/checked for a retry and surface in the
 * batch-failure modal.
 */
export const useMembershipDrafts = ({
  user,
  teams,
  onUpdateRoles,
  onRemoveMemberships,
  onAddMembership,
}: UseMembershipDraftsOptions) => {
  const [pendingRoles, setPendingRoles] = useState<Map<string, string>>(
    new Map(),
  );
  const {
    selectedIds: checkedIds,
    toggleOne: setChecked,
    toggleAll: setAllChecked,
    setSelectedIds: setCheckedIds,
  } = usePageScopedSelection();
  const { batchFailures, showBatchFailures, closeBatchFailures } =
    useBatchFailureModal();
  const showNotice = useNoticeStore((state) => state.showNotice);

  const memberships: TMembershipDraft[] = user.memberships.map((m) => ({
    teamId: m.teamId,
    teamName: m.teamName,
    baseRole: m.role,
    role: pendingRoles.get(m.teamId) ?? m.role,
    checked: checkedIds.has(m.teamId),
  }));

  /* A staged pick equal to the (possibly refetched) server role is a
     no-op and drops out of `changes` on its own. */
  const changes = memberships.filter((m) => m.role !== m.baseRole);
  const selected = memberships.filter((m) => m.checked);
  const allChecked =
    memberships.length > 0 && memberships.every((m) => m.checked);

  /* Sub-team retention notice (SC-14 no.2): a selected team has a
     descendant team whose membership stays after this removal. */
  const remainingIds = memberships
    .filter((m) => !m.checked)
    .map((m) => m.teamId);
  const subteamNotice = selected.some((m) =>
    getTeamDescendantIds(teams, m.teamId).some((id) =>
      remainingIds.includes(id),
    ),
  );

  /* Failure rows are labeled by team name — the drawer's batch targets
     are this one user's memberships. */
  const teamNameOf = (teamId: string) =>
    memberships.find((m) => m.teamId === teamId)?.teamName ?? teamId;

  const stageRole = (teamId: string, role: string) =>
    setPendingRoles((prev) => new Map(prev).set(teamId, role));
  const resetStaged = () => setPendingRoles(new Map());

  /* ── [팀 추가하기] picker row (SC-13 no.2) ─────────────────────── */
  const [addOpen, setAddOpen] = useState(false);
  const [addTeamId, setAddTeamId] = useState("");
  const [addRole, setAddRole] = useState("");
  const [adding, setAdding] = useState(false);

  /* Teams the user already belongs to stay out of the add picker.
     Depth indent stripped — the narrow drawer dropdown can't fit
     deep-tree indentation. */
  const joinedIds = new Set(memberships.map((m) => m.teamId));
  const addableTeams = buildTeamOptions(teams)
    .filter((o) => !joinedIds.has(o.value))
    .map(({ value, label }) => ({ value, label }));

  const resetAdd = () => {
    setAddOpen(false);
    setAddTeamId("");
    setAddRole("");
  };
  const toggleAddRow = () => (addOpen ? resetAdd() : setAddOpen(true));

  const handleAdd = async () => {
    setAdding(true);
    try {
      /* The mutation invalidates the user detail/list queries — the new
         row arrives with the refetch, so nothing is mirrored locally. */
      await onAddMembership(addTeamId, addRole);
      showNotice(
        NOTICE_TEXT.addMembership.title,
        NOTICE_TEXT.addMembership.success,
        "info",
      );
      resetAdd();
    } catch (err) {
      const code = err instanceof Response ? await parseErrorCode(err) : "";
      showNotice(
        NOTICE_TEXT.addMembership.title,
        code === ERROR_CODES.ALREADY_TEAM_MEMBER
          ? NOTICE_TEXT.addMembership.alreadyMember
          : NOTICE_TEXT.addMembership.failure,
        "error",
      );
    } finally {
      setAdding(false);
    }
  };

  /* ── confirm flows (RoleChangeConfirmModal / MembershipRemoveModal) ── */
  const confirmRoleChanges = async () => {
    const changedIds = changes.map((m) => m.teamId);
    const result = await onUpdateRoles(
      changes.map((m) => ({ teamId: m.teamId, role: m.role })),
    );
    const failedIds = new Set(result.failed.map((f) => f.id));
    /* Applied roles come back with the invalidation refetch — drop their
       staged picks and keep only the failed ones staged for a retry. */
    setPendingRoles((prev) => {
      const next = new Map(prev);
      for (const teamId of changedIds) {
        if (!failedIds.has(teamId)) next.delete(teamId);
      }
      return next;
    });
    if (result.failed.length > 0) {
      showBatchFailures(
        toBatchFailureRows(
          result.failed,
          teamNameOf,
          () => BATCH_REASON_FALLBACK,
        ),
      );
    }
  };

  const confirmRemovals = async () => {
    const removedIds = selected.map((m) => m.teamId);
    const result = await onRemoveMemberships(removedIds);
    const failedIds = new Set(result.failed.map((f) => f.id));
    /* Removed rows drop out with the invalidation refetch — clear their
       staged edits; failed rows keep their check for a retry. */
    setCheckedIds((prev) => {
      const next = new Set(prev);
      for (const teamId of removedIds) {
        if (!failedIds.has(teamId)) next.delete(teamId);
      }
      return next;
    });
    setPendingRoles((prev) => {
      const next = new Map(prev);
      for (const teamId of removedIds) {
        if (!failedIds.has(teamId)) next.delete(teamId);
      }
      return next;
    });
    if (result.failed.length === 0) {
      showNotice(
        NOTICE_TEXT.removeMembership.title,
        NOTICE_TEXT.removeMembership.success,
        "success",
      );
    } else {
      showBatchFailures(
        toBatchFailureRows(
          result.failed,
          teamNameOf,
          () => BATCH_REASON_FALLBACK,
        ),
      );
    }
  };

  return {
    memberships,
    changes,
    selected,
    allChecked,
    subteamNotice,
    stageRole,
    setChecked,
    setAllChecked,
    resetStaged,
    addOpen,
    addTeamId,
    addRole,
    adding,
    addableTeams,
    setAddTeamId,
    setAddRole,
    toggleAddRow,
    handleAdd,
    confirmRoleChanges,
    confirmRemovals,
    batchFailures,
    closeBatchFailures,
  };
};
