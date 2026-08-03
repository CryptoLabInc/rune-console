import { TEAM_MEMBER_ROLE } from "@/constants/apiConstants";
import type { TDropdownOption } from "@/types/commonTypes";

/** Team name rule: digits, Hangul, Latin letters, and - _ only. */
export const TEAM_NAME_PATTERN = /^[0-9A-Za-z가-힣_-]+$/;

export const TEAM_NAME_RULE_TEXT =
  "숫자·한글·영어와 - _ 만 사용할 수 있습니다.";

/** Grantable member roles (Admin is console-account only — API §0). */
export const ROLE_OPTIONS: TDropdownOption[] = [
  { value: TEAM_MEMBER_ROLE.edit, label: TEAM_MEMBER_ROLE.edit },
  { value: TEAM_MEMBER_ROLE.write, label: TEAM_MEMBER_ROLE.write },
  { value: TEAM_MEMBER_ROLE.read, label: TEAM_MEMBER_ROLE.read },
];
