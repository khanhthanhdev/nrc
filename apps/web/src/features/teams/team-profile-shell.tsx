import type { ReactNode } from "react";
import { useState } from "react";

import { env } from "@nrc-full/env/web";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Camera, ImagePlus, PencilLine } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUploader, UPLOAD_ROUTES } from "@/components/upload";
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";
import { cn } from "@/lib/utils";
import { client, queryClient } from "@/utils/orpc";

import { buildTeamImageUploadUrl, resolveTeamImageUrl } from "./helpers";
import type { PublicTeamProfileData } from "./types";

export type TeamProfileTab = "history" | "invitations" | "manage" | "media" | "overview" | "roster";

interface TeamProfileShellProps {
  activeTab: TeamProfileTab;
  children: ReactNode;
  showManageTabs: boolean;
  team: PublicTeamProfileData;
}

type TeamMediaField = "avatarUrl" | "coverImageUrl";

const tabClassName =
  "border-b-2 border-transparent px-1 py-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
const activeTabClassName = "border-primary text-foreground";

const tabSearch = (tab: TeamProfileTab) => (tab === "overview" ? { tab: undefined } : { tab });

const tabLabelKey = (tab: TeamProfileTab) => {
  switch (tab) {
    case "overview": {
      return "routes.team.tabs.overview";
    }
    case "roster": {
      return "routes.team.tabs.roster";
    }
    case "history": {
      return "routes.team.tabs.history";
    }
    case "media": {
      return "routes.team.tabs.media";
    }
    case "manage": {
      return "routes.team.tabs.manage";
    }
    case "invitations": {
      return "routes.team.tabs.invitations";
    }
    default: {
      return "routes.team.tabs.overview";
    }
  }
};

export function TeamProfileShell({
  activeTab,
  children,
  showManageTabs,
  team,
}: TeamProfileShellProps) {
  const { t, i18n } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
  const [uploadDialogField, setUploadDialogField] = useState<TeamMediaField | null>(null);
  const updateMediaMutation = useMutation({
    mutationFn: ({ field, url }: { field: TeamMediaField; url: string }) =>
      client.team.updateTeamProfile({
        [field]: url,
        teamId: team.id,
      }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries();
      toast.success(
        variables.field === "coverImageUrl"
          ? t("routes.team.profile.feedback.coverUpdated")
          : t("routes.team.profile.feedback.logoUpdated"),
      );
    },
  });

  const initials = team.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const coverImageUrl = resolveTeamImageUrl(team.coverImageUrl, env.VITE_SERVER_URL);
  const avatarUrl = resolveTeamImageUrl(team.avatarUrl, env.VITE_SERVER_URL);

  const handleUploadedImages = async (keys: string[]): Promise<void> => {
    const field = uploadDialogField;
    const key = keys[0];

    if (!field || !key) {
      return;
    }

    try {
      await updateMediaMutation.mutateAsync({
        field,
        url: buildTeamImageUploadUrl(key, env.VITE_SERVER_URL),
      });
      setUploadDialogField(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("routes.team.profile.feedback.imageUpdateFailed"),
      );
    }
  };

  const isSavingCover = updateMediaMutation.isPending && uploadDialogField === "coverImageUrl";
  const isSavingAvatar = updateMediaMutation.isPending && uploadDialogField === "avatarUrl";

  return (
    <section className="space-y-8">
      <div className="-mx-4 border-b bg-background sm:-mx-6 lg:-mx-8">
        <div className="relative h-56 bg-muted sm:h-72 lg:h-80">
          {coverImageUrl ? (
            <img alt="" className="h-full w-full object-cover" src={coverImageUrl} />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,var(--dt-color-gray-100),var(--dt-color-gray-300)_55%,var(--dt-color-gray-200))]" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />

          {showManageTabs && (
            <div className="absolute right-4 bottom-4 flex flex-wrap justify-end gap-2 sm:right-8">
              <Button
                className="bg-background/95"
                disabled={isSavingCover}
                onClick={() => setUploadDialogField("coverImageUrl")}
                size="sm"
                type="button"
                variant="secondary"
              >
                <ImagePlus className="size-4" />
                {isSavingCover
                  ? t("routes.team.profile.saving")
                  : t("routes.team.profile.changeCover")}
              </Button>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative -mt-14 size-28 shrink-0 sm:-mt-16 sm:size-36">
                  <Avatar className="size-full border-4 border-background bg-background shadow-sm">
                    <AvatarImage alt={team.name} src={avatarUrl} />
                    <AvatarFallback className="text-3xl font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  {showManageTabs && (
                    <Button
                      aria-label={t("routes.team.profile.changeTeamLogo")}
                      className="absolute right-1 bottom-1 rounded-full bg-background shadow-sm"
                      disabled={isSavingAvatar}
                      onClick={() => setUploadDialogField("avatarUrl")}
                      size="icon-sm"
                      type="button"
                      variant="secondary"
                    >
                      <Camera className="size-4" />
                    </Button>
                  )}
                </div>

                <div className="min-w-0 space-y-2 pb-1">
                  <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                    {team.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      {t("routes.team.profile.teamLabel", { teamNumber: team.teamNumber })}
                    </span>
                    {team.schoolOrOrganization && <span>{team.schoolOrOrganization}</span>}
                    {team.cityOrProvince && <span>{team.cityOrProvince}</span>}
                  </div>
                </div>
              </div>

              {showManageTabs && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="w-fit"
                    disabled={isSavingAvatar}
                    onClick={() => setUploadDialogField("avatarUrl")}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Camera className="size-4" />
                    {isSavingAvatar
                      ? t("routes.team.profile.saving")
                      : t("routes.team.profile.changeLogo")}
                  </Button>
                  <Button asChild className="w-fit" size="sm" variant="outline">
                    <Link
                      params={{ teamNumber: team.teamNumber }}
                      search={{ tab: "manage" }}
                      to={localizePathname("/teams/$teamNumber", activeLanguage)}
                    >
                      <PencilLine className="size-4" />
                      {t("routes.team.profile.editProfile")}
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <nav className="flex gap-6 overflow-x-auto">
              {(["overview", "roster", "history", "media"] as const).map((tab) => (
                <Link
                  className={cn(tabClassName, activeTab === tab && activeTabClassName)}
                  key={tab}
                  params={{ teamNumber: team.teamNumber }}
                  search={tabSearch(tab)}
                  to={localizePathname("/teams/$teamNumber", activeLanguage)}
                >
                  {t(tabLabelKey(tab))}
                </Link>
              ))}
              {showManageTabs &&
                (["manage", "invitations"] as const).map((tab) => (
                  <Link
                    className={cn(tabClassName, activeTab === tab && activeTabClassName)}
                    key={tab}
                    params={{ teamNumber: team.teamNumber }}
                    search={tabSearch(tab)}
                    to={localizePathname("/teams/$teamNumber", activeLanguage)}
                  >
                    {t(tabLabelKey(tab))}
                  </Link>
                ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-4">{children}</div>

      <Dialog
        onOpenChange={(open) => {
          if (!open && !updateMediaMutation.isPending) {
            setUploadDialogField(null);
          }
        }}
        open={uploadDialogField !== null}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {uploadDialogField === "coverImageUrl"
                ? t("routes.team.profile.changeCoverImage")
                : t("routes.team.profile.changeTeamLogo")}
            </DialogTitle>
            <DialogDescription>{t("routes.team.profile.uploadImageDescription")}</DialogDescription>
          </DialogHeader>

          <ImageUploader
            maxFiles={1}
            onError={(error) => {
              toast.error(error.message);
            }}
            onSuccess={(keys) => {
              void handleUploadedImages(keys);
            }}
            route={UPLOAD_ROUTES.IMAGES}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
