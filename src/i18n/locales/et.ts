/**
 * Eesti.
 *
 * Sõnastik: secret · seif (vault) · konto · paroolifraas (passphrase) · kirje ·
 *   kood · numbrilaud. „Secret“ jääb tõlkimata — nii seisab see ka teenuse­
 *   pakkujate lehtedel.
 * Register: umbisikuline ja asjalik, nagu arendustööriistades.
 * Jutumärgid: „ … “, eesti tüpograafia järgi.
 * Mitmus: arvsõna järel tuleb osastav („2 kontot“), ainsus ainult ühega.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP-autentija',
  'meta.description':
    'Clockwork — TOTP-autentija. Loob kaheastmelise kinnituse koodid täielikult brauseris, ' +
    'ilma ühegi võrgupäringuta.',
  'brand.tagline': 'TOTP-autentija · RFC 6238',
  'skip.toCodes': 'Hüppa koodide juurde',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Võrguühenduseta',
  'status.vault.off': 'midagi ei salvestata',
  'status.vault.locked': 'seif lukus',
  'status.vault.open': 'seif avatud',

  'zone.input': 'Sisend',
  'zone.vault': 'Seif',
  'zone.codes': 'Koodid',

  'input.legend': 'Üks kirje rea kohta',
  'input.placeholder':
    'nt JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} või {uri} — segamini. {hash} alustab märkust.',
  'input.help.images': 'QR-pilte saab ka siia lohistada või kleepida klahvidega {paste}.',
  'input.help.migration': 'Google Authenticatori eksportfailid ({migration}) teisendatakse ise.',
  'input.help.more': 'Kõik sisendvormingud',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} konto', other: '{n} kontot' },
  'input.count.errors': { one: '{n} viga', other: '{n} viga' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Tühjenda',
  'key.qrImage': 'QR pildilt',
  'key.camera': 'Kaamera',
  'key.cameraStop': 'Lülita kaamera välja',
  'key.copy': 'Kopeeri',
  'key.copyDone': 'Kopeeritud',
  'key.copyFailed': 'Ebaõnnestus',

  'viewfinder.hint': 'Hoia QR-kood raami sees',

  'filter.label': 'Filtreeri kontosid',
  'filter.placeholder': 'Filtreeri nime järgi',
  'filter.empty': 'Miski ei vasta otsingule „{query}“.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} number', other: '{n} numbrit' },
  'strip.period': '{n} s',
  'strip.next': 'järgmine',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'sekundit',
  'strip.seconds.valid': 'kehtib',
  'strip.accountFallback': 'Konto {n}',
  'strip.copyAria': 'Kopeeri {name} kood',
  'strip.copyAnnounce': 'Kood {digits} kopeeritud',
  'strip.copyFailedHint': 'Kopeerimine ebaõnnestus. Vali kood käsitsi.',

  'fault.title': 'Rida ei ole loetav',

  'vault.state.off': 'Väljas — midagi ei salvestata',
  'vault.state.locked': 'Lukus — vaja on paroolifraasi',
  'vault.state.open': 'Avatud — secretid on tekstiväljal',
  'vault.explain':
    'Vaikimisi ei salvesta Clockwork midagi. Kui lülitad seifi sisse, jääb sisestatu siia ' +
    'sinu paroolifraasiga krüpteerituna — ilma selleta on salvestatud plokk väärtusetu.',
  'vault.explain.crypto':
    'Võti tuletatakse paroolifraasist PBKDF2-SHA-256-ga ja {iterations} iteratsiooniga, ' +
    'krüpteerib AES-256-GCM. Salvestatakse ainult pitseeritud ümbrik: mitte kunagi avatud ' +
    'tekst, mitte paroolifraas, mitte tuletatud võti.',
  'vault.explain.more': 'Kõik üksikasjad',
  'vault.pass.new': 'Uus paroolifraas',
  'vault.pass.existing': 'Paroolifraas',
  'vault.action.seal': 'Salvesta krüptitult',
  'vault.action.unseal': 'Ava',
  'vault.action.deriving': 'Võtme tuletamine …',
  'vault.action.lock': 'Lukusta',
  'vault.action.update': 'Salvesta uuesti',
  'vault.action.wipe': 'Kustuta kõik',
  'vault.action.wipeConfirm': 'Kas tõesti kustutada?',
  'vault.timeout.label': 'Lukustub ise, kui möödub',
  'vault.timeout.minutes': { one: '{n} minut', other: '{n} minutit' },
  'vault.lockOnHide': 'ja kaardilt lahkumisel',

  'vault.error.nothingToStore': 'Salvestada pole midagi — tekstiväli on tühi.',
  'vault.error.storageBlocked': 'Brauser ei luba salvestada (privaatrežiim?).',
  'vault.error.noVault': 'Ühtki seifi ei ole salvestatud.',
  'vault.error.noPassphrase': 'Ilma paroolifraasita ei ole võtit.',
  'vault.error.sealFailed': 'Salvestamine ebaõnnestus.',
  'vault.error.unsealFailed': 'Avamine ebaõnnestus.',

  'vault.msg.sealed': 'Seif salvestatud krüptitult.',
  'vault.msg.resealed': 'Seif uuesti krüptitud.',
  'vault.msg.unsealed': 'Seif avatud.',
  'vault.msg.locked': 'Seif lukustatud.',
  'vault.msg.wiped': 'Seif kustutatud.',
  'vault.msg.wipedNote': 'Kustutatud. Salvestusruumi ei jäänud midagi.',
  'vault.locked.idle': {
    one: 'Lukustus pärast {n} minutit ilma sisendita.',
    other: 'Lukustus pärast {n} minutit ilma sisendita.',
  },
  'vault.locked.hidden': 'Lukustus kaardilt lahkumisel.',

  'scan.noQr': 'Pildilt ei olnud ühtki QR-koodi näha.',
  'scan.unreadable': 'Pilti ei õnnestunud lugeda — kas see on tõesti pilt?',
  'scan.done': 'QR-kood loetud ja lisatud.',
  'scan.camera.unavailable':
    'See keskkond ei anna kaamerat kasutada. Failina avades (file://) blokeerib enamik ' +
    'brausereid selle — „QR pildilt“ töötab alati.',
  'scan.camera.denied':
    'Kaamerast keelduti. Lähtesta luba brauseris — või kasuta valikut „QR pildilt“.',
  'scan.camera.notFound': 'Ühtki kaamerat pole ühendatud. „QR pildilt“ töötab siiski.',
  'scan.camera.busy': 'Kaamerat kasutab praegu teine programm.',
  'scan.camera.failed': 'Kaamerat ei õnnestunud käivitada. „QR pildilt“ töötab alati.',

  'import.done': {
    one: '{n} konto võetud Google Authenticatori eksportfailist',
    other: '{n} kontot võetud Google Authenticatori eksportfailist',
  },
  'import.skipped': 'vahele jäetud: {list}',
  'import.skip.hotp': '{label} (HOTP, loenduripõhine)',
  'import.skip.algorithm': '{label} (algoritmi ei toetata)',
  'import.skip.emptySecret': '{label} (tühi secret)',
  'import.unnamed': 'Nimeta',
  'import.unreadable': 'Eksportfail ei ole loetav.',

  'vacant.text':
    'Salajane võti, otpauth-link või QR-pilt — miski neist ei lahku sellest brauserist.',
  'vacant.demo': 'Lisa testvõti',
  'colophon.note': 'Ei mingit võrku · ei mingit salvestust · HMAC Web Crypto API kaudu',

  'lang.label': 'Keel',
  'lang.aria': 'Vali keel',

  'err.base32.paddingInside': 'Märk „=“ tohib olla ainult lõpus (see on pelgalt täide).',
  'err.base32.empty': 'Võti secret on tühi.',
  'err.base32.badChar':
    'Sobimatu märk „{char}“ kohal {position}. Base32 tunneb ainult A–Z ja 2–7 — numbreid 0, 1 ' +
    'ja 8 selles ei esine (aetud segamini tähtedega O, I ja B?).',
  'err.base32.badLength':
    'Sobimatu pikkus: {length} märki (ilma tühikute ja täiteta). Base32 kodeerib 5 baiti ' +
    '8 märgiks; viimases plokis mahub ainult 2, 4, 5, 7 või 8 märki. Tõenäoliselt on üks ' +
    'märk puudu või üks liiga palju.',

  'err.uri.invalid': 'See ei ole kehtiv URI. Oodatakse kujul „otpauth://totp/…“.',
  'err.uri.scheme': 'Tundmatu skeem „{scheme}“. Oodatakse „otpauth“.',
  'err.uri.hotp':
    'See on HOTP-URI (loenduripõhine). See rakendus loob ainult ajapõhiseid TOTP-koode — ' +
    'muidu tuleks loenduri seis salvestada.',
  'err.uri.type': 'Tundmatu tüüp „{type}“. Pärast „otpauth://“ peab seisma „totp“.',
  'err.uri.typeEmpty': '(tühi)',
  'err.uri.noSecret': 'URI-s puudub parameeter „secret“.',
  'err.uri.badLabel': 'URI silt sisaldab katkist protsendikodeeringut (näiteks üksik „%“).',
  'err.uri.algorithm': 'Tundmatu algoritm „{value}“. Toetatud on SHA1, SHA256 ja SHA512.',
  'err.uri.digits': 'Sobimatu väärtus väljale „digits“: {value}. Lubatud on {min} kuni {max}.',
  'err.uri.period': 'Sobimatu väärtus väljale „period“: {value}. Oodatakse 1 kuni 3600 sekundit.',
  'err.uri.integer': 'Parameeter „{name}“ peab olema täisarv; leiti „{value}“.',

  'err.otp.digits': 'Sobimatu numbrite arv: {value}. Lubatud on {min} kuni {max}.',
  'err.otp.emptySecret': 'Secret on tühi — sellest ei saa ühtki koodi arvutada.',

  'err.line.unreadable': 'Seda rida ei õnnestunud lugeda.',

  'err.vault.openFailed':
    'Seifi ei õnnestunud avada. Vale paroolifraas — või on salvestatud andmeid muudetud.',
  'err.vault.badFormat': 'Salvestatud seifiandmed on tundmatus vormingus.',
  'err.vault.version': 'Seifi versiooni {version} ei toetata (oodati: {expected}).',
  'err.vault.base64': 'Seifiandmete väli „{field}“ ei ole kehtiv Base64.',
  'err.vault.iterations': 'Sobimatu korduste arv: {value}.',

  'err.migration.notExport':
    'See ei ole Google Authenticatori eksportfail. Oodatakse kujul ' +
    '„otpauth-migration://offline?data=…“.',
  'err.migration.noData': 'URI-s puudub parameeter „data“.',
  'err.migration.badPercent': 'Parameeter „data“ sisaldab katkist protsendikodeeringut.',
  'err.migration.badBase64': 'Parameeter „data“ ei ole kehtiv Base64.',
  'err.migration.noAccounts': 'Selles eksportfailis ei ole ühtki kontot.',

  'native.vacant.text':
    'Salajane võti, otpauth-link või QR-pilt — miski neist ei lahku sellest seadmest.',

  'native.colophon.note': 'Ei mingit võrku · ei mingit salvestust · HMAC javax.crypto kaudu',

  'native.scan.camera.unavailable':
    'See seade ei anna kaamerat kasutada — „QR pildilt“ töötab alati.',
  'native.scan.camera.denied':
    'Kaamerast keelduti. Anna luba süsteemi rakenduste seadetes — või kasuta valikut „QR pildilt“.',
} satisfies Strings;
