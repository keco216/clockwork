/**
 * Magyar.
 *
 * Szójegyzék: secret · széf (vault) · fiók · jelmondat (passphrase) · bejegyzés ·
 *   kód · számlap. A „secret” marad eredetiben — a szolgáltatók oldalain is így
 *   szerepel.
 * Hangnem: személytelen, tárgyilagos, ahogy a fejlesztői eszközökben szokás.
 * Idézőjelek: „ … ”, a magyar tipográfia szerint.
 * Többes szám: magyarul a szám után a főnév EGYES számban áll („5 fiók”), ezért
 *   az „one” és az „other” alak azonos. Ez nem másolási hiba.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP-hitelesítő',
  'meta.description':
    'Clockwork — TOTP-hitelesítő. A kétlépcsős kódokat teljes egészében a böngészőben ' +
    'állítja elő, egyetlen hálózati kérés nélkül.',
  'brand.tagline': 'TOTP-hitelesítő · RFC 6238',
  'skip.toCodes': 'Ugrás a kódokhoz',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Kapcsolat nélkül',
  'status.vault.off': 'semmi sem tárolódik',
  'status.vault.locked': 'a széf zárva',
  'status.vault.open': 'a széf nyitva',

  'zone.input': 'Bevitel',
  'zone.vault': 'Széf',
  'zone.codes': 'Kódok',

  'input.legend': 'Soronként egy bejegyzés',
  'input.help.formats': 'Base32, {nameSecret} vagy {uri} — vegyesen. A {hash} jegyzetet kezd.',
  'input.help.images': 'A QR-képek ide is húzhatók, vagy beilleszthetők a {paste} kombinációval.',
  'input.help.migration':
    'A Google Authenticator exportjai ({migration}) automatikusan átalakulnak.',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} fiók', other: '{n} fiók' },
  'input.count.errors': { one: '{n} hiba', other: '{n} hiba' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Ürítés',
  'key.qrImage': 'QR képből',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Kamera ki',
  'key.copy': 'Másolás',
  'key.copyDone': 'Másolva',
  'key.copyFailed': 'Nem sikerült',

  'viewfinder.hint': 'Tartsa a QR-kódot a keretben',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} számjegy', other: '{n} számjegy' },
  'strip.period': '{n} s',
  'strip.next': 'következik',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'másodperc',
  'strip.seconds.valid': 'érvényes',
  'strip.accountFallback': '{n}. fiók',
  'strip.copyAria': '{name} kódjának másolása',
  'strip.copyAnnounce': '{digits} kód másolva',
  'strip.copyFailedHint': 'A másolás nem sikerült. Jelölje ki a kódot kézzel.',

  'fault.title': 'A sor olvashatatlan',

  'vault.state.off': 'Kikapcsolva — semmi sem tárolódik',
  'vault.state.locked': 'Zárva — jelmondat kell',
  'vault.state.open': 'Nyitva — a secretek a szövegmezőben vannak',
  'vault.explain':
    'Alapértelmezés szerint a Clockwork semmit sem tárol. Aki szeretné, itt hagyhatja a ' +
    'bevitelt jelmondattal titkosítva: PBKDF2-SHA-256 {iterations} iterációval, utána ' +
    'AES-256-GCM. A jelmondat nélkül a tárolt blokk semmit sem ér.',
  'vault.pass.new': 'Új jelmondat',
  'vault.pass.existing': 'Jelmondat',
  'vault.action.seal': 'Titkosítva tárol',
  'vault.action.unseal': 'Kinyitás',
  'vault.action.deriving': 'Kulcs származtatása …',
  'vault.action.lock': 'Bezárás',
  'vault.action.update': 'Tárolás újra',
  'vault.action.wipe': 'Minden törlése',
  'vault.action.wipeConfirm': 'Tényleg törli?',
  'vault.timeout.label': 'Magától bezár ennyi után:',
  'vault.timeout.minutes': { one: '{n} perc', other: '{n} perc' },
  'vault.lockOnHide': 'és a lap elhagyásakor',

  'vault.error.nothingToStore': 'Nincs mit tárolni — a szövegmező üres.',
  'vault.error.storageBlocked': 'A böngésző nem engedi a tárolást (privát mód?).',
  'vault.error.noVault': 'Nincs tárolt széf.',
  'vault.error.noPassphrase': 'Jelmondat nélkül nincs kulcs.',
  'vault.error.sealFailed': 'A tárolás nem sikerült.',
  'vault.error.unsealFailed': 'A kinyitás nem sikerült.',

  'vault.msg.sealed': 'A széf titkosítva tárolva.',
  'vault.msg.resealed': 'A széf újra titkosítva.',
  'vault.msg.unsealed': 'A széf kinyitva.',
  'vault.msg.locked': 'A széf bezárva.',
  'vault.msg.wiped': 'A széf törölve.',
  'vault.msg.wipedNote': 'Törölve. A tárolóban nem maradt semmi.',
  'vault.locked.idle': {
    one: '{n} perc bevitel nélkül eltelt, ezért bezárt.',
    other: '{n} perc bevitel nélkül eltelt, ezért bezárt.',
  },
  'vault.locked.hidden': 'A lap elhagyásakor bezárt.',

  'scan.noQr': 'A képen nem volt felismerhető QR-kód.',
  'scan.unreadable': 'A képet nem sikerült beolvasni — tényleg kép ez?',
  'scan.done': 'QR-kód beolvasva és beillesztve.',
  'scan.camera.unavailable':
    'Ez a környezet nem ad kamerát. Fájlként megnyitva (file://) a legtöbb böngésző letiltja ' +
    '— a „QR képből” mindig működik.',
  'scan.camera.denied':
    'A kamera elutasítva. Állítsa vissza az engedélyt a böngészőben — vagy használja a ' +
    '„QR képből” gombot.',
  'scan.camera.notFound': 'Nincs csatlakoztatott kamera. A „QR képből” így is működik.',
  'scan.camera.busy': 'A kamerát éppen egy másik program használja.',
  'scan.camera.failed': 'A kamerát nem sikerült elindítani. A „QR képből” mindig működik.',

  'import.done': {
    one: '{n} fiók átvéve a Google Authenticator exportjából',
    other: '{n} fiók átvéve a Google Authenticator exportjából',
  },
  'import.skipped': 'kihagyva: {list}',
  'import.skip.hotp': '{label} (HOTP, számlálóalapú)',
  'import.skip.algorithm': '{label} (nem támogatott algoritmus)',
  'import.skip.emptySecret': '{label} (üres secret)',
  'import.unnamed': 'Névtelen',
  'import.unreadable': 'Az export olvashatatlan.',

  'vacant.text': 'Még nincs bevitel. Tegyen fentre egy secretet.',
  'colophon.note': 'Nincs hálózat · nincs tárolás · HMAC a Web Crypto API-n keresztül',

  'lang.label': 'Nyelv',
  'lang.aria': 'Nyelv választása',

  'err.base32.paddingInside': 'Az „=” jel csak a végén állhat (nem más, mint kitöltés).',
  'err.base32.empty': 'A secret kulcs üres.',
  'err.base32.badChar':
    'Érvénytelen karakter: „{char}” a(z) {position}. helyen. A Base32 csak az A–Z és 2–7 ' +
    'jeleket ismeri — a 0, 1 és 8 számjegy nem fordul elő benne (O, I és B helyett írták?).',
  'err.base32.badLength':
    'Érvénytelen hossz: {length} karakter (szóközök és kitöltés nélkül). A Base32 5 bájtot ' +
    '8 karakterben kódol; az utolsó blokkban csak 2, 4, 5, 7 vagy 8 karakter lehet. Alighanem ' +
    'hiányzik egy karakter, vagy eggyel több van.',

  'err.uri.invalid': 'Ez nem érvényes URI. A várt alak: „otpauth://totp/…”.',
  'err.uri.scheme': 'Ismeretlen séma: „{scheme}”. A várt: „otpauth”.',
  'err.uri.hotp':
    'Ez HOTP URI (számlálóalapú). Ez az alkalmazás csak időalapú TOTP-kódokat állít elő — ' +
    'ahhoz a számláló állását el kellene tárolni.',
  'err.uri.type': 'Ismeretlen típus: „{type}”. Az „otpauth://” után „totp” kell álljon.',
  'err.uri.typeEmpty': '(üres)',
  'err.uri.noSecret': 'Az URI-ból hiányzik a „secret” paraméter.',
  'err.uri.badLabel':
    'Az URI címkéje hibás százalékkódolást tartalmaz (például egy magányos „%” jelet).',
  'err.uri.algorithm': 'Ismeretlen algoritmus: „{value}”. A támogatottak: SHA1, SHA256 és SHA512.',
  'err.uri.digits': 'Érvénytelen „digits” érték: {value}. A megengedett {min}–{max}.',
  'err.uri.period': 'Érvénytelen „period” érték: {value}. A várt 1–3600 másodperc.',
  'err.uri.integer': 'A(z) „{name}” paraméternek egész számnak kell lennie; „{value}” állt ott.',

  'err.otp.digits': 'Érvénytelen számjegyszám: {value}. A megengedett {min}–{max}.',
  'err.otp.emptySecret': 'A secret üres — ebből nem számolható kód.',

  'err.line.unreadable': 'Ezt a sort nem sikerült beolvasni.',

  'err.vault.openFailed':
    'A széfet nem sikerült kinyitni. Hibás jelmondat — vagy a tárolt adatokat megváltoztatták.',
  'err.vault.badFormat': 'A tárolt széfadatok formátuma ismeretlen.',
  'err.vault.version': 'A(z) {version} széfverzió nem támogatott (a várt: {expected}).',
  'err.vault.base64': 'A széfadatok „{field}” mezője nem érvényes Base64.',
  'err.vault.iterations': 'Érvénytelen iterációszám: {value}.',

  'err.migration.notExport':
    'Ez nem Google Authenticator export. A várt alak: ' + '„otpauth-migration://offline?data=…”.',
  'err.migration.noData': 'Az URI-ból hiányzik a „data” paraméter.',
  'err.migration.badPercent': 'A „data” paraméter hibás százalékkódolást tartalmaz.',
  'err.migration.badBase64': 'A „data” paraméter nem érvényes Base64.',
  'err.migration.noAccounts': 'Ebben az exportban nincsenek fiókok.',
} satisfies Strings;
