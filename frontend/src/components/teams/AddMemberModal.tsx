import { useState } from "react";

import Button from "@/components/elements/Button";
import Dropdown from "@/components/elements/Dropdown";
import Input from "@/components/elements/Input";
import MemberStatus from "@/components/elements/MemberStatus";
import Notice from "@/components/elements/Notice";
import ModalLayout from "@/components/layout/ModalLayout";
import { EMAIL_FORMAT_ERROR, EMAIL_PATTERN } from "@/utils/email";
import {
  isSubmittableUsername,
  normalizeUsernameInput,
  USERNAME_MAX_LENGTH,
  validateUsername,
} from "@/utils/username";
import {
  BTN_TEXT,
  INPUT_LABELS,
  MODAL_TITLES,
  PLACEHOLDERS,
} from "@/constants/commonConstants";
import { MODAL_STYLE_VAR } from "@/constants/styleConstants";
import { ROLE_OPTIONS } from "@/constants/teamConstants";

interface AddMemberModalProps {
  teamName: string;
  /** Server-mapped error copy from the last failed invite attempt (409
      ALREADY_TEAM_MEMBER and friends) — null/undefined renders nothing. */
  error?: string | null;
  onClose: () => void;
  onInvite: (account: string, role: string, username: string) => void;
}

/**
 * AddMemberModal is the 멤버 추가 modal (SC-10): account email +
 * username + role. Already-member detection is the server's call (409
 * ALREADY_TEAM_MEMBER) — this component only renders whatever error
 * the caller maps from the failed mutation. Mount conditionally.
 */
const AddMemberModal = ({
  teamName,
  error,
  onClose,
  onInvite,
}: AddMemberModalProps) => {
  const [account, setAccount] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  const trimmed = account.trim();
  const invalidFormat = trimmed.length > 0 && !EMAIL_PATTERN.test(trimmed);
  const usernameError = validateUsername(username);
  const canSubmit =
    trimmed.length > 0 &&
    !invalidFormat &&
    isSubmittableUsername(username) &&
    role !== "";

  return (
    <ModalLayout title={MODAL_TITLES.addMember(teamName)} isOpen isWide>
      <div className="flex w-full flex-col gap-6">
        <Input
          id="add-member-account"
          labelText={INPUT_LABELS.emailAccount}
          type="email"
          placeholder={PLACEHOLDERS.emailExample}
          maxLength={100}
          value={account}
          setValue={setAccount}
          error={invalidFormat ? EMAIL_FORMAT_ERROR : undefined}
        />
        <Input
          id="add-member-username"
          labelText={INPUT_LABELS.username}
          placeholder={PLACEHOLDERS.username}
          maxLength={USERNAME_MAX_LENGTH}
          value={username}
          setValue={(value) => setUsername(normalizeUsernameInput(value))}
          error={usernameError}
        />
        <Dropdown
          label="권한 (role)"
          placeholder={PLACEHOLDERS.selectRole}
          options={ROLE_OPTIONS}
          value={role}
          onChange={setRole}
        />
        <Notice tone="info">
          초대받은 사용자가 rune을 연결하면{" "}
          <MemberStatus
            status="online"
            className="bg-mint/10 h-auto cursor-default gap-1 rounded-sm px-1.5 py-0.5 align-middle"
          />
          으로 전환됩니다.
        </Notice>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
      <div className={MODAL_STYLE_VAR.footer}>
        <Button
          btnText={BTN_TEXT.cancel}
          btnSize="md"
          btnColor="grayOutline"
          handleClick={onClose}
        />
        <Button
          btnText={BTN_TEXT.invite}
          btnSize="md"
          btnColor="mintFilled"
          disabled={!canSubmit}
          handleClick={() => onInvite(trimmed, role, username.trim())}
        />
      </div>
    </ModalLayout>
  );
};

export default AddMemberModal;
