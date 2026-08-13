import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Pagination from "@/components/elements/Pagination";

describe("Pagination", () => {
  it("renders a numbered button per page and marks the current one", () => {
    render(<Pagination page={2} totalPages={3} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "1" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("shows a sliding 5-page window centered on the current page", () => {
    render(<Pagination page={25} totalPages={50} onChange={() => {}} />);
    /* Visible: 23 24 [25] 26 27 — always exactly five numbers. */
    for (const n of ["23", "24", "25", "26", "27"]) {
      expect(screen.getByRole("button", { name: n })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "1" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "50" }),
    ).not.toBeInTheDocument();
  });

  it("clamps the window at both ends so the button count never jumps", () => {
    /* Head: page 1 of 53 → 1 2 3 4 5. */
    const { rerender } = render(
      <Pagination page={1} totalPages={53} onChange={() => {}} />,
    );
    for (const n of ["1", "2", "3", "4", "5"]) {
      expect(screen.getByRole("button", { name: n })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "6" })).not.toBeInTheDocument();

    /* Near the tail: page 9 of 10 → 6 7 8 9 10. */
    rerender(<Pagination page={9} totalPages={10} onChange={() => {}} />);
    for (const n of ["6", "7", "8", "9", "10"]) {
      expect(screen.getByRole("button", { name: n })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "5" })).not.toBeInTheDocument();
  });

  it("disables prev on the first page and next on the last", () => {
    const { rerender } = render(
      <Pagination page={1} totalPages={5} onChange={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "이전 페이지" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeEnabled();

    rerender(<Pagination page={5} totalPages={5} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeDisabled();
  });

  it("moves a page per arrow click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    expect(onChange).toHaveBeenCalledWith(4);
    await user.click(screen.getByRole("button", { name: "이전 페이지" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("jumps to a clicked page number but ignores the current page", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "5" }));
    expect(onChange).toHaveBeenCalledWith(5);
    await user.click(screen.getByRole("button", { name: "3" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("merges an external className", () => {
    render(
      <Pagination
        page={1}
        totalPages={5}
        onChange={() => {}}
        className="mt-6"
      />,
    );
    expect(screen.getByRole("navigation")).toHaveClass("mt-6");
  });
});
