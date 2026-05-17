import {
  Outlet,
  createFileRoute,
  useNavigate,
  useParams,
  useRouterState,
} from "@tanstack/react-router";

import { EventRegistrationFormPage } from "@/features/registration/event-registration-form";
import { stripLocaleFromPathname } from "@/lib/locale-routing";
import { canWriteRegistration, getSystemRole } from "@/lib/route-policy";
import { useRequireAuth } from "@/lib/route-guards";
import { useCurrentTeamSummary } from "@/lib/team-access";
import { authClient } from "@/utils/auth-client";

const RegisterEventPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();
  const teamQuery = useCurrentTeamSummary();
  const { eventId } = useParams({ from: "/{-$locale}/register/$eventId" });

  useRequireAuth(session);

  if (stripLocaleFromPathname(pathname) !== `/register/${eventId}`) {
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

  const writable = canWriteRegistration({
    membershipRole: teamQuery.data?.membershipRole,
    systemRole: getSystemRole(session.data),
  });

  return (
    <EventRegistrationFormPage
      eventId={eventId}
      teamId={teamQuery.data?.id ?? null}
      teamName={teamQuery.data?.name ?? null}
      writable={writable}
    />
  );
};

export const Route = createFileRoute("/{-$locale}/register/$eventId")({
  component: RegisterEventPage,
});
