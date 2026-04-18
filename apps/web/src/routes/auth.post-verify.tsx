import { useEffect } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { resolvePostAuthRoute } from "@/lib/auth-routing";
import { authClient } from "@/utils/auth-client";

export const Route = createFileRoute("/auth/post-verify")({
  component: PostVerifyPage,
});

function PostVerifyPage() {
  const navigate = useNavigate();
  const session = authClient.useSession();

  useEffect(() => {
    if (session.isPending || session.isRefetching) {
      return;
    }

    void (async () => {
      if (!session.data) {
        await navigate({ to: "/auth" });
        return;
      }

      const to = await resolvePostAuthRoute();
      await navigate({ to });
    })();
  }, [navigate, session.data, session.isPending, session.isRefetching]);

  return (
    <div className="container mx-auto max-w-xl px-4 py-8">
      <p className="text-muted-foreground text-sm">Completing authentication...</p>
    </div>
  );
}
