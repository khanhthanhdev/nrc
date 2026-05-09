import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle, ClipboardCheck, Eye, MessageSquare, Search, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { Textarea } from "@/components/ui/textarea";
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
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";
import { cn } from "@/lib/utils";
import { client, orpc } from "@/utils/orpc";

type RegistrationStatus =
  | "approved"
  | "denied"
  | "draft"
  | "needs_revision"
  | "submitted"
  | "under_review"
  | "withdrawn";

const ALL_STATUSES: RegistrationStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "needs_revision",
  "approved",
  "denied",
  "withdrawn",
];

const statusClassName = (status: string): string => {
  switch (status) {
    case "approved": {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    case "denied": {
      return "border-red-200 bg-red-50 text-red-700";
    }
    case "needs_revision": {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    case "submitted":
    case "under_review": {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }
    case "withdrawn": {
      return "border-zinc-200 bg-zinc-50 text-zinc-500";
    }
    default: {
      return "border-zinc-200 bg-zinc-50 text-zinc-600";
    }
  }
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const useActiveLanguage = () => {
  const { i18n } = useTranslation();

  return getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
};

export function StaffRegistrationsListPage() {
  const { t } = useTranslation();
  const activeLanguage = useActiveLanguage();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const eventsQuery = useQuery({
    ...orpc.event.listAdminEvents.queryOptions(),
    retry: false,
  });

  const registrationsQuery = useQuery({
    ...orpc.registration.listAdminRegistrationsByEvent.queryOptions({
      input: {
        eventId: selectedEventId,
        ...(statusFilter !== "all" ? { status: statusFilter as RegistrationStatus } : {}),
      },
    }),
    enabled: selectedEventId.length > 0,
    retry: false,
  });

  return (
    <div className="space-y-6">
      <section className="nrc-card overflow-hidden px-6 py-6 sm:px-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t("staffRegistrations.eyebrow", "Staff")}
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
            {t("staffRegistrations.title", "Registration Management")}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            {t(
              "staffRegistrations.description",
              "Review and manage team registrations for events. Select an event to view its registrations.",
            )}
          </p>
        </div>
      </section>

      <Card className="nrc-card">
        <CardHeader className="border-b border-border">
          <CardTitle>{t("staffRegistrations.filters", "Filters")}</CardTitle>
          <CardDescription>
            {t("staffRegistrations.filtersDescription", "Select an event and filter by status.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <NativeSelect
                onChange={(event) => setSelectedEventId(event.target.value)}
                value={selectedEventId}
              >
                <option value="">
                  {eventsQuery.isLoading
                    ? t("staffRegistrations.loadingEvents", "Loading events...")
                    : t("staffRegistrations.selectEvent", "Select an event")}
                </option>
                {eventsQuery.data?.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.season}/{event.eventCode})
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="w-full sm:w-48">
              <NativeSelect
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="all">{t("staffRegistrations.allStatuses", "All statuses")}</option>
                {ALL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedEventId ? (
        <Empty>
          <EmptyMedia>
            <ClipboardCheck />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>
              {t("staffRegistrations.noEventSelected", "No event selected")}
            </EmptyTitle>
            <EmptyDescription>
              {t(
                "staffRegistrations.selectEventPrompt",
                "Select an event above to view its registrations.",
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : registrationsQuery.isLoading ? (
        <Card className="nrc-card">
          <CardContent className="space-y-3 pt-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-12 w-full" key={`reg-skeleton-${index}`} />
            ))}
          </CardContent>
        </Card>
      ) : registrationsQuery.error ? (
        <Empty>
          <EmptyMedia>
            <Search />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>
              {t("staffRegistrations.errorTitle", "Could not load registrations")}
            </EmptyTitle>
            <EmptyDescription>{registrationsQuery.error.message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : !registrationsQuery.data || registrationsQuery.data.length === 0 ? (
        <Empty>
          <EmptyMedia>
            <ClipboardCheck />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>
              {t("staffRegistrations.noRegistrations", "No registrations found")}
            </EmptyTitle>
            <EmptyDescription>
              {statusFilter !== "all"
                ? t(
                    "staffRegistrations.noRegistrationsForFilter",
                    "No registrations match the current filter.",
                  )
                : t(
                    "staffRegistrations.noRegistrationsForEvent",
                    "No teams have registered for this event yet.",
                  )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <RegistrationsTable
          activeLanguage={activeLanguage}
          registrations={registrationsQuery.data}
        />
      )}
    </div>
  );
}

function RegistrationsTable({
  activeLanguage,
  registrations,
}: {
  activeLanguage: string;
  registrations: Awaited<ReturnType<typeof client.registration.listAdminRegistrationsByEvent>>;
}) {
  const { t } = useTranslation();

  return (
    <Card className="nrc-card">
      <CardHeader className="border-b border-border">
        <CardTitle>
          {t("staffRegistrations.tableTitle", "Registrations")} ({registrations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("staffRegistrations.team", "Team")}</TableHead>
              <TableHead>{t("staffRegistrations.status", "Status")}</TableHead>
              <TableHead>{t("staffRegistrations.submitted", "Submitted")}</TableHead>
              <TableHead className="text-right">
                {t("staffRegistrations.actions", "Actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((registration) => (
              <TableRow key={registration.id}>
                <TableCell className="whitespace-normal">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      {registration.teamName ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      #{registration.teamNumber ?? "—"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn("border-transparent", statusClassName(registration.status))}
                  >
                    {registration.status.replaceAll("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {registration.submittedAt
                    ? new Date(registration.submittedAt).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      params={{ registrationId: registration.id }}
                      to={localizePathname(
                        "/staff/registrations/$registrationId",
                        activeLanguage,
                      )}
                    >
                      {registration.status === "submitted" ||
                      registration.status === "under_review" ? (
                        <>
                          <Eye />
                          {t("staffRegistrations.review", "Review")}
                        </>
                      ) : (
                        <>
                          <Eye />
                          {t("staffRegistrations.view", "View")}
                        </>
                      )}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Staff Registration Detail Page ──────────────────────────────────────

export function StaffRegistrationDetailPage({
  registrationId,
}: {
  registrationId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const detailQuery = useQuery({
    ...orpc.registration.getAdminRegistrationDetail.queryOptions({
      input: { registrationId },
    }),
    retry: false,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: orpc.registration.getAdminRegistrationDetail.queryOptions({
        input: { registrationId },
      }).queryKey,
    });
  };

  const reviewMutation = useMutation({
    mutationFn: async (action: "approve" | "deny" | "request_changes") =>
      client.registration.reviewRegistration({
        action,
        comment: comment.trim() || undefined,
        registrationId,
      }),
    onError: (error) => toast.error(getErrorMessage(error, "Review action failed.")),
    onSuccess: async () => {
      toast.success("Review action applied.");
      setComment("");
      await invalidate();
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () =>
      client.registration.addRegistrationComment({
        comment: comment.trim(),
        isVisibleToTeam: true,
        registrationId,
      }),
    onError: (error) => toast.error(getErrorMessage(error, "Comment could not be added.")),
    onSuccess: async () => {
      toast.success("Comment added.");
      setComment("");
      await invalidate();
    },
  });

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (detailQuery.error) {
    return (
      <Empty>
        <EmptyMedia>
          <Search />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{t("staffRegistrationDetail.errorTitle", "Registration unavailable")}</EmptyTitle>
          <EmptyDescription>{detailQuery.error.message}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!detailQuery.data) {
    return null;
  }

  const { registration, reviewActions, revisions } = detailQuery.data;
  const isReviewable =
    registration.status === "submitted" || registration.status === "under_review";
  const latestRevision = revisions[0];

  return (
    <div className="space-y-6">
      <section className="nrc-card overflow-hidden px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t("staffRegistrationDetail.eyebrow", "Registration Review")}
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {registration.teamName ?? "Unknown Team"}
            </h1>
            <p className="text-sm text-muted-foreground">
              #{registration.teamNumber ?? "—"} · {t("staffRegistrationDetail.registrationId", "Registration")}: {registrationId.slice(0, 8)}…
            </p>
          </div>
          <Badge className={cn("border-transparent text-sm", statusClassName(registration.status))}>
            {registration.status.replaceAll("_", " ")}
          </Badge>
        </div>
      </section>

      {isReviewable ? (
        <Card className="nrc-card">
          <CardHeader className="border-b border-border">
            <CardTitle>{t("staffRegistrationDetail.reviewActions", "Review Actions")}</CardTitle>
            <CardDescription>
              {t("staffRegistrationDetail.reviewActionsDescription", "Approve, deny, or request changes on this registration.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Textarea
              onChange={(event) => setComment(event.target.value)}
              placeholder={t("staffRegistrationDetail.commentPlaceholder", "Optional comment (visible to team)...")}
              rows={3}
              value={comment}
            />
            <div className="flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={reviewMutation.isPending}>
                    <CheckCircle />
                    {t("staffRegistrationDetail.approve", "Approve")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve registration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will set the registration status to &quot;approved&quot;.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => reviewMutation.mutate("approve")}>
                      Approve
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate("request_changes")}
                variant="outline"
              >
                <MessageSquare />
                {t("staffRegistrationDetail.requestChanges", "Request Changes")}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={reviewMutation.isPending} variant="destructive">
                    <XCircle />
                    {t("staffRegistrationDetail.deny", "Deny")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deny registration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will set the registration status to &quot;denied&quot;.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => reviewMutation.mutate("deny")}>
                      Deny
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="nrc-card">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <Textarea
                onChange={(event) => setComment(event.target.value)}
                placeholder={t("staffRegistrationDetail.addCommentPlaceholder", "Add a comment...")}
                rows={2}
                value={comment}
              />
              <Button
                disabled={!comment.trim() || commentMutation.isPending}
                onClick={() => commentMutation.mutate()}
              >
                <MessageSquare />
                {t("staffRegistrationDetail.addComment", "Comment")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {latestRevision ? (
        <Card className="nrc-card">
          <CardHeader className="border-b border-border">
            <CardTitle>
              {t("staffRegistrationDetail.submissionData", "Submission Data")} — Revision #{latestRevision.revisionNumber}
            </CardTitle>
            <CardDescription>
              {t("staffRegistrationDetail.submittedAt", "Submitted")}: {new Date(latestRevision.submittedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-lg border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap break-words text-sm">
                {JSON.stringify(latestRevision.payload, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {reviewActions.length > 0 ? (
        <Card className="nrc-card">
          <CardHeader className="border-b border-border">
            <CardTitle>{t("staffRegistrationDetail.reviewHistory", "Review History")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {reviewActions.map((action) => (
                <div className="flex gap-3 text-sm" key={action.id}>
                  <div
                    className={cn(
                      "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                      action.actionType === "approved"
                        ? "bg-emerald-500"
                        : action.actionType === "denied"
                          ? "bg-red-500"
                          : action.actionType === "requested_changes"
                            ? "bg-amber-500"
                            : "bg-zinc-400",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {action.actionType.replaceAll("_", " ")}
                      {action.previousStatus && action.nextStatus ? (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          ({action.previousStatus} → {action.nextStatus})
                        </span>
                      ) : null}
                    </p>
                    {action.comment ? (
                      <p className="mt-1 text-muted-foreground">{action.comment}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(action.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {revisions.length > 1 ? (
        <Card className="nrc-card">
          <CardHeader className="border-b border-border">
            <CardTitle>{t("staffRegistrationDetail.allRevisions", "All Revisions")} ({revisions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {revisions.map((revision) => (
              <details className="rounded-lg border p-4" key={revision.id}>
                <summary className="cursor-pointer text-sm font-medium">
                  Revision #{revision.revisionNumber} — {new Date(revision.submittedAt).toLocaleString()}
                </summary>
                <div className="mt-3 rounded-lg bg-muted/50 p-4">
                  <pre className="whitespace-pre-wrap break-words text-sm">
                    {JSON.stringify(revision.payload, null, 2)}
                  </pre>
                </div>
              </details>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
