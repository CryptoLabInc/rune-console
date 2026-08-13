interface TableLoadingRowProps {
  colSpan: number;
}

/**
 * TableLoadingRow is the shared pending state for server-paged tables —
 * one full-width faint line so every list (users, sessions, team
 * members) waits with the same height and copy.
 */
const TableLoadingRow = ({ colSpan }: TableLoadingRowProps) => {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="text-faint px-3 py-8 text-center text-sm"
      >
        불러오는 중…
      </td>
    </tr>
  );
};

export default TableLoadingRow;
