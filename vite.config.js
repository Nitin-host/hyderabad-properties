import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  console.log("✅ Loaded VITE_API_BASE_URL:", env.VITE_API_BASE_URL);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});