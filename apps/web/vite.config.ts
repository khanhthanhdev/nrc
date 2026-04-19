import evlog from "evlog/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), evlog({ service: "nrc-web" }), tanstackStart(), viteReact()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3001,
  },
});
