// Per-visitor private identity. Every visitor gets their own stable device ID
// (localStorage) so the backend can enforce a private, per-person daily chat
// budget instead of one shared pool. Falls back to null (server counts by IP)
// when storage is unavailable (e.g. private browsing).
const DEVICE_ID_KEY = "amanai_device_id";
const ID_PATTERN = /^[a-f0-9-]{8,64}$/i;

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 10)}`;
}

export function getDeviceId(): string | null {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id || !ID_PATTERN.test(id)) {
      id = randomId();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}
