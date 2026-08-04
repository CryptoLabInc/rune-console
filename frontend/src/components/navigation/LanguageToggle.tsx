import { Globe } from "lucide-react";

import { getLanguage, setLanguage } from "@/locales";

/**
 * LanguageToggle is the always-visible navbar language switch (globe + label,
 * the top-right convention users scan for). The label names the language it
 * switches TO, in that language's own script, so a user stuck in the wrong
 * language can still recognize the way out. setLanguage switches i18next in
 * place (no reload — LocaleProvider re-renders). Reads getLanguage() at render
 * (not the load-time const) so after a switch it offers the other direction.
 */
const LanguageToggle = () => {
  const nextLanguage = getLanguage() === "ko" ? "en" : "ko";
  const nextLanguageLabel = getLanguage() === "ko" ? "English" : "한국어";

  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm"
      onClick={() => setLanguage(nextLanguage)}
    >
      <Globe className="size-4" aria-hidden="true" />
      {nextLanguageLabel}
    </button>
  );
};

export default LanguageToggle;
