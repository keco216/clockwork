/**
 * Suomi.
 *
 * Sanasto: secret · holvi (vault) · tili · salauslause (passphrase) · rivi ·
 *   koodi · kellotaulu. ”Secret” jätetään kääntämättä — niin se lukee myös
 *   palveluntarjoajien sivuilla.
 * Sävy: persoonaton ja asiallinen, kuten kehittäjätyökaluissa.
 * Lainausmerkit: ” … ”, suomalaisen typografian mukaan.
 * Monikko: lukusanan jäljessä tulee partitiivi (”2 tiliä”), yksikkö vain
 *   ykkösen kanssa.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP-todennin',
  'meta.description':
    'Clockwork — TOTP-todennin. Luo kaksivaiheiset koodit kokonaan selaimessa, ilman ' +
    'ainuttakaan verkkopyyntöä.',
  'brand.tagline': 'TOTP-todennin · RFC 6238',
  'skip.toCodes': 'Siirry koodeihin',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Ei verkkoa',
  'status.vault.off': 'mitään ei tallenneta',
  'status.vault.locked': 'holvi lukossa',
  'status.vault.open': 'holvi auki',

  'zone.input': 'Syöte',
  'zone.vault': 'Holvi',
  'zone.codes': 'Koodit',

  'input.legend': 'Yksi rivi kutakin kohdetta kohden',
  'input.placeholder':
    'esim. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} tai {uri} — sekaisin. {hash} aloittaa muistiinpanon.',
  'input.help.images': 'QR-kuvia voi myös raahata tähän tai liittää näppäimillä {paste}.',
  'input.help.migration': 'Google Authenticatorin viennit ({migration}) muunnetaan itsestään.',
  'input.help.more': 'Kaikki syötemuodot',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} tili', other: '{n} tiliä' },
  'input.count.errors': { one: '{n} virhe', other: '{n} virhettä' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Tyhjennä',
  'key.qrImage': 'QR kuvasta',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Sammuta kamera',
  'key.copy': 'Kopioi',
  'key.copyDone': 'Kopioitu',
  'key.copyFailed': 'Epäonnistui',

  'viewfinder.hint': 'Pidä QR-koodi kehyksen sisällä',

  'filter.label': 'Suodata tilejä',
  'filter.placeholder': 'Suodata nimen mukaan',
  'filter.empty': 'Mikään ei vastaa hakua ”{query}”.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} numero', other: '{n} numeroa' },
  'strip.period': '{n} s',
  'strip.next': 'seuraava',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'sekuntia',
  'strip.seconds.valid': 'voimassa',
  'strip.accountFallback': 'Tili {n}',
  'strip.copyAria': 'Kopioi kohteen {name} koodi',
  'strip.copyAnnounce': 'Koodi {digits} kopioitu',
  'strip.copyFailedHint': 'Kopiointi epäonnistui. Maalaa koodi käsin.',

  'fault.title': 'Riviä ei voi lukea',

  'vault.state.off': 'Pois — mitään ei tallenneta',
  'vault.state.locked': 'Lukossa — salauslause tarvitaan',
  'vault.state.open': 'Auki — secretit ovat tekstikentässä',
  'vault.explain':
    'Oletuksena Clockwork ei tallenna mitään. Jos otat kassakaapin käyttöön, syöte jää ' +
    'tänne salauslauseellasi salattuna — ilman sitä tallennettu lohko on arvoton.',
  'vault.explain.crypto':
    'Avain johdetaan salauslauseesta PBKDF2-SHA-256:lla ja {iterations} kierroksella, ja ' +
    'salauksen tekee AES-256-GCM. Vain sinetöity kirjekuori tallennetaan: ei koskaan ' +
    'selkokielistä tekstiä, ei salauslausetta, ei johdettua avainta.',
  'vault.explain.more': 'Kaikki yksityiskohdat',
  'vault.pass.new': 'Uusi salauslause',
  'vault.pass.existing': 'Salauslause',
  'vault.action.seal': 'Tallenna salattuna',
  'vault.action.unseal': 'Avaa',
  'vault.action.deriving': 'Avainta johdetaan …',
  'vault.action.lock': 'Lukitse',
  'vault.action.update': 'Tallenna uudelleen',
  'vault.action.wipe': 'Poista kaikki',
  'vault.action.wipeConfirm': 'Poistetaanko oikeasti?',
  'vault.timeout.label': 'Lukittuu itsestään, kun kuluu',
  'vault.timeout.minutes': { one: '{n} minuutti', other: '{n} minuuttia' },
  'vault.lockOnHide': 'ja välilehdeltä poistuttaessa',

  'vault.error.nothingToStore': 'Ei ole mitään tallennettavaa — tekstikenttä on tyhjä.',
  'vault.error.storageBlocked': 'Selain ei salli tallentamista (yksityinen tila?).',
  'vault.error.noVault': 'Yhtään holvia ei ole tallennettu.',
  'vault.error.noPassphrase': 'Ilman salauslausetta ei ole avainta.',
  'vault.error.sealFailed': 'Tallentaminen epäonnistui.',
  'vault.error.unsealFailed': 'Avaaminen epäonnistui.',

  'vault.msg.sealed': 'Holvi tallennettu salattuna.',
  'vault.msg.resealed': 'Holvi salattu uudelleen.',
  'vault.msg.unsealed': 'Holvi avattu.',
  'vault.msg.locked': 'Holvi lukittu.',
  'vault.msg.wiped': 'Holvi poistettu.',
  'vault.msg.wipedNote': 'Poistettu. Tallennustilaan ei jäänyt mitään.',
  'vault.locked.idle': {
    one: 'Lukittui {n} minuutin jälkeen ilman syötettä.',
    other: 'Lukittui {n} minuutin jälkeen ilman syötettä.',
  },
  'vault.locked.hidden': 'Lukittui välilehdeltä poistuttaessa.',

  'scan.noQr': 'Kuvasta ei erottunut yhtään QR-koodia.',
  'scan.unreadable': 'Kuvaa ei voitu lukea — onko se todella kuva?',
  'scan.done': 'QR-koodi luettu ja lisätty.',
  'scan.camera.unavailable':
    'Tämä ympäristö ei anna kameraa käyttöön. Tiedostona avattaessa (file://) useimmat ' +
    'selaimet estävät sen — ”QR kuvasta” toimii aina.',
  'scan.camera.denied':
    'Kamerasta kieltäydyttiin. Nollaa lupa selaimessa — tai käytä toimintoa ”QR kuvasta”.',
  'scan.camera.notFound': 'Kameraa ei ole kytketty. ”QR kuvasta” toimii silti.',
  'scan.camera.busy': 'Kamera on juuri nyt toisen ohjelman käytössä.',
  'scan.camera.failed': 'Kameraa ei saatu käyntiin. ”QR kuvasta” toimii aina.',

  'import.done': {
    one: '{n} tili otettu Google Authenticatorin viennistä',
    other: '{n} tiliä otettu Google Authenticatorin viennistä',
  },
  'import.skipped': 'ohitettu: {list}',
  'import.skip.hotp': '{label} (HOTP, laskuriin perustuva)',
  'import.skip.algorithm': '{label} (algoritmia ei tueta)',
  'import.skip.emptySecret': '{label} (tyhjä secret)',
  'import.unnamed': 'Nimetön',
  'import.unreadable': 'Vientiä ei voi lukea.',

  'vacant.text': 'Secret, otpauth-linkki tai QR-kuva — mikään niistä ei poistu tästä selaimesta.',
  'vacant.demo': 'Lisää testiavain',
  'colophon.note': 'Ei verkkoa · ei tallennusta · HMAC Web Crypto API:n kautta',

  'lang.label': 'Kieli',
  'lang.aria': 'Valitse kieli',

  'err.base32.paddingInside': 'Merkki ”=” saa olla vain lopussa (se on pelkkää täytettä).',
  'err.base32.empty': 'Avain secret on tyhjä.',
  'err.base32.badChar':
    'Kelvoton merkki ”{char}” kohdassa {position}. Base32 tuntee vain kirjaimet A–Z ja ' +
    'numerot 2–7 — numeroita 0, 1 ja 8 siinä ei esiinny (sekoitettu kirjaimiin O, I ja B?).',
  'err.base32.badLength':
    'Kelvoton pituus: {length} merkkiä (ilman välilyöntejä ja täytettä). Base32 koodaa ' +
    '5 tavua 8 merkkiin; viimeiseen lohkoon mahtuu vain 2, 4, 5, 7 tai 8 merkkiä. ' +
    'Todennäköisesti yksi merkki puuttuu tai on yksi liikaa.',

  'err.uri.invalid': 'Tämä ei ole kelvollinen URI. Odotetaan muotoa ”otpauth://totp/…”.',
  'err.uri.scheme': 'Tuntematon skeema ”{scheme}”. Odotetaan ”otpauth”.',
  'err.uri.hotp':
    'Tämä on HOTP-URI (laskuriin perustuva). Tämä sovellus tuottaa vain aikaan perustuvia ' +
    'TOTP-koodeja — muuhun pitäisi tallentaa laskurin tila.',
  'err.uri.type': 'Tuntematon tyyppi ”{type}”. Osoitteen ”otpauth://” jälkeen tulee ”totp”.',
  'err.uri.typeEmpty': '(tyhjä)',
  'err.uri.noSecret': 'URI:sta puuttuu parametri ”secret”.',
  'err.uri.badLabel':
    'URI:n nimiössä on rikkinäinen prosenttikoodaus (esimerkiksi yksinäinen ”%”).',
  'err.uri.algorithm': 'Tuntematon algoritmi ”{value}”. Tuettuja ovat SHA1, SHA256 ja SHA512.',
  'err.uri.digits': 'Kelvoton arvo kentälle ”digits”: {value}. Sallittu on {min}–{max}.',
  'err.uri.period': 'Kelvoton arvo kentälle ”period”: {value}. Odotetaan 1–3600 sekuntia.',
  'err.uri.integer': 'Parametrin ”{name}” on oltava kokonaisluku; löytyi ”{value}”.',

  'err.otp.digits': 'Kelvoton numeroiden määrä: {value}. Sallittu on {min}–{max}.',
  'err.otp.emptySecret': 'Secret on tyhjä — siitä ei voi laskea koodia.',

  'err.line.unreadable': 'Tätä riviä ei voitu lukea.',

  'err.vault.openFailed':
    'Holvia ei saatu auki. Väärä salauslause — tai tallennettuja tietoja on muutettu.',
  'err.vault.badFormat': 'Tallennetut holvitiedot ovat tuntemattomassa muodossa.',
  'err.vault.version': 'Holviversiota {version} ei tueta (odotettiin: {expected}).',
  'err.vault.base64': 'Holvitietojen kenttä ”{field}” ei ole kelvollista Base64:ää.',
  'err.vault.iterations': 'Kelvoton kierrosten määrä: {value}.',

  'err.migration.notExport':
    'Tämä ei ole Google Authenticatorin vienti. Odotetaan muotoa ' +
    '”otpauth-migration://offline?data=…”.',
  'err.migration.noData': 'URI:sta puuttuu parametri ”data”.',
  'err.migration.badPercent': 'Parametrissa ”data” on rikkinäinen prosenttikoodaus.',
  'err.migration.badBase64': 'Parametri ”data” ei ole kelvollista Base64:ää.',
  'err.migration.noAccounts': 'Tässä viennissä ei ole yhtään tiliä.',

  'native.vacant.text':
    'Secret, otpauth-linkki tai QR-kuva — mikään niistä ei poistu tästä laitteesta.',
} satisfies Strings;
