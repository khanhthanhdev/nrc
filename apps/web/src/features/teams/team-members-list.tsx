import { useMutation } from "@tanstack/react-query";
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

const roleLabel = (role: string) => {
  switch (role) {
    case "TEAM_MENTOR": {
      return "Mentor";
    }
    case "TEAM_LEADER": {
      return "Leader";
    }
    case "TEAM_MEMBER": {
      return "Member";
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
  const removeMutation = useMutation({
    mutationFn: (membershipId: string) => client.team.removeTeamMember({ membershipId }),
    onSuccess: async () => {
      toast.success("Member removed.");
      await queryClient.invalidateQueries();
    },
  });

  const canRemove = showActions && canRemoveMember(membershipRole);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Members</h2>
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members found.</p>
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
                    Joined {new Date(m.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={roleBadgeVariant(m.role)}>{roleLabel(m.role)}</Badge>
                {canRemove && m.userId !== currentUserId && (
                  <Button
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(m.id)}
                    size="sm"
                    variant="ghost"
                  >
                    Remove
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
