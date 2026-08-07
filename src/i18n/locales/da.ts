/**
 * Dansk.
 *
 * Ordliste: secret · boks (vault) · konto · adgangssætning (passphrase) · post ·
 *   kode · urskive. »Secret« står uoversat — sådan hedder det også hos
 *   udbyderne.
 * Tiltale: du, kort og sagligt, som i udviklerværktøj.
 * Anførselstegn: » … «, efter dansk typografi.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP-godkender',
  'meta.description':
    'Clockwork — TOTP-godkender. Laver tofaktorkoder udelukkende i browseren, uden en eneste ' +
    'netværksforespørgsel.',
  'brand.tagline': 'TOTP-godkender · RFC 6238',
  'skip.toCodes': 'Spring til koderne',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Offline',
  'status.vault.off': 'der gemmes ikke noget',
  'status.vault.locked': 'boksen er låst',
  'status.vault.open': 'boksen er åben',

  'zone.input': 'Indtastning',
  'zone.vault': 'Boks',
  'zone.codes': 'Koder',

  'input.legend': 'Én post pr. linje',
  'input.help.formats': 'Base32, {nameSecret} eller {uri} — blandet. {hash} starter en note.',
  'input.help.images': 'QR-billeder kan også trækkes herhen eller sættes ind med {paste}.',
  'input.help.migration': 'Eksporter fra Google Authenticator ({migration}) omdannes automatisk.',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} konto', other: '{n} konti' },
  'input.count.errors': { one: '{n} fejl', other: '{n} fejl' },
  'input.count.join': '{accounts} · {errors}',

  'key.demo': 'Indsæt demo',
  'key.clear': 'Tøm',
  'key.qrImage': 'QR fra billede',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Sluk kameraet',
  'key.copy': 'Kopiér',
  'key.copyDone': 'Kopieret',
  'key.copyFailed': 'Mislykkedes',

  'viewfinder.hint': 'Hold QR-koden inden for rammen',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} ciffer', other: '{n} cifre' },
  'strip.period': '{n} s',
  'strip.next': 'følger',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'sekunder',
  'strip.seconds.valid': 'gyldig',
  'strip.accountFallback': 'Konto {n}',
  'strip.copyAria': 'Kopiér koden til {name}',
  'strip.copyAnnounce': 'Koden {digits} kopieret',
  'strip.copyFailedHint': 'Kopieringen mislykkedes. Markér koden i hånden.',

  'fault.title': 'Linjen kan ikke læses',

  'vault.state.off': 'Fra — der gemmes ikke noget',
  'vault.state.locked': 'Låst — der skal bruges en adgangssætning',
  'vault.state.open': 'Åben — dine secrets ligger i tekstfeltet',
  'vault.explain':
    'Som udgangspunkt gemmer Clockwork ingenting. Den, der vil, kan lade indtastningen blive ' +
    'her krypteret med en adgangssætning: PBKDF2-SHA-256 med {iterations} gentagelser og ' +
    'derefter AES-256-GCM. Uden adgangssætningen er den gemte blok værdiløs.',
  'vault.pass.new': 'Ny adgangssætning',
  'vault.pass.existing': 'Adgangssætning',
  'vault.action.seal': 'Gem krypteret',
  'vault.action.unseal': 'Lås op',
  'vault.action.deriving': 'Nøglen udledes …',
  'vault.action.lock': 'Lås',
  'vault.action.update': 'Gem igen',
  'vault.action.wipe': 'Slet alt',
  'vault.action.wipeConfirm': 'Slet for alvor?',
  'vault.timeout.label': 'Låser af sig selv efter',
  'vault.timeout.minutes': { one: '{n} minut', other: '{n} minutter' },
  'vault.lockOnHide': 'og når fanen forlades',

  'vault.error.nothingToStore': 'Der er ikke noget at gemme — tekstfeltet er tomt.',
  'vault.error.storageBlocked': 'Browseren tillader ikke at gemme (privat tilstand?).',
  'vault.error.noVault': 'Der er ingen boks gemt.',
  'vault.error.noPassphrase': 'Uden adgangssætning er der ingen nøgle.',
  'vault.error.sealFailed': 'Det lykkedes ikke at gemme.',
  'vault.error.unsealFailed': 'Det lykkedes ikke at låse op.',

  'vault.msg.sealed': 'Boksen gemt krypteret.',
  'vault.msg.resealed': 'Boksen krypteret på ny.',
  'vault.msg.unsealed': 'Boksen låst op.',
  'vault.msg.locked': 'Boksen låst.',
  'vault.msg.wiped': 'Boksen slettet.',
  'vault.msg.wipedNote': 'Slettet. Der ligger ikke mere i lageret.',
  'vault.locked.idle': {
    one: 'Låst efter {n} minut uden indtastning.',
    other: 'Låst efter {n} minutter uden indtastning.',
  },
  'vault.locked.hidden': 'Låst, da fanen blev forladt.',

  'scan.noQr': 'Der var ingen QR-kode at se på billedet.',
  'scan.unreadable': 'Billedet kunne ikke læses — er det virkelig et billede?',
  'scan.done': 'QR-koden læst og indsat.',
  'scan.camera.unavailable':
    'Dette miljø giver ikke adgang til noget kamera. Åbnet som fil (file://) spærrer de ' +
    'fleste browsere for det — »QR fra billede« virker altid.',
  'scan.camera.denied':
    'Kameraet blev afvist. Nulstil tilladelsen i browseren — eller brug »QR fra billede«.',
  'scan.camera.notFound': 'Der er intet kamera tilsluttet. »QR fra billede« virker alligevel.',
  'scan.camera.busy': 'Kameraet bruges lige nu af et andet program.',
  'scan.camera.failed': 'Kameraet kunne ikke startes. »QR fra billede« virker altid.',

  'import.done': {
    one: '{n} konto hentet fra Google Authenticator-eksporten',
    other: '{n} konti hentet fra Google Authenticator-eksporten',
  },
  'import.skipped': 'sprunget over: {list}',
  'import.skip.hotp': '{label} (HOTP, tællerbaseret)',
  'import.skip.algorithm': '{label} (algoritmen understøttes ikke)',
  'import.skip.emptySecret': '{label} (tom secret)',
  'import.unnamed': 'Uden navn',
  'import.unreadable': 'Eksporten kan ikke læses.',

  'vacant.text':
    'Endnu ingenting. Sæt en secret ind ovenfor — eller tag testnøglen fra RFC 4226 med {demo}.',
  'colophon.note': 'Intet netværk · intet lager · HMAC via Web Crypto API',

  'lang.label': 'Sprog',
  'lang.aria': 'Vælg sprog',

  'demo.comment': '# Testnøgle fra RFC 4226 — din secret er teksten »12345678901234567890«',
  'demo.label': 'RFC-test',

  'err.base32.paddingInside': 'Tegnet »=« må kun stå til sidst (det er ikke andet end udfyldning).',
  'err.base32.empty': 'Nøglen secret er tom.',
  'err.base32.badChar':
    'Ugyldigt tegn »{char}« på plads {position}. Base32 kender kun A–Z og 2–7 — cifrene 0, 1 ' +
    'og 8 forekommer ikke (forvekslet med O, I og B?).',
  'err.base32.badLength':
    'Ugyldig længde: {length} tegn (uden mellemrum og udfyldning). Base32 koder 5 byte i ' +
    '8 tegn; i sidste blok er der kun plads til 2, 4, 5, 7 eller 8 tegn. Der mangler ' +
    'sandsynligvis et tegn, eller også er der et for meget.',

  'err.uri.invalid': 'Dette er ikke en gyldig URI. Der ventes »otpauth://totp/…«.',
  'err.uri.scheme': 'Ukendt skema »{scheme}«. Der ventes »otpauth«.',
  'err.uri.hotp':
    'Dette er en HOTP-URI (tællerbaseret). Denne app laver kun tidsbaserede TOTP-koder — ' +
    'til det andet skulle tællerstanden gemmes.',
  'err.uri.type': 'Ukendt type »{type}«. Efter »otpauth://« skal der stå »totp«.',
  'err.uri.typeEmpty': '(tom)',
  'err.uri.noSecret': 'I URI-en mangler parameteren »secret«.',
  'err.uri.badLabel':
    'URI-ens etiket indeholder en ødelagt procentkodning (for eksempel et enkeltstående »%«).',
  'err.uri.algorithm': 'Ukendt algoritme »{value}«. Understøttet er SHA1, SHA256 og SHA512.',
  'err.uri.digits': 'Ugyldig værdi for »digits«: {value}. Tilladt er {min} til {max}.',
  'err.uri.period': 'Ugyldig værdi for »period«: {value}. Der ventes 1 til 3600 sekunder.',
  'err.uri.integer': 'Parameteren »{name}« skal være et helt tal; fundet blev »{value}«.',

  'err.otp.digits': 'Ugyldigt antal cifre: {value}. Tilladt er {min} til {max}.',
  'err.otp.emptySecret': 'Din secret er tom — deraf kan der ikke beregnes nogen kode.',

  'err.line.unreadable': 'Denne linje kunne ikke læses.',

  'err.vault.openFailed':
    'Boksen kunne ikke åbnes. Forkert adgangssætning — eller de gemte data er blevet ændret.',
  'err.vault.badFormat': 'De gemte boksdata har et ukendt format.',
  'err.vault.version': 'Boksversion {version} understøttes ikke (ventet: {expected}).',
  'err.vault.base64': 'Feltet »{field}« i boksdataene er ikke gyldig Base64.',
  'err.vault.iterations': 'Ugyldigt antal gentagelser: {value}.',

  'err.migration.notExport':
    'Dette er ikke en Google Authenticator-eksport. Der ventes ' +
    '»otpauth-migration://offline?data=…«.',
  'err.migration.noData': 'I URI-en mangler parameteren »data«.',
  'err.migration.badPercent': 'Parameteren »data« indeholder en ødelagt procentkodning.',
  'err.migration.badBase64': 'Parameteren »data« er ikke gyldig Base64.',
  'err.migration.noAccounts': 'I denne eksport er der ingen konti.',
} satisfies Strings;
