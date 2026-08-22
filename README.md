# Történelem Érettségi Műhely — telepítésre kész csomag

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
