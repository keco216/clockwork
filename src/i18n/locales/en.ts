/**
 * English — base language and fallback for everything else.
 *
 * Glossary (fixed wording, used consistently):
 *   secret · vault · account · passphrase · entry · code · dial
 *   „Kanalzug" (the German rack-module metaphor) has no English equivalent that
 *   carries the same meaning, so the UI simply speaks of accounts.
 * Register: second person, plain and direct — the tone of a developer tool.
 * Quotation marks: “ ” (curly double), as is customary in English typography.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP Authenticator',
  'meta.description':
    'Clockwork — TOTP authenticator. Generates two-factor codes entirely in the browser, ' +
    'without any network requests.',
  'brand.tagline': 'TOTP Authenticator · RFC 6238',
  'skip.toCodes': 'Skip to the codes',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Offline',
  'status.vault.off': 'nothing stored',
  'status.vault.locked': 'vault locked',
  'status.vault.open': 'vault open',

  'zone.input': 'Input',
  'zone.vault': 'Vault',
  'zone.codes': 'Codes',

  'input.legend': 'One entry per line',
  'input.placeholder':
    'e.g. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} or {uri} — mixed. {hash} starts a note.',
  'input.help.images': 'QR images can also be dragged here or pasted with {paste}.',
  'input.help.migration': 'Google Authenticator exports ({migration}) are converted automatically.',
  'input.help.more': 'All input formats',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} account', other: '{n} accounts' },
  'input.count.errors': { one: '{n} error', other: '{n} errors' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Clear',
  'key.qrImage': 'QR from image',
  'key.camera': 'Camera',
  'key.cameraStop': 'Camera off',
  'key.copy': 'Copy',
  'key.copyDone': 'Copied',
  'key.copyFailed': 'Failed',

  'viewfinder.hint': 'Hold the QR code inside the frame',

  'filter.label': 'Filter accounts',
  'filter.placeholder': 'Filter by name',
  'filter.empty': 'Nothing matches “{query}”.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} digit', other: '{n} digits' },
  'strip.period': '{n} s',
  'strip.next': 'next',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'seconds',
  'strip.seconds.valid': 'valid',
  'strip.accountFallback': 'Account {n}',
  'strip.copyAria': 'Copy the code for {name}',
  'strip.copyAnnounce': 'Code {digits} copied',
  'strip.copyFailedHint': 'Copying failed. Please select the code by hand.',

  'fault.title': 'Line not readable',

  'vault.state.off': 'Off — nothing is stored',
  'vault.state.locked': 'Locked — passphrase required',
  'vault.state.open': 'Open — secrets are in the text field',
  'vault.explain':
    'By default Clockwork stores nothing. If you switch the vault on, what you typed ' +
    'stays here encrypted with your passphrase — without it the stored block is ' +
    'worthless.',
  'vault.explain.crypto':
    'The key is derived from your passphrase by PBKDF2-SHA-256 with {iterations} ' +
    'iterations, and AES-256-GCM does the encrypting. Only the sealed envelope is stored: ' +
    'never the plaintext, never the passphrase, never the derived key.',
  'vault.explain.more': 'All details',
  'vault.pass.new': 'New passphrase',
  'vault.pass.existing': 'Passphrase',
  'vault.action.seal': 'Store encrypted',
  'vault.action.unseal': 'Unlock',
  'vault.action.deriving': 'Deriving key …',
  'vault.action.lock': 'Lock',
  'vault.action.update': 'Store again',
  'vault.action.wipe': 'Delete everything',
  'vault.action.wipeConfirm': 'Really delete?',
  'vault.timeout.label': 'Locks automatically after',
  'vault.timeout.minutes': { one: '{n} minute', other: '{n} minutes' },
  'vault.lockOnHide': 'and when the tab is left',

  'vault.error.nothingToStore': 'There is nothing to store — the text field is empty.',
  'vault.error.storageBlocked': 'The browser does not allow storing (private mode?).',
  'vault.error.noVault': 'No vault is stored.',
  'vault.error.noPassphrase': 'Without a passphrase there is no key.',
  'vault.error.sealFailed': 'Storing failed.',
  'vault.error.unsealFailed': 'Unlocking failed.',

  'vault.msg.sealed': 'Vault stored encrypted.',
  'vault.msg.resealed': 'Vault encrypted again.',
  'vault.msg.unsealed': 'Vault unlocked.',
  'vault.msg.locked': 'Vault locked.',
  'vault.msg.wiped': 'Vault deleted.',
  'vault.msg.wipedNote': 'Deleted. Nothing is left in storage.',
  'vault.locked.idle': {
    one: 'Locked after {n} minute without input.',
    other: 'Locked after {n} minutes without input.',
  },
  'vault.locked.hidden': 'Locked on leaving the tab.',

  'scan.noQr': 'No QR code could be made out in the image.',
  'scan.unreadable': 'The image could not be read — is it really an image?',
  'scan.done': 'QR code read and inserted.',
  'scan.camera.unavailable':
    'This environment does not hand out a camera. When opened as a file (file://) most ' +
    'browsers block it — “QR from image” always works.',
  'scan.camera.denied':
    'The camera was denied. Reset the permission in the browser — or use “QR from image”.',
  'scan.camera.notFound': 'No camera is connected. “QR from image” works all the same.',
  'scan.camera.busy': 'The camera is currently in use by another program.',
  'scan.camera.failed': 'The camera could not be started. “QR from image” always works.',

  'import.done': {
    one: '{n} account taken from the Google Authenticator export',
    other: '{n} accounts taken from the Google Authenticator export',
  },
  'import.skipped': 'skipped: {list}',
  'import.skip.hotp': '{label} (HOTP, counter-based)',
  'import.skip.algorithm': '{label} (unsupported algorithm)',
  'import.skip.emptySecret': '{label} (empty secret)',
  'import.unnamed': 'Unnamed',
  'import.unreadable': 'Export unreadable.',

  'vacant.text': 'Secret, otpauth link or QR image — none of it leaves this browser.',
  'vacant.demo': 'Insert test key',
  'colophon.note': 'No network · no storage · HMAC via the Web Crypto API',

  'lang.label': 'Language',
  'lang.aria': 'Choose language',

  'err.base32.paddingInside':
    'The character “=” may only stand at the end (it is nothing but padding).',
  'err.base32.empty': 'The secret key is empty.',
  'err.base32.badChar':
    'Invalid character “{char}” at position {position}. Base32 knows only A–Z and 2–7 — ' +
    'the digits 0, 1 and 8 do not occur (mixed up with O, I and B?).',
  'err.base32.badLength':
    'Invalid length: {length} characters (without spaces and padding). Base32 encodes 5 bytes ' +
    'in 8 characters; the last block can only hold 2, 4, 5, 7 or 8 characters. Most likely a ' +
    'character is missing or one too many.',

  'err.uri.invalid': 'This is not a valid URI. Expected “otpauth://totp/…”.',
  'err.uri.scheme': 'Unknown scheme “{scheme}”. Expected “otpauth”.',
  'err.uri.hotp':
    'This is a HOTP URI (counter-based). This app only produces time-based TOTP codes — the ' +
    'counter would have to be stored for that.',
  'err.uri.type': 'Unknown type “{type}”. “totp” has to follow “otpauth://”.',
  'err.uri.typeEmpty': '(empty)',
  'err.uri.noSecret': 'The parameter “secret” is missing from the URI.',
  'err.uri.badLabel':
    'The label of the URI contains broken percent encoding (a lone “%”, for instance).',
  'err.uri.algorithm': 'Unknown algorithm “{value}”. Supported are SHA1, SHA256 and SHA512.',
  'err.uri.digits': 'Invalid value for “digits”: {value}. Allowed are {min} to {max}.',
  'err.uri.period': 'Invalid value for “period”: {value}. Expected 1 to 3600 seconds.',
  'err.uri.integer': 'The parameter “{name}” must be a whole number, found “{value}”.',

  'err.otp.digits': 'Invalid number of digits: {value}. Allowed are {min} to {max}.',
  'err.otp.emptySecret': 'The secret is empty — no code can be computed from it.',

  'err.line.unreadable': 'This line could not be read.',

  'err.vault.openFailed':
    'The vault would not open. Wrong passphrase — or the stored data was altered.',
  'err.vault.badFormat': 'The stored vault data is in an unknown format.',
  'err.vault.version': 'Vault version {version} is not supported (expected: {expected}).',
  'err.vault.base64': 'The field “{field}” of the vault data is not valid Base64.',
  'err.vault.iterations': 'Invalid iteration count: {value}.',

  'err.migration.notExport':
    'This is not a Google Authenticator export. Expected “otpauth-migration://offline?data=…”.',
  'err.migration.noData': 'The parameter “data” is missing from the URI.',
  'err.migration.badPercent': 'The “data” parameter contains broken percent encoding.',
  'err.migration.badBase64': 'The “data” parameter is not valid Base64.',
  'err.migration.noAccounts': 'There are no accounts in this export.',

  'native.vacant.text': 'Secret, otpauth link or QR image — none of it leaves this device.',

  'native.colophon.note': 'No network · no storage · HMAC via javax.crypto',

  'native.scan.camera.unavailable':
    'This device does not hand out a camera — “QR from image” always works.',
  'native.scan.camera.denied':
    'The camera was denied. Allow it in the system’s app settings — or use “QR from image”.',
  'native.vault.lockOnHide': 'and when the app is left',
  'native.vault.locked.hidden': 'Locked on leaving the app.',
  'native.vault.error.storageBlocked': 'The vault could not be written — is the storage full?',
  'native.vault.biometric.label': 'Unlock with biometrics',
  'native.vault.biometric.note':
    'A shortcut, not a second key: the passphrase stays the only way back.',
  'native.vault.biometric.cancel': 'Use passphrase',
  'native.vault.biometric.unavailable': 'This device has no strong biometrics set up.',
  'native.vault.biometric.invalidated':
    'New biometrics were enrolled, so the shortcut is gone. Unlock with the passphrase and switch it on again.',
  'native.vault.biometric.failed': 'Biometric unlocking did not work — use the passphrase.',
  'native.vault.screenshots.label': 'Block screenshots and previews',
} satisfies Strings;
