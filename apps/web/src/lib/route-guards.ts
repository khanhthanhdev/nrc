import { useEffect } from "react";

import { useNavigate, useRouterState } from "@tanstack/react-router";

import i18n from "@/i18n/config";
import type { authClient } from "@/utils/auth-client";

import { getLocaleFromPathname, getSupportedLocale, localizePathname } from "./locale-routing";
import { getSystemRole, isAdminSystemRole, isStaffSystemRole } from "./route-policy";

type SessionState = ReturnType<typeof authClient.useSession>;

const getActiveLocale = () => getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

export const useRequireAuth = (session: SessionState, redirectTo = "/auth"): void => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const currentLocale = getLocaleFromPathname(pathname) ?? getActiveLocale();

  useEffect(() => {
    if (session.isPending) {
      return;
    }

    if (!session.data) {
      void navigate({ to: localizePathname(redirectTo, currentLocale) });
    }
  }, [currentLocale, navigate, redirectTo, session.data, session.isPending]);
};

export const useRequireStaff = (session: SessionState, redirectTo = "/teams"): void => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const currentLocale = getLocaleFromPathname(pathname) ?? getActiveLocale();

  useEffect(() => {
    if (session.isPending) {
      return;
    }

    if (!session.data) {
      void navigate({ to: localizePathname("/auth", currentLocale) });
      return;
    }

    if (!isStaffSystemRole(getSystemRole(session.data))) {
      void navigate({ to: localizePathname(redirectTo, currentLocale) });
    }
  }, [currentLocale, navigate, redirectTo, session.data, session.isPending]);
};

export const useRequireAdmin = (session: SessionState, redirectTo = "/teams"): void => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const currentLocale = getLocaleFromPathname(pathname) ?? getActiveLocale();

  useEffect(() => {
    if (session.isPending) {
      return;
    }

    if (!session.data) {
      void navigate({ to: localizePathname("/auth", currentLocale) });
      return;
    }

    if (!isAdminSystemRole(getSystemRole(session.data))) {
      void navigate({ to: localizePathname(redirectTo, currentLocale) });
    }
  }, [currentLocale, navigate, redirectTo, session.data, session.isPending]);
};
