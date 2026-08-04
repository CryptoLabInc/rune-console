// Bilingual locale system — i18next drives the language LIFECYCLE (init,
// changeLanguage, the languageChanged event LocaleProvider re-renders on),
// while the two static, compile-time-typed tables (en.ts / ko.ts) remain the
// string source. `L` is a Proxy over the active table, so all `L.x.y` call
// sites and the type safety (ko.ts satisfies `typeof en`) stay unchanged, and
// switching now re-renders in place instead of reloading — no switch flash.

import i18n from "i18next";

import { en, type TLocale } from "./en";
import { ko } from "./ko";

/** LANG_STORAGE_KEY persists an explicit user language choice; absent, the
 * browser language decides (Korean browsers → ko, everything else → en). */
export const LANG_STORAGE_KEY = "rc_lang";

export type TLanguage = "en" | "ko";

const locales: Record<TLanguage, TLocale> = { en, ko };

const detectLanguage = (): TLanguage => {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "en" || stored === "ko") return stored;
  } catch {
    /* storage unavailable (private mode) — fall through to browser language */
  }
  return navigator.language?.toLowerCase().startsWith("ko") ? "ko" : "en";
};

// Initialize i18next once. Resources are minimal — copy comes from the typed
// tables via `L`, not i18next's t(); i18next is the language state machine +
// change-event source that LocaleProvider subscribes to.
if (!i18n.isInitialized) {
  void i18n.init({
    lng: detectLanguage(),
    fallbackLng: "en",
    resources: { en: { translation: {} }, ko: { translation: {} } },
    interpolation: { escapeValue: false },
  });
}

export { i18n };

/** getLanguage returns the currently active language. Reactive callers read
 * this inside render so a re-render (see LocaleProvider) picks up a change. */
export const getLanguage = (): TLanguage =>
  (i18n.language as TLanguage) === "ko" ? "ko" : "en";

/** language is the language at module-eval time — kept for load-time-only
 * consumers. Prefer getLanguage() in anything that must react to a switch. */
export const language: TLanguage = getLanguage();

/** L is the active locale table, resolved per access against the current
 * language, so a re-render after a switch shows the new copy. */
export const L: TLocale = new Proxy({} as TLocale, {
  get(_t, prop: string | symbol) {
    return locales[getLanguage()][prop as keyof TLocale];
  },
  has(_t, prop) {
    return prop in locales[getLanguage()];
  },
  ownKeys() {
    return Reflect.ownKeys(locales[getLanguage()]);
  },
  getOwnPropertyDescriptor(_t, prop) {
    return Reflect.getOwnPropertyDescriptor(
      locales[getLanguage()],
      prop as keyof TLocale,
    );
  },
});

/** setLanguage persists the choice and switches i18next in place — no reload,
 * so the UI swaps languages without the reload flash (LocaleProvider re-renders
 * the tree on i18next's languageChanged event). */
export const setLanguage = (lang: TLanguage) => {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* storage unavailable — the in-memory switch below still applies it */
  }
  void i18n.changeLanguage(lang);
};
