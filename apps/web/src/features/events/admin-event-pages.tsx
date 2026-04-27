import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  Megaphone,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import type {
  AdminEventAnnouncement,
  AdminCurrentSeasonData,
  AdminEventDetailData,
  AdminEventDocument,
  AdminEventListData,
  AdminRegistrationFormVersion,
} from "./types";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { client, orpc } from "@/utils/orpc";

type EventStatus =
  | "draft"
  | "published"
  | "registration_open"
  | "registration_closed"
  | "active"
  | "completed"
  | "archived";

interface EventFormState {
  description: string;
  eventCode: string;
  eventEndsAt: string;
  eventStartsAt: string;
  location: string;
  maxParticipants: string;
  name: string;
  registrationEndsAt: string;
  registrationStartsAt: string;
  season: string;
  status: EventStatus;
  summary: string;
  timezone: string;
  venue: string;
}

interface DocumentDraft {
  id?: string;
  isPublic: boolean;
  kind: string;
  sortOrder: string;
  title: string;
  url: string;
}

interface AnnouncementDraft {
  body: string;
  id?: string;
  isPinned: boolean;
  publishedAt: string;
  title: string;
}

const EVENT_STATUSES: EventStatus[] = [
  "draft",
  "published",
  "registration_open",
  "registration_closed",
  "active",
  "completed",
  "archived",
];

const emptyEventForm = (): EventFormState => ({
  description: "",
  eventCode: "",
  eventEndsAt: "",
  eventStartsAt: "",
  location: "",
  maxParticipants: "",
  name: "",
  registrationEndsAt: "",
  registrationStartsAt: "",
  season: "",
  status: "draft",
  summary: "",
  timezone: "Asia/Ho_Chi_Minh",
  venue: "",
});

const emptyDocumentDraft = (): DocumentDraft => ({
  isPublic: true,
  kind: "",
  sortOrder: "0",
  title: "",
  url: "",
});

const emptyAnnouncementDraft = (): AnnouncementDraft => ({
  body: "",
  isPinned: false,
  publishedAt: toDateTimeLocalValue(new Date().toISOString()),
  title: "",
});

const normalizeEventCode = (value: string): string =>
  value
    .toUpperCase()
    .replaceAll(/[^A-Z0-9_-]/g, "")
    .slice(0, 50);

const toDateTimeLocalValue = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
};

const toIsoDateTime = (value: string): string => new Date(value).toISOString();

const normalizeOptionalText = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseSortOrder = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const statusClassName = (status: EventStatus): string => {
  switch (status) {
    case "registration_open": {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    case "registration_closed": {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    case "active": {
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    }
    case "completed": {
      return "border-violet-200 bg-violet-50 text-violet-700";
    }
    case "published": {
      return "border-sky-200 bg-sky-50 text-sky-700";
    }
    default: {
      return "border-slate-200 bg-slate-100 text-slate-700";
    }
  }
};

const formFromDetail = (data: AdminEventDetailData): EventFormState => ({
  description: data.event.description ?? "",
  eventCode: data.event.eventCode,
  eventEndsAt: toDateTimeLocalValue(data.event.eventEndsAt),
  eventStartsAt: toDateTimeLocalValue(data.event.eventStartsAt),
  location: data.event.location ?? "",
  maxParticipants: data.event.maxParticipants ? String(data.event.maxParticipants) : "",
  name: data.event.name,
  registrationEndsAt: toDateTimeLocalValue(data.event.registrationEndsAt),
  registrationStartsAt: toDateTimeLocalValue(data.event.registrationStartsAt),
  season: data.event.season,
  status: data.event.status,
  summary: data.event.summary ?? "",
  timezone: data.event.timezone ?? "Asia/Ho_Chi_Minh",
  venue: data.event.venue ?? "",
});

const eventPayloadFromForm = (form: EventFormState) => ({
  description: normalizeOptionalText(form.description),
  eventCode: form.eventCode.trim(),
  eventEndsAt: toIsoDateTime(form.eventEndsAt),
  eventStartsAt: toIsoDateTime(form.eventStartsAt),
  location: normalizeOptionalText(form.location),
  maxParticipants: parseOptionalNumber(form.maxParticipants),
  name: form.name.trim(),
  registrationEndsAt: form.registrationEndsAt ? toIsoDateTime(form.registrationEndsAt) : null,
  registrationStartsAt: form.registrationStartsAt ? toIsoDateTime(form.registrationStartsAt) : null,
  season: form.season.trim(),
  status: form.status,
  summary: normalizeOptionalText(form.summary),
  timezone: normalizeOptionalText(form.timezone),
  venue: normalizeOptionalText(form.venue),
});

const getCurrentSeasonDescription = (season: AdminCurrentSeasonData): string =>
  `${season.year} · ${season.gameCode} · ${season.theme}`;

export function AdminEventListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="nrc-card space-y-4 px-6 py-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-full max-w-3xl" />
      </div>
      <div className="nrc-card space-y-4 px-6 py-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-12 w-full" key={`event-list-skeleton-${index}`} />
        ))}
      </div>
    </div>
  );
}

export function AdminEventListPage({
  error,
  events,
  isLoading,
  onRetry,
}: {
  error: Error | null;
  events: AdminEventListData | undefined;
  isLoading: boolean;
  onRetry: () => void | Promise<void>;
}) {
  if (isLoading) {
    return <AdminEventListSkeleton />;
  }

  if (error) {
    return (
      <AdminEventState
        action="Retry"
        description="Event list could not be loaded."
        icon={<Search />}
        onAction={onRetry}
        title="Events unavailable"
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="nrc-card overflow-hidden px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Admin only
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">Events</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              Manage season-scoped event pages, documents, announcements, and registration form
              versions.
            </p>
          </div>

          <Button asChild>
            <Link to="/staff/events/new">
              <Plus />
              Create event
            </Link>
          </Button>
        </div>
      </section>

      {!events || events.length === 0 ? (
        <AdminEventState
          action="Create event"
          actionTo="/staff/events/new"
          description="Create the first event under an existing season."
          icon={<CalendarDays />}
          title="No events yet"
        />
      ) : (
        <Card className="nrc-card">
          <CardHeader className="border-b border-border">
            <CardTitle>Event records</CardTitle>
            <CardDescription>Public event URLs use season and event code.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-normal">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{event.name}</p>
                        <p className="text-xs text-muted-foreground">
                          /{event.season}/{event.eventCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{event.season}</TableCell>
                    <TableCell>
                      <Badge className={cn("border-transparent", statusClassName(event.status))}>
                        {event.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(event.eventStartsAt).toLocaleDateString()}</TableCell>
                    <TableCell>{event.venue ?? event.location ?? "TBD"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            params={{ eventId: event.eventCode, season: event.season }}
                            to="/$season/$eventId"
                          >
                            <ExternalLink />
                            Public
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link
                            params={{ eventRecordId: event.id }}
                            to="/staff/events/$eventRecordId/edit"
                          >
                            <PencilLine />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function AdminEventCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventFormState>(emptyEventForm);
  const [formError, setFormError] = useState<string | null>(null);
  const currentSeasonQuery = useQuery({
    ...orpc.season.getCurrentAdminSeason.queryOptions(),
    retry: false,
  });

  useEffect(() => {
    if (!currentSeasonQuery.data?.year) {
      return;
    }

    setForm((current) =>
      current.season === currentSeasonQuery.data.year
        ? current
        : {
            ...current,
            season: currentSeasonQuery.data.year,
          },
    );
  }, [currentSeasonQuery.data?.year]);

  const createMutation = useMutation({
    mutationFn: async () => client.event.createEvent(eventPayloadFromForm(form)),
    onError: (error) => {
      const message = getErrorMessage(error, "Event could not be created.");
      setFormError(message);
      toast.error(message);
    },
    onSuccess: async (createdEvent) => {
      setFormError(null);
      toast.success("Event created.");
      await queryClient.invalidateQueries({
        queryKey: orpc.event.listAdminEvents.queryOptions().queryKey,
      });
      await navigate({
        params: { eventRecordId: createdEvent.event.id },
        to: "/staff/events/$eventRecordId/edit",
      });
    },
  });

  return (
    <EventFormPage
      currentSeason={currentSeasonQuery.data}
      currentSeasonError={currentSeasonQuery.error?.message ?? null}
      error={formError}
      form={form}
      isSaving={createMutation.isPending}
      onChange={setForm}
      onSubmit={() => {
        setFormError(null);
        createMutation.mutate();
      }}
      submitLabel="Create event"
      title="Create event"
    />
  );
}

export function AdminEventEditorPage({ data }: { data: AdminEventDetailData }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const detailQueryOptions = orpc.event.getAdminEvent.queryOptions({
    input: { id: data.event.id },
  });
  const [form, setForm] = useState<EventFormState>(formFromDetail(data));
  const [formError, setFormError] = useState<string | null>(null);
  const currentSeasonQuery = useQuery({
    ...orpc.season.getCurrentAdminSeason.queryOptions(),
    retry: false,
  });

  useEffect(() => {
    setForm(formFromDetail(data));
  }, [data]);

  useEffect(() => {
    if (!currentSeasonQuery.data?.year) {
      return;
    }

    setForm((current) =>
      current.season === currentSeasonQuery.data.year
        ? current
        : {
            ...current,
            season: currentSeasonQuery.data.year,
          },
    );
  }, [currentSeasonQuery.data?.year]);

  const invalidateDetail = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: detailQueryOptions.queryKey }),
      queryClient.invalidateQueries({
        queryKey: orpc.event.listAdminEvents.queryOptions().queryKey,
      }),
    ]);
  };

  const updateMutation = useMutation({
    mutationFn: async () =>
      client.event.updateEvent({
        ...eventPayloadFromForm(form),
        id: data.event.id,
      }),
    onError: (error) => {
      const message = getErrorMessage(error, "Event could not be updated.");
      setFormError(message);
      toast.error(message);
    },
    onSuccess: async () => {
      setFormError(null);
      toast.success("Event updated.");
      await invalidateDetail();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => client.event.deleteEvent({ id: data.event.id }),
    onError: (error) => toast.error(getErrorMessage(error, "Event could not be deleted.")),
    onSuccess: async () => {
      toast.success("Event deleted.");
      await queryClient.invalidateQueries({
        queryKey: orpc.event.listAdminEvents.queryOptions().queryKey,
      });
      await navigate({ to: "/staff/events" });
    },
  });

  return (
    <div className="space-y-6">
      <section className="nrc-card overflow-hidden px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border-transparent", statusClassName(data.event.status))}>
                {data.event.status.replaceAll("_", " ")}
              </Badge>
              <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                /{data.event.season}/{data.event.eventCode}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Event editor
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
                {data.event.name}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                Staff editing uses DB id. Public routing keeps the season-scoped event code.
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={deleteMutation.isPending} variant="destructive">
                <Trash2 />
                Delete event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete event?</AlertDialogTitle>
                <AlertDialogDescription>
                  This soft-deletes the event and removes it from staff listings and public lookup.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      <Tabs className="space-y-6" defaultValue="basic">
        <TabsList variant="line">
          <TabsTrigger className="nrc-pill min-h-10 rounded-full px-4" value="basic">
            Basic info
          </TabsTrigger>
          <TabsTrigger className="nrc-pill min-h-10 rounded-full px-4" value="documents">
            Documents
          </TabsTrigger>
          <TabsTrigger className="nrc-pill min-h-10 rounded-full px-4" value="announcements">
            Announcements
          </TabsTrigger>
          <TabsTrigger className="nrc-pill min-h-10 rounded-full px-4" value="registration">
            Registration form
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <EventFormCard
            currentSeason={currentSeasonQuery.data}
            currentSeasonError={currentSeasonQuery.error?.message ?? null}
            error={formError}
            form={form}
            isSaving={updateMutation.isPending}
            onChange={setForm}
            onSubmit={() => {
              setFormError(null);
              updateMutation.mutate();
            }}
            submitLabel="Save changes"
          />
        </TabsContent>

        <TabsContent value="documents">
          <EventDocumentsEditor
            documents={data.documents}
            eventId={data.event.id}
            onChanged={invalidateDetail}
          />
        </TabsContent>

        <TabsContent value="announcements">
          <EventAnnouncementsEditor
            announcements={data.announcements}
            eventId={data.event.id}
            onChanged={invalidateDetail}
          />
        </TabsContent>

        <TabsContent value="registration">
          <RegistrationFormsEditor
            eventId={data.event.id}
            onChanged={invalidateDetail}
            versions={data.registrationFormVersions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventFormPage({
  currentSeason,
  currentSeasonError,
  error,
  form,
  isSaving,
  onChange,
  onSubmit,
  submitLabel,
  title,
}: {
  currentSeason: AdminCurrentSeasonData | undefined;
  currentSeasonError: string | null;
  error: string | null;
  form: EventFormState;
  isSaving: boolean;
  onChange: (form: EventFormState) => void;
  onSubmit: () => void;
  submitLabel: string;
  title: string;
}) {
  return (
    <div className="space-y-6">
      <section className="nrc-card overflow-hidden px-6 py-6 sm:px-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Admin only
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Create an event under an existing non-deleted season.
          </p>
        </div>
      </section>

      <EventFormCard
        currentSeason={currentSeason}
        currentSeasonError={currentSeasonError}
        error={error}
        form={form}
        isSaving={isSaving}
        onChange={onChange}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
      />
    </div>
  );
}

function EventFormCard({
  currentSeason,
  currentSeasonError,
  error,
  form,
  isSaving,
  onChange,
  onSubmit,
  submitLabel,
}: {
  currentSeason: AdminCurrentSeasonData | undefined;
  currentSeasonError: string | null;
  error: string | null;
  form: EventFormState;
  isSaving: boolean;
  onChange: (form: EventFormState) => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const seasonError = currentSeasonError;
  const isSeasonReady = Boolean(currentSeason?.year);
  const isSubmitDisabled = isSaving || !isSeasonReady;

  return (
    <Card className="nrc-card">
      <CardHeader className="border-b border-border">
        <CardTitle>Basic info</CardTitle>
        <CardDescription>Event code is unique inside the current active season.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Season" name="event-season">
              <Input
                id="event-season"
                disabled
                readOnly
                value={
                  currentSeason
                    ? getCurrentSeasonDescription(currentSeason)
                    : "Loading active season..."
                }
              />
            </Field>
            <Field label="Event code" name="event-code">
              <Input
                id="event-code"
                onChange={(event) =>
                  onChange({ ...form, eventCode: normalizeEventCode(event.target.value) })
                }
                placeholder="VNCMP"
                required
                value={form.eventCode}
              />
            </Field>
            <Field label="Status" name="event-status">
              <NativeSelect
                id="event-status"
                onChange={(event) =>
                  onChange({ ...form, status: event.target.value as EventStatus })
                }
                value={form.status}
              >
                {EVENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name" name="event-name">
              <Input
                id="event-name"
                onChange={(event) => onChange({ ...form, name: event.target.value })}
                placeholder="Vietnam Championship"
                required
                value={form.name}
              />
            </Field>
            <div className="space-y-2">
              <Label htmlFor="event-public-url">Public URL</Label>
              <Input
                disabled
                id="event-public-url"
                readOnly
                value={
                  form.eventCode
                    ? `/${form.season || "season"}/${form.eventCode}`
                    : `/${form.season || "season"}/EVENT_CODE`
                }
              />
            </div>
          </div>

          <Field label="Summary" name="event-summary">
            <Input
              id="event-summary"
              onChange={(event) => onChange({ ...form, summary: event.target.value })}
              value={form.summary}
            />
          </Field>

          <Field label="Description" name="event-description">
            <Textarea
              id="event-description"
              onChange={(event) => onChange({ ...form, description: event.target.value })}
              rows={5}
              value={form.description}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Registration starts" name="registration-starts">
              <Input
                id="registration-starts"
                onChange={(event) =>
                  onChange({ ...form, registrationStartsAt: event.target.value })
                }
                type="datetime-local"
                value={form.registrationStartsAt}
              />
            </Field>
            <Field label="Registration ends" name="registration-ends">
              <Input
                id="registration-ends"
                onChange={(event) => onChange({ ...form, registrationEndsAt: event.target.value })}
                type="datetime-local"
                value={form.registrationEndsAt}
              />
            </Field>
            <Field label="Event starts" name="event-starts">
              <Input
                id="event-starts"
                onChange={(event) => onChange({ ...form, eventStartsAt: event.target.value })}
                required
                type="datetime-local"
                value={form.eventStartsAt}
              />
            </Field>
            <Field label="Event ends" name="event-ends">
              <Input
                id="event-ends"
                onChange={(event) => onChange({ ...form, eventEndsAt: event.target.value })}
                required
                type="datetime-local"
                value={form.eventEndsAt}
              />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Timezone" name="event-timezone">
              <Input
                id="event-timezone"
                onChange={(event) => onChange({ ...form, timezone: event.target.value })}
                value={form.timezone}
              />
            </Field>
            <Field label="Max participants" name="event-max-participants">
              <Input
                id="event-max-participants"
                inputMode="numeric"
                min={1}
                onChange={(event) => onChange({ ...form, maxParticipants: event.target.value })}
                type="number"
                value={form.maxParticipants}
              />
            </Field>
            <Field label="Location" name="event-location">
              <Input
                id="event-location"
                onChange={(event) => onChange({ ...form, location: event.target.value })}
                value={form.location}
              />
            </Field>
            <Field label="Venue" name="event-venue">
              <Input
                id="event-venue"
                onChange={(event) => onChange({ ...form, venue: event.target.value })}
                value={form.venue}
              />
            </Field>
          </div>

          {seasonError ? <p className="text-sm text-destructive">{seasonError}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button asChild type="button" variant="outline">
              <Link to="/staff/events">Cancel</Link>
            </Button>
            <Button disabled={isSubmitDisabled} type="submit">
              {isSaving ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EventDocumentsEditor({
  documents,
  eventId,
  onChanged,
}: {
  documents: AdminEventDocument[];
  eventId: string;
  onChanged: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<DocumentDraft>(emptyDocumentDraft);

  const reset = () => setDraft(emptyDocumentDraft());

  const createMutation = useMutation({
    mutationFn: async () =>
      client.event.createEventDocument({
        eventId,
        isPublic: draft.isPublic,
        kind: draft.kind.trim(),
        sortOrder: parseSortOrder(draft.sortOrder),
        title: draft.title.trim(),
        url: draft.url.trim(),
      }),
    onError: (error) => toast.error(getErrorMessage(error, "Document could not be created.")),
    onSuccess: async () => {
      toast.success("Document saved.");
      reset();
      await onChanged();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!draft.id) {
        throw new Error("Choose a document first.");
      }

      return client.event.updateEventDocument({
        eventId,
        id: draft.id,
        isPublic: draft.isPublic,
        kind: draft.kind.trim(),
        sortOrder: parseSortOrder(draft.sortOrder),
        title: draft.title.trim(),
        url: draft.url.trim(),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Document could not be updated.")),
    onSuccess: async () => {
      toast.success("Document updated.");
      reset();
      await onChanged();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) =>
      client.event.deleteEventDocument({ eventId, id: documentId }),
    onError: (error) => toast.error(getErrorMessage(error, "Document could not be deleted.")),
    onSuccess: async () => {
      toast.success("Document deleted.");
      await onChanged();
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="nrc-card">
        <CardHeader className="border-b border-border">
          <CardTitle>Documents</CardTitle>
          <CardDescription>Public documents appear on the public event page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {documents.length === 0 ? (
            <AdminEventState
              description="Add rules, venue packets, or schedule links."
              icon={<FileText />}
              title="No documents"
            />
          ) : (
            documents.map((document) => (
              <div
                className="nrc-card-subtle flex items-center justify-between gap-4 p-4"
                key={document.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{document.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {document.kind} · order {document.sortOrder}
                    {document.isPublic ? " · public" : " · staff only"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild size="icon" variant="ghost">
                    <a href={document.url} rel="noreferrer" target="_blank">
                      <ExternalLink />
                    </a>
                  </Button>
                  <Button
                    onClick={() =>
                      setDraft({
                        id: document.id,
                        isPublic: document.isPublic,
                        kind: document.kind,
                        sortOrder: String(document.sortOrder),
                        title: document.title,
                        url: document.url,
                      })
                    }
                    size="icon"
                    variant="ghost"
                  >
                    <PencilLine />
                  </Button>
                  <Button
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(document.id)}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <DocumentDraftCard
        draft={draft}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onCancel={reset}
        onChange={setDraft}
        onSubmit={() => (draft.id ? updateMutation.mutate() : createMutation.mutate())}
      />
    </div>
  );
}

function EventAnnouncementsEditor({
  announcements,
  eventId,
  onChanged,
}: {
  announcements: AdminEventAnnouncement[];
  eventId: string;
  onChanged: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<AnnouncementDraft>(emptyAnnouncementDraft);

  const reset = () => setDraft(emptyAnnouncementDraft());

  const createMutation = useMutation({
    mutationFn: async () =>
      client.event.createEventAnnouncement({
        body: draft.body.trim(),
        eventId,
        isPinned: draft.isPinned,
        publishedAt: toIsoDateTime(draft.publishedAt),
        title: draft.title.trim(),
      }),
    onError: (error) => toast.error(getErrorMessage(error, "Announcement could not be created.")),
    onSuccess: async () => {
      toast.success("Announcement saved.");
      reset();
      await onChanged();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!draft.id) {
        throw new Error("Choose an announcement first.");
      }

      return client.event.updateEventAnnouncement({
        body: draft.body.trim(),
        eventId,
        id: draft.id,
        isPinned: draft.isPinned,
        publishedAt: toIsoDateTime(draft.publishedAt),
        title: draft.title.trim(),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Announcement could not be updated.")),
    onSuccess: async () => {
      toast.success("Announcement updated.");
      reset();
      await onChanged();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (announcementId: string) =>
      client.event.deleteEventAnnouncement({ eventId, id: announcementId }),
    onError: (error) => toast.error(getErrorMessage(error, "Announcement could not be deleted.")),
    onSuccess: async () => {
      toast.success("Announcement deleted.");
      await onChanged();
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="nrc-card">
        <CardHeader className="border-b border-border">
          <CardTitle>Announcements</CardTitle>
          <CardDescription>Ordered by pinned state and publish date.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {announcements.length === 0 ? (
            <AdminEventState
              description="Add operational notices for teams."
              icon={<Megaphone />}
              title="No announcements"
            />
          ) : (
            announcements.map((announcement) => (
              <div
                className="nrc-card-subtle flex items-start justify-between gap-4 p-4"
                key={announcement.id}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{announcement.title}</p>
                    {announcement.isPinned ? <Badge>Pinned</Badge> : null}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{announcement.body}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    onClick={() =>
                      setDraft({
                        body: announcement.body,
                        id: announcement.id,
                        isPinned: announcement.isPinned,
                        publishedAt: toDateTimeLocalValue(announcement.publishedAt),
                        title: announcement.title,
                      })
                    }
                    size="icon"
                    variant="ghost"
                  >
                    <PencilLine />
                  </Button>
                  <Button
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(announcement.id)}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AnnouncementDraftCard
        draft={draft}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onCancel={reset}
        onChange={setDraft}
        onSubmit={() => (draft.id ? updateMutation.mutate() : createMutation.mutate())}
      />
    </div>
  );
}

function RegistrationFormsEditor({
  eventId,
  onChanged,
  versions,
}: {
  eventId: string;
  onChanged: () => Promise<void>;
  versions: AdminRegistrationFormVersion[];
}) {
  const latestVersion = versions[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(latestVersion?.id ?? null);
  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedId) ?? null,
    [selectedId, versions],
  );
  const [definitionText, setDefinitionText] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(latestVersion?.id ?? null);
  }, [latestVersion?.id]);

  useEffect(() => {
    setDefinitionText(JSON.stringify(selectedVersion?.definition ?? {}, null, 2));
    setJsonError(null);
  }, [selectedVersion]);

  const parseDefinition = (): Record<string, unknown> => {
    const parsed = JSON.parse(definitionText) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Definition must be a JSON object.");
    }

    return parsed as Record<string, unknown>;
  };

  const createMutation = useMutation({
    mutationFn: async (isPublished: boolean) =>
      client.event.createRegistrationFormVersion({
        definition: parseDefinition(),
        eventId,
        isPublished,
      }),
    onError: (error) => {
      const message = getErrorMessage(error, "Registration form version could not be created.");
      setJsonError(message);
      toast.error(message);
    },
    onSuccess: async () => {
      setJsonError(null);
      toast.success("Registration form version created.");
      await onChanged();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVersion) {
        throw new Error("Choose a version first.");
      }

      return client.event.updateRegistrationFormVersion({
        definition: parseDefinition(),
        eventId,
        id: selectedVersion.id,
      });
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Registration form version could not be updated.");
      setJsonError(message);
      toast.error(message);
    },
    onSuccess: async () => {
      setJsonError(null);
      toast.success("Registration form version updated.");
      await onChanged();
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (versionId: string) =>
      client.event.publishRegistrationFormVersion({ eventId, id: versionId }),
    onError: (error) => toast.error(getErrorMessage(error, "Version could not be published.")),
    onSuccess: async () => {
      toast.success("Registration form version published.");
      await onChanged();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (versionId: string) =>
      client.event.deleteRegistrationFormVersion({ eventId, id: versionId }),
    onError: (error) => toast.error(getErrorMessage(error, "Version could not be deleted.")),
    onSuccess: async () => {
      toast.success("Registration form version deleted.");
      await onChanged();
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="nrc-card">
        <CardHeader className="border-b border-border">
          <CardTitle>Registration form versions</CardTitle>
          <CardDescription>
            Publishing a version unpublishes the previous active version.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {versions.length === 0 ? (
            <AdminEventState
              description="Create version 1 from a JSON object definition."
              icon={<FileText />}
              title="No form versions"
            />
          ) : (
            versions.map((version) => (
              <div
                className={cn(
                  "nrc-card-subtle flex items-center justify-between gap-4 p-4",
                  selectedId === version.id ? "border-primary/30" : "",
                )}
                key={version.id}
              >
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setSelectedId(version.id)}
                  type="button"
                >
                  <p className="font-semibold">Version {version.versionNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {version.isPublished ? "Published" : "Draft"}
                  </p>
                </button>
                <div className="flex shrink-0 gap-2">
                  <Button
                    disabled={version.isPublished || publishMutation.isPending}
                    onClick={() => publishMutation.mutate(version.id)}
                    size="sm"
                    variant="outline"
                  >
                    Publish
                  </Button>
                  <Button
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(version.id)}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="nrc-card">
        <CardHeader className="border-b border-border">
          <CardTitle>
            {selectedVersion ? `Version ${selectedVersion.versionNumber}` : "New version"}
          </CardTitle>
          <CardDescription>Definition must parse to a JSON object.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Textarea
            className="min-h-80 font-mono text-xs"
            onChange={(event) => setDefinitionText(event.target.value)}
            spellCheck={false}
            value={definitionText}
          />
          {jsonError ? <p className="text-sm text-destructive">{jsonError}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              disabled={!selectedVersion || selectedVersion.isPublished || updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
              type="button"
              variant="outline"
            >
              Update draft
            </Button>
            <Button
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(false)}
              type="button"
              variant="secondary"
            >
              Create draft
            </Button>
            <Button
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(true)}
              type="button"
            >
              Create and publish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentDraftCard({
  draft,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
}: {
  draft: DocumentDraft;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (draft: DocumentDraft) => void;
  onSubmit: () => void;
}) {
  return (
    <Card className="nrc-card">
      <CardHeader className="border-b border-border">
        <CardTitle>{draft.id ? "Edit document" : "Add document"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <Field label="Title" name="document-title">
          <Input
            id="document-title"
            onChange={(event) => onChange({ ...draft, title: event.target.value })}
            value={draft.title}
          />
        </Field>
        <Field label="Kind" name="document-kind">
          <Input
            id="document-kind"
            onChange={(event) => onChange({ ...draft, kind: event.target.value })}
            value={draft.kind}
          />
        </Field>
        <Field label="URL" name="document-url">
          <Input
            id="document-url"
            onChange={(event) => onChange({ ...draft, url: event.target.value })}
            value={draft.url}
          />
        </Field>
        <Field label="Sort order" name="document-sort-order">
          <Input
            id="document-sort-order"
            onChange={(event) => onChange({ ...draft, sortOrder: event.target.value })}
            type="number"
            value={draft.sortOrder}
          />
        </Field>
        <label className="flex items-center gap-3 text-sm" htmlFor="document-public">
          <Checkbox
            checked={draft.isPublic}
            id="document-public"
            onCheckedChange={(checked) => onChange({ ...draft, isPublic: checked === true })}
          />
          Public document
        </label>
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            Clear
          </Button>
          <Button disabled={isSaving} onClick={onSubmit} type="button">
            {draft.id ? "Update" : "Add"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AnnouncementDraftCard({
  draft,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
}: {
  draft: AnnouncementDraft;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (draft: AnnouncementDraft) => void;
  onSubmit: () => void;
}) {
  return (
    <Card className="nrc-card">
      <CardHeader className="border-b border-border">
        <CardTitle>{draft.id ? "Edit announcement" : "Add announcement"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <Field label="Title" name="announcement-title">
          <Input
            id="announcement-title"
            onChange={(event) => onChange({ ...draft, title: event.target.value })}
            value={draft.title}
          />
        </Field>
        <Field label="Published at" name="announcement-published-at">
          <Input
            id="announcement-published-at"
            onChange={(event) => onChange({ ...draft, publishedAt: event.target.value })}
            type="datetime-local"
            value={draft.publishedAt}
          />
        </Field>
        <Field label="Body" name="announcement-body">
          <Textarea
            id="announcement-body"
            onChange={(event) => onChange({ ...draft, body: event.target.value })}
            rows={6}
            value={draft.body}
          />
        </Field>
        <label className="flex items-center gap-3 text-sm" htmlFor="announcement-pinned">
          <Checkbox
            checked={draft.isPinned}
            id="announcement-pinned"
            onCheckedChange={(checked) => onChange({ ...draft, isPinned: checked === true })}
          />
          Pin announcement
        </label>
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            Clear
          </Button>
          <Button disabled={isSaving} onClick={onSubmit} type="button">
            {draft.id ? "Update" : "Add"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ children, label, name }: { children: ReactNode; label: string; name: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
    </div>
  );
}

function AdminEventState({
  action,
  actionTo,
  description,
  icon,
  onAction,
  title,
}: {
  action?: string;
  actionTo?: "/staff/events/new";
  description: string;
  icon: ReactNode;
  onAction?: () => void | Promise<void>;
  title: string;
}) {
  return (
    <Empty className="nrc-card border-dashed py-12">
      <EmptyHeader>
        <EmptyMedia>{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && actionTo ? (
        <Button asChild>
          <Link to={actionTo}>{action}</Link>
        </Button>
      ) : null}
      {action && onAction ? (
        <Button onClick={() => void onAction()} type="button" variant="outline">
          {action}
        </Button>
      ) : null}
    </Empty>
  );
}
