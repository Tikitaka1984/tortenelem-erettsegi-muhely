import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dashboardSource=fs.readFileSync(new URL('../dashboard-logic.js',import.meta.url),'utf8');
const sandbox={module:{exports:{}},exports:{},Intl,Date};
vm.runInNewContext(dashboardSource,sandbox);
const {summarize}=sandbox.module.exports;
assert.deepEqual({...summarize(Array.from({length:34},(_,index)=>({completed:index===0,visited:index<2,progress:index===0?100:index===1?50:0})))},{completed:1,inProgress:1,notStarted:32,aggregate:4});

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
