import { useEffect, useState, type ReactNode } from "react";

import { i18n } from "@/locales";

/**
 * LocaleProvider makes the module-global `L` Proxy reactive without a page
 * reload. `L.x.y` reads the current language on every access, but a module
 * global can't tell React to re-render — so this boundary subscribes to
 * i18next's `languageChanged` event and remounts its subtree (via a changing
 * `key`) when the language switches. The tree then re-renders in place — no
 * reload, so no flash — and every `L.x.y` re-resolves to the new language.
 */
export default function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState(i18n.language);

  useEffect(() => {
    const onChange = (next: string) => setLang(next);
    i18n.on("languageChanged", onChange);
    if (i18n.language !== lang) setLang(i18n.language);
    return () => {
      i18n.off("languageChanged", onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div key={lang}>{children}</div>;
}
