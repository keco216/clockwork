/**
 * Nederlands.
 *
 * Woordenlijst: secret · kluis (vault) · account · wachtwoordzin (passphrase) ·
 *   invoer · code · wijzerplaat. « Secret » blijft staan: zo heet het ook op de
 *   pagina’s van de aanbieders.
 * Register: onpersoonlijk en nuchter, zoals in ontwikkelaarsgereedschap.
 * Aanhalingstekens: ‘ … ’, gangbaar in het Nederlands.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP-authenticator',
  'meta.description':
    'Clockwork — TOTP-authenticator. Maakt tweefactorcodes volledig in de browser, zonder ' +
    'enig netwerkverzoek.',
  'brand.tagline': 'TOTP-authenticator · RFC 6238',
  'skip.toCodes': 'Naar de codes',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Offline',
  'status.vault.off': 'er wordt niets bewaard',
  'status.vault.locked': 'kluis op slot',
  'status.vault.open': 'kluis open',

  'zone.input': 'Invoer',
  'zone.vault': 'Kluis',
  'zone.codes': 'Codes',

  'input.legend': 'Eén invoer per regel',
  'input.help.formats': 'Base32, {nameSecret} of {uri} — door elkaar. {hash} begint een notitie.',
  'input.help.images':
    'QR-afbeeldingen kunnen ook hierheen worden gesleept of met {paste} worden geplakt.',
  'input.help.migration':
    'Exports uit Google Authenticator ({migration}) worden automatisch omgezet.',
  'input.help.more': 'Alle invoerformaten',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} account', other: '{n} accounts' },
  'input.count.errors': { one: '{n} fout', other: '{n} fouten' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Leegmaken',
  'key.qrImage': 'QR uit afbeelding',
  'key.camera': 'Camera',
  'key.cameraStop': 'Camera uit',
  'key.copy': 'Kopiëren',
  'key.copyDone': 'Gekopieerd',
  'key.copyFailed': 'Mislukt',

  'viewfinder.hint': 'Houd de QR-code in het kader',

  'filter.label': 'Accounts filteren',
  'filter.placeholder': 'Filteren op naam',
  'filter.empty': 'Niets komt overeen met “{query}”.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} cijfer', other: '{n} cijfers' },
  'strip.period': '{n} s',
  'strip.next': 'volgt',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'seconden',
  'strip.seconds.valid': 'geldig',
  'strip.accountFallback': 'Account {n}',
  'strip.copyAria': 'Code van {name} kopiëren',
  'strip.copyAnnounce': 'Code {digits} gekopieerd',
  'strip.copyFailedHint': 'Kopiëren is mislukt. Selecteer de code met de hand.',

  'fault.title': 'Regel onleesbaar',

  'vault.state.off': 'Uit — er wordt niets bewaard',
  'vault.state.locked': 'Op slot — wachtwoordzin nodig',
  'vault.state.open': 'Open — de secrets staan in het tekstveld',
  'vault.explain':
    'Standaard bewaart Clockwork niets. Wie dat wil, kan de invoer hier versleuteld met een ' +
    'wachtwoordzin bewaren: PBKDF2-SHA-256 met {iterations} iteraties, daarna AES-256-GCM. ' +
    'Zonder de wachtwoordzin is het bewaarde blok waardeloos.',
  'vault.pass.new': 'Nieuwe wachtwoordzin',
  'vault.pass.existing': 'Wachtwoordzin',
  'vault.action.seal': 'Versleuteld bewaren',
  'vault.action.unseal': 'Openen',
  'vault.action.deriving': 'Sleutel wordt afgeleid …',
  'vault.action.lock': 'Op slot',
  'vault.action.update': 'Opnieuw bewaren',
  'vault.action.wipe': 'Alles wissen',
  'vault.action.wipeConfirm': 'Echt wissen?',
  'vault.timeout.label': 'Gaat vanzelf op slot na',
  'vault.timeout.minutes': { one: '{n} minuut', other: '{n} minuten' },
  'vault.lockOnHide': 'en bij het verlaten van het tabblad',

  'vault.error.nothingToStore': 'Er is niets te bewaren — het tekstveld is leeg.',
  'vault.error.storageBlocked': 'De browser staat bewaren niet toe (privémodus?).',
  'vault.error.noVault': 'Er is geen kluis bewaard.',
  'vault.error.noPassphrase': 'Zonder wachtwoordzin is er geen sleutel.',
  'vault.error.sealFailed': 'Bewaren is mislukt.',
  'vault.error.unsealFailed': 'Openen is mislukt.',

  'vault.msg.sealed': 'Kluis versleuteld bewaard.',
  'vault.msg.resealed': 'Kluis opnieuw versleuteld.',
  'vault.msg.unsealed': 'Kluis geopend.',
  'vault.msg.locked': 'Kluis op slot.',
  'vault.msg.wiped': 'Kluis gewist.',
  'vault.msg.wipedNote': 'Gewist. Er staat niets meer in de opslag.',
  'vault.locked.idle': {
    one: 'Na {n} minuut zonder invoer op slot gegaan.',
    other: 'Na {n} minuten zonder invoer op slot gegaan.',
  },
  'vault.locked.hidden': 'Op slot gegaan bij het verlaten van het tabblad.',

  'scan.noQr': 'In de afbeelding was geen QR-code te herkennen.',
  'scan.unreadable': 'De afbeelding kon niet worden gelezen — is het echt een afbeelding?',
  'scan.done': 'QR-code gelezen en ingevoegd.',
  'scan.camera.unavailable':
    'Deze omgeving geeft geen camera vrij. Bij het openen als bestand (file://) blokkeren de ' +
    'meeste browsers hem — ‘QR uit afbeelding’ werkt altijd.',
  'scan.camera.denied':
    'De camera is geweigerd. Zet de toestemming in de browser terug — of gebruik ' +
    '‘QR uit afbeelding’.',
  'scan.camera.notFound': 'Er is geen camera aangesloten. ‘QR uit afbeelding’ werkt toch.',
  'scan.camera.busy': 'De camera is op dit moment in gebruik door een ander programma.',
  'scan.camera.failed': 'De camera kon niet worden gestart. ‘QR uit afbeelding’ werkt altijd.',

  'import.done': {
    one: '{n} account overgenomen uit de Google Authenticator-export',
    other: '{n} accounts overgenomen uit de Google Authenticator-export',
  },
  'import.skipped': 'overgeslagen: {list}',
  'import.skip.hotp': '{label} (HOTP, op teller gebaseerd)',
  'import.skip.algorithm': '{label} (niet-ondersteund algoritme)',
  'import.skip.emptySecret': '{label} (leeg secret)',
  'import.unnamed': 'Naamloos',
  'import.unreadable': 'Export onleesbaar.',

  'vacant.text': 'Secret, otpauth-link of QR-afbeelding — niets daarvan verlaat deze browser.',
  'vacant.demo': 'Testsleutel invoegen',
  'colophon.note': 'Geen netwerk · geen opslag · HMAC via de Web Crypto API',

  'lang.label': 'Taal',
  'lang.aria': 'Taal kiezen',

  'err.base32.paddingInside':
    'Het teken ‘=’ mag alleen aan het eind staan (het is niet meer dan opvulling).',
  'err.base32.empty': 'De secret-sleutel is leeg.',
  'err.base32.badChar':
    'Ongeldig teken ‘{char}’ op plaats {position}. Base32 kent alleen A–Z en 2–7 — de ' +
    'cijfers 0, 1 en 8 komen er niet in voor (verward met O, I en B?).',
  'err.base32.badLength':
    'Ongeldige lengte: {length} tekens (zonder spaties en opvulling). Base32 codeert 5 bytes ' +
    'in 8 tekens; in het laatste blok passen alleen 2, 4, 5, 7 of 8 tekens. Waarschijnlijk ' +
    'ontbreekt er een teken of is er een te veel.',

  'err.uri.invalid': 'Dit is geen geldige URI. Verwacht wordt ‘otpauth://totp/…’.',
  'err.uri.scheme': 'Onbekend schema ‘{scheme}’. Verwacht wordt ‘otpauth’.',
  'err.uri.hotp':
    'Dit is een HOTP-URI (op teller gebaseerd). Deze app maakt alleen codes op tijdbasis — ' +
    'daarvoor zou de tellerstand bewaard moeten worden.',
  'err.uri.type': 'Onbekend type ‘{type}’. Na ‘otpauth://’ moet ‘totp’ staan.',
  'err.uri.typeEmpty': '(leeg)',
  'err.uri.noSecret': 'In de URI ontbreekt de parameter ‘secret’.',
  'err.uri.badLabel':
    'Het label van de URI bevat een kapotte procentcodering (bijvoorbeeld een losse ‘%’).',
  'err.uri.algorithm': 'Onbekend algoritme ‘{value}’. Ondersteund worden SHA1, SHA256 en SHA512.',
  'err.uri.digits': 'Ongeldige waarde voor ‘digits’: {value}. Toegestaan zijn {min} tot {max}.',
  'err.uri.period': 'Ongeldige waarde voor ‘period’: {value}. Verwacht worden 1 tot 3600 seconden.',
  'err.uri.integer': 'De parameter ‘{name}’ moet een heel getal zijn; gevonden werd ‘{value}’.',

  'err.otp.digits': 'Ongeldig aantal cijfers: {value}. Toegestaan zijn {min} tot {max}.',
  'err.otp.emptySecret': 'Het secret is leeg — daaruit valt geen code te berekenen.',

  'err.line.unreadable': 'Deze regel kon niet worden gelezen.',

  'err.vault.openFailed':
    'De kluis ging niet open. Verkeerde wachtwoordzin — of de bewaarde gegevens zijn ' +
    'gewijzigd.',
  'err.vault.badFormat': 'De bewaarde kluisgegevens hebben een onbekende opmaak.',
  'err.vault.version': 'Kluisversie {version} wordt niet ondersteund (verwacht: {expected}).',
  'err.vault.base64': 'Het veld ‘{field}’ van de kluisgegevens is geen geldige Base64.',
  'err.vault.iterations': 'Ongeldig aantal iteraties: {value}.',

  'err.migration.notExport':
    'Dit is geen Google Authenticator-export. Verwacht wordt ' +
    '‘otpauth-migration://offline?data=…’.',
  'err.migration.noData': 'In de URI ontbreekt de parameter ‘data’.',
  'err.migration.badPercent': 'De parameter ‘data’ bevat een kapotte procentcodering.',
  'err.migration.badBase64': 'De parameter ‘data’ is geen geldige Base64.',
  'err.migration.noAccounts': 'In deze export staan geen accounts.',
} satisfies Strings;
