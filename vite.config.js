import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  console.log("✅ Loaded VITE_API_BASE_URL:", env.VITE_API_BASE_URL);

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "favicon.svg",
          "apple-touch-icon.png",
          "RR_LOGO.svg",
        ],
        manifest: {
          id: "/",
          name: "RR Properties Hyderabad",
          short_name: "RR Properties",
          description:
            "Buy, sell, and rent homes in Kondapur, Sri Ram Nagar, and Hyderabad.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait-primary",
          background_color: "#111318",
          theme_color: "#111318",
          lang: "en-IN",
          categories: ["lifestyle", "business"],
          icons: [
            {
              src: "/web-app-manifest-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/web-app-manifest-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/web-app-manifest-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/web-app-manifest-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.pathname.includes("/r2proxy/") ||
                url.pathname.startsWith("/api/") ||
                url.pathname.endsWith(".m3u8") ||
                url.pathname.endsWith(".ts"),
              handler: "NetworkOnly",
            },
          ],
        },
      }),
    ],
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
