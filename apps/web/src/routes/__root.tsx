import type { QueryClient } from "@tanstack/react-query";
import type { RequestLogger } from "evlog";
import { useEffect } from "react";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createMiddleware } from "@tanstack/react-start";
import { createError } from "evlog";
import { useTranslation } from "react-i18next";

import type { orpc } from "@/utils/orpc";

import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getLocaleFromPathname } from "@/lib/locale-routing";
import { isStaffPath } from "@/lib/navigation";

import Header from "../components/header";
import appCss from "../index.css?url";
export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

const RootDocument = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { i18n } = useTranslation();
  const staffRoute = isStaffPath(pathname);
  const localeFromPath = getLocaleFromPathname(pathname);
  const activeLanguage = localeFromPath ?? "en";

  useEffect(() => {
    if (localeFromPath && i18n.resolvedLanguage !== localeFromPath) {
      void i18n.changeLanguage(localeFromPath);
    }
  }, [i18n, localeFromPath]);

  return (
    <html lang={activeLanguage} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <SidebarProvider defaultOpen>
          <div className="nrc-shell min-h-svh">
            <Header />
            {staffRoute ? (
              <Outlet />
            ) : (
              <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 sm:px-6 lg:px-8">
                <main className="py-8 sm:py-10">
                  <Outlet />
                </main>
              </div>
            )}
          </div>
        </SidebarProvider>
        <Toaster />

        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
};

const evlogMiddleware = createMiddleware().server(async (options) => {
  const { evlogErrorHandler } = await import("evlog/nitro/v3");

  return evlogErrorHandler(options);
});

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootDocument,
  head: () => ({
    links: [
      {
        href: appCss,
        rel: "stylesheet",
      },
    ],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      {
        title: "NRC Competition Hub",
      },
    ],
  }),
  server: {
    handlers: {
      GET: ({ context, next, request }) => {
        const log = (context as { log?: RequestLogger } | undefined)?.log;
        const { pathname, searchParams } = new URL(request.url);

        log?.set({
          route: { pathname },
        });

        if (searchParams.get("simulate_error") === "1") {
          throw createError({
            fix: "Remove `simulate_error=1` from the URL.",
            message: "Simulated request error",
            status: 400,
            why: "Manual evlog integration test from the root route handler.",
          });
        }

        return next();
      },
    },
    middleware: [evlogMiddleware],
  },
});
