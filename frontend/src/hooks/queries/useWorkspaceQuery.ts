import { useQuery } from "@tanstack/react-query";

import { getWorkspace } from "@/api/workspaceAPIs";
import { WORKSPACE_STATUS } from "@/constants/apiConstants";
import { QUERY_KEYS } from "@/constants/commonConstants";
import type {
  TWorkspace,
  TWorkspaceStatus,
  TWorkspaceWire,
} from "@/types/workspaceTypes";

/** How often to re-poll GET /workspace while a phase is mid-transition. */
const POLL_MS = 10000;

/** Phases mid-transition — the query keeps polling while the workspace sits here. */
export const isTransitionalStatus = (status: TWorkspaceStatus): boolean =>
  status === WORKSPACE_STATUS.provisioning ||
  status === WORKSPACE_STATUS.stopping ||
  status === WORKSPACE_STATUS.starting ||
  status === WORKSPACE_STATUS.deleting;

/**
 * useWorkspaceQuery reads the singular workspace (SC-02). A 404 means "no
 * workspace" and resolves to null — not an error; any other non-OK response
 * throws the Response (→ state D-2 불러오기 실패). While the phase is
 * transitional it polls, so the async create/stop/start/delete operations
 * settle on their own.
 */
export const useWorkspaceQuery = () =>
  useQuery<TWorkspace | null, Response>({
    queryKey: [QUERY_KEYS.workspace],
    queryFn: async () => {
      const res = await getWorkspace();
      if (res.status === 404) return null;
      if (!res.ok) throw res;
      const data = (await res.json()) as TWorkspaceWire;
      return {
        status: data.phase,
        endpoint: data.endpointUrl,
        rowCount: data.rows,
        orphaned: data.orphaned ?? false,
        reconnectRequired: data.reconnect ?? false,
      };
    },
    refetchInterval: (query) => {
      const w = query.state.data;
      return w && isTransitionalStatus(w.status) ? POLL_MS : false;
    },
  });
