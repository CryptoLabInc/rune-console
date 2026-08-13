import type {
  INVITATION_STATUS,
  SESSION_STATUS,
  TEAM_MEMBER_ROLE,
} from "@/constants/apiConstants";

export type TTeamNode = {
  id: string;
  name: string;
  parentId: string | null;
  childrenIds: string[];
  childCount: number;
  memberCount: number;
};

export type TTeamTree = TTeamNode[];

/** Recursive team-tree node the tree/org views consume (UIKIT
    AdminTeamNode, wireframe SC-06) — built client-side from the flat
    TTeamTree. Distinct from TTeamNode, the flat wire row above. */
export type TTeamViewNode = {
  id: string;
  name: string;
  members: number;
  children?: TTeamViewNode[];
};

/** Grantable member role — derived from TEAM_MEMBER_ROLE (single source). */
export type TTeamMemberRole =
  (typeof TEAM_MEMBER_ROLE)[keyof typeof TEAM_MEMBER_ROLE];

/** Invitation-code lifecycle status — derived from INVITATION_STATUS. */
export type TInvitationStatus =
  (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

/** Session-token liveness — derived from SESSION_STATUS. */
export type TSessionStatus =
  (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

/** GET /teams/{id} detail. */
export type TTeamDetail = {
  id: string;
  name: string;
  parentId: string | null;
  children: string[];
  memberCount: number;
  createdAt: string;
};

/** A row of GET /teams/{id}/members. */
export type TTeamMember = {
  userId: string;
  account: string;
  /** Display name (not an identifier — account stays unique, API 2026-07-20). */
  username: string;
  role: TTeamMemberRole;
  invitationStatus: TInvitationStatus;
  sessionStatus: TSessionStatus;
  /**
   * Granted-at of the stored membership. Null for an inherited-read row —
   * the member reaches this team by downward inheritance from an ancestor,
   * so there is no stored grant and no join timestamp (API memberDTO).
   */
  joinedAt: string | null;
};

/** Paginated list envelope (common contract). */
export type TPage<T> = {
  total: number;
  page: number;
  size: number;
  items: T[];
};

/** Batch endpoint result (partial success — API §0). */
export type TBatchResult = {
  succeeded: string[];
  failed: { id: string; code: string; message: string }[];
};
