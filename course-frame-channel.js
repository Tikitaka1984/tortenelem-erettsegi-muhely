(function(){
'use strict';
const NS='tem-course-frame',VERSION=1;
const CHILD_TYPES=new Set(['ready','progress','draft-change','context-response','frame-status']);
const frame=document.getElementById('courseFrame');
let channelId=null,courseId=null,ready=false,initData=null,contextSequence=0;
const pendingContexts=new Map(),listeners=new Map();
function emit(type,payload){(listeners.get(type)||[]).forEach(fn=>fn(payload));}
function validBase(data){return data&&typeof data==='object'&&data.ns===NS&&data.version===VERSION&&CHILD_TYPES.has(data.type);}
function send(type,payload={}){
  if(!ready||!frame.contentWindow||!channelId||courseId==null)return false;
  frame.contentWindow.postMessage({ns:NS,version:VERSION,type,channelId,courseId,...payload},'*');return true;
}
function initialize(){
  if(!frame.contentWindow||!channelId||courseId==null)return;
  frame.contentWindow.postMessage({ns:NS,version:VERSION,type:'init',channelId,courseId,...initData},'*');
}
window.addEventListener('message',event=>{
  if(event.source!==frame.contentWindow||!validBase(event.data))return;
  const data=event.data;
  if(data.type==='ready'){ready=true;initialize();return;}
  if(!ready||data.channelId!==channelId||Number(data.courseId)!==Number(courseId))return;
  if(data.type==='context-response'){
    const pending=pendingContexts.get(data.requestId);
    if(pending){pendingContexts.delete(data.requestId);pending.resolve(data.context||null);}
    return;
  }
  emit(data.type,data);
});
function loadCourseFrame(course,options={}){
  pendingContexts.forEach(item=>item.resolve(null));pendingContexts.clear();
  channelId=crypto.randomUUID();courseId=Number(course.id);ready=false;
  initData={theme:options.theme||'dark',unifiedTheme:options.unifiedTheme!==false,restore:options.restore||{}};
  frame.src='courses/'+course.source;
}
function requestCourseContext(timeoutMs=1200){
  if(!ready)return Promise.resolve(null);
  const requestId=String(++contextSequence),requestedCourseId=courseId,requestedChannelId=channelId;
  return new Promise(resolve=>{
    const timer=setTimeout(()=>{pendingContexts.delete(requestId);resolve(null);},timeoutMs);
    pendingContexts.set(requestId,{courseId:requestedCourseId,channelId:requestedChannelId,resolve:value=>{clearTimeout(timer);resolve(value?{...value,courseId:requestedCourseId}:null);}});
    if(!send('request-context',{requestId})){clearTimeout(timer);pendingContexts.delete(requestId);resolve(null);}
  });
}
function flushCourseProgress(){return requestCourseContext(350);}

window.TEM_COURSE_FRAME={
  loadCourseFrame,
  setCourseTheme:(theme,unifiedTheme)=>send('theme',{theme,unifiedTheme:Boolean(unifiedTheme)}),
  restoreCourseLocation:restore=>send('restore',{restore}),
  restoreCourseDrafts:drafts=>send('restore',{restore:{drafts}}),
  requestCourseContext,
  flushCourseProgress,
  on(type,handler){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(handler);return()=>{listeners.set(type,(listeners.get(type)||[]).filter(fn=>fn!==handler));};}
};
})();
