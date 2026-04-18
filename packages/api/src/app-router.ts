import type { RouterClient } from "@orpc/server";

import { authRouter } from "./features/auth/index.js";
import { systemRouter } from "./features/system/index.js";

export const appRouter = {
  auth: authRouter,
  ...systemRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
