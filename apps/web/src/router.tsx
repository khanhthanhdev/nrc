import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import "./index.css";
import Loader from "./components/loader";
import { I18nProvider } from "./i18n/provider";
import { TooltipProvider } from "./components/ui/tooltip";
import { routeTree } from "./routeTree.gen";
import { orpc, queryClient } from "./utils/orpc";

export const getRouter = () => {
  const router = createTanStackRouter({
    Wrap: ({ children }) => (
      <I18nProvider>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </TooltipProvider>
      </I18nProvider>
    ),
    context: { orpc, queryClient },
    defaultNotFoundComponent: () => <div>Not Found</div>,
    defaultPendingComponent: () => <Loader />,
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true,
  });
  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
