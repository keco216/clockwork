/**
 * Norsk bokmål.
 *
 * Ordliste: secret · safe (vault) · konto · passordfrase (passphrase) · oppføring ·
 *   kode · urskive. «Secret» står uoversatt — slik heter det også hos
 *   leverandørene.
 * Tiltale: du, kort og saklig, som i utviklerverktøy.
 * Anførselstegn: « … », etter norsk typografi.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP-autentisering',
  'meta.description':
    'Clockwork — TOTP-autentisering. Lager tofaktorkoder utelukkende i nettleseren, uten en ' +
    'eneste nettverksforespørsel.',
  'brand.tagline': 'TOTP-autentisering · RFC 6238',
  'skip.toCodes': 'Hopp til kodene',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Frakoblet',
  'status.vault.off': 'ingenting lagres',
  'status.vault.locked': 'safen er låst',
  'status.vault.open': 'safen er åpen',

  'zone.input': 'Inndata',
  'zone.vault': 'Safe',
  'zone.codes': 'Koder',

  'input.legend': 'Én oppføring per linje',
  'input.placeholder':
    'f.eks. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} eller {uri} — blandet. {hash} starter et notat.',
  'input.help.images': 'QR-bilder kan også dras hit eller limes inn med {paste}.',
  'input.help.migration':
    'Eksporter fra Google Authenticator ({migration}) blir omgjort automatisk.',
  'input.help.more': 'Alle inndataformater',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} konto', other: '{n} kontoer' },
  'input.count.errors': { one: '{n} feil', other: '{n} feil' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Tøm',
  'key.qrImage': 'QR fra bilde',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Slå av kameraet',
  'key.copy': 'Kopier',
  'key.copyDone': 'Kopiert',
  'key.copyFailed': 'Mislyktes',

  'viewfinder.hint': 'Hold QR-koden innenfor rammen',

  'filter.label': 'Filtrer kontoer',
  'filter.placeholder': 'Filtrer etter navn',
  'filter.empty': 'Ingenting stemmer med «{query}».',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} siffer', other: '{n} sifre' },
  'strip.period': '{n} s',
  'strip.next': 'følger',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'sekunder',
  'strip.seconds.valid': 'gyldig',
  'strip.accountFallback': 'Konto {n}',
  'strip.copyAria': 'Kopier koden for {name}',
  'strip.copyAnnounce': 'Koden {digits} kopiert',
  'strip.copyFailedHint': 'Kopieringen mislyktes. Merk koden for hånd.',

  'fault.title': 'Linjen kan ikke leses',

  'vault.state.off': 'Av — ingenting lagres',
  'vault.state.locked': 'Låst — passordfrase trengs',
  'vault.state.open': 'Åpen — dine secrets ligger i tekstfeltet',
  'vault.explain':
    'Som standard lagrer Clockwork ingenting. Slår du på safen, blir det du skrev ' +
    'liggende her kryptert med passordfrasen din — uten den er den lagrede blokken ' +
    'verdiløs.',
  'vault.explain.crypto':
    'Nøkkelen utledes fra passordfrasen med PBKDF2-SHA-256 og {iterations} iterasjoner, ' +
    'og AES-256-GCM gjør krypteringen. Bare den lukkede konvolutten lagres: aldri ' +
    'klartekst, aldri passordfrasen, aldri den utledede nøkkelen.',
  'vault.explain.more': 'Alle detaljer',
  'vault.pass.new': 'Ny passordfrase',
  'vault.pass.existing': 'Passordfrase',
  'vault.action.seal': 'Lagre kryptert',
  'vault.action.unseal': 'Lås opp',
  'vault.action.deriving': 'Nøkkelen utledes …',
  'vault.action.lock': 'Lås',
  'vault.action.update': 'Lagre på nytt',
  'vault.action.wipe': 'Slett alt',
  'vault.action.wipeConfirm': 'Slette på ordentlig?',
  'vault.timeout.label': 'Låser seg selv etter',
  'vault.timeout.minutes': { one: '{n} minutt', other: '{n} minutter' },
  'vault.lockOnHide': 'og når fanen forlates',

  'vault.error.nothingToStore': 'Det er ingenting å lagre — tekstfeltet er tomt.',
  'vault.error.storageBlocked': 'Nettleseren tillater ikke lagring (privat modus?).',
  'vault.error.noVault': 'Ingen safe er lagret.',
  'vault.error.noPassphrase': 'Uten passordfrase finnes ingen nøkkel.',
  'vault.error.sealFailed': 'Lagringen mislyktes.',
  'vault.error.unsealFailed': 'Opplåsingen mislyktes.',

  'vault.msg.sealed': 'Safen lagret kryptert.',
  'vault.msg.resealed': 'Safen kryptert på nytt.',
  'vault.msg.unsealed': 'Safen låst opp.',
  'vault.msg.locked': 'Safen låst.',
  'vault.msg.wiped': 'Safen slettet.',
  'vault.msg.wipedNote': 'Slettet. Det ligger ikke noe igjen i lageret.',
  'vault.locked.idle': {
    one: 'Låst etter {n} minutt uten inndata.',
    other: 'Låst etter {n} minutter uten inndata.',
  },
  'vault.locked.hidden': 'Låst da fanen ble forlatt.',

  'scan.noQr': 'Det var ingen QR-kode å se på bildet.',
  'scan.unreadable': 'Bildet kunne ikke leses — er det virkelig et bilde?',
  'scan.done': 'QR-koden lest og satt inn.',
  'scan.camera.unavailable':
    'Dette miljøet gir ikke tilgang til noe kamera. Åpnet som fil (file://) sperrer de ' +
    'fleste nettlesere det — «QR fra bilde» virker alltid.',
  'scan.camera.denied':
    'Kameraet ble avvist. Tilbakestill tillatelsen i nettleseren — eller bruk «QR fra bilde».',
  'scan.camera.notFound': 'Ingen kamera er tilkoblet. «QR fra bilde» virker likevel.',
  'scan.camera.busy': 'Kameraet brukes akkurat nå av et annet program.',
  'scan.camera.failed': 'Kameraet kunne ikke startes. «QR fra bilde» virker alltid.',

  'import.done': {
    one: '{n} konto hentet fra Google Authenticator-eksporten',
    other: '{n} kontoer hentet fra Google Authenticator-eksporten',
  },
  'import.skipped': 'hoppet over: {list}',
  'import.skip.hotp': '{label} (HOTP, tellerbasert)',
  'import.skip.algorithm': '{label} (algoritmen støttes ikke)',
  'import.skip.emptySecret': '{label} (tom secret)',
  'import.unnamed': 'Uten navn',
  'import.unreadable': 'Eksporten kan ikke leses.',

  'vacant.text':
    'Secret, otpauth-lenke eller QR-bilde — ingenting av det forlater denne nettleseren.',
  'vacant.demo': 'Sett inn testnøkkel',
  'colophon.note': 'Ikke noe nettverk · ingen lagring · HMAC via Web Crypto API',

  'lang.label': 'Språk',
  'lang.aria': 'Velg språk',

  'err.base32.paddingInside':
    'Tegnet «=» kan bare stå til slutt (det er ikke annet enn utfylling).',
  'err.base32.empty': 'Nøkkelen secret er tom.',
  'err.base32.badChar':
    'Ugyldig tegn «{char}» på plass {position}. Base32 kjenner bare A–Z og 2–7 — sifrene 0, 1 ' +
    'og 8 forekommer ikke (forvekslet med O, I og B?).',
  'err.base32.badLength':
    'Ugyldig lengde: {length} tegn (uten mellomrom og utfylling). Base32 koder 5 byte i ' +
    '8 tegn; i siste blokk er det bare plass til 2, 4, 5, 7 eller 8 tegn. Sannsynligvis ' +
    'mangler det et tegn, eller så er det ett for mye.',

  'err.uri.invalid': 'Dette er ingen gyldig URI. Ventet: «otpauth://totp/…».',
  'err.uri.scheme': 'Ukjent skjema «{scheme}». Ventet: «otpauth».',
  'err.uri.hotp':
    'Dette er en HOTP-URI (tellerbasert). Denne appen lager bare tidsbaserte TOTP-koder — ' +
    'til det andre måtte tellerstanden lagres.',
  'err.uri.type': 'Ukjent type «{type}». Etter «otpauth://» må «totp» stå.',
  'err.uri.typeEmpty': '(tom)',
  'err.uri.noSecret': 'I URI-en mangler parameteren «secret».',
  'err.uri.badLabel':
    'Etiketten i URI-en inneholder ødelagt prosentkoding (for eksempel en enslig «%»).',
  'err.uri.algorithm': 'Ukjent algoritme «{value}». Støttet er SHA1, SHA256 og SHA512.',
  'err.uri.digits': 'Ugyldig verdi for «digits»: {value}. Tillatt er {min} til {max}.',
  'err.uri.period': 'Ugyldig verdi for «period»: {value}. Ventet er 1 til 3600 sekunder.',
  'err.uri.integer': 'Parameteren «{name}» må være et helt tall; funnet ble «{value}».',

  'err.otp.digits': 'Ugyldig antall sifre: {value}. Tillatt er {min} til {max}.',
  'err.otp.emptySecret': 'Din secret er tom — av den kan ingen kode regnes ut.',

  'err.line.unreadable': 'Denne linjen kunne ikke leses.',

  'err.vault.openFailed':
    'Safen lot seg ikke åpne. Feil passordfrase — eller de lagrede dataene er endret.',
  'err.vault.badFormat': 'De lagrede safedataene har et ukjent format.',
  'err.vault.version': 'Safeversjon {version} støttes ikke (ventet: {expected}).',
  'err.vault.base64': 'Feltet «{field}» i safedataene er ikke gyldig Base64.',
  'err.vault.iterations': 'Ugyldig antall runder: {value}.',

  'err.migration.notExport':
    'Dette er ingen Google Authenticator-eksport. Ventet: ' +
    '«otpauth-migration://offline?data=…».',
  'err.migration.noData': 'I URI-en mangler parameteren «data».',
  'err.migration.badPercent': 'Parameteren «data» inneholder ødelagt prosentkoding.',
  'err.migration.badBase64': 'Parameteren «data» er ikke gyldig Base64.',
  'err.migration.noAccounts': 'I denne eksporten finnes ingen kontoer.',

  'native.vacant.text':
    'Secret, otpauth-lenke eller QR-bilde — ingenting av det forlater denne enheten.',
} satisfies Strings;
