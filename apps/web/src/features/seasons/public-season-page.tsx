import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  Megaphone,
  Search,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { PublicSeasonPageData } from "./types";

import {
  deriveSeasonHeroCtas,
  formatSeasonAnnouncementDate,
  formatSeasonDateRange,
  formatSeasonLocation,
  getSeasonEventStatusMeta,
  getSeasonLifecycleMeta,
  getSeasonLocale,
  renderStatusLabel,
} from "./helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface PublicSeasonPageProps {
  data: PublicSeasonPageData;
}

export function PublicSeasonPage({ data }: PublicSeasonPageProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [seasonSwitcherOpen, setSeasonSwitcherOpen] = useState(false);
  const locale = getSeasonLocale(i18n.resolvedLanguage ?? i18n.language ?? "en");
  const heroCtas = deriveSeasonHeroCtas(data.documents);
  const seasonMeta = getSeasonLifecycleMeta(data.season.isActive);

  return (
    <div className="space-y-8">
      <section className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="nrc-hero relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(84,201,194,0.2),transparent_52%),radial-gradient(circle_at_center,rgba(68,122,255,0.25),transparent_48%)] lg:block" />
          <div className="absolute -top-20 left-1/2 h-56 w-56 rounded-full bg-white/6 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={cn("border-white/12 bg-white/10 text-white", seasonMeta.badgeClassName)}>
                  {renderStatusLabel(t, seasonMeta)}
                </Badge>
                <Badge className="border-white/12 bg-white/10 text-white">{data.season.gameCode}</Badge>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
                  {t("season.public.hero.kicker")}
                </p>
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                  {data.season.year}
                </h1>
                <p className="text-xl font-semibold tracking-[-0.03em] text-white/92 sm:text-2xl">
                  {data.season.theme}
                </p>
                <p className="max-w-3xl text-sm leading-7 text-white/76 sm:text-base">
                  {data.season.description ?? t("season.public.hero.descriptionFallback")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {heroCtas.primary ? (
                  <Button asChild>
                    <a href={heroCtas.primary.url} rel="noreferrer" target="_blank">
                      <Download />
                      {t("season.public.hero.primaryCta")}
                    </a>
                  </Button>
                ) : null}

                {heroCtas.secondary ? (
                  <Button asChild variant="secondary">
                    <a href={heroCtas.secondary.url} rel="noreferrer" target="_blank">
                      <FileText />
                      {t("season.public.hero.secondaryCta", {
                        title: heroCtas.secondary.title,
                      })}
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="space-y-3 rounded-[28px] border border-white/12 bg-white/7 p-4 backdrop-blur">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  {t("season.public.switcher.label")}
                </p>
                <p className="text-sm text-white/80">{t("season.public.switcher.description")}</p>
              </div>

              <Popover onOpenChange={setSeasonSwitcherOpen} open={seasonSwitcherOpen}>
                <PopoverTrigger asChild>
                  <Button
                    className="w-full justify-between border-white/12 bg-white/10 text-white hover:border-white/20 hover:bg-white/15 hover:text-white"
                    type="button"
                    variant="outline"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Sparkles className="size-4" />
                      <span className="truncate">
                        {data.season.year} · {data.season.theme}
                      </span>
                    </span>
                    <Search className="size-4 opacity-70" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[22rem] p-0">
                  <Command>
                    <CommandInput placeholder={t("season.public.switcher.searchPlaceholder")} />
                    <CommandList>
                      <CommandEmpty>{t("season.public.switcher.empty")}</CommandEmpty>
                      {data.seasonOptions.map((option) => (
                        <CommandItem
                          data-checked={option.year === data.season.year}
                          key={option.year}
                          onSelect={() => {
                            setSeasonSwitcherOpen(false);
                            void navigate({
                              params: { season: option.year },
                              to: "/$season",
                            });
                          }}
                          value={`${option.year} ${option.theme} ${option.gameCode}`}
                        >
                          <div className="flex flex-1 items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {option.year} · {option.theme}
                              </p>
                              <p className="truncate text-muted-foreground">
                                {option.gameCode}
                              </p>
                            </div>
                            <Badge
                              className={cn(
                                "border-transparent",
                                option.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-700",
                              )}
                            >
                              {option.isActive
                                ? t("season.admin.lifecycle.active")
                                : t("season.admin.lifecycle.archived")}
                            </Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </section>

      <Tabs className="space-y-6" defaultValue="events">
        <TabsList className="w-full justify-start gap-2 bg-transparent p-0" variant="line">
          <TabsTrigger className="nrc-pill min-h-10 rounded-full px-4" value="events">
            {t("season.public.tabs.events")}
          </TabsTrigger>
          <TabsTrigger className="nrc-pill min-h-10 rounded-full px-4" value="documents">
            {t("season.public.tabs.documents")}
          </TabsTrigger>
          <TabsTrigger className="nrc-pill min-h-10 rounded-full px-4" value="announcements">
            {t("season.public.tabs.announcements")}
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="events">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {t("season.public.events.title", { year: data.season.year })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("season.public.events.description")}
            </p>
          </div>

          {data.events.length === 0 ? (
            <SeasonEmptyState
              description={t("season.public.events.emptyDescription")}
              title={t("season.public.events.emptyTitle")}
            />
          ) : (
            <div className="space-y-4">
              {data.events.map((event) => {
                const statusMeta = getSeasonEventStatusMeta(event.status);
                const locationLabel = formatSeasonLocation(event);

                return (
                  <article
                    className={cn(
                      "nrc-card grid gap-5 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center",
                      event.name.toLowerCase().includes("final")
                        ? "border-primary/25 bg-linear-to-r from-card to-sky-50/60"
                        : "",
                    )}
                    key={event.id}
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn("border-transparent", statusMeta.badgeClassName)}>
                            {renderStatusLabel(t, statusMeta)}
                          </Badge>
                          <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            {event.eventCode}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
                          {event.name}
                        </h3>
                        {event.summary ? (
                          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                            {event.summary}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                        <div className="flex items-start gap-2">
                          <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{formatSeasonDateRange(event.eventStartsAt, event.eventEndsAt, locale)}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{locationLabel || t("season.public.events.locationFallback")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end">
                      <Button asChild>
                        <Link params={{ eventId: event.eventCode, season: data.season.year }} to="/$season/$eventId">
                          {t("season.public.events.viewDetails")}
                          <ArrowRight />
                        </Link>
                      </Button>
                      {event.status === "registration_open" ? (
                        <Button asChild variant="secondary">
                          <Link params={{ eventId: event.eventCode }} to="/register/$eventId">
                            {t("season.public.events.register")}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="documents">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {t("season.public.documents.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("season.public.documents.description")}
            </p>
          </div>

          {data.documents.length === 0 ? (
            <SeasonEmptyState
              description={t("season.public.documents.emptyDescription")}
              title={t("season.public.documents.emptyTitle")}
            />
          ) : (
            <div className="grid gap-3">
              {data.documents.map((document) => (
                <a
                  className="nrc-card flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:border-primary/25 hover:bg-sky-50/40"
                  href={document.url}
                  key={document.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-foreground">
                        {document.title}
                      </p>
                      <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                        {document.kind}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("season.public.documents.sortOrder", { order: document.sortOrder })}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary">
                    {t("season.public.documents.open")}
                    <ExternalLink className="size-4" />
                  </span>
                </a>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="announcements">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {t("season.public.announcements.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("season.public.announcements.description")}
            </p>
          </div>

          {data.announcements.length === 0 ? (
            <SeasonEmptyState
              description={t("season.public.announcements.emptyDescription")}
              title={t("season.public.announcements.emptyTitle")}
            />
          ) : (
            <div className="space-y-4">
              {data.announcements.map((announcement) => (
                <article
                  className={cn(
                    "nrc-card space-y-4 px-5 py-5 sm:px-6",
                    announcement.isPinned
                      ? "border-primary/25 bg-linear-to-r from-sky-50 to-white"
                      : "",
                  )}
                  key={announcement.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {announcement.isPinned ? (
                          <Badge className="border-primary/10 bg-primary/10 text-primary">
                            {t("season.public.announcements.pinned")}
                          </Badge>
                        ) : null}
                        <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          {formatSeasonAnnouncementDate(announcement, locale)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                        {announcement.title}
                      </h3>
                    </div>
                    <Megaphone className="size-5 shrink-0 text-primary" />
                  </div>

                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {announcement.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function PublicSeasonPageSkeleton() {
  return (
    <div className="space-y-8">
      <section className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="nrc-hero space-y-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-6 w-24 bg-white/12" />
            <Skeleton className="h-6 w-20 bg-white/12" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-36 bg-white/12" />
            <Skeleton className="h-12 w-40 bg-white/12" />
            <Skeleton className="h-8 w-72 bg-white/12" />
            <Skeleton className="h-4 w-full max-w-2xl bg-white/12" />
            <Skeleton className="h-4 w-full max-w-xl bg-white/12" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 w-48 bg-white/12" />
            <Skeleton className="h-11 w-52 bg-white/12" />
          </div>
        </div>
      </section>

      <div className="flex gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="nrc-card space-y-4 px-5 py-5" key={`season-skeleton-${index}`}>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-7 w-72" />
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SeasonRouteStateProps {
  description: string;
  title: string;
}

function SeasonEmptyState({ description, title }: SeasonRouteStateProps) {
  return (
    <Empty className="nrc-card border-dashed border-border bg-card py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileText />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function PublicSeasonNotFoundState({ season }: { season: string }) {
  const { t } = useTranslation();

  return (
    <Empty className="nrc-card py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search />
        </EmptyMedia>
        <EmptyTitle>{t("season.public.notFound.title", { season })}</EmptyTitle>
        <EmptyDescription>{t("season.public.notFound.description")}</EmptyDescription>
      </EmptyHeader>
      <Button asChild>
        <Link to="/events">{t("season.public.notFound.action")}</Link>
      </Button>
    </Empty>
  );
}

export function PublicSeasonLoadErrorState({
  onRetry,
}: {
  onRetry: () => void | Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <Empty className="nrc-card py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileText />
        </EmptyMedia>
        <EmptyTitle>{t("season.public.loadError.title")}</EmptyTitle>
        <EmptyDescription>{t("season.public.loadError.description")}</EmptyDescription>
      </EmptyHeader>
      <Button onClick={() => void onRetry()} type="button">
        {t("season.public.loadError.retry")}
      </Button>
    </Empty>
  );
}

export function SeasonInvalidParamState() {
  const { t } = useTranslation();

  return (
    <Empty className="nrc-card py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search />
        </EmptyMedia>
        <EmptyTitle>{t("season.invalid.title")}</EmptyTitle>
        <EmptyDescription>{t("season.invalid.description")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
