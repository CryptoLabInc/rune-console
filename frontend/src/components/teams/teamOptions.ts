import type { TDropdownOption } from "@/types/commonTypes";
import type { TTeamTree } from "@/types/teamTypes";

/** Team name rule: digits, Hangul, Latin letters, and - _ only. */
export const TEAM_NAME_PATTERN = /^[0-9A-Za-z가-힣_-]+$/;

/* The rule hint text (L.teams.teamNameRule) is read inline at each call site
   so it re-resolves on a live language switch — a module const would freeze
   it at import time. */

/** Grantable member roles (Admin is console-account only — API §0). */
export const ROLE_OPTIONS: TDropdownOption[] = [
  { value: "edit", label: "edit" },
  { value: "write", label: "write" },
  { value: "read", label: "read" },
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
