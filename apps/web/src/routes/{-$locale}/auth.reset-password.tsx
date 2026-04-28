import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ResetPasswordSearch {
  token?: string;
}

export const Route = createFileRoute("/{-$locale}/auth/reset-password")({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!token) {
      toast.error("Missing reset token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await authClient.resetPassword({
      newPassword,
      token,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password reset successfully. You can sign in now.");
    await navigate({ to: "/{-$locale}/auth" });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="text-muted-foreground text-sm">Enter your new password to continue.</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            minLength={8}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            type="password"
            value={newPassword}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </div>

        <Button className="w-full" disabled={isSubmitting} type="submit">
          Reset password
        </Button>
      </form>
    </div>
  );
}
