import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";

import { RegisterLandingPage } from "@/features/registration/register-landing-page";
import { stripLocaleFromPathname } from "@/lib/locale-routing";
import { useRequireAuth } from "@/lib/route-guards";
import { useCurrentTeamSummary } from "@/lib/team-access";
import { authClient } from "@/utils/auth-client";

const RegisterPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();
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
    void navigate({ to: "/{-$locale}/auth" });

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <RegisterLandingPage
      teamId={teamQuery.data?.organizationId ?? null}
      teamName={teamQuery.data?.teamName ?? null}
    />
  );
};

export const Route = createFileRoute("/{-$locale}/register")({
  component: RegisterPage,
});
