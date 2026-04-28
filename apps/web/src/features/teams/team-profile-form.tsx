import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { client, queryClient } from "@/utils/orpc";

import type { PublicTeamProfileData } from "./types";

interface TeamProfileFormProps {
  team: PublicTeamProfileData;
}

export function TeamProfileForm({ team }: TeamProfileFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description ?? "");
  const [schoolOrOrganization, setSchoolOrOrganization] = useState(team.schoolOrOrganization ?? "");
  const [cityOrProvince, setCityOrProvince] = useState(team.cityOrProvince ?? "");
  const [avatarUrl, setAvatarUrl] = useState(team.avatarUrl ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(team.coverImageUrl ?? "");

  const updateMutation = useMutation({
    mutationFn: () =>
      client.team.updateTeamProfile({
        avatarUrl: avatarUrl || null,
        cityOrProvince: cityOrProvince || null,
        coverImageUrl: coverImageUrl || null,
        description: description || null,
        name,
        schoolOrOrganization: schoolOrOrganization || null,
        teamId: team.id,
      }),
    onSuccess: async () => {
      toast.success(t("routes.team.profile.feedback.updated"));
      await queryClient.invalidateQueries();
    },
  });

  const onSubmit = async (): Promise<void> => {
    try {
      await updateMutation.mutateAsync();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("routes.team.profile.feedback.updateFailed"),
      );
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("routes.team.profile.editProfile")}</h2>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="edit-name">{t("routes.team.fields.name")}</Label>
          <Input id="edit-name" onChange={(e) => setName(e.target.value)} required value={name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-school">{t("routes.team.schoolOrOrganization")}</Label>
          <Input
            id="edit-school"
            onChange={(e) => setSchoolOrOrganization(e.target.value)}
            value={schoolOrOrganization}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-city">{t("routes.team.cityOrProvince")}</Label>
          <Input
            id="edit-city"
            onChange={(e) => setCityOrProvince(e.target.value)}
            value={cityOrProvince}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-description">{t("routes.team.fields.description")}</Label>
          <Textarea
            id="edit-description"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-avatar">{t("routes.team.profile.avatarUrl")}</Label>
          <Input
            id="edit-avatar"
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            value={avatarUrl}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-cover">{t("routes.team.profile.coverImageUrl")}</Label>
          <Input
            id="edit-cover"
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://..."
            value={coverImageUrl}
          />
        </div>

        <Button disabled={updateMutation.isPending} type="submit">
          {updateMutation.isPending
            ? t("routes.team.profile.saving")
            : t("routes.team.profile.save")}
        </Button>
      </form>
    </div>
  );
}
