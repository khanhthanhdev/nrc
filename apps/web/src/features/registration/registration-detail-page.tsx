import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Edit, LogOut, MessageSquare, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";
import { cn } from "@/lib/utils";
import { client, orpc } from "@/utils/orpc";

import { ReadOnlyFormRenderer } from "./dynamic-form-renderer";
import { RegistrationStatusPipeline } from "./status-pipeline";

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

export function RegistrationDetailPage({
  canEdit,
  eventId,
  registrationId,
}: {
  canEdit: boolean;
  eventId: string;
  registrationId: string;
}) {
  const { i18n, t } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    ...orpc.registration.getRegistration.queryOptions({
      input: { registrationId },
    }),
    retry: false,
  });

  const reviewActionsQuery = useQuery({
    ...orpc.registration.listRegistrationReviewActions.queryOptions({
      input: { registrationId },
    }),
    retry: false,
  });

  const formQuery = useQuery({
    ...orpc.registration.getEventRegistrationForm.queryOptions({
      input: { eventId },
    }),
    retry: false,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries();
  };

  const withdrawMutation = useMutation({
    mutationFn: async () =>
      client.registration.withdrawRegistration({ registrationId }),
    onError: (error) => toast.error(getErrorMessage(error, "Could not withdraw registration.")),
    onSuccess: async () => {
      toast.success("Registration withdrawn.");
      await invalidate();
    },
  });

  if (detailQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (detailQuery.error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Empty>
          <EmptyMedia>
            <Search />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>
              {t("registrationDetail.errorTitle", "Registration unavailable")}
            </EmptyTitle>
            <EmptyDescription>{detailQuery.error.message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (!detailQuery.data) {
    return null;
  }

  const { registration, revisions } = detailQuery.data;
  const reviewActions = reviewActionsQuery.data ?? [];
  const latestRevision = revisions[0];
  const formDefinition = formQuery.data?.definition as Record<string, unknown> | undefined;

  const canWithdraw =
    canEdit &&
    (registration.status === "submitted" ||
      registration.status === "under_review" ||
      registration.status === "needs_revision");

  const canResubmit =
    canEdit &&
    (registration.status === "draft" || registration.status === "needs_revision");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link
            params={{ eventId }}
            to={localizePathname("/register/$eventId", activeLanguage)}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("registrationDetail.back", "Back")}
          </Link>
        </Button>
      </div>

      <section className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold">
            {t("registrationDetail.title", "Registration Detail")}
          </h1>
          <Badge className={cn("shrink-0 border-transparent", statusClassName(registration.status))}>
            {registration.status.replaceAll("_", " ")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("registrationDetail.event", "Event")}: {registration.eventId.slice(0, 8)}… ·{" "}
          {t("registrationDetail.created", "Created")}: {new Date(registration.createdAt).toLocaleDateString()}
        </p>
      </section>

      <Card>
        <CardContent className="py-6">
          <RegistrationStatusPipeline status={registration.status} />
        </CardContent>
      </Card>

      {reviewActions.length > 0 ? (
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t("registrationDetail.reviewComments", "Review Comments")}
            </CardTitle>
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

      {latestRevision ? (
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>
              {t("registrationDetail.submission", "Your Submission")} — Revision #{latestRevision.revisionNumber}
            </CardTitle>
            <CardDescription>
              {t("registrationDetail.lastUpdated", "Last updated")}: {new Date(latestRevision.submittedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {formDefinition ? (
              <ReadOnlyFormRenderer
                definition={formDefinition}
                value={latestRevision.payload as Record<string, unknown>}
              />
            ) : (
              <div className="rounded-lg border bg-muted/50 p-4">
                <pre className="whitespace-pre-wrap break-words text-sm">
                  {JSON.stringify(latestRevision.payload, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canResubmit ? (
          <Button asChild>
            <Link
              params={{ eventId }}
              to={localizePathname("/register/$eventId", activeLanguage)}
            >
              <Edit className="h-4 w-4" />
              {t("registrationDetail.editResubmit", "Edit & Resubmit")}
            </Link>
          </Button>
        ) : null}

        {canWithdraw ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={withdrawMutation.isPending} variant="destructive">
                <LogOut className="h-4 w-4" />
                {t("registrationDetail.withdraw", "Withdraw Registration")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Withdraw registration?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will withdraw your registration from this event.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => withdrawMutation.mutate()}>
                  Withdraw
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </div>
  );
}
