import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const manifest=JSON.parse(read('manifest.webmanifest'));
const html=read('index.html'),app=read('pwa.js'),sw=read('service-worker.js');
assert.equal(manifest.name,'Történelem Érettségi Műhely');assert.equal(manifest.short_name,'TÉ Műhely');assert.equal(manifest.lang,'hu');
assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.id,'./');
assert.deepEqual(manifest.categories,['education']);assert.equal(manifest.orientation,'any');assert.equal(manifest.prefer_related_applications,false);
assert.deepEqual(manifest.shortcuts.map(item=>item.url),['./#home','./#progress','./#materials']);
function pngSize(file){const data=fs.readFileSync(path.join(root,file));assert.equal(data.toString('hex',0,8),'89504e470d0a1a0a');return [data.readUInt32BE(16),data.readUInt32BE(20)];}
assert.deepEqual(pngSize('icons/icon-192.png'),[192,192]);assert.deepEqual(pngSize('icons/icon-512.png'),[512,512]);assert.deepEqual(pngSize('icons/icon-512-maskable.png'),[512,512]);
assert.match(html,/viewport-fit=cover/);assert.match(html,/apple-mobile-web-app-capable" content="yes/);assert.match(html,/apple-mobile-web-app-title" content="TÉ Műhely/);assert.match(html,/rel="apple-touch-icon"/);
assert.doesNotMatch(sw,/install[\s\S]{0,250}skipWaiting/);assert.match(sw,/type==='SKIP_WAITING'[\s\S]*self\.skipWaiting/);
for(const token of ['registration.waiting','updatefound','statechange','controllerchange','reloading'])assert.ok(app.includes(token),`update flow: ${token}`);assert.match(html,/Frissítés most/);
assert.match(app,/await navigator\.serviceWorker\.ready/,'initialization must await an active worker');
assert.match(app,/if\(refreshRequested\)[\s\S]*?location\.reload\(\);return;\}[\s\S]*?requestStatus\(\)/,'a first controller claim must refresh status without reloading');
assert.match(app,/function send\(type\)[\s\S]*?if\(!worker\)return false;[\s\S]*?return true/,'send must report whether delivery was possible');
assert.match(html,/id="offlinePackageAction"[^>]*disabled[^>]*>Előkészítés…/,'offline CTA must start disabled');
assert.match(app,/addEventListener\('online'/);assert.match(app,/addEventListener\('offline'/);assert.match(app,/navigator\.onLine/);assert.match(html,/Offline mód|networkStatus/);
const offline=JSON.parse(read('offline-assets.json'));const meta=JSON.parse(read('course-meta.json'));
assert.equal(new Set(offline.assets).size,offline.assets.length);assert.deepEqual([...offline.assets].sort(),offline.assets);
for(const course of meta)assert.ok(offline.assets.includes(`courses/${course.source}`),course.source);
const images=[];function walk(dir,prefix){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.isDirectory())walk(path.join(dir,entry.name),`${prefix}/${entry.name}`);else if(entry.isFile())images.push(`${prefix}/${entry.name}`);}}walk(path.join(root,'images'),'images');for(const image of images)assert.ok(offline.assets.includes(image),image);
let bytes=0;const hash=crypto.createHash('sha256');for(const asset of offline.assets){const content=fs.readFileSync(path.join(root,asset));bytes+=content.length;hash.update(asset).update('\0').update(content).update('\0');}assert.equal(offline.totalBytes,bytes);assert.equal(offline.version,hash.digest('hex').slice(0,24));
const originalOffline=read('offline-assets.json');
const before={version:offline.version,totalBytes:offline.totalBytes,assets:offline.assets};
try{
  execFileSync(process.execPath,['scripts/generate-offline-assets.mjs'],{cwd:root});
  const regenerated=JSON.parse(read('offline-assets.json'));assert.deepEqual({version:regenerated.version,totalBytes:regenerated.totalBytes,assets:regenerated.assets},before);
}finally{fs.writeFileSync(path.join(root,'offline-assets.json'),originalOffline);}
assert.doesNotMatch(read('scripts/generate-offline-assets.mjs'),/\b(?:33|62)\b/);
for(const token of ['OFFLINE_CONTENT_CACHE','PWA_GET_OFFLINE_STATUS','PWA_CACHE_OFFLINE_PACKAGE','PWA_REMOVE_OFFLINE_PACKAGE','PWA_OFFLINE_PROGRESS','PWA_OFFLINE_DONE','PWA_OFFLINE_ERROR','OFFLINE_MARKER'])assert.ok(sw.includes(token),token);
assert.doesNotMatch(sw,/event\.data\.(?:url|asset)/);assert.match(sw,/caches\.delete\(OFFLINE_CONTENT_CACHE\)/);const removal=sw.match(/async function removeOfflinePackage\(\)[\s\S]*?\n\}/)?.[0]||'';assert.doesNotMatch(removal,/localStorage|supabase/i);
assert.match(app,/PWA_OFFLINE_ERROR'[\s\S]*?downloadInProgress=false;[\s\S]*?requestStatus\(\)/,'errors must query the real cache status');
assert.doesNotMatch(app,/PWA_OFFLINE_ERROR'[^\n]*renderPackage\(offlineState\)/,'errors must not restore stale client status');
assert.match(app,/if\(!workerReady\|\|downloadInProgress\|\|offlineState==='ready'\)return/,'download must have readiness and double-click guards');
assert.match(html,/@media\(display-mode:standalone\) and \(max-width:800px\)[^{]*\{[^}]*\.brand\{[^}]*safe-area-inset-top/,'standalone mobile brand must avoid the notch');
assert.match(html,/@media\(display-mode:standalone\) and \(max-width:800px\)[\s\S]*?\.viewer:not\(\.home-mode\) \.toolbar\{[^}]*safe-area-inset-top/,'standalone course toolbar must avoid the notch');
assert.match(html,/@media\(display-mode:standalone\) and \(max-width:800px\)[\s\S]*?\.viewer__surface\{[^}]*safe-area-inset-bottom/,'standalone course surface must avoid the home indicator');
assert.match(html,/progress-mode>\.pwa-panel[^}]*display:none!important/);assert.match(html,/materials-mode>\.pwa-panel[^}]*display:none!important/);
assert.match(sw,/\/api\/config/);assert.match(sw,/offlineCourseResponse/);assert.match(sw,/Content-Security-Policy/);assert.match(sw,/X-Content-Type-Options/);
const frame=html.match(/<iframe\b[^>]*id="courseFrame"[^>]*>/)?.[0]||'';assert.match(frame,/sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"/);assert.doesNotMatch(frame,/allow-same-origin/);
console.log(`Package E targeted checks: PASS (${offline.assets.length} asset, ${offline.totalBytes} byte, ${offline.version})`);
// Execute the real page and worker handlers, not a duplicate of their status logic.
execFileSync(process.execPath,['--test','scripts/test-pwa-runtime.mjs'],{cwd:root,stdio:'inherit'});
