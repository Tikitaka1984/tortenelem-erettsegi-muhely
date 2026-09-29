(()=>{
'use strict';
const installButton=document.getElementById('installApp');
const installDialog=document.getElementById('installDialog');
const updateBar=document.getElementById('pwaUpdate');
const statusChip=document.getElementById('networkStatus');
const statusHelp=document.getElementById('networkHelp');
const packageStatus=document.getElementById('offlinePackageStatus');
const packageSize=document.getElementById('offlinePackageSize');
const packageButton=document.getElementById('offlinePackageAction');
const removeButton=document.getElementById('offlinePackageRemove');
const packageMessage=document.getElementById('offlinePackageMessage');
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let deferredInstallPrompt=null,registration=null,reloading=false,refreshRequested=false,manifest=null,offlineState='missing';

function updateInstallVisibility(){installButton.hidden=standalone()||(!deferredInstallPrompt&&!ios);}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;updateInstallVisibility();});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;updateInstallVisibility();});
matchMedia('(display-mode: standalone)').addEventListener?.('change',updateInstallVisibility);
installButton.addEventListener('click',async()=>{
  if(ios){installDialog.showModal();return;}
  if(!deferredInstallPrompt)return;
  installButton.disabled=true;
  await deferredInstallPrompt.prompt();
  try{await deferredInstallPrompt.userChoice;}catch(_){}
  deferredInstallPrompt=null;installButton.disabled=false;updateInstallVisibility();
});
installDialog.querySelector('[data-close]').addEventListener('click',()=>installDialog.close());
installDialog.addEventListener('click',event=>{if(event.target===installDialog)installDialog.close();});
updateInstallVisibility();

function updateNetwork(){
  const online=navigator.onLine;
  statusChip.textContent=online?'Online':'Offline mód';statusChip.dataset.state=online?'online':'offline';
  statusHelp.hidden=online;
}
window.addEventListener('online',updateNetwork);window.addEventListener('offline',updateNetwork);updateNetwork();

function showUpdate(worker){
  if(!worker||sessionStorage.getItem('tem-update-later')==='1')return;
  updateBar.hidden=false;
  updateBar.querySelector('[data-update]').onclick=()=>{refreshRequested=true;worker.postMessage({type:'SKIP_WAITING'});};
}
updateBar.querySelector('[data-later]').addEventListener('click',()=>{sessionStorage.setItem('tem-update-later','1');updateBar.hidden=true;});

async function registerServiceWorker(){
  if(!('serviceWorker' in navigator))return null;
  registration=await navigator.serviceWorker.register('./service-worker.js',{scope:'./'});
  if(registration.waiting&&navigator.serviceWorker.controller)showUpdate(registration.waiting);
  registration.addEventListener('updatefound',()=>{
    const installing=registration.installing;
    installing?.addEventListener('statechange',()=>{if(installing.state==='installed'&&navigator.serviceWorker.controller)showUpdate(registration.waiting||installing);});
  });
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshRequested||reloading)return;reloading=true;location.reload();});
  navigator.serviceWorker.addEventListener('message',handleWorkerMessage);
  await registration.update().catch(()=>{});
  requestStatus();return registration;
}

function send(type){const worker=navigator.serviceWorker.controller||registration?.active;worker?.postMessage({type});}
function requestStatus(){send('PWA_GET_OFFLINE_STATUS');}
function formatBytes(bytes){return new Intl.NumberFormat('hu-HU',{style:'unit',unit:'megabyte',maximumFractionDigits:1}).format(bytes/1e6);}
function renderPackage(status,cached=0,total=manifest?.assets.length||0){
  offlineState=status;
  const labels={ready:'Offline csomag kész',outdated:'Frissítés érhető el',partial:'Részleges letöltés',missing:'Nincs letöltve'};
  packageStatus.textContent=labels[status]||labels.missing;
  packageButton.textContent=status==='outdated'?'Offline csomag frissítése':status==='ready'?'Offline csomag kész':'Offline csomag letöltése';
  packageButton.disabled=status==='ready';removeButton.hidden=status==='missing';
  if(status==='partial')packageStatus.textContent=`Részleges letöltés (${cached} / ${total})`;
}
function handleWorkerMessage(event){
  const data=event.data||{};
  if(data.type==='PWA_OFFLINE_STATUS')renderPackage(data.status,data.cached,data.total);
  if(data.type==='PWA_OFFLINE_PROGRESS'){packageButton.disabled=true;packageButton.textContent=`Letöltés… ${data.done} / ${data.total}`;}
  if(data.type==='PWA_OFFLINE_DONE'){renderPackage('ready',data.total,data.total);packageMessage.textContent='Az offline tananyag használatra kész.';}
  if(data.type==='PWA_OFFLINE_ERROR'){renderPackage(offlineState);packageMessage.textContent='Az offline csomagot nem sikerült teljesen elmenteni. Ellenőrizd a tárhelyet és az internetkapcsolatot, majd próbáld újra.';}
  if(data.type==='PWA_OFFLINE_REMOVED'){renderPackage('missing');packageMessage.textContent='Az offline tananyag eltávolítva. A tanulási adataid megmaradtak.';}
}
packageButton.addEventListener('click',async()=>{
  if(offlineState==='ready')return;
  if(navigator.storage?.estimate&&manifest){
    const {quota=0,usage=0}=await navigator.storage.estimate();
    if(quota&&quota-usage<manifest.totalBytes*1.15){packageMessage.textContent='Nincs elegendő szabad tárhely az offline csomaghoz.';return;}
  }
  if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});packageMessage.textContent='';send('PWA_CACHE_OFFLINE_PACKAGE');
});
removeButton.addEventListener('click',()=>{if(confirm('Eltávolítod az offline tananyagcsomagot? A tanulási adataid megmaradnak.'))send('PWA_REMOVE_OFFLINE_PACKAGE');});
fetch('./offline-assets.json').then(response=>{if(!response.ok)throw new Error();return response.json();}).then(data=>{manifest=data;packageSize.textContent=`kb. ${formatBytes(data.totalBytes)}`;}).catch(()=>{packageSize.textContent='A méret nem érhető el.';});
window.addEventListener('load',()=>{registerServiceWorker().catch(()=>{packageMessage.textContent='Az offline funkciók ebben a böngészőben nem érhetők el.';});},{once:true});
})();
