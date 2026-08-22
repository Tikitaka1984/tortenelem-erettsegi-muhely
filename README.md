# Történelem Érettségi Műhely — WEB 1.1

## Verziók és baseline

- **WEB 1.0 production baseline:** `d5414ce5cbe21fa38ff28666ef16422dcff0ed8a`
- **WEB 1.1 sprint:** telepíthető PWA, offline alkalmazáskeret és verziózott helyi haladáskövetés.
- A WEB 1.0 változat a Git-előzményekből teljes egészében visszakereshető; a 32 kurzus oktatási tartalma a WEB 1.1 fejlesztésben nem változott.

## Mi ez?
Ez a mappa a "Történelem Érettségi Műhely" alkalmazás **teljes, működő, Vercelre telepíthető** változata:
mind a 32 kurzus, optimalizált (átlagosan kicsinyített, tömörített) képekkel.

Az eredeti 45,8 MB-os, egyetlen fájlba ágyazott bemutatóhoz képest a fő változás:
- A 32 kurzus és a 62 kép **külön fájlokba** került (nem egy hatalmas JSON-tömbbe ágyazva).
- A kezdőlap (`index.html`) a kurzusokat **csak megnyitáskor**, egyenként tölti be (`fetch`),
  nem induláskor egyben — ez drasztikusan lecsökkenti a kezdeti betöltési méretet és időt.
- A képek 900px szélességre és kb. 52%-os WebP minőségre lettek újrakódolva,
  ezzel a képek mérete kb. 30,6 MB → 5,2 MB-ra csökkent.
- Javítva lett két korábbi felületi hiba is: a lábléc és a fejléc most helyesen 32 kurzust mutat
  (korábban "01–24" és "28 témakör" szerepelt egy 32 kurzusos verzióban).

Teljes méret: kb. 8,3 MB (a dokumentációval és PWA-előkészítéssel együtt 101 fájl) — a korábbi 45,8 MB helyett.

## Mappa-szerkezet
```
index.html            → a shell alkalmazás (navigáció, keresés, kedvencek, haladáskövetés)
course-meta.json       → a 32 kurzus metaadata (cím, korszak, ikon, fájlnév)
courses/*.html          → a 32 kurzus teljes tartalma, külön fájlokban
images/*.webp           → az összes beágyazott kép, optimalizált méretben
vercel.json (ha hiányzik, lásd lent) → egyszerű statikus-oldal beállítás
manifest.webmanifest  → webalkalmazás-metaadatok és ikonkapcsolat
favicon.svg           → böngészőikon és PWA-ikon alaphelye
icons/*.png           → 192×192, 512×512 és maskable production appikonok
service-worker.js     → verziózott offline alkalmazáskeret és runtime cache
AUDIT-JELENTES.md     → a WEB 1.0 production-ready ellenőrzés eredménye
```

## Telepítés Vercelre — 2 lehetőség

### A) Vercel CLI-vel (leggyorsabb, git nélkül)
1. Telepítsd a Vercel CLI-t, ha még nincs: `npm i -g vercel`
2. Nyiss terminált ebben a mappában, és futtasd: `vercel --prod`
3. Kövesd a bejelentkezési/projektnév-kérdéseket — a CLI automatikusan felismeri, hogy statikus oldalról van szó.

### B) GitHub + Vercel Dashboard (a megszokott munkafolyamatod)
1. Hozz létre egy új GitHub repót (pl. `tortenelem-erettsegi-muhely`), és told fel ezt a mappát:
   ```
   git init
   git add .
   git commit -m "Történelem Érettségi Műhely — telepítésre kész"
   git branch -M main
   git remote add origin https://github.com/<felhasznalonev>/tortenelem-erettsegi-muhely.git
   git push -u origin main
   ```
2. A Vercel Dashboardon: **Add New → Project → Import Git Repository**, válaszd ki a repót.
3. Framework Preset: **Other** (statikus oldal, nincs build lépés szükséges).
4. Deploy — kész is.

Mindkét esetben a végeredmény egy éles URL (pl. `https://tortenelem-erettsegi-muhely.vercel.app`),
amit a diákok közvetlenül böngészőben megnyithatnak, telefonon is.

## Amit érdemes tudni utólag
- A haladás, kedvencek és esszévázlatok **a diák saját böngészőjében**, helyben (localStorage) mentődnek —
  nincs szükség szerverre vagy adatbázisra ehhez.
- Ha egy kurzus tartalmát később módosítod, elég a megfelelő `courses/*.html` fájlt cserélni,
  nem kell az egész oldalt újraépíteni.
- Ha új kurzust adsz hozzá: tedd be a HTML fájlt a `courses/` mappába, és vedd fel a bejegyzést
  a `course-meta.json`-ba (id, source, label, period, icon).

## WEB 1.1 – PWA és haladáskövetés

### Telepíthetőség és offline működés

- A manifest önálló alkalmazásmódot, alkalmazásazonosítót, scope-ot, kezdő URL-t és valódi PNG-ikonokat tartalmaz.
- A service worker az alkalmazáskeretet, a metaadatot, a manifesztet és az ikonokat előre gyorsítótárazza.
- A kurzusok és képeik csak megnyitáskor kerülnek a runtime cache-be; a teljes, több megabájtos tananyag nem töltődik le automatikusan.
- A kezdőoldal offline is betöltődik. Egy még nem mentett kurzus offline megnyitásakor magyar, felhasználóbarát tájékoztatás jelenik meg.
- Új cache-verzió aktiválásakor a korábbi `tem-web-*` cache-ek automatikusan törlődnek.
- Támogatott Chromium böngészőben a kezdőoldalon diszkrét **Telepítés** gomb jelenik meg. iOS-en a telepítés a böngésző megosztási menüjéből végezhető el; automatikus promptot az alkalmazás nem ígér.

### Helyi tanulói állapot

- Kulcs: `tortenelem-erettsegi-muhely-ui2-progress-v1`
- Sémaverzió: `version: 1`
- Gyökérmezők: `lastCourse`, `favorites`, `courses`.
- Kurzusállapot: `visited`, `maxRead`, `lastRead`, `completed`, `lastOpened`, `drafts`.
- A haladás a legnagyobb elért görgetési arányból számolódik; a **Befejezve** kézi jelölés 100%-ot jelent.
- A **Folytatás** funkció a legutóbbi kurzust nyitja meg, majd visszaállítja a mentett olvasási pozíció közelét.
- A reset kizárólag az alkalmazás saját haladási kulcsát állítja alaphelyzetbe; más webhelyadatot nem érint.

### Ismert korlátozások

- A tanulási adatok eszköz- és böngészőprofil-specifikusak, felhőbe nem szinkronizálódnak.
- Egy kurzus csak az első online megnyitás után érhető el offline.
- A böngészők PWA-telepítési felülete platformonként eltérő.
