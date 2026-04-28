import { useEffect, useState } from "react";

import { env } from "@nrc-full/env/web";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  ExternalLink,
  FilePlus2,
  Megaphone,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type {
  AdminSeasonAnnouncement,
  AdminSeasonDetailData,
  AdminSeasonDocument,
  AdminSeasonListData,
} from "./types";

import {
  buildSeasonDocumentUploadUrl,
  formatSeasonDateRange,
  formatSeasonDateTime,
  getSeasonDocumentUploadKey,
  getSeasonEventStatusMeta,
  getSeasonLifecycleMeta,
  getSeasonLocale,
  renderStatusLabel,
  toDateTimeLocalValue,
  toIsoDateTime,
} from "./helpers";
import { FileUploader } from "@/components/upload";
import { UPLOAD_ROUTES } from "@/components/upload/use-upload-mutations";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";
import { Textarea } from "@/components/ui/textarea";
import { client, orpc } from "@/utils/orpc";
import { cn } from "@/lib/utils";

interface SeasonBasicFormState {
  description: string;
  gameCode: string;
  isActive: boolean;
  theme: string;
  year: string;
}

interface SeasonDocumentDraft {
  kind: string;
  sortOrder: string;
  sourceType: "upload" | "url";
  title: string;
  url: string;
}

interface SeasonAnnouncementDraft {
  body: string;
  isPinned: boolean;
  publishedAt: string;
  sortOrder: string;
  title: string;
}

const normalizeSeasonYearInput = (value: string): string => value.replaceAll(/\D/g, "").slice(0, 4);

const emptyDocumentDraft = (): SeasonDocumentDraft => ({
  kind: "",
  sortOrder: "0",
  sourceType: "url",
  title: "",
  url: "",
});

const emptyAnnouncementDraft = (): SeasonAnnouncementDraft => ({
  body: "",
  isPinned: false,
  publishedAt: "",
  sortOrder: "0",
  title: "",
});

const getErrorMessage = (error: unknown, fallbackMessage: string): string =>
  error instanceof Error ? error.message : fallbackMessage;

const normalizeOptionalText = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseSortOrder = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getSeasonDocumentSourceType = (url: string): SeasonDocumentDraft["sourceType"] =>
  getSeasonDocumentUploadKey(url, env.VITE_SERVER_URL) ? "upload" : "url";

const createDocumentDraftFromRecord = (
  document: Pick<AdminSeasonDocument, "kind" | "sortOrder" | "title" | "url">,
): SeasonDocumentDraft => ({
  kind: document.kind,
  sortOrder: String(document.sortOrder),
  sourceType: getSeasonDocumentSourceType(document.url),
  title: document.title,
  url: document.url,
});

const getSeasonDocumentUrlForSave = (
  draft: SeasonDocumentDraft,
  messages: {
    uploadRequired: string;
    urlRequired: string;
  },
): string => {
  const url = draft.url.trim();

  if (draft.sourceType === "upload") {
    if (!getSeasonDocumentUploadKey(url, env.VITE_SERVER_URL)) {
      throw new Error(messages.uploadRequired);
    }

    return url;
  }

  if (!url) {
    throw new Error(messages.urlRequired);
  }

  return url;
};

export function AdminSeasonListPage({
  error,
  isLoading,
  onRetry,
  seasons,
}: {
  error: Error | null;
  isLoading: boolean;
  onRetry: () => void | Promise<void>;
  seasons: AdminSeasonListData | undefined;
}) {
  const { t, i18n } = useTranslation();
  const locale = getSeasonLocale(i18n.resolvedLanguage ?? i18n.language ?? "en");
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

  if (isLoading) {
    return <AdminSeasonListSkeleton />;
  }

  if (error) {
    return (
      <AdminRouteState
        action={t("season.admin.list.loadError.retry")}
        description={t("season.admin.list.loadError.description")}
        icon={<Search />}
        onAction={onRetry}
        title={t("season.admin.list.loadError.title")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="nrc-card overflow-hidden px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t("season.admin.list.kicker")}
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {t("season.admin.list.title")}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {t("season.admin.list.description")}
            </p>
          </div>

          <Button asChild>
            <Link to={localizePathname("/staff/seasons/new", activeLanguage)}>
              <Plus />
              {t("season.admin.list.create")}
            </Link>
          </Button>
        </div>
      </section>

      {!seasons || seasons.length === 0 ? (
        <AdminRouteState
          action={t("season.admin.list.empty.action")}
          actionTo={localizePathname("/staff/seasons/new", activeLanguage)}
          description={t("season.admin.list.empty.description")}
          icon={<CalendarDays />}
          title={t("season.admin.list.empty.title")}
        />
      ) : (
        <Card className="nrc-card">
          <CardHeader className="border-b border-border">
            <CardTitle>{t("season.admin.list.tableTitle")}</CardTitle>
            <CardDescription>{t("season.admin.list.tableDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("season.admin.fields.year")}</TableHead>
                  <TableHead>{t("season.admin.fields.theme")}</TableHead>
                  <TableHead>{t("season.admin.fields.gameCode")}</TableHead>
                  <TableHead>{t("season.admin.fields.status")}</TableHead>
                  <TableHead>{t("season.admin.fields.updatedAt")}</TableHead>
                  <TableHead className="text-right">{t("season.admin.fields.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasons.map((season) => {
                  const lifecycleMeta = getSeasonLifecycleMeta(season.isActive);

                  return (
                    <TableRow key={season.year}>
                      <TableCell className="font-semibold text-foreground">{season.year}</TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{season.theme}</p>
                        </div>
                      </TableCell>
                      <TableCell>{season.gameCode}</TableCell>
                      <TableCell>
                        <Badge className={cn("border-transparent", lifecycleMeta.badgeClassName)}>
                          {renderStatusLabel(t, lifecycleMeta)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatSeasonDateTime(season.updatedAt, locale)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            params={{ seasonId: season.year }}
                            to={localizePathname("/staff/seasons/$seasonId/edit", activeLanguage)}
                          >
                            <PencilLine />
                            {t("season.admin.list.edit")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function AdminSeasonListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="nrc-card space-y-4 px-6 py-6 sm:px-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-full max-w-3xl" />
      </div>
      <div className="nrc-card space-y-4 px-6 py-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-12 w-full" key={`season-list-skeleton-${index}`} />
        ))}
      </div>
    </div>
  );
}

export function AdminSeasonCreatePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<SeasonBasicFormState>({
    description: "",
    gameCode: "",
    isActive: true,
    theme: "",
    year: "",
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      client.season.createSeason({
        description: normalizeOptionalText(form.description),
        gameCode: form.gameCode.trim(),
        isActive: form.isActive,
        theme: form.theme.trim(),
        year: form.year.trim(),
      }),
    onError: (error) => {
      const message = getErrorMessage(error, t("season.admin.feedback.createError"));
      setFormError(message);
      toast.error(message);
    },
    onSuccess: async (createdSeason) => {
      setFormError(null);
      toast.success(t("season.admin.feedback.createSuccess", { year: createdSeason.season.year }));
      await queryClient.invalidateQueries({
        queryKey: orpc.season.listAdminSeasons.queryOptions().queryKey,
      });
      await navigate({
        params: { seasonId: createdSeason.season.year },
        to: localizePathname("/staff/seasons/$seasonId/edit", activeLanguage),
      });
    },
  });

  return (
    <div className="space-y-6">
      <section className="nrc-card overflow-hidden px-6 py-6 sm:px-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t("season.admin.create.kicker")}
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
            {t("season.admin.create.title")}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            {t("season.admin.create.description")}
          </p>
        </div>
      </section>

      <Card className="nrc-card">
        <CardHeader className="border-b border-border">
          <CardTitle>{t("season.admin.create.formTitle")}</CardTitle>
          <CardDescription>{t("season.admin.create.formDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setFormError(null);
              createMutation.mutate();
            }}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="season-year">{t("season.admin.fields.year")}</Label>
                <Input
                  id="season-year"
                  inputMode="numeric"
                  maxLength={4}
                  minLength={4}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      year: normalizeSeasonYearInput(event.target.value),
                    }))
                  }
                  pattern="[0-9]{4}"
                  placeholder="2026"
                  required
                  value={form.year}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="season-game-code">{t("season.admin.fields.gameCode")}</Label>
                <Input
                  id="season-game-code"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, gameCode: event.target.value }))
                  }
                  placeholder="ITD-2026"
                  required
                  value={form.gameCode}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="season-theme">{t("season.admin.fields.theme")}</Label>
              <Input
                id="season-theme"
                onChange={(event) =>
                  setForm((current) => ({ ...current, theme: event.target.value }))
                }
                placeholder={t("season.admin.placeholders.theme")}
                required
                value={form.theme}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="season-description">{t("season.admin.fields.description")}</Label>
              <Textarea
                id="season-description"
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder={t("season.admin.placeholders.description")}
                rows={5}
                value={form.description}
              />
            </div>

            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-3">
              <Checkbox
                checked={form.isActive}
                id="season-is-active"
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isActive: checked === true }))
                }
              />
              <div className="space-y-1">
                <Label htmlFor="season-is-active">{t("season.admin.fields.isActive")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("season.admin.create.activeHint")}
                </p>
              </div>
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button asChild type="button" variant="outline">
                <Link to={localizePathname("/staff/seasons", activeLanguage)}>
                  {t("season.admin.actions.cancel")}
                </Link>
              </Button>
              <Button disabled={createMutation.isPending} type="submit">
                {createMutation.isPending
                  ? t("season.admin.actions.creating")
                  : t("season.admin.actions.create")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminSeasonEditorPage({ data }: { data: AdminSeasonDetailData }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = getSeasonLocale(i18n.resolvedLanguage ?? i18n.language ?? "en");
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
  const detailQueryOptions = orpc.season.getAdminSeason.queryOptions({
    input: { year: data.season.year },
  });

  const [basicInfo, setBasicInfo] = useState<SeasonBasicFormState>({
    description: data.season.description ?? "",
    gameCode: data.season.gameCode,
    isActive: data.season.isActive,
    theme: data.season.theme,
    year: data.season.year,
  });
  const [basicInfoError, setBasicInfoError] = useState<string | null>(null);

  useEffect(() => {
    setBasicInfo({
      description: data.season.description ?? "",
      gameCode: data.season.gameCode,
      isActive: data.season.isActive,
      theme: data.season.theme,
      year: data.season.year,
    });
  }, [
    data.season.description,
    data.season.gameCode,
    data.season.isActive,
    data.season.theme,
    data.season.year,
  ]);

  const updateSeasonMutation = useMutation({
    mutationFn: async () =>
      client.season.updateSeason({
        description: normalizeOptionalText(basicInfo.description),
        gameCode: basicInfo.gameCode.trim(),
        isActive: basicInfo.isActive,
        theme: basicInfo.theme.trim(),
        year: data.season.year,
      }),
    onError: (error) => {
      const message = getErrorMessage(error, t("season.admin.feedback.updateError"));
      setBasicInfoError(message);
      toast.error(message);
    },
    onSuccess: async () => {
      setBasicInfoError(null);
      toast.success(t("season.admin.feedback.updateSuccess"));
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: orpc.season.listAdminSeasons.queryOptions().queryKey,
        }),
        queryClient.invalidateQueries({ queryKey: detailQueryOptions.queryKey }),
      ]);
    },
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: async () =>
      client.season.deleteSeason({
        year: data.season.year,
      }),
    onError: (error) => {
      const message = getErrorMessage(error, t("season.admin.feedback.deleteError"));
      toast.error(message);
    },
    onSuccess: async () => {
      toast.success(t("season.admin.feedback.deleteSuccess", { year: data.season.year }));
      await queryClient.invalidateQueries({
        queryKey: orpc.season.listAdminSeasons.queryOptions().queryKey,
      });
      await navigate({ to: localizePathname("/staff/seasons", activeLanguage) });
    },
  });

  const lifecycleMeta = getSeasonLifecycleMeta(data.season.isActive);

  return (
    <div className="space-y-6">
      <section className="nrc-card overflow-hidden px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border-transparent", lifecycleMeta.badgeClassName)}>
                {renderStatusLabel(t, lifecycleMeta)}
              </Badge>
              <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                {data.season.gameCode}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {t("season.admin.editor.kicker")}
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
                {data.season.year} · {data.season.theme}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                {t("season.admin.editor.description")}
              </p>
            </div>
          </div>

          <div className="nrc-card-subtle space-y-2 px-4 py-4 text-sm text-muted-foreground">
            <p>
              {t("season.admin.editor.updatedAt")}{" "}
              <span className="font-medium text-foreground">
                {formatSeasonDateTime(data.season.updatedAt, locale)}
              </span>
            </p>
            <p>
              {t("season.admin.editor.createdAt")}{" "}
              <span className="font-medium text-foreground">
                {formatSeasonDateTime(data.season.createdAt, locale)}
              </span>
            </p>
            <p>
              {t("season.admin.editor.eventCount")}{" "}
              <span className="font-medium text-foreground">{data.events.length}</span>
            </p>
          </div>
        </div>
      </section>

      <Tabs className="space-y-6" defaultValue="basic">
        <TabsList variant="line">
          <TabsTrigger className="nrc-pill min-h-10 rounded-full px-4" value="basic">
            {t("season.admin.tabs.basic")}
          </TabsTrigger>
          <TabsTrigger className="nrc-pill min-h-10 rounded-full px-4" value="documents">
            {t("season.admin.tabs.documents")}
          </TabsTrigger>
          <TabsTrigger className="nrc-pill min-h-10 rounded-full px-4" value="announcements">
            {t("season.admin.tabs.announcements")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card className="nrc-card">
            <CardHeader className="border-b border-border">
              <CardTitle>{t("season.admin.tabs.basic")}</CardTitle>
              <CardDescription>{t("season.admin.basic.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="season-readonly-year">{t("season.admin.fields.year")}</Label>
                  <Input id="season-readonly-year" readOnly value={basicInfo.year} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="season-edit-game-code">{t("season.admin.fields.gameCode")}</Label>
                  <Input
                    id="season-edit-game-code"
                    onChange={(event) =>
                      setBasicInfo((current) => ({ ...current, gameCode: event.target.value }))
                    }
                    value={basicInfo.gameCode}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="season-edit-theme">{t("season.admin.fields.theme")}</Label>
                <Input
                  id="season-edit-theme"
                  onChange={(event) =>
                    setBasicInfo((current) => ({ ...current, theme: event.target.value }))
                  }
                  value={basicInfo.theme}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="season-edit-description">
                  {t("season.admin.fields.description")}
                </Label>
                <Textarea
                  id="season-edit-description"
                  onChange={(event) =>
                    setBasicInfo((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={6}
                  value={basicInfo.description}
                />
              </div>

              <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-3">
                <Checkbox
                  checked={basicInfo.isActive}
                  id="season-edit-is-active"
                  onCheckedChange={(checked) =>
                    setBasicInfo((current) => ({ ...current, isActive: checked === true }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="season-edit-is-active">{t("season.admin.fields.isActive")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("season.admin.basic.activeHint")}
                  </p>
                </div>
              </div>

              {data.events.length > 0 ? (
                <Card className="nrc-card-subtle">
                  <CardHeader className="border-b border-border/70">
                    <CardTitle>{t("season.admin.basic.eventsTitle")}</CardTitle>
                    <CardDescription>{t("season.admin.basic.eventsDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    {data.events.map((event) => {
                      const statusMeta = getSeasonEventStatusMeta(event.status);

                      return (
                        <div
                          className="flex flex-col gap-2 rounded-md border border-border bg-card px-4 py-3 md:flex-row md:items-center md:justify-between"
                          key={event.id}
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {event.name} · {event.eventCode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatSeasonDateRange(
                                event.eventStartsAt,
                                event.eventEndsAt,
                                locale,
                              )}
                            </p>
                          </div>
                          <Badge className={cn("border-transparent", statusMeta.badgeClassName)}>
                            {renderStatusLabel(t, statusMeta)}
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ) : null}

              {basicInfoError ? <p className="text-sm text-destructive">{basicInfoError}</p> : null}

              <div className="flex flex-wrap justify-between gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">
                      <Trash2 />
                      {t("season.admin.actions.deleteSeason")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("season.admin.delete.title")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("season.admin.delete.description", { year: data.season.year })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("season.admin.actions.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteSeasonMutation.mutate()}
                        variant="destructive"
                      >
                        {deleteSeasonMutation.isPending
                          ? t("season.admin.actions.deleting")
                          : t("season.admin.actions.confirmDelete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  disabled={updateSeasonMutation.isPending}
                  onClick={() => {
                    setBasicInfoError(null);
                    updateSeasonMutation.mutate();
                  }}
                  type="button"
                >
                  {updateSeasonMutation.isPending
                    ? t("season.admin.actions.saving")
                    : t("season.admin.actions.save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <SeasonDocumentsTab seasonYear={data.season.year} documents={data.documents} />
        </TabsContent>

        <TabsContent value="announcements">
          <SeasonAnnouncementsTab
            seasonYear={data.season.year}
            announcements={data.announcements}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SeasonDocumentsTab({
  documents,
  seasonYear,
}: {
  documents: AdminSeasonDocument[];
  seasonYear: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [createDraft, setCreateDraft] = useState<SeasonDocumentDraft>(emptyDocumentDraft());
  const [createError, setCreateError] = useState<string | null>(null);

  const refreshDetail = async () => {
    const { queryKey } = orpc.season.getAdminSeason.queryOptions({
      input: { year: seasonYear },
    });
    await queryClient.invalidateQueries({ queryKey });
  };

  const createDocumentMutation = useMutation({
    mutationFn: async (input: {
      kind: string;
      seasonYear: string;
      sortOrder: number;
      title: string;
      url: string;
    }) => client.season.createSeasonDocument(input),
    onError: (error) => {
      const message = getErrorMessage(error, t("season.admin.feedback.documentCreateError"));
      setCreateError(message);
      toast.error(message);
    },
    onSuccess: async () => {
      setCreateError(null);
      setCreateDraft(emptyDocumentDraft());
      toast.success(t("season.admin.feedback.documentCreateSuccess"));
      await refreshDetail();
    },
  });

  const createDocument = () => {
    try {
      setCreateError(null);
      createDocumentMutation.mutate({
        kind: createDraft.kind.trim(),
        seasonYear,
        sortOrder: parseSortOrder(createDraft.sortOrder),
        title: createDraft.title.trim(),
        url: getSeasonDocumentUrlForSave(createDraft, {
          uploadRequired: t("season.admin.documents.validation.uploadRequired"),
          urlRequired: t("season.admin.documents.validation.urlRequired"),
        }),
      });
    } catch (error) {
      const message = getErrorMessage(error, t("season.admin.feedback.documentCreateError"));
      setCreateError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="nrc-card">
        <CardHeader className="border-b border-border">
          <CardTitle>{t("season.admin.documents.title")}</CardTitle>
          <CardDescription>{t("season.admin.documents.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-4 rounded-md border border-dashed border-border bg-muted/20 p-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_11rem_8rem]">
              <div className="space-y-2">
                <Label htmlFor="season-document-create-title">
                  {t("season.admin.fields.title")}
                </Label>
                <Input
                  id="season-document-create-title"
                  onChange={(event) =>
                    setCreateDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  value={createDraft.title}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="season-document-create-kind">{t("season.admin.fields.kind")}</Label>
                <Input
                  id="season-document-create-kind"
                  onChange={(event) =>
                    setCreateDraft((current) => ({ ...current, kind: event.target.value }))
                  }
                  value={createDraft.kind}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="season-document-create-sort-order">
                  {t("season.admin.fields.sortOrder")}
                </Label>
                <Input
                  id="season-document-create-sort-order"
                  inputMode="numeric"
                  onChange={(event) =>
                    setCreateDraft((current) => ({ ...current, sortOrder: event.target.value }))
                  }
                  value={createDraft.sortOrder}
                />
              </div>
            </div>

            <SeasonDocumentSourceEditor
              draft={createDraft}
              error={createError}
              fileInputId="season-document-create-upload"
              onDraftChange={setCreateDraft}
              onUploadError={(message) => {
                setCreateError(message);
                toast.error(message);
              }}
              onUploadSuccess={(key) => {
                setCreateError(null);
                setCreateDraft((current) => ({
                  ...current,
                  sourceType: "upload",
                  url: buildSeasonDocumentUploadUrl(key, env.VITE_SERVER_URL),
                }));
                toast.success(t("season.admin.feedback.documentUploadSuccess"));
              }}
            />

            <div className="flex justify-end">
              <Button
                disabled={createDocumentMutation.isPending}
                onClick={createDocument}
                type="button"
              >
                <FilePlus2 />
                {t("season.admin.documents.add")}
              </Button>
            </div>
          </div>

          {createError ? <p className="text-sm text-destructive">{createError}</p> : null}

          {documents.length === 0 ? (
            <AdminRouteState
              description={t("season.admin.documents.empty.description")}
              icon={<FilePlus2 />}
              title={t("season.admin.documents.empty.title")}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("season.admin.fields.title")}</TableHead>
                  <TableHead>{t("season.admin.fields.kind")}</TableHead>
                  <TableHead>{t("season.admin.fields.url")}</TableHead>
                  <TableHead>{t("season.admin.fields.sortOrder")}</TableHead>
                  <TableHead className="text-right">{t("season.admin.fields.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <SeasonDocumentRow
                    document={document}
                    key={document.id}
                    seasonYear={seasonYear}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SeasonDocumentRow({
  document,
  seasonYear,
}: {
  document: AdminSeasonDocument;
  seasonYear: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SeasonDocumentDraft>(createDocumentDraftFromRecord(document));
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(createDocumentDraftFromRecord(document));
  }, [document]);

  const refreshDetail = async () => {
    const { queryKey } = orpc.season.getAdminSeason.queryOptions({
      input: { year: seasonYear },
    });
    await queryClient.invalidateQueries({ queryKey });
  };

  const updateDocumentMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      kind: string;
      seasonYear: string;
      sortOrder: number;
      title: string;
      url: string;
    }) => client.season.updateSeasonDocument(input),
    onError: (error) => {
      const message = getErrorMessage(error, t("season.admin.feedback.documentUpdateError"));
      setRowError(message);
      toast.error(message);
    },
    onSuccess: async () => {
      setRowError(null);
      toast.success(t("season.admin.feedback.documentUpdateSuccess"));
      await refreshDetail();
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async () =>
      client.season.deleteSeasonDocument({
        id: document.id,
        seasonYear,
      }),
    onError: (error) => {
      const message = getErrorMessage(error, t("season.admin.feedback.documentDeleteError"));
      setRowError(message);
      toast.error(message);
    },
    onSuccess: async () => {
      setRowError(null);
      toast.success(t("season.admin.feedback.documentDeleteSuccess"));
      await refreshDetail();
    },
  });

  const updateDocument = () => {
    try {
      setRowError(null);
      updateDocumentMutation.mutate({
        id: document.id,
        kind: draft.kind.trim(),
        seasonYear,
        sortOrder: parseSortOrder(draft.sortOrder),
        title: draft.title.trim(),
        url: getSeasonDocumentUrlForSave(draft, {
          uploadRequired: t("season.admin.documents.validation.uploadRequired"),
          urlRequired: t("season.admin.documents.validation.urlRequired"),
        }),
      });
    } catch (error) {
      const message = getErrorMessage(error, t("season.admin.feedback.documentUpdateError"));
      setRowError(message);
      toast.error(message);
    }
  };

  return (
    <TableRow>
      <TableCell className="align-top whitespace-normal">
        <Input
          aria-label={t("season.admin.fields.title")}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          value={draft.title}
        />
      </TableCell>
      <TableCell className="align-top whitespace-normal">
        <Input
          aria-label={t("season.admin.fields.kind")}
          onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value }))}
          value={draft.kind}
        />
      </TableCell>
      <TableCell className="align-top whitespace-normal">
        <SeasonDocumentSourceEditor
          compact
          draft={draft}
          error={rowError}
          fileInputId={`season-document-upload-${document.id}`}
          onDraftChange={setDraft}
          onUploadError={(message) => {
            setRowError(message);
            toast.error(message);
          }}
          onUploadSuccess={(key) => {
            setRowError(null);
            setDraft((current) => ({
              ...current,
              sourceType: "upload",
              url: buildSeasonDocumentUploadUrl(key, env.VITE_SERVER_URL),
            }));
            toast.success(t("season.admin.feedback.documentUploadSuccess"));
          }}
        />
      </TableCell>
      <TableCell className="align-top whitespace-normal">
        <Input
          aria-label={t("season.admin.fields.sortOrder")}
          inputMode="numeric"
          onChange={(event) =>
            setDraft((current) => ({ ...current, sortOrder: event.target.value }))
          }
          value={draft.sortOrder}
        />
      </TableCell>
      <TableCell className="align-top whitespace-normal">
        <div className="flex justify-end gap-2">
          <Button
            disabled={updateDocumentMutation.isPending || deleteDocumentMutation.isPending}
            onClick={updateDocument}
            size="sm"
            type="button"
            variant="outline"
          >
            {t("season.admin.actions.save")}
          </Button>
          <Button
            disabled={updateDocumentMutation.isPending || deleteDocumentMutation.isPending}
            onClick={() => deleteDocumentMutation.mutate()}
            size="sm"
            type="button"
            variant="destructive"
          >
            <Trash2 />
            {t("season.admin.actions.delete")}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SeasonDocumentSourceEditor({
  compact = false,
  draft,
  error,
  fileInputId,
  onDraftChange,
  onUploadError,
  onUploadSuccess,
}: {
  compact?: boolean;
  draft: SeasonDocumentDraft;
  error: string | null;
  fileInputId: string;
  onDraftChange: (updater: (current: SeasonDocumentDraft) => SeasonDocumentDraft) => void;
  onUploadError: (message: string) => void;
  onUploadSuccess: (key: string) => void;
}) {
  const { t } = useTranslation();
  const uploadedKey = getSeasonDocumentUploadKey(draft.url, env.VITE_SERVER_URL);

  return (
    <div
      className={cn(
        "space-y-3",
        compact ? "min-w-[18rem]" : "rounded-md border border-border bg-background/70 p-4",
      )}
    >
      <div className="space-y-2">
        <Label>{t("season.admin.documents.sourceLabel")}</Label>
        <RadioGroup
          className={compact ? "gap-2" : "gap-3 sm:grid-cols-2"}
          onValueChange={(value) =>
            onDraftChange((current) => ({
              ...current,
              sourceType: value === "upload" ? "upload" : "url",
            }))
          }
          value={draft.sourceType}
        >
          <label
            className="flex items-start gap-3 rounded-md border border-border bg-background px-3 py-3 text-sm"
            htmlFor={`${fileInputId}-source-url`}
          >
            <RadioGroupItem id={`${fileInputId}-source-url`} value="url" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {t("season.admin.documents.source.url")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("season.admin.documents.source.urlHint")}
              </p>
            </div>
          </label>
          <label
            className="flex items-start gap-3 rounded-md border border-border bg-background px-3 py-3 text-sm"
            htmlFor={`${fileInputId}-source-upload`}
          >
            <RadioGroupItem id={`${fileInputId}-source-upload`} value="upload" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {t("season.admin.documents.source.upload")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("season.admin.documents.source.uploadHint")}
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {draft.sourceType === "url" ? (
        <div className="space-y-2">
          <Label htmlFor={`${fileInputId}-url`}>{t("season.admin.fields.url")}</Label>
          <Input
            id={`${fileInputId}-url`}
            onChange={(event) =>
              onDraftChange((current) => ({ ...current, url: event.target.value }))
            }
            placeholder="https://example.com/manual.pdf"
            type="url"
            value={draft.url}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={fileInputId}>{t("season.admin.documents.uploadField")}</Label>
            <FileUploader
              accept=".pdf,.doc,.docx,.txt"
              inputId={fileInputId}
              maxFiles={1}
              multiple={false}
              onError={(uploadError) => {
                onUploadError(
                  getErrorMessage(uploadError, t("season.admin.feedback.documentUploadError")),
                );
              }}
              onSuccess={(keys) => {
                const key = keys[0];

                if (!key) {
                  onUploadError(t("season.admin.feedback.documentUploadError"));
                  return;
                }

                onUploadSuccess(key);
              }}
              route={UPLOAD_ROUTES.DOCUMENTS}
            />
          </div>

          {uploadedKey ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm">
              <p className="font-medium text-emerald-800">
                {t("season.admin.documents.uploadReady")}
              </p>
              <a
                className="mt-1 inline-flex items-center gap-1 text-emerald-700 underline underline-offset-4"
                href={draft.url}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="size-3.5" />
                {t("season.admin.documents.open")}
              </a>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("season.admin.documents.uploadPending")}
            </p>
          )}
        </div>
      )}

      {draft.url.trim() && draft.sourceType === "url" ? (
        <a
          className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4"
          href={draft.url}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink className="size-3.5" />
          {t("season.admin.documents.open")}
        </a>
      ) : null}

      {compact && error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function SeasonAnnouncementsTab({
  announcements,
  seasonYear,
}: {
  announcements: AdminSeasonAnnouncement[];
  seasonYear: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [createDraft, setCreateDraft] = useState<SeasonAnnouncementDraft>({
    ...emptyAnnouncementDraft(),
    publishedAt: toDateTimeLocalValue(new Date().toISOString()),
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const refreshDetail = async () => {
    const { queryKey } = orpc.season.getAdminSeason.queryOptions({
      input: { year: seasonYear },
    });
    await queryClient.invalidateQueries({ queryKey });
  };

  const createAnnouncementMutation = useMutation({
    mutationFn: async () =>
      client.season.createSeasonAnnouncement({
        body: createDraft.body.trim(),
        isPinned: createDraft.isPinned,
        publishedAt: toIsoDateTime(createDraft.publishedAt),
        seasonYear,
        sortOrder: parseSortOrder(createDraft.sortOrder),
        title: createDraft.title.trim(),
      }),
    onError: (error) => {
      const message = getErrorMessage(error, t("season.admin.feedback.announcementCreateError"));
      setCreateError(message);
      toast.error(message);
    },
    onSuccess: async () => {
      setCreateError(null);
      setCreateDraft({
        ...emptyAnnouncementDraft(),
        publishedAt: toDateTimeLocalValue(new Date().toISOString()),
      });
      toast.success(t("season.admin.feedback.announcementCreateSuccess"));
      await refreshDetail();
    },
  });

  return (
    <Card className="nrc-card">
      <CardHeader className="border-b border-border">
        <CardTitle>{t("season.admin.announcements.title")}</CardTitle>
        <CardDescription>{t("season.admin.announcements.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="grid gap-4 rounded-md border border-dashed border-border bg-muted/20 p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_8rem]">
            <div className="space-y-2">
              <Label htmlFor="season-announcement-create-title">
                {t("season.admin.fields.title")}
              </Label>
              <Input
                id="season-announcement-create-title"
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, title: event.target.value }))
                }
                value={createDraft.title}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="season-announcement-create-published-at">
                {t("season.admin.fields.publishedAt")}
              </Label>
              <Input
                id="season-announcement-create-published-at"
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, publishedAt: event.target.value }))
                }
                type="datetime-local"
                value={createDraft.publishedAt}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="season-announcement-create-sort-order">
                {t("season.admin.fields.sortOrder")}
              </Label>
              <Input
                id="season-announcement-create-sort-order"
                inputMode="numeric"
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, sortOrder: event.target.value }))
                }
                value={createDraft.sortOrder}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="season-announcement-create-body">{t("season.admin.fields.body")}</Label>
            <Textarea
              id="season-announcement-create-body"
              onChange={(event) =>
                setCreateDraft((current) => ({ ...current, body: event.target.value }))
              }
              rows={5}
              value={createDraft.body}
            />
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
              <Checkbox
                checked={createDraft.isPinned}
                id="season-announcement-create-is-pinned"
                onCheckedChange={(checked) =>
                  setCreateDraft((current) => ({ ...current, isPinned: checked === true }))
                }
              />
              <Label htmlFor="season-announcement-create-is-pinned">
                {t("season.admin.fields.isPinned")}
              </Label>
            </div>

            <Button
              disabled={createAnnouncementMutation.isPending}
              onClick={() => {
                setCreateError(null);
                createAnnouncementMutation.mutate();
              }}
              type="button"
            >
              <Megaphone />
              {t("season.admin.announcements.add")}
            </Button>
          </div>
        </div>

        {createError ? <p className="text-sm text-destructive">{createError}</p> : null}

        {announcements.length === 0 ? (
          <AdminRouteState
            description={t("season.admin.announcements.empty.description")}
            icon={<Megaphone />}
            title={t("season.admin.announcements.empty.title")}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("season.admin.fields.title")}</TableHead>
                <TableHead>{t("season.admin.fields.body")}</TableHead>
                <TableHead>{t("season.admin.fields.publishedAt")}</TableHead>
                <TableHead>{t("season.admin.fields.pinned")}</TableHead>
                <TableHead>{t("season.admin.fields.sortOrder")}</TableHead>
                <TableHead className="text-right">{t("season.admin.fields.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => (
                <SeasonAnnouncementRow
                  announcement={announcement}
                  key={announcement.id}
                  seasonYear={seasonYear}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SeasonAnnouncementRow({
  announcement,
  seasonYear,
}: {
  announcement: AdminSeasonAnnouncement;
  seasonYear: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SeasonAnnouncementDraft>({
    body: announcement.body,
    isPinned: announcement.isPinned,
    publishedAt: toDateTimeLocalValue(announcement.publishedAt),
    sortOrder: String(announcement.sortOrder),
    title: announcement.title,
  });
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    setDraft({
      body: announcement.body,
      isPinned: announcement.isPinned,
      publishedAt: toDateTimeLocalValue(announcement.publishedAt),
      sortOrder: String(announcement.sortOrder),
      title: announcement.title,
    });
  }, [
    announcement.body,
    announcement.isPinned,
    announcement.publishedAt,
    announcement.sortOrder,
    announcement.title,
  ]);

  const refreshDetail = async () => {
    const { queryKey } = orpc.season.getAdminSeason.queryOptions({
      input: { year: seasonYear },
    });
    await queryClient.invalidateQueries({ queryKey });
  };

  const updateAnnouncementMutation = useMutation({
    mutationFn: async () =>
      client.season.updateSeasonAnnouncement({
        body: draft.body.trim(),
        id: announcement.id,
        isPinned: draft.isPinned,
        publishedAt: toIsoDateTime(draft.publishedAt),
        seasonYear,
        sortOrder: parseSortOrder(draft.sortOrder),
        title: draft.title.trim(),
      }),
    onError: (error) => {
      const message = getErrorMessage(error, t("season.admin.feedback.announcementUpdateError"));
      setRowError(message);
      toast.error(message);
    },
    onSuccess: async () => {
      setRowError(null);
      toast.success(t("season.admin.feedback.announcementUpdateSuccess"));
      await refreshDetail();
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async () =>
      client.season.deleteSeasonAnnouncement({
        id: announcement.id,
        seasonYear,
      }),
    onError: (error) => {
      const message = getErrorMessage(error, t("season.admin.feedback.announcementDeleteError"));
      setRowError(message);
      toast.error(message);
    },
    onSuccess: async () => {
      setRowError(null);
      toast.success(t("season.admin.feedback.announcementDeleteSuccess"));
      await refreshDetail();
    },
  });

  return (
    <TableRow>
      <TableCell className="align-top whitespace-normal">
        <Input
          aria-label={t("season.admin.fields.title")}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          value={draft.title}
        />
      </TableCell>
      <TableCell className="align-top whitespace-normal">
        <Textarea
          aria-label={t("season.admin.fields.body")}
          onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
          rows={4}
          value={draft.body}
        />
        {rowError ? <p className="mt-2 text-xs text-destructive">{rowError}</p> : null}
      </TableCell>
      <TableCell className="align-top whitespace-normal">
        <Input
          aria-label={t("season.admin.fields.publishedAt")}
          onChange={(event) =>
            setDraft((current) => ({ ...current, publishedAt: event.target.value }))
          }
          type="datetime-local"
          value={draft.publishedAt}
        />
      </TableCell>
      <TableCell className="align-top whitespace-normal">
        <div className="flex h-9 items-center">
          <Checkbox
            aria-label={t("season.admin.fields.isPinned")}
            checked={draft.isPinned}
            onCheckedChange={(checked) =>
              setDraft((current) => ({ ...current, isPinned: checked === true }))
            }
          />
        </div>
      </TableCell>
      <TableCell className="align-top whitespace-normal">
        <Input
          aria-label={t("season.admin.fields.sortOrder")}
          inputMode="numeric"
          onChange={(event) =>
            setDraft((current) => ({ ...current, sortOrder: event.target.value }))
          }
          value={draft.sortOrder}
        />
      </TableCell>
      <TableCell className="align-top whitespace-normal">
        <div className="flex justify-end gap-2">
          <Button
            disabled={updateAnnouncementMutation.isPending || deleteAnnouncementMutation.isPending}
            onClick={() => {
              setRowError(null);
              updateAnnouncementMutation.mutate();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            {t("season.admin.actions.save")}
          </Button>
          <Button
            disabled={updateAnnouncementMutation.isPending || deleteAnnouncementMutation.isPending}
            onClick={() => deleteAnnouncementMutation.mutate()}
            size="sm"
            type="button"
            variant="destructive"
          >
            <Trash2 />
            {t("season.admin.actions.delete")}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function AdminSeasonEditorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="nrc-card space-y-4 px-6 py-6 sm:px-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-4 w-full max-w-3xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="nrc-card space-y-4 px-6 py-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-12 w-full" key={`season-editor-skeleton-${index}`} />
        ))}
      </div>
    </div>
  );
}

export function AdminSeasonNotFoundState({ seasonYear }: { seasonYear: string }) {
  const { t, i18n } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

  return (
    <AdminRouteState
      action={t("season.admin.notFound.action")}
      actionTo={localizePathname("/staff/seasons", activeLanguage)}
      description={t("season.admin.notFound.description")}
      icon={<Search />}
      title={t("season.admin.notFound.title", { year: seasonYear })}
    />
  );
}

export function AdminSeasonLoadErrorState({ onRetry }: { onRetry: () => void | Promise<void> }) {
  const { t } = useTranslation();

  return (
    <AdminRouteState
      action={t("season.admin.loadError.retry")}
      description={t("season.admin.loadError.description")}
      icon={<Search />}
      onAction={onRetry}
      title={t("season.admin.loadError.title")}
    />
  );
}

export function AdminSeasonInvalidState() {
  const { t, i18n } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

  return (
    <AdminRouteState
      action={t("season.admin.notFound.action")}
      actionTo={localizePathname("/staff/seasons", activeLanguage)}
      description={t("season.invalid.description")}
      icon={<Search />}
      title={t("season.invalid.title")}
    />
  );
}

function AdminRouteState({
  action,
  actionTo,
  description,
  icon,
  onAction,
  title,
}: {
  action?: string;
  actionTo?: string;
  description: string;
  icon: React.ReactNode;
  onAction?: () => void | Promise<void>;
  title: string;
}) {
  return (
    <Empty className="nrc-card py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && actionTo ? (
        <Button asChild>
          <Link to={actionTo}>{action}</Link>
        </Button>
      ) : null}
      {action && onAction ? (
        <Button onClick={() => void onAction()} type="button">
          {action}
        </Button>
      ) : null}
    </Empty>
  );
}
