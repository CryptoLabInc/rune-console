import Button from "@/components/elements/Button";
import Dropdown from "@/components/elements/Dropdown";
import SearchInput from "@/components/elements/SearchInput";
import { ARIA_LABELS, BTN_TEXT } from "@/constants/commonConstants";
import type { TDropdownOption } from "@/types/commonTypes";
import { L } from "@/locales";

interface UsersToolbarProps {
  search: string;
  sort: string;
  statusFilter: string;
  groupFilter: string;
  sortOptions: TDropdownOption[];
  statusOptions: TDropdownOption[];
  groupOptions: TDropdownOption[];
  /** Setters arrive page-reset-wrapped from the page (stale page = wrong
      slice, and carried-over checks would mislead bulk actions). */
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  selectedCount: number;
  onResend: () => void;
  onOpenBulkDelete: () => void;
  onOpenInvite: () => void;
}

/** UsersToolbar is the SC-11 header strip (no.2–6): name search, the
    sort/status/team dropdowns, and the bulk actions. Pure view. */
const UsersToolbar = ({
  search,
  sort,
  statusFilter,
  groupFilter,
  sortOptions,
  statusOptions,
  groupOptions,
  onSearchChange,
  onSortChange,
  onStatusChange,
  onGroupChange,
  selectedCount,
  onResend,
  onOpenBulkDelete,
  onOpenInvite,
}: UsersToolbarProps) => {
  return (
    <div className="px-4 py-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col flex-wrap gap-5">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={L.members.searchByName}
            maxLength={100}
            className="w-50"
          />
          {/* filter/order dropdown */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-md text-faint">{L.common.sortBy}</span>
              <Dropdown
                options={sortOptions}
                value={sort}
                onChange={onSortChange}
                size="sm"
                ariaLabel={ARIA_LABELS.sort}
                className="w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-md text-faint">
                {L.common.memberStatus}
              </span>
              <Dropdown
                options={statusOptions}
                value={statusFilter}
                onChange={onStatusChange}
                size="sm"
                ariaLabel={L.members.statusFilterAria}
                className="w-32"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-md text-faint">{L.common.team}</span>
              <Dropdown
                options={groupOptions}
                value={groupFilter}
                onChange={onGroupChange}
                size="sm"
                ariaLabel={L.members.teamFilterAria}
                className="w-40"
              />
            </div>
          </div>
        </div>

        {/* Actions — second row, left-aligned (SC-11 no.4–6) */}
        <div className="flex items-center gap-2 self-end">
          <Button
            btnText={BTN_TEXT.resendInvitationCode}
            btnSize="sm"
            btnColor="mintFilled"
            className="w-fit"
            disabled={selectedCount === 0}
            handleClick={onResend}
          />
          <Button
            btnText={BTN_TEXT.delete}
            btnSize="sm"
            btnColor="redOutline"
            className="w-fit"
            disabled={selectedCount === 0}
            handleClick={onOpenBulkDelete}
          />
          <Button
            btnText={BTN_TEXT.inviteMember}
            btnSize="sm"
            btnColor="mintOutline"
            className="w-fit"
            handleClick={onOpenInvite}
          />
        </div>
      </div>
    </div>
  );
};

export default UsersToolbar;
