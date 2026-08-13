/** Option shape for the shared Dropdown element (UIKIT AdminOption). */
export type TDropdownOption = {
  value: string;
  label: string;
  /** Indent level for tree-shaped option lists (team tree). */
  depth?: number;
  disabled?: boolean;
};

/** Session chip state — the only status a list view renders. */
export type TMemberStatus = "online" | "offline";

/** Toast tone — semantic colors are state, not decoration. */
export type TToastTone = "info" | "success" | "error";
