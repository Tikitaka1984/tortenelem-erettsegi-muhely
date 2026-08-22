const CACHE_PREFIX='tem-web-';
const SHELL_CACHE=CACHE_PREFIX+'1.1-shell-v1';
const RUNTIME_CACHE=CACHE_PREFIX+'1.1-runtime-v1';
const SHELL_ASSETS=[
  './','./index.html','./course-meta.json','./manifest.webmanifest','./favicon.svg',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-512-maskable.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(SHELL_ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys
    .filter(key=>key.startsWith(CACHE_PREFIX)&&![SHELL_CACHE,RUNTIME_CACHE].includes(key))
    .map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

async function networkFirst(request,fallback){
  try{
    const response=await fetch(request);
    if(response.ok)(await caches.open(RUNTIME_CACHE)).put(request,response.clone());
    return response;
  }catch(_){
    return (await caches.match(request)) || (fallback ? await caches.match(fallback) : undefined);
  }
}

function offlineCourseResponse(){
  return new Response(`<!doctype html><html lang="hu"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kurzus offline nem elérhető</title><style>body{margin:0;background:#f5f7fb;color:#253247;font:16px/1.6 system-ui,sans-serif}.box{max-width:620px;margin:12vh auto;padding:32px}.box h1{font-size:1.45rem}</style><main class="box"><h1>Ez a kurzus még nincs offline elmentve</h1><p>Internetkapcsolat mellett nyisd meg egyszer, majd később offline is elérhető lesz.</p></main></html>`,{headers:{'Content-Type':'text/html; charset=utf-8'}});
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(networkFirst(request,'./index.html').then(response=>response||caches.match('./index.html')));
    return;
  }
  if(url.pathname.includes('/courses/')&&url.pathname.endsWith('.html')){
    event.respondWith(networkFirst(request).then(response=>response||offlineCourseResponse()));
    return;
  }
  if(url.pathname.includes('/images/')){
    event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
      if(response.ok)caches.open(RUNTIME_CACHE).then(cache=>cache.put(request,response.clone()));
      return response;
    })));
    return;
  }
  event.respondWith(networkFirst(request).then(response=>response||caches.match(request)));
});
