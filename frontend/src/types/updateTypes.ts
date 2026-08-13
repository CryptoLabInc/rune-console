import type { SYSTEM_UPDATE_STATE } from "@/constants/apiConstants";

/** Lifecycle reported by the privileged rune-console update agent —
    derived from SYSTEM_UPDATE_STATE (single source). */
export type TSystemUpdateState =
  (typeof SYSTEM_UPDATE_STATE)[keyof typeof SYSTEM_UPDATE_STATE];

/** Wire contract for GET /api/v1/system/update. */
export type TSystemUpdateStatus = {
  currentVersion: string;
  targetVersion?: string;
  updateAvailable: boolean;
  capable: boolean;
  state: TSystemUpdateState;
};
