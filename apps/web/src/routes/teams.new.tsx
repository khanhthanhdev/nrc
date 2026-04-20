import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/utils/auth-client";
import { client, queryClient } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRequireAuth } from "@/lib/route-guards";

const NewTeamPage = () => {
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
      toast.success(`Team created: ${data.teamNumber}`);
      await queryClient.invalidateQueries();
      await navigate({ to: "/teams" });
    },
  });

  useRequireAuth(session);

  const onSubmit = async (): Promise<void> => {
    if (!termsAccepted) {
      toast.error("You must accept the terms to create a team.");
      return;
    }

    try {
      await createTeamMutation.mutateAsync();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create team.");
    }
  };

  if (session.isPending) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Create team</h1>
        <p className="text-muted-foreground text-sm">
          Creating a team creates a linked Better Auth organization with role
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
          <Label htmlFor="team-name">Team name</Label>
          <Input
            id="team-name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-school">School / Organization</Label>
          <Input
            id="team-school"
            onChange={(event) => setSchoolOrOrganization(event.target.value)}
            value={schoolOrOrganization}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-city">City / Province</Label>
          <Input
            id="team-city"
            onChange={(event) => setCityOrProvince(event.target.value)}
            value={cityOrProvince}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-description">Description</Label>
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
          I confirm team creation terms.
        </label>

        <Button disabled={createTeamMutation.isPending} type="submit">
          {createTeamMutation.isPending ? "Creating..." : "Create team"}
        </Button>
      </form>
    </div>
  );
};

export const Route = createFileRoute("/teams/new")({
  component: NewTeamPage,
});
