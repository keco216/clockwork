/**
 * Slovenščina.
 *
 * Slovar: secret · trezor (vault) · račun · geselna fraza (passphrase) · vnos ·
 *   koda · številčnica. „Secret“ ostane v izvirniku — tako piše tudi na straneh
 *   ponudnikov.
 * Register: neoseben in stvaren, kakor v razvijalskih orodjih.
 * Narekovaji: „ … “, po slovenski tipografiji.
 * Množina: slovenščina ima dvojino — CLDR daje one (1), two (2), few (3–4)
 *   in other (5 in več).
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — overjevalnik TOTP',
  'meta.description':
    'Clockwork — overjevalnik TOTP. Kode za dvostopenjsko potrjevanje ustvari v celoti v ' +
    'brskalniku, brez ene same omrežne zahteve.',
  'brand.tagline': 'Overjevalnik TOTP · RFC 6238',
  'skip.toCodes': 'Skoči na kode',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Brez omrežja',
  'status.vault.off': 'nič se ne shranjuje',
  'status.vault.locked': 'trezor zaklenjen',
  'status.vault.open': 'trezor odprt',

  'zone.input': 'Vnos',
  'zone.vault': 'Trezor',
  'zone.codes': 'Kode',

  'input.legend': 'En vnos na vrstico',
  'input.help.formats': 'Base32, {nameSecret} ali {uri} — pomešano. {hash} začne opombo.',
  'input.help.images': 'Slike s kodo QR lahko povlečete sem ali prilepite s {paste}.',
  'input.help.migration': 'Izvozi iz Google Authenticatorja ({migration}) se pretvorijo samodejno.',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': {
    one: '{n} račun',
    two: '{n} računa',
    few: '{n} računi',
    other: '{n} računov',
  },
  'input.count.errors': {
    one: '{n} napaka',
    two: '{n} napaki',
    few: '{n} napake',
    other: '{n} napak',
  },
  'input.count.join': '{accounts} · {errors}',

  'key.demo': 'Vstavi predstavitev',
  'key.clear': 'Izprazni',
  'key.qrImage': 'QR iz slike',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Izklopi kamero',
  'key.copy': 'Kopiraj',
  'key.copyDone': 'Kopirano',
  'key.copyFailed': 'Ni uspelo',

  'viewfinder.hint': 'Kodo QR držite v okvirju',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': {
    one: '{n} števka',
    two: '{n} števki',
    few: '{n} števke',
    other: '{n} števk',
  },
  'strip.period': '{n} s',
  'strip.next': 'sledi',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'sekunde',
  'strip.seconds.valid': 'velja',
  'strip.accountFallback': 'Račun {n}',
  'strip.copyAria': 'Kopiraj kodo za {name}',
  'strip.copyAnnounce': 'Koda {digits} kopirana',
  'strip.copyFailedHint': 'Kopiranje ni uspelo. Kodo označite ročno.',

  'fault.title': 'Vrstica ni berljiva',

  'vault.state.off': 'Izklopljen — nič se ne shranjuje',
  'vault.state.locked': 'Zaklenjen — potrebna je geselna fraza',
  'vault.state.open': 'Odprt — secreti so v besedilnem polju',
  'vault.explain':
    'Clockwork privzeto ne shrani ničesar. Kdor želi, lahko vnos pusti tukaj šifriran z ' +
    'geselno frazo: PBKDF2-SHA-256 z {iterations} ponovitvami, nato AES-256-GCM. Brez geselne ' +
    'fraze je shranjeni blok brez vrednosti.',
  'vault.pass.new': 'Nova geselna fraza',
  'vault.pass.existing': 'Geselna fraza',
  'vault.action.seal': 'Shrani šifrirano',
  'vault.action.unseal': 'Odkleni',
  'vault.action.deriving': 'Izpeljevanje ključa …',
  'vault.action.lock': 'Zakleni',
  'vault.action.update': 'Shrani znova',
  'vault.action.wipe': 'Izbriši vse',
  'vault.action.wipeConfirm': 'Res izbrisati?',
  'vault.timeout.label': 'Sam se zaklene po',
  'vault.timeout.minutes': {
    one: '{n} minuti',
    two: '{n} minutah',
    few: '{n} minutah',
    other: '{n} minutah',
  },
  'vault.lockOnHide': 'in ob zapustitvi zavihka',

  'vault.error.nothingToStore': 'Ni česa shraniti — besedilno polje je prazno.',
  'vault.error.storageBlocked': 'Brskalnik shranjevanja ne dovoli (zasebni način?).',
  'vault.error.noVault': 'Noben trezor ni shranjen.',
  'vault.error.noPassphrase': 'Brez geselne fraze ni ključa.',
  'vault.error.sealFailed': 'Shranjevanje ni uspelo.',
  'vault.error.unsealFailed': 'Odklepanje ni uspelo.',

  'vault.msg.sealed': 'Trezor shranjen šifrirano.',
  'vault.msg.resealed': 'Trezor znova šifriran.',
  'vault.msg.unsealed': 'Trezor odklenjen.',
  'vault.msg.locked': 'Trezor zaklenjen.',
  'vault.msg.wiped': 'Trezor izbrisan.',
  'vault.msg.wipedNote': 'Izbrisano. V shrambi ni ostalo nič.',
  'vault.locked.idle': {
    one: 'Zaklenjeno po {n} minuti brez vnosa.',
    two: 'Zaklenjeno po {n} minutah brez vnosa.',
    few: 'Zaklenjeno po {n} minutah brez vnosa.',
    other: 'Zaklenjeno po {n} minutah brez vnosa.',
  },
  'vault.locked.hidden': 'Zaklenjeno ob zapustitvi zavihka.',

  'scan.noQr': 'Na sliki ni bilo mogoče prepoznati nobene kode QR.',
  'scan.unreadable': 'Slike ni bilo mogoče prebrati — je to res slika?',
  'scan.done': 'Koda QR prebrana in vstavljena.',
  'scan.camera.unavailable':
    'To okolje ne da kamere na voljo. Ob odprtju kot datoteka (file://) jo večina ' +
    'brskalnikov zapre — „QR iz slike“ deluje vedno.',
  'scan.camera.denied':
    'Kamera je bila zavrnjena. Ponastavite dovoljenje v brskalniku — ali uporabite ' +
    '„QR iz slike“.',
  'scan.camera.notFound': 'Nobena kamera ni priključena. „QR iz slike“ deluje kljub temu.',
  'scan.camera.busy': 'Kamero trenutno uporablja drug program.',
  'scan.camera.failed': 'Kamere ni bilo mogoče zagnati. „QR iz slike“ deluje vedno.',

  'import.done': {
    one: 'Prevzet {n} račun iz izvoza Google Authenticatorja',
    two: 'Prevzeta {n} računa iz izvoza Google Authenticatorja',
    few: 'Prevzeti {n} računi iz izvoza Google Authenticatorja',
    other: 'Prevzetih {n} računov iz izvoza Google Authenticatorja',
  },
  'import.skipped': 'preskočeno: {list}',
  'import.skip.hotp': '{label} (HOTP, na podlagi števca)',
  'import.skip.algorithm': '{label} (nepodprt algoritem)',
  'import.skip.emptySecret': '{label} (prazen secret)',
  'import.unnamed': 'Brez imena',
  'import.unreadable': 'Izvoz ni berljiv.',

  'vacant.text':
    'Zaenkrat še ni vnosa. Zgoraj vstavite secret — ali si z {demo} vzemite preskusni ključ ' +
    'iz RFC 4226.',
  'colophon.note': 'Brez omrežja · brez shrambe · HMAC prek Web Crypto API',

  'lang.label': 'Jezik',
  'lang.aria': 'Izberi jezik',

  'demo.comment': '# Preskusni ključ iz RFC 4226 — secret je besedilo „12345678901234567890“',
  'demo.label': 'Preskus RFC',

  'err.base32.paddingInside': 'Znak „=“ sme stati le na koncu (je zgolj polnilo).',
  'err.base32.empty': 'Ključ secret je prazen.',
  'err.base32.badChar':
    'Neveljaven znak „{char}“ na mestu {position}. Base32 pozna le A–Z in 2–7 — števk 0, 1 ' +
    'in 8 v njem ni (zamenjane z O, I in B?).',
  'err.base32.badLength':
    'Neveljavna dolžina: {length} znakov (brez presledkov in polnila). Base32 kodira 5 bajtov ' +
    'v 8 znakov; v zadnjem bloku je mogočih le 2, 4, 5, 7 ali 8 znakov. Najbrž en znak manjka ' +
    'ali pa je eden odveč.',

  'err.uri.invalid': 'To ni veljaven URI. Pričakovano je „otpauth://totp/…“.',
  'err.uri.scheme': 'Neznana shema „{scheme}“. Pričakovano je „otpauth“.',
  'err.uri.hotp':
    'To je URI vrste HOTP (na podlagi števca). Ta aplikacija ustvarja le časovne kode TOTP — ' +
    'za drugo bi bilo treba shranjevati stanje števca.',
  'err.uri.type': 'Neznana vrsta „{type}“. Za „otpauth://“ mora stati „totp“.',
  'err.uri.typeEmpty': '(prazno)',
  'err.uri.noSecret': 'V URI manjka parameter „secret“.',
  'err.uri.badLabel':
    'Oznaka URI vsebuje pokvarjeno odstotkovno kodiranje (na primer osamljen „%“).',
  'err.uri.algorithm': 'Neznan algoritem „{value}“. Podprti so SHA1, SHA256 in SHA512.',
  'err.uri.digits': 'Neveljavna vrednost za „digits“: {value}. Dovoljeno je od {min} do {max}.',
  'err.uri.period': 'Neveljavna vrednost za „period“: {value}. Pričakovano je 1 do 3600 sekund.',
  'err.uri.integer': 'Parameter „{name}“ mora biti celo število; najdeno je bilo „{value}“.',

  'err.otp.digits': 'Neveljavno število števk: {value}. Dovoljeno je od {min} do {max}.',
  'err.otp.emptySecret': 'Secret je prazen — iz njega ni mogoče izračunati nobene kode.',

  'err.line.unreadable': 'Te vrstice ni bilo mogoče prebrati.',

  'err.vault.openFailed':
    'Trezorja ni bilo mogoče odpreti. Napačna geselna fraza — ali pa so bili shranjeni ' +
    'podatki spremenjeni.',
  'err.vault.badFormat': 'Shranjeni podatki trezorja so v neznani obliki.',
  'err.vault.version': 'Različica trezorja {version} ni podprta (pričakovano: {expected}).',
  'err.vault.base64': 'Polje „{field}“ podatkov trezorja ni veljaven Base64.',
  'err.vault.iterations': 'Neveljavno število ponovitev: {value}.',

  'err.migration.notExport':
    'To ni izvoz iz Google Authenticatorja. Pričakovano je ' +
    '„otpauth-migration://offline?data=…“.',
  'err.migration.noData': 'V URI manjka parameter „data“.',
  'err.migration.badPercent': 'Parameter „data“ vsebuje pokvarjeno odstotkovno kodiranje.',
  'err.migration.badBase64': 'Parameter „data“ ni veljaven Base64.',
  'err.migration.noAccounts': 'V tem izvozu ni nobenega računa.',
} satisfies Strings;
