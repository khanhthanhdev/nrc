import { useEffect } from "react";

import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { resolvePostAuthRoute } from "@/lib/auth-routing";
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";
import { authClient } from "@/utils/auth-client";

interface PostVerifySearch {
  invitationId?: string;
}

const PostVerifyPage = () => {
  const navigate = useNavigate();
  const { invitationId } = useSearch({ from: "/{-$locale}/auth/post-verify" });
  const session = authClient.useSession();
  const { i18n } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

  useEffect(() => {
    if (session.isPending || session.isRefetching) {
      return;
    }

    void (async () => {
      if (!session.data) {
        await navigate({
          search: invitationId ? { invitationId } : undefined,
          to: "/{-$locale}/auth",
        });
        return;
      }

      if (invitationId) {
        await navigate({
          search: { invitationId },
          to: "/{-$locale}/auth/accept-invitation",
        });
        return;
      }

      const to = await resolvePostAuthRoute();
      await navigate({ to: localizePathname(to, activeLanguage) });
    })();
  }, [
    activeLanguage,
    invitationId,
    navigate,
    session.data,
    session.isPending,
    session.isRefetching,
  ]);

  return (
    <div className="container mx-auto max-w-xl px-4 py-8">
      <p className="text-muted-foreground text-sm">Completing authentication...</p>
    </div>
  );
};

export const Route = createFileRoute("/{-$locale}/auth/post-verify")({
  component: PostVerifyPage,
  validateSearch: (search): PostVerifySearch => ({
    invitationId: typeof search.invitationId === "string" ? search.invitationId : undefined,
  }),
});
