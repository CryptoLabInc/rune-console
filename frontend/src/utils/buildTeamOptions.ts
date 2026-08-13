import { localizeTeamName } from "@/utils/teamHierarchy";
import type { TDropdownOption } from "@/types/commonTypes";
import type { TTeamTree } from "@/types/teamTypes";

/** All teams in tree order with depth indent (for team-picker dropdowns).
    Pure function over the real `teams` query result — used by the team
    CRUD modals (create/rename/delete) and the Users page pickers. */
export const buildTeamOptions = (teams: TTeamTree): TDropdownOption[] => {
  const walk = (parentId: string | null, depth: number): TDropdownOption[] =>
    teams
      .filter((t) => t.parentId === parentId)
      .flatMap((t) => [
        { value: t.id, label: localizeTeamName(t.name), depth },
        ...walk(t.id, depth + 1),
      ]);
  return walk(null, 0);
};
