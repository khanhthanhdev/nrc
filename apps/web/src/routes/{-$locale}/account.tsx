import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { hasCredentialProvider } from "@/lib/account-security";
import { authClient } from "@/utils/auth-client";
import { orpc } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MIN_PASSWORD_LENGTH = 8;

interface ReadOnlyFieldProps {
  id: string;
  label: string;
  value: string;
}

const ReadOnlyField = ({ id, label, value }: ReadOnlyFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} readOnly value={value} />
  </div>
);

const AccountPage = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();

  const profileQuery = useQuery({
    ...orpc.auth.getOnboardingProfile.queryOptions(),
    enabled: Boolean(session.data),
    retry: false,
  });

  const accountsQuery = useQuery({
    enabled: Boolean(session.data),
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts();

      if (error) {
        throw new Error(error.message);
      }

      return data ?? [];
    },
    queryKey: ["auth", "list-user-accounts"],
    retry: false,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canChangePassword = hasCredentialProvider(accountsQuery.data);

  useEffect(() => {
    if (session.isPending) {
      return;
    }

    if (!session.data) {
      void navigate({ to: "/{-$locale}/auth" });
    }
  }, [navigate, session.data, session.isPending]);

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    if (!profileQuery.data.onboardingCompleted) {
      void navigate({ to: "/{-$locale}/onboarding" });
    }
  }, [navigate, profileQuery.data]);

  const onChangePassword = async () => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated successfully.");
  };

  if (session.isPending || profileQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading account...</p>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  if (profileQuery.error) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-destructive text-sm">{profileQuery.error.message}</p>
      </div>
    );
  }

  if (!profileQuery.data) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Profile not found.</p>
      </div>
    );
  }

  if (!profileQuery.data.onboardingCompleted) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Redirecting to onboarding...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8">
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Account settings</h1>
          <p className="text-muted-foreground text-sm">
            View account information and update security.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField id="account-name" label="Full name" value={session.data.user.name} />
          <ReadOnlyField id="account-email" label="Email" value={session.data.user.email} />
          <ReadOnlyField
            id="account-email-verified"
            label="Email verification"
            value={session.data.user.emailVerified ? "Verified" : "Not verified"}
          />
          <ReadOnlyField id="account-user-id" label="User ID" value={session.data.user.id} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Profile information</h2>
          <p className="text-muted-foreground text-sm">
            Read-only information captured during onboarding.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField id="account-phone" label="Phone number" value={profileQuery.data.phone} />
          <ReadOnlyField id="account-city" label="City" value={profileQuery.data.city} />
          <ReadOnlyField
            id="account-organization"
            label="Organization / School"
            value={profileQuery.data.organizationOrSchool}
          />
          <ReadOnlyField
            id="account-date-of-birth"
            label="Date of birth"
            value={profileQuery.data.dateOfBirth}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-address">Address</Label>
          <Textarea id="account-address" readOnly value={profileQuery.data.address} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Security</h2>
          <p className="text-muted-foreground text-sm">Change your current password.</p>
        </div>

        {accountsQuery.isLoading && (
          <p className="text-muted-foreground text-sm">Loading security settings...</p>
        )}

        {accountsQuery.error && (
          <p className="text-destructive text-sm">Unable to load linked account providers.</p>
        )}

        {!accountsQuery.isLoading && !accountsQuery.error && !canChangePassword && (
          <p className="text-muted-foreground text-sm">
            Password change is unavailable for this account because it does not use email/password
            sign-in.
          </p>
        )}

        {!accountsQuery.isLoading && !accountsQuery.error && canChangePassword && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void onChangePassword();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                minLength={MIN_PASSWORD_LENGTH}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                type="password"
                value={currentPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                type="password"
                value={newPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                minLength={MIN_PASSWORD_LENGTH}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </div>

            <Button disabled={isSubmitting} type="submit">
              Update password
            </Button>
          </form>
        )}
      </section>
    </div>
  );
};

export const Route = createFileRoute("/{-$locale}/account")({
  component: AccountPage,
});
