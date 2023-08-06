(function (self) {
    const CACHE_NAME = 'totk-armor-helper';
    self.addEventListener('install', ev => {
        ev.waitUntil(self.skipWaiting());
    });
    self.addEventListener('activate', ev => {
        ev.waitUntil(self.clients.claim());
    })
    self.addEventListener('fetch', ev => {
        ev.respondWith(handleFetch(ev));
    });
    /**
     * First attempt to access the item via the network, if that fails, return the last
     * cached response.
     * @param {any} ev Fetch event
     * @returns Fetch Response
     */
    async function handleFetch(ev) {
        return fetch(ev.request).then(r => {
            if (!r.ok) {
                return fallbackResponse(ev.request).then(res => {
                    if (!res) {
                        return r;
                    }
                    return res;
                }).catch(() => r);
            }
            return self.caches.open(CACHE_NAME).then(cache => {
                return cache.put(ev.request, r.clone())
                .then(() => r)
                .catch(() => r);
            })
        })
        .catch(e => {
            return fallbackResponse(ev.request)
        });
    }
    
    async function fallbackResponse(req) {
        let cache = await self.caches.open(CACHE_NAME);
        return await cache.match(req);
    }
})(self);
