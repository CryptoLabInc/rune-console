/** Email (account) field rules — shared by the invite form (SC-12) and the
 * team add-member form (SC-06), mirroring the username.ts convention of
 * keeping a field's pattern and its validation copy together. */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMAIL_FORMAT_ERROR = "올바른 이메일 형식이 아닙니다.";
