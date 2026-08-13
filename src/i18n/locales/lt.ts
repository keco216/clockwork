/**
 * Lietuvių.
 *
 * Žodynėlis: secret · seifas (vault) · paskyra · slaptafrazė (passphrase) ·
 *   įrašas · kodas · ciferblatas. „Secret“ paliekamas neišverstas — taip rašoma
 *   ir paslaugų teikėjų puslapiuose.
 * Registras: beasmenis ir dalykiškas, kaip programuotojų įrankiuose.
 * Kabutės: „ … “, pagal lietuvių tipografiją.
 * Daugiskaita: CLDR duoda one (1, 21, 31 …), few (2–9, 22–29 …),
 *   many (trupmenos) ir other (0, 10–20).
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP tapatybės tikrintuvas',
  'meta.description':
    'Clockwork — TOTP tapatybės tikrintuvas. Dviejų veiksnių kodus sukuria visiškai naršyklėje, ' +
    'be nė vienos tinklo užklausos.',
  'brand.tagline': 'TOTP tapatybės tikrintuvas · RFC 6238',
  'skip.toCodes': 'Pereiti prie kodų',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Be tinklo',
  'status.vault.off': 'niekas neįrašoma',
  'status.vault.locked': 'seifas užrakintas',
  'status.vault.open': 'seifas atrakintas',

  'zone.input': 'Įvestis',
  'zone.vault': 'Seifas',
  'zone.codes': 'Kodai',

  'input.legend': 'Vienas įrašas eilutėje',
  'input.placeholder':
    'pvz. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} arba {uri} — sumaišyti. {hash} pradeda pastabą.',
  'input.help.images': 'QR paveikslus taip pat galima atitempti čia arba įklijuoti su {paste}.',
  'input.help.migration': '„Google Authenticator“ eksportai ({migration}) pertvarkomi savaime.',
  'input.help.more': 'Visi įvesties formatai',
  'shortcut.modifier': 'Vald',

  'input.count.accounts': {
    one: '{n} paskyra',
    few: '{n} paskyros',
    many: '{n} paskyros',
    other: '{n} paskyrų',
  },
  'input.count.errors': {
    one: '{n} klaida',
    few: '{n} klaidos',
    many: '{n} klaidos',
    other: '{n} klaidų',
  },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Išvalyti',
  'key.qrImage': 'QR iš paveikslo',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Išjungti kamerą',
  'key.copy': 'Kopijuoti',
  'key.copyDone': 'Nukopijuota',
  'key.copyFailed': 'Nepavyko',

  'viewfinder.hint': 'Laikykite QR kodą rėmelyje',

  'filter.label': 'Filtruoti paskyras',
  'filter.placeholder': 'Filtruoti pagal pavadinimą',
  'filter.empty': 'Niekas neatitinka „{query}“.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': {
    one: '{n} skaitmuo',
    few: '{n} skaitmenys',
    many: '{n} skaitmens',
    other: '{n} skaitmenų',
  },
  'strip.period': '{n} s',
  'strip.next': 'toliau',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'sekundės',
  'strip.seconds.valid': 'galioja',
  'strip.accountFallback': 'Paskyra {n}',
  'strip.copyAria': 'Kopijuoti {name} kodą',
  'strip.copyAnnounce': 'Kodas {digits} nukopijuotas',
  'strip.copyFailedHint': 'Nukopijuoti nepavyko. Pažymėkite kodą ranka.',

  'fault.title': 'Eilutė neįskaitoma',

  'vault.state.off': 'Išjungtas — niekas neįrašoma',
  'vault.state.locked': 'Užrakintas — reikia slaptafrazės',
  'vault.state.open': 'Atrakintas — secret yra teksto lauke',
  'vault.explain':
    'Pagal nutylėjimą Clockwork nieko nesaugo. Įjungus seifą, įvestis lieka čia ' +
    'užšifruota tavo slaptafraze — be jos išsaugotas blokas nieko nevertas.',
  'vault.explain.crypto':
    'Raktas iš slaptafrazės išvedamas PBKDF2-SHA-256 su {iterations} iteracijų, o ' +
    'šifruoja AES-256-GCM. Saugomas tik užklijuotas vokas: niekada atviras tekstas, ' +
    'niekada slaptafrazė, niekada išvestas raktas.',
  'vault.explain.more': 'Visa informacija',
  'vault.pass.new': 'Nauja slaptafrazė',
  'vault.pass.existing': 'Slaptafrazė',
  'vault.action.seal': 'Įrašyti užšifruotą',
  'vault.action.unseal': 'Atrakinti',
  'vault.action.deriving': 'Išvedamas raktas …',
  'vault.action.lock': 'Užrakinti',
  'vault.action.update': 'Įrašyti iš naujo',
  'vault.action.wipe': 'Ištrinti viską',
  'vault.action.wipeConfirm': 'Tikrai ištrinti?',
  'vault.timeout.label': 'Užsirakina pats po',
  'vault.timeout.minutes': {
    one: '{n} minutės',
    few: '{n} minučių',
    many: '{n} minutės',
    other: '{n} minučių',
  },
  'vault.lockOnHide': 'ir paliekant kortelę',

  'vault.error.nothingToStore': 'Nėra ko įrašyti — teksto laukas tuščias.',
  'vault.error.storageBlocked': 'Naršyklė neleidžia įrašyti (privatusis režimas?).',
  'vault.error.noVault': 'Nė vienas seifas neįrašytas.',
  'vault.error.noPassphrase': 'Be slaptafrazės nėra rakto.',
  'vault.error.sealFailed': 'Įrašyti nepavyko.',
  'vault.error.unsealFailed': 'Atrakinti nepavyko.',

  'vault.msg.sealed': 'Seifas įrašytas užšifruotas.',
  'vault.msg.resealed': 'Seifas užšifruotas iš naujo.',
  'vault.msg.unsealed': 'Seifas atrakintas.',
  'vault.msg.locked': 'Seifas užrakintas.',
  'vault.msg.wiped': 'Seifas ištrintas.',
  'vault.msg.wipedNote': 'Ištrinta. Saugykloje nieko nebeliko.',
  'vault.locked.idle': {
    one: 'Užrakinta po {n} minutės be įvesties.',
    few: 'Užrakinta po {n} minučių be įvesties.',
    many: 'Užrakinta po {n} minutės be įvesties.',
    other: 'Užrakinta po {n} minučių be įvesties.',
  },
  'vault.locked.hidden': 'Užrakinta paliekant kortelę.',

  'scan.noQr': 'Paveiksle nepavyko atpažinti nė vieno QR kodo.',
  'scan.unreadable': 'Paveikslo nepavyko perskaityti — ar tai tikrai paveikslas?',
  'scan.done': 'QR kodas perskaitytas ir įterptas.',
  'scan.camera.unavailable':
    'Ši aplinka kameros neatiduoda. Atvėrus kaip failą (file://) dauguma naršyklių ją ' +
    'užblokuoja — „QR iš paveikslo“ veikia visada.',
  'scan.camera.denied':
    'Kameros neleista. Atstatykite leidimą naršyklėje — arba naudokite „QR iš paveikslo“.',
  'scan.camera.notFound': 'Nėra prijungtos kameros. „QR iš paveikslo“ vis tiek veikia.',
  'scan.camera.busy': 'Kamerą kaip tik naudoja kita programa.',
  'scan.camera.failed': 'Kameros nepavyko paleisti. „QR iš paveikslo“ veikia visada.',

  'import.done': {
    one: 'Perimta {n} paskyra iš „Google Authenticator“ eksporto',
    few: 'Perimtos {n} paskyros iš „Google Authenticator“ eksporto',
    many: 'Perimta {n} paskyros iš „Google Authenticator“ eksporto',
    other: 'Perimta {n} paskyrų iš „Google Authenticator“ eksporto',
  },
  'import.skipped': 'praleista: {list}',
  'import.skip.hotp': '{label} (HOTP, pagrįstas skaitikliu)',
  'import.skip.algorithm': '{label} (nepalaikomas algoritmas)',
  'import.skip.emptySecret': '{label} (tuščias secret)',
  'import.unnamed': 'Be pavadinimo',
  'import.unreadable': 'Eksportas neįskaitomas.',

  'vacant.text':
    'Slaptas raktas, otpauth nuoroda ar QR paveikslėlis — niekas iš to neišeina iš šios naršyklės.',
  'vacant.demo': 'Įterpti bandomąjį raktą',
  'colophon.note': 'Jokio tinklo · jokios saugyklos · HMAC per Web Crypto API',

  'lang.label': 'Kalba',
  'lang.aria': 'Pasirinkite kalbą',

  'err.base32.paddingInside': 'Ženklas „=“ gali stovėti tik gale (tai tėra užpildas).',
  'err.base32.empty': 'Raktas secret yra tuščias.',
  'err.base32.badChar':
    'Netinkamas ženklas „{char}“ {position} vietoje. Base32 pažįsta tik A–Z ir 2–7 — ' +
    'skaitmenų 0, 1 ir 8 jame nėra (supainiota su O, I ir B?).',
  'err.base32.badLength':
    'Netinkamas ilgis: {length} ženklai (be tarpų ir užpildo). Base32 užkoduoja 5 baitus ' +
    '8 ženklais; paskutiniame bloke galimi tik 2, 4, 5, 7 arba 8 ženklai. Tikriausiai vieno ' +
    'ženklo trūksta arba vienas yra per daug.',

  'err.uri.invalid': 'Tai nėra tinkamas URI. Laukiama „otpauth://totp/…“.',
  'err.uri.scheme': 'Nežinoma schema „{scheme}“. Laukiama „otpauth“.',
  'err.uri.hotp':
    'Tai HOTP tipo URI (pagrįstas skaitikliu). Ši programa kuria tik laiku pagrįstus TOTP ' +
    'kodus — kitaip reikėtų įrašyti skaitiklio būseną.',
  'err.uri.type': 'Nežinomas tipas „{type}“. Po „otpauth://“ turi būti „totp“.',
  'err.uri.typeEmpty': '(tuščia)',
  'err.uri.noSecret': 'URI trūksta parametro „secret“.',
  'err.uri.badLabel':
    'URI etiketėje yra sugadintas procentinis kodavimas (pavyzdžiui, pavienis „%“).',
  'err.uri.algorithm': 'Nežinomas algoritmas „{value}“. Palaikomi SHA1, SHA256 ir SHA512.',
  'err.uri.digits': 'Netinkama „digits“ reikšmė: {value}. Leidžiama nuo {min} iki {max}.',
  'err.uri.period': 'Netinkama „period“ reikšmė: {value}. Laukiama nuo 1 iki 3600 sekundžių.',
  'err.uri.integer': 'Parametras „{name}“ turi būti sveikasis skaičius; rasta „{value}“.',

  'err.otp.digits': 'Netinkamas skaitmenų skaičius: {value}. Leidžiama nuo {min} iki {max}.',
  'err.otp.emptySecret': 'Secret tuščias — iš jo neįmanoma apskaičiuoti jokio kodo.',

  'err.line.unreadable': 'Šios eilutės nepavyko perskaityti.',

  'err.vault.openFailed':
    'Seifo nepavyko atverti. Netinkama slaptafrazė — arba įrašyti duomenys buvo pakeisti.',
  'err.vault.badFormat': 'Įrašyti seifo duomenys yra nežinomo formato.',
  'err.vault.version': 'Seifo versija {version} nepalaikoma (laukta: {expected}).',
  'err.vault.base64': 'Seifo duomenų laukas „{field}“ nėra tinkamas Base64.',
  'err.vault.iterations': 'Netinkamas iteracijų skaičius: {value}.',

  'err.migration.notExport':
    'Tai nėra „Google Authenticator“ eksportas. Laukiama ' +
    '„otpauth-migration://offline?data=…“.',
  'err.migration.noData': 'URI trūksta parametro „data“.',
  'err.migration.badPercent': 'Parametre „data“ yra sugadintas procentinis kodavimas.',
  'err.migration.badBase64': 'Parametras „data“ nėra tinkamas Base64.',
  'err.migration.noAccounts': 'Šiame eksporte nėra nė vienos paskyros.',

  'native.vacant.text':
    'Slaptas raktas, otpauth nuoroda ar QR paveikslėlis — niekas iš to neišeina iš šio įrenginio.',
} satisfies Strings;
