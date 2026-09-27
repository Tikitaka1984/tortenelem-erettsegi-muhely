(async function(){
"use strict";
let courses=[];
try{
  const metaResp=await fetch('course-meta.json');
  if(!metaResp.ok)throw new Error('HTTP '+metaResp.status);
  courses=await metaResp.json();
}catch(e){
  document.body.innerHTML='<main style="max-width:680px;margin:10vh auto;padding:32px;font-family:system-ui,sans-serif;color:#253247"><h1 style="font-size:1.5rem">Az alkalmazás most nem tölthető be</h1><p>Nem sikerült betölteni a kurzusok adatait. Frissítsd az oldalt, vagy próbáld meg később.</p></main>';
  return;
}
const list=document.getElementById('courseList');
const select=document.getElementById('mobileSelect');
const frame=document.getElementById('courseFrame');
const search=document.getElementById('courseSearch');
const count=document.getElementById('courseCount');
function updateDocumentCourseCount(total){
  const description=document.querySelector('meta[name="description"]');
  document.title='Történelem Érettségi Műhely – '+total+' interaktív kurzus';
  if(description)description.content='Interaktív történelemérettségi-felkészítő '+total+' kurzussal, feladatokkal, felhőben menthető haladással és személyes tanulási eszközökkel.';
}
updateDocumentCourseCount(courses.length);
document.querySelectorAll('[data-course-total]').forEach(element=>{element.textContent=String(courses.length);});
document.getElementById('statNotStarted').textContent=String(courses.length);
document.getElementById('footerRange').textContent='01–'+String(courses.length).padStart(2,'0');
const empty=document.getElementById('emptyState');
const positionText=document.getElementById('positionText');
const positionFill=document.getElementById('positionFill');
const currentIndex=document.getElementById('currentIndex');
let current=0;
let unifiedTheme=true;
let dashboardQuery='';
const UNIFIED_THEME_CSS=`
/* ============================================================
   TÖRTÉNELEM ÉRETTSÉGI MŰHELY — SHARED COURSE DESIGN SYSTEM
   Demonstrációs réteg: a tartalom és a JavaScript funkciók változatlanok.
   ============================================================ */
:root{
  --ink:#172235 !important;
  --ink-soft:#5e6978 !important;
  --rubric:#8b5d20 !important;
  --lapis:#24496f !important;
  --gold:#b88935 !important;
  --stone:#f3f5f7 !important;
  --stone-2:#e7ebef !important;
  --paper:#ffffff !important;
  --line:#dce2e8 !important;
  --ok:#267356 !important;
  --bad:#a74343 !important;
}
*{box-sizing:border-box}
html{scroll-padding-top:82px}
body{
  background:#f3f5f7 !important;
  color:#172235 !important;
  font-family:"Source Sans 3",Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
  font-size:16.5px !important;
  line-height:1.68 !important;
  letter-spacing:.002em;
}
body::selection{background:rgba(184,137,53,.24)}

/* Hero / kurzusfej */
header.masthead{
  position:relative !important;
  overflow:hidden !important;
  background:
    radial-gradient(circle at 88% 12%,rgba(184,137,53,.13),transparent 28%),
    linear-gradient(145deg,#ffffff 0%,#f7f8fa 68%,#f0f3f6 100%) !important;
  border-bottom:1px solid #dde3e9 !important;
  padding-top:clamp(42px,7vw,72px) !important;
  padding-bottom:clamp(34px,5vw,58px) !important;
  box-shadow:0 12px 36px rgba(20,34,52,.06) !important;
}
header.masthead::after{
  content:"";position:absolute;left:0;top:0;width:100%;height:4px;
  background:linear-gradient(90deg,#24496f 0 68%,#b88935 68% 100%);
}
.masthead .wrap,.masthead-inner{max-width:980px !important;margin-left:auto !important;margin-right:auto !important}
.eyebrow{
  display:inline-flex !important;align-items:center;gap:8px;
  color:#8b5d20 !important;font-size:10.5px !important;font-weight:800 !important;
  letter-spacing:.16em !important;text-transform:uppercase;
  margin-bottom:16px !important;
}
h1{
  color:#142238 !important;
  font-family:"EB Garamond",Georgia,serif !important;
  font-weight:600 !important;
  font-size:clamp(2.35rem,5.6vw,4rem) !important;
  line-height:1.02 !important;
  letter-spacing:-.025em !important;
  max-width:16em;
}
h1 .sub,.subtitle{color:#677181 !important;font-weight:400 !important}
.lede{
  color:#526071 !important;
  max-width:47em !important;
  font-size:clamp(1.05rem,1.7vw,1.22rem) !important;
  line-height:1.6 !important;
}
.meta,.tagrow{gap:8px !important;margin-top:24px !important}
.tag{
  border:1px solid #d8dee5 !important;
  border-radius:999px !important;
  background:rgba(255,255,255,.82) !important;
  color:#4f5b6b !important;
  padding:6px 11px !important;
  box-shadow:0 1px 2px rgba(20,34,52,.03);
  font-size:10px !important;font-weight:700 !important;letter-spacing:.08em !important;
}

/* Belső sticky modulnavigáció */
nav.rail{
  background:rgba(250,251,252,.92) !important;
  border-bottom:1px solid rgba(210,218,227,.95) !important;
  backdrop-filter:blur(14px) saturate(140%) !important;
  box-shadow:0 6px 22px rgba(20,34,52,.055) !important;
}
.rail-inner{max-width:1000px !important;margin:auto !important}
.rail a{
  color:#677384 !important;text-decoration:none !important;
  border-radius:9px !important;border-bottom:0 !important;
  padding:7px 10px !important;font-weight:650 !important;
  transition:background .16s ease,color .16s ease !important;
}
.rail a:hover,.rail a.on{background:#eaf0f6 !important;color:#24496f !important}
.prog-bar,.rail-progress-track{background:#e1e6eb !important;border-radius:999px !important;overflow:hidden}
.prog-fill,.rail-progress-fill{background:linear-gradient(90deg,#24496f,#b88935) !important;border-radius:999px !important}

/* Oldaltörzs és modulkártyák */
body>main{
  width:min(100%,1040px) !important;
  max-width:1040px !important;
  margin:0 auto !important;
  padding:28px clamp(14px,3vw,28px) 76px !important;
  background:transparent !important;
}
section.mod,.module{
  background:#fff !important;
  border:1px solid #e0e5ea !important;
  border-radius:22px !important;
  margin:22px 0 !important;
  padding:clamp(28px,5vw,54px) clamp(18px,5vw,48px) !important;
  box-shadow:0 14px 38px rgba(20,34,52,.055) !important;
}
section.mod>.wrap{max-width:900px !important;padding:0 !important}
.col{max-width:790px !important}
.mod-head,.module-head{display:flex !important;align-items:center !important;gap:12px !important;margin-bottom:14px !important}
.mod-num,.module-num{
  display:inline-flex !important;align-items:center !important;justify-content:center !important;
  min-width:36px;height:30px;padding:0 10px !important;
  border:1px solid #d8c39a !important;border-radius:9px !important;
  background:#fbf7ee !important;color:#916522 !important;
  font-family:"IBM Plex Mono",ui-monospace,monospace !important;
  font-size:10.5px !important;font-weight:700 !important;letter-spacing:.08em !important;
}
h2{
  color:#18263a !important;font-family:"EB Garamond",Georgia,serif !important;
  font-size:clamp(1.8rem,3.5vw,2.55rem) !important;line-height:1.12 !important;
  letter-spacing:-.015em !important;
}
h3{color:#20324b !important;font-family:"EB Garamond",Georgia,serif !important;font-size:1.42rem !important;margin-top:34px !important}
h4{color:#7e5924 !important;font-weight:800 !important;letter-spacing:.08em !important}
p{color:inherit}
article{max-width:850px;margin-left:auto;margin-right:auto}

/* Tanulási cél, fogódzó, forrás */
.goal,.goal-box{
  background:#f0f5fa !important;
  border:1px solid #d4e0eb !important;
  border-left:4px solid #3a6288 !important;
  border-radius:14px !important;
  padding:17px 19px !important;margin:20px 0 26px !important;
  box-shadow:none !important;
}
.goal .lbl,.goal-box .lbl{color:#24496f !important;font-size:10px !important;font-weight:800 !important;letter-spacing:.13em !important}
.fogodzo{
  background:#fbf6e9 !important;border:1px solid #eadcbd !important;border-left:4px solid #b88935 !important;
  border-radius:14px !important;padding:16px 18px !important;margin:20px 0 !important;
}
.source,.source-box{
  background:#fffcf6 !important;
  border:1px solid #e7dfd0 !important;
  border-left:4px solid #a26c2a !important;
  border-radius:14px !important;
  padding:21px 22px !important;margin:22px 0 !important;
  box-shadow:0 6px 20px rgba(69,53,27,.035) !important;
}
.source .src-lbl,.source-box h4{color:#8a5c21 !important}
.source .src-txt,.source-box .src-text{color:#313d4b !important;font-size:1.04rem !important;line-height:1.7 !important}
.src-meta{color:#7c8490 !important}

/* Kártyák és interaktív feladatok */
.card,.task,.essay-tool,.essay-box,.chain-wrap,.chain-box{
  border:1px solid #dfe5eb !important;
  border-radius:16px !important;
  background:#fff !important;
  box-shadow:0 7px 22px rgba(20,34,52,.045) !important;
}
.card{padding:23px !important}
.task{padding:18px 19px !important;margin:14px 0 !important;transition:border-color .16s ease,box-shadow .16s ease,transform .16s ease !important}
.task:hover{border-color:#cbd7e3 !important;box-shadow:0 9px 26px rgba(20,34,52,.07) !important}
.task.done{border-color:#d4bd8d !important;box-shadow:inset 4px 0 0 #b88935,0 7px 22px rgba(20,34,52,.045) !important}
.task-id{color:#8b5d20 !important;font-weight:800 !important}
.task-q{color:#26364a !important;font-weight:700 !important}
.answer,.solution{
  border-radius:11px !important;
}
.answer{background:#faf5e8 !important;border-left:3px solid #b88935 !important}
.solution:not(.hidden){background:#f4f8f5 !important;border:1px solid #d4e4da !important;padding:14px 16px !important;margin-top:12px !important}

/* Gombok */
button,.btn,.chip,.reveal-btn,.check-btn{border-radius:10px !important;transition:all .16s ease !important}
.btn,.reveal-btn,.check-btn,.task-controls button,.task button[data-val]{
  background:#223b5a !important;color:#fff !important;border:1px solid #223b5a !important;
  padding:8px 13px !important;font-weight:700 !important;
  box-shadow:0 2px 6px rgba(20,34,52,.08) !important;
}
.btn:hover,.reveal-btn:hover,.check-btn:hover,.task-controls button:hover,.task button[data-val]:hover{
  background:#2d5278 !important;border-color:#2d5278 !important;transform:translateY(-1px) !important;
}
.btn.ghost,.chip{
  background:#fff !important;color:#33475e !important;border:1px solid #d6dee6 !important;box-shadow:none !important;
}
.btn.ghost:hover,.chip:hover{background:#f3f7fa !important;color:#24496f !important;border-color:#aebfce !important}
.chip.sel{background:#eaf1f7 !important;color:#24496f !important;border-color:#7f9db8 !important}
.chip.ok{background:#edf7f1 !important;color:#267356 !important;border-color:#8fbea7 !important}
.chip.bad{background:#fbefef !important;color:#a74343 !important;border-color:#d6a1a1 !important}
.eonly{border-radius:5px !important;background:#b88935 !important;font-weight:800 !important}

/* Ok-okozati lánc */
.chain-wrap,.chain-box{
  margin-top:28px !important;padding:22px !important;
  background:linear-gradient(145deg,#f9fafb,#f3f6f8) !important;
}
.chain-title,.chain-wrap .src-lbl{color:#7c5723 !important;font-weight:800 !important}
.chain-track,.chain-target{
  background:#fff !important;border:1px dashed #bdc9d4 !important;border-radius:12px !important;
}
.chain-slot{border-radius:9px !important;border-color:#6f8ca7 !important;color:#24496f !important;background:#fff !important}
.chain-goal.lit{background:#24496f !important;border-color:#24496f !important;box-shadow:0 0 0 4px rgba(36,73,111,.12) !important}


/* Kontrasztbiztos interaktív lánc — a sötét eredeti sablonok világos szövegeinek javítása */
.chain-box .chain-row{gap:10px !important;align-items:stretch !important}
.chain-box .chain-item{
  background:#ffffff !important;
  color:#26364a !important;
  border:1px solid #d5dde5 !important;
  border-radius:10px !important;
  box-shadow:0 2px 7px rgba(20,34,52,.035) !important;
  padding:12px 13px !important;
  line-height:1.4 !important;
  font-weight:600 !important;
  text-shadow:none !important;
}
.chain-box .chain-item:hover{
  background:#f2f6fa !important;
  color:#183a5c !important;
  border-color:#91a8bc !important;
  transform:translateY(-1px) !important;
}
.chain-box .chain-item.done{
  background:#edf7f1 !important;
  color:#1f664a !important;
  border-color:#8fbca5 !important;
  box-shadow:inset 3px 0 0 #267356 !important;
}
.chain-box .chain-item.wrong{
  background:#fbefef !important;
  color:#973737 !important;
  border-color:#d6a1a1 !important;
}
.chain-box .chain-target{
  margin-top:16px !important;
  padding:14px 16px !important;
  background:#ffffff !important;
  color:#667384 !important;
  border:1px dashed #b9c6d2 !important;
  border-radius:11px !important;
  text-shadow:none !important;
}
.chain-box .chain-target .crest{filter:none !important}
.chain-box .chain-target.lit{
  background:#fff8e9 !important;
  color:#7d561d !important;
  border-color:#d8be88 !important;
  text-shadow:none !important;
}
.chain-box .chain-title{
  color:#7c5723 !important;
  font-weight:800 !important;
  text-shadow:none !important;
}


/* Táblázatok */
table,.datatable,.oral-table{
  width:100% !important;
  border-collapse:separate !important;border-spacing:0 !important;
  border:1px solid #dce3e9 !important;border-radius:13px !important;overflow:hidden !important;
  background:#fff !important;box-shadow:0 4px 14px rgba(20,34,52,.035) !important;
}
caption{color:#6f7884 !important;font-weight:700 !important;text-align:left !important;padding:0 0 8px !important}
th,.datatable th,.oral-table th{
  background:#203853 !important;color:#fff !important;
  border:0 !important;padding:10px 12px !important;font-size:10.5px !important;letter-spacing:.07em !important;
}
td,.datatable td,.oral-table td{border-bottom:1px solid #e5e9ed !important;padding:10px 12px !important;background:#fff !important}
tr:last-child td{border-bottom:0 !important}
tbody tr:nth-child(even) td{background:#f8fafb !important}

/* Fogalomtár, idővonal, tippek */
.gloss .row,.glossary .row{border-bottom:1px solid #e3e7eb !important;padding:13px 0 !important}
.time{border-left-color:#d4dce4 !important}.time .ev::before{background:#b88935 !important;box-shadow:0 0 0 4px #f3ead8}
.tips li,.tips-list li,.essay-topics li{
  background:#fff !important;border:1px solid #dfe5ea !important;border-radius:12px !important;
}
.tips-list li::before{background:#24496f !important}
.tips-list li.first-tip{background:#fbf6e9 !important;border-color:#e1cb9d !important}
.tips-list li.first-tip::before{background:#b88935 !important;color:#fff !important}

/* Űrlapelemek / esszéműhely */
input[type="text"],input[type="search"],select,textarea,.search,.fill-in{
  border:1px solid #cfd8e1 !important;border-radius:10px !important;background:#fff !important;color:#223147 !important;
  box-shadow:inset 0 1px 2px rgba(20,34,52,.03) !important;
}
input:focus,select:focus,textarea:focus,.search:focus,.fill-in:focus{
  outline:3px solid rgba(57,98,136,.14) !important;border-color:#7896b1 !important;
}
textarea,textarea#essay-area{font-size:1.04rem !important;line-height:1.65 !important;padding:14px 15px !important}
.pill{border-radius:999px !important;background:#fff !important;border-color:#d6dee6 !important}
.pill.on{background:#24496f !important;color:#fff !important;border-color:#24496f !important}

/* Térképek */
.atlas-map{
  border:1px solid #dce3e8 !important;border-radius:16px !important;overflow:hidden !important;
  box-shadow:0 10px 28px rgba(20,34,52,.07) !important;background:#fff !important;
}
.atlas-map__head{background:linear-gradient(180deg,#fbfcfd,#f2f5f7) !important;border-bottom-color:#dde4ea !important;padding:15px 18px !important}
.atlas-map__eyebrow{color:#8b5d20 !important}.atlas-map__head h4{color:#213b59 !important}
.atlas-map__foot{background:#fafbfc !important;border-top-color:#e1e6eb !important;color:#6d7682 !important}

/* Footer */
footer{
  margin-top:34px !important;background:#172437 !important;color:#c9d0da !important;
  border-top:4px solid #b88935 !important;padding-top:42px !important;
}
footer h3,footer h4{color:#f5e6c3 !important}
footer a{color:#e0bd77 !important}

/* Mobil */
@media(max-width:700px){
  body{font-size:15.8px !important}
  header.masthead{padding-left:0 !important;padding-right:0 !important}
  .masthead .wrap,.masthead-inner{padding-left:18px !important;padding-right:18px !important}
  body>main{padding:14px 10px 54px !important}
  section.mod,.module{border-radius:16px !important;margin:12px 0 !important;padding:26px 16px !important}
  .goal,.goal-box,.source,.source-box,.fogodzo,.card,.task,.chain-wrap,.chain-box{border-radius:12px !important}
  .rail-inner{padding-left:10px !important;padding-right:10px !important}
  .rail a{font-size:10.5px !important;padding:6px 8px !important}
}
@media print{
  body{background:#fff !important}
  body>main{max-width:none !important;padding:0 !important}
  section.mod,.module{box-shadow:none !important;border-radius:0 !important;border-color:#ccc !important;break-inside:auto}
}


/* ============================================================
   UI 1.0 — TELJES KOMPONENS-FINOMHANGOLÁS
   Két sabloncsalád közös, kontrasztbiztos és reszponzív rétege.
   ============================================================ */
html,body{max-width:100%;overflow-x:hidden}
img,svg,video,canvas{max-width:100%;height:auto}
pre,code{max-width:100%;overflow-wrap:anywhere}
a{color:#28577f}
a:hover{color:#163f64}
::placeholder{color:#8a96a5 !important;opacity:1}

/* Olvasási ritmus */
article p,section.mod p,section.module p,body>main>section>p{max-width:76ch}
strong,b{color:#1c2d43}
hr{border:0;border-top:1px solid #e1e6eb;margin:28px 0}

/* B sablon: az összefoglaló és vizsgaműhely-részek ugyanúgy kártyák */
body>main>section:not(.mod):not(.module){
  background:#fff !important;
  border:1px solid #e0e5ea !important;
  border-radius:22px !important;
  margin:22px 0 !important;
  padding:clamp(28px,5vw,50px) clamp(18px,5vw,46px) !important;
  box-shadow:0 14px 38px rgba(20,34,52,.055) !important;
}
body>main>section:not(.mod):not(.module)+section:not(.mod):not(.module){margin-top:18px !important}
#osszefoglalo,#feladatbank,#bank,#esszemuhely,#szobeli,#tippek{scroll-margin-top:82px}

/* Fejezetcímek és alcímek */
.module-head h2,.mod-head+h2{margin-top:0 !important}
.module-head{border-bottom:1px solid #edf0f3;padding-bottom:14px !important;margin-bottom:22px !important}
.mod-head{margin-bottom:8px !important}
h3{padding-top:2px}
h4{line-height:1.35 !important}

/* Címkék */
.tag,.eonly,.mod-num,.module-num,.task-id,.src-lbl,.chain-title,.chain-wrap .src-lbl{
  -webkit-font-smoothing:antialiased;
}
.eonly{display:inline-flex !important;align-items:center !important;justify-content:center !important;min-width:20px;min-height:19px;padding:1px 6px !important;color:#fff !important}

/* Tanulási cél / fogódzó */
.goal p,.goal-box{color:#33475c !important}
.goal-box .lbl{display:block !important;margin-bottom:5px !important}
.fogodzo p{margin:0 !important;color:#5b472a !important}

/* Forrásblokkok */
.source-box h4,.source .src-lbl{margin-top:0 !important}
.source-box .src-text{font-style:normal !important;border-left:3px solid #c49a50 !important;padding-left:16px !important}
.source-box .src-meta{color:#76808c !important;margin-top:8px !important}
.source .qs,.source-box .subq{border-top:1px solid #eee7db;padding-top:13px !important;margin-top:14px !important}
.qs li{color:#39495c !important}

/* Feladatkártyák — mindkét család */
.task{position:relative}
.task-q{line-height:1.5 !important}
.task-controls,.tf-btns,.act{gap:8px !important}
.task-controls button,.tf-btns .chip,.task .chip{
  min-height:44px !important;
  line-height:1.3 !important;
}
.task-controls button{border-radius:10px !important;text-align:left !important}
.task-controls button.correct{
  background:#267356 !important;color:#fff !important;border-color:#267356 !important;
  box-shadow:0 2px 8px rgba(38,115,86,.16) !important;
}
.task-controls button.incorrect{
  background:#a74343 !important;color:#fff !important;border-color:#a74343 !important;
  box-shadow:0 2px 8px rgba(167,67,67,.15) !important;
}
.task-controls button:disabled,.chip[disabled]{opacity:.92 !important;cursor:default !important;transform:none !important}
.task-feedback{min-height:1.1em;color:#5b6674 !important}
.task-feedback.ok,.verdict.ok{color:#267356 !important}
.task-feedback.bad,.verdict.bad{color:#a74343 !important}

/* A sablon: igaz/hamis */
.tf-row{border-bottom:1px solid #e5e9ed !important;padding:12px 0 !important}
.tf-txt{color:#334256 !important;line-height:1.5 !important}
.tf-note{color:#687484 !important;background:#f7f9fa;border-radius:8px;padding:8px 10px !important;margin-top:2px}
.tf-note.show{display:block !important}

/* A sablon: párosítás */
.match{gap:16px !important}
.match .colhead{color:#6d7887 !important;font-weight:800 !important;margin-bottom:8px !important}
.match .stack{gap:8px !important}
.match .chip{width:100% !important}

/* B sablon: párosítás */
.match-grid{gap:12px 16px !important;margin-top:12px !important}
.match-col{gap:8px !important}
.match-item{
  background:#fff !important;color:#33475c !important;border:1px solid #d6dee6 !important;
  border-radius:10px !important;padding:10px 12px !important;line-height:1.4 !important;
  box-shadow:0 2px 7px rgba(20,34,52,.025) !important;
}
.match-item:hover{background:#f3f7fa !important;border-color:#9eb3c5 !important}
.match-item.selected{outline:3px solid rgba(36,73,111,.15) !important;border-color:#6889a7 !important;background:#edf3f8 !important}
.match-item.matched{background:#267356 !important;color:#fff !important;border-color:#267356 !important}
.match-item.wrong-flash{background:#a74343 !important;color:#fff !important;border-color:#a74343 !important}

/* Hiányos szöveg */
.fill-in,.fill-input{min-height:44px !important}
.fill-in.ok{background:#edf7f1 !important;color:#1f664a !important;border-color:#70aa8d !important}
.fill-in.bad{background:#fbefef !important;color:#973737 !important;border-color:#cf9090 !important}
.fill-input{max-width:420px !important;margin-right:7px !important}

/* Sorrendbe állítás */
.sort-row{padding:10px 0 !important;border-bottom:1px solid #e5e9ed !important}
.sort-row span{color:#34465a !important;line-height:1.45 !important}
.sort-row select{min-width:125px !important;background:#fff !important}

/* Megoldásblokkok */
.solution{color:#33465a !important;line-height:1.58 !important}
.solution.hidden{display:none !important}
.solution:not(.hidden){border-left:4px solid #4e896d !important;border-radius:10px !important;background:#f2f8f4 !important}
.answer{color:#4b4234 !important;line-height:1.58 !important}
.answer.show{display:block !important}
.answer .lbl{color:#8a6424 !important}

/* Gombhierarchia */
.reveal-btn{background:#8b6727 !important;border-color:#8b6727 !important;color:#fff !important}
.reveal-btn:hover{background:#75551f !important;border-color:#75551f !important}
.check-btn{background:#24496f !important;color:#fff !important}
.btn.ghost{background:#fff !important}

/* Ok–okozati lánc — A sablon */
.chain-wrap{overflow:hidden !important}
.chain-wrap .hint{color:#647080 !important;max-width:72ch}
.chain-pool{gap:9px !important}
.chain-pool .chip{background:#fff !important;color:#33475c !important;border-color:#d2dae2 !important;box-shadow:0 2px 6px rgba(20,34,52,.025) !important}
.chain-pool .chip:hover{background:#f1f5f8 !important;border-color:#91a8bc !important;color:#24496f !important}
.chain-track{min-height:58px !important;padding:13px !important;color:#687587 !important}
.chain-track #chainPlaceholder{color:#7f8a98 !important}
.chain-slot{color:#24496f !important;background:#edf3f8 !important;border-color:#8ea7bd !important;line-height:1.35 !important}
.chain-arrow{color:#a8792d !important;font-weight:800}
.chain-goal{color:#8e98a5 !important;background:#f4f6f8 !important;border-color:#d6dde4 !important;border-radius:10px !important}
.chain-goal.lit{color:#fff !important;background:#24496f !important}

/* Ok–okozati lánc — B sablon */
.chain-box{overflow:hidden !important}
.chain-box .chain-row{display:grid !important;grid-template-columns:repeat(auto-fit,minmax(155px,1fr)) !important;gap:10px !important}
.chain-box .chain-item{min-width:0 !important;min-height:78px !important;display:flex !important;align-items:center !important}
.chain-box .chain-item.done{background:#edf7f1 !important;color:#1f664a !important;border-color:#8fbca5 !important;box-shadow:inset 3px 0 0 #267356 !important}
.chain-box .chain-item.wrong{background:#fbefef !important;color:#973737 !important;border-color:#d6a1a1 !important}
.chain-box .chain-target{min-height:86px !important;display:flex !important;flex-direction:column !important;justify-content:center !important;align-items:center !important;line-height:1.45 !important}
.chain-box .chain-target .crest{opacity:.8}

/* Táblázatok */
.tbl-scroll{border-radius:13px !important;overflow:auto !important;box-shadow:0 4px 14px rgba(20,34,52,.035) !important}
table{max-width:100% !important}
table th{line-height:1.35 !important}
table td{line-height:1.5 !important;color:#334256 !important}
table td strong{color:#1f3045 !important}
.datatable caption{color:#6e7886 !important;font-weight:800 !important;padding:0 0 9px !important}

/* Kereshető fogalomtár */
.search,.glossary-search{max-width:460px !important}
.gloss,.glossary{margin-top:14px !important}
.gloss .row{grid-template-columns:minmax(170px,220px) 1fr !important;gap:20px !important}
.gloss dt,dl.glossary dt{color:#24496f !important;font-weight:700 !important}
.gloss dd,dl.glossary dd{color:#5c6876 !important;line-height:1.5 !important}
dl.glossary dt{padding-top:8px !important;border-top:1px solid #edf0f2 !important}
dl.glossary dt:first-of-type{border-top:0 !important}
.no-hit{color:#7b8592 !important}

/* Idővonalak */
.time,.timeline{margin-top:20px !important}
.time .ev,.timeline li{line-height:1.45 !important}
.time .yr,.timeline li b{color:#815c23 !important;font-weight:800 !important}
.timeline{border-left:2px solid #cda65d !important}
.timeline li::before{background:#b88935 !important;box-shadow:0 0 0 4px #f4ead8 !important}
.time .why{color:#687484 !important}

/* Topográfia */
.topo-list{padding-left:20px !important}
.topo-list li{padding:4px 0 !important;color:#3f4d5e !important}

/* Komplex feladatbank */
.kfeladat{
  background:#fff !important;border:1px solid #dfe5ea !important;border-radius:14px !important;
  padding:20px !important;margin:16px 0 !important;box-shadow:0 5px 16px rgba(20,34,52,.035) !important;
}
.kfeladat h4{color:#7d5520 !important;margin-top:0 !important;padding-right:60px}
.kfeladat .pont{display:inline-flex !important;align-items:center;justify-content:center;background:#edf3f8 !important;color:#24496f !important;border:1px solid #d4e0e9 !important;border-radius:999px !important;padding:4px 9px !important;font-weight:800 !important}

/* Esszéműhely — A */
.essay-tool{padding:22px !important}
.pill-row{gap:7px !important}
.pill{cursor:pointer !important;color:#526071 !important}
.pill.on{color:#fff !important}
.counter{padding-top:4px !important}
.counter .n{color:#203853 !important}
.counter .state{color:#667383 !important}
.gauge{height:9px !important;border-radius:999px !important;overflow:hidden !important;background:#e1e6eb !important}
.gauge .zone{background:rgba(38,115,86,.23) !important}
.gauge .mark{background:#203853 !important}
.check-list li{border-bottom:1px solid #edf0f2;padding:8px 0 !important;color:#455468 !important}
.check-list li:last-child{border-bottom:0}
.check-list input,.checklist input{accent-color:#24496f !important}

/* Esszéműhely — B */
.essay-box{padding:22px !important;background:#f8fafb !important}
.essay-mintaesszay{background:#fff !important;border:1px solid #dfe5ea !important;border-radius:14px !important;padding:20px !important;line-height:1.7 !important;color:#344254 !important}
.essay-why{background:#fbf5e7 !important;color:#5f492b !important;border-left:4px solid #b88935 !important;border-radius:9px !important;padding:12px 14px !important}
.writer-controls{padding-bottom:4px !important}
.writer-controls label{font-weight:700 !important;color:#425166 !important}
.writer-controls select{min-width:min(100%,340px) !important}
textarea#essay-area{background:#fff !important}
.word-counter{display:inline-flex !important;align-items:center !important;min-height:30px;padding:5px 10px !important;border-radius:999px !important;background:#eef2f5 !important;color:#5e6a79 !important}
.word-counter.in-range{background:#edf7f1 !important;color:#267356 !important}
.word-counter.out-range{background:#fbefef !important;color:#a74343 !important}
.checklist{margin-top:18px !important}
.checklist li{border-bottom:1px solid #e7ebee !important;padding:8px 0 !important;color:#455468 !important}
.checklist li:last-child{border-bottom:0 !important}
.essay-topics{display:grid !important;grid-template-columns:1fr !important;gap:9px !important}
.essay-topics li{margin:0 !important;padding:12px 14px !important;color:#3f4e61 !important}
.essay-topics li b{display:inline-flex !important;min-width:28px;color:#855d22 !important}

/* Szóbeli */
.oral-questions{padding-left:23px !important}
.oral-questions li{padding:4px 0 !important;color:#405064 !important;line-height:1.45 !important}

/* Tippek */
.tips{display:grid !important;gap:8px !important}
.tips li{border:1px solid #e0e5ea !important;border-radius:12px !important;padding:14px 14px 14px 54px !important;background:#fff !important}
.tips li::before{left:15px !important;top:15px !important;color:#9b6c24 !important;font-weight:800 !important}
.tips-list{display:grid !important;gap:8px !important}
.tips-list li{margin:0 !important;padding:12px 14px 12px 50px !important;color:#405064 !important;line-height:1.48 !important}
.tips-list li::before{left:13px !important;top:11px !important;background:#24496f !important}
.tips-list li.first-tip{background:#fbf6e9 !important;border-color:#dfc58f !important}
.tips-list li.first-tip::before{background:#b88935 !important;color:#fff !important}

/* Térképek */
.atlas-map__image-link{background:#f6f8fa !important}
.atlas-map__image{max-height:72vh !important;object-fit:contain !important}
.atlas-map__focus{color:#657181 !important}
.atlas-map__foot a{color:#315b7e !important}

/* Navigációs sávok */
.rail-scroll,.rail-inner{scrollbar-width:none !important}
.rail-scroll::-webkit-scrollbar,.rail-inner::-webkit-scrollbar{display:none !important}
.rail-progress{color:#647181 !important}
#progress-label{color:#815b22 !important}

/* Footer */
footer p,footer li{color:#c7d0db !important}
footer .note,footer .legal{color:#9faab7 !important;border-color:rgba(255,255,255,.12) !important}

/* Interaktív fókusz és akadálymentesség */
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{
  outline:3px solid rgba(36,73,111,.24) !important;outline-offset:2px !important;
}
button{touch-action:manipulation}

/* Mobil / tablet finomhangolás */
@media(max-width:900px){
  body>main{padding-left:12px !important;padding-right:12px !important}
  section.mod,.module,body>main>section:not(.mod):not(.module){border-radius:18px !important;padding-left:clamp(16px,4vw,30px) !important;padding-right:clamp(16px,4vw,30px) !important}
  .chain-box .chain-row{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
}
@media(max-width:650px){
  body{font-size:15.6px !important;line-height:1.62 !important}
  body>main{padding:10px 8px 48px !important}
  section.mod,.module,body>main>section:not(.mod):not(.module){margin:10px 0 !important;border-radius:15px !important;padding:24px 15px !important}
  header.masthead{padding-top:22px !important;padding-bottom:18px !important}
  header.masthead .eyebrow{margin-bottom:8px !important}
  header.masthead .lede{font-size:.96rem !important;line-height:1.48 !important}
  header.masthead .meta,header.masthead .tagrow{margin-top:14px !important}
  nav.rail{position:static !important}
  h1{font-size:clamp(1.7rem,8vw,2.25rem) !important;line-height:1.08 !important}
  h2{font-size:1.75rem !important}
  h3{font-size:1.28rem !important}
  .source,.source-box,.task,.card,.essay-tool,.essay-box,.chain-wrap,.chain-box,.kfeladat{padding:16px !important}
  .match,.match-grid{grid-template-columns:1fr !important}
  .chain-box .chain-row{grid-template-columns:1fr !important}
  .chain-box .chain-item{min-height:auto !important}
  .sort-row{align-items:stretch !important}
  .sort-row select{width:100% !important;min-width:0 !important}
  .gloss .row{grid-template-columns:1fr !important;gap:4px !important}
  .tbl-scroll{overflow-x:auto !important}
  table.datatable,table.oral-table{display:block !important;overflow-x:auto !important;-webkit-overflow-scrolling:touch !important}
  table.datatable th,table.datatable td,table.oral-table th,table.oral-table td{min-width:120px !important}
  .topo-list{columns:1 !important}
  .atlas-map__image{max-height:none !important}
  .task-controls button,.tf-btns .chip{width:100% !important;justify-content:flex-start !important}
  .act .btn{flex:1 1 auto !important}
}
@media(max-width:390px){
  section.mod,.module,body>main>section:not(.mod):not(.module){padding-left:12px !important;padding-right:12px !important}
  .tag{font-size:9px !important}
  .module-num,.mod-num{font-size:9.5px !important}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{scroll-behavior:auto !important;transition-duration:.001ms !important;animation-duration:.001ms !important}
}
@media print{
  body>main>section:not(.mod):not(.module){box-shadow:none !important;border-radius:0 !important;break-inside:auto}
  .atlas-map__image{max-height:205mm !important}
}
`;

const DARK_COURSE_THEME_CSS=`
/* ============================================================
   TÖRTÉNELEM ÉRETTSÉGI MŰHELY — DARK COURSE THEME
   Az egységes design system sötét, kontrasztbiztos változata.
   ============================================================ */
:root{
  color-scheme:dark !important;
  --ink:#e8edf5 !important;--ink-soft:#a8b4c5 !important;--rubric:#e0b76b !important;
  --lapis:#8eb2e2 !important;--gold:#d8ad58 !important;--stone:#091322 !important;
  --stone-2:#152235 !important;--paper:#101c2d !important;--line:#2a3a50 !important;
  --ok:#79cfa5 !important;--bad:#ef8e8e !important;
}
html{background:#091322 !important;color-scheme:dark !important}
body{background:#091322 !important;color:#e8edf5 !important}
body::selection{background:rgba(216,173,88,.28) !important}
header.masthead{
  background:radial-gradient(circle at 88% 12%,rgba(216,173,88,.13),transparent 28%),linear-gradient(145deg,#101d30 0%,#0c1727 68%,#091421 100%) !important;
  border-bottom-color:#26374c !important;box-shadow:0 12px 36px rgba(0,0,0,.22) !important
}
header.masthead::after{background:linear-gradient(90deg,#6f98cc 0 68%,#d8ad58 68% 100%) !important}
.eyebrow{color:#e0b76b !important}h1{color:#f1f4f8 !important}h1 .sub,.subtitle{color:#aeb9c8 !important}.lede{color:#b8c3d1 !important}
.tag{background:#142238 !important;border-color:#2b3c53 !important;color:#bac5d3 !important;box-shadow:none !important}
nav.rail{background:rgba(10,20,34,.94) !important;border-bottom-color:#28394f !important;box-shadow:0 6px 22px rgba(0,0,0,.18) !important}
.rail a{color:#a5b2c4 !important}.rail a:hover,.rail a.on{background:#16263d !important;color:#9fc1ed !important}
.prog-bar,.rail-progress-track{background:#1c2b40 !important}.prog-fill,.rail-progress-fill{background:linear-gradient(90deg,#6f98cc,#d8ad58) !important}
body>main{background:transparent !important}
section.mod,.module,body>main>section:not(.mod):not(.module){background:#101c2d !important;border-color:#293a50 !important;box-shadow:0 14px 38px rgba(0,0,0,.18) !important}
.mod-num,.module-num{background:#211d19 !important;border-color:#5a4930 !important;color:#e0b76b !important}
h2{color:#edf2f8 !important}h3{color:#dfe8f4 !important}h4{color:#e0b76b !important}
p,li,dd,td{color:#d9e1eb !important}dt,strong,b{color:inherit}
.goal,.goal-box{background:#10253a !important;border-color:#294766 !important;border-left-color:#6f98cc !important;color:#dce9f6 !important}
.goal .lbl,.goal-box .lbl{color:#9fc1ed !important}
.fogodzo{background:#251f15 !important;border-color:#5a4930 !important;border-left-color:#d8ad58 !important;color:#eadfc8 !important}
.source,.source-box{background:#1b1a18 !important;border-color:#4a4030 !important;border-left-color:#d19b4c !important;color:#e8dfd1 !important;box-shadow:none !important}
.source .src-lbl,.source-box h4{color:#e0b76b !important}.source .src-txt,.source-box .src-text{color:#e5dccf !important}.src-meta{color:#a99f91 !important}
.card,.task,.essay-tool,.essay-box,.chain-wrap,.chain-box,.kfeladat{background:#111e30 !important;border-color:#2b3c52 !important;color:#e1e8f1 !important;box-shadow:0 7px 22px rgba(0,0,0,.14) !important}
.task.done{border-color:#6b5735 !important;box-shadow:inset 3px 0 0 #d8ad58 !important}.task-id{color:#dfb66a !important}.task-q{color:#edf2f8 !important}
.chip,.pill,.sort-row select,.fill-in,.fill-input,input[type="text"],input[type="search"],textarea,.search{
  background:#0d1828 !important;border-color:#314359 !important;color:#e7edf5 !important
}
.chip:hover,.pill:hover{border-color:#6f98cc !important;color:#b7d3f3 !important}.chip.sel,.pill.on{background:#18304d !important;border-color:#6f98cc !important;color:#d9e9fb !important}
.chip.ok,.fill-in.ok,.fill-input.ok{background:#122a22 !important;border-color:#4e9c76 !important;color:#9de0bd !important}
.chip.bad,.fill-in.bad,.fill-input.bad{background:#331b20 !important;border-color:#b65e6b !important;color:#f0a5ad !important}
.tf-row{border-bottom-color:#2d3c50 !important}.tf-txt,.tf-note{color:#d5deea !important}
.btn,.task-controls button{background:#223652 !important;border-color:#36506f !important;color:#f0f4f8 !important}.btn:hover,.task-controls button:hover{background:#2a4264 !important;border-color:#6f98cc !important}
.btn.ghost{background:transparent !important;color:#b4c0cf !important;border-color:#3a4b60 !important}.btn.ghost:hover{color:#e0b76b !important;border-color:#d8ad58 !important}
.answer,.answer-box,.feedback,.solution{background:#211e18 !important;border-color:#5a4930 !important;color:#e9dfcd !important}.answer .lbl{color:#e0b76b !important}
.verdict.ok,.feedback.ok{color:#84d5ac !important}.verdict.bad,.feedback.bad{color:#f09a9a !important}
.chain-track,.chain-box .chain-track,.sort-zone{background:#0d1929 !important;border-color:#3b4b61 !important;color:#dce5f0 !important}
.chain-slot,.chain-item,.chain-box .chain-item,.chain-pool button,.chain-box button,.sort-item{
  background:#16263b !important;border-color:#4a6688 !important;color:#e2ebf6 !important
}
.chain-slot:hover,.chain-item:hover,.chain-box .chain-item:hover,.chain-pool button:hover{background:#1d324d !important;border-color:#7da3d2 !important;color:#ffffff !important}
.chain-item.correct,.chain-box .chain-item.correct,.chain-slot.correct{background:#153126 !important;border-color:#5ba57f !important;color:#b6e8cd !important}
.chain-item.wrong,.chain-box .chain-item.wrong,.chain-slot.wrong{background:#351d23 !important;border-color:#b86772 !important;color:#f3b4bc !important}
.chain-goal{color:#9aa8ba !important;border-color:#42536a !important;background:#111e30 !important}.chain-goal.lit{color:#fff !important;background:#7b5422 !important;border-color:#d8ad58 !important}
.gloss .row,.glossary .row{border-bottom-color:#2b3a4f !important}.gloss dt,.glossary dt{color:#edf2f7 !important}.gloss dd,.glossary dd{color:#aeb9c8 !important}.no-hit{color:#a8b4c4 !important}
.time,.timeline{border-left-color:#34465d !important}.time .ev::before,.timeline .ev::before{background:#d8ad58 !important}.time .yr,.timeline .yr{color:#e0b76b !important}.time .ttl,.timeline .ttl{color:#edf2f7 !important}.time .why,.timeline .why{color:#aeb9c8 !important}
table{background:#101c2d !important;color:#e2e9f2 !important}th{background:#1d3049 !important;color:#f2f5f8 !important}td{border-bottom-color:#2d3d52 !important}tbody tr:nth-child(even) td{background:#132137 !important}
.tbl-scroll{border-color:#2c3d52 !important}.datatable,.oral-table{background:#101c2d !important}
.atlas-map{background:#101c2d !important;border-color:#2d3d52 !important;color:#e2e9f2 !important;box-shadow:0 10px 28px rgba(0,0,0,.18) !important}
.atlas-map__head{background:linear-gradient(180deg,#17253a,#111d2e) !important;border-bottom-color:#2d3d52 !important}.atlas-map__head h4{color:#e4bd73 !important}.atlas-map__focus,.atlas-map__foot{color:#abb7c6 !important}.atlas-map__image-link,.atlas-map__image{background:#fff !important}.atlas-map__foot{border-top-color:#2d3d52 !important}
textarea:focus,.search:focus,input:focus,select:focus{outline-color:#7da3d2 !important}
.check-list li{color:#d8e0ea !important}.tips li{border-bottom-color:#2c3b4f !important}.tips b{color:#edf2f8 !important}
.gauge,.essay-gauge{background:#1d2b3e !important}.gauge .zone,.essay-gauge .zone{background:rgba(82,169,125,.28) !important}.gauge .mark,.essay-gauge .mark{background:#f0f3f7 !important}
footer{background:#07101c !important;color:#aeb8c7 !important}footer h3{color:#eef3f8 !important}.note{color:#8794a7 !important;border-top-color:#2b394c !important}
:focus-visible{outline-color:#8eb2e2 !important}

/* UI 2.3 — lágyabb sötét kurzustéma */
:root{
  --ink:#edf2f7 !important;--ink-soft:#bdc7d3 !important;--rubric:#e4bd73 !important;
  --lapis:#9fc1ed !important;--gold:#dcb360 !important;--stone:#1b2736 !important;
  --stone-2:#2a394c !important;--paper:#243244 !important;--line:#45566d !important;
  --ok:#83d4ad !important;--bad:#f29a9a !important;
}
html{background:#1b2736 !important}
body{background:#1b2736 !important;color:#edf2f7 !important}
header.masthead{
  background:radial-gradient(circle at 88% 12%,rgba(220,179,96,.15),transparent 28%),linear-gradient(145deg,#2b3a4f 0%,#233247 68%,#1d2939 100%) !important;
  border-bottom-color:#43546b !important;box-shadow:0 12px 32px rgba(7,14,24,.16) !important
}
nav.rail{background:rgba(30,43,59,.95) !important;border-bottom-color:#46576d !important;box-shadow:0 6px 18px rgba(7,14,24,.12) !important}
.rail a{color:#bac5d2 !important}.rail a:hover,.rail a.on{background:#314158 !important;color:#b8d3f2 !important}
.prog-bar,.rail-progress-track{background:#334258 !important}
section.mod,.module,body>main>section:not(.mod):not(.module){background:#243244 !important;border-color:#46586f !important;box-shadow:0 12px 30px rgba(7,14,24,.12) !important}
.mod-num,.module-num{background:#332d25 !important;border-color:#715b38 !important;color:#e4bd73 !important}
.goal,.goal-box{background:#253b52 !important;border-color:#466887 !important;border-left-color:#7fa9dc !important}
.fogodzo{background:#3a3225 !important;border-color:#76613e !important;border-left-color:#dcb360 !important;color:#efe5d4 !important}
.source,.source-box{background:#34302a !important;border-color:#655846 !important;border-left-color:#d7a65a !important;color:#eee5d8 !important}
.card,.task,.essay-tool,.essay-box,.chain-wrap,.chain-box,.kfeladat{background:#283749 !important;border-color:#4a5c73 !important;color:#e8edf4 !important;box-shadow:0 7px 18px rgba(7,14,24,.10) !important}
.chip,.pill,.sort-row select,.fill-in,.fill-input,input[type="text"],input[type="search"],textarea,.search{background:#202d3e !important;border-color:#52657d !important;color:#edf2f7 !important}
.chip:hover,.pill:hover{border-color:#8db2e0 !important;color:#d7e7f9 !important}.chip.sel,.pill.on{background:#304969 !important;border-color:#86addd !important;color:#eef6ff !important}
.btn,.task-controls button{background:#36506f !important;border-color:#587496 !important}.btn:hover,.task-controls button:hover{background:#426084 !important;border-color:#8db2e0 !important}
.answer,.answer-box,.feedback,.solution{background:#373126 !important;border-color:#745f3e !important;color:#f0e6d5 !important}
.chain-track,.chain-box .chain-track,.sort-zone{background:#202e3f !important;border-color:#53657b !important;color:#e6edf5 !important}
.chain-slot,.chain-item,.chain-box .chain-item,.chain-pool button,.chain-box button,.sort-item{background:#2d4056 !important;border-color:#6681a2 !important;color:#edf3fa !important}
.chain-slot:hover,.chain-item:hover,.chain-box .chain-item:hover,.chain-pool button:hover{background:#38516e !important;border-color:#91b5df !important}
.chain-goal{color:#b0bdcc !important;border-color:#5d7089 !important;background:#29394c !important}
table{background:#243244 !important;color:#e9eef5 !important}th{background:#344b66 !important;color:#f5f7fa !important}td{border-bottom-color:#4b5d73 !important}tbody tr:nth-child(even) td{background:#2a394d !important}
.atlas-map{background:#243244 !important;border-color:#4b5d73 !important;color:#e9eef5 !important;box-shadow:0 9px 22px rgba(7,14,24,.11) !important}
.atlas-map__head{background:linear-gradient(180deg,#314359,#28374a) !important;border-bottom-color:#4b5d73 !important}
.gauge,.essay-gauge{background:#344357 !important}
footer{background:#192433 !important;color:#bac4d0 !important}.note{color:#9aa7b7 !important;border-top-color:#44546a !important}

/* UI 2.4 — célzott kontrasztjavítások sötét módban */
.goal,.goal-box,.goal p,.goal li,.goal dd,.goal td,.goal-box p,.goal-box li,.goal-box dd,.goal-box td,.goal-box{color:#e7eef7 !important}
.goal .lbl,.goal-box .lbl{color:#b8d5f6 !important}
.goal b,.goal strong,.goal-box b,.goal-box strong{color:#f3f7fb !important}
.goal[style],.goal[style*="background"],.goal[style*="border"]{background:#3a3225 !important;border-color:#76613e !important;border-left-color:#dcb360 !important;color:#efe5d4 !important}
.goal[style] p,.goal[style] li,.goal[style] dd,.goal[style] td{color:#efe5d4 !important}
.goal[style] .lbl{color:#e7bf74 !important}
.fogodzo,.fogodzo p,.fogodzo li,.fogodzo dd,.fogodzo td{color:#efe5d4 !important}
.source,.source-box,.source p,.source li,.source dd,.source td,.source-box p,.source-box li,.source-box dd,.source-box td{color:#eee5d8 !important}
.source .src-lbl,.source-box h4,.source-box .src-lbl{color:#e7bf74 !important}
.answer,.answer-box,.feedback,.solution,.answer p,.answer li,.answer-box p,.answer-box li,.feedback p,.solution p{color:#f0e6d5 !important}
.task,.task p,.task li,.task dd,.task td,.essay-tool,.essay-tool p,.essay-tool li,.essay-box,.essay-box p,.essay-box li,.chain-wrap,.chain-wrap p,.chain-wrap li,.chain-box,.chain-box p,.chain-box li{color:#e8edf4 !important}
.chain-wrap .src-lbl,.chain-box .src-lbl,.task-id{color:#e4bd73 !important}

table td,.datatable td,.oral-table td{color:#e9eef5 !important;background:#243244 !important;border-bottom-color:#4b5d73 !important}
table td strong,.datatable td strong,.oral-table td strong{color:#f6f8fb !important}
tbody tr:nth-child(even) td{background:#2a394d !important}
table caption,.datatable caption{color:#c6d1de !important}

.gloss dd,.glossary dd,.time .why,.timeline .why,.tips li,.tips-list li,.essay-topics li,.check-list li{color:#dce5ef !important}
.fill-in,.fill-input,input[type="text"],input[type="search"],select,textarea,.search{color:#edf2f7 !important}
::placeholder{color:#aeb9c8 !important;opacity:1 !important}

`;

function applyUnifiedTheme(html){return html;}

function syncThemeToggle(){
  const b=document.getElementById('themeToggle');
  if(!b)return;
  b.setAttribute('aria-pressed',unifiedTheme?'true':'false');
  const t=b.querySelector('.theme-text');
  if(t)t.textContent=unifiedTheme?'Egységes dizájn':'Eredeti dizájn';
  b.title=unifiedTheme?'Egységes belső dizájn aktív — kattints az eredeti nézethez':'Eredeti belső dizájn — kattints az egységes nézethez';
}

document.getElementById('themeToggle')?.addEventListener('click',()=>{
  unifiedTheme=!unifiedTheme;
  window.TEM_COURSE_FRAME?.setCourseTheme(appTheme,unifiedTheme);
  syncThemeToggle();
});


/* ---------- UI 2.1: alkalmazás sötét / világos mód ---------- */
const APP_THEME_KEY='tortenelem-erettsegi-muhely-ui-theme-v1';
let appTheme=(()=>{try{const v=localStorage.getItem(APP_THEME_KEY);return v==='light'?'light':'dark';}catch(_){return 'dark';}})();

function syncAppThemeButtons(){
  const isDark=appTheme==='dark';
  document.querySelectorAll('[data-app-theme-toggle]').forEach(btn=>{
    const nextLabel=isDark?'Világos mód':'Sötét mód';
    const title=isDark?'Világos mód bekapcsolása':'Sötét mód bekapcsolása';
    btn.setAttribute('aria-label',title);btn.title=title;
    const icon=btn.querySelector('.app-theme-icon');if(icon)icon.textContent=isDark?'☀':'☾';
    const text=btn.querySelector('.app-theme-text');if(text)text.textContent=nextLabel;
  });
}
function syncFrameColorTheme(){window.TEM_COURSE_FRAME?.setCourseTheme(appTheme,unifiedTheme);}

function applyAppTheme(theme,persist=true){
  appTheme=theme==='light'?'light':'dark';
  document.documentElement.dataset.appTheme=appTheme;
  document.documentElement.style.colorScheme=appTheme;
  if(persist){try{localStorage.setItem(APP_THEME_KEY,appTheme);}catch(_){}}
  syncAppThemeButtons();syncFrameColorTheme();
}
document.querySelectorAll('[data-app-theme-toggle]').forEach(btn=>btn.addEventListener('click',()=>applyAppTheme(appTheme==='dark'?'light':'dark')));
applyAppTheme(appTheme,false);

/* ---------- Mobil navigáció: kompakt, összecsukható vezérlőpanel ---------- */
const mobileSidebar=document.getElementById('sidebar');
const mobileMenuToggle=document.getElementById('mobileMenuToggle');
function setMobileMenu(open){
  const expanded=Boolean(open)&&matchMedia('(max-width:800px)').matches;
  mobileSidebar?.classList.toggle('mobile-menu-open',expanded);
  mobileMenuToggle?.setAttribute('aria-expanded',expanded?'true':'false');
  if(mobileMenuToggle){mobileMenuToggle.setAttribute('aria-label',expanded?'Mobil navigáció bezárása':'Mobil navigáció megnyitása');mobileMenuToggle.textContent=expanded?'×':'☰';}
}
mobileMenuToggle?.addEventListener('click',()=>setMobileMenu(mobileMenuToggle.getAttribute('aria-expanded')!=='true'));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobileMenuToggle?.getAttribute('aria-expanded')==='true'){setMobileMenu(false);mobileMenuToggle.focus();}});
matchMedia('(max-width:800px)').addEventListener('change',event=>{if(!event.matches)setMobileMenu(false);});


const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const dashboardLogic=window.TEM_DASHBOARD_LOGIC;

/* ---------- Helyi tanulói állapot ---------- */
const STORAGE_KEY='tortenelem-erettsegi-muhely-ui2-progress-v1';
const CLOUD_CACHE_PREFIX='tortenelem-erettsegi-muhely-cloud-v1:';
const stateDefaults={version:4,lastCourseId:null,favorites:[],favoriteUpdatedAt:{},courses:{}};
let activeStorageKey=STORAGE_KEY;
let appState=loadAppState();
let dashboardFilter='all';
let progressViewFilter='all';
let dashboardAuthenticated=false;
let dashboardCloudLoading=false;
let dashboardError='';
let dashboardMode='home';
let frameTrackingCleanup=null;
let saveTimer=null;

function normalizeAppState(saved){
  return dashboardLogic.normalizeState(saved,courses);
}
function courseIndexById(courseId){return dashboardLogic.courseIndexById(courses,courseId);}
function courseById(courseId){const index=courseIndexById(courseId);return index>=0?courses[index]:null;}
function courseIdAtIndex(index){return dashboardLogic.courseIdAtIndex(courses,index);}
function loadAppState(key=activeStorageKey){
  try{
    const raw=localStorage.getItem(key);
    if(!raw)return JSON.parse(JSON.stringify(stateDefaults));
    return normalizeAppState(JSON.parse(raw));
  }catch(_){return JSON.parse(JSON.stringify(stateDefaults));}
}
function saveAppState(immediate=false){
  const write=()=>{try{localStorage.setItem(activeStorageKey,JSON.stringify(appState));}catch(_){}};
  if(immediate){clearTimeout(saveTimer);write();return;}
  clearTimeout(saveTimer);saveTimer=setTimeout(write,180);
}
function setActiveAppState(next,key=STORAGE_KEY){
  activeStorageKey=key;
  appState=normalizeAppState(next||stateDefaults);
  saveAppState(true);
  refreshChrome();renderDashboard();
}
function queueCloudCourse(courseId){
  try{window.TEM_CLOUD?.queueCourse?.(courseId);}catch(_){}
}
function touchCourse(index){
  const s=getCourseState(index);s.updatedAt=Date.now();queueCloudCourse(courseIdAtIndex(index));return s;
}
function courseKey(index){return String(courses[index]?.id);}
function getCourseState(index){
  const key=courseKey(index);
  if(!appState.courses[key])appState.courses[key]={visited:false,maxRead:0,lastRead:0,completed:false,lastOpened:0,sectionId:null,scrollPosition:0,updatedAt:0,completedAt:null,drafts:{}};
  const s=appState.courses[key];
  if(!s.drafts || typeof s.drafts!=='object')s.drafts={};
  s.maxRead=Math.max(0,Math.min(100,Number(s.maxRead)||0));
  s.lastRead=Math.max(0,Math.min(100,Number(s.lastRead)||0));
  s.scrollPosition=Math.max(0,Math.round(Number(s.scrollPosition)||0));
  s.sectionId=typeof s.sectionId==='string'&&s.sectionId.length<=200?s.sectionId:null;
  s.updatedAt=Math.max(0,Number(s.updatedAt)||Number(s.lastOpened)||0);
  s.completedAt=s.completed?(Number(s.completedAt)||Number(s.updatedAt)||Date.now()):null;
  return s;
}
function isFavorite(index){return appState.favorites.includes(courses[index].id);}
function setFavorite(index,on){
  const id=courses[index].id;
  appState.favorites=appState.favorites.filter(x=>x!==id);
  if(on)appState.favorites.push(id);
  appState.favoriteUpdatedAt[String(id)]=Date.now();
  queueCloudCourse(id);
  saveAppState();refreshChrome();renderDashboard();
}
function courseProgress(index){
  const s=getCourseState(index);
  return s.completed?100:Math.round(s.maxRead||0);
}
function courseStatus(index){
  const s=getCourseState(index);
  if(s.completed)return {key:'complete',label:'Befejezett'};
  if(s.visited)return {key:'started',label:'Folyamatban'};
  return {key:'new',label:'Nincs elkezdve'};
}
function formatDate(ts){
  try{return dashboardLogic.formatHungarianDate(ts);}
  catch(_){return '';}
}

/* ---------- Kurzuslista ---------- */
courses.forEach((course,index)=>{
  const button=document.createElement('button');
  button.type='button';
  button.className='course';
  button.dataset.courseId=String(course.id);
  button.dataset.search=normalize(course.label+' '+course.period+' '+(course.keywords||''));
  const n=String(index+1).padStart(2,'0');
  button.innerHTML='<span class="course__icon" aria-hidden="true">'+escapeHtml(course.icon)+'</span><span><span class="course__title">'+n+' · '+escapeHtml(course.label)+'</span><span class="course__period">'+escapeHtml(course.period)+'</span></span><span class="course__status" aria-hidden="true"><span class="course__favorite"></span><span class="course__state"></span></span>';
  button.addEventListener('click',()=>showCourseById(course.id));
  list.appendChild(button);

  const option=document.createElement('option');
  option.value=String(course.id);
  option.textContent=n+' · '+course.label;
  select.appendChild(option);
});

select.addEventListener('change',()=>{showCourseById(select.value);setMobileMenu(false);});
document.getElementById('previous').addEventListener('click',()=>showCourseById(courseIdAtIndex(current-1)));
document.getElementById('next').addEventListener('click',()=>showCourseById(courseIdAtIndex(current+1)));
document.getElementById('homeButton').addEventListener('click',showHome);
document.getElementById('sidebarHome').addEventListener('click',()=>{showHome();setMobileMenu(false);});

document.getElementById('favoriteToggle').addEventListener('click',()=>setFavorite(current,!isFavorite(current)));
document.getElementById('completeToggle').addEventListener('click',()=>{
  const s=getCourseState(current);s.completed=!s.completed;if(s.completed){s.maxRead=100;s.completedAt=Date.now();}else{s.completedAt=null;}touchCourse(current);
  saveAppState();refreshChrome();renderDashboard();
});

document.getElementById('continueButton').addEventListener('click',()=>{
  if(!showCourseById(appState.lastCourseId))showCourseById(courseIdAtIndex(0));
});
document.getElementById('browseFavorites').addEventListener('click',()=>{
  dashboardFilter='favorites';setDashboardFilterButtons();renderDashboardCourses();
  document.getElementById('dashboardGrid')?.scrollIntoView({behavior:'smooth',block:'start'});
});
document.getElementById('dashboardFilters').addEventListener('click',event=>{
  const b=event.target.closest('[data-filter]');if(!b)return;
  dashboardFilter=b.dataset.filter;setDashboardFilterButtons();renderDashboardCourses();
});
document.getElementById('progressFilters').addEventListener('click',event=>{
  const b=event.target.closest('[data-progress-filter]');if(!b)return;
  progressViewFilter=b.dataset.progressFilter;renderProgressView();
});
document.getElementById('backToDashboard').addEventListener('click',showDashboardHome);
document.getElementById('resetProgress').addEventListener('click',()=>{
  if(window.TEM_CLOUD?.isAuthenticated?.()){window.TEM_CLOUD.deleteAll();return;}
  if(!confirm('Biztosan törlöd az összes mentett haladást, kurzusjelölést és esszévázlatot ezen a böngészőn?'))return;
  appState=JSON.parse(JSON.stringify(stateDefaults));
  saveAppState(true);refreshChrome();renderDashboard();
});

search?.addEventListener('input',()=>{
  const q=normalize(search.value.trim());
  dashboardQuery=q;
  let visible=0;
  document.querySelectorAll('.course').forEach(button=>{
    const hit=!q || button.dataset.search.includes(q);
    button.hidden=!hit;
    if(hit)visible++;
  });
  count.textContent=visible+' / '+courses.length;
  empty.classList.toggle('show',visible===0);
  renderDashboardCourses();
});

/* ---------- Dashboard ---------- */
function setDashboardFilterButtons(){
  document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===dashboardFilter));
}
function courseActivityTime(index){
  const state=getCourseState(index);return Math.max(Number(state.lastOpened)||0,Number(state.updatedAt)||0,Number(state.completedAt)||0);
}
function latestCourseIndex(predicate=()=>true){
  return courses.map((_,index)=>index).filter(predicate).sort((a,b)=>courseActivityTime(b)-courseActivityTime(a)||a-b)[0] ?? null;
}
function setDashboardCloudState({authenticated=dashboardAuthenticated,loading=false,error=''}={}){
  dashboardAuthenticated=Boolean(authenticated);dashboardCloudLoading=Boolean(loading);dashboardError=String(error||'');
  if(!dashboardAuthenticated&&(dashboardMode==='progress'||dashboardMode==='materials'))dashboardMode='home';
  renderDashboard();
}
function setDashboardMode(mode,focus=false){
  dashboardMode=(mode==='progress'||mode==='materials')&&dashboardAuthenticated?mode:'home';
  const inner=document.querySelector('.dashboard__inner'),progress=document.getElementById('progressView'),materials=document.getElementById('materialsView');
  inner?.classList.toggle('progress-mode',dashboardMode==='progress');
  inner?.classList.toggle('materials-mode',dashboardMode==='materials');
  progress.hidden=dashboardMode!=='progress';
  materials.hidden=dashboardMode!=='materials';
  if(focus&&dashboardMode!=='home'){
    const heading=document.getElementById(dashboardMode==='progress'?'progressViewHeading':'materialsViewHeading');heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});
  }
}
function showDashboardHome(){
  setDashboardMode('home');history.replaceState(null,'','#home');renderDashboard();
  document.querySelector('.dashboard__scroll')?.scrollTo({top:0,behavior:'smooth'});
}
function showProgressView(){
  if(!dashboardAuthenticated){showDashboardHome();return;}
  setDashboardMode('progress',true);history.replaceState(null,'','#progress');renderProgressView();
  document.querySelector('.dashboard__scroll')?.scrollTo({top:0,behavior:'smooth'});
}
function showMaterialsView(){
  if(!dashboardAuthenticated){showDashboardHome();return;}
  setDashboardMode('materials',true);history.replaceState(null,'','#materials');window.TEM_ANNOTATIONS?.render?.();
  document.querySelector('.dashboard__scroll')?.scrollTo({top:0,behavior:'smooth'});
}
function renderDashboard(){
  const states=courses.map((_,i)=>getCourseState(i));
  const summary=dashboardLogic.summarize(states.map((state,index)=>({...state,progress:courseProgress(index)})),courses.length);
  document.getElementById('statStarted').textContent=summary.inProgress;
  document.getElementById('statCompleted').textContent=summary.completed;
  document.getElementById('statNotStarted').textContent=summary.notStarted;
  document.getElementById('statProgress').textContent=summary.aggregate+'%';
  document.getElementById('overallProgressText').textContent='Összesített haladás: '+summary.aggregate+'%';
  document.getElementById('overallProgressFill').style.width=summary.aggregate+'%';
  document.getElementById('overallProgress').setAttribute('aria-valuenow',String(summary.aggregate));

  const loading=document.getElementById('dashboardLoading'),message=document.getElementById('dashboardMessage');
  loading.hidden=!dashboardCloudLoading;
  message.hidden=!dashboardError;message.textContent=dashboardError;message.dataset.state=dashboardError?'error':'';
  document.getElementById('dashboardOverview').hidden=dashboardAuthenticated&&dashboardCloudLoading;
  document.getElementById('continueSection').hidden=dashboardAuthenticated&&dashboardCloudLoading;
  document.getElementById('personalDashboard').hidden=!dashboardAuthenticated||dashboardCloudLoading;

  const last=latestCourseIndex(index=>getCourseState(index).visited||getCourseState(index).completed);
  const continueButton=document.getElementById('continueButton');
  const card=document.getElementById('continueCard');
  if(last===null){
    continueButton.textContent='Kezdés az első kurzussal';
    card.innerHTML='<div><div class="continue-card__eyebrow">Első lépés</div><h4>Még nem kezdtél el kurzust.</h4><p>Válaszd ki az első témakört, vagy böngéssz az összes kurzus között.</p></div><button class="dash-primary" type="button" data-course-id="'+courseIdAtIndex(0)+'">Kurzus választása</button>';
  }else{
    const c=courses[last],s=getCourseState(last),pct=courseProgress(last);
    continueButton.textContent='Folytatás · '+String(last+1).padStart(2,'0');
    const status=courseStatus(last).label;
    card.innerHTML='<div><div class="continue-card__eyebrow">Legutóbbi kurzus</div><h4>'+String(last+1).padStart(2,'0')+' · '+escapeHtml(c.label)+'</h4><p>'+escapeHtml(status)+' · '+escapeHtml(formatDate(courseActivityTime(last)))+'</p><div class="continue-progress"><div class="mini-track" role="progressbar" aria-label="'+escapeHtml(c.label)+' kurzus '+pct+' százalékban teljesítve" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><div class="mini-fill" style="width:'+pct+'%"></div></div><span>'+pct+'%</span></div></div><button class="dash-primary" type="button" data-course-id="'+c.id+'">Folytatás</button>';
  }
  card.querySelector('[data-course-id]')?.addEventListener('click',e=>showCourseById(e.currentTarget.dataset.courseId));
  if(dashboardAuthenticated&&!dashboardCloudLoading)renderPersonalDashboard();
  setDashboardMode(dashboardMode);
  renderDashboardCourses();
  if(dashboardMode==='progress')renderProgressView();
  window.TEM_ANNOTATIONS?.render?.();
}
function renderPersonalDashboard(){
  const inProgress=courses.map((_,index)=>index).filter(index=>{const s=getCourseState(index);return s.visited&&!s.completed;}).sort((a,b)=>courseActivityTime(b)-courseActivityTime(a)||courseProgress(b)-courseProgress(a)).slice(0,5);
  const favorites=courses.map((_,index)=>index).filter(index=>isFavorite(index)).sort((a,b)=>courseActivityTime(b)-courseActivityTime(a)||a-b).slice(0,5);
  renderPersonalList('inProgressList',inProgress,'Még nincs folyamatban lévő kurzusod.');
  renderPersonalList('favoritesList',favorites,'Még nincs kedvencnek jelölt kurzusod.');

  const recent=courses.map((_,index)=>index).filter(index=>courseActivityTime(index)>0).sort((a,b)=>courseActivityTime(b)-courseActivityTime(a)).slice(0,5);
  const activity=document.getElementById('recentActivityList');activity.innerHTML='';
  if(!recent.length){const li=document.createElement('li');li.className='personal-empty';li.textContent='Még nincs mentett tanulási aktivitásod.';activity.appendChild(li);}
  recent.forEach(index=>{const li=document.createElement('li'),pct=courseProgress(index),status=getCourseState(index).completed?'Befejezve':pct+'%';li.innerHTML='<strong>'+escapeHtml(courses[index].label)+'</strong><span>'+escapeHtml(status)+' · '+escapeHtml(formatDate(courseActivityTime(index)))+'</span>';activity.appendChild(li);});

  const recommendationResult=getRecommendation(),recommendation=courseIndexById(recommendationResult?.courseId);
  const recommendationCard=document.getElementById('recommendationCard');
  const progress=recommendation<0?0:courseProgress(recommendation);
  let reason='A következő még nem kezdett kurzus a kronologikus sorrendben.';
  if(recommendationResult?.reason==='recent')reason='Ezt tanultad legutóbb.';
  if(recommendationResult?.reason==='progress')reason='Ezt a kurzust már '+progress+'%-ban teljesítetted.';
  recommendationCard.innerHTML=recommendation<0?'<div><h4>Minden kurzust befejeztél.</h4><p>A teljes tananyag elkészült.</p></div>':'<div><h4>'+String(recommendation+1).padStart(2,'0')+' · '+escapeHtml(courses[recommendation].label)+'</h4><p>'+escapeHtml(reason)+'</p></div><button class="dash-primary" type="button">'+(progress>0?'Folytatás':'Kurzus megnyitása')+'</button>';
  recommendationCard.querySelector('button')?.addEventListener('click',()=>showCourseById(recommendationResult.courseId));
}
function getRecommendation(){
  return dashboardLogic.recommendation(courses.map((course,index)=>{const state=getCourseState(index);return {courseId:Number(course.id),index,visited:state.visited,completed:state.completed,progress:courseProgress(index),lastOpened:state.lastOpened,updatedAt:state.updatedAt,completedAt:state.completedAt};}));
}
function renderPersonalList(id,indexes,emptyText){
  const list=document.getElementById(id);list.innerHTML='';
  if(!indexes.length){const emptyItem=document.createElement('div');emptyItem.className='personal-empty';emptyItem.textContent=emptyText;list.appendChild(emptyItem);return;}
  indexes.forEach(index=>{const item=document.createElement('article'),pct=courseProgress(index),course=courses[index];item.className='personal-list-card';item.innerHTML='<div class="personal-list-card__copy"><strong>'+escapeHtml(course.label)+'</strong><span>'+pct+'% · '+escapeHtml(formatDate(courseActivityTime(index)))+'</span></div><button type="button" aria-label="'+escapeHtml(course.label)+' folytatása">Folytatás</button>';item.querySelector('button').addEventListener('click',()=>showCourseById(course.id));list.appendChild(item);});
}
function renderProgressView(){
  document.querySelectorAll('[data-progress-filter]').forEach(button=>button.classList.toggle('active',button.dataset.progressFilter===progressViewFilter));
  const grid=document.getElementById('progressViewGrid'),emptyView=document.getElementById('progressViewEmpty');grid.innerHTML='';let shown=0;
  courses.forEach((course,index)=>{const state=getCourseState(index),favorite=isFavorite(index);const match=progressViewFilter==='all'||(progressViewFilter==='started'&&state.visited&&!state.completed)||(progressViewFilter==='completed'&&state.completed)||(progressViewFilter==='new'&&!state.visited&&!state.completed)||(progressViewFilter==='favorites'&&favorite);if(!match)return;grid.appendChild(createCourseCard(index));shown++;});
  emptyView.classList.toggle('show',shown===0);
}
function createCourseCard(index){
  const course=courses[index],s=getCourseState(index),fav=isFavorite(index),status=courseStatus(index),pct=courseProgress(index);
  const card=document.createElement('article');card.className='dashboard-course'+(s.completed?' complete':'');
  card.innerHTML='<div class="dashboard-course__top"><div class="dashboard-course__id"><span class="dashboard-course__icon" aria-hidden="true">'+escapeHtml(course.icon)+'</span><span class="dashboard-course__num">Kurzus '+String(index+1).padStart(2,'0')+'</span></div><button class="favorite-btn'+(fav?' active':'')+'" type="button" aria-label="'+escapeHtml(course.label)+(fav?' eltávolítása a kedvencek közül':' hozzáadása a kedvencekhez')+'" aria-pressed="'+(fav?'true':'false')+'" title="'+(fav?'Jelölés eltávolítása':'Kurzus megjelölése')+'">★</button></div><h4>'+escapeHtml(course.label)+'</h4><div class="dashboard-course__period">'+escapeHtml(course.period)+'</div><div class="dashboard-course__bottom"><div class="dashboard-course__statusrow"><span class="status-label '+escapeHtml(status.key)+'">'+escapeHtml(status.label)+'</span><span class="dashboard-course__pct">'+pct+'%</span></div><div class="dashboard-course__track" role="progressbar" aria-label="'+escapeHtml(course.label)+' kurzus '+pct+' százalékban teljesítve" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><div class="dashboard-course__fill" style="width:'+pct+'%"></div></div><div class="dashboard-course__actions"><button class="dashboard-course__open" type="button">'+(s.visited?'Megnyitás / folytatás':'Kurzus megnyitása')+'</button></div></div>';
  card.querySelector('.favorite-btn').addEventListener('click',()=>setFavorite(index,!fav));card.querySelector('.dashboard-course__open').addEventListener('click',()=>showCourseById(course.id));return card;
}
function renderDashboardCourses(){
  const grid=document.getElementById('dashboardGrid');
  const emptyDash=document.getElementById('dashboardEmpty');
  grid.innerHTML='';
  let shown=0;
  courses.forEach((course,index)=>{
    const s=getCourseState(index),fav=isFavorite(index);
    const match=dashboardFilter==='all'||
      (dashboardFilter==='started'&&s.visited&&!s.completed)||
      (dashboardFilter==='favorites'&&fav)||
      (dashboardFilter==='completed'&&s.completed);
    const queryMatch=!dashboardQuery||normalize(course.label+' '+course.period+' '+(course.keywords||'')).includes(dashboardQuery);
    if(!match||!queryMatch)return;shown++;
    grid.appendChild(createCourseCard(index));
  });
  emptyDash.classList.toggle('show',shown===0);
}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}

/* ---------- Kurzuson belüli mentés ---------- */
function applyFrameSnapshot(data){
  if(document.getElementById('viewer').classList.contains('home-mode')||!data)return;
  const s=getCourseState(current);
  const ratio=Math.max(0,Math.min(100,Number(data.lastRead)||0));
  s.lastRead=ratio;s.maxRead=Math.max(s.maxRead,ratio);s.lastOpened=Date.now();s.visited=true;
  s.scrollPosition=Math.max(0,Math.round(Number(data.scrollPosition)||0));s.sectionId=data.sectionId||null;
  if(data.drafts&&typeof data.drafts==='object')s.drafts={...data.drafts};
  touchCourse(current);saveAppState();updateReadProgressUI();refreshSidebarStates();
}
function captureFrameProgress(){window.TEM_COURSE_FRAME?.flushCourseProgress();}
window.TEM_COURSE_FRAME?.on('progress',applyFrameSnapshot);
window.TEM_COURSE_FRAME?.on('draft-change',data=>{const s=getCourseState(current);if(data.drafts&&typeof data.drafts==='object'){s.drafts={...data.drafts};touchCourse(current);saveAppState();}});
function attachFrameTracking(){}

/* ---------- Nézet és navigáció ---------- */
function refreshSidebarStates(){
  document.querySelectorAll('.course').forEach((button,index)=>{
    const fav=button.querySelector('.course__favorite');
    const badge=button.querySelector('.course__state');
    const s=getCourseState(index),status=courseStatus(index),pct=courseProgress(index);
    if(fav)fav.textContent=isFavorite(index)?'★':'';
    if(badge){
      badge.className='course__state '+(s.completed?'complete':(s.visited?'started':''));
      badge.textContent=s.completed?'✓':(s.visited?Math.max(1,Math.round(pct/10)):0||'');
      badge.title=s.completed?'Befejezett':(s.visited?pct+'% olvasási haladás':'Nincs elkezdve');
    }
    button.setAttribute('aria-label',String(index+1)+'. '+courses[index].label+', '+status.label+(isFavorite(index)?', megjelölt':''));
  });
}
function updateReadProgressUI(){
  const pct=courseProgress(current);
  document.getElementById('readProgressFill').style.width=pct+'%';
  document.getElementById('readProgressText').textContent=pct+'%';
  document.getElementById('readProgress').setAttribute('aria-valuenow',String(pct));
}
function refreshChrome(){
  refreshSidebarStates();
  const fav=document.getElementById('favoriteToggle'),done=document.getElementById('completeToggle');
  if(fav){fav.setAttribute('aria-pressed',isFavorite(current)?'true':'false');fav.title=isFavorite(current)?'Kurzusjelölés eltávolítása':'Kurzus megjelölése';}
  const s=getCourseState(current);
  if(done){done.setAttribute('aria-pressed',s.completed?'true':'false');done.title=s.completed?'Befejezett jelölés visszavonása':'Kurzus késznek jelölése';}
  updateReadProgressUI();
}
function showHome(){
  captureFrameProgress();
  setDashboardMode('home');
  document.getElementById('viewer').classList.add('home-mode');
  document.getElementById('sidebarHome').setAttribute('aria-current','page');
  document.querySelectorAll('.course').forEach(b=>b.setAttribute('aria-current','false'));
  history.replaceState(null,'','#home');
  renderDashboard();refreshSidebarStates();
  if(window.TEM_CLOUD?.isAuthenticated?.())setTimeout(()=>window.TEM_CLOUD?.refresh?.(),0);
}
function show(index){
  if(index<0||index>=courses.length)return;
  captureFrameProgress();
  current=index;
  const course=courses[index],s=getCourseState(index);
  s.visited=true;s.lastOpened=Date.now();appState.lastCourseId=Number(course.id);touchCourse(index);saveAppState();
  document.getElementById('viewer').classList.remove('home-mode');
  document.getElementById('sidebarHome').removeAttribute('aria-current');
  document.querySelectorAll('.course').forEach((button,i)=>button.setAttribute('aria-current',i===index?'true':'false'));
  select.value=String(course.id);
  document.getElementById('currentTitle').textContent=course.label;
  currentIndex.textContent=String(index+1).padStart(2,'0');
  positionText.textContent=(index+1)+' / '+courses.length;
  positionFill.style.width=(((index+1)/courses.length)*100)+'%';
  document.getElementById('previous').disabled=index===0;
  document.getElementById('next').disabled=index===courses.length-1;
  frame.title=course.label;
  window.TEM_COURSE_FRAME.loadCourseFrame(course,{theme:appTheme,unifiedTheme,restore:{scrollPosition:s.scrollPosition,sectionId:s.sectionId,drafts:s.drafts}});
  syncThemeToggle();refreshChrome();renderDashboard();
  history.replaceState(null,'','#'+course.id);
  document.querySelector('.course[aria-current="true"]')?.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function showCourseById(courseId){const index=courseIndexById(courseId);if(index<0)return false;show(index);return true;}

/* ---------- PWA telepítés és frissítés ---------- */
const installButton=document.getElementById('installApp');
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  installButton.hidden=false;
});
installButton.addEventListener('click',async()=>{
  if(!deferredInstallPrompt)return;
  installButton.disabled=true;
  await deferredInstallPrompt.prompt();
  try{await deferredInstallPrompt.userChoice;}catch(_){}
  deferredInstallPrompt=null;
  installButton.hidden=true;
  installButton.disabled=false;
});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;installButton.hidden=true;});
if('serviceWorker' in navigator){
  const registerServiceWorker=()=>navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch(()=>{});
  if(document.readyState==='complete')registerServiceWorker();
  else window.addEventListener('load',registerServiceWorker,{once:true});
}

window.addEventListener('keydown',event=>{
  if(event.key==='Escape' && !document.getElementById('viewer').classList.contains('home-mode')){showHome();return;}
  if(event.target && /INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
  if(event.altKey && event.key==='ArrowLeft')showCourseById(courseIdAtIndex(current-1));
  if(event.altKey && event.key==='ArrowRight')showCourseById(courseIdAtIndex(current+1));
  if(event.altKey && (event.key==='Home'||event.key.toLowerCase()==='h'))showHome();
});
window.addEventListener('beforeunload',()=>{captureFrameProgress();saveAppState(true);});
window.addEventListener('hashchange',()=>{
  const h=location.hash.slice(1);
  if(h==='progress'){showProgressView();return;}
  if(h==='materials'){showMaterialsView();return;}
  if(h==='home'||!h){showHome();return;}
  showCourseById(h);
});



/* Induló nézet: közvetlen #N link nyisson kurzust, egyébként kezdőoldal. */
refreshSidebarStates();renderDashboard();
const initialHash=location.hash.slice(1);
const initialCourseId=dashboardLogic.courseIdFromHash(initialHash,courses);
const cloudAuthHash=/(^|&)access_token=/.test(initialHash)||/(^|&)refresh_token=/.test(initialHash)||/(^|&)type=(signup|recovery|magiclink)(?:&|$)/.test(initialHash);
if(initialCourseId!==null)showCourseById(initialCourseId);
else if(initialHash==='progress')showProgressView();
else if(initialHash==='materials')showMaterialsView();
else if(cloudAuthHash){setDashboardMode('home');renderDashboard();}
else showHome();

window.TEM_APP={
  courses,
  guestStorageKey:STORAGE_KEY,
  cloudCachePrefix:CLOUD_CACHE_PREFIX,
  emptyState:()=>JSON.parse(JSON.stringify(stateDefaults)),
  loadState:key=>loadAppState(key),
  getState:()=>appState,
  setState:(next,key)=>setActiveAppState(next,key),
  getCourseState,
  save:immediate=>saveAppState(Boolean(immediate)),
  refresh:()=>{refreshChrome();renderDashboard();},
  showHome,
  showProgressView,
  showMaterialsView,
  showCourse:show,
  showCourseById,
  courseIndexById,
  courseById,
  courseIdAtIndex,
  getCurrentCourseId:()=>courseIdAtIndex(current),
  getCourseStateById:courseId=>{const index=courseIndexById(courseId);return index>=0?getCourseState(index):null;},
  getCurrentIndex:()=>current,
  getFrame:()=>frame,
  courseFrame:window.TEM_COURSE_FRAME,
  setDashboardCloudState,
  setFilter:value=>{dashboardFilter=value;setDashboardFilterButtons();renderDashboardCourses();},
  scrollToProgress:()=>document.querySelector('.dashboard-stats')?.scrollIntoView({behavior:'smooth',block:'start'})
};
window.dispatchEvent(new Event('tem-app-ready'));

})();
