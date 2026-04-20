import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { useCurrentTeamSummary } from "@/lib/team-access";
import {
  canReadRegistration,
  canWriteRegistration,
  getSystemRole,
  isValidEventId,
  isValidRegistrationId,
} from "@/lib/route-policy";
import { useRequireAuth } from "@/lib/route-guards";

const RegistrationDetailPage = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const teamQuery = useCurrentTeamSummary();
  const { eventId, registrationId } = useParams({ from: "/register/$eventId/$registrationId" });

  useRequireAuth(session);

  if (!isValidEventId(eventId) || !isValidRegistrationId(registrationId)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Invalid registration route</h1>
      </div>
    );
  }

  if (session.isPending || teamQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading registration detail...</p>
      </div>
    );
  }

  if (!session.data) {
    void navigate({ to: "/auth" });

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  const canEdit = canWriteRegistration({
    membershipRole: teamQuery.data?.membershipRole,
    systemRole: getSystemRole(session.data),
  });
  const canRead = canReadRegistration({
    membershipRole: teamQuery.data?.membershipRole,
    systemRole: getSystemRole(session.data),
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Registration detail</h1>
        <p className="text-muted-foreground text-sm">
          Event: {eventId} / Registration: {registrationId}
        </p>
      </div>

      <div className="rounded-2xl border p-4">
        <p className="text-sm font-medium">{canEdit ? "Editable" : canRead ? "Read-only" : "Denied"}</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Non-owner team members are read-only. Staff can edit. Placeholder until registration API lands.
        </p>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/register/$eventId/$registrationId")({
  component: RegistrationDetailPage,
});
