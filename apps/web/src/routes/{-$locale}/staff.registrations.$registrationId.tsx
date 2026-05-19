import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

import { StaffRegistrationDetailPage } from "@/features/registration/staff-registrations-page";
import { useRequireStaff } from "@/lib/route-guards";
import { useAuthSession } from "@/utils/auth-session-context";
const StaffRegistrationDetailRoute = () => {
  const navigate = useNavigate();
  const session = useAuthSession();
  const { registrationId } = useParams({
    from: "/{-$locale}/staff/registrations/$registrationId",
  });

  useRequireStaff(session);

  if (session.isPending) {
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

  return <StaffRegistrationDetailPage registrationId={registrationId} />;
};

export const Route = createFileRoute("/{-$locale}/staff/registrations/$registrationId")({
  component: StaffRegistrationDetailRoute,
});
