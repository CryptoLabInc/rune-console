import Checkbox from "@/components/elements/Checkbox";
import Dropdown from "@/components/elements/Dropdown";
import MemberStatus from "@/components/elements/MemberStatus";
import Pagination from "@/components/elements/Pagination";
import Table from "@/components/table/Table";
import TableCell from "@/components/table/TableCell";
import TableEmptyRow from "@/components/table/TableEmptyRow";
import TableErrorRow from "@/components/table/TableErrorRow";
import TableFoot from "@/components/table/TableFoot";
import TableHead from "@/components/table/TableHead";
import TableHeaderCell from "@/components/table/TableHeaderCell";
import TableLoadingRow from "@/components/table/TableLoadingRow";
import TableRow from "@/components/table/TableRow";
import { formatDate } from "@/utils/formatDate";
import {
  ARIA_LABELS,
  DEFAULT_PAGE_SIZE,
  TABLE_HEADERS,
} from "@/constants/commonConstants";
import { ROLE_OPTIONS } from "@/constants/teamConstants";
import { CHIP_STATUS } from "@/constants/userConstants";
import type { TTeamMember } from "@/types/teamTypes";

const styles = {
  /* The detail panel is narrower than the users page — typical names
     fit the 36% column; longer ones truncate with an ellipsis and
     keep the full name in the title tooltip. */
  usernameCell: "max-w-[280px] truncate cursor-default",
  timeCell: "text-faint font-mono text-xs whitespace-nowrap",
};

interface TeamMembersTableProps {
  members: TTeamMember[];
  isPending: boolean;
  isError: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedIds: Set<string>;
  onToggleOne: (userId: string, checked: boolean) => void;
  /** Header select-all over the current page's rows. */
  onToggleAll: (checked: boolean) => void;
  /** Row is highlighted while its role pick is staged (unapplied). */
  isRoleStaged: (userId: string) => boolean;
  /** Displayed role — the staged pick or the committed baseline. */
  roleOf: (member: TTeamMember) => string;
  onRoleChange: (member: TTeamMember, nextRole: string) => void;
}

/**
 * TeamMembersTable is the SC-06 member table (no.11–13): page-scoped
 * checkbox selection, per-row staged role dropdowns, and the fixed
 * 10-per-page pagination. Pure view — staging/selection state lives in
 * the parent's hooks.
 */
const TeamMembersTable = ({
  members,
  isPending,
  isError,
  total,
  page,
  totalPages,
  onPageChange,
  selectedIds,
  onToggleOne,
  onToggleAll,
  isRoleStaged,
  roleOf,
  onRoleChange,
}: TeamMembersTableProps) => {
  const allSelected =
    members.length > 0 && members.every((m) => selectedIds.has(m.userId));

  return (
    <Table
      fluid
      scrollClassName="min-h-[526px]"
      foot={
        <TableFoot
          info={`총 ${total}명 · ${DEFAULT_PAGE_SIZE}명/페이지`}
          className="flex-row items-center"
        >
          <div className="flex flex-col items-end gap-3">
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={onPageChange}
            />
          </div>
        </TableFoot>
      }
    >
      <TableHead>
        <TableHeaderCell className="w-8 pr-1">
          <Checkbox
            checked={allSelected}
            onChange={onToggleAll}
            ariaLabel={ARIA_LABELS.selectAll}
          />
        </TableHeaderCell>
        {/* Fixed column widths — auto layout would resize per
            page's content and shift the headers while paginating. */}
        <TableHeaderCell className="w-[36%]">
          {TABLE_HEADERS.memberName}
        </TableHeaderCell>
        <TableHeaderCell className="w-[18%]">
          {TABLE_HEADERS.memberStatus}
        </TableHeaderCell>
        <TableHeaderCell className="w-[28%]">
          {TABLE_HEADERS.roleAlt}
        </TableHeaderCell>
        <TableHeaderCell className="w-[18%]">
          {TABLE_HEADERS.joinedAt}
        </TableHeaderCell>
      </TableHead>
      <tbody>
        {isPending ? (
          <TableLoadingRow colSpan={5} />
        ) : isError ? (
          <TableErrorRow
            message="멤버 목록을 불러올 수 없습니다."
            colSpan={5}
          />
        ) : total === 0 ? (
          <TableEmptyRow colSpan={5}>멤버가 없습니다.</TableEmptyRow>
        ) : (
          members.map((member) => (
            <TableRow
              key={member.userId}
              selected={selectedIds.has(member.userId)}
              changed={isRoleStaged(member.userId)}
            >
              <TableCell className="w-8 pr-1">
                <Checkbox
                  checked={selectedIds.has(member.userId)}
                  onChange={(checked) => onToggleOne(member.userId, checked)}
                  ariaLabel={`${member.account} 선택`}
                />
              </TableCell>
              <TableCell className={styles.usernameCell}>
                <span title={member.username}>{member.username}</span>
              </TableCell>
              <TableCell>
                <MemberStatus status={CHIP_STATUS[member.sessionStatus]} />
              </TableCell>
              <TableCell>
                <Dropdown
                  options={ROLE_OPTIONS}
                  value={roleOf(member)}
                  onChange={(next) => onRoleChange(member, next)}
                  size="sm"
                  changed={isRoleStaged(member.userId)}
                  ariaLabel={`${member.account} role`}
                  className="w-24"
                />
              </TableCell>
              <TableCell className={styles.timeCell}>
                {formatDate(member.joinedAt)}
              </TableCell>
            </TableRow>
          ))
        )}
      </tbody>
    </Table>
  );
};

export default TeamMembersTable;
