(function(){
'use strict';
const NS='tem-course-frame',VERSION=1,PARENT_TYPES=new Set(['init','theme','restore','request-context']);
let channelId=null,courseId=null,initialized=false,scrollTimer=null;
function post(type,payload={}){window.parent.postMessage({ns:NS,version:VERSION,type,channelId,courseId,...payload},'*');}
function activeContext(){
  const scrollPosition=Math.max(0,Math.round(window.scrollY));
  const candidates=[...document.querySelectorAll('h1,h2,h3,h4,[data-section-id],section[id],article[id]')];
  let active=null,best=-Infinity;
  candidates.forEach(node=>{const top=node.getBoundingClientRect().top;if(top<=Math.max(130,innerHeight*.38)&&top>best){active=node;best=top;}});
  const container=active?.closest('section[id],article[id],[data-section-id]');
  const sectionId=(active?.id||active?.getAttribute('data-section-id')||container?.id||container?.getAttribute('data-section-id')||'').slice(0,200)||null;
  const heading=active&&(/^H[1-4]$/.test(active.tagName)?active:active.querySelector('h1,h2,h3,h4'));
  const anchorText=String(heading?.textContent||active?.getAttribute('aria-label')||active?.textContent||document.title).replace(/\s+/g,' ').trim().slice(0,500);
  const normalized=anchorText.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim().slice(0,240);
  return {sectionId,scrollPosition,anchorText,anchorKey:sectionId?'section:'+sectionId:(normalized?'text:'+normalized:'scroll:'+Math.round(scrollPosition/250)*250)};
}
function drafts(){const result={};document.querySelectorAll('textarea').forEach((el,index)=>{const key=el.id||el.name||'textarea-'+index;if(el.value)result[key]=el.value;});return result;}
function snapshot(){
  const max=Math.max(0,document.documentElement.scrollHeight-innerHeight),context=activeContext();
  return {...context,lastRead:max?Math.max(0,Math.min(100,scrollY/max*100)):100,drafts:drafts()};
}
function applyTheme(theme,unified){
  const ensure=(id,href,on)=>{let link=document.getElementById(id);if(on&&!link){link=document.createElement('link');link.id=id;link.rel='stylesheet';link.href=href;document.head.appendChild(link);}else if(!on&&link)link.remove();};
  ensure('unified-design-system','../course-theme.css',unified);
  ensure('dark-course-theme','../course-theme-dark.css',unified&&theme==='dark');
}
function restore(value={}){
  const saved=value||{};
  document.querySelectorAll('textarea').forEach((el,index)=>{const key=el.id||el.name||'textarea-'+index;if(Object.hasOwn(saved.drafts||{},key)){el.value=saved.drafts[key];el.dispatchEvent(new Event('input',{bubbles:true}));}});
  const run=()=>{let target=null;if(saved.sectionId){target=document.getElementById(saved.sectionId);try{target=target||document.querySelector('[data-section-id="'+CSS.escape(saved.sectionId)+'"]');}catch(_){}}
    if(target)target.scrollIntoView({block:'start'});else scrollTo(0,Math.max(0,Number(saved.scrollPosition)||0));};
  requestAnimationFrame(()=>{run();setTimeout(run,130);setTimeout(run,500);});
}
window.addEventListener('message',event=>{
  if(event.source!==window.parent)return;
  const data=event.data;if(!data||typeof data!=='object'||data.ns!==NS||data.version!==VERSION||!PARENT_TYPES.has(data.type))return;
  if(data.type==='init'){
    if(initialized&&data.channelId!==channelId)return;
    if(typeof data.channelId!=='string'||!data.channelId||!Number.isInteger(Number(data.courseId)))return;
    channelId=data.channelId;courseId=Number(data.courseId);initialized=true;applyTheme(data.theme,data.unifiedTheme);restore(data.restore);post('frame-status',{status:'initialized'});return;
  }
  if(!initialized||data.channelId!==channelId||Number(data.courseId)!==courseId)return;
  if(data.type==='theme')applyTheme(data.theme,data.unifiedTheme);
  else if(data.type==='restore')restore(data.restore);
  else if(data.type==='request-context'){const context=snapshot();post('context-response',{requestId:data.requestId,context});if(data.requestId==='flush')post('progress',context);}
});
addEventListener('scroll',()=>{if(!initialized)return;clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>post('progress',snapshot()),140);},{passive:true});
document.addEventListener('input',event=>{if(initialized&&event.target instanceof HTMLTextAreaElement)post('draft-change',{drafts:drafts()});},true);
addEventListener('pagehide',()=>{if(initialized)post('progress',snapshot());});
window.parent.postMessage({ns:NS,version:VERSION,type:'ready'},'*');
})();
