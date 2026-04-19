import { useEffect } from "react";

import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";

import { resolvePostAuthRoute } from "@/lib/auth-routing";
import { authClient } from "@/utils/auth-client";

interface PostVerifySearch {
  invitationId?: string;
}

const PostVerifyPage = () => {
  const navigate = useNavigate();
  const { invitationId } = useSearch({ from: "/auth/post-verify" });
  const session = authClient.useSession();

  useEffect(() => {
    if (session.isPending || session.isRefetching) {
      return;
    }

    void (async () => {
      if (!session.data) {
        await navigate({
          search: invitationId ? { invitationId } : undefined,
          to: "/auth",
        });
        return;
      }

      if (invitationId) {
        await navigate({
          search: { invitationId },
          to: "/auth/accept-invitation",
        });
        return;
      }

      const to = await resolvePostAuthRoute();
      await navigate({ to });
    })();
  }, [invitationId, navigate, session.data, session.isPending, session.isRefetching]);

  return (
    <div className="container mx-auto max-w-xl px-4 py-8">
      <p className="text-muted-foreground text-sm">Completing authentication...</p>
    </div>
  );
};

export const Route = createFileRoute("/auth/post-verify")({
  component: PostVerifyPage,
  validateSearch: (search): PostVerifySearch => ({
    invitationId: typeof search.invitationId === "string" ? search.invitationId : undefined,
  }),
});
