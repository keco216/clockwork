/**
 * Svenska.
 *
 * Ordlista: secret · valv (vault) · konto · lösenfras (passphrase) · post · kod ·
 *   urtavla. ”Secret” står kvar oöversatt — så heter det även hos leverantörerna.
 * Tilltal: du-tilltal, sakligt och kort, som i utvecklarverktyg.
 * Citattecken: ” … ”, enligt svensk typografi.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP-autentiserare',
  'meta.description':
    'Clockwork — TOTP-autentiserare. Skapar tvåfaktorskoder helt och hållet i webbläsaren, ' +
    'utan en enda nätverksbegäran.',
  'brand.tagline': 'TOTP-autentiserare · RFC 6238',
  'skip.toCodes': 'Hoppa till koderna',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Offline',
  'status.vault.off': 'inget sparas',
  'status.vault.locked': 'valvet låst',
  'status.vault.open': 'valvet öppet',

  'zone.input': 'Inmatning',
  'zone.vault': 'Valv',
  'zone.codes': 'Koder',

  'input.legend': 'En post per rad',
  'input.help.formats': 'Base32, {nameSecret} eller {uri} — blandat. {hash} inleder en notering.',
  'input.help.images': 'QR-bilder går också att dra hit eller klistra in med {paste}.',
  'input.help.migration': 'Exporter från Google Authenticator ({migration}) omvandlas automatiskt.',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} konto', other: '{n} konton' },
  'input.count.errors': { one: '{n} fel', other: '{n} fel' },
  'input.count.join': '{accounts} · {errors}',

  'key.demo': 'Sätt in demo',
  'key.clear': 'Töm',
  'key.qrImage': 'QR från bild',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Stäng av kameran',
  'key.copy': 'Kopiera',
  'key.copyDone': 'Kopierad',
  'key.copyFailed': 'Misslyckades',

  'viewfinder.hint': 'Håll QR-koden inom ramen',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} siffra', other: '{n} siffror' },
  'strip.period': '{n} s',
  'strip.next': 'följer',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'sekunder',
  'strip.seconds.valid': 'giltig',
  'strip.accountFallback': 'Konto {n}',
  'strip.copyAria': 'Kopiera koden för {name}',
  'strip.copyAnnounce': 'Koden {digits} kopierad',
  'strip.copyFailedHint': 'Kopieringen misslyckades. Markera koden för hand.',

  'fault.title': 'Raden går inte att läsa',

  'vault.state.off': 'Av — inget sparas',
  'vault.state.locked': 'Låst — lösenfras behövs',
  'vault.state.open': 'Öppet — dina secrets ligger i textfältet',
  'vault.explain':
    'Som standard sparar Clockwork ingenting. Den som vill kan låta inmatningen ligga kvar ' +
    'här krypterad med en lösenfras: PBKDF2-SHA-256 med {iterations} iterationer, sedan ' +
    'AES-256-GCM. Utan lösenfrasen är det sparade blocket värdelöst.',
  'vault.pass.new': 'Ny lösenfras',
  'vault.pass.existing': 'Lösenfras',
  'vault.action.seal': 'Spara krypterat',
  'vault.action.unseal': 'Lås upp',
  'vault.action.deriving': 'Nyckeln härleds …',
  'vault.action.lock': 'Lås',
  'vault.action.update': 'Spara igen',
  'vault.action.wipe': 'Radera allt',
  'vault.action.wipeConfirm': 'Radera på riktigt?',
  'vault.timeout.label': 'Låser sig själv efter',
  'vault.timeout.minutes': { one: '{n} minut', other: '{n} minuter' },
  'vault.lockOnHide': 'och när fliken lämnas',

  'vault.error.nothingToStore': 'Det finns inget att spara — textfältet är tomt.',
  'vault.error.storageBlocked': 'Webbläsaren tillåter inte att spara (privat läge?).',
  'vault.error.noVault': 'Inget valv är sparat.',
  'vault.error.noPassphrase': 'Utan lösenfras finns ingen nyckel.',
  'vault.error.sealFailed': 'Sparandet misslyckades.',
  'vault.error.unsealFailed': 'Upplåsningen misslyckades.',

  'vault.msg.sealed': 'Valvet sparat krypterat.',
  'vault.msg.resealed': 'Valvet krypterat på nytt.',
  'vault.msg.unsealed': 'Valvet upplåst.',
  'vault.msg.locked': 'Valvet låst.',
  'vault.msg.wiped': 'Valvet raderat.',
  'vault.msg.wipedNote': 'Raderat. Det ligger inget kvar i lagringen.',
  'vault.locked.idle': {
    one: 'Låstes efter {n} minut utan inmatning.',
    other: 'Låstes efter {n} minuter utan inmatning.',
  },
  'vault.locked.hidden': 'Låstes när fliken lämnades.',

  'scan.noQr': 'Ingen QR-kod gick att urskilja i bilden.',
  'scan.unreadable': 'Bilden gick inte att läsa — är det verkligen en bild?',
  'scan.done': 'QR-koden inläst och insatt.',
  'scan.camera.unavailable':
    'Den här miljön släpper inte fram någon kamera. Öppnad som fil (file://) blockerar de ' +
    'flesta webbläsare den — ”QR från bild” fungerar alltid.',
  'scan.camera.denied':
    'Kameran nekades. Återställ behörigheten i webbläsaren — eller använd ”QR från bild”.',
  'scan.camera.notFound': 'Ingen kamera är ansluten. ”QR från bild” fungerar ändå.',
  'scan.camera.busy': 'Kameran används just nu av ett annat program.',
  'scan.camera.failed': 'Kameran gick inte att starta. ”QR från bild” fungerar alltid.',

  'import.done': {
    one: '{n} konto hämtat från Google Authenticator-exporten',
    other: '{n} konton hämtade från Google Authenticator-exporten',
  },
  'import.skipped': 'överhoppade: {list}',
  'import.skip.hotp': '{label} (HOTP, räknarbaserad)',
  'import.skip.algorithm': '{label} (algoritmen stöds inte)',
  'import.skip.emptySecret': '{label} (tom secret)',
  'import.unnamed': 'Namnlös',
  'import.unreadable': 'Exporten går inte att läsa.',

  'vacant.text':
    'Inget inmatat än. Sätt in en secret ovanför — eller ta testnyckeln ur RFC 4226 med {demo}.',
  'colophon.note': 'Inget nätverk · ingen lagring · HMAC via Web Crypto API',

  'lang.label': 'Språk',
  'lang.aria': 'Välj språk',

  'demo.comment': '# Testnyckel ur RFC 4226 — din secret är texten ”12345678901234567890”',
  'demo.label': 'RFC-test',

  'err.base32.paddingInside': 'Tecknet ”=” får bara stå sist (det är inget annat än utfyllnad).',
  'err.base32.empty': 'Nyckeln secret är tom.',
  'err.base32.badChar':
    'Ogiltigt tecken ”{char}” på plats {position}. Base32 känner bara till A–Z och 2–7 — ' +
    'siffrorna 0, 1 och 8 förekommer inte (förväxlade med O, I och B?).',
  'err.base32.badLength':
    'Ogiltig längd: {length} tecken (utan mellanslag och utfyllnad). Base32 kodar 5 byte i ' +
    '8 tecken; i sista blocket ryms bara 2, 4, 5, 7 eller 8 tecken. Troligen saknas ett ' +
    'tecken eller finns ett för mycket.',

  'err.uri.invalid': 'Det här är ingen giltig URI. Väntat: ”otpauth://totp/…”.',
  'err.uri.scheme': 'Okänt schema ”{scheme}”. Väntat: ”otpauth”.',
  'err.uri.hotp':
    'Det här är en HOTP-URI (räknarbaserad). Den här appen skapar bara tidsbaserade ' +
    'TOTP-koder — för det andra skulle räknarställningen behöva sparas.',
  'err.uri.type': 'Okänd typ ”{type}”. Efter ”otpauth://” måste ”totp” stå.',
  'err.uri.typeEmpty': '(tom)',
  'err.uri.noSecret': 'I URI:n saknas parametern ”secret”.',
  'err.uri.badLabel':
    'URI:ns etikett innehåller trasig procentkodning (till exempel ett ensamt ”%”).',
  'err.uri.algorithm': 'Okänd algoritm ”{value}”. Stöd finns för SHA1, SHA256 och SHA512.',
  'err.uri.digits': 'Ogiltigt värde för ”digits”: {value}. Tillåtet är {min} till {max}.',
  'err.uri.period': 'Ogiltigt värde för ”period”: {value}. Väntat är 1 till 3600 sekunder.',
  'err.uri.integer': 'Parametern ”{name}” måste vara ett heltal; hittat blev ”{value}”.',

  'err.otp.digits': 'Ogiltigt antal siffror: {value}. Tillåtet är {min} till {max}.',
  'err.otp.emptySecret': 'Din secret är tom — ur den går ingen kod att räkna fram.',

  'err.line.unreadable': 'Den här raden gick inte att läsa.',

  'err.vault.openFailed':
    'Valvet gick inte att öppna. Fel lösenfras — eller så har de sparade uppgifterna ändrats.',
  'err.vault.badFormat': 'De sparade valvuppgifterna har ett okänt format.',
  'err.vault.version': 'Valvversion {version} stöds inte (väntat: {expected}).',
  'err.vault.base64': 'Fältet ”{field}” i valvuppgifterna är inte giltig Base64.',
  'err.vault.iterations': 'Ogiltigt antal iterationer: {value}.',

  'err.migration.notExport':
    'Det här är ingen Google Authenticator-export. Väntat: ' +
    '”otpauth-migration://offline?data=…”.',
  'err.migration.noData': 'I URI:n saknas parametern ”data”.',
  'err.migration.badPercent': 'Parametern ”data” innehåller trasig procentkodning.',
  'err.migration.badBase64': 'Parametern ”data” är inte giltig Base64.',
  'err.migration.noAccounts': 'I den här exporten finns inga konton.',
} satisfies Strings;
