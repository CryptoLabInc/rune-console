import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  toBatchFailureRows,
  useBatchFailureModal,
} from "@/hooks/useBatchFailureModal";
import { BATCH_REASON_FALLBACK } from "@/constants/errorConstants";

describe("useBatchFailureModal", () => {
  it("starts closed and opens with the given rows", () => {
    const { result } = renderHook(() => useBatchFailureModal());
    expect(result.current.batchFailures).toBeNull();
    act(() =>
      result.current.showBatchFailures([{ account: "a", reason: "r" }]),
    );
    expect(result.current.batchFailures).toEqual([
      { account: "a", reason: "r" },
    ]);
    act(() => result.current.closeBatchFailures());
    expect(result.current.batchFailures).toBeNull();
  });
});

describe("toBatchFailureRows", () => {
  const failed = [
    { id: "u1", code: "USER_NOT_FOUND", message: "x" },
    { id: "u2", code: "INTERNAL", message: "y" },
  ];

  it("maps known codes through BATCH_REASON and labels via labelOf", () => {
    const rows = toBatchFailureRows(
      failed,
      (id) => `acct-${id}`,
      () => BATCH_REASON_FALLBACK,
    );
    expect(rows[0]).toEqual({
      account: "acct-u1",
      reason: "사용자를 찾을 수 없습니다",
    });
    expect(rows[1]).toEqual({
      account: "acct-u2",
      reason: BATCH_REASON_FALLBACK,
    });
  });

  it("supports the raw-code fallback used by removal/delete flows", () => {
    const rows = toBatchFailureRows(
      failed,
      (id) => id,
      (code) => code,
    );
    expect(rows[1].reason).toBe("INTERNAL");
  });
});
