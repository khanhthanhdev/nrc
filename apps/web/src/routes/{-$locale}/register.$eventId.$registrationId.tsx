import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

import { RegistrationDetailPage } from "@/features/registration/registration-detail-page";
import { canWriteRegistration, getSystemRole } from "@/lib/route-policy";
import { useRequireAuth } from "@/lib/route-guards";
import { useCurrentTeamSummary } from "@/lib/team-access";
import { authClient } from "@/utils/auth-client";

const RegistrationDetailRoute = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const teamQuery = useCurrentTeamSummary();
  const { eventId, registrationId } = useParams({
    from: "/{-$locale}/register/$eventId/$registrationId",
  });

  useRequireAuth(session);

  if (session.isPending || teamQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading registration detail...</p>
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
    <RegistrationDetailPage
      canEdit={writable}
      eventId={eventId}
      registrationId={registrationId}
    />
  );
};

export const Route = createFileRoute("/{-$locale}/register/$eventId/$registrationId")({
  component: RegistrationDetailRoute,
});
