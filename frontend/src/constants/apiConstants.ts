/**
 * Wire-contract vocabulary shared with the console API — the single source
 * for status/role/error-code string values. Components must reference these
 * (e.g. `INVITATION_STATUS.pending`) instead of typing the raw literal, so a
 * backend value rename is a one-line change here and every typo is a compile
 * error. The matching union types are derived from these objects in types/
 * (e.g. TInvitationStatus), keeping constant and type in lockstep.
 */

/** Invitation-code lifecycle status on the wire (common contract). */
export const INVITATION_STATUS = {
  pending: "invite_pending",
  expired: "invite_expired",
  redeemed: "invite_redeemed",
} as const;

/** Session-token liveness on the wire (common contract). */
export const SESSION_STATUS = {
  online: "online",
  offline: "offline",
} as const;

/** rune workspace lifecycle phase (console API `phase`). */
export const WORKSPACE_STATUS = {
  provisioning: "provisioning",
  running: "running",
  stopping: "stopping",
  stopped: "stopped",
  starting: "starting",
  deleting: "deleting",
  error: "error",
} as const;

/** Lifecycle reported by the privileged rune-console update agent. */
export const SYSTEM_UPDATE_STATE = {
  idle: "idle",
  queued: "queued",
  running: "running",
  failed: "failed",
  succeeded: "succeeded",
} as const;

/** Grantable member role (Admin is console-account only — API §0). */
export const TEAM_MEMBER_ROLE = {
  edit: "edit",
  write: "write",
  read: "read",
} as const;

/**
 * Backend error codes surfaced through the shared error envelope
 * (parseErrorCode). Keys mirror the wire value verbatim so call sites read
 * the same as the API design doc.
 */
export const ERROR_CODES = {
  ALREADY_TEAM_MEMBER: "ALREADY_TEAM_MEMBER",
  CANNOT_INVITE_ADMIN: "CANNOT_INVITE_ADMIN",
  INVITATION_NOT_PENDING: "INVITATION_NOT_PENDING",
  MAIL_UPSTREAM_ERROR: "MAIL_UPSTREAM_ERROR",
  NOT_TEAM_MEMBER: "NOT_TEAM_MEMBER",
  SESSION_NOT_ACTIVE: "SESSION_NOT_ACTIVE",
  TEAM_HAS_CHILDREN: "TEAM_HAS_CHILDREN",
  TEAM_NAME_DUPLICATE: "TEAM_NAME_DUPLICATE",
  TEAM_NAME_INVALID: "TEAM_NAME_INVALID",
  TEAM_NOT_FOUND: "TEAM_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
} as const;
