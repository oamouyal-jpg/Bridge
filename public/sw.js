/*
 * Kill-switch service worker.
 *
 * Earlier iterations of this app (or the production deploy) registered a
 * service worker on some users' browsers. That SW now intercepts requests
 * for /_next/ chunks and serves stale bundles, which surfaces as
 *
 *     TypeError: Cannot read properties of undefined (reading 'call')
 *
 * in webpack's module factory — the browser holds module IDs whose
 * factories no longer exist in the freshly built bundle.
 *
 * This replacement SW:
 *   1. Immediately takes control on install/activate (skipWaiting + claim).
 *   2. Deletes every Cache Storage bucket the previous SW had opened.
 *   3. Unregisters itself so the browser goes back to a clean, SW-less state
 *      on the next page load.
 *
 * After this has run once per client, the /sw.js request returns and the
 * browser removes its registration. Subsequent page loads are normal.
 */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        if (self.caches && caches.keys) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch (_) {
        /* ignore */
      }
      try {
        await self.clients.claim();
      } catch (_) {
        /* ignore */
      }
      try {
        await self.registration.unregister();
      } catch (_) {
        /* ignore */
      }
      // Force all open tabs to reload so they drop any in-memory references
      // to the old bundle that the previous SW was feeding them.
      try {
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) {
          client.navigate(client.url);
        }
      } catch (_) {
        /* ignore */
      }
    })()
  );
});

// Never intercept anything; pass through to the network.
self.addEventListener("fetch", () => {});
