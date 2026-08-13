import { useEffect, useMemo, useState } from "react";

import Button from "@/components/elements/Button";
import AddMemberModal from "@/components/teams/AddMemberModal";
import CreateTeamModal from "@/components/teams/CreateTeamModal";
import DeleteTeamModal from "@/components/teams/DeleteTeamModal";
import MemberBatchFailureModal from "@/components/teams/MemberBatchFailureModal";
import RenameTeamModal from "@/components/teams/RenameTeamModal";
import TeamCard from "@/components/teams/TeamCard";
import TeamMembersTable from "@/components/teams/TeamMembersTable";
import TeamMembersToolbar from "@/components/teams/TeamMembersToolbar";
import TeamTree from "@/components/tree/TeamTree";
import MembershipRemoveModal from "@/components/users/MembershipRemoveModal";
import RoleChangeConfirmModal from "@/components/users/RoleChangeConfirmModal";
import {
  useAddTeamMemberMutation,
  useBulkRoleChangeMutation,
  useRemoveTeamMembersMutation,
} from "@/hooks/mutations/useTeamMemberMutations";
import { useTeamMembersQuery } from "@/hooks/queries/useTeamMembersQuery";
import { useTeamQuery } from "@/hooks/queries/useTeamQuery";
import {
  toBatchFailureRows,
  useBatchFailureModal,
} from "@/hooks/useBatchFailureModal";
import { usePageScopedSelection } from "@/hooks/usePageScopedSelection";
import {
  useServerPagination,
  useSyncPaginationTotal,
} from "@/hooks/useServerPagination";
import { useStagedRoleEdits } from "@/hooks/useStagedRoleEdits";
import { useTeamCrud } from "@/hooks/useTeamCrud";
import { parseErrorCode } from "@/api/parseError";
import { useNoticeStore } from "@/state/store/noticeStore";
import {
  ancestorIds,
  buildTeamNodes,
  findTeamNode,
} from "@/utils/teamHierarchy";
import { TEAM_MEMBER_ROLE } from "@/constants/apiConstants";
import {
  BTN_TEXT,
  DEFAULT_PAGE_SIZE,
  TABLE_HEADERS,
} from "@/constants/commonConstants";
import { ADD_MEMBER_REASON } from "@/constants/errorConstants";
import { NOTICE_TEXT } from "@/constants/noticeConstants";
import type { TTeamMemberRole, TTeamTree } from "@/types/teamTypes";
import type { TRoleChange } from "@/types/userTypes";
import { L } from "@/locales";

const styles = {
  body: "flex min-h-[340px] flex-1",
  /* Left tree panel (fixed width per wireframe) */
  side: "border-border flex w-50 flex-none flex-col gap-2.5 border-r p-3",
  /* Right detail area */
  main: "flex min-w-0 flex-1 flex-col gap-5 p-4",
};

type TActiveModal =
  | "create"
  | "rename"
  | "delete"
  | "addMember"
  | "roleConfirm"
  | "removeMembers"
  | null;

/**
 * TreeDetailView is the SC-06 트리·상세 view: team tree panel (left) +
 * selected-team card and member table (right). Rendered by TeamsPage
 * when the view toggle is on 트리·상세. The view composes the shared
 * hooks (selection, pagination, staged role edits, team CRUD, batch
 * failures) and hands rendering to TeamCard/TeamMembersToolbar/
 * TeamMembersTable.
 */
interface TreeDetailViewProps {
  /** Flat GET /teams/tree nodes — owned by TeamsPage. Always non-empty
      when this view renders (TeamsPage handles the loading/error/empty
      states before mounting it). */
  teams: TTeamTree;
  /** Team-tree filter text — owned by TeamsPage (header search input). */
  teamSearch: string;
  /** Selected team id — owned by TeamsPage so the org chart can select
      a team and hand off to this view (SC-05 node click → SC-06). */
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
}

const TreeDetailView = ({
  teams,
  teamSearch,
  selectedTeamId,
  onSelectTeam,
}: TreeDetailViewProps) => {
  /* Derived once per teams array — this component re-renders on every
     keystroke/checkbox/staged edit, and the tree build must not re-run
     for those (OrgChart applies the same rule). */
  const flatById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const teamNodes = useMemo(() => buildTeamNodes(teams), [teams]);
  /* Fallback selection — the first top-level team (SC-06 entry rule). */
  const defaultTeam = teamNodes[0];
  const selectedTeam = findTeamNode(teamNodes, selectedTeamId) ?? defaultTeam;

  const { selectedIds, toggleOne, toggleAll, clearSelection } =
    usePageScopedSelection();
  const { page, totalPages, setPage, resetPage, syncTotal } =
    useServerPagination();
  const {
    pendingRoles,
    baseRole,
    stageRole,
    resetStaged,
    resetAll,
    applyAll,
    reconcileBatch,
  } = useStagedRoleEdits();
  const { batchFailures, showBatchFailures, closeBatchFailures } =
    useBatchFailureModal();
  const showNotice = useNoticeStore((state) => state.showNotice);

  /* Switching teams must not leak the prior team's member-table state:
     without this, `page` can point past the new team's last page (no
     refetch flip since useTeamMembersQuery keeps the previous data
     visible), and stale userId-keyed selections/staged role edits from
     the old team would carry over into the new one. Reset on
     selectedTeam.id change only — NOT on page changes. Depends on the
     RESOLVED id (not the raw selectedTeamId prop) so the reset can
     never diverge from what the queries/mutations below actually
     target (e.g. when the prop doesn't resolve and falls back to
     defaultTeam). */
  useEffect(() => {
    resetPage();
    clearSelection();
    resetAll();
  }, [selectedTeam.id]);

  const { data: detail } = useTeamQuery(selectedTeam.id);
  const membersQuery = useTeamMembersQuery(
    selectedTeam.id,
    page,
    DEFAULT_PAGE_SIZE,
  );
  const members = membersQuery.data?.items ?? [];
  const total = membersQuery.data?.total ?? 0;
  useSyncPaginationTotal(syncTotal, total);

  const addMember = useAddTeamMemberMutation(selectedTeam.id);
  const bulkRole = useBulkRoleChangeMutation(selectedTeam.id);
  const removeMembers = useRemoveTeamMembersMutation(selectedTeam.id);

  /* Selected-team card meta — detail query first, flat tree row as the
     immediate fallback while the detail loads. */
  const flatTeam = flatById.get(selectedTeam.id);
  const parentName = detail?.parentId
    ? (flatById.get(detail.parentId)?.name ?? L.common.none)
    : flatTeam?.parentId
      ? (flatById.get(flatTeam.parentId)?.name ?? L.common.none)
      : L.common.none;
  const childCount = detail?.children.length ?? flatTeam?.childCount ?? 0;
  const childrenLabel = childCount
    ? L.teams.countItems(childCount)
    : L.common.none;
  const memberCount = detail?.memberCount ?? selectedTeam.members;

  /* Modals (SC-07~10 + SC-06 state E). All confirm handlers below call
     their real mutations. */
  const [activeModal, setActiveModal] = useState<TActiveModal>(null);
  const closeModal = () => setActiveModal(null);

  const {
    teamError,
    clearTeamError,
    handleCreate,
    handleRename,
    handleDelete,
  } = useTeamCrud({
    teamId: selectedTeam.id,
    onDone: closeModal,
    onDeleted: () =>
      onSelectTeam(
        teams.find((t) => t.parentId === null && t.id !== selectedTeam.id)
          ?.id ?? "",
      ),
  });
  /* Team CRUD inline error — reset whenever a modal opens or closes so a
     stale error from a prior attempt never leaks into a fresh one. */
  const openTeamModal = (modal: TActiveModal) => {
    clearTeamError();
    setActiveModal(modal);
  };
  const closeTeamModal = () => {
    clearTeamError();
    closeModal();
  };

  const [addError, setAddError] = useState<string | null>(null);
  const handleInvite = (account: string, role: string, username: string) => {
    setAddError(null);
    addMember.mutate(
      { account, role: role as TTeamMemberRole, username },
      {
        onSuccess: () => {
          closeModal();
          showNotice(
            NOTICE_TEXT.addTeamMember.title,
            NOTICE_TEXT.addTeamMember.success,
            "success",
          );
        },
        onError: async (res) => {
          const code = await parseErrorCode(res);
          setAddError(ADD_MEMBER_REASON[code] ?? L.teams.addMemberFailed);
        },
      },
    );
  };

  const accountOf = (userId: string) =>
    members.find((m) => m.userId === userId)?.account ?? userId;

  /* Staged picks as confirm-modal rows (TRoleChange: label = account). */
  const roleChanges: TRoleChange[] = [...pendingRoles.entries()].map(
    ([userId, to]) => {
      const member = members.find((m) => m.userId === userId);
      return {
        label: member?.account ?? userId,
        from: baseRole(userId, member?.role ?? TEAM_MEMBER_ROLE.read),
        to,
      };
    },
  );

  /* The confirm modal owns the E-1/E-2 result view: a resolved promise
     shows the in-modal success message, a rejected one the failure
     message ([닫기] alone remains). Partial failures additionally open
     the batch-failure modal, mirroring the SC-13 drawer flow. */
  const handleRoleConfirm = async () => {
    const updates = [...pendingRoles.entries()].map(([userId, role]) => ({
      userId,
      role,
    }));
    const result = await bulkRole.mutateAsync({ updates });
    if (result.failed.length > 0) {
      reconcileBatch(new Set(result.failed.map((f) => f.id)));
      showBatchFailures(
        toBatchFailureRows(
          result.failed,
          accountOf,
          () => L.common.processFailed,
        ),
      );
    } else {
      applyAll();
    }
  };

  /* The remove modal closes itself on resolve and swaps to its failure
     view on reject — only the full-success notice and the partial-failure
     modal are driven from here. */
  const handleRemoveMembers = async () => {
    const ids = [...selectedIds];
    const result = await removeMembers.mutateAsync(ids);
    clearSelection();
    if (result.failed.length > 0) {
      showBatchFailures(
        toBatchFailureRows(result.failed, accountOf, (code) => code),
      );
    } else {
      showNotice(
        NOTICE_TEXT.removeMembership.title,
        NOTICE_TEXT.removeMembership.success,
        "success",
      );
    }
  };

  /* SC-14 payload: the checked members' account × this team · current
     role (TMembershipRemoveTarget — the SC-06 entry is members × the
     one selected team). */
  const membershipRemovals = members
    .filter((member) => selectedIds.has(member.userId))
    .map((member) => ({
      account: member.account,
      teamId: selectedTeam.id,
      teamName: selectedTeam.name,
      role:
        pendingRoles.get(member.userId) ?? baseRole(member.userId, member.role),
    }));

  return (
    <div className={styles.body}>
      {/* Left panel — create + tree (SC-06 no.3–5); search lives in the
          TeamsPage header */}
      <aside className={styles.side} aria-label={L.teams.teamTree}>
        <Button
          btnText={BTN_TEXT.createGroup}
          btnSize="sm"
          btnColor="mintOutline"
          handleClick={() => openTeamModal("create")}
        />
        <TeamTree
          teams={teamNodes}
          query={teamSearch}
          selectedId={selectedTeam.id}
          onSelect={(node) => onSelectTeam(node.id)}
          defaultExpandedIds={ancestorIds(flatById, selectedTeam.id)}
          className="-mx-1 flex-1"
        />
      </aside>

      {/* Detail area — selected team card + members section (SC-06 no.6–13) */}
      <div className={styles.main}>
        <TeamCard
          name={detail?.name ?? selectedTeam.name}
          parentName={parentName}
          childrenLabel={childrenLabel}
          memberCount={memberCount}
          createdAt={detail?.createdAt}
          onRename={() => openTeamModal("rename")}
          onDelete={() => openTeamModal("delete")}
        />

        <TeamMembersToolbar
          total={total}
          pendingCount={pendingRoles.size}
          selectedCount={selectedIds.size}
          onResetChanges={resetStaged}
          onUpdateChanges={() => setActiveModal("roleConfirm")}
          onRemove={() => setActiveModal("removeMembers")}
          onAddMember={() => setActiveModal("addMember")}
        />

        <TeamMembersTable
          members={members}
          isPending={membersQuery.isPending}
          isError={membersQuery.isError}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          selectedIds={selectedIds}
          onToggleOne={toggleOne}
          onToggleAll={(checked) =>
            toggleAll(
              members.map((m) => m.userId),
              checked,
            )
          }
          isRoleStaged={(userId) => pendingRoles.has(userId)}
          roleOf={(member) =>
            pendingRoles.get(member.userId) ??
            baseRole(member.userId, member.role)
          }
          onRoleChange={(member, next) =>
            stageRole(member.userId, member.role, next)
          }
        />
      </div>

      {/* Modals — mounted on demand so each opens with fresh state */}
      {activeModal === "create" && (
        <CreateTeamModal
          teams={teams}
          error={teamError}
          onClose={closeTeamModal}
          onCreate={handleCreate}
        />
      )}
      {activeModal === "rename" && (
        <RenameTeamModal
          currentName={selectedTeam.name}
          currentParentId={flatTeam?.parentId ?? null}
          teams={teams}
          error={teamError}
          onClose={closeTeamModal}
          onRename={handleRename}
        />
      )}
      {activeModal === "delete" && (
        <DeleteTeamModal
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          hasChildren={(flatTeam?.childCount ?? 0) > 0}
          teams={teams}
          error={teamError}
          onClose={closeTeamModal}
          onDelete={handleDelete}
        />
      )}
      {activeModal === "addMember" && (
        <AddMemberModal
          teamName={selectedTeam.name}
          error={addError}
          onClose={() => {
            setAddError(null);
            closeModal();
          }}
          onInvite={handleInvite}
        />
      )}
      {activeModal === "roleConfirm" && (
        <RoleChangeConfirmModal
          subjectLabel={TABLE_HEADERS.account}
          changes={roleChanges}
          onClose={closeModal}
          onConfirm={handleRoleConfirm}
        />
      )}
      {activeModal === "removeMembers" && (
        <MembershipRemoveModal
          targets={membershipRemovals}
          subteamNotice
          onClose={closeModal}
          onConfirm={handleRemoveMembers}
        />
      )}
      {batchFailures && (
        <MemberBatchFailureModal
          failures={batchFailures}
          onClose={closeBatchFailures}
        />
      )}
    </div>
  );
};

export default TreeDetailView;
