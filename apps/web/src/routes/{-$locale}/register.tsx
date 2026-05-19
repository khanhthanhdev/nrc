import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

import { RegisterLandingPage } from "@/features/registration/register-landing-page";
import { stripLocaleFromPathname } from "@/lib/locale-routing";
import { useRequireAuth } from "@/lib/route-guards";
import { useCurrentTeamSummary } from "@/lib/team-access";
import { useAuthSession } from "@/utils/auth-session-context";
const RegisterPage = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = useAuthSession();
  const teamQuery = useCurrentTeamSummary();

  useRequireAuth(session);

  if (stripLocaleFromPathname(pathname) !== "/register") {
    return <Outlet />;
  }

  if (session.isPending || teamQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading registration...</p>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading registration...</p>
      </div>
    );
  }

  return (
    <RegisterLandingPage
      teamId={teamQuery.data?.id ?? null}
      teamName={teamQuery.data?.name ?? null}
    />
  );
};

export const Route = createFileRoute("/{-$locale}/register")({
  component: RegisterPage,
});
