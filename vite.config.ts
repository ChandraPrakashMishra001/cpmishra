import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      includeAssets: ["favicon.ico", "lia-icon-192.png", "lia-icon-512.png", "robots.txt"],
      manifest: {
        id: "/",
        name: "Lia - AI Companion",
        short_name: "Lia",
        description: "Your sweet, caring anime AI companion",
        theme_color: "#fce7f3",
        background_color: "#fdf2f8",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["entertainment", "lifestyle"],
        icons: [
          {
            src: "/lia-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/lia-icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/lia-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/lia-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ai\.gateway\.lovable\.dev\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
