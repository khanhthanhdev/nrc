import { useEffect, useState } from "react";

import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";

import { resolvePostAuthRoute } from "@/lib/auth-routing";
import { authClient } from "@/utils/auth-client";

interface AcceptInvitationSearch {
  invitationId?: string;
}

const AcceptInvitationPage = () => {
  const navigate = useNavigate();
  const { invitationId } = useSearch({ from: "/auth/accept-invitation" });
  const session = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasHandled, setHasHandled] = useState(false);

  useEffect(() => {
    if (hasHandled || session.isPending || session.isRefetching) {
      return;
    }

    void (async () => {
      if (!invitationId) {
        toast.error("Invitation ID is missing.");
        setHasHandled(true);
        await navigate({ to: "/auth" });
        return;
      }

      if (!session.data) {
        setHasHandled(true);
        await navigate({
          search: { invitationId },
          to: "/auth",
        });
        return;
      }

      setIsSubmitting(true);
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      });
      setIsSubmitting(false);
      setHasHandled(true);

      if (error) {
        toast.error(error.message);
        const to = await resolvePostAuthRoute();
        await navigate({ to });
        return;
      }

      toast.success("Invitation accepted successfully.");
      const to = await resolvePostAuthRoute();
      await navigate({ to });
    })();
  }, [hasHandled, invitationId, navigate, session.data, session.isPending, session.isRefetching]);

  return (
    <div className="container mx-auto max-w-xl px-4 py-8">
      <p className="text-muted-foreground text-sm">
        {isSubmitting ? "Accepting invitation..." : "Resolving invitation..."}
      </p>
    </div>
  );
};

export const Route = createFileRoute("/auth/accept-invitation")({
  component: AcceptInvitationPage,
  validateSearch: (search): AcceptInvitationSearch => ({
    invitationId: typeof search.invitationId === "string" ? search.invitationId : undefined,
  }),
});
