import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequireStaff } from "@/lib/route-guards";

const StaffEventNewPage = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();

  useRequireStaff(session);

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading event form...</p>
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Create event</h1>
        <p className="text-muted-foreground text-sm">CRUD scaffold only. Hook backend later.</p>
      </div>

      <div className="space-y-4 rounded-2xl border p-4">
        <div className="space-y-2">
          <Label htmlFor="event-id">Event id</Label>
          <Input disabled id="event-id" placeholder="VNCMP" />
        </div>
        <Button disabled type="button">
          Save event
        </Button>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/staff/events/new")({
  component: StaffEventNewPage,
});
