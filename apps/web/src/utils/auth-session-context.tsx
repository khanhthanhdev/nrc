import type { ReactNode } from "react";

import { createContext, useContext } from "react";

import type { AuthSession } from "./auth-client";

import { authClient } from "./auth-client";

type SsrSession = AuthSession | null;

const SsrAuthSessionContext = createContext<SsrSession>(null);

interface SessionAtomValue {
  data: AuthSession | null;
  error: unknown;
  isPending: boolean;
  isRefetching: boolean;
  refetch?: (...args: unknown[]) => Promise<void>;
}

// Better Auth exposes the session atom via the public `$store.atoms.session`
// path but does not include it in the published types. Cast through a
// minimal interface to keep usage type-safe at the boundary.
const getSessionAtom = ():
  | {
      get: () => SessionAtomValue;
      set: (value: SessionAtomValue) => void;
    }
  | undefined => {
  const store = (
    authClient as unknown as {
      $store?: { atoms?: { session?: { get(): SessionAtomValue; set(v: SessionAtomValue): void } } };
    }
  ).$store;
  return store?.atoms?.session;
};

const seedAuthSessionAtom = (ssrSession: SsrSession): void => {
  if (typeof window === "undefined" || !ssrSession) {
    return;
  }

  const atom = getSessionAtom();
  if (!atom) {
    return;
  }

  const current = atom.get();
  // Only seed if the atom hasn't been hydrated yet. After Better Auth's
  // first fetch completes (or the user signs in/out) we leave it alone.
  if (current.data || !current.isPending) {
    return;
  }

  atom.set({
    data: ssrSession,
    error: null,
    isPending: false,
    isRefetching: false,
    refetch: current.refetch,
  });
};

interface AuthSessionProviderProps {
  children: ReactNode;
  ssrSession: SsrSession;
}

/**
 * Provides the SSR-fetched session to descendants via React context AND
 * seeds Better Auth's nanostore on the client so that
 * `authClient.useSession()` returns the correct value on the very first
 * render. The seeding runs inline during render (not in an effect) so
 * children's `useSession()` calls observe the seeded snapshot.
 */
export const AuthSessionProvider = ({ children, ssrSession }: AuthSessionProviderProps) => {
  seedAuthSessionAtom(ssrSession);

  return (
    <SsrAuthSessionContext.Provider value={ssrSession}>{children}</SsrAuthSessionContext.Provider>
  );
};

interface UseAuthSessionResult {
  data: AuthSession | null;
  error: ReturnType<typeof authClient.useSession>["error"];
  isPending: ReturnType<typeof authClient.useSession>["isPending"];
  isRefetching: ReturnType<typeof authClient.useSession>["isRefetching"];
  refetch: ReturnType<typeof authClient.useSession>["refetch"];
}

/**
 * Drop-in replacement for `authClient.useSession()` that hides the
 * "flash of unauthenticated UI". Returns the SSR session while the
 * client-side fetch is still pending so both the SSR markup and the
 * first client render agree.
 */
export const useAuthSession = (): UseAuthSessionResult => {
  const ssr = useContext(SsrAuthSessionContext);
  const live = authClient.useSession();

  if (live.isPending && ssr) {
    return {
      data: ssr,
      error: live.error,
      isPending: false,
      isRefetching: live.isRefetching,
      refetch: live.refetch,
    };
  }

  return {
    data: (live.data as AuthSession | null) ?? null,
    error: live.error,
    isPending: live.isPending,
    isRefetching: live.isRefetching,
    refetch: live.refetch,
  };
};
