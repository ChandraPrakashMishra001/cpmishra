// Guarded service-worker registration.
// Never registers in dev, inside an iframe, on Lovable preview hosts, or with ?sw=off.

const SW_URL = "/sw.js";

const isPreviewHost = (host: string) =>
  host.startsWith("id-preview--") ||
  host.startsWith("preview--") ||
  host === "lovableproject.com" ||
  host.endsWith(".lovableproject.com") ||
  host === "lovableproject-dev.com" ||
  host.endsWith(".lovableproject-dev.com") ||
  host === "beta.lovable.dev" ||
  host.endsWith(".beta.lovable.dev");

const shouldRefuse = (): boolean => {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  if (isPreviewHost(window.location.hostname)) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
};

const unregisterAppWorkers = async () => {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
  await Promise.allSettled(
    regs
      .filter((r) => {
        const url =
          r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || "";
        return url.endsWith(SW_URL) || url.includes("dev-sw.js");
      })
      .map((r) => r.unregister()),
  );
};

export const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator)) return;

  if (shouldRefuse()) {
    void unregisterAppWorkers();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
};
