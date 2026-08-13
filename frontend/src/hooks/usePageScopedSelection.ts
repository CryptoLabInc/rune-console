import { useState } from "react";

/**
 * usePageScopedSelection owns a checkbox column's Set-of-ids selection
 * (users page, team member table, drawer membership rows).
 *
 * "Page-scoped" is a caller contract: whatever changes the visible rows
 * (page move, filter change, team switch) should call clearSelection so a
 * checked row never rides along into a bulk action taken on a different
 * slice. setSelectedIds is exposed for batch-result reconciliation —
 * dropping succeeded targets while failed ones stay selected for a retry.
 */
export const usePageScopedSelection = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleOne = (id: string, selected: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });

  /** Header select-all: add/remove the given (visible) ids in one shot. */
  const toggleAll = (ids: string[], selected: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (selected) next.add(id);
        else next.delete(id);
      });
      return next;
    });

  const clearSelection = () => setSelectedIds(new Set());

  return { selectedIds, toggleOne, toggleAll, clearSelection, setSelectedIds };
};
