import Checkbox from "@/components/elements/Checkbox";
import MemberStatus from "@/components/elements/MemberStatus";
import TableCell from "@/components/table/TableCell";
import TableRow from "@/components/table/TableRow";
import { CHIP_STATUS } from "@/constants/userConstants";
import type { TUserListItem } from "@/types/userTypes";
import { L } from "@/locales";

const styles = {
  /* Wide enough for typical names at the 40% column; anything longer
     (up to the 50-char username cap) truncates with an ellipsis and
     keeps the full name in the title tooltip. */
  usernameCell: "max-w-[400px] truncate",
  overflowChip:
    "border-border text-faint ml-1.5 rounded-full border px-2 text-xs",
};

/** First membership as "team · role"; the rest collapse into "+n". */
const membershipSummary = (user: TUserListItem) => {
  const [first, ...rest] = user.memberships;
  return first
    ? { summary: `${first.teamName} · ${first.role}`, extra: rest.length }
    : { summary: "—", extra: 0 };
};

interface UserRowProps {
  user: TUserListItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onOpen: () => void;
}

/** UserRow is one SC-11 list row: checkbox, name, session chip, and the
    "first team · role +n" membership summary. Row click opens the drawer. */
const UserRow = ({ user, selected, onSelect, onOpen }: UserRowProps) => {
  const { summary, extra } = membershipSummary(user);
  return (
    <TableRow key={user.userId} selected={selected} onClick={onOpen}>
      {/* Checkbox clicks must not open the drawer (SC-11 no.8) */}
      <TableCell className="w-8 pr-1">
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onChange={onSelect}
            ariaLabel={L.common.selectName(user.account)}
          />
        </div>
      </TableCell>
      <TableCell className={styles.usernameCell}>
        <span title={user.username}>{user.username}</span>
      </TableCell>
      <TableCell>
        <MemberStatus status={CHIP_STATUS[user.sessionStatus]} />
      </TableCell>
      <TableCell>
        {summary}
        {extra > 0 && (
          <span
            className={styles.overflowChip}
            title={user.memberships
              .map((m) => `${m.teamName} · ${m.role}`)
              .join(", ")}
          >
            +{extra}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
};

export default UserRow;
