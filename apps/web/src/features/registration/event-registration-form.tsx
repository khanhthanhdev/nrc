import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FileText, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
import { client, orpc } from "@/utils/orpc";

import { DynamicFormRenderer } from "./dynamic-form-renderer";

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export function EventRegistrationFormPage({
  eventId,
  teamId,
  teamName,
  writable,
}: {
  eventId: string;
  teamId: string | null;
  teamName: string | null;
  writable: boolean;
}) {
  const { i18n, t } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [initialized, setInitialized] = useState(false);

  const formQuery = useQuery({
    ...orpc.registration.getEventRegistrationForm.queryOptions({
      input: { eventId },
    }),
    retry: false,
  });

  const statusQuery = useQuery({
    ...orpc.registration.getTeamEventRegistrationStatus.queryOptions({
      input: { eventId, teamId: teamId ?? "" },
    }),
    enabled: Boolean(teamId),
    retry: false,
  });

  const existingRegistrationQuery = useQuery({
    ...orpc.registration.getRegistration.queryOptions({
      input: { registrationId: statusQuery.data?.registrationId ?? "" },
    }),
    enabled: Boolean(statusQuery.data?.exists && statusQuery.data.registrationId),
    retry: false,
  });

  if (
    !initialized &&
    existingRegistrationQuery.data?.revisions &&
    existingRegistrationQuery.data.revisions.length > 0
  ) {
    const latestRevision = existingRegistrationQuery.data.revisions[0];

    if (latestRevision) {
      setPayload(latestRevision.payload as Record<string, unknown>);
      setInitialized(true);
    }
  }

  const createMutation = useMutation({
    mutationFn: async () =>
      client.registration.createRegistration({
        eventId,
        payload,
        teamId: teamId ?? "",
      }),
    onError: (error) => toast.error(getErrorMessage(error, "Could not create registration.")),
    onSuccess: async (data) => {
      toast.success("Registration draft created.");
      await queryClient.invalidateQueries();
      void navigate({
        params: { eventId, registrationId: data.id },
        to: localizePathname("/register/$eventId/$registrationId", activeLanguage),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () =>
      client.registration.updateRegistrationRevision({
        payload,
        registrationId: statusQuery.data?.registrationId ?? "",
      }),
    onError: (error) => toast.error(getErrorMessage(error, "Could not save draft.")),
    onSuccess: async () => {
      toast.success("Draft saved.");
      await queryClient.invalidateQueries();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () =>
      client.registration.submitRegistration({
        registrationId: statusQuery.data?.registrationId ?? "",
      }),
    onError: (error) => toast.error(getErrorMessage(error, "Could not submit registration.")),
    onSuccess: async () => {
      toast.success("Registration submitted for review!");
      await queryClient.invalidateQueries();
      if (statusQuery.data?.registrationId) {
        void navigate({
          params: { eventId, registrationId: statusQuery.data.registrationId },
          to: localizePathname("/register/$eventId/$registrationId", activeLanguage),
        });
      }
    },
  });

  const isLoadingExisting = statusQuery.data?.exists && existingRegistrationQuery.isLoading;

  if (formQuery.isLoading || statusQuery.isLoading || isLoadingExisting) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (formQuery.error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Empty>
          <EmptyMedia>
            <FileText />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>
              {t("eventRegistration.formUnavailable", "Registration form unavailable")}
            </EmptyTitle>
            <EmptyDescription>{formQuery.error.message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (!formQuery.data) {
    return null;
  }

  if (!teamId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Empty>
          <EmptyMedia>
            <FileText />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("eventRegistration.noTeam", "No team")}</EmptyTitle>
            <EmptyDescription>
              {t("eventRegistration.noTeamDescription", "You must be part of a team to register.")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const hasExisting = statusQuery.data?.exists;
  const existingStatus = statusQuery.data?.status;
  const canEdit = writable && (!hasExisting || existingStatus === "draft" || existingStatus === "needs_revision");
  const definition = formQuery.data.definition as Record<string, unknown>;
  const isAnyMutating = createMutation.isPending || updateMutation.isPending || submitMutation.isPending;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">
          {t("eventRegistration.title", "Event Registration")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {teamName
            ? t("eventRegistration.teamLabel", "Registering as: {{teamName}}", { teamName })
            : t("eventRegistration.teamUnknown", "Team")}
        </p>
        {hasExisting ? (
          <p className="text-sm text-muted-foreground">
            {t("eventRegistration.existingDraft", "You have an existing registration ({{status}}). You can continue editing below.", { status: existingStatus })}
          </p>
        ) : null}
      </section>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>
            {t("eventRegistration.formTitle", "Registration Form")}
          </CardTitle>
          <CardDescription>
            {t("eventRegistration.formVersion", "Form version {{version}}", { version: formQuery.data.versionNumber })}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <DynamicFormRenderer
            definition={definition}
            onChange={setPayload}
            readOnly={!canEdit}
            value={payload}
          />
        </CardContent>
      </Card>

      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          {hasExisting ? (
            <>
              <Button
                disabled={isAnyMutating}
                onClick={() => updateMutation.mutate()}
                variant="outline"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : null}
                {t("eventRegistration.saveDraft", "Save Draft")}
              </Button>
              {existingStatus === "draft" || existingStatus === "needs_revision" ? (
                <Button
                  disabled={isAnyMutating}
                  onClick={() => submitMutation.mutate()}
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : null}
                  {t("eventRegistration.submit", "Submit Registration")}
                </Button>
              ) : null}
            </>
          ) : (
            <Button
              disabled={isAnyMutating}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : null}
              {t("eventRegistration.createDraft", "Create Registration")}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {!writable
            ? t("eventRegistration.readOnly", "You do not have permission to edit this registration.")
            : t("eventRegistration.notEditable", "This registration cannot be edited in its current status.")}
        </p>
      )}
    </div>
  );
}
