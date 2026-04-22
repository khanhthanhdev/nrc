import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PlaceholderRoutePage } from "@/components/placeholder-route-page";
import { useRequireAdmin } from "@/lib/route-guards";
import { authClient } from "@/utils/auth-client";

const StaffSettingsPage = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();

  useRequireAdmin(session);

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading staff settings...</p>
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

  return (
    <PlaceholderRoutePage
      actions={[
        { label: "Return to staff overview", to: "/staff" },
        { label: "Open users", to: "/staff/users" },
      ]}
      description="This admin-only destination is ready for platform settings, environment controls, and other high-trust configuration work."
      eyebrow="Admin"
      title="Staff settings are reserved inside the sidebar shell."
    />
  );
};

export const Route = createFileRoute("/staff/settings")({
  component: StaffSettingsPage,
});
