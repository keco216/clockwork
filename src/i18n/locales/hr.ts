/**
 * Hrvatski.
 *
 * Rječnik: secret · sef (vault) · račun · zaporka (passphrase) · unos · kod ·
 *   brojčanik. „Secret“ ostaje u izvorniku — tako piše i na stranicama davatelja.
 * Registar: neosoban i stvaran, kao u alatima za razvojne inženjere.
 * Navodnici: „ … “, prema hrvatskoj tipografiji.
 * Množina: CLDR daje one, few i other (genitiv množine za 5 i više).
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP autentifikator',
  'meta.description':
    'Clockwork — TOTP autentifikator. Dvofaktorske kodove stvara u cijelosti u pregledniku, ' +
    'bez ijednog mrežnog zahtjeva.',
  'brand.tagline': 'TOTP autentifikator · RFC 6238',
  'skip.toCodes': 'Skoči na kodove',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Bez mreže',
  'status.vault.off': 'ništa se ne sprema',
  'status.vault.locked': 'sef zaključan',
  'status.vault.open': 'sef otvoren',

  'zone.input': 'Unos',
  'zone.vault': 'Sef',
  'zone.codes': 'Kodovi',

  'input.legend': 'Jedan unos po retku',
  'input.help.formats': 'Base32, {nameSecret} ili {uri} — izmiješano. {hash} započinje bilješku.',
  'input.help.images': 'Slike s QR kodom mogu se dovući ovamo ili zalijepiti pomoću {paste}.',
  'input.help.migration': 'Izvozi iz Google Authenticatora ({migration}) pretvaraju se automatski.',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} račun', few: '{n} računa', other: '{n} računa' },
  'input.count.errors': { one: '{n} greška', few: '{n} greške', other: '{n} grešaka' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Isprazni',
  'key.qrImage': 'QR iz slike',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Isključi kameru',
  'key.copy': 'Kopiraj',
  'key.copyDone': 'Kopirano',
  'key.copyFailed': 'Nije uspjelo',

  'viewfinder.hint': 'Držite QR kod u okviru',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} znamenka', few: '{n} znamenke', other: '{n} znamenki' },
  'strip.period': '{n} s',
  'strip.next': 'slijedi',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'sekunde',
  'strip.seconds.valid': 'vrijedi',
  'strip.accountFallback': 'Račun {n}',
  'strip.copyAria': 'Kopiraj kod za {name}',
  'strip.copyAnnounce': 'Kod {digits} kopiran',
  'strip.copyFailedHint': 'Kopiranje nije uspjelo. Označite kod ručno.',

  'fault.title': 'Redak nečitljiv',

  'vault.state.off': 'Isključen — ništa se ne sprema',
  'vault.state.locked': 'Zaključan — potrebna je zaporka',
  'vault.state.open': 'Otvoren — secreti su u tekstnom polju',
  'vault.explain':
    'Clockwork prema zadanome ne sprema ništa. Tko želi, može unos ostaviti ovdje šifriran ' +
    'zaporkom: PBKDF2-SHA-256 s {iterations} ponavljanja, zatim AES-256-GCM. Bez zaporke ' +
    'spremljeni blok ne vrijedi ništa.',
  'vault.pass.new': 'Nova zaporka',
  'vault.pass.existing': 'Zaporka',
  'vault.action.seal': 'Spremi šifrirano',
  'vault.action.unseal': 'Otključaj',
  'vault.action.deriving': 'Izvođenje ključa …',
  'vault.action.lock': 'Zaključaj',
  'vault.action.update': 'Spremi ponovno',
  'vault.action.wipe': 'Izbriši sve',
  'vault.action.wipeConfirm': 'Zaista izbrisati?',
  'vault.timeout.label': 'Sam se zaključava nakon',
  'vault.timeout.minutes': { one: '{n} minute', few: '{n} minute', other: '{n} minuta' },
  'vault.lockOnHide': 'i pri napuštanju kartice',

  'vault.error.nothingToStore': 'Nema se što spremiti — tekstno polje je prazno.',
  'vault.error.storageBlocked': 'Preglednik ne dopušta spremanje (privatni način?).',
  'vault.error.noVault': 'Nijedan sef nije spremljen.',
  'vault.error.noPassphrase': 'Bez zaporke nema ključa.',
  'vault.error.sealFailed': 'Spremanje nije uspjelo.',
  'vault.error.unsealFailed': 'Otključavanje nije uspjelo.',

  'vault.msg.sealed': 'Sef spremljen šifrirano.',
  'vault.msg.resealed': 'Sef ponovno šifriran.',
  'vault.msg.unsealed': 'Sef otključan.',
  'vault.msg.locked': 'Sef zaključan.',
  'vault.msg.wiped': 'Sef izbrisan.',
  'vault.msg.wipedNote': 'Izbrisano. U pohrani više ništa nije ostalo.',
  'vault.locked.idle': {
    one: 'Zaključano nakon {n} minute bez unosa.',
    few: 'Zaključano nakon {n} minute bez unosa.',
    other: 'Zaključano nakon {n} minuta bez unosa.',
  },
  'vault.locked.hidden': 'Zaključano pri napuštanju kartice.',

  'scan.noQr': 'Na slici se nije mogao prepoznati nijedan QR kod.',
  'scan.unreadable': 'Sliku nije bilo moguće pročitati — je li to doista slika?',
  'scan.done': 'QR kod pročitan i umetnut.',
  'scan.camera.unavailable':
    'Ovo okruženje ne daje kameru. Pri otvaranju kao datoteka (file://) većina je ' +
    'preglednika blokira — „QR iz slike“ radi uvijek.',
  'scan.camera.denied':
    'Kamera je odbijena. Poništite dopuštenje u pregledniku — ili upotrijebite „QR iz slike“.',
  'scan.camera.notFound': 'Nijedna kamera nije priključena. „QR iz slike“ ipak radi.',
  'scan.camera.busy': 'Kameru trenutačno koristi drugi program.',
  'scan.camera.failed': 'Kameru nije bilo moguće pokrenuti. „QR iz slike“ radi uvijek.',

  'import.done': {
    one: 'Preuzet {n} račun iz izvoza Google Authenticatora',
    few: 'Preuzeta {n} računa iz izvoza Google Authenticatora',
    other: 'Preuzeto {n} računa iz izvoza Google Authenticatora',
  },
  'import.skipped': 'preskočeno: {list}',
  'import.skip.hotp': '{label} (HOTP, na temelju brojača)',
  'import.skip.algorithm': '{label} (nepodržan algoritam)',
  'import.skip.emptySecret': '{label} (prazan secret)',
  'import.unnamed': 'Bez naziva',
  'import.unreadable': 'Izvoz nečitljiv.',

  'vacant.text': 'Još nema unosa. Gore umetnite secret.',
  'colophon.note': 'Bez mreže · bez pohrane · HMAC preko Web Crypto API',

  'lang.label': 'Jezik',
  'lang.aria': 'Odaberi jezik',

  'err.base32.paddingInside': 'Znak „=“ smije stajati samo na kraju (puko je ispunjavanje).',
  'err.base32.empty': 'Ključ secret je prazan.',
  'err.base32.badChar':
    'Neispravan znak „{char}“ na mjestu {position}. Base32 poznaje samo A–Z i 2–7 — znamenke ' +
    '0, 1 i 8 u njemu se ne pojavljuju (zamijenjene s O, I i B?).',
  'err.base32.badLength':
    'Neispravna duljina: {length} znakova (bez razmaka i ispune). Base32 kodira 5 bajtova u ' +
    '8 znakova; u posljednjem su bloku moguća samo 2, 4, 5, 7 ili 8 znakova. Vjerojatno ' +
    'nedostaje jedan znak ili ga je jedan previše.',

  'err.uri.invalid': 'Ovo nije valjani URI. Očekuje se „otpauth://totp/…“.',
  'err.uri.scheme': 'Nepoznata shema „{scheme}“. Očekuje se „otpauth“.',
  'err.uri.hotp':
    'Ovo je URI vrste HOTP (na temelju brojača). Ova aplikacija stvara samo vremenske ' +
    'TOTP kodove — inače bi trebalo spremati stanje brojača.',
  'err.uri.type': 'Nepoznata vrsta „{type}“. Nakon „otpauth://“ mora stajati „totp“.',
  'err.uri.typeEmpty': '(prazno)',
  'err.uri.noSecret': 'U URI-ju nedostaje parametar „secret“.',
  'err.uri.badLabel':
    'Oznaka URI-ja sadrži pokvareno postotno kodiranje (primjerice usamljen „%“).',
  'err.uri.algorithm': 'Nepoznat algoritam „{value}“. Podržani su SHA1, SHA256 i SHA512.',
  'err.uri.digits': 'Neispravna vrijednost za „digits“: {value}. Dopušteno je {min} do {max}.',
  'err.uri.period': 'Neispravna vrijednost za „period“: {value}. Očekuje se 1 do 3600 sekundi.',
  'err.uri.integer': 'Parametar „{name}“ mora biti cijeli broj; pronađeno je „{value}“.',

  'err.otp.digits': 'Neispravan broj znamenki: {value}. Dopušteno je {min} do {max}.',
  'err.otp.emptySecret': 'Secret je prazan — iz njega se ne može izračunati nijedan kod.',

  'err.line.unreadable': 'Ovaj redak nije bilo moguće pročitati.',

  'err.vault.openFailed':
    'Sef se nije dao otvoriti. Pogrešna zaporka — ili su spremljeni podaci izmijenjeni.',
  'err.vault.badFormat': 'Spremljeni podaci sefa u nepoznatom su obliku.',
  'err.vault.version': 'Inačica sefa {version} nije podržana (očekivano: {expected}).',
  'err.vault.base64': 'Polje „{field}“ podataka sefa nije valjani Base64.',
  'err.vault.iterations': 'Neispravan broj ponavljanja: {value}.',

  'err.migration.notExport':
    'Ovo nije izvoz iz Google Authenticatora. Očekuje se ' +
    '„otpauth-migration://offline?data=…“.',
  'err.migration.noData': 'U URI-ju nedostaje parametar „data“.',
  'err.migration.badPercent': 'Parametar „data“ sadrži pokvareno postotno kodiranje.',
  'err.migration.badBase64': 'Parametar „data“ nije valjani Base64.',
  'err.migration.noAccounts': 'U ovom izvozu nema nijednog računa.',
} satisfies Strings;
