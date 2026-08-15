/**
 * Română.
 *
 * Glosar: secret · seif (vault) · cont · frază de acces (passphrase) · intrare ·
 *   cod · cadran. „Secret” rămâne în original — așa scrie și pe paginile
 *   furnizorilor.
 * Registru: impersonal și sobru, ca în uneltele pentru dezvoltatori.
 * Ghilimele: „ … ”, potrivit tipografiei românești.
 * Plural: CLDR dă one (1), few (0 și 2–19) și other (20 și peste, cu „de”).
 *   Se folosesc diacriticele cu virgulă (ș, ț), nu cele cu sedilă.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — autentificator TOTP',
  'meta.description':
    'Clockwork — autentificator TOTP. Generează coduri cu doi factori în întregime în ' +
    'navigator, fără nicio cerere de rețea.',
  'brand.tagline': 'Autentificator TOTP · RFC 6238',
  'skip.toCodes': 'Sari la coduri',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Fără rețea',
  'status.vault.off': 'nu se salvează nimic',
  'status.vault.locked': 'seif încuiat',
  'status.vault.open': 'seif deschis',

  'zone.input': 'Intrare',
  'zone.vault': 'Seif',
  'zone.codes': 'Coduri',

  'input.legend': 'O intrare pe rând',
  'input.placeholder':
    'de ex. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} sau {uri} — amestecate. {hash} începe o notă.',
  'input.help.images': 'Imaginile cu cod QR pot fi trase aici sau lipite cu {paste}.',
  'input.help.migration':
    'Exporturile din Google Authenticator ({migration}) sunt convertite automat.',
  'input.help.more': 'Toate formatele acceptate',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} cont', few: '{n} conturi', other: '{n} de conturi' },
  'input.count.errors': { one: '{n} eroare', few: '{n} erori', other: '{n} de erori' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Golește',
  'key.qrImage': 'QR din imagine',
  'key.camera': 'Cameră',
  'key.cameraStop': 'Oprește camera',
  'key.copy': 'Copiază',
  'key.copyDone': 'Copiat',
  'key.copyFailed': 'A eșuat',

  'viewfinder.hint': 'Țineți codul QR în cadru',

  'filter.label': 'Filtrează conturile',
  'filter.placeholder': 'Filtrează după nume',
  'filter.empty': 'Nimic nu corespunde cu „{query}”.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} cifră', few: '{n} cifre', other: '{n} de cifre' },
  'strip.period': '{n} s',
  'strip.next': 'urmează',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'secunde',
  'strip.seconds.valid': 'valabil',
  'strip.accountFallback': 'Contul {n}',
  'strip.copyAria': 'Copiază codul pentru {name}',
  'strip.copyAnnounce': 'Codul {digits} a fost copiat',
  'strip.copyFailedHint': 'Copierea a eșuat. Selectați codul manual.',

  'fault.title': 'Rând ilizibil',

  'vault.state.off': 'Oprit — nu se salvează nimic',
  'vault.state.locked': 'Încuiat — este nevoie de fraza de acces',
  'vault.state.open': 'Deschis — secretele sunt în câmpul de text',
  'vault.explain':
    'În mod implicit Clockwork nu păstrează nimic. Dacă porniți seiful, ce ați introdus ' +
    'rămâne aici criptat cu fraza de acces — fără ea blocul păstrat nu valorează nimic.',
  'vault.explain.crypto':
    'Cheia este derivată din fraza de acces prin PBKDF2-SHA-256 cu {iterations} iterații, ' +
    'iar AES-256-GCM face criptarea. Se păstrează doar plicul sigilat: niciodată textul ' +
    'în clar, niciodată fraza de acces, niciodată cheia derivată.',
  'vault.explain.more': 'Toate detaliile',
  'vault.pass.new': 'Frază de acces nouă',
  'vault.pass.existing': 'Frază de acces',
  'vault.action.seal': 'Salvează criptat',
  'vault.action.unseal': 'Descuie',
  'vault.action.deriving': 'Se derivă cheia …',
  'vault.action.lock': 'Încuie',
  'vault.action.update': 'Salvează din nou',
  'vault.action.wipe': 'Șterge tot',
  'vault.action.wipeConfirm': 'Chiar se șterge?',
  'vault.timeout.label': 'Se încuie singur după',
  'vault.timeout.minutes': { one: '{n} minut', few: '{n} minute', other: '{n} de minute' },
  'vault.lockOnHide': 'și la părăsirea filei',

  'vault.error.nothingToStore': 'Nu este nimic de salvat — câmpul de text este gol.',
  'vault.error.storageBlocked': 'Navigatorul nu permite salvarea (mod privat?).',
  'vault.error.noVault': 'Niciun seif nu este salvat.',
  'vault.error.noPassphrase': 'Fără frază de acces nu există cheie.',
  'vault.error.sealFailed': 'Salvarea a eșuat.',
  'vault.error.unsealFailed': 'Descuierea a eșuat.',

  'vault.msg.sealed': 'Seif salvat criptat.',
  'vault.msg.resealed': 'Seif criptat din nou.',
  'vault.msg.unsealed': 'Seif descuiat.',
  'vault.msg.locked': 'Seif încuiat.',
  'vault.msg.wiped': 'Seif șters.',
  'vault.msg.wipedNote': 'Șters. În stocare nu a mai rămas nimic.',
  'vault.locked.idle': {
    one: 'Încuiat după {n} minut fără intrări.',
    few: 'Încuiat după {n} minute fără intrări.',
    other: 'Încuiat după {n} de minute fără intrări.',
  },
  'vault.locked.hidden': 'Încuiat la părăsirea filei.',

  'scan.noQr': 'În imagine nu s-a putut recunoaște niciun cod QR.',
  'scan.unreadable': 'Imaginea nu a putut fi citită — chiar este o imagine?',
  'scan.done': 'Cod QR citit și inserat.',
  'scan.camera.unavailable':
    'Acest mediu nu pune la dispoziție nicio cameră. La deschiderea ca fișier (file://) ' +
    'majoritatea navigatoarelor o blochează — „QR din imagine” funcționează întotdeauna.',
  'scan.camera.denied':
    'Camera a fost refuzată. Resetați permisiunea în navigator — sau folosiți ' +
    '„QR din imagine”.',
  'scan.camera.notFound': 'Nu este conectată nicio cameră. „QR din imagine” funcționează oricum.',
  'scan.camera.busy': 'Camera este folosită chiar acum de alt program.',
  'scan.camera.failed': 'Camera nu a putut fi pornită. „QR din imagine” funcționează întotdeauna.',

  'import.done': {
    one: '{n} cont preluat din exportul Google Authenticator',
    few: '{n} conturi preluate din exportul Google Authenticator',
    other: '{n} de conturi preluate din exportul Google Authenticator',
  },
  'import.skipped': 'omise: {list}',
  'import.skip.hotp': '{label} (HOTP, bazat pe contor)',
  'import.skip.algorithm': '{label} (algoritm neacceptat)',
  'import.skip.emptySecret': '{label} (secret gol)',
  'import.unnamed': 'Fără nume',
  'import.unreadable': 'Export ilizibil.',

  'vacant.text':
    'Secret, link otpauth sau imagine QR — nimic din toate acestea nu părăsește acest browser.',
  'vacant.demo': 'Inserează cheia de test',
  'colophon.note': 'Fără rețea · fără stocare · HMAC prin Web Crypto API',

  'lang.label': 'Limbă',
  'lang.aria': 'Alegeți limba',

  'err.base32.paddingInside': 'Caracterul „=” poate sta doar la sfârșit (nu este decât umplutură).',
  'err.base32.empty': 'Cheia secret este goală.',
  'err.base32.badChar':
    'Caracter nevalid „{char}” pe poziția {position}. Base32 cunoaște doar A–Z și 2–7 — ' +
    'cifrele 0, 1 și 8 nu apar în el (confundate cu O, I și B?).',
  'err.base32.badLength':
    'Lungime nevalidă: {length} caractere (fără spații și umplutură). Base32 codifică 5 ' +
    'octeți în 8 caractere; în ultimul bloc sunt posibile doar 2, 4, 5, 7 sau 8 caractere. ' +
    'Probabil lipsește un caracter sau este unul în plus.',

  'err.uri.invalid': 'Acesta nu este un URI valid. Se așteaptă „otpauth://totp/…”.',
  'err.uri.scheme': 'Schemă necunoscută „{scheme}”. Se așteaptă „otpauth”.',
  'err.uri.hotp':
    'Acesta este un URI HOTP (bazat pe contor). Această aplicație generează doar coduri TOTP ' +
    'bazate pe timp — pentru celălalt ar trebui salvată starea contorului.',
  'err.uri.type': 'Tip necunoscut „{type}”. După „otpauth://” trebuie să stea „totp”.',
  'err.uri.typeEmpty': '(gol)',
  'err.uri.noSecret': 'Din URI lipsește parametrul „secret”.',
  'err.uri.badLabel':
    'Eticheta URI-ului conține o codificare procentuală stricată (de pildă un „%” singur).',
  'err.uri.algorithm': 'Algoritm necunoscut „{value}”. Sunt acceptate SHA1, SHA256 și SHA512.',
  'err.uri.digits': 'Valoare nevalidă pentru „digits”: {value}. Sunt permise {min} până la {max}.',
  'err.uri.period':
    'Valoare nevalidă pentru „period”: {value}. Se așteaptă 1 până la 3600 de secunde.',
  'err.uri.integer': 'Parametrul „{name}” trebuie să fie un număr întreg; s-a găsit „{value}”.',

  'err.otp.digits': 'Număr de cifre nevalid: {value}. Sunt permise {min} până la {max}.',
  'err.otp.emptySecret': 'Secretul este gol — din el nu se poate calcula niciun cod.',

  'err.line.unreadable': 'Acest rând nu a putut fi citit.',

  'err.vault.openFailed':
    'Seiful nu s-a putut deschide. Frază de acces greșită — sau datele salvate au fost ' +
    'modificate.',
  'err.vault.badFormat': 'Datele salvate ale seifului au un format necunoscut.',
  'err.vault.version': 'Versiunea de seif {version} nu este acceptată (așteptat: {expected}).',
  'err.vault.base64': 'Câmpul „{field}” al datelor seifului nu este Base64 valid.',
  'err.vault.iterations': 'Număr de iterații nevalid: {value}.',

  'err.migration.notExport':
    'Acesta nu este un export Google Authenticator. Se așteaptă ' +
    '„otpauth-migration://offline?data=…”.',
  'err.migration.noData': 'Din URI lipsește parametrul „data”.',
  'err.migration.badPercent': 'Parametrul „data” conține o codificare procentuală stricată.',
  'err.migration.badBase64': 'Parametrul „data” nu este Base64 valid.',
  'err.migration.noAccounts': 'În acest export nu există niciun cont.',

  'native.vacant.text':
    'Secret, link otpauth sau imagine QR — nimic din toate acestea nu părăsește acest dispozitiv.',

  'native.colophon.note': 'Fără rețea · fără stocare · HMAC prin javax.crypto',

  'native.scan.camera.unavailable':
    'Acest dispozitiv nu pune la dispoziție nicio cameră — „QR din imagine” funcționează întotdeauna.',
  'native.scan.camera.denied':
    'Camera a fost refuzată. Acordați permisiunea în setările aplicației din sistem — sau folosiți „QR din imagine”.',
  'native.vault.lockOnHide': 'și la părăsirea aplicației',
  'native.vault.locked.hidden': 'Încuiat la părăsirea aplicației.',
  'native.vault.error.storageBlocked': 'Seiful nu a putut fi scris — este plină memoria?',
  'native.vault.biometric.label': 'Deblocare cu biometrie',
  'native.vault.biometric.note':
    'O scurtătură, nu o a doua cheie: fraza de acces rămâne singurul drum înapoi.',
  'native.vault.biometric.cancel': 'Folosiți fraza de acces',
  'native.vault.biometric.unavailable':
    'Pe acest dispozitiv nu este configurată o biometrie puternică.',
  'native.vault.biometric.invalidated':
    'A fost înregistrată o biometrie nouă, așa că scurtătura a dispărut. Deblocați cu fraza de acces și porniți-o din nou.',
  'native.vault.biometric.failed':
    'Deblocarea cu biometrie nu a funcționat — folosiți fraza de acces.',
  'native.vault.screenshots.label': 'Blocarea capturilor de ecran și a previzualizărilor',

  'native.nav.home': 'Acasă',
  'native.nav.settings': 'Setări',
  'native.about.title': 'Despre',
  'native.about.version': 'Versiune',
  'native.about.network':
    'Aplicația nu are permisiune de rețea. Nu poate deschide nicio conexiune — nici pentru actualizări, nici pentru statistici, nici din greșeală.',
  'native.about.licenses': 'Licențe',
  'native.about.source': 'Cod sursă',
} satisfies Strings;
