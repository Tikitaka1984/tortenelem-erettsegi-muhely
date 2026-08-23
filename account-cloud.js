(function bootCloud(){
'use strict';

if(!window.TEM_APP){window.addEventListener('tem-app-ready',bootCloud,{once:true});return;}
const app=window.TEM_APP;

const byId=id=>document.getElementById(id);
const authDialog=byId('authDialog');
const userDialog=byId('userDialog');
const importDialog=byId('importDialog');
const accountButton=byId('accountButton');
const IMPORT_PREFIX='tortenelem-erettsegi-muhely-import-decision-v1:';
const SDK_URL='./vendor/supabase.min.js';

let client=null;
let currentUser=null;
let currentProfile=null;
let syncTimer=null;
let syncing=false;
let sessionRevision=0;
const pendingCourses=new Set();

function openDialog(dialog,focusSelector){
  if(!dialog)return;
  if(!dialog.open)dialog.showModal();
  requestAnimationFrame(()=>dialog.querySelector(focusSelector||'button,input')?.focus());
}
function closeDialog(dialog){if(dialog?.open)dialog.close();}
document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>closeDialog(byId(button.dataset.closeDialog))));
byId('continueAsGuest')?.addEventListener('click',()=>closeDialog(authDialog));

function showAuthPanel(name){
  ['login','register','reset','password'].forEach(panel=>{
    const visible=panel===name;
    byId(panel+'Panel').hidden=!visible;
    const tab=byId(panel+'Tab');
    if(tab){tab.setAttribute('aria-selected',visible?'true':'false');tab.tabIndex=visible?0:-1;}
  });
  document.querySelector('.auth-tabs').hidden=!['login','register'].includes(name);
  const focusId={login:'loginEmail',register:'registerName',reset:'resetEmail',password:'newPassword'}[name];
  requestAnimationFrame(()=>byId(focusId)?.focus());
}
byId('loginTab')?.addEventListener('click',()=>showAuthPanel('login'));
byId('registerTab')?.addEventListener('click',()=>showAuthPanel('register'));
byId('showReset')?.addEventListener('click',()=>showAuthPanel('reset'));
byId('backToLogin')?.addEventListener('click',()=>showAuthPanel('login'));

function setMessage(id,text,type){
  const el=byId(id);if(!el)return;
  el.textContent=text||'';el.className='auth-message'+(type?' '+type:'');
}
function setBusy(form,busy){
  if(!form)return;
  form.setAttribute('aria-busy',busy?'true':'false');
  form.querySelectorAll('button,input').forEach(el=>el.disabled=Boolean(busy));
}
function friendlyError(error,context){
  const value=String(error?.message||error||'').toLowerCase();
  if(!navigator.onLine||value.includes('fetch')||value.includes('network'))return 'Nincs megfelelő hálózati kapcsolat. Próbáld meg újra, amikor helyreállt az internet.';
  if(value.includes('invalid login credentials')||value.includes('invalid_credentials'))return 'A megadott e-mail-cím vagy jelszó nem megfelelő.';
  if((value.includes('email')&&(value.includes('invalid')||value.includes('validate')))||value.includes('validation_failed'))return 'Adj meg egy érvényes e-mail-címet.';
  if(value.includes('email not confirmed'))return 'A belépés előtt erősítsd meg az e-mail-címedet a kapott levélben.';
  if(value.includes('already registered')||value.includes('user already exists'))return 'Ezzel az e-mail-címmel már létezik fiók.';
  if(value.includes('password')&&value.includes('least'))return 'A jelszó legalább 8 karakter hosszú legyen.';
  if(value.includes('rate')||value.includes('too many'))return 'Túl sok próbálkozás történt. Várj néhány percet, majd próbáld újra.';
  if(value.includes('stale_progress_update'))return 'Újabb felhőadat található; a rendszer azt tartotta meg.';
  if(context==='sync')return 'A felhőmentés most nem sikerült. A helyi változás megmaradt, később újra próbáljuk.';
  if(context==='session')return 'A munkamenet lejárt. Jelentkezz be újra.';
  return 'A művelet most nem sikerült. Kérjük, próbáld meg később.';
}

function setSyncStatus(text,state){
  const pill=byId('syncStatus');if(pill){pill.textContent=text;pill.dataset.state=state||'ok';}
  if(byId('accountButtonStatus'))byId('accountButtonStatus').textContent=text;
}
function updateAccountUi(){
  const signedIn=Boolean(currentUser);
  const name=currentProfile?.display_name||currentUser?.user_metadata?.display_name||currentUser?.email?.split('@')[0]||'Tanuló';
  byId('accountButtonName').textContent=signedIn?name:'Bejelentkezés';
  byId('personalWelcome').hidden=!signedIn;
  byId('personalWelcome').textContent=signedIn?'Üdv újra, '+name+'!':'';
  byId('storageNote').textContent=signedIn?'A haladás helyben azonnal mentődik, majd biztonságosan szinkronizálódik a fiókoddal.':'Vendégmódban a haladás ezen a böngészőn, helyben mentődik.';
  byId('resetDescription').textContent=signedIn?'A törlés a fiókod teljes felhőben tárolt tanulási haladását eltávolítja.':'Vendégmódban a mentés kizárólag ezen az eszközön és ebben a böngészőben történik.';
  byId('continueHeading').textContent=signedIn?'Folytasd, ahol abbahagytad':'Folytatás';
  byId('userDisplayName').textContent=name;
  byId('userEmail').textContent=currentUser?.email||'';
  if(!signedIn)setSyncStatus('Vendégmód · helyi mentés','guest');
}
accountButton?.addEventListener('click',()=>{
  if(currentUser){updateAccountUi();openDialog(userDialog,'#logoutButton');}
  else{showAuthPanel('login');openDialog(authDialog,'#loginEmail');}
});

function loadSdk(){
  if(window.supabase?.createClient)return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=SDK_URL;script.async=true;
    script.onload=()=>window.supabase?.createClient?resolve():reject(new Error('sdk_unavailable'));
    script.onerror=()=>reject(new Error('sdk_unavailable'));document.head.appendChild(script);
  });
}
async function loadConfig(){
  const response=await fetch('/api/config',{cache:'no-store'});
  if(!response.ok)throw new Error('config_unavailable');
  const config=await response.json();
  if(!config.supabaseUrl||!config.supabaseKey)throw new Error('config_incomplete');
  return config;
}

function courseIndexById(id){return app.courses.findIndex(course=>Number(course.id)===Number(id));}
function meaningfulState(state,index){
  const key=String(app.courses[index]?.id);const item=state.courses?.[key];
  return Boolean(item&&(item.visited||item.completed||Number(item.maxRead)>0)||state.favorites?.includes(Number(key)));
}
function hasGuestProgress(state){return app.courses.some((_,index)=>meaningfulState(state,index));}
function stateFromRows(rows,cached){
  const next=app.emptyState();const remoteIds=new Set();const localNewer=[];
  for(const row of rows||[]){
    const index=courseIndexById(row.course_id);if(index<0)continue;
    const key=String(row.course_id),local=cached.courses?.[key];remoteIds.add(key);
    const remoteTime=Date.parse(row.client_updated_at||row.updated_at)||0;
    const localTime=Number(local?.updatedAt)||0;
    if(local&&localTime>remoteTime){next.courses[key]=local;if(cached.favorites.includes(Number(key)))next.favorites.push(Number(key));localNewer.push(index);continue;}
    next.courses[key]={
      visited:row.status!=='not_started',maxRead:Number(row.progress_percent)||0,lastRead:Number(row.progress_percent)||0,
      completed:row.status==='completed',lastOpened:Date.parse(row.last_opened_at)||0,sectionId:row.section_id||null,
      scrollPosition:Number(row.scroll_position)||0,updatedAt:remoteTime,completedAt:Date.parse(row.completed_at)||null,
      drafts:local?.drafts&&typeof local.drafts==='object'?local.drafts:{}
    };
    if(row.favorite)next.favorites.push(Number(row.course_id));
  }
  app.courses.forEach((course,index)=>{
    const key=String(course.id),local=cached.courses?.[key];
    if(!remoteIds.has(key)&&local&&meaningfulState(cached,index)){next.courses[key]=local;if(cached.favorites.includes(Number(key)))next.favorites.push(Number(key));localNewer.push(index);}
  });
  let latest=-1,latestTime=-1;
  app.courses.forEach((course,index)=>{const t=Number(next.courses?.[String(course.id)]?.lastOpened)||0;if(t>latestTime){latestTime=t;latest=index;}});
  next.lastCourse=latestTime>0?latest:null;
  next.favorites=[...new Set(next.favorites)];
  return {state:next,localNewer};
}
function mergeGuestIntoState(guest,cloud){
  const merged=JSON.parse(JSON.stringify(cloud));const changed=[];
  app.courses.forEach((course,index)=>{
    if(!meaningfulState(guest,index))return;
    const key=String(course.id),guestItem=guest.courses?.[key],cloudItem=merged.courses?.[key];
    if(guestItem&&(!cloudItem||(Number(guestItem.updatedAt)||Number(guestItem.lastOpened)||0)>=(Number(cloudItem.updatedAt)||0))){merged.courses[key]=guestItem;changed.push(index);}
    if(guest.favorites?.includes(Number(course.id))&&!merged.favorites.includes(Number(course.id))){merged.favorites.push(Number(course.id));if(!changed.includes(index))changed.push(index);}
  });
  if(Number.isInteger(guest.lastCourse))merged.lastCourse=guest.lastCourse;
  return {state:merged,changed};
}
function askImport(){
  return new Promise(resolve=>{
    const yes=byId('acceptImport'),no=byId('declineImport');
    const finish=value=>{yes.onclick=null;no.onclick=null;closeDialog(importDialog);resolve(value);};
    yes.onclick=()=>finish(true);no.onclick=()=>finish(false);openDialog(importDialog,'#acceptImport');
  });
}

async function loadProfile(user){
  let result=await client.from('profiles').select('display_name').eq('user_id',user.id).maybeSingle();
  if(result.error)throw result.error;
  if(result.data)return result.data;
  const fallback=String(user.user_metadata?.display_name||user.email?.split('@')[0]||'Tanuló').trim().slice(0,80)||'Tanuló';
  result=await client.from('profiles').upsert({user_id:user.id,display_name:fallback},{onConflict:'user_id'}).select('display_name').single();
  if(result.error)throw result.error;return result.data;
}
async function applySession(session,event){
  const revision=++sessionRevision;
  if(!session?.user){
    currentUser=null;currentProfile=null;pendingCourses.clear();clearTimeout(syncTimer);
    app.setState(app.loadState(app.guestStorageKey),app.guestStorageKey);updateAccountUi();return;
  }
  currentUser=session.user;
  setSyncStatus('Felhőadatok betöltése…','syncing');
  try{
    currentProfile=await loadProfile(currentUser);if(revision!==sessionRevision)return;
    const cacheKey=app.cloudCachePrefix+currentUser.id;
    const cached=app.loadState(cacheKey);
    const response=await client.from('course_progress').select('course_id,progress_percent,status,section_id,scroll_position,favorite,last_opened_at,client_updated_at,updated_at,completed_at');
    if(response.error)throw response.error;if(revision!==sessionRevision)return;
    const merged=stateFromRows(response.data,cached);app.setState(merged.state,cacheKey);
    merged.localNewer.forEach(index=>pendingCourses.add(index));
    const guest=app.loadState(app.guestStorageKey),decisionKey=IMPORT_PREFIX+currentUser.id;
    if(hasGuestProgress(guest)&&!localStorage.getItem(decisionKey)){
      const accepted=await askImport();localStorage.setItem(decisionKey,accepted?'yes':'no');
      if(accepted){const imported=mergeGuestIntoState(guest,app.getState());app.setState(imported.state,cacheKey);imported.changed.forEach(index=>pendingCourses.add(index));}
    }
    updateAccountUi();setSyncStatus(navigator.onLine?'Szinkronizálva':'Offline – később szinkronizáljuk',navigator.onLine?'ok':'offline');
    if(pendingCourses.size)scheduleSync(100);
    if(event==='PASSWORD_RECOVERY'){showAuthPanel('password');openDialog(authDialog,'#newPassword');}
  }catch(error){
    console.warn('Cloud session setup failed',error);setSyncStatus(friendlyError(error,'sync'),'error');updateAccountUi();
  }
}

function rowFromState(index){
  const course=app.courses[index],state=app.getState(),item=app.getCourseState(index);
  const completed=Boolean(item.completed),visited=Boolean(item.visited)||completed;
  const updated=Number(item.updatedAt)||Date.now();
  return {
    user_id:currentUser.id,course_id:Number(course.id),progress_percent:completed?100:Math.max(0,Math.min(100,Number(item.maxRead)||0)),
    status:completed?'completed':(visited?'in_progress':'not_started'),section_id:item.sectionId||null,
    scroll_position:Math.max(0,Math.round(Number(item.scrollPosition)||0)),favorite:state.favorites.includes(Number(course.id)),
    last_opened_at:item.lastOpened?new Date(item.lastOpened).toISOString():null,client_updated_at:new Date(updated).toISOString(),
    completed_at:completed?new Date(Number(item.completedAt)||updated).toISOString():null
  };
}
function applyRemoteRow(row,index){
  const state=app.getState(),key=String(row.course_id),existing=state.courses?.[key];
  state.courses[key]={visited:row.status!=='not_started',maxRead:Number(row.progress_percent)||0,lastRead:Number(row.progress_percent)||0,
    completed:row.status==='completed',lastOpened:Date.parse(row.last_opened_at)||0,sectionId:row.section_id||null,
    scrollPosition:Number(row.scroll_position)||0,updatedAt:Date.parse(row.client_updated_at||row.updated_at)||0,
    completedAt:Date.parse(row.completed_at)||null,drafts:existing?.drafts||{}};
  state.favorites=state.favorites.filter(id=>Number(id)!==Number(row.course_id));if(row.favorite)state.favorites.push(Number(row.course_id));
  app.save(true);app.refresh();
}
async function syncOne(index,userId){
  if(!currentUser||currentUser.id!==userId)return;
  const local=rowFromState(index);
  const found=await client.from('course_progress').select('course_id,progress_percent,status,section_id,scroll_position,favorite,last_opened_at,client_updated_at,updated_at,completed_at').eq('course_id',local.course_id).maybeSingle();
  if(found.error)throw found.error;
  const remoteTime=Date.parse(found.data?.client_updated_at||found.data?.updated_at)||0;
  const localTime=Date.parse(local.client_updated_at)||0;
  if(found.data&&remoteTime>localTime){applyRemoteRow(found.data,index);return;}
  const saved=await client.from('course_progress').upsert(local,{onConflict:'user_id,course_id'});
  if(saved.error){
    if(String(saved.error.message||'').includes('stale_progress_update')){
      const newest=await client.from('course_progress').select('course_id,progress_percent,status,section_id,scroll_position,favorite,last_opened_at,client_updated_at,updated_at,completed_at').eq('course_id',local.course_id).single();
      if(!newest.error)applyRemoteRow(newest.data,index);return;
    }
    throw saved.error;
  }
}
async function flushPending(){
  if(syncing||!currentUser||!client)return;
  if(!navigator.onLine){setSyncStatus('Offline – később szinkronizáljuk','offline');return;}
  syncing=true;clearTimeout(syncTimer);setSyncStatus('Szinkronizálás…','syncing');
  const userId=currentUser.id;
  try{
    while(pendingCourses.size&&currentUser?.id===userId){const index=pendingCourses.values().next().value;pendingCourses.delete(index);await syncOne(index,userId);}
    if(currentUser?.id===userId)setSyncStatus('Szinkronizálva','ok');
  }catch(error){
    console.warn('Cloud progress sync failed',error);setSyncStatus(friendlyError(error,'sync'),navigator.onLine?'error':'offline');
  }finally{syncing=false;if(pendingCourses.size&&navigator.onLine)scheduleSync(3000);}
}
function scheduleSync(delay=1300){clearTimeout(syncTimer);syncTimer=setTimeout(flushPending,delay);}
function queueCourse(index){
  if(!currentUser||!Number.isInteger(index))return;
  pendingCourses.add(index);setSyncStatus(navigator.onLine?'Szinkronizálás…':'Offline – később szinkronizáljuk',navigator.onLine?'syncing':'offline');scheduleSync();
}

async function deleteAllLearningData(){
  if(!currentUser)return;
  if(!confirm('Biztosan törlöd a fiókod teljes tanulási haladását, kedvenceit és befejezett jelöléseit? Ez nem vonható vissza.'))return;
  setMessage('userMessage','Törlés folyamatban…');
  const result=await client.from('course_progress').delete().eq('user_id',currentUser.id);
  if(result.error){setMessage('userMessage',friendlyError(result.error,'sync'),'error');return;}
  pendingCourses.clear();const key=app.cloudCachePrefix+currentUser.id;try{localStorage.removeItem(key);}catch(_){}
  app.setState(app.emptyState(),key);setMessage('userMessage','A tanulási adatok törlése sikerült.','success');setSyncStatus('Szinkronizálva','ok');
}

byId('loginForm')?.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!client){setMessage('loginMessage','A felhőszolgáltatás most nem érhető el. Vendégként továbbra is használhatod az alkalmazást.','error');return;}
  setBusy(form,true);setMessage('loginMessage','Belépés…');
  try{const data=new FormData(form),result=await client.auth.signInWithPassword({email:String(data.get('email')).trim(),password:String(data.get('password'))});if(result.error)throw result.error;closeDialog(authDialog);form.reset();}
  catch(error){setMessage('loginMessage',friendlyError(error,'login'),'error');}finally{setBusy(form,false);}
});
byId('registerForm')?.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!client){setMessage('registerMessage','A felhőszolgáltatás most nem érhető el.','error');return;}
  const data=new FormData(form),name=String(data.get('display_name')).trim(),email=String(data.get('email')).trim(),password=String(data.get('password'));
  if(!name||name.length>80){setMessage('registerMessage','Adj meg egy legfeljebb 80 karakteres megjelenített nevet.','error');return;}
  setBusy(form,true);setMessage('registerMessage','Fiók létrehozása…');
  try{const result=await client.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:location.origin+location.pathname}});if(result.error)throw result.error;if(result.data.session){closeDialog(authDialog);form.reset();}else{setMessage('registerMessage','A megerősítő levelet elküldtük. A belépés előtt nyisd meg a levélben található hivatkozást.','success');}}
  catch(error){setMessage('registerMessage',friendlyError(error,'register'),'error');}finally{setBusy(form,false);}
});
byId('resetForm')?.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!client){setMessage('resetMessage','A felhőszolgáltatás most nem érhető el.','error');return;}
  setBusy(form,true);setMessage('resetMessage','Kérés küldése…');
  try{const email=String(new FormData(form).get('email')).trim(),result=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname+'#reset-password'});if(result.error)throw result.error;setMessage('resetMessage','Ha a címhez tartozik fiók, elküldtük a jelszó-visszaállító levelet.','success');}
  catch(error){setMessage('resetMessage',friendlyError(error,'reset'),'error');}finally{setBusy(form,false);}
});
byId('passwordForm')?.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;setBusy(form,true);setMessage('passwordMessage','Mentés…');
  try{const password=String(new FormData(form).get('password')),result=await client.auth.updateUser({password});if(result.error)throw result.error;setMessage('passwordMessage','Az új jelszó mentése sikerült.','success');setTimeout(()=>closeDialog(authDialog),900);}
  catch(error){setMessage('passwordMessage',friendlyError(error,'password'),'error');}finally{setBusy(form,false);}
});
byId('logoutButton')?.addEventListener('click',async()=>{
  if(!client||!currentUser)return;setMessage('userMessage','Kijelentkezés…');await flushPending();const oldId=currentUser.id;const result=await client.auth.signOut();
  if(result.error){setMessage('userMessage',friendlyError(result.error,'session'),'error');return;}
  try{localStorage.removeItem(app.cloudCachePrefix+oldId);}catch(_){}closeDialog(userDialog);
});
byId('deleteLearningData')?.addEventListener('click',deleteAllLearningData);
byId('showProgress')?.addEventListener('click',()=>{closeDialog(userDialog);app.showHome();setTimeout(app.scrollToProgress,80);});
byId('showFavorites')?.addEventListener('click',()=>{closeDialog(userDialog);app.showHome();app.setFilter('favorites');});

window.addEventListener('online',()=>{if(currentUser){setSyncStatus('Szinkronizálás…','syncing');scheduleSync(50);}});
window.addEventListener('offline',()=>{if(currentUser)setSyncStatus('Offline – később szinkronizáljuk','offline');});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&pendingCourses.size)flushPending();});

window.TEM_CLOUD={queueCourse,isAuthenticated:()=>Boolean(currentUser),deleteAll:deleteAllLearningData,flush:flushPending};
updateAccountUi();setSyncStatus('Felhőkapcsolat ellenőrzése…','syncing');

(async function init(){
  try{
    const [config]=await Promise.all([loadConfig(),loadSdk()]);
    client=window.supabase.createClient(config.supabaseUrl,config.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'tem-web-1.2-auth'}});
    client.auth.onAuthStateChange((event,session)=>setTimeout(()=>applySession(session,event),0));
    const result=await client.auth.getSession();if(result.error)throw result.error;await applySession(result.data.session,'INITIAL_SESSION');
  }catch(error){console.warn('Cloud services unavailable; guest mode remains active',error);currentUser=null;currentProfile=null;updateAccountUi();setSyncStatus('Vendégmód · felhő nem elérhető','error');}
})();

})();
