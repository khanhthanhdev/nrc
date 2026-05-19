import evlog from "evlog/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Dev: proxy auth + RPC + upload endpoints to the API container so the
  // browser sees them as same-origin. Mirrors the Caddy production routing
  // and eliminates CORS preflights for `useSession` and oRPC during dev.
  const apiTarget = env.VITE_API_URL ?? env.VITE_SERVER_URL ?? "http://localhost:3000";
  const proxy = {
    "/api/auth": { changeOrigin: true, target: apiTarget },
    "/api/sync": { changeOrigin: true, target: apiTarget },
    "/api/upload": { changeOrigin: true, target: apiTarget },
    "/rpc": { changeOrigin: true, target: apiTarget },
  };

  return {
    plugins: [tailwindcss(), evlog({ service: "nrc-web" }), tanstackStart(), viteReact()],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 3001,
      proxy,
    },
  };
});
