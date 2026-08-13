import { L } from "@/locales";

/** BRAND_WORDMARK is the displayed product wordmark, shared by the navbars
 * (SC-01/SC-03) and the login card heading (SC-01) so the brand string has a
 * single source of truth. Deliberately not localized. */
export const BRAND_WORDMARK = "RUNE CONSOLE";

/** WORKSPACE_MAX_MEMORIES is the plan cap on stored memories (rows) per
 * workspace; the SC-02 modal renders usage as rowCount / max (percent). */
export const WORKSPACE_MAX_MEMORIES = 1000;

/** forwardLive returns a Proxy that re-reads `pick()` on every property
 * access, so consumers stay reactive to a live language switch. A plain
 * `const X = L.btn` would resolve `L.btn` once at module-eval time and freeze
 * that language's whole table — the chips/buttons would then only change
 * language on reload. The Proxy defers each read to `L.*`, which is itself
 * language-aware, so `X.foo` resolves against the active language per access. */
const forwardLive = <T extends object>(pick: () => T): T =>
  new Proxy({} as T, {
    get: (_t, p) => pick()[p as keyof T],
    has: (_t, p) => p in pick(),
    ownKeys: () => Reflect.ownKeys(pick()),
    getOwnPropertyDescriptor: (_t, p) => {
      const d = Reflect.getOwnPropertyDescriptor(pick(), p);
      // ownKeys-reported props must report configurable to satisfy the Proxy
      // invariant for a non-extensible-looking target.
      return d && { ...d, configurable: true };
    },
  });

/** BTN_TEXT is the single source of truth for visible action-button labels
 * (Button `btnText` / TextButton) across the console screens — the wording
 * itself lives in src/locales (en.ts / ko.ts). A live Proxy over `L.btn` so
 * button captions swap language in place, without a reload.
 * Icon-button aria-labels are intentionally out of scope — those are
 * accessibility strings, not button captions. */
export const BTN_TEXT = forwardLive(() => L.btn);

/** MODAL_TITLES is the single source of truth for ModalLayout titles across
 * the console modals, mirroring BTN_TEXT (wording in src/locales). Titles
 * that embed a name or count are functions; the rest are plain strings. */
export const MODAL_TITLES = forwardLive(() => L.modal);

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
   switch; a plain `L.nav.*` value would freeze at module-eval time. */
export const NAV_LIST = [
  {
    get title() {
      return L.nav.teams;
    },
    url: PATH_LIST.teams,
  },
  {
    get title() {
      return L.nav.users;
    },
    url: PATH_LIST.users,
  },
  {
    get title() {
      return L.nav.sessions;
    },
    url: PATH_LIST.sessions,
  },
] as const;

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
