/**
 * Čeština.
 *
 * Slovník: secret · trezor (vault) · účet · heslová fráze (passphrase) ·
 *   položka · kód · číselník. „Secret“ zůstává v původní podobě — tak to stojí
 *   i na stránkách poskytovatelů.
 * Rejstřík: neosobní a věcný, jako v nástrojích pro vývojáře.
 * Uvozovky: „ … “, podle české typografie.
 * Množné číslo: CLDR dává one (1), few (2–4), many (desetinná čísla),
 *   other (0 a 5 a více).
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — autentizátor TOTP',
  'meta.description':
    'Clockwork — autentizátor TOTP. Vytváří dvoufaktorové kódy zcela v prohlížeči, bez ' +
    'jediného síťového požadavku.',
  'brand.tagline': 'Autentizátor TOTP · RFC 6238',
  'skip.toCodes': 'Přejít ke kódům',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Bez sítě',
  'status.vault.off': 'nic se neukládá',
  'status.vault.locked': 'trezor zamčen',
  'status.vault.open': 'trezor otevřen',

  'zone.input': 'Vstup',
  'zone.vault': 'Trezor',
  'zone.codes': 'Kódy',

  'input.legend': 'Jedna položka na řádek',
  'input.placeholder':
    'např. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} nebo {uri} — promíchané. {hash} začíná poznámku.',
  'input.help.images': 'Obrázky s QR kódem lze také přetáhnout sem nebo vložit pomocí {paste}.',
  'input.help.migration': 'Exporty z Google Authenticatoru ({migration}) se převádějí automaticky.',
  'input.help.more': 'Všechny vstupní formáty',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': {
    one: '{n} účet',
    few: '{n} účty',
    many: '{n} účtu',
    other: '{n} účtů',
  },
  'input.count.errors': {
    one: '{n} chyba',
    few: '{n} chyby',
    many: '{n} chyby',
    other: '{n} chyb',
  },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Vyprázdnit',
  'key.qrImage': 'QR z obrázku',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Vypnout kameru',
  'key.copy': 'Kopírovat',
  'key.copyDone': 'Zkopírováno',
  'key.copyFailed': 'Nezdařilo se',

  'viewfinder.hint': 'Držte QR kód v rámečku',

  'filter.label': 'Filtrovat účty',
  'filter.placeholder': 'Filtrovat podle názvu',
  'filter.empty': 'Nic neodpovídá „{query}“.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': {
    one: '{n} číslice',
    few: '{n} číslice',
    many: '{n} číslice',
    other: '{n} číslic',
  },
  'strip.period': '{n} s',
  'strip.next': 'následuje',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'sekundy',
  'strip.seconds.valid': 'platí',
  'strip.accountFallback': 'Účet {n}',
  'strip.copyAria': 'Zkopírovat kód pro {name}',
  'strip.copyAnnounce': 'Kód {digits} zkopírován',
  'strip.copyFailedHint': 'Kopírování se nezdařilo. Označte kód ručně.',

  'fault.title': 'Řádek nečitelný',

  'vault.state.off': 'Vypnuto — nic se neukládá',
  'vault.state.locked': 'Zamčeno — je potřeba heslová fráze',
  'vault.state.open': 'Otevřeno — secrety jsou v textovém poli',
  'vault.explain':
    'Clockwork ve výchozím nastavení neukládá nic. Když zapnete trezor, zůstane zadání ' +
    'zde zašifrované vaší heslovou frází — bez ní je uložený blok bezcenný.',
  'vault.explain.crypto':
    'Klíč vzniká z heslové fráze pomocí PBKDF2-SHA-256 s {iterations} iteracemi, šifruje ' +
    'AES-256-GCM. Ukládá se jen zapečetěná obálka: nikdy otevřený text, nikdy heslová ' +
    'fráze, nikdy odvozený klíč.',
  'vault.explain.more': 'Všechny podrobnosti',
  'vault.pass.new': 'Nová heslová fráze',
  'vault.pass.existing': 'Heslová fráze',
  'vault.action.seal': 'Uložit zašifrovaně',
  'vault.action.unseal': 'Odemknout',
  'vault.action.deriving': 'Odvozuje se klíč …',
  'vault.action.lock': 'Zamknout',
  'vault.action.update': 'Uložit znovu',
  'vault.action.wipe': 'Smazat vše',
  'vault.action.wipeConfirm': 'Opravdu smazat?',
  'vault.timeout.label': 'Zamkne se sám po',
  'vault.timeout.minutes': {
    one: '{n} minutě',
    few: '{n} minutách',
    many: '{n} minuty',
    other: '{n} minutách',
  },
  'vault.lockOnHide': 'a při opuštění panelu',

  'vault.error.nothingToStore': 'Není co uložit — textové pole je prázdné.',
  'vault.error.storageBlocked': 'Prohlížeč ukládání nedovolí (anonymní režim?).',
  'vault.error.noVault': 'Žádný trezor není uložen.',
  'vault.error.noPassphrase': 'Bez heslové fráze není klíč.',
  'vault.error.sealFailed': 'Uložení se nezdařilo.',
  'vault.error.unsealFailed': 'Odemknutí se nezdařilo.',

  'vault.msg.sealed': 'Trezor uložen zašifrovaně.',
  'vault.msg.resealed': 'Trezor znovu zašifrován.',
  'vault.msg.unsealed': 'Trezor odemčen.',
  'vault.msg.locked': 'Trezor zamčen.',
  'vault.msg.wiped': 'Trezor smazán.',
  'vault.msg.wipedNote': 'Smazáno. V úložišti už nic nezůstalo.',
  'vault.locked.idle': {
    one: 'Zamčeno po {n} minutě bez zadávání.',
    few: 'Zamčeno po {n} minutách bez zadávání.',
    many: 'Zamčeno po {n} minuty bez zadávání.',
    other: 'Zamčeno po {n} minutách bez zadávání.',
  },
  'vault.locked.hidden': 'Zamčeno při opuštění panelu.',

  'scan.noQr': 'V obrázku nebylo možné rozpoznat žádný QR kód.',
  'scan.unreadable': 'Obrázek se nepodařilo přečíst — je to opravdu obrázek?',
  'scan.done': 'QR kód přečten a vložen.',
  'scan.camera.unavailable':
    'Toto prostředí kameru neuvolní. Při otevření jako soubor (file://) ji většina ' +
    'prohlížečů blokuje — „QR z obrázku“ funguje vždy.',
  'scan.camera.denied':
    'Kamera byla odmítnuta. Zrušte oprávnění v prohlížeči — nebo použijte „QR z obrázku“.',
  'scan.camera.notFound': 'Není připojena žádná kamera. „QR z obrázku“ funguje i tak.',
  'scan.camera.busy': 'Kameru právě používá jiný program.',
  'scan.camera.failed': 'Kameru se nepodařilo spustit. „QR z obrázku“ funguje vždy.',

  'import.done': {
    one: 'Převzat {n} účet z exportu Google Authenticatoru',
    few: 'Převzaty {n} účty z exportu Google Authenticatoru',
    many: 'Převzato {n} účtu z exportu Google Authenticatoru',
    other: 'Převzato {n} účtů z exportu Google Authenticatoru',
  },
  'import.skipped': 'přeskočeno: {list}',
  'import.skip.hotp': '{label} (HOTP, založeno na čítači)',
  'import.skip.algorithm': '{label} (nepodporovaný algoritmus)',
  'import.skip.emptySecret': '{label} (prázdný secret)',
  'import.unnamed': 'Bez názvu',
  'import.unreadable': 'Export nečitelný.',

  'vacant.text': 'Secret, odkaz otpauth nebo obrázek QR — nic z toho neopustí tento prohlížeč.',
  'vacant.demo': 'Vložit testovací klíč',
  'colophon.note': 'Žádná síť · žádné úložiště · HMAC přes Web Crypto API',

  'lang.label': 'Jazyk',
  'lang.aria': 'Zvolit jazyk',

  'err.base32.paddingInside': 'Znak „=“ smí stát jen na konci (je to pouhá výplň).',
  'err.base32.empty': 'Klíč secret je prázdný.',
  'err.base32.badChar':
    'Neplatný znak „{char}“ na pozici {position}. Base32 zná jen A–Z a 2–7 — číslice 0, 1 ' +
    'a 8 se v něm nevyskytují (zaměněny s O, I a B?).',
  'err.base32.badLength':
    'Neplatná délka: {length} znaků (bez mezer a výplně). Base32 kóduje 5 bajtů do 8 znaků; ' +
    'v posledním bloku jsou možné jen 2, 4, 5, 7 nebo 8 znaků. Nejspíš jeden znak chybí, ' +
    'nebo je jeden navíc.',

  'err.uri.invalid': 'Toto není platné URI. Očekává se „otpauth://totp/…“.',
  'err.uri.scheme': 'Neznámé schéma „{scheme}“. Očekává se „otpauth“.',
  'err.uri.hotp':
    'Toto je URI typu HOTP (založené na čítači). Tato aplikace vytváří pouze časové kódy ' +
    'TOTP — jinak by bylo nutné ukládat stav čítače.',
  'err.uri.type': 'Neznámý typ „{type}“. Po „otpauth://“ musí stát „totp“.',
  'err.uri.typeEmpty': '(prázdné)',
  'err.uri.noSecret': 'V URI chybí parametr „secret“.',
  'err.uri.badLabel':
    'Popisek URI obsahuje poškozené procentové kódování (například osamocené „%“).',
  'err.uri.algorithm': 'Neznámý algoritmus „{value}“. Podporovány jsou SHA1, SHA256 a SHA512.',
  'err.uri.digits': 'Neplatná hodnota „digits“: {value}. Povoleno je {min} až {max}.',
  'err.uri.period': 'Neplatná hodnota „period“: {value}. Očekává se 1 až 3600 sekund.',
  'err.uri.integer': 'Parametr „{name}“ musí být celé číslo; nalezeno bylo „{value}“.',

  'err.otp.digits': 'Neplatný počet číslic: {value}. Povoleno je {min} až {max}.',
  'err.otp.emptySecret': 'Secret je prázdný — nelze z něj spočítat žádný kód.',

  'err.line.unreadable': 'Tento řádek se nepodařilo přečíst.',

  'err.vault.openFailed':
    'Trezor se nepodařilo otevřít. Chybná heslová fráze — nebo byla uložená data změněna.',
  'err.vault.badFormat': 'Uložená data trezoru mají neznámý formát.',
  'err.vault.version': 'Verze trezoru {version} není podporována (očekáváno: {expected}).',
  'err.vault.base64': 'Pole „{field}“ dat trezoru není platné Base64.',
  'err.vault.iterations': 'Neplatný počet iterací: {value}.',

  'err.migration.notExport':
    'Toto není export z Google Authenticatoru. Očekává se ' +
    '„otpauth-migration://offline?data=…“.',
  'err.migration.noData': 'V URI chybí parametr „data“.',
  'err.migration.badPercent': 'Parametr „data“ obsahuje poškozené procentové kódování.',
  'err.migration.badBase64': 'Parametr „data“ není platné Base64.',
  'err.migration.noAccounts': 'V tomto exportu nejsou žádné účty.',

  'native.vacant.text':
    'Secret, odkaz otpauth nebo obrázek QR — nic z toho neopustí toto zařízení.',

  'native.colophon.note': 'Žádná síť · žádné úložiště · HMAC přes javax.crypto',

  'native.scan.camera.unavailable': 'Toto zařízení kameru neuvolní — „QR z obrázku“ funguje vždy.',
  'native.scan.camera.denied':
    'Kamera byla odmítnuta. Povolte ji v systémovém nastavení aplikace — nebo použijte „QR z obrázku“.',
  'native.vault.lockOnHide': 'a při opuštění aplikace',
  'native.vault.locked.hidden': 'Zamčeno při opuštění aplikace.',
  'native.vault.error.storageBlocked': 'Trezor se nepodařilo zapsat — není plné úložiště?',
  'native.vault.biometric.label': 'Odemknout biometrií',
  'native.vault.biometric.note':
    'Zkratka, ne druhý klíč: heslová fráze zůstává jedinou cestou zpět.',
  'native.vault.biometric.cancel': 'Použít heslovou frázi',
  'native.vault.biometric.unavailable': 'Na tomto zařízení není nastavena silná biometrie.',
  'native.vault.biometric.invalidated':
    'Byla zaregistrována nová biometrie, takže zkratka zmizela. Odemkněte heslovou frází a znovu ji zapněte.',
  'native.vault.biometric.failed': 'Odemknutí biometrií se nezdařilo — použijte heslovou frázi.',
  'native.vault.screenshots.label': 'Blokovat snímky obrazovky a náhledy',
} satisfies Strings;
