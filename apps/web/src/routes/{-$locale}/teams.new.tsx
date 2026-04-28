import { useState } from "react";

import { VIETNAM_34_CITIES } from "@nrc-full/api/features/auth/contracts/vietnam-cities";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { authClient } from "@/utils/auth-client";
import { client, queryClient } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRequireAuth } from "@/lib/route-guards";

const NewTeamPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const session = authClient.useSession();
  const [name, setName] = useState("");
  const [schoolOrOrganization, setSchoolOrOrganization] = useState("");
  const [cityOrProvince, setCityOrProvince] = useState("");
  const [description, setDescription] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const createTeamMutation = useMutation({
    mutationFn: () =>
      client.team.createTeam({
        cityOrProvince: cityOrProvince || undefined,
        description: description || undefined,
        name,
        schoolOrOrganization: schoolOrOrganization || undefined,
        termsAccepted: true,
      }),
    onSuccess: async (data) => {
      toast.success(t("routes.team.create.success", { teamNumber: data.teamNumber }));
      await queryClient.invalidateQueries();
      await navigate({
        params: { teamNumber: data.teamNumber },
        search: { tab: undefined },
        to: "/{-$locale}/teams/$teamNumber",
      });
    },
  });

  useRequireAuth(session);

  const onSubmit = async (): Promise<void> => {
    if (!termsAccepted) {
      toast.error(t("routes.team.create.termsError"));
      return;
    }

    try {
      await createTeamMutation.mutateAsync();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("routes.team.create.unableToCreate"));
    }
  };

  if (session.isPending) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">{t("routes.team.create.loading")}</p>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">
          {t("routes.team.create.redirectingToSignIn")}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("routes.team.create.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("routes.team.create.description")}
          <code className="px-1">TEAM_MENTOR</code>.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="team-name">{t("routes.team.fields.name")}</Label>
          <Input
            id="team-name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-school">{t("routes.team.create.schoolOrOrganization")}</Label>
          <Input
            id="team-school"
            onChange={(event) => setSchoolOrOrganization(event.target.value)}
            value={schoolOrOrganization}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-city">{t("routes.team.create.cityOrProvince")}</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            id="team-city"
            onChange={(event) => setCityOrProvince(event.target.value)}
            value={cityOrProvince}
          >
            <option value="">{t("routes.team.create.selectCity")}</option>
            {VIETNAM_34_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-description">{t("routes.team.fields.description")}</Label>
          <Textarea
            id="team-description"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </div>

        <label className="flex items-center gap-2 text-sm" htmlFor="team-terms">
          <input
            checked={termsAccepted}
            id="team-terms"
            onChange={(event) => setTermsAccepted(event.target.checked)}
            required
            type="checkbox"
          />
          {t("routes.team.create.terms")}
        </label>

        <Button disabled={createTeamMutation.isPending} type="submit">
          {createTeamMutation.isPending
            ? t("routes.team.create.creating")
            : t("routes.team.create.submit")}
        </Button>
      </form>
    </div>
  );
};

export const Route = createFileRoute("/{-$locale}/teams/new")({
  component: NewTeamPage,
});
