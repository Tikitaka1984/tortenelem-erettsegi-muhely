(function bootAnnotations(){
'use strict';

if(!window.TEM_APP){window.addEventListener('tem-app-ready',bootAnnotations,{once:true});return;}

const app=window.TEM_APP;
const byId=id=>document.getElementById(id);
const TYPE_LABELS={bookmark:'Könyvjelző',note:'Jegyzet',review:'Ismételd át'};
const CACHE_PREFIX='tortenelem-erettsegi-muhely-annotations-v1:';
const MAX_NOTE_LENGTH=2000;
const frame=byId('courseFrame');

let client=null;
let currentUser=null;
let annotations=[];
let loading=false;
let loadRevision=0;
let materialsFilter='all';
let materialsQuery='';
let materialsSort='recent';
let editingNote=null;
let deleteTarget=null;
let pendingRestore=null;
let frameCleanup=null;
let toolbarTimer=null;
let restoreFocus=null;

function normalizeText(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
}
function clip(value,max){return String(value||'').replace(/\s+/g,' ').trim().slice(0,max);}
function cacheKey(userId){return CACHE_PREFIX+userId;}
function courseIndex(courseId){return app.courses.findIndex(course=>Number(course.id)===Number(courseId));}
function courseLabel(courseId){return app.courses[courseIndex(courseId)]?.label||('Kurzus '+courseId);}
function annotationTime(item){return Date.parse(item.updated_at||item.client_updated_at||item.created_at)||0;}
function formatDate(item){
  const timestamp=annotationTime(item);if(!timestamp)return 'Ismeretlen időpont';
  return new Intl.DateTimeFormat('hu-HU',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(timestamp);
}
function normalizeRow(row){
  return {
    id:String(row.id),user_id:String(row.user_id||''),course_id:Number(row.course_id),annotation_type:String(row.annotation_type),
    section_id:row.section_id?String(row.section_id):null,scroll_position:Math.max(0,Number(row.scroll_position)||0),
    anchor_key:clip(row.anchor_key,300),anchor_text:clip(row.anchor_text,500),note_text:row.note_text==null?null:String(row.note_text).slice(0,MAX_NOTE_LENGTH),
    client_updated_at:row.client_updated_at||row.updated_at||row.created_at,created_at:row.created_at,updated_at:row.updated_at
  };
}
function loadCache(userId){
  try{
    const parsed=JSON.parse(localStorage.getItem(cacheKey(userId))||'[]');
    return Array.isArray(parsed)?parsed.map(normalizeRow).filter(validAnnotation):[];
  }catch(_){return [];}
}
function saveCache(){
  if(!currentUser)return;
  try{localStorage.setItem(cacheKey(currentUser.id),JSON.stringify(annotations));}catch(_){}
}
function clearCache(userId){try{localStorage.removeItem(cacheKey(userId));}catch(_){} }
function validAnnotation(item){
  return item&&Number.isInteger(item.course_id)&&item.course_id>=1&&item.course_id<=32&&Object.hasOwn(TYPE_LABELS,item.annotation_type)&&item.anchor_key;
}
function setStatus(message,state='ok'){
  const status=byId('annotationStatus');if(status){status.textContent=message||'';status.dataset.state=state;}
  const noteStatus=byId('annotationNoteStatus');if(noteStatus&&state==='error'){noteStatus.textContent=message||'';noteStatus.dataset.state=state;}
}
function friendlyError(error){
  const value=String(error?.message||error||'').toLowerCase();
  if(!navigator.onLine||value.includes('fetch')||value.includes('network'))return 'A felhő most nem érhető el. A személyes elem nem lett elmentve; próbáld újra internetkapcsolattal.';
  if(value.includes('stale_annotation_update'))return 'A jegyzetet egy másik eszközön időközben módosították. Frissítettük a legújabb változatra.';
  if(value.includes('row-level security')||value.includes('42501')||value.includes('403'))return 'Ehhez a személyes elemhez nincs jogosultságod.';
  return 'A művelet most nem sikerült. Próbáld meg később.';
}

function currentContext(){
  const index=app.getCurrentIndex?.();
  const course=app.courses[index];
  if(!course)return null;
  let sectionId=null,anchorText=course.label,scrollPosition=0;
  try{
    const win=frame.contentWindow,doc=frame.contentDocument;
    if(win&&doc){
      scrollPosition=Math.max(0,Math.round(win.scrollY));
      const candidates=[...doc.querySelectorAll('h1,h2,h3,h4,[data-section-id],section[id],article[id]')];
      let active=null,best=-Infinity;
      candidates.forEach(node=>{
        const rect=node.getBoundingClientRect();
        if(rect.top<=Math.max(130,win.innerHeight*.38)&&rect.top>best){active=node;best=rect.top;}
      });
      if(active){
        const container=active.closest('section[id],article[id],[data-section-id]');
        sectionId=clip(active.id||active.getAttribute('data-section-id')||container?.id||container?.getAttribute('data-section-id')||'',200)||null;
        const heading=/^H[1-4]$/.test(active.tagName)?active:active.querySelector('h1,h2,h3,h4');
        anchorText=clip(heading?.textContent||active.getAttribute('aria-label')||active.textContent||course.label,500)||course.label;
      }
    }
  }catch(_){}
  const normalized=normalizeText(anchorText).slice(0,240);
  const anchorKey=sectionId?'section:'+sectionId:(normalized?'text:'+normalized:'scroll:'+Math.round(scrollPosition/250)*250);
  return {course_id:Number(course.id),section_id:sectionId,scroll_position:scrollPosition,anchor_key:anchorKey,anchor_text:anchorText};
}
function itemAt(type,context=currentContext()){
  if(!context)return null;
  return annotations.find(item=>item.annotation_type===type&&item.course_id===context.course_id&&item.anchor_key===context.anchor_key)||null;
}

function updateToolbar(){
  const toolbar=byId('annotationToolbar');if(!toolbar)return;
  toolbar.dataset.authenticated=currentUser?'true':'false';
  const context=currentContext();
  const bookmark=itemAt('bookmark',context),note=itemAt('note',context),review=itemAt('review',context);
  setToolbarButton('annotationBookmark',bookmark?'Könyvjelzőzve':'Könyvjelző',Boolean(bookmark));
  setToolbarButton('annotationNote',note?'Jegyzet szerkesztése':'Jegyzet',Boolean(note));
  setToolbarButton('annotationReview',review?'Ismétlendő':'Ezt ismételd át',Boolean(review));
  if(!currentUser)setStatus('A személyes tanulási eszközökhöz jelentkezz be.','guest');
  else if(!loading&&navigator.onLine)setStatus('Személyes elemek szinkronizálva.','ok');
}
function setToolbarButton(id,label,active){
  const button=byId(id);if(!button)return;
  button.setAttribute('aria-pressed',active?'true':'false');
  button.classList.toggle('active',active);
  const text=button.querySelector('.annotation-tool__label');if(text)text.textContent=label;
  button.setAttribute('aria-label',label);
}

function annotationPayload(type,context,noteText=null){
  const now=new Date().toISOString();
  return {
    user_id:currentUser.id,course_id:context.course_id,annotation_type:type,section_id:context.section_id,
    scroll_position:context.scroll_position,anchor_key:context.anchor_key,anchor_text:context.anchor_text,
    note_text:type==='note'?noteText:null,client_updated_at:now
  };
}
function requireCloud(){
  if(!currentUser||!client){setStatus('A személyes tanulási eszközökhöz jelentkezz be.','guest');window.TEM_CLOUD?.openAuth?.();return false;}
  if(!navigator.onLine){setStatus('Offline módban a meglévő személyes elemek olvashatók, de új mentéshez internetkapcsolat szükséges.','error');return false;}
  return true;
}
async function createToggle(type){
  if(!requireCloud())return;
  const context=currentContext();if(!context)return;
  const existing=itemAt(type,context);
  if(existing){openDeleteDialog(existing);return;}
  setStatus('Mentés…','syncing');
  try{
    const result=await client.from('student_annotations').upsert(annotationPayload(type,context),{onConflict:'user_id,course_id,annotation_type,anchor_key'}).select().single();
    if(result.error)throw result.error;
    replaceAnnotation(normalizeRow(result.data));
    setStatus(type==='bookmark'?'Könyvjelző elmentve.':'A rész ismétlendőként elmentve.','success');
  }catch(error){setStatus(friendlyError(error),'error');}
}
function replaceAnnotation(item){
  const index=annotations.findIndex(existing=>existing.id===item.id||(
    existing.course_id===item.course_id&&existing.annotation_type===item.annotation_type&&existing.anchor_key===item.anchor_key
  ));
  if(index>=0)annotations.splice(index,1,item);else annotations.unshift(item);
  annotations.sort((a,b)=>annotationTime(b)-annotationTime(a));saveCache();renderAll();
}

function openNoteDialog(item=null){
  if(!requireCloud())return;
  const context=item?{
    course_id:item.course_id,section_id:item.section_id,scroll_position:item.scroll_position,anchor_key:item.anchor_key,anchor_text:item.anchor_text
  }:currentContext();
  if(!context)return;
  const existing=item||itemAt('note',context);
  editingNote={item:existing,context};
  restoreFocus=document.activeElement;
  byId('annotationNoteHeading').textContent=existing?'Jegyzet szerkesztése':'Új saját jegyzet';
  byId('annotationNoteContext').textContent=courseLabel(context.course_id)+' · '+(context.anchor_text||'Mentett kurzusrész');
  byId('annotationNoteText').value=existing?.note_text||'';
  byId('annotationNoteDelete').hidden=!existing;
  byId('annotationNoteStatus').textContent='';
  updateCounter();
  const dialog=byId('annotationNoteDialog');if(!dialog.open)dialog.showModal();
  requestAnimationFrame(()=>byId('annotationNoteText').focus());
}
function closeNoteDialog(){const dialog=byId('annotationNoteDialog');if(dialog.open)dialog.close();}
function updateCounter(){byId('annotationNoteCounter').textContent=byId('annotationNoteText').value.length+' / '+MAX_NOTE_LENGTH;}
async function saveNote(){
  if(!editingNote||!requireCloud())return;
  const text=byId('annotationNoteText').value.trim();
  if(!text){byId('annotationNoteStatus').textContent='A jegyzet nem lehet üres.';byId('annotationNoteStatus').dataset.state='error';return;}
  if(text.length>MAX_NOTE_LENGTH){byId('annotationNoteStatus').textContent='A jegyzet legfeljebb '+MAX_NOTE_LENGTH+' karakter lehet.';byId('annotationNoteStatus').dataset.state='error';return;}
  const button=byId('annotationNoteSave');button.disabled=true;byId('annotationNoteStatus').textContent='Mentés…';byId('annotationNoteStatus').dataset.state='syncing';
  try{
    let result;
    if(editingNote.item){
      const payload=annotationPayload('note',editingNote.context,text);
      result=await client.from('student_annotations').update(payload).eq('id',editingNote.item.id).eq('client_updated_at',editingNote.item.client_updated_at).select().maybeSingle();
      if(result.error)throw result.error;
      if(!result.data){await refresh();throw new Error('stale_annotation_update');}
    }else{
      result=await client.from('student_annotations').upsert(annotationPayload('note',editingNote.context,text),{onConflict:'user_id,course_id,annotation_type,anchor_key'}).select().single();
      if(result.error)throw result.error;
    }
    replaceAnnotation(normalizeRow(result.data));
    byId('annotationNoteStatus').textContent='Mentve';byId('annotationNoteStatus').dataset.state='success';
    setTimeout(()=>closeNoteDialog(),450);
  }catch(error){byId('annotationNoteStatus').textContent=friendlyError(error);byId('annotationNoteStatus').dataset.state='error';}
  finally{button.disabled=false;}
}

function openDeleteDialog(item){
  if(!item)return;deleteTarget=item;restoreFocus=document.activeElement;
  const type=TYPE_LABELS[item.annotation_type]||'Személyes elem';
  byId('annotationDeleteHeading').textContent=type+' törlése';
  byId('annotationDeleteText').textContent=item.annotation_type==='note'?'Biztosan törlöd ezt a saját jegyzetet? A művelet nem vonható vissza.':'Biztosan eltávolítod ezt a személyes jelölést?';
  byId('annotationDeleteStatus').textContent='';
  const dialog=byId('annotationDeleteDialog');if(!dialog.open)dialog.showModal();
  requestAnimationFrame(()=>byId('annotationDeleteCancel').focus());
}
async function confirmDelete(){
  if(!deleteTarget||!requireCloud())return;
  const item=deleteTarget,button=byId('annotationDeleteConfirm');button.disabled=true;
  byId('annotationDeleteStatus').textContent='Törlés…';byId('annotationDeleteStatus').dataset.state='syncing';
  try{
    const result=await client.from('student_annotations').delete().eq('id',item.id).eq('user_id',currentUser.id);
    if(result.error)throw result.error;
    annotations=annotations.filter(existing=>existing.id!==item.id);saveCache();renderAll();
    byId('annotationDeleteDialog').close();if(byId('annotationNoteDialog').open)closeNoteDialog();
    setStatus('A személyes elem törölve.','success');
  }catch(error){byId('annotationDeleteStatus').textContent=friendlyError(error);byId('annotationDeleteStatus').dataset.state='error';}
  finally{button.disabled=false;deleteTarget=null;}
}

async function refresh(){
  if(!currentUser||!client)return;
  const revision=++loadRevision,userId=currentUser.id;loading=true;updateToolbar();
  if(!navigator.onLine){loading=false;renderAll();setStatus('Offline – a legutóbb szinkronizált személyes elemek láthatók.','offline');return;}
  try{
    const result=await client.from('student_annotations').select('id,user_id,course_id,annotation_type,section_id,scroll_position,anchor_key,anchor_text,note_text,client_updated_at,created_at,updated_at').order('updated_at',{ascending:false});
    if(result.error)throw result.error;
    if(revision!==loadRevision||currentUser?.id!==userId)return;
    annotations=(result.data||[]).map(normalizeRow).filter(validAnnotation);saveCache();setStatus('Személyes elemek szinkronizálva.','ok');
  }catch(error){if(revision===loadRevision)setStatus(friendlyError(error),'error');}
  finally{if(revision===loadRevision){loading=false;renderAll();}}
}

async function setSession(context){
  const previousId=currentUser?.id;loadRevision++;
  client=context?.client||null;currentUser=context?.user||null;
  if(!currentUser){if(previousId)clearCache(previousId);annotations=[];loading=false;editingNote=null;deleteTarget=null;pendingRestore=null;renderAll();return;}
  annotations=loadCache(currentUser.id);loading=true;renderAll();
  await refresh();
}

function renderAll(){renderDashboardSummary();renderMaterials();updateToolbar();}
function renderDashboardSummary(){
  const section=byId('materialsSummary');if(!section)return;
  section.hidden=!currentUser;
  byId('materialBookmarkCount').textContent=String(annotations.filter(item=>item.annotation_type==='bookmark').length);
  byId('materialNoteCount').textContent=String(annotations.filter(item=>item.annotation_type==='note').length);
  byId('materialReviewCount').textContent=String(annotations.filter(item=>item.annotation_type==='review').length);
  const list=byId('materialsLatest');list.replaceChildren();
  const latest=[...annotations].sort((a,b)=>annotationTime(b)-annotationTime(a)).slice(0,5);
  if(!latest.length){const empty=document.createElement('li');empty.className='personal-empty';empty.textContent='Még nincs saját tanulási anyagod. Egy kurzus olvasása közben hozhatsz létre könyvjelzőt, jegyzetet vagy ismétlendő jelölést.';list.appendChild(empty);return;}
  latest.forEach(item=>{
    const li=document.createElement('li'),button=document.createElement('button'),copy=document.createElement('span'),meta=document.createElement('small');
    button.type='button';button.className='material-latest';button.setAttribute('aria-label',(TYPE_LABELS[item.annotation_type]||'Személyes elem')+': '+courseLabel(item.course_id)+' megnyitása');
    copy.textContent=(TYPE_LABELS[item.annotation_type]||'Személyes elem')+' · '+courseLabel(item.course_id);
    meta.textContent=item.annotation_type==='note'?clip(item.note_text,90):(item.anchor_text||'Mentett kurzusrész');
    button.append(copy,meta);button.addEventListener('click',()=>openAnnotation(item));li.appendChild(button);list.appendChild(li);
  });
}

function renderMaterials(){
  const view=byId('materialsView');if(!view)return;
  document.querySelectorAll('[data-material-filter]').forEach(button=>{
    const active=button.dataset.materialFilter===materialsFilter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active?'true':'false');
  });
  const list=byId('materialsList');list.replaceChildren();
  let rows=annotations.filter(item=>materialsFilter==='all'||item.annotation_type===materialsFilter);
  if(materialsQuery){rows=rows.filter(item=>normalizeText(courseLabel(item.course_id)+' '+item.anchor_text+' '+(item.note_text||'')).includes(materialsQuery));}
  rows=[...rows].sort((a,b)=>{
    if(materialsSort==='oldest')return annotationTime(a)-annotationTime(b);
    if(materialsSort==='course')return a.course_id-b.course_id||annotationTime(b)-annotationTime(a);
    return annotationTime(b)-annotationTime(a);
  });
  rows.forEach(item=>list.appendChild(createMaterialCard(item)));
  const empty=byId('materialsEmpty');empty.hidden=rows.length>0;
  if(!rows.length){
    if(materialsQuery)empty.textContent='Nincs a keresésnek megfelelő személyes elem.';
    else if(materialsFilter==='bookmark')empty.textContent='Még nincs könyvjelződ. Egy kurzus olvasása közben a Könyvjelző gombbal elmentheted a fontos részeket.';
    else if(materialsFilter==='note')empty.textContent='Még nincs saját jegyzeted. A kurzuseszköztár Jegyzet gombjával rögzítheted a gondolataidat.';
    else if(materialsFilter==='review')empty.textContent='Még nincs ismétlendő részed. Az „Ezt ismételd át” gombbal jelölheted meg, amit később újra átnéznél.';
    else empty.textContent='Még nincs saját tanulási anyagod. Nyiss meg egy kurzust az első jelölés létrehozásához.';
  }
  byId('materialsResultCount').textContent=rows.length+' elem';
}
function createMaterialCard(item){
  const card=document.createElement('article');card.className='material-card';
  const head=document.createElement('div');head.className='material-card__head';
  const badge=document.createElement('span');badge.className='material-type '+item.annotation_type;badge.textContent=TYPE_LABELS[item.annotation_type]||item.annotation_type;
  const date=document.createElement('time');date.dateTime=item.updated_at||item.created_at||'';date.textContent=formatDate(item);head.append(badge,date);
  const title=document.createElement('h4');title.textContent=courseLabel(item.course_id);
  const anchor=document.createElement('p');anchor.className='material-anchor';anchor.textContent=item.anchor_text||'Mentett kurzusrész';
  card.append(head,title,anchor);
  if(item.annotation_type==='note'){
    const note=document.createElement('p');note.className='material-note-preview';note.textContent=item.note_text||'';card.appendChild(note);
  }
  const actions=document.createElement('div');actions.className='material-card__actions';
  const open=document.createElement('button');open.type='button';open.textContent='Megnyitás';open.addEventListener('click',()=>openAnnotation(item));actions.appendChild(open);
  if(item.annotation_type==='note'){
    const edit=document.createElement('button');edit.type='button';edit.textContent='Szerkesztés';edit.addEventListener('click',()=>openNoteDialog(item));actions.appendChild(edit);
  }
  const remove=document.createElement('button');remove.type='button';remove.className='danger';remove.textContent='Törlés';remove.addEventListener('click',()=>openDeleteDialog(item));actions.appendChild(remove);
  card.appendChild(actions);return card;
}

function openAnnotation(item){
  const index=courseIndex(item.course_id);if(index<0)return;
  pendingRestore={...item};app.showCourse?.(index);setStatus('A mentett kurzusrész megnyitása…','syncing');
}
function restoreAnnotation(){
  if(!pendingRestore||Number(app.courses[app.getCurrentIndex?.()]?.id)!==Number(pendingRestore.course_id))return;
  const targetItem=pendingRestore;pendingRestore=null;
  try{
    const win=frame.contentWindow,doc=frame.contentDocument;if(!win||!doc)return;
    let target=targetItem.section_id?(doc.getElementById(targetItem.section_id)||doc.querySelector('[data-section-id="'+CSS.escape(targetItem.section_id)+'"]')):null;
    if(!target&&targetItem.anchor_text){
      const wanted=normalizeText(targetItem.anchor_text);
      target=[...doc.querySelectorAll('h1,h2,h3,h4')].find(node=>normalizeText(node.textContent)===wanted||normalizeText(node.textContent).includes(wanted))||null;
    }
    if(target){
      const top=target.getBoundingClientRect().top+win.scrollY-82;win.scrollTo(0,Math.max(0,top));
      if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
    }else win.scrollTo(0,Math.max(0,Number(targetItem.scroll_position)||0));
    setStatus('A mentett kurzusrész megnyílt.','success');
  }catch(_){setStatus('A kurzus megnyílt; a mentett pozíció csak közelítőleg állítható vissza.','warning');}
}
function bindFrame(){
  if(frameCleanup){frameCleanup();frameCleanup=null;}
  try{
    const win=frame.contentWindow;if(!win)return;
    const update=()=>{clearTimeout(toolbarTimer);toolbarTimer=setTimeout(updateToolbar,150);};
    win.addEventListener('scroll',update,{passive:true});frameCleanup=()=>win.removeEventListener('scroll',update);
    setTimeout(updateToolbar,100);setTimeout(restoreAnnotation,650);
  }catch(_){}
}

function showMaterials(){if(!currentUser){window.TEM_CLOUD?.openAuth?.();return;}app.showMaterialsView?.();renderMaterials();}
function closeAndRestore(dialog){if(dialog.open)dialog.close();}
function trapFocus(dialog,event){
  if(event.key!=='Tab')return;
  const focusable=[...dialog.querySelectorAll('button:not([disabled]),textarea,input,select,[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden);
  if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}
function setupDialog(dialog){
  dialog.addEventListener('keydown',event=>trapFocus(dialog,event));
  dialog.addEventListener('close',()=>{const target=restoreFocus;restoreFocus=null;if(target&&document.contains(target))requestAnimationFrame(()=>target.focus());});
}

byId('annotationBookmark')?.addEventListener('click',()=>createToggle('bookmark'));
byId('annotationNote')?.addEventListener('click',()=>openNoteDialog());
byId('annotationReview')?.addEventListener('click',()=>createToggle('review'));
byId('annotationNoteText')?.addEventListener('input',updateCounter);
byId('annotationNoteSave')?.addEventListener('click',saveNote);
byId('annotationNoteCancel')?.addEventListener('click',closeNoteDialog);
byId('annotationNoteDelete')?.addEventListener('click',()=>editingNote?.item&&openDeleteDialog(editingNote.item));
byId('annotationDeleteCancel')?.addEventListener('click',()=>closeAndRestore(byId('annotationDeleteDialog')));
byId('annotationDeleteConfirm')?.addEventListener('click',confirmDelete);
byId('showMaterialsDashboard')?.addEventListener('click',showMaterials);
byId('materialsBack')?.addEventListener('click',app.showHome);
byId('materialsSearch')?.addEventListener('input',event=>{materialsQuery=normalizeText(event.target.value);renderMaterials();});
byId('materialsSort')?.addEventListener('change',event=>{materialsSort=event.target.value;renderMaterials();});
byId('materialsFilters')?.addEventListener('click',event=>{const button=event.target.closest('[data-material-filter]');if(!button)return;materialsFilter=button.dataset.materialFilter;renderMaterials();});
frame?.addEventListener('load',bindFrame);
[byId('annotationNoteDialog'),byId('annotationDeleteDialog')].filter(Boolean).forEach(setupDialog);
window.addEventListener('online',()=>currentUser&&refresh());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&currentUser)refresh();});

window.TEM_ANNOTATIONS={setSession,refresh,showMaterials,render:renderAll,clearForUser:userId=>{if(userId)clearCache(userId);annotations=[];renderAll();},getItems:()=>annotations.map(item=>({...item}))};
renderAll();

})();
