# Offline-first BloomSense (Amanai)

Goal: a farmer with no signal can still open the app, browse the disease library, read past field logs, save a new log, and queue questions for Amanai — everything syncs the moment the phone gets a bar of signal.

## What the farmer experiences

1. **App always opens.** Even with the phone in airplane mode, the app loads from the device instead of the network.
2. **Disease library works fully offline.** All disease entries, symptoms, prevention and treatment steps are bundled with the app, so search and browsing never need internet.
3. **Field logs readable and writable offline.** Past logs stay on the phone. New logs saved offline are marked "Waiting to sync" and upload automatically later.
4. **Amanai questions get queued.** Ask a question with no signal and it's stored as "Pending — will answer when online". When connection returns, Amanai answers automatically and the reply appears in the chat with a notification.
5. **Offline diagnosis fallback.** With no signal, a question is matched against the on-device disease library and the farmer's own past logs, returning a best-guess "Offline guidance" card (clearly labelled as provisional) plus the queued full answer for later.
6. **Clear status.** A small banner shows Online / Offline / "3 items waiting to sync", with a manual "Sync now" button.

## Technical approach

**Service worker (offline shell)**
- Keep `vite-plugin-pwa` with `generateSW`, but turn off `devOptions.enabled` and set `injectRegister: null`.
- Add a guarded registration wrapper (`src/pwa/registerSW.ts`) that refuses to register in dev, in an iframe, on Lovable preview hosts, or with `?sw=off`, and unregisters stale workers in those contexts.
- Caching rules: `NetworkFirst` for HTML navigations, `CacheFirst` for hashed build assets and icons, `NetworkOnly` for the AI gateway and chat function, `/~oauth` excluded from navigation fallback.

**Data offline**
- Enable Firestore local persistence (`persistentLocalCache` with multi-tab manager) in `src/integrations/firebase/client.ts`. This makes `useFieldLog` reads and writes work offline out of the box — Firestore replays queued writes on reconnect.
- Add `hasPendingWrites` from snapshot metadata to each `FieldLog` so the UI can show a "Waiting to sync" chip in `FieldLogDialog`.
- Disease library already lives in `src/data/diseases.ts` (bundled code) — nothing to do beyond keeping it local.

**Queued chat**
- New `src/hooks/useOfflineQueue.ts`: a localStorage-backed queue of unanswered prompts (id, text, image ref, createdAt, status).
- `useLiaChat` checks `navigator.onLine` and network failures; on failure it enqueues instead of showing an error, and appends an "Offline guidance" assistant message built from a local keyword match over `diseases.ts` + recent field logs.
- An `online` event listener drains the queue one item at a time, streams the real answer in, and replaces/appends the provisional message.

**Status UI**
- `src/components/OfflineStatusBar.tsx` — compact pill in the chat header: connection state, pending count, "Sync now".
- Toasts on reconnect: "Back online — syncing 2 items".

## Files touched

- `vite.config.ts` — PWA config corrections (dev off, injectRegister null, runtime caching rules)
- `src/pwa/registerSW.ts` (new) + call from `src/main.tsx`
- `src/integrations/firebase/client.ts` — persistent local cache
- `src/hooks/useFieldLog.ts` — pending-write flag, offline-safe save
- `src/hooks/useOfflineQueue.ts` (new)
- `src/hooks/useLiaChat.ts` — offline detection, queueing, local fallback answer, drain on reconnect
- `src/components/OfflineStatusBar.tsx` (new), wired into `src/pages/Index.tsx`
- `src/components/FieldLogDialog.tsx` — "Waiting to sync" chip

## Limitations to be honest about

- Offline mode only works after the first visit online (the app must download itself once).
- Offline answers come from the on-device disease library, not the full AI — the real answer arrives on reconnect.
- Offline behaviour cannot be tested in the Lovable editor preview; it works in the published app.
- Image analysis needs internet; photos taken offline are stored and analysed on reconnect.
