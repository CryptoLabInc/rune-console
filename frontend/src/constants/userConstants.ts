import { SESSION_STATUS } from "@/constants/apiConstants";
import type { TMemberStatus } from "@/types/commonTypes";
import type { TSessionStatus } from "@/types/teamTypes";

/** API session status → MemberStatus chip state. Identity today, but kept as a
    seam so the chip vocabulary can diverge from the wire later. */
export const CHIP_STATUS: Record<TSessionStatus, TMemberStatus> = {
  [SESSION_STATUS.online]: "online",
  [SESSION_STATUS.offline]: "offline",
};
