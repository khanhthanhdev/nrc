import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { toBrowserCallbackURL } from "@/lib/auth-callback-url";
import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetSuccessMessage = () => {
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  const onSubmit = async (emailAddress: string) => {
    const redirectTo = toBrowserCallbackURL("/auth/reset-password");
    setIsSubmitting(true);
    setSuccessMessage(null);

    const { error } = await authClient.requestPasswordReset({
      email: emailAddress,
      redirectTo,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const message = "If the email exists, a reset link has been sent.";
    setSuccessMessage(message);
    toast.success(message);
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
          const formData = new FormData(event.currentTarget);
          const emailAddress = formData.get("email");

          if (typeof emailAddress !== "string") {
            toast.error("Enter a valid email address.");
            return;
          }

          void onSubmit(emailAddress);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            onInput={() => {
              resetSuccessMessage();
            }}
            required
            type="email"
          />
        </div>

        {successMessage ? (
          <p
            aria-live="polite"
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}

        <Button className="w-full" disabled={isSubmitting} type="submit">
          Send reset email
        </Button>
      </form>
    </div>
  );
};

export const Route = createFileRoute("/{-$locale}/auth/forgot-password")({
  component: ForgotPasswordPage,
});
