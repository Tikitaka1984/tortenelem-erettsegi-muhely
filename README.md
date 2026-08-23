# Történelem Érettségi Műhely — WEB 1.4

## Verziók és baseline

- **WEB 1.0 production baseline:** `d5414ce5cbe21fa38ff28666ef16422dcff0ed8a`
- **WEB 1.1 sprint:** telepíthető PWA, offline alkalmazáskeret és verziózott helyi haladáskövetés.
- **WEB 1.2 sprint:** tanulói fiók, Supabase Auth, saját felhős haladás, többeszközös folytatás és RLS-alapú felhasználói elkülönítés.
- **WEB 1.3 sprint:** személyes tanulási dashboard, „Haladásom” nézet, folytatás, kedvencek, legutóbbi aktivitás és determinisztikus kurzusajánlás.
- **WEB 1.4 sprint:** felhős könyvjelzők, saját jegyzetek, ismétlendő jelölések és kereshető „Saját anyagaim” nézet.
- A WEB 1.0–1.3 változat a Git-előzményekből teljes egészében visszakereshető; a 32 kurzus oktatási tartalma és a 62 kép a WEB 1.4 fejlesztésben nem változott.

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
account-cloud.js      → fiókkezelés, local-first felhőszinkron és konfliktuskezelés
annotations.js        → személyes könyvjelzők, jegyzetek, ismétlendő jelölések és sajátanyag-nézet
dashboard-logic.js    → a dashboard összesítési, ajánlási és dátumformázási logikája
api/config.js         → kizárólag a nyilvános Supabase klienskonfiguráció
supabase/schema.sql   → adatmodell, triggerek, jogosultságok és RLS policy-k
vendor/               → verzióhoz rögzített Supabase böngészőkliens
AUDIT-JELENTES.md     → a WEB 1.0–1.4 production ellenőrzések eredménye
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
- Vendégmódban a haladás, kedvencek és esszévázlatok **a diák saját böngészőjében**, helyben mentődnek.
- Bejelentkezés után a kurzushaladás, kedvenc- és befejezett jelölés, valamint a folytatási pozíció a diák saját Supabase-rekordjaival szinkronizálódik. Az esszévázlat helyi adat marad.
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
- Sémaverzió: `version: 2`
- Gyökérmezők: `lastCourse`, `favorites`, `courses`.
- Kurzusállapot: `visited`, `maxRead`, `lastRead`, `completed`, `lastOpened`, `drafts`.
- A haladás a legnagyobb elért görgetési arányból számolódik; a **Befejezve** kézi jelölés 100%-ot jelent.
- A **Folytatás** funkció a legutóbbi kurzust nyitja meg, majd visszaállítja a mentett olvasási pozíció közelét.
- A reset kizárólag az alkalmazás saját haladási kulcsát állítja alaphelyzetbe; más webhelyadatot nem érint.

### Ismert korlátozások

- Vendégmódban a tanulási adatok eszköz- és böngészőprofil-specifikusak.
- Egy kurzus csak az első online megnyitás után érhető el offline.
- A böngészők PWA-telepítési felülete platformonként eltérő.

## WEB 1.2 – tanulói fiók és felhőszinkron

### Funkciók

- E-mail/jelszó alapú regisztráció, kötelező e-mail-megerősítés, belépés, kijelentkezés és jelszó-visszaállítás.
- A vendégmód változatlanul használható; az első belépéskor a helyi előzmény egyszer, kifejezett döntéssel importálható.
- Local-first működés: a felület azonnal helyben ment, majd háttérben szinkronizál; hálózati hiba esetén a vendég- és offline működés nem áll le.
- Felhőbe kerül a kurzusazonosító, haladás, állapot, kedvenc, utolsó megnyitás, szakaszazonosító és görgetési pozíció.
- A frissebb `client_updated_at` rekord nyer; a szerveroldali trigger elutasítja az elavult felülírást.
- A profil és kurzushaladás táblákon kényszerített RLS működik: a hitelesített felhasználó kizárólag a saját rekordjait olvashatja és módosíthatja.

### Vercel- és Supabase-konfiguráció

- A Vercel-projekthez a Supabase Marketplace-integráció adja a `SUPABASE_URL` és a nyilvános klienskulcs környezeti változóit.
- A böngésző csak az `/api/config` válaszából kapja meg a nyilvános URL-t és publishable/anon kulcsot; service role kulcs nincs a kliensben és nincs a repositoryban.
- Az adatbázis reprodukálható definíciója a `supabase/schema.sql` fájlban található.
- Az Auth Site URL a production cím, az átirányítási lista pedig a production, a Vercel preview és a helyi fejlesztési címeket engedi.
- Az e-mail-megerősítés production környezetben kötelező.

### Adatvédelem és törlés

- A „Tanulási adataim törlése” a bejelentkezett felhasználó saját `course_progress` rekordjait törli; más felhasználó adataihoz nem fér hozzá.
- A fiók jelszava és hitelesítési munkamenete a Supabase Auth kezelésében marad; az alkalmazás nem naplózza és nem tárolja külön a jelszót.
- A `profiles.user_id` és `course_progress.user_id` az `auth.users` rekordra hivatkozik, fióktörléskor kaszkádolt takarítással.

## WEB 1.3 – személyes tanulási dashboard

- A kezdőoldali „Haladásod” blokk a 32 kurzus alapján mutatja a befejezett, folyamatban lévő és még nem kezdett témák számát, valamint az összesített százalékot.
- A „Folytasd, ahol abbahagytad” blokk az utoljára megnyitott kurzushoz és a mentett olvasási pozícióhoz vezet vissza; új tanulónál egyértelmű kezdőállapot jelenik meg.
- Bejelentkezve külön listában láthatók a folyamatban lévő kurzusok, a kedvencek és a legutóbbi aktivitások.
- A kurzusajánlás kizárólag a saját haladási adatokból, kiszámítható szabályok szerint készül: legutóbbi aktív kurzus, legelőrébb tartó folyamatban lévő kurzus, majd a következő még nem kezdett téma.
- A „Haladásom” nézet mind a 32 kurzust állapot- és kedvencszűrőkkel, hozzáférhető folyamatjelzőkkel jeleníti meg.
- Vendégmódban a korábbi helyi működés változatlan; a személyes felhős listák kizárólag hitelesített felhasználónál láthatók.
- Az e-mailes megerősítési és helyreállítási munkamenetek töredékét a kezdőoldal az Auth kliens feldolgozásáig megőrzi.

## WEB 1.4 – személyes tanulási eszközök

### Adatmodell és jogosultságok

- A `student_annotations` tábla felhasználónként és kurzusonként tárolja a `bookmark`, `note` és `review` típusú személyes elemeket.
- Minden rekordhoz szemantikus szakaszazonosító, címszöveg és közelítő görgetési pozíció tartozik; ez teszi lehetővé a mentett rész visszanyitását akkor is, ha a képernyő mérete eltér.
- Az egyedi kulcs megakadályozza ugyanazon felhasználó, kurzus, típus és horgonypont ismétlődő mentését.
- A RLS kényszerített: a bejelentkezett tanuló kizárólag a saját személyes elemeit olvashatja, hozhatja létre, módosíthatja és törölheti.

### Könyvjelző, jegyzet és ismétlendő jelölés

- A kurzuseszköztárból egy kattintással elmenthető vagy eltávolítható a könyvjelző és az „Ezt ismételd át” jelölés.
- A jegyzet legfeljebb 2000 karakteres; létrehozható, szerkeszthető és külön megerősítéssel törölhető.
- A jegyzet szövege biztonságos szövegként jelenik meg, nem kerül HTML-ként a dokumentumba.
- A mentés felhőalapú, ezért csak bejelentkezve és működő internetkapcsolattal írható; az alkalmazás offline állapotban nem jelez valótlan sikeres mentést.

### „Saját anyagaim” és több eszköz

- A kezdőoldali összesítő külön mutatja a könyvjelzők, jegyzetek és ismétlendő elemek számát, valamint az öt legutóbbi személyes anyagot.
- A „Saját anyagaim” nézet típus szerint szűrhető, szövegesen kereshető, időrend vagy kurzus szerint rendezhető.
- A mentett elemek közvetlenül visszanyitják a kapcsolódó kurzust és a mentéshez tartozó szakaszt vagy közelítő olvasási pozíciót.
- Bejelentkezés után egyetlen lekérdezés tölti le a felhasználó személyes elemeit; ugyanazok az adatok másik böngészőlapon vagy eszközön is megjelennek.
- Kijelentkezéskor a felhasználóhoz tartozó megjelenítési gyorsítótár és minden személyes blokk eltűnik a felületről.

### Offline működés és ismert korlátok

- Az alkalmazáskeret és a korábban megnyitott kurzus offline továbbra is olvasható; a már letöltött személyes elemek a munkamenet helyi gyorsítótárából megjeleníthetők.
- Új könyvjelző, jegyzet vagy ismétlendő jelölés offline nem hozható létre és nem módosítható. Szándékosan nincs háttérben várakozó írási sor, így nincs rejtett konfliktus vagy téves „mentve” állapot.
- A horgonypont visszaállítása szemantikus címsorra támaszkodik, majd görgetési pozícióra vált; a kurzustartalom későbbi jelentős szerkezeti átírása ezért közelítő visszaállítást eredményezhet.
