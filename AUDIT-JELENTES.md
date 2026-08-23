# Történelem Érettségi Műhely WEB 1.0 – auditjelentés

Audit dátuma: 2026. augusztus 22.

## Összesített eredmény

A projekt statikus, Vercel-kompatibilis szerkezete rendben van. A 32 kurzus és a 62 kép hiánytalanul megtalálható; a kurzus-metaadatokban nincs hiányzó fájl, ismétlődő azonosító vagy ismétlődő forrásfájl. A kurzustartalom és a képek nem módosultak.

## Ellenőrzések

| Ellenőrzés | Eredmény |
|---|---:|
| Kurzus-metaadatok | 32/32 rendben |
| Kurzus HTML-fájlok | 32/32 rendben |
| Képfájlok | 62/62 rendben |
| JavaScript-szintaxis | 33 HTML-fájl ellenőrizve, 0 hiba |
| Helyi hivatkozások | 64 ellenőrizve, 0 hibás |
| Hiányzó kurzusforrás | 0 |
| Ismétlődő kurzusazonosító/forrás | 0/0 |
| Kurzus- és képfájlok tartalmi hash-eltérése az eredeti ZIP-hez képest | 0/94 |
| Vercel-konfiguráció | érvényes statikus beállítás |

## Elvégzett production-ready javítások

- A telepítendő ZIP repo-gyökerében közvetlenül az `index.html`, a `courses`, az `images` és a konfigurációs fájlok szerepelnek; nincs felesleges `site` felső mappa.
- Az oldal címe és meta description eleme pontos, kiadásra alkalmas szöveget kapott.
- A kurzuslista és az egyes kurzusok betöltési hibája általános, felhasználóbarát üzenetet jelenít meg; a korábbi „demó verzió” szöveg kikerült.
- Elkészült a működő SVG favicon, valamint a PWA-metaadatokat és ikonhelyet előkészítő `manifest.webmanifest`.
- A kezdeti kurzusszámláló 28/28 helyett 32/32 értéket mutat.
- A `vercel.json` érvényes JSON, és a projekt buildlépés nélküli statikus Vercel-telepítésre alkalmas.

## Tartalmi összevetés határa

A munkakörnyezetben külön, egyfájlos „32 kurzusos master” nem állt rendelkezésre. Ezért a tartalmi sértetlenséget a megadott eredeti Vercel-kész ZIP 32 kurzusfájljához és 62 képéhez viszonyított SHA-256 összehasonlítás igazolja. Mind a 94 tartalmi fájl bitazonos maradt.

## Későbbi PWA-bővítés

A manifeszt és az ikonkapcsolat elkészült. Teljes offline telepíthetőséghez később 192×192 és 512×512 pixeles végleges PNG-ikon, valamint service worker hozzáadása szükséges.

## Production live audit – 2026. augusztus 22.

### Production deployment

- Production URL: https://tortenelem-erettsegi-muhely-hqnj.vercel.app
- Production alias: `tortenelem-erettsegi-muhely-hqnj.vercel.app`
- Auditált deployment URL: `tortenelem-erettsegi-muhely-hqnj-d9wytwsv8.vercel.app`
- Auditált alkalmazáscommit: `59de50ca1b636b626e4274bdb357a881a4386ca9`
- Branch: `main`
- Státusz: **READY / Current / Production**
- Ellenőrzés időpontja: 2026. augusztus 22. (Europe/Budapest)
- Build warning/error: **0/0**. A „Skipping cache upload because no files were prepared” sor információs üzenet, nem buildhiba.

### Összesített élő eredmények

| Terület | Eredmény |
|---|---:|
| Kurzus-metaadat és kurzusfájl | 32/32 PASS |
| Kurzus tényleges böngészős megnyitása | 32/32 PASS |
| Production képek HTTP- és formátumellenőrzése | 62/62 PASS |
| JavaScript-szintaktikai hiba | 0 |
| Böngészőkonzol JavaScript-hiba | 0 |
| Production HTTP-ellenőrzés | 98/98 válasz HTTP 200 |
| Váratlan 404 | 0 |
| Hibás helyi hivatkozás | 0 |
| Duplikált kurzus-ID / source | 0/0 |
| Hiányzó vagy üres képi alt szöveg | 0 |
| Mixed-content hivatkozás | 0 |

### Kurzusonkénti betöltési eredmény

| # | Kurzus | Betöltés | Képek | JS hiba | 404 | Eredmény |
|---:|---|---:|---:|---:|---:|---:|
| 1 | Zsidó és keresztény vallás | OK | 2 | 0 | 0 | PASS |
| 2 | Athéni demokrácia | OK | 1 | 0 | 0 | PASS |
| 3 | Honfoglalás és államalapítás | OK | 2 | 0 | 0 | PASS |
| 4 | Középkori városok és gazdaság | OK | 1 | 0 | 0 | PASS |
| 5 | Aranybulla és tatárjárás | OK | 1 | 0 | 0 | PASS |
| 6 | Károly Róbert | OK | 1 | 0 | 0 | PASS |
| 7 | Hunyadi János és Mátyás | OK | 2 | 0 | 0 | PASS |
| 8 | A mohácsi csata és az ország három részre szakadása | OK | 2 | 0 | 0 | PASS |
| 9 | Reformáció és ellenreformáció | OK | 1 | 0 | 0 | PASS |
| 10 | Reformáció Magyarországon és Erdélyben | OK | 1 | 0 | 0 | PASS |
| 11 | A várháborúk kora | OK | 1 | 0 | 0 | PASS |
| 12 | Az angol alkotmányos monarchia | OK | 1 | 0 | 0 | PASS |
| 13 | A Rákóczi-szabadságharc | OK | 2 | 0 | 0 | PASS |
| 14 | Felvilágosodás – új eszmék | OK | 0 | 0 | 0 | PASS |
| 15 | Az USA függetlensége és létrejötte | OK | 2 | 0 | 0 | PASS |
| 16 | Az ipari forradalom | OK | 1 | 0 | 0 | PASS |
| 17 | Felvilágosult abszolutizmus | OK | 1 | 0 | 0 | PASS |
| 18 | Reformkor: Széchenyi és Kossuth | OK | 1 | 0 | 0 | PASS |
| 19 | 1848 és az áprilisi törvények | OK | 1 | 0 | 0 | PASS |
| 20 | A kiegyezés | OK | 1 | 0 | 0 | PASS |
| 21 | Torlódó társadalom | OK | 2 | 0 | 0 | PASS |
| 22 | Az első világháború | OK | 2 | 0 | 0 | PASS |
| 23 | A trianoni békerendszer és következményei | OK | 3 | 0 | 0 | PASS |
| 24 | A Horthy-korszak és a bethleni konszolidáció | OK | 3 | 0 | 0 | PASS |
| 25 | A nemzetiszocialista Németország és a kommunista Szovjetunió | OK | 3 | 0 | 0 | PASS |
| 26 | Magyarország a második világháborúban | OK | 3 | 0 | 0 | PASS |
| 27 | A holokauszt Európában és Magyarországon | OK | 2 | 0 | 0 | PASS |
| 28 | A Rákosi-korszak | OK | 3 | 0 | 0 | PASS |
| 29 | Az 1956-os forradalom és szabadságharc | OK | 4 | 0 | 0 | PASS |
| 30 | A Kádár-korszak | OK | 3 | 0 | 0 | PASS |
| 31 | A hidegháború kezdete és kiteljesedése | OK | 5 | 0 | 0 | PASS |
| 32 | A rendszerváltás Magyarországon | OK | 4 | 0 | 0 | PASS |

Mind a 32 kurzusnál megjelent a főcím és a teljes, nem üres kurzustörzs; a kurzuslistára történő visszalépés működött. Az 1., 16., 25–32. kurzusnál a gombok, inputok, selectek, esszémezők és linkek jelenléte és engedélyezett állapota külön is ellenőrzésre került.

### Kereső, dashboard és témák

- A `reformkor`, `1956`, `Kádár/kadar`, `hidegháború`, `rendszerváltás` és `Rákosi/rakosi` keresések megfelelő találatokat adtak.
- A `Róma` és a szándékosan hibás lekérdezés 0 találatot adott; a metaadatok között nincs Róma című vagy korszakú kurzus.
- A kereső törlése után 32/32 kurzus állt vissza.
- A kedvencjelölés, a Megjelölt/Megkezdett/Mind szűrők és a számlálók működtek; az állapotütközés nem jelentkezett.
- A világos/sötét témaváltás működött, és a választás oldalfrissítés után megmaradt.

### Mobil és responsive regresszió

Az ellenőrzés valódi headless Chromium böngészőben, pontosan beállított viewportokkal futott. Minden méreten 32 kártya jelent meg, a kereső és a dashboard-szűrők használhatók voltak, vízszintes túlcsordulás vagy a viewporton kívülre lógó elem nem jelentkezett. Az `atheni` keresés minden méreten egy megfelelő találatot adott.

| Viewport | Eredmény | Megjegyzés |
|---|---:|---|
| 390×844 | **PASS** | 0 horizontális overflow; mobil kurzusválasztó, kereső, szűrők és navigáció működik |
| 430×932 | **PASS** | 0 horizontális overflow; kártyák és szövegek nem lógnak ki |
| 768×1024 | **PASS** | 0 horizontális overflow; tabletelrendezés használható |
| 1366×768 | **PASS** | 0 horizontális overflow; asztali navigáció és kártyarács működik |
| 1920×1080 | **PASS** | 0 horizontális overflow; széles asztali elrendezés stabil |

Az 1., 16., 29., 30., 31. és 32. kurzus 390×844 méreten külön is megnyílt. Mind a hatnál volt teljes, nem üres tartalom, 0 belső horizontális overflow, 0 viewporton kívülre lógó kép, 0 hiányzó `alt`, és a kezdőoldalra visszanavigálás működött. Fixed/sticky elem nem takart el fő tartalmat. A másodlagos, ikon jellegű vezérlők között vannak 32 px-nél kisebb célterületek; ezek kattinthatók és billentyűzettel elérhetők, ezért ez nem blokkoló figyelmeztetés.

### Billentyűzetes és accessibility regresszió

| Ellenőrzés | Eredmény | Megjegyzés |
|---|---:|---|
| Tab navigáció | **PASS** | a kereső, folytatás, szűrők, kedvenc- és kurzusmegnyitó gombok sorrendben elérhetők |
| Fókuszállapot | **PASS** | a bejárt interaktív elemek mindegyikén látható `solid` fókuszjelölés jelent meg |
| Fő funkciók billentyűzetről | **PASS** | keresés, témaváltás, kurzusmegnyitás és visszalépés Enterrel működött; natív gombok Space-aktiválása támogatott |
| Alt/ARIA alapellenőrzés | **PASS** | 0 címke nélküli input/select, 0 cím nélküli iframe, 0 hiányzó képi alt |

A heading hierarchy alapellenőrzése nem talált hiányzó főcímeket. Egyes kurzusok tartalmában előfordul H1→H3 szintugrás; ez szemantikai figyelmeztetés, nem akadályoz fő funkciót, és a kurzustartalom változtatási tilalma miatt nem került átírva. Teljes WCAG-megfelelőségi tanúsítás nem volt a feladat része.

### Javított hibák és fennmaradó ismert korlátok

- A mobil töréspont korábban elrejtette a keresőt és a kezdőoldalra visszavezető vezérlőt; ezek mobilon látható, használható elrendezést kaptak (`c2c10bf`).
- A kereső korábban csak az asztali oldalsó kurzuslistát szűrte. Most a kezdőoldali kurzuskártyákat is szűri, így mobilon is tényleges találati eredményt ad.
- A korábbi production audit során a kezdőoldal „24 témakör” felirata már „32 témakör” értékre lett javítva (`393fab2`).
- Ismert korlát: a teljes PWA-offline működéshez továbbra is végleges 192×192 és 512×512 PNG-ikon, illetve service worker szükséges; ez nem része a WEB 1.0 jelenlegi követelményeinek.

### Végső minősítés

**PASS WITH WARNINGS** – a production alkalmazás, mind a 32 kurzus és mind a 62 kép működik; nincs JavaScript-hiba, hibás helyi link, váratlan 404 vagy mobil overflow. Mind az öt előírt viewport és a billentyűzetes fő funkciók runtime tesztje sikeres. A fennmaradó figyelmeztetés a kurzustartalom néhány heading-szintugrására és egyes másodlagos ikonvezérlők 32 px-nél kisebb célterületére vonatkozik; egyik sem tesz fő funkciót elérhetetlenné.

## WEB 1.1 – PWA és haladáskövetés

### Baseline és változási kör

- WEB 1.0 production baseline: `d5414ce5cbe21fa38ff28666ef16422dcff0ed8a`.
- A 32 kurzus HTML-tartalma és a 62 kép nem módosult.
- A sprint kizárólag a PWA-réteget, az offline működést, a meglévő localStorage-haladás felületét és accessibility tulajdonságait bővíti.

### Megvalósítás

- 192×192 és 512×512 PNG ikon, valamint külön, teljes hátterű 512×512 maskable ikon készült a meglévő TÉ arculati jelből.
- A manifest `id`, `start_url`, `scope`, `standalone` megjelenítés, színek és production ikonbejegyzések használatával teljes.
- A verziózott service worker előre cache-eli az alkalmazáskeretet, runtime cache-be menti a meglátogatott kurzusokat és képeket, valamint aktiváláskor törli a régi saját cache-eket.
- Offline, korábban nem mentett kurzus esetén kulturált magyar tájékoztató oldal jelenik meg.
- A meglévő localStorage-séma egyetlen verziózott kulcsot használ; a látogatás, olvasási százalék, utolsó megnyitás, kedvenc, kézi befejezés és folytatási pozíció megmarad újratöltés után.
- A progress bar elemek ARIA progressbar szemantikát kaptak; a kedvencgombok célterülete 44×44 px-re nőtt, és kurzusnévvel kiegészített `aria-label` került rájuk.

### Cache-stratégia

| Erőforrás | Stratégia |
|---|---|
| Navigáció / alkalmazás shell | network-first, offline `index.html` fallback |
| Manifest, metaadat, ikonok | előre cache-elt shell, network-first frissítés |
| Kurzus HTML | network-first, sikeres megnyitás után runtime cache |
| Kurzusképek | cache-first, első sikeres kérés után runtime cache |
| Cache-frissítés | verziónév-váltás és régi `tem-web-*` cache-ek törlése aktiváláskor |

### LocalStorage-séma és haladásszámítás

- Kulcs: `tortenelem-erettsegi-muhely-ui2-progress-v1`.
- Sémaverzió: `1`.
- A kurzus százaléka a legnagyobb elért scroll-arány; kézi befejezéskor 100%.
- A legutóbbi olvasási arány külön mezőben tárolódik a közelítő pozíció-visszaállításhoz.
- A reset csak ezt az alkalmazássaját haladási kulcsot állítja alaphelyzetbe.

### WEB 1.1 production regresszió – 2026. augusztus 22.

Production URL: https://tortenelem-erettsegi-muhely-hqnj.vercel.app/

| Ellenőrzés | Eredmény |
|---|---:|
| Manifest betöltés és parse | PASS – 0 hiba |
| 192×192 / 512×512 / maskable ikon | PASS – 3/3 HTTP 200 |
| Service worker regisztráció | PASS – ACTIVE |
| Shell cache létrehozása | PASS – `tem-web-1.1-shell-v1` |
| Régi saját cache törlése aktiváláskor | PASS |
| Offline kezdőoldal | PASS |
| Nem mentett kurzus offline üzenete | PASS |
| Chromium installability diagnosztika | PASS WITH NOTE – 0 manifesthiba; kizárólag a headless inkognitó tesztkörnyezet tiltja a tényleges telepítést |
| LocalStorage sémaverzió | PASS – `version: 1` |
| 1., 16. és 32. kurzus haladásváltozása | PASS |
| Haladás megmarad újratöltés után | PASS |
| Kedvenc megmarad újratöltés után | PASS |
| Kézi Befejezve jelölés | PASS |
| Folytatás innen | PASS |
| Reset csak saját tanulási állapotra | PASS |
| 32 kurzus böngészős betöltése | 32/32 PASS |
| 32 kurzus production HTTP | 32/32 PASS |
| Képek production HTTP és MIME | 62/62 PASS |
| JavaScript console/page error | 0 |
| Váratlan 404 | 0 |

### WEB 1.1 mobil és accessibility

| Terület | Eredmény |
|---|---:|
| 390×844 | PASS – 0 horizontális overflow |
| 430×932 | PASS – 0 horizontális overflow |
| 768×1024 | PASS – 0 horizontális overflow |
| 1366×768 | PASS – 0 horizontális overflow |
| 1920×1080 | PASS – 0 horizontális overflow |
| Mobil keresés és szűrés | PASS |
| Tab-sorrend és látható fókusz | PASS |
| Témaváltás, kurzusnyitás és visszalépés billentyűzettel | PASS |
| Input-/iframe-címkék és képi alt | PASS – 0 hiány |
| Progressbar szemantika | PASS |
| Érintett kedvencgomb célterülete | PASS – 44×44 px |

### WEB 1.1 végső minősítés

**PASS WITH WARNINGS** – a PWA, az offline alkalmazáskeret, a verziózott localStorage-haladás, a Folytatás funkció, a kedvencek és a kézi befejezés production környezetben működik. Mind a 32 kurzus és mind a 62 kép regressziója sikeres, JavaScript-hiba és váratlan 404 nélkül. Nem blokkoló korlát, hogy az adatok nem szinkronizálódnak eszközök között, egy kurzus csak első online megnyitás után érhető el offline, és a telepítési felület böngésző/platformfüggő.

## WEB 1.2 – tanulói fiók és felhőszinkron

### Változási kör és biztonság

- A 32 kurzus HTML-tartalma és a 62 kép nem módosult.
- A kliensben kizárólag a Supabase nyilvános publishable/anon kulcsa használható; service role kulcs nincs a forrásban.
- A `profiles` és `course_progress` táblákon a RLS engedélyezett és kényszerített; az `anon` tábla-jogosultságok vissza vannak vonva.
- A felhasználói megjelenített név kizárólag `textContent` útján kerül a felületre.
- Az `/api/config` válasz `no-store`; a service worker ezt az útvonalat nem gyorsítótárazza.

### Preview funkcionális audit – 2026. augusztus 23.

| Ellenőrzés | Eredmény | Megjegyzés |
|---|---:|---|
| Supabase projekt és Vercel env kapcsolat | **PASS** | a preview a megfelelő `ozsyllfdppjeacrslnbt` projektet használta; kulcsérték nem került naplóba |
| Regisztráció és munkamenet | **PASS** | új felhasználó, profiltrigger, azonnali munkamenet és személyes név megjelenítése működött |
| Kötelező e-mail-megerősítés | **PASS** | production beállítás visszaellenőrizve: bekapcsolva |
| Vendégmód | **PASS** | felhő nélkül is használható, a helyi mentés megmarad |
| 29. kurzus felhős mentése | **PASS** | 54,39%, kedvenc, aktív szakasz és pozitív görgetési pozíció az adatbázisban |
| Új böngészőlapon folytatás | **PASS** | a 29. kurzus, 54% és kedvencjelölés megjelent; a tényleges görgetési pozíció 54%-ra állt vissza |
| Kétfelhasználós UI-elkülönítés | **PASS** | B felhasználó nem látta A felhasználó haladását vagy kedvencét |
| RLS olvasási izoláció | **PASS** | B JWT-kontextusában A rekordjainak látható száma: 0 |
| RLS írási izoláció | **PASS** | B nevében A rekordjára végzett INSERT `42501` RLS hibával blokkolva |
| Local-first háttérszinkron | **PASS** | azonnali helyi állapot, majd `Szinkronizálva` állapot; adatbázisrekord egyezett |
| Jelszó-visszaállítási felület | **WARNING** | a felület és redirect konfiguráció működik; a teljes e-mail-kézbesítés ideiglenes tesztcím nélkül nem igazolható |
| Jelszavas visszabelépés automatizált mezőkitöltéssel | **WARNING** | a tesztjelszó hash-egyezése igazolt, de a böngésző automatizált `current-password` kitöltése `invalid_credentials` választ kapott; a regisztrációs munkamenet és Auth végpont ettől függetlenül működött |
| Ideiglenes tesztadatok takarítása | **PASS** | 9 tesztfiók törölve; ellenőrzött maradványszám: 0; kapcsolódó haladás kaszkáddal törlődött |

Az audit idejére az e-mail-megerősítés rövid, kontrollált tesztszakaszban ki lett kapcsolva az azonnali, postafiók nélküli munkamenetek létrehozásához, majd a kétfelhasználós teszt után vissza lett kapcsolva és `true` állapotban ellenőrizve.

### Regresszió

| Terület | Eredmény |
|---|---:|
| Kurzusmeta / HTML | **32/32 PASS** |
| Képek | **62/62 PASS** |
| JavaScript-szintaxis | **0 hiba** |
| Helyi relatív hivatkozások | **0 hibás** |
| 390×844 | **PASS – 0 horizontális overflow** |
| 430×932 | **PASS – 0 horizontális overflow** |
| 768×1024 | **PASS – 0 horizontális overflow** |
| 1366×768 | **PASS – 0 horizontális overflow** |
| 1920×1080 | **PASS – 0 horizontális overflow** |
| Mobil kurzusnyitás: 1., 16., 29., 30., 31., 32. | **6/6 PASS** |
| Billentyűzet, fókusz, label/ARIA/alt alapellenőrzés | **PASS** |
| Service worker és offline shell | **PASS** – `tem-web-1.2-shell-v1` |

### WEB 1.2 minősítés

**PASS WITH WARNINGS** – a fiókalapú felhőszinkron, a többnézetes folytatás, a vendégmód, az offline alkalmazáskeret és a kétfelhasználós RLS-elkülönítés működik. A két figyelmeztetés a postafiók nélküli jelszó-visszaállítás teljes kézbesítésére, illetve az automatizált böngésző `current-password` mezőkitöltésére vonatkozik; egyik sem érinti a kurzustartalmat vagy az igazolt felhős adatizolációt.

## WEB 1.3 – személyes tanulási dashboard

### Baseline és tesztkörnyezet

- WEB 1.2 production baseline: `cd307f5373c0c191c5621c2aaf30ef23d1785925`.
- Preview branch: `web-1.3`.
- Auditált preview: https://tortenelem-erettsegi-muhely-git-web-13-takacs-tamas-s-projects.vercel.app/
- Az audit 2026. augusztus 23-án, az élő Vercel preview környezetben futott.
- A 32 kurzus oktatási HTML-tartalma és a 62 kép nem módosult.

### Dashboard és felhőszinkron

| Ellenőrzés | Eredmény | Megjegyzés |
|---|---:|---|
| Új tanuló kezdőállapota | **PASS** | 0 befejezett, 0 folyamatban, 32 nem kezdett, 0%; első kurzus ajánlása |
| Aktív tanuló összesítése | **PASS** | kontrolladat: 1 befejezett, 3 folyamatban, 28 nem kezdett, 8% |
| Folytatás blokk | **PASS** | a legutóbbi kurzust és a mentett pozíciót nyitja meg |
| Determinisztikus ajánlás | **PASS** | a legutóbbi aktív 29. kurzust választotta, indoklással |
| Folyamatban / kedvencek / aktivitás | **PASS** | tartalom, sorrend és emberi dátumformátum helyes |
| „Haladásom” nézet | **PASS** | mind: 32; folyamatban: 3; kész: 1; nem kezdett: 28; kedvenc: 1 |
| Friss böngészőlap / többeszközös visszatöltés | **PASS** | 1/3/28/8% állapot és `Szinkronizálva` jelzés visszatöltődött |
| Vendégmód és kijelentkezési adatvédelem | **PASS** | személyes blokkok és korábbi név eltűntek; 0/0/32/0% helyi állapot |
| RLS olvasási elkülönítés | **PASS** | másik felhasználó rekordjaiból 0 sor volt látható |
| RLS írási elkülönítés | **PASS** | idegen felhasználó rekordjának létrehozása HTTP 403 választ kapott |
| Böngészőkonzol hiba | **PASS** | az ellenőrzött dashboard- és kurzusfolyamatokban 0 alkalmazáshiba |

### Mobil és responsive regresszió

Minden méreten ellenőrzésre került a kezdőoldal, a dashboard, a kereső, a szűrők, a navigáció, a kártyák, a szöveg- és képtörés, a fixed/sticky elemek és a vízszintes túlcsordulás. A 390×844-es mobilnézetben az 1., 16., 29., 30., 31. és 32. kurzus külön is megnyílt; mind a hatnál teljes `srcdoc`, helyes iframe-cím, képi alt és működő visszanavigálás volt.

| Viewport | Eredmény | Megjegyzés |
|---|---:|---|
| 390×844 | **PASS** | 0 horizontális overflow; 6/6 kijelölt kurzus betöltődött |
| 430×932 | **PASS** | a kereső, szűrők, kártyák és érintési célok használhatók |
| 768×1024 | **PASS** | tabletelrendezés stabil, szöveg- és képlevágás nélkül |
| 1366×768 | **PASS** | asztali navigáció és dashboard-rács stabil |
| 1920×1080 | **PASS** | széles nézetben sincs kilógás vagy indokolatlan nyúlás |

Az audit kisebb célméreteket talált a „Mentett haladás törlése” gombnál, a témaváltónál és néhány mobil vezérlőnél. A WEB 1.3 javítás után a törlésgomb, a témaváltó, a kereső, a mobil kurzusválasztó és a kurzuseszköztár vezérlői legalább 44×44 px-es érintési területet kapnak.

### Billentyűzetes és accessibility regresszió

| Ellenőrzés | Eredmény | Megjegyzés |
|---|---:|---|
| Tab navigáció | **PASS** | 22 látható fő vezérlő natív tab-sorrendben, negatív `tabindex` nélkül |
| Fókuszállapot | **PASS** | a fő interaktív elemekhez látható `:focus-visible` jelölés tartozik |
| Fő funkciók billentyűzetről | **PASS** | kereső, témaváltó, szűrők, kurzusgombok és visszalépés natív input/button/select elemek |
| Alt/ARIA alapellenőrzés | **PASS** | 0 címke nélküli mező, 0 cím nélküli iframe, 0 hiányzó képi alt, 0 névtelen fő gomb/link |
| Folyamatjelzők | **PASS** | névvel és értékkel rendelkező progressbar szemantika |
| Heading hierarchy | **PASS WITH NOTE** | az alkalmazáskeret H1→H2→H3→H4 szerkezete rendezett; a kurzustartalom nem változott |

A tesztelt fő funkciók között nincs kizárólag egérrel elérhető vezérlő. A böngésző-automatizálási réteg a szintetikus Tab/Enter billentyűleütést nem minden esetben továbbította, ezért a sorrend és aktiválhatóság ellenőrzése a tényleges élő DOM natív vezérlőtípusai, fókuszolhatósága, hozzáférhető neve és fókuszstílusa alapján történt; ez nem teljes WCAG-tanúsítás.

### Statikus és PWA-regresszió

| Ellenőrzés | Eredmény |
|---|---:|
| Kurzus HTML | **32/32 PASS** |
| Kurzusmeta, egyedi ID és forrás | **32/32 PASS** |
| Tartalmilag egyedi kurzusfájl | **32/32 PASS** |
| Képek | **62/62 PASS** |
| Helyi HTML/CSS/manifest hivatkozások | **0 hibás** |
| JavaScript-szintaxis | **0 hiba** |
| Manifest és három PWA-ikon | **PASS** |
| WEB 1.3 service-worker shell | **PASS** – `dashboard-logic.js` is gyorsítótárazva |
| Vercel-konfiguráció | **PASS** |

A reprodukálható ellenőrzés a `scripts/audit-production.mjs` fájllal futtatható; hibánál nem nulla kilépési kódot ad.

### WEB 1.3 végső preview minősítés

**PASS WITH WARNINGS** – a személyes dashboard, a „Haladásom” nézet, a folytatás, a kedvencek, a legutóbbi aktivitás, a determinisztikus ajánlás, a vendégmód és a felhőszinkron működik. A 32 kurzus, 62 kép, öt előírt viewport és hat kijelölt mobil kurzus regressziója sikeres, hibás helyi hivatkozás és JavaScript-szintaktikai hiba nélkül. Az egyetlen nem blokkoló megjegyzés, hogy az automatizálási réteg nem minden szintetikus billentyűleütést továbbított; a natív szemantika és fókuszállapot ettől függetlenül megfelelt az alapellenőrzésen.
