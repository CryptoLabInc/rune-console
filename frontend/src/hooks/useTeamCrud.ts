import { useState } from "react";

import {
  useCreateTeamMutation,
  useDeleteTeamMutation,
  useRenameTeamMutation,
} from "@/hooks/mutations/useTeamMutations";
import { parseErrorCode } from "@/api/parseError";
import { useNoticeStore } from "@/state/store/noticeStore";
import { TEAM_REASON } from "@/constants/errorConstants";
import { NOTICE_TEXT } from "@/constants/noticeConstants";
import { L } from "@/locales";

interface UseTeamCrudOptions {
  /** Rename/delete target — pass "" when only the create flow is used
      (the mutations are lazy, so an unused id never fires). */
  teamId: string;
  /** Close the owning modal after a successful mutation. */
  onDone: () => void;
  /** Post-delete hand-off (SC-08 — reselect another root team). */
  onDeleted?: () => void;
}

/**
 * useTeamCrud owns the team create/rename/delete orchestration shared by
 * TreeDetailView (SC-07~09) and TeamsPage's empty-state create (SC-06 B):
 * one TEAM_REASON error mapping into the modals' inline error, one
 * success-notice wiring. teamError is reset on every attempt; callers
 * clear it when opening/closing a modal so a stale error never leaks
 * into a fresh one.
 */
export const useTeamCrud = ({
  teamId,
  onDone,
  onDeleted,
}: UseTeamCrudOptions) => {
  const [teamError, setTeamError] = useState<string | null>(null);
  const createTeam = useCreateTeamMutation();
  const renameTeam = useRenameTeamMutation(teamId);
  const deleteTeam = useDeleteTeamMutation(teamId);
  const showNotice = useNoticeStore((state) => state.showNotice);

  const clearTeamError = () => setTeamError(null);

  const handleCreate = (name: string, parentId: string | null) => {
    setTeamError(null);
    createTeam.mutate(
      { name, parentId },
      {
        onSuccess: () => {
          onDone();
          showNotice(
            NOTICE_TEXT.createTeam.title,
            NOTICE_TEXT.createTeam.success,
            "success",
          );
        },
        onError: async (res) => {
          const code = await parseErrorCode(res);
          setTeamError(TEAM_REASON[code] ?? L.teams.createTeamFailed);
        },
      },
    );
  };

  const handleRename = (name: string) => {
    setTeamError(null);
    renameTeam.mutate(
      { name },
      {
        onSuccess: () => {
          onDone();
          showNotice(
            NOTICE_TEXT.renameTeam.title,
            NOTICE_TEXT.renameTeam.success,
            "success",
          );
        },
        onError: async (res) => {
          const code = await parseErrorCode(res);
          setTeamError(TEAM_REASON[code] ?? L.teams.renameFailed);
        },
      },
    );
  };

  const handleDelete = (
    action: "purge" | "transfer",
    targetTeamId?: string,
  ) => {
    setTeamError(null);
    deleteTeam.mutate(
      { memoryAction: action, targetTeamId },
      {
        onSuccess: () => {
          onDone();
          showNotice(
            NOTICE_TEXT.deleteTeam.title,
            NOTICE_TEXT.deleteTeam.success,
            "success",
            onDeleted,
          );
        },
        onError: async (res) => {
          const code = await parseErrorCode(res);
          setTeamError(TEAM_REASON[code] ?? L.teams.deleteFailed);
        },
      },
    );
  };

  return {
    teamError,
    clearTeamError,
    handleCreate,
    handleRename,
    handleDelete,
  };
};
