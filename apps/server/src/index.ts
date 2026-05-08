import { initLogger } from "evlog";
import { createApp } from "./bootstrap/create-app";
import { registerSyncRoute } from "./routes/sync/register-sync-route";
import { registerUploadRoute } from "./routes/upload/register-upload-route";
import { registerAuthRoute } from "./transport/http/register-auth-route";
import { registerE2ETestRoute } from "./transport/http/register-e2e-test-route";
import { registerOrpcMiddleware } from "./transport/http/register-orpc-middleware";
import { registerRootRoute } from "./transport/http/register-root-route";

initLogger({ env: { service: "my-api" } });

const app = createApp();

registerOrpcMiddleware(app);
registerAuthRoute(app);
registerE2ETestRoute(app);
registerRootRoute(app);
registerSyncRoute(app);
registerUploadRoute(app);

export default app;
