import { L } from "@/locales";

/** BRAND_WORDMARK is the displayed product wordmark, shared by the navbars
 * (SC-01/SC-03) and the login card heading (SC-01) so the brand string has a
 * single source of truth. */
export const BRAND_WORDMARK = "RUNE CONSOLE";

/** WORKSPACE_MAX_MEMORIES is the plan cap on stored memories (rows) per
 * workspace; the SC-02 modal renders usage as rowCount / max (percent). */
export const WORKSPACE_MAX_MEMORIES = 1000;

/** DEFAULT_PAGE_SIZE is the fixed rows-per-page for every list table
 * (users, sessions, team members) — caps the table height inside one
 * screen and goes out as the ?size= query param on the list endpoints. */
export const DEFAULT_PAGE_SIZE = 10;

/** BTN_TEXT is the single source of truth for visible action-button labels
 * (Button `btnText` / TextButton) across the console screens, so a wording
 * change lands in one place. Icon-button aria-labels are intentionally out of
 * scope — those are accessibility strings, not button captions. */
export const BTN_TEXT = {
  // Generic actions
  get close() {
    return L.btn.close;
  },
  get cancel() {
    return L.btn.cancel;
  },
  get confirm() {
    return L.btn.confirm;
  },
  get save() {
    return L.btn.save;
  },
  get delete() {
    return L.btn.delete;
  },
  get remove() {
    return L.btn.remove;
  },
  get add() {
    return L.btn.add;
  },
  get create() {
    return L.btn.create;
  },
  get change() {
    return L.btn.change;
  },
  get refresh() {
    return L.btn.refresh;
  },
  get retry() {
    return L.btn.retry;
  },
  get update() {
    return L.btn.update;
  },
  get later() {
    return L.btn.later;
  },
  // Auth / navigation
  get signOut() {
    return L.btn.signOut;
  },
  get getStarted() {
    return L.btn.getStarted;
  },
  get login() {
    return L.btn.login;
  },
  get home() {
    return L.btn.home;
  },
  // Workspace
  get restart() {
    return L.btn.restart;
  },
  get stop() {
    return L.btn.stop;
  },
  get deactivate() {
    return L.btn.deactivate;
  },
  get recreate() {
    return L.btn.recreate;
  },
  get reconnect() {
    return L.btn.reconnect;
  },
  // Teams
  get createTeam() {
    return L.btn.createTeam;
  },
  get createGroup() {
    return L.btn.createGroup;
  },
  get rename() {
    return L.btn.rename;
  },
  get deleteTeam() {
    return L.btn.deleteTeam;
  },
  get addMember() {
    return L.btn.addMember;
  },
  get addTeam() {
    return L.btn.addTeam;
  },
  // Members / invitations
  get invite() {
    return L.btn.invite;
  },
  get inviteMember() {
    return L.btn.inviteMember;
  },
  get sendInvitation() {
    return L.btn.sendInvitation;
  },
  get resendInvitationCode() {
    return L.btn.resendInvitationCode;
  },
  get cancelInvitation() {
    return L.btn.cancelInvitation;
  },
  get cancelAction() {
    return L.btn.cancelAction;
  },
  get addTeamRole() {
    return L.btn.addTeamRole;
  },
  removeRow: "✕",
  get updateChanges() {
    return L.btn.updateChanges;
  },
  get resetChanges() {
    return L.btn.resetChanges;
  },
  get deactivateSession() {
    return L.btn.deactivateSession;
  },
  get deleteMember() {
    return L.btn.deleteMember;
  },
} as const;

/** PAGE_TITLES is the page/section vocabulary — shared by the main nav,
 * each page's <section aria-label>, and the workspace modal title, so the
 * same screen is never named two different things. */
export const PAGE_TITLES = {
  get teams() {
    return L.nav.teams;
  },
  get users() {
    return L.nav.users;
  },
  get sessions() {
    return L.nav.sessions;
  },
  get workspace() {
    return L.modal.workspaceManage;
  },
} as const;

/** MODAL_TITLES is the single source of truth for ModalLayout titles across
 * the console modals, mirroring BTN_TEXT so a wording change lands in one
 * place. Titles that embed a name or count are functions; the rest are plain
 * strings. */
export const MODAL_TITLES = {
  // Workspace
  workspaceManage: PAGE_TITLES.workspace,
  get workspaceDelete() {
    return L.modal.workspaceDelete;
  },
  get workspaceOrphaned() {
    return L.modal.workspaceOrphaned;
  },
  get workspaceReconnect() {
    return L.modal.workspaceReconnect;
  },
  // Teams
  get createTeam() {
    return L.btn.createTeam;
  },
  get renameTeam() {
    return L.modal.renameTeam;
  },
  deleteTeam: (teamName: string) => L.modal.deleteTeam(teamName),
  addMember: (teamName: string) => L.modal.addMember(teamName),
  get batchFailure() {
    return L.modal.batchFailure;
  },
  // Members / roles / invitations
  get roleChange() {
    return L.modal.roleChange;
  },
  get removeMembership() {
    return L.modal.removeMembership;
  },
  get inviteMember() {
    return L.modal.inviteMember;
  },
  get cancelInvitation() {
    return L.btn.cancelInvitation;
  },
  get deactivateSession() {
    return L.btn.deactivateSession;
  },
  deleteMemberSingle: (account: string) => L.modal.deleteMemberSingle(account),
  deleteMemberBulk: (count: number) => L.modal.deleteMemberBulk(count),
} as const;

export const PATH_LIST = {
  home: "/",
  login: "/login",
  workspace: "/workspace",
  teams: "/teams",
  users: "/users",
  sessions: "/sessions",
  uiTest: "/ui-test",
} as const;

/* `title` is a getter so the sidebar labels re-resolve on a live language
   switch — reading PAGE_TITLES.* eagerly would freeze the value here. */
export const NAV_LIST = [
  {
    get title() {
      return PAGE_TITLES.teams;
    },
    url: PATH_LIST.teams,
  },
  {
    get title() {
      return PAGE_TITLES.users;
    },
    url: PATH_LIST.users,
  },
  {
    get title() {
      return PAGE_TITLES.sessions;
    },
    url: PATH_LIST.sessions,
  },
] as const;

/** TABLE_HEADERS is the column-header copy shared across the list tables,
 * the modal tables, and the sort-option labels that mirror a column. */
export const TABLE_HEADERS = {
  get memberName() {
    return L.common.memberName;
  },
  get memberStatus() {
    return L.common.memberStatus;
  },
  get team() {
    return L.common.team;
  },
  get teamWithRole() {
    return L.members.teamRoleHeader;
  },
  get role() {
    return L.common.role;
  },
  /* TreeDetailView's member table says 역할 while every other role column
     says 권한 — kept verbatim pending a copy decision; unifying is a
     one-line change here once decided. */
  get roleAlt() {
    return L.teams.roleHeader;
  },
  get roleChange() {
    return L.modal.roleChange;
  },
  get joinedAt() {
    return L.teams.joinedAt;
  },
  account: "account",
  get reason() {
    return L.members.reason;
  },
  get user() {
    return L.common.users;
  },
  get issuedAt() {
    return L.members.issuedAt;
  },
  get lastAccess() {
    return L.members.lastAccessedAt;
  },
} as const;

/** Form-field copy shared by the invite (SC-12) and add-member (SC-06)
 * forms — labels are also how tests and screen readers find the fields. */
export const INPUT_LABELS = {
  get emailAccount() {
    return L.teams.emailLabel;
  },
  get username() {
    return L.teams.usernameLabel;
  },
} as const;

export const PLACEHOLDERS = {
  get selectTeam() {
    return L.teams.selectTeam;
  },
  get selectRole() {
    return L.teams.selectRole;
  },
  /** Team picker when every team is already joined (SC-13 add row). */
  get noAddableTeam() {
    return L.members.noTeamsToAdd;
  },
  emailExample: "user@corp.com",
  get username() {
    return L.teams.usernamePlaceholder;
  },
} as const;

/** Icon/control aria-labels used on more than one screen — centralized so
 * assistive tech hears the same name everywhere (they had already drifted:
 * "전체 선택" vs "전체선택"). */
export const ARIA_LABELS = {
  get selectAll() {
    return L.common.selectAll;
  },
  get sort() {
    return L.common.sort;
  },
} as const;

/** Shared Feedback copy — per-screen titles stay local; only the copy that
 * repeats across screens lives here. */
export const FEEDBACK_TEXT = {
  get refreshRetry() {
    return L.common.refreshRetry;
  },
} as const;

export const QUERY_KEYS = {
  teamsTree: "teamsTree",
  users: "users",
  usersStats: "usersStats",
  session: "session",
  team: "team",
  teamMembers: "teamMembers",
  workspace: "workspace",
  user: "user",
  invitations: "invitations",
  systemUpdate: "systemUpdate",
} as const;
