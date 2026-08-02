import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePageScopedSelection } from "@/hooks/usePageScopedSelection";

describe("usePageScopedSelection", () => {
  it("toggles single ids on and off", () => {
    const { result } = renderHook(() => usePageScopedSelection());
    act(() => result.current.toggleOne("a", true));
    act(() => result.current.toggleOne("b", true));
    expect(result.current.selectedIds).toEqual(new Set(["a", "b"]));
    act(() => result.current.toggleOne("a", false));
    expect(result.current.selectedIds).toEqual(new Set(["b"]));
  });

  it("toggleAll adds and removes only the given ids", () => {
    const { result } = renderHook(() => usePageScopedSelection());
    act(() => result.current.toggleOne("keep", true));
    act(() => result.current.toggleAll(["a", "b"], true));
    expect(result.current.selectedIds).toEqual(new Set(["keep", "a", "b"]));
    act(() => result.current.toggleAll(["a", "b"], false));
    expect(result.current.selectedIds).toEqual(new Set(["keep"]));
  });

  it("clearSelection empties the set", () => {
    const { result } = renderHook(() => usePageScopedSelection());
    act(() => result.current.toggleAll(["a", "b"], true));
    act(() => result.current.clearSelection());
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("setSelectedIds supports batch-result reconciliation", () => {
    const { result } = renderHook(() => usePageScopedSelection());
    act(() => result.current.toggleAll(["ok", "failed"], true));
    act(() =>
      result.current.setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete("ok");
        return next;
      }),
    );
    expect(result.current.selectedIds).toEqual(new Set(["failed"]));
  });
});
