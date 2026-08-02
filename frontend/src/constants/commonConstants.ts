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
  close: "닫기",
  cancel: "취소",
  confirm: "확인",
  save: "저장",
  delete: "삭제하기",
  remove: "제거하기",
  add: "추가",
  create: "생성",
  change: "변경하기",
  refresh: "새로고침",
  retry: "다시 시도",
  update: "업데이트",
  later: "나중에",
  // Auth / navigation
  signOut: "로그아웃",
  getStarted: "시작하기",
  login: "로그인하기",
  home: "홈으로",
  // Workspace
  restart: "재실행",
  stop: "중지",
  deactivate: "비활성화",
  recreate: "삭제 후 재생성",
  reconnect: "재연결",
  // Teams
  createTeam: "새 팀 만들기",
  createGroup: "팀 생성하기",
  rename: "이름 변경",
  deleteTeam: "팀 삭제하기",
  addMember: "멤버 추가하기",
  addTeam: "팀 추가하기",
  // Members / invitations
  invite: "초대하기",
  inviteMember: "멤버 초대하기",
  sendInvitation: "초대 전송",
  resendInvitationCode: "초대 코드 재전송",
  cancelInvitation: "초대 취소",
  cancelAction: "취소하기",
  addTeamRole: "+ 팀/권한 추가",
  removeRow: "✕",
  updateChanges: "변경사항 업데이트",
  resetChanges: "변경사항 초기화",
  deactivateSession: "세션 비활성화",
  deleteMember: "멤버 삭제",
} as const;

/** PAGE_TITLES is the page/section vocabulary — shared by the main nav,
 * each page's <section aria-label>, and the workspace modal title, so the
 * same screen is never named two different things. */
export const PAGE_TITLES = {
  teams: "팀 관리",
  users: "멤버 관리",
  sessions: "세션 기록",
  workspace: "워크스페이스 관리",
} as const;

/** MODAL_TITLES is the single source of truth for ModalLayout titles across
 * the console modals, mirroring BTN_TEXT so a wording change lands in one
 * place. Titles that embed a name or count are functions; the rest are plain
 * strings. */
export const MODAL_TITLES = {
  // Workspace
  workspaceManage: PAGE_TITLES.workspace,
  workspaceDelete: "워크스페이스 삭제",
  workspaceOrphaned: "워크스페이스 재생성 필요",
  workspaceReconnect: "워크스페이스 재연결 필요",
  // Teams
  createTeam: "새 팀 만들기",
  renameTeam: "팀 이름 변경",
  deleteTeam: (teamName: string) => `팀 삭제 — ${teamName}`,
  addMember: (teamName: string) => `멤버 추가 — ${teamName}`,
  batchFailure: "일부 항목을 처리하지 못했습니다",
  // Members / roles / invitations
  roleChange: "권한 변경",
  removeMembership: "멤버십 제거",
  inviteMember: "멤버 초대",
  cancelInvitation: "초대 취소",
  deactivateSession: "세션 비활성화",
  deleteMemberSingle: (account: string) => `멤버 삭제 — ${account}`,
  deleteMemberBulk: (count: number) => `멤버 삭제 (${count}명)`,
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

export const NAV_LIST = [
  { title: PAGE_TITLES.teams, url: PATH_LIST.teams },
  { title: PAGE_TITLES.users, url: PATH_LIST.users },
  { title: PAGE_TITLES.sessions, url: PATH_LIST.sessions },
] as const;

/** TABLE_HEADERS is the column-header copy shared across the list tables,
 * the modal tables, and the sort-option labels that mirror a column. */
export const TABLE_HEADERS = {
  memberName: "멤버 이름",
  memberStatus: "멤버 상태",
  team: "팀",
  teamWithRole: "팀 (권한)",
  role: "권한",
  /* TreeDetailView's member table says 역할 while every other role column
     says 권한 — kept verbatim pending a copy decision; unifying is a
     one-line change here once decided. */
  roleAlt: "역할",
  roleChange: "권한 변경",
  joinedAt: "합류일",
  account: "account",
  reason: "사유",
  user: "사용자",
  issuedAt: "발급 시간",
  lastAccess: "최근 접속 시간",
} as const;

/** Form-field copy shared by the invite (SC-12) and add-member (SC-06)
 * forms — labels are also how tests and screen readers find the fields. */
export const INPUT_LABELS = {
  emailAccount: "이메일 (account)",
  username: "사용자 이름 (username)",
} as const;

export const PLACEHOLDERS = {
  selectTeam: "팀 선택",
  selectRole: "권한 선택",
  /** Team picker when every team is already joined (SC-13 add row). */
  noAddableTeam: "추가할 팀 없음",
  emailExample: "user@corp.com",
  username: "사용자 이름",
} as const;

/** Icon/control aria-labels used on more than one screen — centralized so
 * assistive tech hears the same name everywhere (they had already drifted:
 * "전체 선택" vs "전체선택"). */
export const ARIA_LABELS = {
  selectAll: "전체 선택",
  sort: "정렬",
} as const;

/** Shared Feedback copy — per-screen titles stay local; only the copy that
 * repeats across screens lives here. */
export const FEEDBACK_TEXT = {
  refreshRetry: "새로고침 후 다시 시도해 주세요.",
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
