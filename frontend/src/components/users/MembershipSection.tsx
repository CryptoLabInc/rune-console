import Button from "@/components/elements/Button";
import Checkbox from "@/components/elements/Checkbox";
import Dropdown from "@/components/elements/Dropdown";
import Table from "@/components/table/Table";
import TableCell from "@/components/table/TableCell";
import TableHead from "@/components/table/TableHead";
import TableHeaderCell from "@/components/table/TableHeaderCell";
import TableRow from "@/components/table/TableRow";
import MembershipRow from "@/components/users/MembershipRow";
import type { TMembershipDraft } from "@/hooks/useMembershipDrafts";
import {
  ARIA_LABELS,
  BTN_TEXT,
  PLACEHOLDERS,
  TABLE_HEADERS,
} from "@/constants/commonConstants";
import { ROLE_OPTIONS } from "@/constants/teamConstants";
import type { TDropdownOption } from "@/types/commonTypes";

const styles = {
  sectionHead: "flex items-center gap-2",
  selectedCount: "text-accent-blue text-tag font-mono",
  /* Action bar below the table: 변경사항 업데이트 · 제거하기 · 팀 추가하기. */
  bulkRow: "pt-2 flex justify-end gap-2",
  /* Team+role picker row opened by [팀 추가하기]. */
  addRow:
    "bg-muted-foreground/[2%] mb-2 flex items-center gap-2 rounded-md border p-2",
};

interface MembershipSectionProps {
  memberships: TMembershipDraft[];
  changesCount: number;
  selectedCount: number;
  allChecked: boolean;
  onCheck: (teamId: string, checked: boolean) => void;
  onCheckAll: (teamIds: string[], checked: boolean) => void;
  onRoleChange: (teamId: string, role: string) => void;
  onResetChanges: () => void;
  onOpenRoleConfirm: () => void;
  onOpenRemove: () => void;
  /* [팀 추가하기] picker row (SC-13 no.2). */
  addOpen: boolean;
  addTeamId: string;
  addRole: string;
  adding: boolean;
  addableTeams: TDropdownOption[];
  onAddTeamIdChange: (teamId: string) => void;
  onAddRoleChange: (role: string) => void;
  onToggleAddRow: () => void;
  onAdd: () => void;
}

/**
 * MembershipSection is the 소속 팀 block of the member drawer (SC-13):
 * the staged-edit membership table, the action bar, and the add-team
 * picker row. Pure view — all state lives in useMembershipDrafts.
 */
const MembershipSection = ({
  memberships,
  changesCount,
  selectedCount,
  allChecked,
  onCheck,
  onCheckAll,
  onRoleChange,
  onResetChanges,
  onOpenRoleConfirm,
  onOpenRemove,
  addOpen,
  addTeamId,
  addRole,
  adding,
  addableTeams,
  onAddTeamIdChange,
  onAddRoleChange,
  onToggleAddRow,
  onAdd,
}: MembershipSectionProps) => {
  return (
    <section className="flex flex-col gap-4">
      <div className={styles.sectionHead}>
        <b className="text-md">소속 팀 ({memberships.length})</b>
        {selectedCount > 0 && (
          <span className={styles.selectedCount}>{selectedCount} selected</span>
        )}
      </div>

      <Table fluid>
        <TableHead>
          <TableHeaderCell className="w-8 pr-1">
            <Checkbox
              checked={allChecked}
              onChange={(checked) =>
                onCheckAll(
                  memberships.map((m) => m.teamId),
                  checked,
                )
              }
              ariaLabel={ARIA_LABELS.selectAll}
            />
          </TableHeaderCell>
          <TableHeaderCell>{TABLE_HEADERS.team}</TableHeaderCell>
          <TableHeaderCell className="w-26">
            {TABLE_HEADERS.role}
          </TableHeaderCell>
        </TableHead>
        <tbody>
          {memberships.length === 0 ? (
            /* No group-role membership — a single placeholder row keeps
               the table shape; the team/role cells read "—". */
            <TableRow>
              <TableCell className="w-8 pr-1" />
              <TableCell className="text-faint">—</TableCell>
              <TableCell className="text-faint">—</TableCell>
            </TableRow>
          ) : (
            memberships.map((m) => (
              <MembershipRow
                key={m.teamId}
                name={m.teamName}
                role={m.role}
                roleOptions={ROLE_OPTIONS}
                checked={m.checked}
                changed={m.role !== m.baseRole}
                onCheck={(checked) => onCheck(m.teamId, checked)}
                onRoleChange={(role) => onRoleChange(m.teamId, role)}
              />
            ))
          )}
        </tbody>
      </Table>

      {/* Action bar: 변경사항 초기화 · 변경사항 업데이트 · 제거하기 ·
          팀 추가하기 (SC-13). */}
      <div className={styles.bulkRow}>
        {/* Drops every staged (not yet applied) role pick back to its
            saved value — checkboxes and committed roles stay. */}
        <Button
          btnText={BTN_TEXT.resetChanges}
          btnSize="sm"
          btnColor="grayOutline"
          className="w-fit"
          disabled={changesCount === 0}
          handleClick={onResetChanges}
        />
        <Button
          btnText={BTN_TEXT.updateChanges}
          btnSize="sm"
          btnColor="mintFilled"
          className="w-fit"
          disabled={changesCount === 0}
          handleClick={onOpenRoleConfirm}
        />
        <Button
          btnText={BTN_TEXT.remove}
          btnSize="sm"
          btnColor="redFilled"
          className="w-fit"
          disabled={selectedCount === 0}
          handleClick={onOpenRemove}
        />
        <Button
          btnText={BTN_TEXT.addTeam}
          btnSize="sm"
          btnColor="mintFilled"
          className="w-fit"
          handleClick={onToggleAddRow}
        />
      </div>

      {/* Team+role picker (SC-13 no.2) — opens just above the action
          bar via [팀 추가하기]; teams already joined are excluded. */}
      {addOpen && (
        <div className={`${styles.addRow} mt-3 mb-0`}>
          <Dropdown
            options={addableTeams}
            placeholder={
              addableTeams.length === 0
                ? PLACEHOLDERS.noAddableTeam
                : PLACEHOLDERS.selectTeam
            }
            value={addTeamId}
            onChange={onAddTeamIdChange}
            size="sm"
            ariaLabel="추가할 팀"
            className="flex-1"
            disabled={addableTeams.length === 0}
          />
          <Dropdown
            options={ROLE_OPTIONS}
            placeholder={PLACEHOLDERS.selectRole}
            value={addRole}
            onChange={onAddRoleChange}
            size="sm"
            ariaLabel="추가할 role"
            className="w-24"
            /* No team left to join (all already joined) → the role
               picker has nothing to apply to, so disable it too. */
            disabled={addableTeams.length === 0}
          />
          <Button
            btnText={BTN_TEXT.add}
            btnSize="sm"
            btnColor="mintFilled"
            className="w-fit"
            disabled={addTeamId === "" || addRole === "" || adding}
            handleClick={onAdd}
          />
        </div>
      )}
    </section>
  );
};

export default MembershipSection;
