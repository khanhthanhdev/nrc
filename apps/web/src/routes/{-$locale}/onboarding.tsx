import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import { VIETNAM_34_CITIES } from "@nrc-full/api/features/auth/contracts/vietnam-cities";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { authClient } from "@/utils/auth-client";
import { client, orpc, queryClient } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/{-$locale}/onboarding")({
  component: OnboardingPage,
});

interface OnboardingFormState {
  address: string;
  city: (typeof VIETNAM_34_CITIES)[number];
  dateOfBirth: string;
  organizationOrSchool: string;
  phone: string;
}

function OnboardingPage() {
  const navigate = useNavigate();
  const session = authClient.useSession();

  const profileQuery = useQuery({
    ...orpc.auth.getOnboardingProfile.queryOptions(),
    enabled: Boolean(session.data),
    retry: false,
  });

  const defaultForm = useMemo<OnboardingFormState>(
    () => ({
      address: "",
      city: VIETNAM_34_CITIES[0],
      dateOfBirth: "1970-01-01",
      organizationOrSchool: "",
      phone: "",
    }),
    [],
  );

  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!session.isPending && !session.data) {
      void navigate({ to: "/{-$locale}/auth" });
    }
  }, [navigate, session.data, session.isPending]);

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setForm({
      address: profileQuery.data.address,
      city:
        VIETNAM_34_CITIES.find((city) => city === profileQuery.data.city) ?? VIETNAM_34_CITIES[0],
      dateOfBirth: profileQuery.data.dateOfBirth,
      organizationOrSchool: profileQuery.data.organizationOrSchool,
      phone: profileQuery.data.phone,
    });

    if (profileQuery.data.onboardingCompleted) {
      void navigate({ to: "/{-$locale}" });
    }
  }, [navigate, profileQuery.data]);

  const onSubmit = async () => {
    setIsSubmitting(true);

    try {
      await client.auth.completeOnboarding(form);
      await queryClient.invalidateQueries(orpc.auth.getOnboardingProfile.queryOptions());
      toast.success("Onboarding completed.");
      await navigate({ to: "/{-$locale}" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete onboarding.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (session.isPending || profileQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading onboarding...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Complete onboarding</h1>
        <p className="text-muted-foreground text-sm">
          Fill all required profile fields to continue.
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
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            required
            value={form.phone}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
            required
            value={form.address}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            id="city"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                city: event.target.value as (typeof VIETNAM_34_CITIES)[number],
              }))
            }
            required
            value={form.city}
          >
            {VIETNAM_34_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationOrSchool">Organization / School</Label>
          <Input
            id="organizationOrSchool"
            onChange={(event) =>
              setForm((current) => ({ ...current, organizationOrSchool: event.target.value }))
            }
            required
            value={form.organizationOrSchool}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            onChange={(event) =>
              setForm((current) => ({ ...current, dateOfBirth: event.target.value }))
            }
            required
            type="date"
            value={form.dateOfBirth}
          />
        </div>

        <Button className="w-full" disabled={isSubmitting} type="submit">
          Save and continue
        </Button>
      </form>
    </div>
  );
}
