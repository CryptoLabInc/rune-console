import type { TTeamTree, TTeamViewNode } from "@/types/teamTypes";
import { L } from "@/locales";

/**
 * Team-tree lookups over a flat `TTeamTree` — shared by the invite preview
 * (SC-12 no.3) and the membership-removal sub-team notice (SC-14 no.2).
 * Pure functions over the tree passed in (from `useTeamsTreeQuery`); trees
 * are small, so no memoized id-map is kept at module scope.
 */

/**
 * DEMO ONLY. Maps the mock server's English sample team names (Platform,
 * Data, …) to the active language so the demo reads naturally when toggled.
 * Real, customer-created names are not in L.demoTeams, so they pass through
 * verbatim — team names are user data and must never be auto-translated in
 * production. Read at render time (the `key={lang}` remount re-runs the
 * callers), so it follows a live language switch. Delete/neutralize this
 * once the app talks to a real backend with real team names.
 */
export const localizeTeamName = (name: string): string =>
  (L.demoTeams as Record<string, string>)[name] ?? name;

/** Team name for `teamId`, or the id itself if the team is unknown. */
export const getTeamName = (teams: TTeamTree, teamId: string): string =>
  localizeTeamName(teams.find((team) => team.id === teamId)?.name ?? teamId);

/** All descendant ids of a team, in depth-first tree order. */
export const getTeamDescendantIds = (
  teams: TTeamTree,
  teamId: string,
): string[] =>
  (teams.find((team) => team.id === teamId)?.childrenIds ?? []).flatMap(
    (childId) => [childId, ...getTeamDescendantIds(teams, childId)],
  );

/**
 * GET /teams/tree returns flat nodes — the client builds the recursive
 * TTeamViewNode shape the TeamTree component consumes (API design §3).
 * Single pass over a children index (not a filter per parent), so the
 * build stays linear in team count. Callers memoize per teams array.
 */
export const buildTeamNodes = (teams: TTeamTree): TTeamViewNode[] => {
  const childrenOf = new Map<string | null, TTeamTree>();
  for (const team of teams) {
    const siblings = childrenOf.get(team.parentId);
    if (siblings) siblings.push(team);
    else childrenOf.set(team.parentId, [team]);
  }
  const build = (parentId: string | null): TTeamViewNode[] =>
    (childrenOf.get(parentId) ?? []).map((team) => ({
      id: team.id,
      name: localizeTeamName(team.name),
      members: team.memberCount,
      children: team.childCount > 0 ? build(team.id) : undefined,
    }));
  return build(null);
};

/** Depth-first lookup in a built view-node tree. */
export const findTeamNode = (
  nodes: TTeamViewNode[],
  id: string,
): TTeamViewNode | undefined =>
  nodes.reduce<TTeamViewNode | undefined>(
    (found, node) =>
      found ?? (node.id === id ? node : findTeamNode(node.children ?? [], id)),
    undefined,
  );

/** Ancestor ids of a team — expanded so a selection handed off from
    the org chart is actually visible in the tree. */
export const ancestorIds = (
  flatById: Map<string, TTeamTree[number]>,
  teamId: string,
): string[] => {
  const ids: string[] = [];
  let parentId = flatById.get(teamId)?.parentId;
  while (parentId) {
    ids.push(parentId);
    parentId = flatById.get(parentId)?.parentId;
  }
  return ids;
};
