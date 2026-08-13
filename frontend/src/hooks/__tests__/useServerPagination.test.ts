import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useServerPagination } from "@/hooks/useServerPagination";

describe("useServerPagination", () => {
  it("starts on page 1 with one page until a total arrives", () => {
    const { result } = renderHook(() => useServerPagination(10));
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  it("derives totalPages from the reported total", () => {
    const { result } = renderHook(() => useServerPagination(10));
    act(() => result.current.syncTotal(35));
    expect(result.current.totalPages).toBe(4);
    expect(result.current.page).toBe(1);
  });

  it("clamps the request page when the range shrinks", () => {
    const { result } = renderHook(() => useServerPagination(10));
    act(() => result.current.syncTotal(50));
    act(() => result.current.setPage(5));
    expect(result.current.page).toBe(5);
    /* A sort/filter change or deletion shrinks the result set. */
    act(() => result.current.syncTotal(21));
    expect(result.current.totalPages).toBe(3);
    expect(result.current.page).toBe(3);
  });

  it("never exposes a page beyond totalPages even before the correction", () => {
    const { result } = renderHook(() => useServerPagination(10));
    act(() => result.current.setPage(9));
    /* totalPages still 1 — the returned page must stay in range so the
       query never asks for an out-of-range slice. */
    expect(result.current.page).toBe(1);
  });

  it("resetPage returns to page 1", () => {
    const { result } = renderHook(() => useServerPagination(10));
    act(() => result.current.syncTotal(50));
    act(() => result.current.setPage(4));
    act(() => result.current.resetPage());
    expect(result.current.page).toBe(1);
  });

  it("treats an empty result as a single page", () => {
    const { result } = renderHook(() => useServerPagination(10));
    act(() => result.current.syncTotal(0));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.page).toBe(1);
  });
});
