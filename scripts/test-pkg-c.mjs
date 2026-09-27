import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dashboardSource=fs.readFileSync(new URL('../dashboard-logic.js',import.meta.url),'utf8');
const sandbox={module:{exports:{}},exports:{},Intl,Date};
vm.runInNewContext(dashboardSource,sandbox);
const logic=sandbox.module.exports;
const courses=[{id:10},{id:20},{id:30}];
const preserved={favorites:[20],favoriteUpdatedAt:{20:123},courses:{20:{visited:true}}};

const migrated=logic.normalizeState({version:3,lastCourse:1,...preserved},courses);
assert.equal(migrated.version,4);
assert.equal(migrated.lastCourseId,20);
assert.deepEqual([...migrated.favorites],[20]);
assert.equal(migrated.favoriteUpdatedAt[20],123);
assert.equal(migrated.courses[20].visited,true);
assert.equal(logic.normalizeState({version:3,lastCourse:99},courses).lastCourseId,null);
assert.equal(logic.normalizeState({version:4,lastCourseId:20},courses).lastCourseId,20);
assert.equal(logic.normalizeState({version:4,lastCourseId:999},courses).lastCourseId,null);
assert.equal(logic.normalizeState(migrated,[{id:30},{id:10},{id:20}]).lastCourseId,20);
assert.equal(logic.courseIndexById([{id:10},{id:42},{id:105}],'42'),1);
assert.equal(logic.courseIdFromHash('#42',[{id:10},{id:42},{id:105}]),42);
assert.equal(logic.courseIdFromHash('#999',[{id:10},{id:42},{id:105}]),null);
const currentCourses=Array.from({length:33},(_,index)=>({id:index+1}));
assert.equal(logic.courseIndexById(currentCourses,logic.courseIdFromHash('#1',currentCourses)),0);
assert.equal(logic.courseIndexById(currentCourses,logic.courseIdFromHash('#33',currentCourses)),32);
const recommendation=logic.recommendation([{courseId:42,index:12,visited:true,completed:false,progress:20,lastOpened:10}]);
assert.equal(recommendation.courseId,42);
assert.equal('index' in recommendation,false);

const indexHtml=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const appSource=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const cloud=fs.readFileSync(new URL('../account-cloud.js',import.meta.url),'utf8');
const annotations=fs.readFileSync(new URL('../annotations.js',import.meta.url),'utf8');
assert.match(appSource,/version:4,lastCourseId:null/);
assert.match(appSource,/appState\.lastCourseId=Number\(course\.id\)/);
assert.match(appSource,/history\.replaceState\(null,'','#'\+course\.id\)/);
assert.match(appSource,/option\.value=String\(course\.id\)/);
assert.match(appSource,/button\.dataset\.courseId=String\(course\.id\)/);
assert.match(appSource,/showCourseById/);
assert.doesNotMatch(appSource,/appState\.lastCourse\s*=/);
assert.doesNotMatch(appSource,/data-continue=/);
assert.doesNotMatch(appSource,/option\.value\s*=\s*index/);
assert.doesNotMatch(appSource,/#'\+\(index\+1\)/);
assert.match(cloud,/const pendingCourseIds=new Set\(\)/);
assert.match(cloud,/function queueCourse\(courseId\)/);
assert.match(cloud,/function rowFromState\(courseId\)/);
assert.match(cloud,/course_id:Number\(course\.id\)/);
assert.match(cloud,/changed\.push\(Number\(course\.id\)\)/);
assert.match(cloud,/localNewer\.push\(Number\((?:row\.)?course\.id\)\)/);
assert.doesNotMatch(cloud,/pendingCourses|function queueCourse\(index\)|function rowFromState\(index\)/);
assert.match(annotations,/app\.showCourseById\?\.\(item\.course_id\)/);

// The queue contract resolves the payload from the stable ID, never its position.
for(const position of [0,1,12]){
  const list=Array.from({length:13},(_,i)=>({id:100+i}));
  list[position]={id:42};
  const id=42;
  const course=list[logic.courseIndexById(list,id)];
  assert.equal(Number(course.id),42);
}
console.log('Package C targeted checks: PASS');
