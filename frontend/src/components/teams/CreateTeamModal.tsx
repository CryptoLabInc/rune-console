import { useState } from "react";

import Button from "@/components/elements/Button";
import Dropdown from "@/components/elements/Dropdown";
import Input from "@/components/elements/Input";
import Notice from "@/components/elements/Notice";
import ModalLayout from "@/components/layout/ModalLayout";
import { buildTeamOptions } from "@/utils/buildTeamOptions";
import {
  BTN_TEXT,
  MODAL_TITLES,
  PLACEHOLDERS,
} from "@/constants/commonConstants";
import { MODAL_STYLE_VAR } from "@/constants/styleConstants";
import { TEAM_NAME_PATTERN } from "@/constants/teamConstants";
import type { TTeamTree } from "@/types/teamTypes";
import { L } from "@/locales";

interface CreateTeamModalProps {
  /** Real GET /teams/tree result — feeds the parent-team picker and the
      client-side sibling-name dup hint. */
  teams: TTeamTree;
  /** Server-mapped error copy from the last failed create attempt
      (409 TEAM_NAME_DUPLICATE and friends) — null/undefined renders
      nothing. */
  error?: string | null;
  onClose: () => void;
  onCreate: (name: string, parentId: string | null) => void;
}

/**
 * CreateTeamModal is the 새 팀 만들기 modal (SC-07): team name + optional
 * parent team; picking a parent copies its members/roles downward (R1).
 * Mount conditionally — state resets by unmounting.
 */
const CreateTeamModal = ({
  teams,
  error,
  onClose,
  onCreate,
}: CreateTeamModalProps) => {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");

  const trimmed = name.trim();
  const isInvalidFormat =
    trimmed.length > 0 && !TEAM_NAME_PATTERN.test(trimmed);

  const isDuplicate = teams.some(
    (team) => team.parentId === (parentId || null) && team.name === trimmed,
  );
  const canSubmit = trimmed.length > 0 && !isInvalidFormat && !isDuplicate;

  const nameError = isInvalidFormat
    ? L.teams.teamNameRule
    : trimmed && isDuplicate
      ? L.teams.dupName
      : undefined;

  return (
    <ModalLayout title={MODAL_TITLES.createTeam} isOpen>
      <div className={MODAL_STYLE_VAR.body}>
        <Input
          id="create-team-name"
          labelText={L.teams.teamName}
          placeholder={L.teams.teamNamePlaceholder}
          maxLength={50}
          value={name}
          setValue={setName}
          hint={L.teams.teamNameRule}
          error={nameError}
        />
        <Dropdown
          label={L.teams.parentTeamOptional}
          placeholder={PLACEHOLDERS.selectTeam}
          options={buildTeamOptions(teams)}
          value={parentId}
          onChange={setParentId}
        />
        <Notice tone="info">
          {L.teams.parentCopyInfo1} <br />
          {L.teams.parentCopyInfo2}
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
          btnText={BTN_TEXT.create}
          btnSize="md"
          btnColor="mintFilled"
          disabled={!canSubmit}
          handleClick={() => onCreate(trimmed, parentId || null)}
        />
      </div>
    </ModalLayout>
  );
};

export default CreateTeamModal;
