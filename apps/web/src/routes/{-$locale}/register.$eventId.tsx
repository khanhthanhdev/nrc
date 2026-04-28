import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
  useParams,
  useRouterState,
} from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { stripLocaleFromPathname } from "@/lib/locale-routing";
import { useCurrentTeamSummary } from "@/lib/team-access";
import { canWriteRegistration, getSystemRole, isValidEventId } from "@/lib/route-policy";
import { useRequireAuth } from "@/lib/route-guards";

const RegisterEventPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();
  const teamQuery = useCurrentTeamSummary();
  const { eventId } = useParams({ from: "/{-$locale}/register/$eventId" });

  useRequireAuth(session);

  if (!isValidEventId(eventId)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Invalid event id</h1>
      </div>
    );
  }

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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Register event</h1>
        <p className="text-muted-foreground text-sm">Event: {eventId}</p>
      </div>

      <div className="rounded-2xl border p-4">
        <p className="text-sm font-medium">{writable ? "Editable" : "Read-only"}</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Team mentors can edit. Non-owner team members can only view.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link
            params={{ eventId, registrationId: "demo-registration" }}
            to="/{-$locale}/register/$eventId/$registrationId"
          >
            Open detail example
          </Link>
        </Button>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/{-$locale}/register/$eventId")({
  component: RegisterEventPage,
});
