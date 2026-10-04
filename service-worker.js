const CACHE_PREFIX='tem-web-';
const SHELL_CACHE=CACHE_PREFIX+'1.6-shell-v5';
const RUNTIME_CACHE=CACHE_PREFIX+'1.6-runtime-v5';
const OFFLINE_CONTENT_CACHE='tem-offline-content-v1';
const OFFLINE_MANIFEST='./offline-assets.json';
const OFFLINE_MARKER='./__pwa_offline_package_marker__';
let offlineMutations=Promise.resolve(),offlineOperation=null;
// Previous D-package baseline identifier retained for its regression audit: 1.5-shell-v3.
const SHELL_ASSETS=[
  './','./index.html','./dashboard-logic.js','./app.js','./pwa.js','./course-frame-channel.js','./course-frame-bridge.js','./course-theme.css','./course-theme-dark.css','./annotations.js','./account-cloud.js','./vendor/supabase.min.js','./course-meta.json',OFFLINE_MANIFEST,'./manifest.webmanifest','./favicon.svg',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-512-maskable.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(SHELL_ASSETS)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys
    .filter(key=>key.startsWith(CACHE_PREFIX)&&![SHELL_CACHE,RUNTIME_CACHE].includes(key))
    .map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

async function loadOfflineManifest(){
  const shell=await caches.open(SHELL_CACHE);
  async function readManifest(response){
    if(!response?.ok)throw new Error('Az offline fájllista nem érhető el.');
    const data=await response.json();
    if(!data||!Array.isArray(data.assets)||typeof data.version!=='string')throw new Error('Az offline fájllista hibás.');
    return data;
  }
  try{
    const response=await fetch(OFFLINE_MANIFEST,{cache:'no-store'});
    const data=await readManifest(response.clone());
    // Keep the last valid list available after a content-only update or HTTP outage.
    await shell.put(OFFLINE_MANIFEST,response).catch(()=>{});
    return data;
  }catch(_){return readManifest(await shell.match(OFFLINE_MANIFEST));}
}
async function readMarker(cache){
  const response=await cache.match(OFFLINE_MARKER);
  if(!response)return null;
  try{return await response.json();}catch(_){return null;}
}
async function offlineStatus(){
  const [manifest,cache]=await Promise.all([loadOfflineManifest(),caches.open(OFFLINE_CONTENT_CACHE)]);
  const marker=await readMarker(cache);
  let cached=0;
  for(const asset of manifest.assets)if(await cache.match(new URL(asset,self.registration.scope).href))cached++;
  const status=marker?.version===manifest.version&&cached===manifest.assets.length?'ready':marker?'outdated':cached?'partial':'missing';
  return {type:'PWA_OFFLINE_STATUS',status,version:manifest.version,total:manifest.assets.length,cached,busy:offlineOperation!==null};
}
function reply(source,message){try{source?.postMessage(message);}catch(_){}}
async function notifyClients(message,source){
  const clients=await self.clients.matchAll({type:'window'}).catch(()=>[]);
  for(const client of clients)reply(client,message);
  if(!clients.some(client=>client.id===source?.id))reply(source,message);
}
// One queue for all tabs: deleting a Cache while a download retains its handle
// would otherwise allow a false DONE reply for a detached, inaccessible cache.
function queueOfflineOperation(type,source,task){
  const operation=offlineMutations.then(async()=>{
    offlineOperation=type;
    try{
      await notifyClients({type:'PWA_OFFLINE_BUSY',operation:type},source);
      await task();
    }catch(error){reply(source,{type:'PWA_OFFLINE_ERROR',requestType:type,message:error.name==='QuotaExceededError'?'Nincs elegendő tárhely.':error.message});}
    finally{
      offlineOperation=null;
      await notifyClients({type:'PWA_OFFLINE_IDLE'},source);
    }
  });
  offlineMutations=operation.catch(()=>{});
  return operation;
}
async function cacheOfflinePackage(source){
  const manifest=await loadOfflineManifest();
  const cache=await caches.open(OFFLINE_CONTENT_CACHE);
  let done=0;
  for(const asset of manifest.assets){
    const url=new URL(asset,self.registration.scope).href;
    const response=await fetch(url);
    if(!response.ok)throw new Error(`Nem tölthető le: ${asset}`);
    await cache.put(url,response);
    done++;reply(source,{type:'PWA_OFFLINE_PROGRESS',done,total:manifest.assets.length,url:asset});
  }
  const allowed=new Set(manifest.assets.map(asset=>new URL(asset,self.registration.scope).href));
  for(const request of await cache.keys()){
    if(request.url!==new URL(OFFLINE_MARKER,self.registration.scope).href&&!allowed.has(request.url))await cache.delete(request);
  }
  await cache.put(OFFLINE_MARKER,new Response(JSON.stringify({version:manifest.version,completedAt:new Date().toISOString()}),{headers:{'Content-Type':'application/json'}}));
  await notifyClients({type:'PWA_OFFLINE_DONE',version:manifest.version,total:manifest.assets.length},source);
}
async function removeOfflinePackage(){
  await caches.delete(OFFLINE_CONTENT_CACHE);await caches.open(OFFLINE_CONTENT_CACHE);
  const runtime=await caches.open(RUNTIME_CACHE);
  for(const request of await runtime.keys()){
    const url=new URL(request.url);
    if(url.origin===self.location.origin&&(/\/courses\/.*\.html$/.test(url.pathname)||url.pathname.includes('/images/')))await runtime.delete(request);
  }
}
self.addEventListener('message',event=>{
  const type=event.data?.type;
  if(type==='SKIP_WAITING'){self.skipWaiting();return;}
  if(type==='PWA_GET_OFFLINE_STATUS'){event.waitUntil(offlineStatus().then(status=>reply(event.source,status)).catch(error=>reply(event.source,{type:'PWA_OFFLINE_ERROR',requestType:type,message:error.message})));return;}
  if(type==='PWA_CACHE_OFFLINE_PACKAGE'){event.waitUntil(queueOfflineOperation(type,event.source,()=>cacheOfflinePackage(event.source)));return;}
  if(type==='PWA_REMOVE_OFFLINE_PACKAGE'){event.waitUntil(queueOfflineOperation(type,event.source,async()=>{await removeOfflinePackage();await notifyClients({type:'PWA_OFFLINE_REMOVED'},event.source);}));}
});

async function matchCachedResponse(request){
  const url=new URL(typeof request==='string'?request:request.url,self.registration.scope);
  if(url.pathname.includes('/courses/')||url.pathname.includes('/images/')){
    const content=await (await caches.open(OFFLINE_CONTENT_CACHE)).match(request);
    if(content)return content;
  }
  // Explicit names avoid serving another version's shell while it is waiting.
  return (await (await caches.open(SHELL_CACHE)).match(request))||
    (await (await caches.open(RUNTIME_CACHE)).match(request));
}
async function networkFirst(request,fallback){
  try{const response=await fetch(request);if(response.ok)await (await caches.open(RUNTIME_CACHE)).put(request,response.clone()).catch(()=>{});return response;}
  catch(_){return (await matchCachedResponse(request))||(fallback?await matchCachedResponse(fallback):undefined);}
}
function offlineCourseResponse(){
  const csp="default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";
  return new Response(`<!doctype html><html lang="hu"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kurzus offline nem elérhető</title><style>body{margin:0;background:#f5f7fb;color:#253247;font:16px/1.6 system-ui,sans-serif}.box{max-width:620px;margin:12vh auto;padding:32px}.box h1{font-size:1.45rem}</style><main class="box"><h1>Ez a kurzus még nincs offline elmentve</h1><p>Internetkapcsolat mellett töltsd le az offline tananyagcsomagot, vagy nyisd meg egyszer ezt a kurzust.</p></main><script src="../course-frame-bridge.js"></script></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff'}});
}
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==self.location.origin)return;
  if(url.pathname==='/api/config'){event.respondWith(fetch(request));return;}
  if(url.pathname.includes('/courses/')&&url.pathname.endsWith('.html')){event.respondWith(networkFirst(request).then(response=>response||offlineCourseResponse()));return;}
  if(request.mode==='navigate'){event.respondWith(networkFirst(request,'./index.html').then(response=>response||matchCachedResponse('./index.html')));return;}
  if(url.pathname.includes('/images/')){event.respondWith(matchCachedResponse(request).then(cached=>cached||networkFirst(request)));return;}
  event.respondWith(networkFirst(request).then(response=>response||matchCachedResponse(request)));
});
