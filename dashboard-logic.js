(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TEM_DASHBOARD_LOGIC=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';

  function clampProgress(value,completed){
    if(completed)return 100;
    return Math.max(0,Math.min(100,Math.round(Number(value)||0)));
  }

  function activityTime(item){
    return Math.max(Number(item?.lastOpened)||0,Number(item?.updatedAt)||0,Number(item?.completedAt)||0);
  }

  function normalizedCourseId(value){
    const id=Number(value);
    return Number.isFinite(id)?id:null;
  }

  function courseIndexById(courses,courseId){
    const id=normalizedCourseId(courseId);
    if(id===null)return -1;
    return (Array.isArray(courses)?courses:[]).findIndex(course=>Number(course?.id)===id);
  }

  function courseIdAtIndex(courses,index){
    if(!Number.isInteger(index)||index<0||index>=(Array.isArray(courses)?courses.length:0))return null;
    return normalizedCourseId(courses[index]?.id);
  }

  function normalizeState(saved,courses){
    const source=saved&&typeof saved==='object'?saved:{};
    const version=Number(source.version);
    const legacy=!Number.isFinite(version)||version<=3;
    const candidate=legacy&&Number.isInteger(source.lastCourse)
      ?courseIdAtIndex(courses,source.lastCourse)
      :normalizedCourseId(source.lastCourseId);
    const lastCourseId=courseIndexById(courses,candidate)>=0?candidate:null;
    return {
      version:4,
      lastCourseId,
      favorites:Array.isArray(source.favorites)?source.favorites.map(Number).filter(Number.isFinite):[],
      favoriteUpdatedAt:source.favoriteUpdatedAt&&typeof source.favoriteUpdatedAt==='object'?source.favoriteUpdatedAt:{},
      courses:source.courses&&typeof source.courses==='object'?source.courses:{}
    };
  }

  function courseIdFromHash(hash,courses){
    const value=String(hash||'').replace(/^#/,'');
    const id=normalizedCourseId(value);
    return courseIndexById(courses,id)>=0?id:null;
  }

  function summarize(items,total){
    const normalized=Array.isArray(items)?items:[];
    const courseTotal=Number.isFinite(total)?Math.max(0,total):normalized.length;
    const completed=normalized.filter(item=>Boolean(item?.completed)).length;
    const inProgress=normalized.filter(item=>Boolean(item?.visited)&&!item?.completed).length;
    const notStarted=Math.max(0,courseTotal-completed-inProgress);
    const aggregate=Math.round(normalized.reduce((sum,item)=>sum+clampProgress(item?.progress,item?.completed),0)/Math.max(1,courseTotal));
    return {completed,inProgress,notStarted,aggregate};
  }

  function recommendation(items){
    const normalized=(Array.isArray(items)?items:[]).map((item,index)=>({...item,index:item?.index??index,courseId:normalizedCourseId(item?.courseId)}));
    const unfinished=normalized.filter(item=>item.visited&&!item.completed);
    if(unfinished.length){
      const latest=[...unfinished].sort((a,b)=>activityTime(b)-activityTime(a)||b.progress-a.progress||a.index-b.index)[0];
      if(activityTime(latest)>0)return {courseId:latest.courseId,reason:'recent'};
      const highest=[...unfinished].sort((a,b)=>b.progress-a.progress||a.index-b.index)[0];
      return {courseId:highest.courseId,reason:'progress'};
    }
    const next=normalized.find(item=>!item.completed);
    return next?{courseId:next.courseId,reason:'next'}:null;
  }

  function formatHungarianDate(timestamp,nowValue=Date.now()){
    if(!timestamp)return 'még nincs mentett aktivitás';
    const date=new Date(timestamp),now=new Date(nowValue);
    if(!Number.isFinite(date.getTime())||!Number.isFinite(now.getTime()))return 'ismeretlen időpont';
    const startToday=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
    const startDate=new Date(date.getFullYear(),date.getMonth(),date.getDate()).getTime();
    const time=new Intl.DateTimeFormat('hu-HU',{hour:'2-digit',minute:'2-digit'}).format(date);
    if(startDate===startToday)return 'Ma, '+time;
    if(startDate===startToday-86400000)return 'Tegnap, '+time;
    return new Intl.DateTimeFormat('hu-HU',{month:'long',day:'numeric'}).format(date);
  }

  return Object.freeze({activityTime,clampProgress,courseIndexById,courseIdAtIndex,normalizeState,courseIdFromHash,summarize,recommendation,formatHungarianDate});
});
