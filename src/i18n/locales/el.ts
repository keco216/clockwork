/**
 * Ελληνικά.
 *
 * Γλωσσάρι: secret · θυρίδα (vault) · λογαριασμός · συνθηματική φράση
 *   (passphrase) · καταχώριση · κωδικός · καντράν. Το «secret» μένει
 *   αμετάφραστο — έτσι το γράφουν και οι ίδιοι οι πάροχοι.
 * Ύφος: απρόσωπο και λιτό, όπως στα εργαλεία για προγραμματιστές.
 * Εισαγωγικά: « … », κατά την ελληνική τυπογραφία.
 * Πληθυντικός: το CLDR δίνει one και other.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — έλεγχος ταυτότητας TOTP',
  'meta.description':
    'Clockwork — έλεγχος ταυτότητας TOTP. Παράγει κωδικούς δύο παραγόντων εξ ολοκλήρου στο ' +
    'πρόγραμμα περιήγησης, χωρίς καμία αίτηση δικτύου.',
  'brand.tagline': 'Έλεγχος ταυτότητας TOTP · RFC 6238',
  'skip.toCodes': 'Μετάβαση στους κωδικούς',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Εκτός δικτύου',
  'status.vault.off': 'δεν αποθηκεύεται τίποτα',
  'status.vault.locked': 'η θυρίδα είναι κλειδωμένη',
  'status.vault.open': 'η θυρίδα είναι ανοιχτή',

  'zone.input': 'Είσοδος',
  'zone.vault': 'Θυρίδα',
  'zone.codes': 'Κωδικοί',

  'input.legend': 'Μία καταχώριση ανά γραμμή',
  'input.help.formats': 'Base32, {nameSecret} ή {uri} — ανάμεικτα. Το {hash} ξεκινά σημείωση.',
  'input.help.images':
    'Οι εικόνες με κωδικό QR μπορούν επίσης να συρθούν εδώ ή να επικολληθούν με {paste}.',
  'input.help.migration':
    'Οι εξαγωγές από το Google Authenticator ({migration}) μετατρέπονται αυτόματα.',
  'input.help.more': 'Όλες οι μορφές εισόδου',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} λογαριασμός', other: '{n} λογαριασμοί' },
  'input.count.errors': { one: '{n} σφάλμα', other: '{n} σφάλματα' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Άδειασμα',
  'key.qrImage': 'QR από εικόνα',
  'key.camera': 'Κάμερα',
  'key.cameraStop': 'Κλείσιμο κάμερας',
  'key.copy': 'Αντιγραφή',
  'key.copyDone': 'Αντιγράφηκε',
  'key.copyFailed': 'Απέτυχε',

  'viewfinder.hint': 'Κρατήστε τον κωδικό QR μέσα στο πλαίσιο',

  'filter.label': 'Φιλτράρισμα λογαριασμών',
  'filter.placeholder': 'Φιλτράρισμα κατά όνομα',
  'filter.empty': 'Τίποτα δεν ταιριάζει με «{query}».',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} ψηφίο', other: '{n} ψηφία' },
  'strip.period': '{n} δ',
  'strip.next': 'ακολουθεί',
  'strip.seconds.abbr': 'δ',
  'strip.seconds.title': 'δευτερόλεπτα',
  'strip.seconds.valid': 'ισχύει',
  'strip.accountFallback': 'Λογαριασμός {n}',
  'strip.copyAria': 'Αντιγραφή του κωδικού για {name}',
  'strip.copyAnnounce': 'Ο κωδικός {digits} αντιγράφηκε',
  'strip.copyFailedHint': 'Η αντιγραφή απέτυχε. Επιλέξτε τον κωδικό με το χέρι.',

  'fault.title': 'Μη αναγνώσιμη γραμμή',

  'vault.state.off': 'Ανενεργή — δεν αποθηκεύεται τίποτα',
  'vault.state.locked': 'Κλειδωμένη — χρειάζεται συνθηματική φράση',
  'vault.state.open': 'Ανοιχτή — τα secret βρίσκονται στο πεδίο κειμένου',
  'vault.explain':
    'Εξ ορισμού το Clockwork δεν αποθηκεύει τίποτα. Όποιος θέλει, μπορεί να αφήσει εδώ την ' +
    'είσοδο κρυπτογραφημένη με μια συνθηματική φράση: PBKDF2-SHA-256 με {iterations} ' +
    'επαναλήψεις και έπειτα AES-256-GCM. Χωρίς τη συνθηματική φράση το αποθηκευμένο μπλοκ ' +
    'δεν αξίζει τίποτα.',
  'vault.pass.new': 'Νέα συνθηματική φράση',
  'vault.pass.existing': 'Συνθηματική φράση',
  'vault.action.seal': 'Αποθήκευση κρυπτογραφημένα',
  'vault.action.unseal': 'Ξεκλείδωμα',
  'vault.action.deriving': 'Παραγωγή κλειδιού …',
  'vault.action.lock': 'Κλείδωμα',
  'vault.action.update': 'Νέα αποθήκευση',
  'vault.action.wipe': 'Διαγραφή όλων',
  'vault.action.wipeConfirm': 'Οριστική διαγραφή;',
  'vault.timeout.label': 'Κλειδώνει μόνη της μετά από',
  'vault.timeout.minutes': { one: '{n} λεπτό', other: '{n} λεπτά' },
  'vault.lockOnHide': 'και όταν φύγετε από την καρτέλα',

  'vault.error.nothingToStore': 'Δεν υπάρχει τίποτα να αποθηκευτεί — το πεδίο κειμένου είναι κενό.',
  'vault.error.storageBlocked':
    'Το πρόγραμμα περιήγησης δεν επιτρέπει αποθήκευση (ιδιωτική περιήγηση;).',
  'vault.error.noVault': 'Δεν υπάρχει αποθηκευμένη θυρίδα.',
  'vault.error.noPassphrase': 'Χωρίς συνθηματική φράση δεν υπάρχει κλειδί.',
  'vault.error.sealFailed': 'Η αποθήκευση απέτυχε.',
  'vault.error.unsealFailed': 'Το ξεκλείδωμα απέτυχε.',

  'vault.msg.sealed': 'Η θυρίδα αποθηκεύτηκε κρυπτογραφημένα.',
  'vault.msg.resealed': 'Η θυρίδα κρυπτογραφήθηκε ξανά.',
  'vault.msg.unsealed': 'Η θυρίδα ξεκλειδώθηκε.',
  'vault.msg.locked': 'Η θυρίδα κλειδώθηκε.',
  'vault.msg.wiped': 'Η θυρίδα διαγράφηκε.',
  'vault.msg.wipedNote': 'Διαγράφηκε. Στον αποθηκευτικό χώρο δεν έμεινε τίποτα.',
  'vault.locked.idle': {
    one: 'Κλείδωσε μετά από {n} λεπτό χωρίς είσοδο.',
    other: 'Κλείδωσε μετά από {n} λεπτά χωρίς είσοδο.',
  },
  'vault.locked.hidden': 'Κλείδωσε με την έξοδο από την καρτέλα.',

  'scan.noQr': 'Στην εικόνα δεν αναγνωρίστηκε κανένας κωδικός QR.',
  'scan.unreadable': 'Η εικόνα δεν μπόρεσε να διαβαστεί — είναι όντως εικόνα;',
  'scan.done': 'Ο κωδικός QR διαβάστηκε και εισήχθη.',
  'scan.camera.unavailable':
    'Αυτό το περιβάλλον δεν παραχωρεί κάμερα. Όταν το αρχείο ανοίγει απευθείας (file://), τα ' +
    'περισσότερα προγράμματα περιήγησης την μπλοκάρουν — το «QR από εικόνα» δουλεύει πάντα.',
  'scan.camera.denied':
    'Η κάμερα απορρίφθηκε. Επαναφέρετε την άδεια στο πρόγραμμα περιήγησης — ή ' +
    'χρησιμοποιήστε το «QR από εικόνα».',
  'scan.camera.notFound':
    'Δεν υπάρχει συνδεδεμένη κάμερα. Το «QR από εικόνα» δουλεύει έτσι κι αλλιώς.',
  'scan.camera.busy': 'Η κάμερα χρησιμοποιείται αυτή τη στιγμή από άλλο πρόγραμμα.',
  'scan.camera.failed': 'Η κάμερα δεν μπόρεσε να ξεκινήσει. Το «QR από εικόνα» δουλεύει πάντα.',

  'import.done': {
    one: 'Παραλήφθηκε {n} λογαριασμός από την εξαγωγή του Google Authenticator',
    other: 'Παραλήφθηκαν {n} λογαριασμοί από την εξαγωγή του Google Authenticator',
  },
  'import.skipped': 'παραλείφθηκαν: {list}',
  'import.skip.hotp': '{label} (HOTP, με βάση μετρητή)',
  'import.skip.algorithm': '{label} (μη υποστηριζόμενος αλγόριθμος)',
  'import.skip.emptySecret': '{label} (κενό secret)',
  'import.unnamed': 'Χωρίς όνομα',
  'import.unreadable': 'Η εξαγωγή δεν διαβάζεται.',

  'vacant.text':
    'Μυστικό, σύνδεσμος otpauth ή εικόνα QR — τίποτα από αυτά δεν φεύγει από αυτό το πρόγραμμα περιήγησης.',
  'vacant.demo': 'Εισαγωγή δοκιμαστικού κλειδιού',
  'colophon.note': 'Χωρίς δίκτυο · χωρίς αποθήκευση · HMAC μέσω του Web Crypto API',

  'lang.label': 'Γλώσσα',
  'lang.aria': 'Επιλογή γλώσσας',

  'err.base32.paddingInside':
    'Ο χαρακτήρας «=» επιτρέπεται μόνο στο τέλος (δεν είναι παρά γέμισμα).',
  'err.base32.empty': 'Το κλειδί secret είναι κενό.',
  'err.base32.badChar':
    'Άκυρος χαρακτήρας «{char}» στη θέση {position}. Το Base32 γνωρίζει μόνο A–Z και 2–7 — τα ' +
    'ψηφία 0, 1 και 8 δεν εμφανίζονται σε αυτό (μπερδεύτηκαν με O, I και B;).',
  'err.base32.badLength':
    'Άκυρο μήκος: {length} χαρακτήρες (χωρίς κενά και γέμισμα). Το Base32 κωδικοποιεί 5 ' +
    'ψηφιολέξεις σε 8 χαρακτήρες· στο τελευταίο μπλοκ χωρούν μόνο 2, 4, 5, 7 ή 8 χαρακτήρες. ' +
    'Πιθανότατα λείπει ένας χαρακτήρας ή περισσεύει ένας.',

  'err.uri.invalid': 'Αυτό δεν είναι έγκυρο URI. Αναμένεται «otpauth://totp/…».',
  'err.uri.scheme': 'Άγνωστο σχήμα «{scheme}». Αναμένεται «otpauth».',
  'err.uri.hotp':
    'Αυτό είναι URI τύπου HOTP (με βάση μετρητή). Αυτή η εφαρμογή παράγει μόνο κωδικούς TOTP ' +
    'με βάση τον χρόνο — για το άλλο θα έπρεπε να αποθηκεύεται η κατάσταση του μετρητή.',
  'err.uri.type': 'Άγνωστος τύπος «{type}». Μετά το «otpauth://» πρέπει να ακολουθεί «totp».',
  'err.uri.typeEmpty': '(κενό)',
  'err.uri.noSecret': 'Από το URI λείπει η παράμετρος «secret».',
  'err.uri.badLabel':
    'Η ετικέτα του URI περιέχει χαλασμένη κωδικοποίηση επί τοις εκατό (για παράδειγμα ένα ' +
    'μεμονωμένο «%»).',
  'err.uri.algorithm': 'Άγνωστος αλγόριθμος «{value}». Υποστηρίζονται SHA1, SHA256 και SHA512.',
  'err.uri.digits': 'Άκυρη τιμή για «digits»: {value}. Επιτρέπονται από {min} έως {max}.',
  'err.uri.period': 'Άκυρη τιμή για «period»: {value}. Αναμένονται από 1 έως 3600 δευτερόλεπτα.',
  'err.uri.integer': 'Η παράμετρος «{name}» πρέπει να είναι ακέραιος· βρέθηκε «{value}».',

  'err.otp.digits': 'Άκυρο πλήθος ψηφίων: {value}. Επιτρέπονται από {min} έως {max}.',
  'err.otp.emptySecret': 'Το secret είναι κενό — από αυτό δεν υπολογίζεται κανένας κωδικός.',

  'err.line.unreadable': 'Αυτή η γραμμή δεν μπόρεσε να διαβαστεί.',

  'err.vault.openFailed':
    'Η θυρίδα δεν άνοιξε. Λάθος συνθηματική φράση — ή τα αποθηκευμένα δεδομένα ' +
    'τροποποιήθηκαν.',
  'err.vault.badFormat': 'Τα αποθηκευμένα δεδομένα της θυρίδας έχουν άγνωστη μορφή.',
  'err.vault.version': 'Η έκδοση θυρίδας {version} δεν υποστηρίζεται (αναμενόταν: {expected}).',
  'err.vault.base64': 'Το πεδίο «{field}» των δεδομένων της θυρίδας δεν είναι έγκυρο Base64.',
  'err.vault.iterations': 'Άκυρο πλήθος επαναλήψεων: {value}.',

  'err.migration.notExport':
    'Αυτό δεν είναι εξαγωγή του Google Authenticator. Αναμένεται ' +
    '«otpauth-migration://offline?data=…».',
  'err.migration.noData': 'Από το URI λείπει η παράμετρος «data».',
  'err.migration.badPercent': 'Η παράμετρος «data» περιέχει χαλασμένη κωδικοποίηση επί τοις εκατό.',
  'err.migration.badBase64': 'Η παράμετρος «data» δεν είναι έγκυρο Base64.',
  'err.migration.noAccounts': 'Σε αυτή την εξαγωγή δεν υπάρχουν λογαριασμοί.',
} satisfies Strings;
