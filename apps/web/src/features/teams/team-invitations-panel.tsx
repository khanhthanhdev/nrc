import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
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
    case "PENDING": return "secondary" as const;
    case "ACCEPTED": return "default" as const;
    case "EXPIRED": return "outline" as const;
    case "REVOKED": return "destructive" as const;
    default: return "outline" as const;
  }
};

export function TeamInvitationsPanel({ canInvite, teamId }: TeamInvitationsPanelProps) {
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
      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      await queryClient.invalidateQueries();
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => client.team.revokeTeamInvitation({ invitationId }),
    onSuccess: async () => {
      toast.success("Invitation revoked.");
      await queryClient.invalidateQueries();
    },
  });

  const onInvite = async (): Promise<void> => {
    try {
      await inviteMutation.mutateAsync();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invitation.");
    }
  };

  return (
    <div className="space-y-6">
      {canInvite && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Invite member</h2>

          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void onInvite();
            }}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                id="invite-role"
                onChange={(e) => setRole(e.target.value as "TEAM_LEADER" | "TEAM_MEMBER")}
                value={role}
              >
                <option value="TEAM_MEMBER">Member</option>
                <option value="TEAM_LEADER">Leader</option>
              </select>
            </div>

            <Button disabled={inviteMutation.isPending} type="submit">
              {inviteMutation.isPending ? "Sending..." : "Send invite"}
            </Button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Invitations</h2>

        {invitationsQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading invitations...</p>
        )}

        {invitationsQuery.data && invitationsQuery.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No invitations yet.</p>
        )}

        {invitationsQuery.data && invitationsQuery.data.length > 0 && (
          <div className="divide-y rounded-lg border">
            {invitationsQuery.data.map((inv) => (
              <div className="flex items-center justify-between px-4 py-3" key={inv.id}>
                <div>
                  <p className="text-sm font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.role === "TEAM_LEADER" ? "Leader" : "Member"} · Expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeVariant(inv.status)}>{inv.status}</Badge>
                  {inv.status === "PENDING" && canInvite && (
                    <Button
                      disabled={revokeMutation.isPending}
                      onClick={() => revokeMutation.mutate(inv.id)}
                      size="sm"
                      variant="ghost"
                    >
                      Revoke
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
