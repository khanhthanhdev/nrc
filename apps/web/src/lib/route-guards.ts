import { useEffect } from "react";

import { useNavigate } from "@tanstack/react-router";

import type { authClient } from "@/utils/auth-client";

import { getSystemRole, isAdminSystemRole, isStaffSystemRole } from "./route-policy";

type SessionState = ReturnType<typeof authClient.useSession>;

export const useRequireAuth = (session: SessionState, redirectTo = "/auth"): void => {
  const navigate = useNavigate();

  useEffect(() => {
    if (session.isPending) {
      return;
    }

    if (!session.data) {
      void navigate({ to: redirectTo });
    }
  }, [navigate, redirectTo, session.data, session.isPending]);
};

export const useRequireStaff = (session: SessionState, redirectTo = "/teams"): void => {
  const navigate = useNavigate();

  useEffect(() => {
    if (session.isPending) {
      return;
    }

    if (!session.data) {
      void navigate({ to: "/auth" });
      return;
    }

    if (!isStaffSystemRole(getSystemRole(session.data))) {
      void navigate({ to: redirectTo });
    }
  }, [navigate, redirectTo, session.data, session.isPending]);
};

export const useRequireAdmin = (session: SessionState, redirectTo = "/teams"): void => {
  const navigate = useNavigate();

  useEffect(() => {
    if (session.isPending) {
      return;
    }

    if (!session.data) {
      void navigate({ to: "/auth" });
      return;
    }

    if (!isAdminSystemRole(getSystemRole(session.data))) {
      void navigate({ to: redirectTo });
    }
  }, [navigate, redirectTo, session.data, session.isPending]);
};
