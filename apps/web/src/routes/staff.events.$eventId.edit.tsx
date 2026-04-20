import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";

import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidEventId } from "@/lib/route-policy";
import { useRequireStaff } from "@/lib/route-guards";

const StaffEventEditPage = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const { eventId } = useParams({ from: "/staff/events/$eventId/edit" });

  useRequireStaff(session);

  if (!isValidEventId(eventId)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Invalid event id</h1>
      </div>
    );
  }

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading event editor...</p>
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
        <h1 className="text-2xl font-semibold">Edit event {eventId}</h1>
        <p className="text-muted-foreground text-sm">CRUD scaffold only. Hook backend later.</p>
      </div>

      <div className="space-y-4 rounded-2xl border p-4">
        <div className="space-y-2">
          <Label htmlFor="event-name">Event name</Label>
          <Input disabled id="event-name" placeholder="Vietnam Championship" />
        </div>
        <Button disabled type="button">
          Save changes
        </Button>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/staff/events/$eventId/edit")({
  component: StaffEventEditPage,
});
