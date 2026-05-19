import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Copy, KeyRound, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  syncAdminApi,
  SYNC_PUSH_RESOURCE_TYPES,
  type SyncBatchDto,
  type SyncPolicyDto,
  type SyncPushResourceType,
} from "@/features/sync/admin-sync-api";
import { useRequireAdmin } from "@/lib/route-guards";
import { useAuthSession } from "@/utils/auth-session-context";
import { orpc } from "@/utils/orpc";

const formatDate = (value: string | null | undefined) =>
  value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Never";

const eventSyncKey = (season?: string, eventCode?: string) => ["staff-sync", season, eventCode];

const useSelectedEvent = (enabled: boolean) => {
  const eventsQuery = useQuery({
    ...orpc.event.listAdminEvents.queryOptions(),
    enabled,
    retry: false,
  });
  const [selectedKey, setSelectedKey] = useState("");

  useEffect(() => {
    if (!selectedKey && eventsQuery.data?.[0]) {
      setSelectedKey(`${eventsQuery.data[0].season}/${eventsQuery.data[0].eventCode}`);
    }
  }, [eventsQuery.data, selectedKey]);

  const selectedEvent = useMemo(
    () => eventsQuery.data?.find((event) => `${event.season}/${event.eventCode}` === selectedKey),
    [eventsQuery.data, selectedKey],
  );

  return { eventsQuery, selectedEvent, selectedKey, setSelectedKey };
};

const ApiKeyPanel = ({ eventCode, season }: { eventCode: string; season: string }) => {
  const queryClient = useQueryClient();
  const [clientName, setClientName] = useState("Local scoring console");
  const [latestSecret, setLatestSecret] = useState<string | null>(null);
  const clientsQuery = useQuery({
    queryFn: () => syncAdminApi.listClients(season, eventCode),
    queryKey: [...eventSyncKey(season, eventCode), "clients"],
  });
  const activeClient = clientsQuery.data?.clients.find((client) => client.isActive && !client.isRevoked);

  const refreshClients = async () => {
    await queryClient.invalidateQueries({ queryKey: [...eventSyncKey(season, eventCode), "clients"] });
  };

  const createClient = useMutation({
    mutationFn: () => syncAdminApi.createClient(season, eventCode, { name: clientName }),
    onSuccess: async (result) => {
      setLatestSecret(result.machineSecret);
      await refreshClients();
      toast.success("Sync API key generated.");
    },
  });

  const revokeClient = useMutation({
    mutationFn: (clientId: string) => syncAdminApi.revokeClient(clientId, "Revoked from staff sync console."),
    onSuccess: async () => {
      setLatestSecret(null);
      await refreshClients();
      toast.success("Sync API key revoked.");
    },
  });

  const copySecret = async (secret: string | null | undefined) => {
    if (!secret) {
      return;
    }
    await navigator.clipboard.writeText(secret);
    toast.success("API key copied.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" /> Event API key
        </CardTitle>
        <CardDescription>One active machine key is allowed per event. Generating a new key revokes the previous one.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input value={clientName} onChange={(event) => setClientName(event.target.value)} aria-label="Client name" />
          <Button onClick={() => createClient.mutate()} disabled={createClient.isPending || !clientName.trim()}>
            <RefreshCw className="size-4" /> {activeClient ? "Rotate key" : "Generate key"}
          </Button>
        </div>

        {latestSecret ? (
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
            <p className="mb-2 text-xs font-medium">New key</p>
            <div className="flex min-w-0 items-center gap-2">
              <code className="min-w-0 flex-1 overflow-hidden text-ellipsis rounded bg-background px-2 py-2 text-xs">{latestSecret}</code>
              <Button size="icon-sm" variant="outline" onClick={() => copySecret(latestSecret)} aria-label="Copy new key">
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsQuery.data?.clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <Badge variant={client.isActive && !client.isRevoked ? "default" : "secondary"}>
                      {client.isActive && !client.isRevoked ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell><code>{client.tokenPrefix ?? "-"}</code></TableCell>
                  <TableCell>{formatDate(client.lastUsedAt ?? client.secret?.lastUsedAt)}</TableCell>
                  <TableCell>{formatDate(client.expiresAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon-sm" variant="outline" disabled={!client.canCopy} onClick={() => copySecret(client.machineSecret)} aria-label="Copy key">
                        <Copy className="size-4" />
                      </Button>
                      <Button size="icon-sm" variant="destructive" disabled={!client.isActive || revokeClient.isPending} onClick={() => revokeClient.mutate(client.id)} aria-label="Revoke key">
                        <X className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!clientsQuery.data?.clients.length ? (
                <TableRow><TableCell colSpan={6} className="text-muted-foreground">No sync keys for this event.</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const PolicyPanel = ({ eventCode, season }: { eventCode: string; season: string }) => {
  const queryClient = useQueryClient();
  const policyQuery = useQuery({
    queryFn: () => syncAdminApi.getPolicy(season, eventCode),
    queryKey: [...eventSyncKey(season, eventCode), "policy"],
  });
  const updatePolicy = useMutation({
    mutationFn: (input: Partial<SyncPolicyDto>) => syncAdminApi.updatePolicy(season, eventCode, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...eventSyncKey(season, eventCode), "policy"] });
      toast.success("Sync policy updated.");
    },
  });
  const policy = policyQuery.data;

  const toggleResource = (resource: SyncPushResourceType, checked: boolean) => {
    const current = new Set(policy?.allowedPushResources ?? []);
    if (checked) {
      current.add(resource);
    } else {
      current.delete(resource);
    }
    updatePolicy.mutate({ allowedPushResources: [...current] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4" /> Sync policy</CardTitle>
        <CardDescription>Controls local app push behavior for the selected event.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="sync-enabled">Sync enabled</Label>
          <Switch id="sync-enabled" checked={Boolean(policy?.isSyncEnabled)} disabled={!policy} onCheckedChange={(checked) => updatePolicy.mutate({ isSyncEnabled: checked })} />
        </div>
        <div className="space-y-2">
          <Label>Schedule owner</Label>
          <NativeSelect value={policy?.scheduleOwner ?? "WEB"} disabled={!policy} onChange={(event) => updatePolicy.mutate({ scheduleOwner: event.target.value as SyncPolicyDto["scheduleOwner"] })}>
            <option value="WEB">Web</option>
            <option value="LOCAL_APP">Local app</option>
          </NativeSelect>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {SYNC_PUSH_RESOURCE_TYPES.map((resource) => (
            <label key={resource} className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <Checkbox checked={policy?.allowedPushResources.includes(resource) ?? false} disabled={!policy} onCheckedChange={(checked) => toggleResource(resource, checked === true)} />
              <span>{resource.replaceAll("_", " ")}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const BatchPanel = ({ eventCode, season }: { eventCode: string; season: string }) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const batchesQuery = useQuery({
    queryFn: () => syncAdminApi.listBatches(season, eventCode),
    queryKey: [...eventSyncKey(season, eventCode), "batches"],
  });
  const detailQuery = useQuery({
    enabled: Boolean(selectedBatchId),
    queryFn: () => syncAdminApi.getBatch(selectedBatchId!),
    queryKey: [...eventSyncKey(season, eventCode), "batch", selectedBatchId],
  });
  const detail = detailQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch history</CardTitle>
        <CardDescription>Inspect local app pushes and review pending change sets.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Warnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchesQuery.data?.batches.map((batch: SyncBatchDto) => (
                <TableRow key={batch.id} className="cursor-pointer" onClick={() => setSelectedBatchId(batch.id)}>
                  <TableCell className="font-medium">{batch.batchId}</TableCell>
                  <TableCell><Badge variant={batch.status === "failed" || batch.status === "rejected" ? "destructive" : "secondary"}>{batch.status}</Badge></TableCell>
                  <TableCell>{formatDate(batch.receivedAt)}</TableCell>
                  <TableCell>{batch.warnings?.length ?? 0}</TableCell>
                </TableRow>
              ))}
              {!batchesQuery.data?.batches.length ? (
                <TableRow><TableCell colSpan={4} className="text-muted-foreground">No batches received.</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
        <div className="rounded-md border p-4">
          {detail ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{detail.batch.batchId}</p>
                <p className="text-muted-foreground text-xs">{detail.batch.schemaVersion} · {formatDate(detail.batch.receivedAt)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded border p-2"><p className="font-medium">{detail.changeSet?.summary?.addedCount ?? 0}</p><p className="text-muted-foreground">Added</p></div>
                <div className="rounded border p-2"><p className="font-medium">{detail.changeSet?.summary?.modifiedCount ?? 0}</p><p className="text-muted-foreground">Changed</p></div>
                <div className="rounded border p-2"><p className="font-medium">{detail.changeSet?.summary?.removedCount ?? 0}</p><p className="text-muted-foreground">Removed</p></div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium">Resources</p>
                <div className="space-y-1">
                  {detail.resources.map((resource) => (
                    <div key={resource.id} className="flex justify-between rounded bg-muted px-2 py-1 text-xs">
                      <span>{resource.resourceType.replaceAll("_", " ")}</span>
                      <span>{resource.recordCount}</span>
                    </div>
                  ))}
                </div>
              </div>
              {detail.batch.warnings?.length ? (
                <div>
                  <p className="mb-2 text-xs font-medium">Warnings</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {detail.batch.warnings.map((warning) => <p key={`${warning.code}-${warning.recordKey ?? ""}`}>{warning.code}: {warning.message}</p>)}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Select a batch to inspect resources, warnings, and review state.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const StaffSyncPage = () => {
  const navigate = useNavigate();
  const session = useAuthSession();
  useRequireAdmin(session);
  const { eventsQuery, selectedEvent, selectedKey, setSelectedKey } = useSelectedEvent(
    Boolean(session.data),
  );

  if (session.isPending) {
    return <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">Loading sync console...</div>;
  }
  if (!session.data) {
    void navigate({ to: "/{-$locale}/auth" });
    return <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">Redirecting to sign in...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Staff</p>
          <h1 className="text-2xl font-semibold">Sync console</h1>
          <p className="text-muted-foreground text-sm">Manage event machine access, push policy, and sync review queues.</p>
        </div>
        <div className="min-w-72 space-y-2">
          <Label>Event</Label>
          <NativeSelect value={selectedKey} disabled={eventsQuery.isLoading} onChange={(event) => setSelectedKey(event.target.value)}>
            {eventsQuery.data?.map((event) => (
              <option key={event.id} value={`${event.season}/${event.eventCode}`}>{event.season} · {event.name}</option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {selectedEvent ? (
        <div className="space-y-6">
          <ApiKeyPanel season={selectedEvent.season} eventCode={selectedEvent.eventCode} />
          <PolicyPanel season={selectedEvent.season} eventCode={selectedEvent.eventCode} />
          <BatchPanel season={selectedEvent.season} eventCode={selectedEvent.eventCode} />
        </div>
      ) : (
        <Card><CardContent className="py-8 text-muted-foreground">No event available for sync administration.</CardContent></Card>
      )}
    </div>
  );
};

export const Route = createFileRoute("/{-$locale}/staff/sync")({
  component: StaffSyncPage,
});
