import { env } from "@nrc-full/env/web";

const API_BASE = `${env.VITE_SERVER_URL}/api/sync/v1/admin`;

export type SyncReviewMode = "AUTO_ACCEPT" | "MANUAL_REVIEW";
export type SyncScheduleOwner = "WEB" | "LOCAL_APP";
export type SyncPushResourceType =
  | "inspection_schedule"
  | "inspection_results"
  | "match_schedule"
  | "match_results"
  | "team_rankings"
  | "team_awards";

export const SYNC_PUSH_RESOURCE_TYPES: SyncPushResourceType[] = [
  "inspection_schedule",
  "inspection_results",
  "match_schedule",
  "match_results",
  "team_rankings",
  "team_awards",
];

export interface SyncClientDto {
  canCopy: boolean;
  createdAt: string;
  expiresAt: string | null;
  id: string;
  isActive: boolean;
  isRevoked: boolean;
  lastUsedAt: string | null;
  machineSecret: string | null;
  name: string;
  revokedAt: string | null;
  revokedReason: string | null;
  secret: {
    expiresAt: string | null;
    id: string;
    isActive: boolean;
    lastUsedAt: string | null;
    revokedAt: string | null;
    tokenPrefix: string;
  } | null;
  tokenPrefix: string | null;
}

export interface SyncPolicyDto {
  allowedPushResources: SyncPushResourceType[];
  eventKey: string;
  id: string;
  isSyncEnabled: boolean;
  reviewMode: SyncReviewMode;
  scheduleOwner: SyncScheduleOwner;
}

export interface SyncBatchDto {
  batchId: string;
  id: string;
  receivedAt: string;
  reviewedAt: string | null;
  schemaVersion: string;
  source: { appVersion: string; databaseId?: string; deviceId?: string } | null;
  status: "validated" | "applied" | "pending_review" | "duplicate" | "rejected" | "failed";
  warnings: Array<{ code: string; message: string; recordKey?: string; resourceType?: string }> | null;
}

export interface SyncBatchDetailDto {
  batch: SyncBatchDto;
  changeSet: {
    id: string;
    publishedAt: string | null;
    status: SyncBatchDto["status"];
    summary: {
      addedCount: number;
      modifiedCount: number;
      removedCount: number;
      resourceTypes: SyncPushResourceType[];
    } | null;
  } | null;
  resources: Array<{
    id: string;
    mode: string;
    recordCount: number;
    resourceType: SyncPushResourceType;
    schemaRef: string | null;
  }>;
  stagedItems: Array<{
    id: string;
    operation: string;
    recordKey: string;
    resourceType: SyncPushResourceType;
  }>;
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Sync request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const syncAdminApi = {
  createClient: (season: string, eventCode: string, input: { expiresAt?: string | null; name: string }) =>
    request<{ clientId: string; machineSecret: string }>(
      `/seasons/${season}/events/${eventCode}/clients`,
      {
        body: JSON.stringify(input),
        method: "POST",
      },
    ),
  getBatch: (pushBatchId: string) => request<SyncBatchDetailDto>(`/batches/${pushBatchId}`),
  getPolicy: (season: string, eventCode: string) =>
    request<SyncPolicyDto>(`/seasons/${season}/events/${eventCode}/policy`),
  listBatches: (season: string, eventCode: string) =>
    request<{ batches: SyncBatchDto[] }>(`/seasons/${season}/events/${eventCode}/batches`),
  listClients: (season: string, eventCode: string) =>
    request<{ clients: SyncClientDto[] }>(`/seasons/${season}/events/${eventCode}/clients`),
  reviewBatch: (changeSetId: string, input: { decision: "APPROVED" | "REJECTED"; reason?: string | null }) =>
    request(`/batches/${changeSetId}/review`, {
      body: JSON.stringify(input),
      method: "POST",
    }),
  revokeClient: (clientId: string, reason?: string | null) =>
    request(`/clients/${clientId}/revoke`, {
      body: JSON.stringify({ reason }),
      method: "POST",
    }),
  updatePolicy: (
    season: string,
    eventCode: string,
    input: Partial<Pick<SyncPolicyDto, "allowedPushResources" | "isSyncEnabled" | "reviewMode" | "scheduleOwner">>,
  ) =>
    request<SyncPolicyDto>(`/seasons/${season}/events/${eventCode}/policy`, {
      body: JSON.stringify(input),
      method: "POST",
    }),
};
