const CACHE='repair-station-shell-v26';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/repair-station-r4.svg','./icons/pump-model.png'];

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
 self.skipWaiting();
});

self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('repair-station-')&&k!==CACHE).map(k=>caches.delete(k)))));
 self.clients.claim();
});

self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);

 // App navigation: network first, cached app shell if offline.
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(res=>{
   if(res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));}
   return res;
  }).catch(()=>caches.match('./index.html')));
  return;
 }

 // Same-origin static files: cache first, then refresh/cache from network.
 if(url.origin===self.location.origin){
  event.respondWith(caches.match(req).then(cached=>{
   const network=fetch(req).then(res=>{
    if(res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}
    return res;
   }).catch(()=>cached);
   return cached||network;
  }));
  return;
 }

 // API/map/CDN requests must never fall back to index.html.
 event.respondWith(fetch(req).catch(()=>caches.match(req)));
});
