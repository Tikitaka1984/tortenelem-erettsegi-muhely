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
