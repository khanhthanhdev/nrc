export const syncOpenApiDocument = {
  info: {
    title: "NRC Sync API",
    version: "1.0.0",
  },
  openapi: "3.1.0",
  paths: {
    "/api/sync/v1/admin/batches/{changeSetId}/review": {
      post: { summary: "Review a pending sync change set" },
    },
    "/api/sync/v1/admin/batches/{pushBatchId}": { get: { summary: "Get sync batch detail" } },
    "/api/sync/v1/admin/clients/{clientId}/revoke": { post: { summary: "Revoke a sync client" } },
    "/api/sync/v1/admin/seasons/{season}/events/{eventCode}/batches": {
      get: { summary: "List sync batches" },
    },
    "/api/sync/v1/admin/seasons/{season}/events/{eventCode}/clients": {
      get: { summary: "List sync clients" },
      post: { summary: "Create sync client" },
    },
    "/api/sync/v1/admin/seasons/{season}/events/{eventCode}/policy": {
      get: { summary: "Get sync policy" },
      post: { summary: "Update sync policy" },
    },
    "/api/sync/v1/machine/bootstrap": { get: { summary: "Bootstrap local event data" } },
    "/api/sync/v1/machine/push": { post: { summary: "Push local event data" } },
  },
};
