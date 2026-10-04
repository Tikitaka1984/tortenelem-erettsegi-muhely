import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {test} from 'node:test';

const root=path.resolve(import.meta.dirname,'..');
const workerSource=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const pageSource=fs.readFileSync(path.join(root,'pwa.js'),'utf8');
const origin='https://preview.test/';
const manifest={version:'new',assets:['courses/test.html','images/test.webp'],totalBytes:8};
const json=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};

// CacheStorage preserves creation order and detached Cache handles after deletion.
// Both details matter for the regressions exercised here.
function memoryCaches(){
  const stores=new Map();
  const key=request=>new URL(typeof request==='string'?request:request.url,origin).href;
  return {
    async open(name){
      if(!stores.has(name)){
        const responses=new Map();
        stores.set(name,{
          async match(request){return responses.get(key(request))?.clone();},
          async put(request,response){responses.set(key(request),response.clone());},
          async keys(){return [...responses.keys()].map(url=>({url}));},
          async delete(request){return responses.delete(key(request));}
        });
      }
      return stores.get(name);
    },
    async match(request){for(const cache of stores.values()){const response=await cache.match(request);if(response)return response;}},
    async keys(){return [...stores.keys()];},
    async delete(name){return stores.delete(name);}
  };
}
function worker(fetcher){
  const handlers={},clients=[],caches=memoryCaches();
  const context=vm.createContext({URL,Response,caches,fetch:fetcher,self:{
    registration:{scope:origin},location:{origin:origin.slice(0,-1)},
    clients:{matchAll:async()=>clients,claim:async()=>{}},
    addEventListener:(type,handler)=>handlers[type]=handler,skipWaiting:()=>{}
  }});
  vm.runInContext(workerSource,context);
  const cacheName=variable=>vm.runInContext(variable,context);
  async function seedShell(data=manifest){await (await caches.open(cacheName('SHELL_CACHE'))).put('./offline-assets.json',json(data));}
  async function seedPackage(data=manifest){
    const cache=await caches.open(cacheName('OFFLINE_CONTENT_CACHE'));
    for(const asset of data.assets)await cache.put(asset,new Response('NEW'));
    await cache.put('./__pwa_offline_package_marker__',json({version:data.version}));
  }
  function message(type,source){let completion=Promise.resolve();handlers.message({data:{type},source,waitUntil:p=>completion=p});return completion;}
  function request(asset,mode='same-origin'){
    let response;handlers.fetch({request:{url:new URL(asset,origin).href,method:'GET',mode},respondWith:p=>response=p});return response;
  }
  return {caches,clients,cacheName,seedShell,seedPackage,message,request};
}
function page(){
  const elements=new Map(),windowHandlers={},workerHandlers={},sent=[];
  function element(){
    const handlers={},children=new Map();
    return {hidden:false,disabled:false,textContent:'',dataset:{},handlers,
      addEventListener:(type,handler)=>handlers[type]=handler,
      querySelector(selector){if(!children.has(selector))children.set(selector,element());return children.get(selector);},
      showModal(){},close(){}};
  }
  const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);}};
  const active={postMessage:message=>sent.push(message)};
  const registration={active,update:async()=>{},addEventListener(){}};
  const serviceWorker={controller:active,register:async()=>registration,ready:Promise.resolve(registration),addEventListener:(type,handler)=>workerHandlers[type]=handler};
  const context=vm.createContext({document,window:{addEventListener:(type,handler)=>windowHandlers[type]=handler},
    navigator:{serviceWorker,onLine:true,userAgent:'Chromium',platform:'Linux',maxTouchPoints:0},
    matchMedia:()=>({matches:false,addEventListener(){}}),sessionStorage:{getItem:()=>null,setItem(){}},
    fetch:async()=>json(manifest),Intl,confirm:()=>true,location:{reload(){}},setTimeout,clearTimeout});
  vm.runInContext(pageSource,context);
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  async function start(){windowHandlers.load();await settle();}
  const receive=data=>workerHandlers.message({data});
  const get=id=>document.getElementById(id);
  return {start,settle,sent,receive,get,context,windowHandlers};
}

test('status failure terminates without an automatic retry loop; the user can retry',async()=>{
  const ui=page();await ui.start();ui.sent.length=0;
  const sw=worker(async()=>new Response('',{status:503}));
  const messages=[];
  await sw.message('PWA_GET_OFFLINE_STATUS',{id:'page',postMessage:data=>{messages.push(data);ui.receive(data);}});
  assert.equal(messages.length,1);
  assert.equal(ui.sent.length,0,'a failed status query must not request its own status again');
  assert.match(ui.get('offlinePackageStatus').textContent,/nem ellenőrizhető/);
  assert.equal(ui.get('offlinePackageAction').disabled,false);
  await ui.get('offlinePackageAction').handlers.click();
  assert.equal(ui.sent.at(-1).type,'PWA_GET_OFFLINE_STATUS');
});

test('HTTP manifest failure falls back to the active shell manifest',async()=>{
  const sw=worker(async()=>new Response('',{status:503}));await sw.seedShell();await sw.seedPackage();
  const messages=[];await sw.message('PWA_GET_OFFLINE_STATUS',{postMessage:data=>messages.push(data)});
  assert.equal(messages.at(-1).type,'PWA_OFFLINE_STATUS');assert.equal(messages.at(-1).status,'ready');
});

test('the current offline package wins over an older runtime course and image',async()=>{
  const sw=worker(async()=>{throw new Error('offline');});await sw.seedShell();
  const runtime=await sw.caches.open(sw.cacheName('RUNTIME_CACHE'));
  for(const asset of manifest.assets)await runtime.put(asset,new Response('OLD'));
  await sw.seedPackage();
  const messages=[];await sw.message('PWA_GET_OFFLINE_STATUS',{postMessage:data=>messages.push(data)});
  assert.equal(messages.at(-1).status,'ready');
  for(const asset of manifest.assets)assert.equal(await (await sw.request(asset)).text(),'NEW',asset);
});

test('download and removal from different tabs are serialized and notify both tabs',async()=>{
  const entered=deferred(),release=deferred();
  const sw=worker(async url=>{
    if(url==='./offline-assets.json')return json(manifest);
    if(url.endsWith('images/test.webp')){entered.resolve();await release.promise;}
    return new Response('NEW');
  });
  await sw.seedShell();
  const first=[],second=[];
  const a={id:'a',postMessage:data=>first.push(data)},b={id:'b',postMessage:data=>second.push(data)};
  sw.clients.push(a,b);
  const download=sw.message('PWA_CACHE_OFFLINE_PACKAGE',a);await entered.promise;
  const removal=sw.message('PWA_REMOVE_OFFLINE_PACKAGE',b);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(second.some(data=>data.type==='PWA_OFFLINE_REMOVED'),false,'removal must wait for the download');
  release.resolve();await Promise.all([download,removal]);
  for(const messages of [first,second]){
    assert.ok(messages.some(data=>data.type==='PWA_OFFLINE_BUSY'));
    const done=messages.findIndex(data=>data.type==='PWA_OFFLINE_DONE');
    const removed=messages.findIndex(data=>data.type==='PWA_OFFLINE_REMOVED');
    assert.ok(done>=0&&removed>done,'both tabs must see download completion before removal');
  }
  const statuses=[];await sw.message('PWA_GET_OFFLINE_STATUS',{postMessage:data=>statuses.push(data)});
  assert.equal(statuses.at(-1).status,'missing');
});

test('the UI blocks removal while a local or remote download is running',async()=>{
  const ui=page();await ui.start();ui.receive({type:'PWA_OFFLINE_STATUS',status:'partial',cached:1,total:2});
  ui.sent.length=0;await ui.get('offlinePackageAction').handlers.click();
  assert.equal(ui.get('offlinePackageRemove').disabled,true);
  ui.get('offlinePackageRemove').handlers.click();
  assert.equal(ui.sent.some(data=>data.type==='PWA_REMOVE_OFFLINE_PACKAGE'),false);
  ui.receive({type:'PWA_OFFLINE_DONE',total:2});
  ui.receive({type:'PWA_OFFLINE_BUSY',operation:'PWA_CACHE_OFFLINE_PACKAGE'});
  assert.equal(ui.get('offlinePackageRemove').disabled,true);
});

test('a failed download releases the mutation queue and remains retryable',async()=>{
  const sw=worker(async url=>url==='./offline-assets.json'?json(manifest):new Response('',{status:500}));
  await sw.seedShell();const messages=[],source={postMessage:data=>messages.push(data)};
  await sw.message('PWA_CACHE_OFFLINE_PACKAGE',source);
  await sw.message('PWA_REMOVE_OFFLINE_PACKAGE',source);
  assert.ok(messages.some(data=>data.type==='PWA_OFFLINE_ERROR'));
  assert.ok(messages.some(data=>data.type==='PWA_OFFLINE_REMOVED'));
});

test('an interrupted first download reports partial, and a retry finishes it',async()=>{
  let interrupted=true;
  const sw=worker(async url=>{
    if(url==='./offline-assets.json')return json(manifest);
    if(interrupted&&url.endsWith('images/test.webp'))throw new Error('connection lost');
    return new Response('NEW');
  });
  await sw.seedShell();const messages=[],source={postMessage:data=>messages.push(data)};
  await sw.message('PWA_CACHE_OFFLINE_PACKAGE',source);await sw.message('PWA_GET_OFFLINE_STATUS',source);
  assert.equal(messages.at(-1).status,'partial');assert.equal(messages.at(-1).cached,1);
  assert.equal(messages.some(data=>data.type==='PWA_OFFLINE_DONE'),false);
  interrupted=false;
  await sw.message('PWA_CACHE_OFFLINE_PACKAGE',source);await sw.message('PWA_GET_OFFLINE_STATUS',source);
  assert.equal(messages.at(-1).status,'ready');assert.equal(messages.at(-1).cached,2);
});

test('a content-only manifest update remains current after going offline',async()=>{
  let online=true;
  const sw=worker(async url=>{
    if(!online)throw new Error('offline');
    return url==='./offline-assets.json'?json(manifest):new Response('NEW');
  });
  await sw.seedShell({...manifest,version:'old'});
  const messages=[],source={postMessage:data=>messages.push(data)};
  await sw.message('PWA_CACHE_OFFLINE_PACKAGE',source);online=false;
  await sw.message('PWA_GET_OFFLINE_STATUS',source);
  assert.equal(messages.at(-1).status,'ready');assert.equal(messages.at(-1).version,'new');
});

test('waiting-worker caches cannot leak into the active worker fallback',async()=>{
  const sw=worker(async()=>{throw new Error('offline');});
  await (await sw.caches.open('tem-web-waiting-shell')).put('./app.js',new Response('WAITING'));
  await (await sw.caches.open(sw.cacheName('SHELL_CACHE'))).put('./app.js',new Response('ACTIVE'));
  assert.equal(await (await sw.request('./app.js')).text(),'ACTIVE');
});

test('legacy worker status errors are also bounded',async()=>{
  const ui=page();await ui.start();ui.sent.length=0;
  ui.receive({type:'PWA_OFFLINE_ERROR',message:'manifest missing'});
  assert.equal(ui.sent.length,0);
  await ui.get('offlinePackageAction').handlers.click();
  ui.receive({type:'PWA_OFFLINE_ERROR',message:'manifest still missing'});
  assert.equal(ui.sent.length,1,'one manual retry must not start automatic retries');
});

test('a rejected optional storage estimate does not lock downloading',async()=>{
  const ui=page();await ui.start();
  ui.context.navigator.storage={estimate:async()=>{throw new Error('unavailable');}};
  ui.receive({type:'PWA_OFFLINE_STATUS',status:'missing'});ui.sent.length=0;
  await ui.get('offlinePackageAction').handlers.click();
  assert.equal(ui.sent.at(-1).type,'PWA_CACHE_OFFLINE_PACKAGE');
});
