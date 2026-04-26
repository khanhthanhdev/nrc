import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
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
      toast.success("Team profile updated.");
      await queryClient.invalidateQueries();
    },
  });

  const onSubmit = async (): Promise<void> => {
    try {
      await updateMutation.mutateAsync();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Edit profile</h2>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="edit-name">Team name</Label>
          <Input
            id="edit-name"
            onChange={(e) => setName(e.target.value)}
            required
            value={name}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-school">School / Organization</Label>
          <Input
            id="edit-school"
            onChange={(e) => setSchoolOrOrganization(e.target.value)}
            value={schoolOrOrganization}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-city">City / Province</Label>
          <Input
            id="edit-city"
            onChange={(e) => setCityOrProvince(e.target.value)}
            value={cityOrProvince}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-avatar">Avatar URL</Label>
          <Input
            id="edit-avatar"
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            value={avatarUrl}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-cover">Cover image URL</Label>
          <Input
            id="edit-cover"
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://..."
            value={coverImageUrl}
          />
        </div>

        <Button disabled={updateMutation.isPending} type="submit">
          {updateMutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
