import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target:
            env.NODE_ENV === "production"
              ? env.VITE_API_BASE_URL
              : env.VITE_API_BASE_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
