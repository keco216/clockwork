/**
 * Deutsch — die redaktionelle Referenz.
 *
 * Alle Texte sind wörtlich aus V2 übernommen; sie waren bewusst formuliert und
 * werden hier nicht „verbessert". Einzige Korrektur: In `scan.ts` stand nach dem
 * öffnenden „ ein gerades Anführungszeichen. Der Rest des Projekts (README,
 * Markenhandbuch) setzt „…“ korrekt — das gilt jetzt auch hier.
 *
 * Glossar: Secret · Tresor · Konto · Passphrase · Eintrag · Code · Zifferblatt ·
 *   Kanalzug. „Vault" heißt durchgehend Tresor, „Secret" bleibt Secret (es ist
 *   der Begriff, der auf den Websites der Anbieter steht).
 * Anrede: Du, wie in V2 („Setze oben ein Secret ein").
 * Anführungszeichen: „…“ im Fließtext, »…« in den Fehlermeldungen aus src/lib
 *   (dort wörtlich übernommen).
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP Authenticator',
  'meta.description':
    'Clockwork — TOTP Authenticator. Erzeugt Zwei-Faktor-Codes vollständig im Browser, ' +
    'ohne Netzwerkanfragen.',
  'brand.tagline': 'TOTP Authenticator · RFC 6238',
  'skip.toCodes': 'Zu den Codes springen',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Offline',
  'status.vault.off': 'nichts gespeichert',
  'status.vault.locked': 'Tresor gesperrt',
  'status.vault.open': 'Tresor offen',

  'zone.input': 'Eingabe',
  'zone.vault': 'Tresor',
  'zone.codes': 'Codes',

  'input.legend': 'Ein Eintrag pro Zeile',
  'input.help.formats': 'Base32, {nameSecret} oder {uri} — gemischt. {hash} beginnt eine Notiz.',
  'input.help.images': 'QR-Bilder lassen sich auch hierher ziehen oder mit {paste} einfügen.',
  'input.help.migration':
    'Google-Authenticator-Exporte ({migration}) werden automatisch umgewandelt.',
  'shortcut.modifier': 'Strg',

  'input.count.accounts': { one: '{n} Konto', other: '{n} Konten' },
  'input.count.errors': { one: '{n} Fehler', other: '{n} Fehler' },
  'input.count.join': '{accounts} · {errors}',

  'key.demo': 'Demo einsetzen',
  'key.clear': 'Leeren',
  'key.qrImage': 'QR aus Bild',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Kamera aus',
  'key.copy': 'Kopieren',
  'key.copyDone': 'Kopiert',
  'key.copyFailed': 'Fehlgeschlagen',

  'viewfinder.hint': 'QR-Code in den Rahmen halten',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} Stelle', other: '{n} Stellen' },
  'strip.period': '{n} s',
  'strip.next': 'folgt',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'Sekunden',
  'strip.seconds.valid': 'gültig',
  'strip.accountFallback': 'Konto {n}',
  'strip.copyAria': 'Code für {name} kopieren',
  'strip.copyAnnounce': 'Code {digits} kopiert',
  'strip.copyFailedHint': 'Kopieren fehlgeschlagen. Code bitte von Hand markieren.',

  'fault.title': 'Zeile nicht lesbar',

  'vault.state.off': 'Aus — es wird nichts gespeichert',
  'vault.state.locked': 'Gesperrt — Passphrase nötig',
  'vault.state.open': 'Offen — Secrets liegen im Textfeld',
  'vault.explain':
    'Standardmäßig speichert Clockwork nichts. Wer möchte, kann die Eingabe hier mit einer ' +
    'Passphrase verschlüsselt ablegen: PBKDF2-SHA-256 mit {iterations} Iterationen, danach ' +
    'AES-256-GCM. Ohne die Passphrase ist der gespeicherte Block wertlos.',
  'vault.pass.new': 'Neue Passphrase',
  'vault.pass.existing': 'Passphrase',
  'vault.action.seal': 'Verschlüsselt speichern',
  'vault.action.unseal': 'Aufsperren',
  'vault.action.deriving': 'Schlüssel wird abgeleitet …',
  'vault.action.lock': 'Zusperren',
  'vault.action.update': 'Neu speichern',
  'vault.action.wipe': 'Alles löschen',
  'vault.action.wipeConfirm': 'Wirklich löschen?',
  'vault.timeout.label': 'Sperrt automatisch nach',
  'vault.timeout.minutes': { one: '{n} Minute', other: '{n} Minuten' },
  'vault.lockOnHide': 'auch beim Verlassen des Tabs',

  'vault.error.nothingToStore': 'Es gibt nichts zu speichern — das Textfeld ist leer.',
  'vault.error.storageBlocked': 'Der Browser lässt kein Speichern zu (privater Modus?).',
  'vault.error.noVault': 'Es ist kein Tresor gespeichert.',
  'vault.error.noPassphrase': 'Ohne Passphrase gibt es keinen Schlüssel.',
  'vault.error.sealFailed': 'Speichern fehlgeschlagen.',
  'vault.error.unsealFailed': 'Aufsperren fehlgeschlagen.',

  'vault.msg.sealed': 'Tresor verschlüsselt gespeichert.',
  'vault.msg.resealed': 'Tresor neu verschlüsselt.',
  'vault.msg.unsealed': 'Tresor aufgesperrt.',
  'vault.msg.locked': 'Tresor zugesperrt.',
  'vault.msg.wiped': 'Tresor gelöscht.',
  'vault.msg.wipedNote': 'Gelöscht. Es liegt nichts mehr im Speicher.',
  'vault.locked.idle': {
    one: 'Nach {n} Minute ohne Eingabe zugesperrt.',
    other: 'Nach {n} Minuten ohne Eingabe zugesperrt.',
  },
  'vault.locked.hidden': 'Beim Verlassen des Tabs zugesperrt.',

  'scan.noQr': 'In dem Bild war kein QR-Code zu erkennen.',
  'scan.unreadable': 'Das Bild konnte nicht gelesen werden — ist es wirklich ein Bild?',
  'scan.done': 'QR-Code gelesen und eingesetzt.',
  'scan.camera.unavailable':
    'Diese Umgebung gibt keine Kamera frei. Beim Öffnen als Datei (file://) sperren die ' +
    'meisten Browser sie — „QR aus Bild“ funktioniert dort immer.',
  'scan.camera.denied':
    'Die Kamera wurde abgelehnt. Erlaubnis im Browser zurücksetzen — oder „QR aus Bild“ nehmen.',
  'scan.camera.notFound': 'Es ist keine Kamera angeschlossen. „QR aus Bild“ funktioniert trotzdem.',
  'scan.camera.busy': 'Die Kamera wird gerade von einem anderen Programm benutzt.',
  'scan.camera.failed': 'Die Kamera ließ sich nicht starten. „QR aus Bild“ funktioniert immer.',

  'import.done': {
    one: '{n} Konto aus Google-Authenticator-Export übernommen',
    other: '{n} Konten aus Google-Authenticator-Export übernommen',
  },
  'import.skipped': 'übersprungen: {list}',
  'import.skip.hotp': '{label} (HOTP, zählerbasiert)',
  'import.skip.algorithm': '{label} (nicht unterstützter Algorithmus)',
  'import.skip.emptySecret': '{label} (leeres Secret)',
  'import.unnamed': 'Unbenannt',
  'import.unreadable': 'Export unlesbar.',

  'vacant.text':
    'Noch keine Eingabe. Setze oben ein Secret ein — oder nimm mit {demo} den Testschlüssel ' +
    'aus RFC 4226.',
  'colophon.note': 'Kein Netzwerk · kein Speicher · HMAC über die Web Crypto API',

  'lang.label': 'Sprache',
  'lang.aria': 'Sprache wählen',

  'demo.comment': '# Testschlüssel aus RFC 4226 — das Secret ist der Text „12345678901234567890“',
  'demo.label': 'RFC-Test',

  'err.base32.paddingInside': 'Das Zeichen »=« darf nur am Ende stehen (es ist nur Auffüllung).',
  'err.base32.empty': 'Der Secret-Key ist leer.',
  'err.base32.badChar':
    'Ungültiges Zeichen »{char}« an Stelle {position}. Base32 kennt nur A–Z und 2–7 — ' +
    'die Ziffern 0, 1 und 8 kommen nicht vor (verwechselt mit O, I und B?).',
  'err.base32.badLength':
    'Ungültige Länge: {length} Zeichen (ohne Leerzeichen und Padding). Base32 codiert 5 Byte ' +
    'in 8 Zeichen; im letzten Block sind nur 2, 4, 5, 7 oder 8 Zeichen möglich. Vermutlich ' +
    'fehlt ein Zeichen oder ist eines zu viel.',

  'err.uri.invalid': 'Das ist keine gültige URI. Erwartet wird »otpauth://totp/…«.',
  'err.uri.scheme': 'Unbekanntes Schema »{scheme}«. Erwartet wird »otpauth«.',
  'err.uri.hotp':
    'Das ist eine HOTP-URI (zählerbasiert). Diese App erzeugt nur zeitbasierte TOTP-Codes — ' +
    'der Zählerstand müsste dafür gespeichert werden.',
  'err.uri.type': 'Unbekannter Typ »{type}«. Nach »otpauth://« muss »totp« stehen.',
  'err.uri.typeEmpty': '(leer)',
  'err.uri.noSecret': 'In der URI fehlt der Parameter »secret«.',
  'err.uri.badLabel':
    'Das Label der URI enthält eine kaputte Prozent-Codierung (z. B. ein einzelnes »%«).',
  'err.uri.algorithm':
    'Unbekannter Algorithmus »{value}«. Unterstützt werden SHA1, SHA256 und SHA512.',
  'err.uri.digits': 'Ungültiger Wert für »digits«: {value}. Erlaubt sind {min} bis {max}.',
  'err.uri.period': 'Ungültiger Wert für »period«: {value}. Erwartet werden 1 bis 3600 Sekunden.',
  'err.uri.integer': 'Der Parameter »{name}« muss eine ganze Zahl sein, gefunden wurde »{value}«.',

  'err.otp.digits': 'Ungültige Stellenzahl: {value}. Erlaubt sind {min} bis {max}.',
  'err.otp.emptySecret': 'Das Secret ist leer — daraus lässt sich kein Code berechnen.',

  'err.line.unreadable': 'Diese Zeile konnte nicht gelesen werden.',

  'err.vault.openFailed':
    'Der Tresor ließ sich nicht öffnen. Passphrase falsch — oder die gespeicherten Daten ' +
    'wurden verändert.',
  'err.vault.badFormat': 'Die gespeicherten Tresordaten haben ein unbekanntes Format.',
  'err.vault.version': 'Tresor-Version {version} wird nicht unterstützt (erwartet: {expected}).',
  'err.vault.base64': 'Das Feld »{field}« der Tresordaten ist kein gültiges Base64.',
  'err.vault.iterations': 'Ungültige Iterationszahl: {value}.',

  'err.migration.notExport':
    'Das ist kein Google-Authenticator-Export. Erwartet wird ' +
    '»otpauth-migration://offline?data=…«.',
  'err.migration.noData': 'In der URI fehlt der Parameter »data«.',
  'err.migration.badPercent': 'Der »data«-Parameter enthält eine kaputte Prozent-Codierung.',
  'err.migration.badBase64': 'Der »data«-Parameter ist kein gültiges Base64.',
  'err.migration.noAccounts': 'In diesem Export stehen keine Konten.',
} satisfies Strings;
