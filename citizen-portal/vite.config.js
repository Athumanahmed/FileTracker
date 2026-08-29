import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The app always calls a relative "/api/..." path. In dev this proxy
// forwards it to the backend; in the production image nginx does the same
// (see nginx.conf). So no backend URL is ever baked into the build.
//   - native `npm run dev`      -> http://localhost:5051
//   - `docker compose` dev      -> http://backend:5051 (set in the compose file)
const apiTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:5051";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3001,
    host: true,
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
    },
  },
  preview: {
    port: 3001,
    host: true,
  },
});
