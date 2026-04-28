import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { client, orpc, queryClient } from "@/utils/orpc";

interface TeamInvitationsPanelProps {
  canInvite: boolean;
  teamId: string;
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "PENDING": {
      return "secondary" as const;
    }
    case "ACCEPTED": {
      return "default" as const;
    }
    case "EXPIRED": {
      return "outline" as const;
    }
    case "REVOKED": {
      return "destructive" as const;
    }
    default: {
      return "outline" as const;
    }
  }
};

const invitationStatusLabel = (status: string, t: (key: string) => string) => {
  switch (status) {
    case "PENDING": {
      return t("routes.team.invitations.status.pending");
    }
    case "ACCEPTED": {
      return t("routes.team.invitations.status.accepted");
    }
    case "EXPIRED": {
      return t("routes.team.invitations.status.expired");
    }
    case "REVOKED": {
      return t("routes.team.invitations.status.revoked");
    }
    default: {
      return status;
    }
  }
};

export function TeamInvitationsPanel({ canInvite, teamId }: TeamInvitationsPanelProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"TEAM_LEADER" | "TEAM_MEMBER">("TEAM_MEMBER");

  const invitationsQuery = useQuery({
    ...orpc.team.listTeamInvitations.queryOptions({
      input: { teamId },
    }),
    retry: false,
  });

  const inviteMutation = useMutation({
    mutationFn: () => client.team.inviteTeamMember({ email, role, teamId }),
    onSuccess: async () => {
      toast.success(t("routes.team.invitations.feedback.sent", { email }));
      setEmail("");
      await queryClient.invalidateQueries();
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => client.team.revokeTeamInvitation({ invitationId }),
    onSuccess: async () => {
      toast.success(t("routes.team.invitations.feedback.revoked"));
      await queryClient.invalidateQueries();
    },
  });

  const onInvite = async (): Promise<void> => {
    try {
      await inviteMutation.mutateAsync();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("routes.team.invitations.feedback.sendFailed"),
      );
    }
  };

  return (
    <div className="space-y-6">
      {canInvite && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t("routes.team.invitations.inviteMember")}</h2>

          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void onInvite();
            }}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">{t("routes.team.invitations.email")}</Label>
              <Input
                id="invite-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("routes.team.invitations.emailPlaceholder")}
                required
                type="email"
                value={email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">{t("routes.team.invitations.role")}</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                id="invite-role"
                onChange={(e) => setRole(e.target.value as "TEAM_LEADER" | "TEAM_MEMBER")}
                value={role}
              >
                <option value="TEAM_MEMBER">{t("routes.team.roles.member")}</option>
                <option value="TEAM_LEADER">{t("routes.team.roles.leader")}</option>
              </select>
            </div>

            <Button disabled={inviteMutation.isPending} type="submit">
              {inviteMutation.isPending
                ? t("routes.team.invitations.sending")
                : t("routes.team.invitations.sendInvite")}
            </Button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("routes.team.invitations.title")}</h2>

        {invitationsQuery.isLoading && (
          <p className="text-sm text-muted-foreground">{t("routes.team.invitations.loading")}</p>
        )}

        {invitationsQuery.data && invitationsQuery.data.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("routes.team.invitations.empty")}</p>
        )}

        {invitationsQuery.data && invitationsQuery.data.length > 0 && (
          <div className="divide-y rounded-lg border">
            {invitationsQuery.data.map((inv) => (
              <div className="flex items-center justify-between px-4 py-3" key={inv.id}>
                <div>
                  <p className="text-sm font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.role === "TEAM_LEADER"
                      ? t("routes.team.roles.leader")
                      : t("routes.team.roles.member")}{" "}
                    · {t("routes.team.invitations.expires")}{" "}
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeVariant(inv.status)}>
                    {invitationStatusLabel(inv.status, t)}
                  </Badge>
                  {inv.status === "PENDING" && canInvite && (
                    <Button
                      disabled={revokeMutation.isPending}
                      onClick={() => revokeMutation.mutate(inv.id)}
                      size="sm"
                      variant="ghost"
                    >
                      {t("routes.team.invitations.revoke")}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
