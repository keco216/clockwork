/**
 * Slovenčina.
 *
 * Slovník: secret · trezor (vault) · účet · heslová fráza (passphrase) ·
 *   položka · kód · číselník. „Secret“ zostáva v pôvodnej podobe — tak to stojí
 *   aj na stránkach poskytovateľov.
 * Register: neosobný a vecný, ako v nástrojoch pre vývojárov.
 * Úvodzovky: „ … “, podľa slovenskej typografie.
 * Množné číslo: CLDR dáva one (1), few (2–4), many (desatinné čísla),
 *   other (0 a 5 a viac).
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — autentifikátor TOTP',
  'meta.description':
    'Clockwork — autentifikátor TOTP. Vytvára dvojfaktorové kódy úplne v prehliadači, bez ' +
    'jedinej sieťovej požiadavky.',
  'brand.tagline': 'Autentifikátor TOTP · RFC 6238',
  'skip.toCodes': 'Prejsť na kódy',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Bez siete',
  'status.vault.off': 'nič sa neukladá',
  'status.vault.locked': 'trezor zamknutý',
  'status.vault.open': 'trezor otvorený',

  'zone.input': 'Vstup',
  'zone.vault': 'Trezor',
  'zone.codes': 'Kódy',

  'input.legend': 'Jedna položka na riadok',
  'input.placeholder':
    'napr. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} alebo {uri} — pomiešané. {hash} začína poznámku.',
  'input.help.images': 'Obrázky s QR kódom sa dajú sem aj pretiahnuť alebo vložiť cez {paste}.',
  'input.help.migration':
    'Exporty z Google Authenticatora ({migration}) sa prevádzajú automaticky.',
  'input.help.more': 'Všetky vstupné formáty',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': {
    one: '{n} účet',
    few: '{n} účty',
    many: '{n} účtu',
    other: '{n} účtov',
  },
  'input.count.errors': {
    one: '{n} chyba',
    few: '{n} chyby',
    many: '{n} chyby',
    other: '{n} chýb',
  },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Vyprázdniť',
  'key.qrImage': 'QR z obrázka',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Vypnúť kameru',
  'key.copy': 'Kopírovať',
  'key.copyDone': 'Skopírované',
  'key.copyFailed': 'Nepodarilo sa',

  'viewfinder.hint': 'Držte QR kód v rámčeku',

  'filter.label': 'Filtrovať účty',
  'filter.placeholder': 'Filtrovať podľa názvu',
  'filter.empty': 'Nič nezodpovedá „{query}“.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': {
    one: '{n} číslica',
    few: '{n} číslice',
    many: '{n} číslice',
    other: '{n} číslic',
  },
  'strip.period': '{n} s',
  'strip.next': 'nasleduje',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'sekundy',
  'strip.seconds.valid': 'platí',
  'strip.accountFallback': 'Účet {n}',
  'strip.copyAria': 'Skopírovať kód pre {name}',
  'strip.copyAnnounce': 'Kód {digits} skopírovaný',
  'strip.copyFailedHint': 'Kopírovanie sa nepodarilo. Označte kód ručne.',

  'fault.title': 'Riadok nečitateľný',

  'vault.state.off': 'Vypnuté — nič sa neukladá',
  'vault.state.locked': 'Zamknuté — treba heslovú frázu',
  'vault.state.open': 'Otvorené — secrety sú v textovom poli',
  'vault.explain':
    'Clockwork v predvolenom nastavení neukladá nič. Keď zapnete trezor, zostane zadanie ' +
    'tu zašifrované vašou heslovou frázou — bez nej je uložený blok bezcenný.',
  'vault.explain.crypto':
    'Kľúč vzniká z heslovej frázy pomocou PBKDF2-SHA-256 s {iterations} iteráciami, ' +
    'šifruje AES-256-GCM. Ukladá sa len zapečatená obálka: nikdy otvorený text, nikdy ' +
    'heslová fráza, nikdy odvodený kľúč.',
  'vault.explain.more': 'Všetky podrobnosti',
  'vault.pass.new': 'Nová heslová fráza',
  'vault.pass.existing': 'Heslová fráza',
  'vault.action.seal': 'Uložiť zašifrované',
  'vault.action.unseal': 'Odomknúť',
  'vault.action.deriving': 'Odvodzuje sa kľúč …',
  'vault.action.lock': 'Zamknúť',
  'vault.action.update': 'Uložiť znova',
  'vault.action.wipe': 'Zmazať všetko',
  'vault.action.wipeConfirm': 'Naozaj zmazať?',
  'vault.timeout.label': 'Zamkne sa sám po',
  'vault.timeout.minutes': {
    one: '{n} minúte',
    few: '{n} minútach',
    many: '{n} minúty',
    other: '{n} minútach',
  },
  'vault.lockOnHide': 'a pri opustení karty',

  'vault.error.nothingToStore': 'Nie je čo uložiť — textové pole je prázdne.',
  'vault.error.storageBlocked': 'Prehliadač ukladanie nepovolí (anonymný režim?).',
  'vault.error.noVault': 'Žiadny trezor nie je uložený.',
  'vault.error.noPassphrase': 'Bez heslovej frázy niet kľúča.',
  'vault.error.sealFailed': 'Uloženie sa nepodarilo.',
  'vault.error.unsealFailed': 'Odomknutie sa nepodarilo.',

  'vault.msg.sealed': 'Trezor uložený zašifrovane.',
  'vault.msg.resealed': 'Trezor znova zašifrovaný.',
  'vault.msg.unsealed': 'Trezor odomknutý.',
  'vault.msg.locked': 'Trezor zamknutý.',
  'vault.msg.wiped': 'Trezor zmazaný.',
  'vault.msg.wipedNote': 'Zmazané. V úložisku už nič nezostalo.',
  'vault.locked.idle': {
    one: 'Zamknuté po {n} minúte bez zadávania.',
    few: 'Zamknuté po {n} minútach bez zadávania.',
    many: 'Zamknuté po {n} minúty bez zadávania.',
    other: 'Zamknuté po {n} minútach bez zadávania.',
  },
  'vault.locked.hidden': 'Zamknuté pri opustení karty.',

  'scan.noQr': 'V obrázku sa nedal rozpoznať žiadny QR kód.',
  'scan.unreadable': 'Obrázok sa nepodarilo prečítať — je to naozaj obrázok?',
  'scan.done': 'QR kód prečítaný a vložený.',
  'scan.camera.unavailable':
    'Toto prostredie kameru neuvoľní. Pri otvorení ako súbor (file://) ju väčšina ' +
    'prehliadačov blokuje — „QR z obrázka“ funguje vždy.',
  'scan.camera.denied':
    'Kamera bola odmietnutá. Zrušte oprávnenie v prehliadači — alebo použite ' + '„QR z obrázka“.',
  'scan.camera.notFound': 'Nie je pripojená žiadna kamera. „QR z obrázka“ funguje aj tak.',
  'scan.camera.busy': 'Kameru práve používa iný program.',
  'scan.camera.failed': 'Kameru sa nepodarilo spustiť. „QR z obrázka“ funguje vždy.',

  'import.done': {
    one: 'Prevzatý {n} účet z exportu Google Authenticatora',
    few: 'Prevzaté {n} účty z exportu Google Authenticatora',
    many: 'Prevzatých {n} účtu z exportu Google Authenticatora',
    other: 'Prevzatých {n} účtov z exportu Google Authenticatora',
  },
  'import.skipped': 'preskočené: {list}',
  'import.skip.hotp': '{label} (HOTP, založené na počítadle)',
  'import.skip.algorithm': '{label} (nepodporovaný algoritmus)',
  'import.skip.emptySecret': '{label} (prázdny secret)',
  'import.unnamed': 'Bez názvu',
  'import.unreadable': 'Export nečitateľný.',

  'vacant.text': 'Secret, odkaz otpauth alebo obrázok QR — nič z toho neopustí tento prehliadač.',
  'vacant.demo': 'Vložiť testovací kľúč',
  'colophon.note': 'Žiadna sieť · žiadne úložisko · HMAC cez Web Crypto API',

  'lang.label': 'Jazyk',
  'lang.aria': 'Zvoliť jazyk',

  'err.base32.paddingInside': 'Znak „=“ smie stáť len na konci (je to iba výplň).',
  'err.base32.empty': 'Kľúč secret je prázdny.',
  'err.base32.badChar':
    'Neplatný znak „{char}“ na pozícii {position}. Base32 pozná len A–Z a 2–7 — číslice 0, 1 ' +
    'a 8 sa v ňom nevyskytujú (zamenené s O, I a B?).',
  'err.base32.badLength':
    'Neplatná dĺžka: {length} znakov (bez medzier a výplne). Base32 kóduje 5 bajtov do ' +
    '8 znakov; v poslednom bloku sú možné len 2, 4, 5, 7 alebo 8 znakov. Pravdepodobne jeden ' +
    'znak chýba, alebo je jeden navyše.',

  'err.uri.invalid': 'Toto nie je platné URI. Očakáva sa „otpauth://totp/…“.',
  'err.uri.scheme': 'Neznáma schéma „{scheme}“. Očakáva sa „otpauth“.',
  'err.uri.hotp':
    'Toto je URI typu HOTP (založené na počítadle). Táto aplikácia vytvára iba časové kódy ' +
    'TOTP — inak by bolo treba ukladať stav počítadla.',
  'err.uri.type': 'Neznámy typ „{type}“. Po „otpauth://“ musí stáť „totp“.',
  'err.uri.typeEmpty': '(prázdne)',
  'err.uri.noSecret': 'V URI chýba parameter „secret“.',
  'err.uri.badLabel':
    'Menovka URI obsahuje poškodené percentové kódovanie (napríklad osamotené „%“).',
  'err.uri.algorithm': 'Neznámy algoritmus „{value}“. Podporované sú SHA1, SHA256 a SHA512.',
  'err.uri.digits': 'Neplatná hodnota „digits“: {value}. Povolené je {min} až {max}.',
  'err.uri.period': 'Neplatná hodnota „period“: {value}. Očakáva sa 1 až 3600 sekúnd.',
  'err.uri.integer': 'Parameter „{name}“ musí byť celé číslo; nájdené bolo „{value}“.',

  'err.otp.digits': 'Neplatný počet číslic: {value}. Povolené je {min} až {max}.',
  'err.otp.emptySecret': 'Secret je prázdny — nedá sa z neho vypočítať žiadny kód.',

  'err.line.unreadable': 'Tento riadok sa nepodarilo prečítať.',

  'err.vault.openFailed':
    'Trezor sa nepodarilo otvoriť. Chybná heslová fráza — alebo boli uložené údaje zmenené.',
  'err.vault.badFormat': 'Uložené údaje trezora majú neznámy formát.',
  'err.vault.version': 'Verzia trezora {version} nie je podporovaná (očakávané: {expected}).',
  'err.vault.base64': 'Pole „{field}“ údajov trezora nie je platné Base64.',
  'err.vault.iterations': 'Neplatný počet iterácií: {value}.',

  'err.migration.notExport':
    'Toto nie je export z Google Authenticatora. Očakáva sa ' +
    '„otpauth-migration://offline?data=…“.',
  'err.migration.noData': 'V URI chýba parameter „data“.',
  'err.migration.badPercent': 'Parameter „data“ obsahuje poškodené percentové kódovanie.',
  'err.migration.badBase64': 'Parameter „data“ nie je platné Base64.',
  'err.migration.noAccounts': 'V tomto exporte nie sú žiadne účty.',

  'native.vacant.text':
    'Secret, odkaz otpauth alebo obrázok QR — nič z toho neopustí toto zariadenie.',
} satisfies Strings;
