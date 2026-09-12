import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mcpPlugin(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: {
        enabled: false,
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
        navigateFallbackDenylist: [/^\/~oauth/, /^\/\.lovable\//],
        runtimeCaching: [
          {
            // AI + backend calls must always hit the network
            urlPattern: /^https:\/\/(ai\.gateway\.lovable\.dev|[a-z0-9-]+\.supabase\.co)\/.*/i,
            handler: "NetworkOnly",
          },
          {
            // HTML navigations: fresh when online, cached shell when offline
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "amanai-pages",
              networkTimeoutSeconds: 4,
            },
          },
          {
            // Hashed same-origin build assets and icons
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin &&
              ["script", "style", "font", "image"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "amanai-assets",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
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
