import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canRemoveMember } from "@/lib/route-policy";
import { client, queryClient } from "@/utils/orpc";

import type { PublicTeamMember } from "./types";

interface TeamMembersListProps {
  currentUserId?: string;
  members: PublicTeamMember[];
  membershipRole?: string | null;
  showActions: boolean;
}

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case "TEAM_MENTOR": {
      return "default" as const;
    }
    case "TEAM_LEADER": {
      return "secondary" as const;
    }
    default: {
      return "outline" as const;
    }
  }
};

const roleLabel = (role: string, t: (key: string) => string) => {
  switch (role) {
    case "TEAM_MENTOR": {
      return t("routes.team.roles.mentor");
    }
    case "TEAM_LEADER": {
      return t("routes.team.roles.leader");
    }
    case "TEAM_MEMBER": {
      return t("routes.team.roles.member");
    }
    default: {
      return role;
    }
  }
};

export function TeamMembersList({
  currentUserId,
  members,
  membershipRole,
  showActions,
}: TeamMembersListProps) {
  const { t } = useTranslation();
  const removeMutation = useMutation({
    mutationFn: (membershipId: string) => client.team.removeTeamMember({ membershipId }),
    onSuccess: async () => {
      toast.success(t("routes.team.members.feedback.removed"));
      await queryClient.invalidateQueries();
    },
  });

  const canRemove = showActions && canRemoveMember(membershipRole);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t("routes.team.members.title")}</h2>
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("routes.team.members.empty")}</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {members.map((m) => (
            <div className="flex items-center justify-between px-4 py-3" key={m.id}>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("routes.team.members.joined")} {new Date(m.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={roleBadgeVariant(m.role)}>{roleLabel(m.role, t)}</Badge>
                {canRemove && m.userId !== currentUserId && (
                  <Button
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(m.id)}
                    size="sm"
                    variant="ghost"
                  >
                    {t("routes.team.members.remove")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
