import { useEffect, useState } from "react";

import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { toBrowserCallbackURL } from "@/lib/auth-callback-url";
import { resolvePostAuthRoute } from "@/lib/auth-routing";
import { getSupportedLocale, localizePathname } from "@/lib/locale-routing";
import { stripLocaleFromPathname } from "@/lib/locale-routing";
import { authClient } from "@/utils/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "sign-in" | "sign-up";
interface AuthSearch {
  invitationId?: string;
}

const AuthPage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { invitationId } = useSearch({ from: "/{-$locale}/auth" });
  const session = authClient.useSession();
  const { i18n } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const callbackPath = invitationId
    ? `/auth/post-verify?invitationId=${encodeURIComponent(invitationId)}`
    : "/auth/post-verify";

  useEffect(() => {
    if (!session.data) {
      return;
    }

    void (async () => {
      if (invitationId) {
        await navigate({
          search: { invitationId },
          to: "/{-$locale}/auth/accept-invitation",
        });
        return;
      }

      const to = await resolvePostAuthRoute();
      await navigate({ to: localizePathname(to, activeLanguage) });
    })();
  }, [activeLanguage, invitationId, navigate, session.data]);

  const onSignIn = async () => {
    const callbackURL = toBrowserCallbackURL(callbackPath);
    setIsSubmitting(true);

    const { error } = await authClient.signIn.email({
      callbackURL,
      email,
      password,
      rememberMe: true,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (invitationId) {
      await navigate({
        search: { invitationId },
        to: "/{-$locale}/auth/accept-invitation",
      });
      return;
    }

    const to = await resolvePostAuthRoute();
    await navigate({ to: localizePathname(to, activeLanguage) });
  };

  const onSignUp = async () => {
    const callbackURL = toBrowserCallbackURL(callbackPath);
    setIsSubmitting(true);

    const { data, error } = await authClient.signUp.email({
      callbackURL,
      email,
      name,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data?.token) {
      if (invitationId) {
        await navigate({
          search: { invitationId },
          to: "/{-$locale}/auth/accept-invitation",
        });
        return;
      }

      const to = await resolvePostAuthRoute();
      await navigate({ to: localizePathname(to, activeLanguage) });
      return;
    }

    toast.success("Account created. Verify your email to continue.");
  };

  const onGoogleSignIn = async () => {
    const callbackURL = toBrowserCallbackURL(callbackPath);
    setIsSubmitting(true);

    const { error } = await authClient.signIn.social({
      callbackURL,
      provider: "google",
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    }
  };

  if (stripLocaleFromPathname(pathname) !== "/auth") {
    return <Outlet />;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Authentication</h1>
        <p className="text-muted-foreground text-sm">
          Sign in or create an account with email/password or Google.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => setMode("sign-in")}
          type="button"
          variant={mode === "sign-in" ? "default" : "outline"}
        >
          Sign in
        </Button>
        <Button
          onClick={() => setMode("sign-up")}
          type="button"
          variant={mode === "sign-up" ? "default" : "outline"}
        >
          Sign up
        </Button>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void (mode === "sign-in" ? onSignIn() : onSignUp());
        }}
      >
        {mode === "sign-up" && (
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </div>
        )}

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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <Button
        disabled={isSubmitting}
        onClick={() => void onGoogleSignIn()}
        type="button"
        variant="outline"
      >
        Continue with Google
      </Button>

      <div className="text-muted-foreground text-sm">
        <Link to="/{-$locale}/auth/forgot-password">Forgot password?</Link>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/{-$locale}/auth")({
  component: AuthPage,
  validateSearch: (search): AuthSearch => ({
    invitationId: typeof search.invitationId === "string" ? search.invitationId : undefined,
  }),
});
