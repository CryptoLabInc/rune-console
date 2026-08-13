/**
 * Wire timestamps are UTC ISO strings; the console renders every visible
 * time in KST (Asia/Seoul, UTC+9 — no DST) so all screens read in the
 * operator's local zone regardless of the browser's.
 */

const KST_TIME_ZONE = "Asia/Seoul";

/* Constructed once at module load — Intl.DateTimeFormat construction is
   one of the costlier Intl operations and these run in every table cell
   on every render; the options never change. */
const KST_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: KST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Break an ISO instant into zero-padded KST calendar parts. */
const kstParts = (iso: string): Record<string, string> => {
  const parts: Record<string, string> = {};
  for (const { type, value } of KST_FORMATTER.formatToParts(new Date(iso))) {
    parts[type] = value;
  }
  return parts;
};

/** "2026-07-07T08:12:00Z" → "2026-07-07" (KST); null → "—". */
export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const p = kstParts(iso);
  return `${p.year}-${p.month}-${p.day}`;
};

/** "2026-07-07T08:12:00Z" → "2026-07-07 17:12" (KST); null → "—". */
export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const p = kstParts(iso);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
};
