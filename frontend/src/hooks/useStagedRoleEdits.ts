import { useState } from "react";

import type { TTeamMemberRole } from "@/types/teamTypes";

/**
 * useStagedRoleEdits owns the SC-06 staged role-edit machine: dropdown
 * picks collect in pendingRoles and only apply on [변경사항 업데이트];
 * savedRoles is the committed baseline shown until the invalidation
 * refetch delivers the server truth (the list query keeps previous data
 * visible during the refetch).
 */
export const useStagedRoleEdits = () => {
  const [pendingRoles, setPendingRoles] = useState<
    Map<string, TTeamMemberRole>
  >(new Map());
  const [savedRoles, setSavedRoles] = useState<Map<string, TTeamMemberRole>>(
    new Map(),
  );

  /** Committed role for a member — the staged baseline or the wire value. */
  const baseRole = (userId: string, fallback: TTeamMemberRole) =>
    savedRoles.get(userId) ?? fallback;

  /** Stage a dropdown pick; picking the base value back un-stages it. */
  const stageRole = (
    userId: string,
    fallback: TTeamMemberRole,
    nextRole: string,
  ) =>
    setPendingRoles((prev) => {
      const next = new Map(prev);
      if (nextRole === baseRole(userId, fallback)) next.delete(userId);
      else next.set(userId, nextRole as TTeamMemberRole);
      return next;
    });

  /** [변경사항 초기화] — staged picks drop; the committed baseline stays. */
  const resetStaged = () => setPendingRoles(new Map());

  /** Team switch — nothing staged or committed may leak across teams. */
  const resetAll = () => {
    setPendingRoles(new Map());
    setSavedRoles(new Map());
  };

  /** Full batch success — commit every staged pick into the baseline. */
  const applyAll = () => {
    setSavedRoles((prev) => new Map([...prev, ...pendingRoles]));
    setPendingRoles(new Map());
  };

  /** Partial batch failure — commit only what succeeded and keep the
      failed entries staged so the user can retry them. */
  const reconcileBatch = (failedIds: Set<string>) => {
    setSavedRoles(
      (prev) =>
        new Map([
          ...prev,
          ...[...pendingRoles.entries()].filter(
            ([userId]) => !failedIds.has(userId),
          ),
        ]),
    );
    setPendingRoles(
      (prev) => new Map([...prev].filter(([userId]) => failedIds.has(userId))),
    );
  };

  return {
    pendingRoles,
    baseRole,
    stageRole,
    resetStaged,
    resetAll,
    applyAll,
    reconcileBatch,
  };
};
