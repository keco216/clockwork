/**
 * Latviešu.
 *
 * Vārdnīca: secret · seifs (vault) · konts · paroles frāze (passphrase) ·
 *   ieraksts · kods · ciparnīca. „Secret“ paliek netulkots — tā tas rakstīts arī
 *   pakalpojumu sniedzēju lapās.
 * Reģistrs: bezpersonisks un lietišķs, kā izstrādātāju rīkos.
 * Pēdiņas: „ … “, atbilstoši latviešu tipogrāfijai.
 * Daudzskaitlis: CLDR dod zero (0, 10–19, 20, 30 …), one (1, 21, 31 …) un other.
 *   Latviešu „zero“ ir ģenitīvs daudzskaitlī, nevis tikai nulle.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP autentificētājs',
  'meta.description':
    'Clockwork — TOTP autentificētājs. Divfaktoru kodus veido pilnībā pārlūkā, bez neviena ' +
    'tīkla pieprasījuma.',
  'brand.tagline': 'TOTP autentificētājs · RFC 6238',
  'skip.toCodes': 'Pāriet uz kodiem',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Bez tīkla',
  'status.vault.off': 'nekas netiek saglabāts',
  'status.vault.locked': 'seifs aizslēgts',
  'status.vault.open': 'seifs atvērts',

  'zone.input': 'Ievade',
  'zone.vault': 'Seifs',
  'zone.codes': 'Kodi',

  'input.legend': 'Viens ieraksts rindā',
  'input.help.formats': 'Base32, {nameSecret} vai {uri} — jaukti. {hash} sāk piezīmi.',
  'input.help.images': 'QR attēlus var arī ievilkt šeit vai ielīmēt ar {paste}.',
  'input.help.migration':
    'Google Authenticator eksporti ({migration}) tiek pārveidoti automātiski.',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { zero: '{n} kontu', one: '{n} konts', other: '{n} konti' },
  'input.count.errors': { zero: '{n} kļūdu', one: '{n} kļūda', other: '{n} kļūdas' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Iztukšot',
  'key.qrImage': 'QR no attēla',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Izslēgt kameru',
  'key.copy': 'Kopēt',
  'key.copyDone': 'Nokopēts',
  'key.copyFailed': 'Neizdevās',

  'viewfinder.hint': 'Turiet QR kodu rāmī',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { zero: '{n} ciparu', one: '{n} cipars', other: '{n} cipari' },
  'strip.period': '{n} s',
  'strip.next': 'seko',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'sekundes',
  'strip.seconds.valid': 'derīgs',
  'strip.accountFallback': 'Konts {n}',
  'strip.copyAria': 'Kopēt {name} kodu',
  'strip.copyAnnounce': 'Kods {digits} nokopēts',
  'strip.copyFailedHint': 'Kopēšana neizdevās. Iezīmējiet kodu ar roku.',

  'fault.title': 'Rinda nav salasāma',

  'vault.state.off': 'Izslēgts — nekas netiek saglabāts',
  'vault.state.locked': 'Aizslēgts — vajadzīga paroles frāze',
  'vault.state.open': 'Atvērts — secret ir teksta laukā',
  'vault.explain':
    'Pēc noklusējuma Clockwork nesaglabā neko. Kas vēlas, var atstāt ievadi šeit šifrētu ar ' +
    'paroles frāzi: PBKDF2-SHA-256 ar {iterations} iterācijām, pēc tam AES-256-GCM. Bez ' +
    'paroles frāzes saglabātais bloks nav nekā vērts.',
  'vault.pass.new': 'Jauna paroles frāze',
  'vault.pass.existing': 'Paroles frāze',
  'vault.action.seal': 'Saglabāt šifrētu',
  'vault.action.unseal': 'Atslēgt',
  'vault.action.deriving': 'Atslēga tiek atvasināta …',
  'vault.action.lock': 'Aizslēgt',
  'vault.action.update': 'Saglabāt no jauna',
  'vault.action.wipe': 'Dzēst visu',
  'vault.action.wipeConfirm': 'Tiešām dzēst?',
  'vault.timeout.label': 'Aizslēdzas pats pēc',
  'vault.timeout.minutes': { zero: '{n} minūtēm', one: '{n} minūtes', other: '{n} minūtēm' },
  'vault.lockOnHide': 'un pametot cilni',

  'vault.error.nothingToStore': 'Nav ko saglabāt — teksta lauks ir tukšs.',
  'vault.error.storageBlocked': 'Pārlūks neļauj saglabāt (privātais režīms?).',
  'vault.error.noVault': 'Neviens seifs nav saglabāts.',
  'vault.error.noPassphrase': 'Bez paroles frāzes nav atslēgas.',
  'vault.error.sealFailed': 'Saglabāšana neizdevās.',
  'vault.error.unsealFailed': 'Atslēgšana neizdevās.',

  'vault.msg.sealed': 'Seifs saglabāts šifrēts.',
  'vault.msg.resealed': 'Seifs šifrēts no jauna.',
  'vault.msg.unsealed': 'Seifs atslēgts.',
  'vault.msg.locked': 'Seifs aizslēgts.',
  'vault.msg.wiped': 'Seifs izdzēsts.',
  'vault.msg.wipedNote': 'Izdzēsts. Krātuvē vairs nekā nav.',
  'vault.locked.idle': {
    zero: 'Aizslēgts pēc {n} minūtēm bez ievades.',
    one: 'Aizslēgts pēc {n} minūtes bez ievades.',
    other: 'Aizslēgts pēc {n} minūtēm bez ievades.',
  },
  'vault.locked.hidden': 'Aizslēgts, pametot cilni.',

  'scan.noQr': 'Attēlā nebija saskatāms neviens QR kods.',
  'scan.unreadable': 'Attēlu neizdevās nolasīt — vai tas tiešām ir attēls?',
  'scan.done': 'QR kods nolasīts un ievietots.',
  'scan.camera.unavailable':
    'Šī vide neatdod kameru. Atverot kā datni (file://), lielākā daļa pārlūku to bloķē — ' +
    '„QR no attēla“ darbojas vienmēr.',
  'scan.camera.denied':
    'Kamera tika atteikta. Atiestatiet atļauju pārlūkā — vai izmantojiet „QR no attēla“.',
  'scan.camera.notFound': 'Nav pieslēgta neviena kamera. „QR no attēla“ darbojas tik un tā.',
  'scan.camera.busy': 'Kameru pašlaik izmanto cita programma.',
  'scan.camera.failed': 'Kameru neizdevās palaist. „QR no attēla“ darbojas vienmēr.',

  'import.done': {
    zero: 'Pārņemti {n} kontu no Google Authenticator eksporta',
    one: 'Pārņemts {n} konts no Google Authenticator eksporta',
    other: 'Pārņemti {n} konti no Google Authenticator eksporta',
  },
  'import.skipped': 'izlaists: {list}',
  'import.skip.hotp': '{label} (HOTP, balstīts uz skaitītāju)',
  'import.skip.algorithm': '{label} (neatbalstīts algoritms)',
  'import.skip.emptySecret': '{label} (tukšs secret)',
  'import.unnamed': 'Bez nosaukuma',
  'import.unreadable': 'Eksports nav salasāms.',

  'vacant.text': 'Vēl nekas nav ievadīts. Ielieciet augšā secret.',
  'vacant.demo': 'Ievietot testa atslēgu',
  'colophon.note': 'Bez tīkla · bez krātuves · HMAC caur Web Crypto API',

  'lang.label': 'Valoda',
  'lang.aria': 'Izvēlieties valodu',

  'err.base32.paddingInside': 'Zīme „=“ drīkst atrasties tikai beigās (tā ir tikai aizpildījums).',
  'err.base32.empty': 'Atslēga secret ir tukša.',
  'err.base32.badChar':
    'Nederīga zīme „{char}“ pozīcijā {position}. Base32 pazīst tikai A–Z un 2–7 — cipari 0, 1 ' +
    'un 8 tajā neparādās (sajaukti ar O, I un B?).',
  'err.base32.badLength':
    'Nederīgs garums: {length} zīmes (bez atstarpēm un aizpildījuma). Base32 kodē 5 baitus ' +
    '8 zīmēs; pēdējā blokā iespējamas tikai 2, 4, 5, 7 vai 8 zīmes. Visticamāk, trūkst vienas ' +
    'zīmes vai ir viena par daudz.',

  'err.uri.invalid': 'Šis nav derīgs URI. Gaidīts tiek „otpauth://totp/…“.',
  'err.uri.scheme': 'Nezināma shēma „{scheme}“. Gaidīts tiek „otpauth“.',
  'err.uri.hotp':
    'Šis ir HOTP URI (balstīts uz skaitītāju). Šī lietotne veido tikai uz laiku balstītus ' +
    'TOTP kodus — citādi būtu jāsaglabā skaitītāja stāvoklis.',
  'err.uri.type': 'Nezināms veids „{type}“. Pēc „otpauth://“ jābūt „totp“.',
  'err.uri.typeEmpty': '(tukšs)',
  'err.uri.noSecret': 'URI trūkst parametra „secret“.',
  'err.uri.badLabel': 'URI etiķetē ir bojāts procentu kodējums (piemēram, vientuļa „%“ zīme).',
  'err.uri.algorithm': 'Nezināms algoritms „{value}“. Atbalstīti ir SHA1, SHA256 un SHA512.',
  'err.uri.digits': 'Nederīga vērtība „digits“: {value}. Atļauts no {min} līdz {max}.',
  'err.uri.period': 'Nederīga vērtība „period“: {value}. Gaidītas 1 līdz 3600 sekundes.',
  'err.uri.integer': 'Parametram „{name}“ jābūt veselam skaitlim; atrasts tika „{value}“.',

  'err.otp.digits': 'Nederīgs ciparu skaits: {value}. Atļauts no {min} līdz {max}.',
  'err.otp.emptySecret': 'Secret ir tukšs — no tā nevar aprēķināt nevienu kodu.',

  'err.line.unreadable': 'Šo rindu neizdevās nolasīt.',

  'err.vault.openFailed':
    'Seifu neizdevās atvērt. Nepareiza paroles frāze — vai saglabātie dati ir mainīti.',
  'err.vault.badFormat': 'Saglabātajiem seifa datiem ir nezināms formāts.',
  'err.vault.version': 'Seifa versija {version} netiek atbalstīta (gaidīts: {expected}).',
  'err.vault.base64': 'Seifa datu lauks „{field}“ nav derīgs Base64.',
  'err.vault.iterations': 'Nederīgs iterāciju skaits: {value}.',

  'err.migration.notExport':
    'Šis nav Google Authenticator eksports. Gaidīts tiek ' +
    '„otpauth-migration://offline?data=…“.',
  'err.migration.noData': 'URI trūkst parametra „data“.',
  'err.migration.badPercent': 'Parametrā „data“ ir bojāts procentu kodējums.',
  'err.migration.badBase64': 'Parametrs „data“ nav derīgs Base64.',
  'err.migration.noAccounts': 'Šajā eksportā nav neviena konta.',
} satisfies Strings;
