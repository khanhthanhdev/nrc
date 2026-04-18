import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index.js";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
