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

  function summarize(items,total=33){
    const normalized=Array.isArray(items)?items:[];
    const completed=normalized.filter(item=>Boolean(item?.completed)).length;
    const inProgress=normalized.filter(item=>Boolean(item?.visited)&&!item?.completed).length;
    const notStarted=Math.max(0,total-completed-inProgress);
    const aggregate=Math.round(normalized.reduce((sum,item)=>sum+clampProgress(item?.progress,item?.completed),0)/Math.max(1,total));
    return {completed,inProgress,notStarted,aggregate};
  }

  function recommendation(items){
    const normalized=(Array.isArray(items)?items:[]).map((item,index)=>({...item,index:item?.index??index}));
    const unfinished=normalized.filter(item=>item.visited&&!item.completed);
    if(unfinished.length){
      const latest=[...unfinished].sort((a,b)=>activityTime(b)-activityTime(a)||b.progress-a.progress||a.index-b.index)[0];
      if(activityTime(latest)>0)return {index:latest.index,reason:'recent'};
      const highest=[...unfinished].sort((a,b)=>b.progress-a.progress||a.index-b.index)[0];
      return {index:highest.index,reason:'progress'};
    }
    const next=normalized.find(item=>!item.completed);
    return next?{index:next.index,reason:'next'}:null;
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

  return Object.freeze({activityTime,clampProgress,summarize,recommendation,formatHungarianDate});
});
