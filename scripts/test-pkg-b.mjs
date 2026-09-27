import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dashboardSource=fs.readFileSync(new URL('../dashboard-logic.js',import.meta.url),'utf8');
const sandbox={module:{exports:{}},exports:{},Intl,Date};
vm.runInNewContext(dashboardSource,sandbox);
const {summarize}=sandbox.module.exports;
assert.deepEqual({...summarize(Array.from({length:34},(_,index)=>({completed:index===0,visited:index<2,progress:index===0?100:index===1?50:0})))},{completed:1,inProgress:1,notStarted:32,aggregate:4});

const indexHtml=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const appSource=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const metadataUpdater=appSource.match(/function updateDocumentCourseCount\(total\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(metadataUpdater,'course-count metadata updater must exist');
const description={content:''};
const document={title:'',querySelector:selector=>selector==='meta[name="description"]'?description:null};
vm.runInNewContext(`${metadataUpdater};updateDocumentCourseCount(34);`,{document});
assert.equal(document.title,'Történelem Érettségi Műhely – 34 interaktív kurzus','document title must use the loaded course count');
assert.equal(description.content,'Interaktív történelemérettségi-felkészítő 34 kurzussal, feladatokkal, felhőben menthető haladással és személyes tanulási eszközökkel.','meta description must use the loaded course count');
assert.match(appSource,/updateDocumentCourseCount\(courses\.length\)/,'metadata updater must receive courses.length');
const executableScripts=[...indexHtml.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).join('\n');
assert.doesNotMatch(executableScripts,/(?:total\s*=\s*33|courses\.length\s*\|\|\s*33|course_id\s*(?:<=|<)\s*33)/,'functional code must not fall back to a hardcoded 33-course limit');

const annotations=fs.readFileSync(new URL('../annotations.js',import.meta.url),'utf8');
assert.match(annotations,/app\.courses\.some\(course=>Number\(course\.id\)===item\.course_id\)/,'annotation IDs must use the metadata ID set');
assert.doesNotMatch(annotations,/course_id<=app\.courses\.length/,'annotation IDs must not assume contiguous IDs');
assert.match(annotations,/annotation_limit_exceeded/,'annotation limit needs a Hungarian client error');

const migration=fs.readFileSync(new URL('../supabase/migrations/20260926_pkg_b_data_integrity.sql',import.meta.url),'utf8');
assert.match(migration,/interval '5 minutes'/);
assert.match(migration,/favorite_updated_at/);
assert.match(migration,/course_id >= 1/g);
assert.match(migration,/count\(\*\)[\s\S]*>= 1000/);
assert.match(migration,/before insert on public\.student_annotations/);
assert.doesNotMatch(migration,/\bdelete\s+from\b/i,'migration must not delete production data');
console.log('Package B targeted checks: PASS');
