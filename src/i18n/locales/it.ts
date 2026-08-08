/**
 * Italiano.
 *
 * Glossario: secret · cassaforte (vault) · account · passphrase · voce · codice ·
 *   quadrante. « Passphrase » resta invariato: è il termine che usano gli stessi
 *   fornitori nelle loro schermate.
 * Registro: forma impersonale, asciutta — come negli strumenti per sviluppatori.
 * Virgolette: « … » (caporali), l’uso tipografico italiano.
 * Plurale: CLDR assegna one/many/other; « many » riguarda solo numeri enormi e
 *   ripete quindi il testo di « other ».
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — Autenticatore TOTP',
  'meta.description':
    'Clockwork — autenticatore TOTP. Genera codici a due fattori interamente nel browser, ' +
    'senza alcuna richiesta di rete.',
  'brand.tagline': 'Autenticatore TOTP · RFC 6238',
  'skip.toCodes': 'Vai ai codici',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Non in rete',
  'status.vault.off': 'non viene salvato nulla',
  'status.vault.locked': 'cassaforte chiusa',
  'status.vault.open': 'cassaforte aperta',

  'zone.input': 'Inserimento',
  'zone.vault': 'Cassaforte',
  'zone.codes': 'Codici',

  'input.legend': 'Una voce per riga',
  'input.help.formats': 'Base32, {nameSecret} oppure {uri} — misti. {hash} apre una nota.',
  'input.help.images':
    'Le immagini con codice QR si possono anche trascinare qui o incollare con {paste}.',
  'input.help.migration':
    'Le esportazioni di Google Authenticator ({migration}) vengono convertite in automatico.',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} account', many: '{n} account', other: '{n} account' },
  'input.count.errors': { one: '{n} errore', many: '{n} errori', other: '{n} errori' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Svuota',
  'key.qrImage': 'QR da immagine',
  'key.camera': 'Fotocamera',
  'key.cameraStop': 'Spegni fotocamera',
  'key.copy': 'Copia',
  'key.copyDone': 'Copiato',
  'key.copyFailed': 'Non riuscito',

  'viewfinder.hint': 'Tieni il codice QR dentro la cornice',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} cifra', many: '{n} cifre', other: '{n} cifre' },
  'strip.period': '{n} s',
  'strip.next': 'segue',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'secondi',
  'strip.seconds.valid': 'valido',
  'strip.accountFallback': 'Account {n}',
  'strip.copyAria': 'Copia il codice di {name}',
  'strip.copyAnnounce': 'Codice {digits} copiato',
  'strip.copyFailedHint': 'Copia non riuscita. Seleziona il codice a mano.',

  'fault.title': 'Riga illeggibile',

  'vault.state.off': 'Spenta — non viene salvato nulla',
  'vault.state.locked': 'Chiusa — serve la passphrase',
  'vault.state.open': 'Aperta — i secret sono nel campo di testo',
  'vault.explain':
    'Come impostazione predefinita Clockwork non salva nulla. Volendo, l’inserimento può ' +
    'restare qui cifrato con una passphrase: PBKDF2-SHA-256 con {iterations} iterazioni, poi ' +
    'AES-256-GCM. Senza la passphrase il blocco salvato non vale nulla.',
  'vault.pass.new': 'Nuova passphrase',
  'vault.pass.existing': 'Passphrase',
  'vault.action.seal': 'Salva cifrato',
  'vault.action.unseal': 'Apri',
  'vault.action.deriving': 'Derivazione della chiave …',
  'vault.action.lock': 'Chiudi',
  'vault.action.update': 'Salva di nuovo',
  'vault.action.wipe': 'Cancella tutto',
  'vault.action.wipeConfirm': 'Cancellare davvero?',
  'vault.timeout.label': 'Si chiude da sola dopo',
  'vault.timeout.minutes': { one: '{n} minuto', many: '{n} minuti', other: '{n} minuti' },
  'vault.lockOnHide': 'e quando si lascia la scheda',

  'vault.error.nothingToStore': 'Non c’è nulla da salvare — il campo di testo è vuoto.',
  'vault.error.storageBlocked': 'Il browser non consente di salvare (modalità privata?).',
  'vault.error.noVault': 'Non è salvata alcuna cassaforte.',
  'vault.error.noPassphrase': 'Senza passphrase non c’è chiave.',
  'vault.error.sealFailed': 'Salvataggio non riuscito.',
  'vault.error.unsealFailed': 'Apertura non riuscita.',

  'vault.msg.sealed': 'Cassaforte salvata cifrata.',
  'vault.msg.resealed': 'Cassaforte cifrata di nuovo.',
  'vault.msg.unsealed': 'Cassaforte aperta.',
  'vault.msg.locked': 'Cassaforte chiusa.',
  'vault.msg.wiped': 'Cassaforte cancellata.',
  'vault.msg.wipedNote': 'Cancellata. In memoria non resta nulla.',
  'vault.locked.idle': {
    one: 'Chiusa dopo {n} minuto senza inserimenti.',
    many: 'Chiusa dopo {n} minuti senza inserimenti.',
    other: 'Chiusa dopo {n} minuti senza inserimenti.',
  },
  'vault.locked.hidden': 'Chiusa lasciando la scheda.',

  'scan.noQr': 'Nell’immagine non si riconosce alcun codice QR.',
  'scan.unreadable': 'Non è stato possibile leggere l’immagine — è davvero un’immagine?',
  'scan.done': 'Codice QR letto e inserito.',
  'scan.camera.unavailable':
    'Questo ambiente non mette a disposizione una fotocamera. Aprendo il file direttamente ' +
    '(file://) la maggior parte dei browser la blocca — « QR da immagine » funziona sempre.',
  'scan.camera.denied':
    'La fotocamera è stata negata. Reimposta l’autorizzazione nel browser — oppure usa ' +
    '« QR da immagine ».',
  'scan.camera.notFound':
    'Non è collegata alcuna fotocamera. « QR da immagine » funziona lo stesso.',
  'scan.camera.busy': 'La fotocamera è in uso da un altro programma.',
  'scan.camera.failed':
    'Non è stato possibile avviare la fotocamera. « QR da immagine » funziona sempre.',

  'import.done': {
    one: '{n} account ripreso dall’esportazione di Google Authenticator',
    many: '{n} account ripresi dall’esportazione di Google Authenticator',
    other: '{n} account ripresi dall’esportazione di Google Authenticator',
  },
  'import.skipped': 'saltati: {list}',
  'import.skip.hotp': '{label} (HOTP, basato su contatore)',
  'import.skip.algorithm': '{label} (algoritmo non supportato)',
  'import.skip.emptySecret': '{label} (secret vuoto)',
  'import.unnamed': 'Senza nome',
  'import.unreadable': 'Esportazione illeggibile.',

  'vacant.text': 'Ancora nessun inserimento. Metti un secret qui sopra.',
  'colophon.note': 'Nessuna rete · nessun salvataggio · HMAC tramite la Web Crypto API',

  'lang.label': 'Lingua',
  'lang.aria': 'Scegli la lingua',

  'err.base32.paddingInside':
    'Il carattere « = » può stare solo alla fine (è soltanto riempimento).',
  'err.base32.empty': 'La chiave secret è vuota.',
  'err.base32.badChar':
    'Carattere non valido « {char} » alla posizione {position}. Base32 conosce solo A–Z e ' +
    '2–7 — le cifre 0, 1 e 8 non compaiono (confuse con O, I e B?).',
  'err.base32.badLength':
    'Lunghezza non valida: {length} caratteri (senza spazi né riempimento). Base32 codifica ' +
    '5 byte in 8 caratteri; nell’ultimo blocco sono possibili solo 2, 4, 5, 7 o 8 caratteri. ' +
    'Probabilmente manca un carattere o ce n’è uno di troppo.',

  'err.uri.invalid': 'Questa non è una URI valida. Attesa: « otpauth://totp/… ».',
  'err.uri.scheme': 'Schema sconosciuto « {scheme} ». Atteso: « otpauth ».',
  'err.uri.hotp':
    'Questa è una URI HOTP (basata su contatore). Questa applicazione genera solo codici ' +
    'TOTP basati sul tempo — servirebbe salvare lo stato del contatore.',
  'err.uri.type': 'Tipo sconosciuto « {type} ». Dopo « otpauth:// » deve venire « totp ».',
  'err.uri.typeEmpty': '(vuoto)',
  'err.uri.noSecret': 'Nella URI manca il parametro « secret ».',
  'err.uri.badLabel':
    'L’etichetta della URI contiene una codifica percentuale rotta (per esempio un « % » ' +
    'isolato).',
  'err.uri.algorithm': 'Algoritmo sconosciuto « {value} ». Sono supportati SHA1, SHA256 e SHA512.',
  'err.uri.digits': 'Valore non valido per « digits »: {value}. Sono ammessi da {min} a {max}.',
  'err.uri.period': 'Valore non valido per « period »: {value}. Attesi da 1 a 3600 secondi.',
  'err.uri.integer':
    'Il parametro « {name} » deve essere un numero intero; è stato trovato « {value} ».',

  'err.otp.digits': 'Numero di cifre non valido: {value}. Sono ammessi da {min} a {max}.',
  'err.otp.emptySecret': 'Il secret è vuoto — non se ne può calcolare alcun codice.',

  'err.line.unreadable': 'Non è stato possibile leggere questa riga.',

  'err.vault.openFailed':
    'Non è stato possibile aprire la cassaforte. Passphrase errata — oppure i dati salvati ' +
    'sono stati modificati.',
  'err.vault.badFormat': 'I dati della cassaforte salvati hanno un formato sconosciuto.',
  'err.vault.version':
    'La versione {version} della cassaforte non è supportata (attesa: {expected}).',
  'err.vault.base64': 'Il campo « {field} » dei dati della cassaforte non è Base64 valido.',
  'err.vault.iterations': 'Numero di iterazioni non valido: {value}.',

  'err.migration.notExport':
    'Questa non è un’esportazione di Google Authenticator. Attesa: ' +
    '« otpauth-migration://offline?data=… ».',
  'err.migration.noData': 'Nella URI manca il parametro « data ».',
  'err.migration.badPercent': 'Il parametro « data » contiene una codifica percentuale rotta.',
  'err.migration.badBase64': 'Il parametro « data » non è Base64 valido.',
  'err.migration.noAccounts': 'In questa esportazione non ci sono account.',
} satisfies Strings;
