import Button from "@/components/elements/Button";
import { BTN_TEXT } from "@/constants/commonConstants";

const styles = {
  row: "flex items-center gap-2",
  title: "text-md flex-1 font-semibold",
  actions: "flex flex-wrap items-center gap-2",
};

interface TeamMembersToolbarProps {
  total: number;
  /** Staged (not yet applied) role picks — arms 초기화/업데이트. */
  pendingCount: number;
  /** Checked rows — arms 제거하기. */
  selectedCount: number;
  onResetChanges: () => void;
  onUpdateChanges: () => void;
  onRemove: () => void;
  onAddMember: () => void;
}

/** TeamMembersToolbar is the 멤버 section header (SC-06 no.9–10): count +
    the staged-change / removal / add actions. */
const TeamMembersToolbar = ({
  total,
  pendingCount,
  selectedCount,
  onResetChanges,
  onUpdateChanges,
  onRemove,
  onAddMember,
}: TeamMembersToolbarProps) => {
  return (
    <div className={styles.row}>
      <h3 className={styles.title}>멤버 ({total})</h3>{" "}
      <div className={styles.actions}>
        {/* Drops every staged (not yet applied) dropdown pick back to
            its saved role — the committed savedRoles baseline stays. */}
        <Button
          btnText={BTN_TEXT.resetChanges}
          btnSize="sm"
          btnColor="grayOutline"
          className="w-fit"
          disabled={pendingCount === 0}
          handleClick={onResetChanges}
        />
        <Button
          btnText={BTN_TEXT.updateChanges}
          btnSize="sm"
          btnColor="mintOutline"
          className="w-fit"
          disabled={pendingCount === 0}
          handleClick={onUpdateChanges}
        />
        <Button
          btnText={BTN_TEXT.remove}
          btnSize="sm"
          btnColor="redFilled"
          className="w-fit"
          disabled={selectedCount === 0}
          handleClick={onRemove}
        />
        <Button
          btnText={BTN_TEXT.addMember}
          btnSize="sm"
          btnColor="mintFilled"
          className="w-fit"
          handleClick={onAddMember}
        />
      </div>
    </div>
  );
};

export default TeamMembersToolbar;
