import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { toBrowserCallbackURL } from "@/lib/auth-callback-url";
import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    const redirectTo = toBrowserCallbackURL("/auth/reset-password");
    setIsSubmitting(true);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("If the email exists, a reset link has been sent.");
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email to receive a password reset link.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>

        <Button className="w-full" disabled={isSubmitting} type="submit">
          Send reset email
        </Button>
      </form>
    </div>
  );
};

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});
