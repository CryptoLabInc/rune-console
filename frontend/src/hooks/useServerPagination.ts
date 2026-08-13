import { useCallback, useEffect, useState } from "react";

import { DEFAULT_PAGE_SIZE } from "@/constants/commonConstants";

/**
 * useServerPagination owns the page state for a server-paged table.
 *
 * totalPages tracks the last response's total (kept as state, not derived,
 * so a page/sort transition under keepPreviousData never flashes an interim
 * value), and the returned `page` is clamped against it BEFORE the query
 * call — an out-of-range request never fires. When a response shrinks the
 * range (filter/sort change, deletions emptying the last page), the stored
 * page is corrected so Pagination and later renders resume from a valid
 * value instead of the stale, too-high one.
 *
 * Wiring: pass `page` to the list query, then report each response's total
 * back with one effect — `useEffect(() => syncTotal(total), [total,
 * syncTotal])`.
 */
export const useServerPagination = (pageSize: number = DEFAULT_PAGE_SIZE) => {
  const [rawPage, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const page = Math.min(rawPage, totalPages);

  const syncTotal = useCallback(
    (total: number) => {
      const next = Math.max(1, Math.ceil(total / pageSize));
      setTotalPages(next);
      setPage((prev) => Math.min(prev, next));
    },
    [pageSize],
  );

  const resetPage = useCallback(() => setPage(1), []);

  return { page, totalPages, setPage, resetPage, syncTotal, pageSize };
};

/** Companion one-liner so callers don't hand-roll the report-back effect. */
export const useSyncPaginationTotal = (
  syncTotal: (total: number) => void,
  total: number,
) => {
  useEffect(() => {
    syncTotal(total);
  }, [syncTotal, total]);
};
