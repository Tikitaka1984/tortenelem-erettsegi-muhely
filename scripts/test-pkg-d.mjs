import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const config=JSON.parse(read('vercel.json'));
const rules=config.headers;
const header=(rule,key)=>rule.headers.find(item=>item.key.toLowerCase()===key.toLowerCase())?.value;
const mainRules=['/','/index.html'].map(source=>rules.find(rule=>rule.source===source));
for(const rule of mainRules){assert.ok(rule,`missing ${rule} main rule`);const csp=header(rule,'Content-Security-Policy');assert.match(csp,/script-src 'self'(?:;| )/);assert.doesNotMatch(csp,/script-src[^;]*(?:'unsafe-inline'|'unsafe-eval')/);assert.match(csp,/object-src 'none'/);assert.match(csp,/frame-ancestors 'none'/);assert.match(csp,/connect-src 'self' https:\/\/\*\.supabase\.co wss:\/\/\*\.supabase\.co/);assert.doesNotMatch(csp,/connect-src[^;]*\s\*\s/);assert.equal(header(rule,'X-Frame-Options'),'DENY');}
const common=rules.find(rule=>rule.source==='/(.*)');
assert.equal(header(common,'X-Content-Type-Options'),'nosniff');assert.equal(header(common,'Referrer-Policy'),'strict-origin-when-cross-origin');assert.match(header(common,'Permissions-Policy'),/camera=\(\).*microphone=\(\).*geolocation=\(\).*payment=\(\).*usb=\(\)/);assert.equal(header(common,'Strict-Transport-Security'),'max-age=31536000');
const courseRule=rules.find(rule=>rule.source==='/courses/(.*).html');assert.ok(courseRule);const courseCsp=header(courseRule,'Content-Security-Policy');assert.match(courseCsp,/object-src 'none'/);assert.doesNotMatch(courseCsp,/script-src[^;]*'unsafe-eval'/);assert.match(courseCsp,/frame-ancestors 'self'/);assert.match(courseCsp,/connect-src 'none'/);assert.match(courseCsp,/https:\/\/fonts\.googleapis\.com/);assert.match(courseCsp,/https:\/\/fonts\.gstatic\.com/);
const index=read('index.html'),frame=index.match(/<iframe\b[^>]*id="courseFrame"[^>]*>/)?.[0];assert.ok(frame);const sandbox=frame.match(/sandbox="([^"]+)"/)?.[1]||'';assert.match(sandbox,/\ballow-scripts\b/);assert.doesNotMatch(sandbox,/allow-same-origin|allow-top-navigation/);
for(const file of ['app.js','annotations.js']){const source=read(file);assert.doesNotMatch(source,/contentDocument|contentWindow\.document/,`${file} must not access child DOM`);}
const parent=read('course-frame-channel.js'),child=read('course-frame-bridge.js');for(const source of [parent,child]){assert.match(source,/tem-course-frame/);assert.match(source,/VERSION=1/);assert.match(source,/event\.source/);assert.match(source,/channelId/);assert.match(source,/courseId/);}assert.match(parent,/event\.source!==frame\.contentWindow/);assert.match(child,/event\.source!==window\.parent/);assert.match(parent,/crypto\.randomUUID\(\)/);assert.doesNotMatch(parent,/Math\.random/);
for(const source of [parent,child])assert.doesNotMatch(source,/access_token|refresh_token|currentAccessToken|\bemail\b|user_id|supabaseKey/i);
const courseDir=path.join(root,'courses'),files=fs.readdirSync(courseDir).filter(name=>name.endsWith('.html'));assert.equal(files.length,33);for(const file of files){const source=read('courses/'+file);assert.equal((source.match(/<script src="\.\.\/course-frame-bridge\.js"><\/script>/g)||[]).length,1,`${file} bridge hook`);const original=execFileSync('git',['show',`6b4e8ea7478892ef9bbbc6edc5c4905a639639b3:courses/${file}`],{cwd:root,encoding:'utf8',maxBuffer:10*1024*1024});assert.equal(source.replace('<script src="../course-frame-bridge.js"></script>\n',''),original,`${file} content changed beyond hook`);}
const sw=read('service-worker.js');for(const asset of ['app.js','course-frame-channel.js','course-frame-bridge.js','course-theme.css','course-theme-dark.css'])assert.ok(sw.includes(asset),`${asset} not cached`);assert.match(sw,/1\.5-shell-v3/);assert.doesNotMatch(parent,/courses\/[^'"`]+\?(?:channel|channelId)=/);
console.log('Package D targeted checks: PASS');

// Merge-blocker regressions: final snapshots are Promise-based and bound to their originating course.
const appSource=read('app.js');
assert.match(parent,/function flushCourseProgress\(\)\{return requestCourseContext\(350\);\}/,'flush must return the context Promise');
assert.match(parent,/resolve\(value\?\{\.\.\.value,courseId:requestedCourseId\}:null\)/,'resolved snapshots must carry the captured course ID');
assert.match(appSource,/function applyFrameSnapshotForCourse\(courseId,data\)/,'snapshots need an explicit course target');
assert.match(appSource,/courseIndexById\(courseId\)/,'snapshot application must resolve state by stable course ID');
assert.match(appSource,/async function showHome\(\)[\s\S]*await captureFrameProgress\(departingCourseId\)[\s\S]*classList\.add\('home-mode'\)/,'home navigation must await the final flush before entering home mode');
assert.match(appSource,/async function show\(index\)[\s\S]*await captureFrameProgress\(departingCourseId\)[\s\S]*current=index/,'course navigation must await the old course flush before changing current');
assert.match(appSource,/navigationId!==navigationSequence/,'superseded rapid navigation must not load an older destination');
assert.match(appSource,/on\('progress',data=>applyFrameSnapshotForCourse\(data\.courseId,data\)\)/,'progress events must use message courseId');
assert.match(appSource,/courseIndexById\(data\.courseId\)[\s\S]*s\.drafts=\{\.\.\.data\.drafts\}/,'draft events must use message courseId');
const stateByCourse=new Map([[10,{drafts:{}}],[20,{drafts:{}}]]);
const applyDelayed=(courseId,snapshot)=>Object.assign(stateByCourse.get(courseId),snapshot);
applyDelayed(10,{scrollPosition:640,sectionId:'a-heading',drafts:{answer:'A'}});
assert.deepEqual(stateByCourse.get(10),{scrollPosition:640,sectionId:'a-heading',drafts:{answer:'A'}});
assert.deepEqual(stateByCourse.get(20),{drafts:{}},'a delayed course A snapshot must not corrupt course B');
assert.match(child,/if\(!target&&saved\.anchorText\)/,'restore must fall back to anchor text');
assert.match(child,/querySelectorAll\('h1,h2,h3,h4'\)/,'anchor fallback must search headings inside the child');
assert.match(child,/text===wanted\|\|text\.includes\(wanted\)\|\|wanted\.includes\(text\)/,'heading matching must support exact and safe contains matching');
console.log('Package D navigation and annotation regressions: PASS');
