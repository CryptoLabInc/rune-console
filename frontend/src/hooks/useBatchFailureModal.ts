import { useState } from "react";

import { BATCH_REASON } from "@/constants/errorConstants";
import type { TBatchResult } from "@/types/teamTypes";

/** One row of MemberBatchFailureModal: target label + failure copy. */
export type TBatchFailureRow = { account: string; reason: string };

/**
 * useBatchFailureModal owns the partial-failure surface shared by the
 * batch endpoints (bulk role change, membership removal, user delete):
 * non-null rows open MemberBatchFailureModal listing exactly what failed
 * and why (API design — partial success is not an error).
 */
export const useBatchFailureModal = () => {
  const [batchFailures, setBatchFailures] = useState<TBatchFailureRow[] | null>(
    null,
  );

  const closeBatchFailures = () => setBatchFailures(null);

  return {
    batchFailures,
    showBatchFailures: setBatchFailures,
    closeBatchFailures,
  };
};

/**
 * Maps a batch result's failures onto modal rows: a per-target label plus
 * the shared BATCH_REASON copy. Unmapped codes fall back to whatever the
 * caller chooses — the generic retry copy (role-change flows) or the raw
 * backend code as a diagnostic hint (removal/delete flows).
 */
export const toBatchFailureRows = (
  failed: TBatchResult["failed"],
  labelOf: (id: string) => string,
  fallbackFor: (code: string) => string,
): TBatchFailureRow[] =>
  failed.map((f) => ({
    account: labelOf(f.id),
    reason: BATCH_REASON[f.code] ?? fallbackFor(f.code),
  }));
