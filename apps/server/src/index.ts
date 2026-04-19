import { initLogger } from "evlog";
import { createApp } from "./bootstrap/create-app";
import { registerUploadRoute } from "./routes/upload/register-upload-route";
import { registerAuthRoute } from "./transport/http/register-auth-route";
import { registerOrpcMiddleware } from "./transport/http/register-orpc-middleware";
import { registerRootRoute } from "./transport/http/register-root-route";

initLogger({ env: { service: "my-api" } });

const app = createApp();

registerOrpcMiddleware(app);
registerAuthRoute(app);
registerRootRoute(app);
registerUploadRoute(app);

export default app;
