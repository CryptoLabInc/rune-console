import Button from "@/components/elements/Button";
import { formatDate } from "@/utils/formatDate";
import { BTN_TEXT } from "@/constants/commonConstants";
import { L } from "@/locales";

const styles = {
  card: "border-border bg-surface rounded-lg border px-4 py-3",
  row: "flex items-center gap-2",
  name: "text-lg flex-1 font-semibold",
  meta: "text-sm text-muted-foreground mt-1.5",
};

interface TeamCardProps {
  name: string;
  parentName: string;
  childrenLabel: string;
  memberCount: number;
  createdAt?: string;
  onRename: () => void;
  onDelete: () => void;
}

/** TeamCard is the selected-team summary card (SC-06 no.6–8): name +
    rename/delete actions and the parent/children/member/created meta line. */
const TeamCard = ({
  name,
  parentName,
  childrenLabel,
  memberCount,
  createdAt,
  onRename,
  onDelete,
}: TeamCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <h3 className={styles.name}>{name}</h3>
        <Button
          btnText={BTN_TEXT.rename}
          btnSize="sm"
          btnColor="grayOutline"
          className="w-fit"
          handleClick={onRename}
        />
        <Button
          btnText={BTN_TEXT.deleteTeam}
          btnSize="sm"
          btnColor="redFilled"
          className="w-fit"
          handleClick={onDelete}
        />
      </div>
      <p className={styles.meta}>
        {L.teams.teamMeta(
          parentName,
          childrenLabel,
          memberCount,
          formatDate(createdAt),
        )}
      </p>
    </div>
  );
};

export default TeamCard;
