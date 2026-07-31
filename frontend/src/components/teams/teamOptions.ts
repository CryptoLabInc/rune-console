import { TEAM_MEMBER_ROLE } from "@/constants/apiConstants";
import type { TDropdownOption } from "@/types/commonTypes";
import type { TTeamTree } from "@/types/teamTypes";

/** Team name rule: digits, Hangul, Latin letters, and - _ only. */
export const TEAM_NAME_PATTERN = /^[0-9A-Za-z가-힣_-]+$/;

export const TEAM_NAME_RULE_TEXT =
  "숫자·한글·영어와 - _ 만 사용할 수 있습니다.";

/** Grantable member roles (Admin is console-account only — API §0). */
export const ROLE_OPTIONS: TDropdownOption[] = [
  { value: TEAM_MEMBER_ROLE.edit, label: TEAM_MEMBER_ROLE.edit },
  { value: TEAM_MEMBER_ROLE.write, label: TEAM_MEMBER_ROLE.write },
  { value: TEAM_MEMBER_ROLE.read, label: TEAM_MEMBER_ROLE.read },
];

/** All teams in tree order with depth indent (for team-picker dropdowns).
    Pure function over the real `teams` query result — used by the team
    CRUD modals (create/rename/delete) and the Users page pickers. */
export const buildTeamOptions = (teams: TTeamTree): TDropdownOption[] => {
  const walk = (parentId: string | null, depth: number): TDropdownOption[] =>
    teams
      .filter((t) => t.parentId === parentId)
      .flatMap((t) => [
        { value: t.id, label: t.name, depth },
        ...walk(t.id, depth + 1),
      ]);
  return walk(null, 0);
};
