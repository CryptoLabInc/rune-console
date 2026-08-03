import { cn } from "@/utils/cn";

const styles = {
  wrap: "flex w-fit items-center gap-2 font-mono text-sm",
  /* Arrows use the control-grade border + ink (border-strong /
     foreground — same grammar as Input/Dropdown controls). */
  arrow:
    "border-border-strong grid h-6 min-w-6 cursor-pointer place-items-center rounded-[4px] border px-1 text-foreground transition-colors duration-[160ms] hover:enabled:border-mint/40 hover:enabled:text-mint disabled:cursor-not-allowed disabled:opacity-30",
  num: "grid h-6 min-w-6 cursor-pointer place-items-center rounded-[4px] px-1 text-muted-foreground transition-colors duration-[160ms] hover:text-mint",
  numActive: "bg-mint text-on-mint font-semibold hover:text-on-mint",
};

/** Sliding 5-page window centered on the current page, clamped at both
    ends so exactly min(5, totalPages) numbers always show — the button
    count never jumps while paging (1→[1..5], 4→[2..6], 9/10→[6..10]). */
const pageWindow = (page: number, totalPages: number): number[] => {
  const size = Math.min(5, totalPages);
  const start = Math.min(Math.max(1, page - 2), totalPages - size + 1);
  return Array.from({ length: size }, (_, i) => start + i);
};

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

/**
 * Pagination is the numbered pager (wireframe spec form): ‹ 1 2 3 ›.
 * The current page is filled mint; boundary arrows disable. Large page
 * counts show a sliding 5-page window around the current page — the
 * session-history table grows without bound, so an unwindowed row of
 * hundreds of buttons is not an option.
 */
const Pagination = ({
  page,
  totalPages,
  onChange,
  className,
}: PaginationProps) => {
  return (
    <nav className={cn(styles.wrap, className)} aria-label="페이지네이션">
      <button
        type="button"
        className={styles.arrow}
        aria-label="이전 페이지"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ‹
      </button>
      {pageWindow(page, totalPages).map((n) => (
        <button
          key={n}
          type="button"
          className={cn(styles.num, n === page && styles.numActive)}
          aria-current={n === page ? "page" : undefined}
          onClick={() => n !== page && onChange(n)}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        className={styles.arrow}
        aria-label="다음 페이지"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </nav>
  );
};

export default Pagination;
