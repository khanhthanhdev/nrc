import type { QueryClient } from "@tanstack/react-query";
import type { RequestLogger } from "evlog";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createMiddleware } from "@tanstack/react-start";
import { createError } from "evlog";

import type { orpc } from "@/utils/orpc";

import { Toaster } from "@/components/ui/sonner";

import Header from "../components/header";
import appCss from "../index.css?url";
export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

const RootDocument = () => (
  <html lang="en" className="dark">
    <head>
      <HeadContent />
    </head>
    <body>
      <div className="grid h-svh grid-rows-[auto_1fr]">
        <Header />
        <Outlet />
      </div>
      <Toaster richColors />

      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
      <Scripts />
    </body>
  </html>
);

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
        title: "My App",
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
