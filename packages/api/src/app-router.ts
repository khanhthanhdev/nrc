import type { RouterClient } from "@orpc/server";

import { authRouter } from "./features/auth/index.js";
import { seasonRouter } from "./features/season/index.js";
import { systemRouter } from "./features/system/index.js";
import { teamRouter } from "./features/team/index.js";

export const appRouter = {
  auth: authRouter,
  season: seasonRouter,
  team: teamRouter,
  ...systemRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
