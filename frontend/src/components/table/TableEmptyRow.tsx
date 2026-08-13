import type { ReactNode } from "react";

interface TableEmptyRowProps {
  colSpan: number;
  /** Per-table empty copy (검색 결과가 없습니다 · 이력이 없습니다 · …). */
  children: ReactNode;
}

/**
 * TableEmptyRow is the shared zero-rows state for server-paged tables —
 * a full-width muted line under the header rule, matching
 * TableLoadingRow's height so pending → empty never shifts the layout.
 */
const TableEmptyRow = ({ colSpan, children }: TableEmptyRowProps) => {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="text-muted-foreground border-t px-3 py-8 text-center text-sm"
      >
        {children}
      </td>
    </tr>
  );
};

export default TableEmptyRow;
