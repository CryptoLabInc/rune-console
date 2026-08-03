import { useState } from "react";

import Button from "@/components/elements/Button";
import Checkbox from "@/components/elements/Checkbox";
import Feedback from "@/components/elements/Feedback";
import Pagination from "@/components/elements/Pagination";
import Table from "@/components/table/Table";
import TableEmptyRow from "@/components/table/TableEmptyRow";
import TableFoot from "@/components/table/TableFoot";
import TableHead from "@/components/table/TableHead";
import TableHeaderCell from "@/components/table/TableHeaderCell";
import TableLoadingRow from "@/components/table/TableLoadingRow";
import MemberBatchFailureModal from "@/components/teams/MemberBatchFailureModal";
import InviteMemberModal from "@/components/users/InviteMemberModal";
import MemberDeleteModal from "@/components/users/MemberDeleteModal";
import MemberDetailDrawer from "@/components/users/MemberDetailDrawer";
import UserRow from "@/components/users/UserRow";
import UsersToolbar from "@/components/users/UsersToolbar";
import { useCancelInvitation } from "@/hooks/mutations/useInvitationMutations";
import {
  useAddUserMembership,
  useBulkUserRoleChange,
  useDeactivateUserSession,
  useRemoveUserMemberships,
} from "@/hooks/mutations/useUserMembershipMutations";
import { useTeamsTreeQuery } from "@/hooks/queries/useTeamsTreeQuery";
import { useUserQuery } from "@/hooks/queries/useUserQuery";
import { useUsersQuery } from "@/hooks/queries/useUsersQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePageScopedSelection } from "@/hooks/usePageScopedSelection";
import {
  useServerPagination,
  useSyncPaginationTotal,
} from "@/hooks/useServerPagination";
import { useUserBatchActions } from "@/hooks/useUserBatchActions";
import { buildTeamOptions } from "@/utils/buildTeamOptions";
import { SESSION_STATUS } from "@/constants/apiConstants";
import {
  ARIA_LABELS,
  BTN_TEXT,
  DEFAULT_PAGE_SIZE,
  FEEDBACK_TEXT,
  PAGE_TITLES,
  TABLE_HEADERS,
} from "@/constants/commonConstants";
import type { TDropdownOption } from "@/types/commonTypes";
import type { TTeamMemberRole, TTeamTree } from "@/types/teamTypes";

const styles = {
  page: "flex flex-col gap-3.5 p-4",
};

/* Filter/sort option sets (SC-11 no.2–3). "all" stands in for 전체. The list
   shows only the session axis, so the filter matches it. */
const STATUS_OPTIONS: TDropdownOption[] = [
  { value: "all", label: "전체" },
  { value: SESSION_STATUS.online, label: "온라인" },
  { value: SESSION_STATUS.offline, label: "오프라인" },
];

/* Depth indent stripped — the 150px filter trigger can't fit deep-tree
   indentation (it forces horizontal scrolling in the menu); teams list
   flush left in tree order and long names truncate with an ellipsis. */
const buildGroupOptions = (teams: TTeamTree): TDropdownOption[] => [
  { value: "all", label: "전체" },
  ...buildTeamOptions(teams).map(({ value, label }) => ({ value, label })),
];

const SORT_OPTIONS: TDropdownOption[] = [
  { value: "last_invited", label: "최근 초대 코드 발송" },
  { value: "username", label: TABLE_HEADERS.memberName },
];

/**
 * UsersPage is the user management screen (SC-11): cross-team user
 * list with search/filters/sort, bulk actions, and pagination, plus
 * the invite modal (SC-12), member detail drawer (SC-13), and delete
 * confirm (SC-15). The list is driven by GET /users (useUsersQuery) —
 * search/status/team/sort/page all become query params, and the
 * server returns the already filtered/sorted/paged rows. Bulk flows
 * (invite/resend/delete) live in useUserBatchActions; the drawer's
 * membership machine lives in useMembershipDrafts.
 */
const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [sort, setSort] = useState("last_invited");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const { selectedIds, toggleOne, toggleAll, clearSelection, setSelectedIds } =
    usePageScopedSelection();
  const { page, totalPages, setPage, resetPage, syncTotal } =
    useServerPagination();

  const { data: teams } = useTeamsTreeQuery();
  const detailQuery = useUserQuery(drawerUserId ?? "");
  const bulkRole = useBulkUserRoleChange(drawerUserId ?? "");
  const removeMemberships = useRemoveUserMemberships(drawerUserId ?? "");
  const addMembership = useAddUserMembership(drawerUserId ?? "");
  const deactivateSession = useDeactivateUserSession(drawerUserId ?? "");
  const cancel = useCancelInvitation();
  const groupOptions = buildGroupOptions(teams ?? []);

  const {
    inviteMember,
    resendCode,
    resendCodes,
    deleteMembers,
    batchFailures,
    closeBatchFailures,
  } = useUserBatchActions({
    setSelectedIds,
    onDeleted: (deletedIds) => {
      if (drawerUserId && deletedIds.includes(drawerUserId)) {
        setDrawerUserId(null);
      }
    },
  });

  const debouncedSearch = useDebouncedValue(search, 300);
  const usersQuery = useUsersQuery({
    search: debouncedSearch.trim(),
    status: statusFilter,
    teamId: groupFilter,
    sort,
    page,
    size: DEFAULT_PAGE_SIZE,
  });
  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  useSyncPaginationTotal(syncTotal, total);

  /* A search/filter is active whenever it would narrow the server-side
     result — distinguishes "no members at all" (state B) from "no
     rows match this filter" (in-table empty row). */
  const hasActiveFilter =
    debouncedSearch.trim() !== "" ||
    statusFilter !== "all" ||
    groupFilter !== "all";

  const drawerUser = users.find((u) => u.userId === drawerUserId) ?? null;
  const selectedUsers = users.filter((u) => selectedIds.has(u.userId));

  /* Changing what's listed rejumps to page 1 (stale page = wrong slice)
     and clears the selection — the checked rows may drop out of the new
     result, so carrying them into a bulk action would be misleading. */
  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      resetPage();
      clearSelection();
    };
  /* Moving to another page clears the selection too — checks are
     page-scoped, and a checked row on the old page shouldn't ride along
     into a bulk action taken on a different page. */
  const goToPage = (next: number) => {
    setPage(next);
    clearSelection();
  };

  /* Select-all is page-scoped. */
  const allSelected =
    users.length > 0 && users.every((u) => selectedIds.has(u.userId));

  /* ── SC-11 state C — 조회 실패 ──────────────────────────────────── */
  if (usersQuery.isError) {
    return (
      <section className={styles.page} aria-label={PAGE_TITLES.users}>
        <Feedback
          state="error"
          title="멤버 정보를 불러올 수 없습니다."
          description={FEEDBACK_TEXT.refreshRetry}
          action={
            <Button
              btnText={BTN_TEXT.refresh}
              btnSize="sm"
              btnColor="grayOutline"
              className="w-fit"
              handleClick={() => window.location.reload()}
            />
          }
        />
      </section>
    );
  }

  /* ── SC-11 state B — 유저 0명, 검색/필터 없는 상태 (search/filters/table
     all hidden) ─── */
  if (!usersQuery.isPending && total === 0 && !hasActiveFilter) {
    return (
      <section className={styles.page} aria-label={PAGE_TITLES.users}>
        <Feedback
          state="empty"
          title="아직 초대한 멤버가 없습니다"
          description="멤버를 초대하면 초대 코드가 이메일로 발송됩니다"
          action={
            <Button
              btnText={BTN_TEXT.inviteMember}
              btnSize="sm"
              btnColor="mintFilled"
              className="w-fit"
              handleClick={() => setInviteOpen(true)}
            />
          }
        />
        {inviteOpen && (
          <InviteMemberModal
            onSubmit={inviteMember}
            onClose={() => setInviteOpen(false)}
            teams={teams ?? []}
          />
        )}
      </section>
    );
  }

  return (
    <section className={styles.page} aria-label={PAGE_TITLES.users}>
      <Table
        fluid
        /* Fixed page height: thead 36px + 10 rows × 49px (h-8 status chip
        + py-2). Short pages, empty, and loading all keep this height so
        pagination never shifts the layout. */
        scrollClassName="min-h-[526px]"
        toolbar={
          <UsersToolbar
            search={search}
            sort={sort}
            statusFilter={statusFilter}
            groupFilter={groupFilter}
            sortOptions={SORT_OPTIONS}
            statusOptions={STATUS_OPTIONS}
            groupOptions={groupOptions}
            onSearchChange={withPageReset(setSearch)}
            onSortChange={withPageReset(setSort)}
            onStatusChange={withPageReset(setStatusFilter)}
            onGroupChange={withPageReset(setGroupFilter)}
            selectedCount={selectedIds.size}
            onResend={() => resendCodes(selectedUsers)}
            onOpenBulkDelete={() => setBulkDeleteOpen(true)}
            onOpenInvite={() => setInviteOpen(true)}
          />
        }
        foot={
          <TableFoot
            info={`총 ${total}명 · ${DEFAULT_PAGE_SIZE}명/페이지`}
            className="flex-row"
          >
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={goToPage}
            />
          </TableFoot>
        }
      >
        <TableHead>
          <TableHeaderCell className="w-8 pr-1">
            <Checkbox
              checked={allSelected}
              onChange={(checked) =>
                toggleAll(
                  users.map((u) => u.userId),
                  checked,
                )
              }
              ariaLabel={ARIA_LABELS.selectAll}
            />
          </TableHeaderCell>
          {/* Fixed column widths — auto layout would resize per page's
              content and shift the headers while paginating. */}
          <TableHeaderCell className="w-[40%]">
            {TABLE_HEADERS.memberName}
          </TableHeaderCell>
          <TableHeaderCell className="w-[20%]">
            {TABLE_HEADERS.memberStatus}
          </TableHeaderCell>
          <TableHeaderCell className="w-[40%]">
            {TABLE_HEADERS.teamWithRole}
          </TableHeaderCell>
        </TableHead>
        <tbody>
          {usersQuery.isPending && <TableLoadingRow colSpan={4} />}
          {!usersQuery.isPending && users.length === 0 && (
            <TableEmptyRow colSpan={4}>검색 결과가 없습니다.</TableEmptyRow>
          )}
          {users.map((user) => (
            <UserRow
              key={user.userId}
              user={user}
              selected={selectedIds.has(user.userId)}
              onSelect={(checked) => toggleOne(user.userId, checked)}
              onOpen={() => setDrawerUserId(user.userId)}
            />
          ))}
        </tbody>
      </Table>

      {inviteOpen && (
        <InviteMemberModal
          onSubmit={inviteMember}
          onClose={() => setInviteOpen(false)}
          teams={teams ?? []}
        />
      )}

      {drawerUser && (
        <MemberDetailDrawer
          key={drawerUser.userId}
          user={detailQuery.data ?? drawerUser}
          onClose={() => setDrawerUserId(null)}
          onUpdateRoles={(changes) =>
            bulkRole.mutateAsync({
              updates: changes.map((c) => ({
                teamId: c.teamId,
                role: c.role as TTeamMemberRole,
              })),
            })
          }
          onRemoveMemberships={(teamIds) =>
            removeMemberships.mutateAsync(teamIds)
          }
          onAddMembership={async (teamId, role) => {
            await addMembership.mutateAsync({
              teamId,
              role: role as TTeamMemberRole,
            });
          }}
          onDeactivateSession={async () => {
            await deactivateSession.mutateAsync();
          }}
          onResendCode={async () => {
            await resendCode(drawerUser.userId);
          }}
          onCancelInvitation={async () => {
            await cancel.mutateAsync(drawerUser.userId);
          }}
          onDeleteMember={() => deleteMembers([drawerUser])}
          teams={teams ?? []}
        />
      )}

      {bulkDeleteOpen && (
        <MemberDeleteModal
          targets={selectedUsers.map((user) => ({
            account: user.account,
            memberships: user.memberships.map((m) => ({
              teamName: m.teamName,
              role: m.role,
            })),
          }))}
          onConfirm={() => deleteMembers(selectedUsers)}
          onClose={() => setBulkDeleteOpen(false)}
        />
      )}

      {batchFailures && (
        <MemberBatchFailureModal
          failures={batchFailures}
          onClose={closeBatchFailures}
        />
      )}
    </section>
  );
};

export default UsersPage;
