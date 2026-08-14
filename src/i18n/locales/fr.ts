/**
 * Français.
 *
 * Glossaire : secret · coffre (vault) · compte · phrase secrète (passphrase) ·
 *   entrée · code · cadran. « Coffre » plutôt que « coffre-fort » : plus court,
 *   et l’image de l’instrument reste.
 * Registre : vouvoiement, sobre — l’usage des outils de développement français.
 * Guillemets : « … » (espaces ordinaires, pas d’espaces fines insécables : un
 *   caractère invisible dans le code source est un piège de maintenance).
 * Pluriel : CLDR donne one/many/other au français ; « many » ne concerne que les
 *   très grands nombres et reprend donc le texte de « other ».
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — Authentificateur TOTP',
  'meta.description':
    'Clockwork — authentificateur TOTP. Génère des codes à deux facteurs entièrement dans le ' +
    'navigateur, sans aucune requête réseau.',
  'brand.tagline': 'Authentificateur TOTP · RFC 6238',
  'skip.toCodes': 'Aller aux codes',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Hors ligne',
  'status.vault.off': 'rien n’est enregistré',
  'status.vault.locked': 'coffre verrouillé',
  'status.vault.open': 'coffre ouvert',

  'zone.input': 'Saisie',
  'zone.vault': 'Coffre',
  'zone.codes': 'Codes',

  'input.legend': 'Une entrée par ligne',
  'input.placeholder':
    'p. ex. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} ou {uri} — mélangés. {hash} commence une note.',
  'input.help.images':
    'Les images de QR code peuvent aussi être glissées ici ou collées avec {paste}.',
  'input.help.migration':
    'Les exports Google Authenticator ({migration}) sont convertis automatiquement.',
  'input.help.more': 'Tous les formats acceptés',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} compte', many: '{n} comptes', other: '{n} comptes' },
  'input.count.errors': { one: '{n} erreur', many: '{n} erreurs', other: '{n} erreurs' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Vider',
  'key.qrImage': 'QR depuis une image',
  'key.camera': 'Caméra',
  'key.cameraStop': 'Arrêter la caméra',
  'key.copy': 'Copier',
  'key.copyDone': 'Copié',
  'key.copyFailed': 'Échec',

  'viewfinder.hint': 'Placez le QR code dans le cadre',

  'filter.label': 'Filtrer les comptes',
  'filter.placeholder': 'Filtrer par nom',
  'filter.empty': 'Rien ne correspond à « {query} ».',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} chiffre', many: '{n} chiffres', other: '{n} chiffres' },
  'strip.period': '{n} s',
  'strip.next': 'suivant',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'secondes',
  'strip.seconds.valid': 'valide',
  'strip.accountFallback': 'Compte {n}',
  'strip.copyAria': 'Copier le code de {name}',
  'strip.copyAnnounce': 'Code {digits} copié',
  'strip.copyFailedHint': 'La copie a échoué. Sélectionnez le code à la main.',

  'fault.title': 'Ligne illisible',

  'vault.state.off': 'Éteint — rien n’est enregistré',
  'vault.state.locked': 'Verrouillé — phrase secrète requise',
  'vault.state.open': 'Ouvert — les secrets sont dans le champ de texte',
  'vault.explain':
    'Par défaut, Clockwork ne conserve rien. Si vous activez le coffre, la saisie reste ' +
    'ici chiffrée par votre phrase secrète — sans elle, le bloc enregistré ne vaut rien.',
  'vault.explain.crypto':
    'La clé est dérivée de la phrase secrète par PBKDF2-SHA-256 avec {iterations} ' +
    'itérations, et AES-256-GCM assure le chiffrement. Seule l’enveloppe scellée est ' +
    'enregistrée : jamais le texte en clair, jamais la phrase secrète, jamais la clé ' +
    'dérivée.',
  'vault.explain.more': 'Tous les détails',
  'vault.pass.new': 'Nouvelle phrase secrète',
  'vault.pass.existing': 'Phrase secrète',
  'vault.action.seal': 'Enregistrer chiffré',
  'vault.action.unseal': 'Déverrouiller',
  'vault.action.deriving': 'Dérivation de la clé …',
  'vault.action.lock': 'Verrouiller',
  'vault.action.update': 'Enregistrer à nouveau',
  'vault.action.wipe': 'Tout supprimer',
  'vault.action.wipeConfirm': 'Vraiment supprimer ?',
  'vault.timeout.label': 'Se verrouille automatiquement après',
  'vault.timeout.minutes': { one: '{n} minute', many: '{n} minutes', other: '{n} minutes' },
  'vault.lockOnHide': 'et en quittant l’onglet',

  'vault.error.nothingToStore': 'Il n’y a rien à enregistrer — le champ de texte est vide.',
  'vault.error.storageBlocked':
    'Le navigateur n’autorise pas l’enregistrement (navigation privée ?).',
  'vault.error.noVault': 'Aucun coffre n’est enregistré.',
  'vault.error.noPassphrase': 'Sans phrase secrète, il n’y a pas de clé.',
  'vault.error.sealFailed': 'L’enregistrement a échoué.',
  'vault.error.unsealFailed': 'Le déverrouillage a échoué.',

  'vault.msg.sealed': 'Coffre enregistré chiffré.',
  'vault.msg.resealed': 'Coffre chiffré à nouveau.',
  'vault.msg.unsealed': 'Coffre déverrouillé.',
  'vault.msg.locked': 'Coffre verrouillé.',
  'vault.msg.wiped': 'Coffre supprimé.',
  'vault.msg.wipedNote': 'Supprimé. Il ne reste rien en mémoire.',
  'vault.locked.idle': {
    one: 'Verrouillé après {n} minute sans saisie.',
    many: 'Verrouillé après {n} minutes sans saisie.',
    other: 'Verrouillé après {n} minutes sans saisie.',
  },
  'vault.locked.hidden': 'Verrouillé en quittant l’onglet.',

  'scan.noQr': 'Aucun QR code n’a pu être reconnu dans l’image.',
  'scan.unreadable': 'L’image n’a pas pu être lue — est-ce bien une image ?',
  'scan.done': 'QR code lu et inséré.',
  'scan.camera.unavailable':
    'Cet environnement ne donne pas accès à une caméra. À l’ouverture en tant que fichier ' +
    '(file://), la plupart des navigateurs la bloquent — « QR depuis une image » fonctionne ' +
    'toujours.',
  'scan.camera.denied':
    'La caméra a été refusée. Réinitialisez l’autorisation dans le navigateur — ou utilisez ' +
    '« QR depuis une image ».',
  'scan.camera.notFound':
    'Aucune caméra n’est connectée. « QR depuis une image » fonctionne malgré tout.',
  'scan.camera.busy': 'La caméra est actuellement utilisée par un autre programme.',
  'scan.camera.failed':
    'La caméra n’a pas pu démarrer. « QR depuis une image » fonctionne toujours.',

  'import.done': {
    one: '{n} compte repris de l’export Google Authenticator',
    many: '{n} comptes repris de l’export Google Authenticator',
    other: '{n} comptes repris de l’export Google Authenticator',
  },
  'import.skipped': 'ignorés : {list}',
  'import.skip.hotp': '{label} (HOTP, basé sur un compteur)',
  'import.skip.algorithm': '{label} (algorithme non pris en charge)',
  'import.skip.emptySecret': '{label} (secret vide)',
  'import.unnamed': 'Sans nom',
  'import.unreadable': 'Export illisible.',

  'vacant.text': 'Secret, lien otpauth ou image QR — rien de tout cela ne quitte ce navigateur.',
  'vacant.demo': 'Insérer une clé de test',
  'colophon.note': 'Pas de réseau · pas de stockage · HMAC via la Web Crypto API',

  'lang.label': 'Langue',
  'lang.aria': 'Choisir la langue',

  'err.base32.paddingInside':
    'Le caractère « = » ne peut se trouver qu’à la fin (ce n’est que du remplissage).',
  'err.base32.empty': 'La clé secrète est vide.',
  'err.base32.badChar':
    'Caractère invalide « {char} » à la position {position}. Base32 ne connaît que A–Z et ' +
    '2–7 — les chiffres 0, 1 et 8 n’y figurent pas (confondus avec O, I et B ?).',
  'err.base32.badLength':
    'Longueur invalide : {length} caractères (sans les espaces ni le remplissage). Base32 ' +
    'code 5 octets en 8 caractères ; le dernier bloc ne peut en compter que 2, 4, 5, 7 ou 8. ' +
    'Il manque probablement un caractère, ou il y en a un de trop.',

  'err.uri.invalid': 'Ce n’est pas une URI valide. Attendu : « otpauth://totp/… ».',
  'err.uri.scheme': 'Schéma inconnu « {scheme} ». Attendu : « otpauth ».',
  'err.uri.hotp':
    'Ceci est une URI HOTP (basée sur un compteur). Cette application ne produit que des ' +
    'codes TOTP fondés sur le temps — il faudrait pour cela enregistrer l’état du compteur.',
  'err.uri.type': 'Type inconnu « {type} ». « totp » doit suivre « otpauth:// ».',
  'err.uri.typeEmpty': '(vide)',
  'err.uri.noSecret': 'Le paramètre « secret » manque dans l’URI.',
  'err.uri.badLabel':
    'L’étiquette de l’URI contient un encodage pour cent défectueux (un « % » isolé, par ' +
    'exemple).',
  'err.uri.algorithm':
    'Algorithme inconnu « {value} ». Sont pris en charge SHA1, SHA256 et SHA512.',
  'err.uri.digits': 'Valeur invalide pour « digits » : {value}. Autorisé de {min} à {max}.',
  'err.uri.period': 'Valeur invalide pour « period » : {value}. Attendu de 1 à 3600 secondes.',
  'err.uri.integer':
    'Le paramètre « {name} » doit être un nombre entier ; « {value} » a été trouvé.',

  'err.otp.digits': 'Nombre de chiffres invalide : {value}. Autorisé de {min} à {max}.',
  'err.otp.emptySecret': 'Le secret est vide — aucun code ne peut en être calculé.',

  'err.line.unreadable': 'Cette ligne n’a pas pu être lue.',

  'err.vault.openFailed':
    'Le coffre n’a pas pu être ouvert. Phrase secrète erronée — ou les données enregistrées ' +
    'ont été modifiées.',
  'err.vault.badFormat': 'Les données de coffre enregistrées ont un format inconnu.',
  'err.vault.version':
    'La version de coffre {version} n’est pas prise en charge (attendu : {expected}).',
  'err.vault.base64': 'Le champ « {field} » des données de coffre n’est pas du Base64 valide.',
  'err.vault.iterations': 'Nombre d’itérations invalide : {value}.',

  'err.migration.notExport':
    'Ce n’est pas un export Google Authenticator. Attendu : ' +
    '« otpauth-migration://offline?data=… ».',
  'err.migration.noData': 'Le paramètre « data » manque dans l’URI.',
  'err.migration.badPercent': 'Le paramètre « data » contient un encodage pour cent défectueux.',
  'err.migration.badBase64': 'Le paramètre « data » n’est pas du Base64 valide.',
  'err.migration.noAccounts': 'Cet export ne contient aucun compte.',

  'native.vacant.text':
    'Secret, lien otpauth ou image QR — rien de tout cela ne quitte cet appareil.',

  'native.colophon.note': 'Pas de réseau · pas de stockage · HMAC via javax.crypto',

  'native.scan.camera.unavailable':
    'Cet appareil ne donne pas accès à une caméra — « QR depuis une image » fonctionne toujours.',
  'native.scan.camera.denied':
    'La caméra a été refusée. Accordez l’autorisation dans les paramètres système de l’application — ou utilisez « QR depuis une image ».',
  'native.vault.lockOnHide': 'et en quittant l’application',
  'native.vault.locked.hidden': 'Verrouillé en quittant l’application.',
  'native.vault.error.storageBlocked':
    'Le coffre n’a pas pu être écrit — le stockage est-il plein ?',
  'native.vault.biometric.label': 'Déverrouiller par biométrie',
  'native.vault.biometric.note':
    'Un raccourci, pas une seconde clé : la phrase secrète reste le seul retour possible.',
  'native.vault.biometric.cancel': 'Utiliser la phrase secrète',
  'native.vault.biometric.unavailable': 'Cet appareil n’a pas de biométrie forte configurée.',
  'native.vault.biometric.invalidated':
    'Une nouvelle biométrie a été enregistrée, le raccourci a donc disparu. Déverrouillez avec la phrase secrète et réactivez-le.',
  'native.vault.biometric.failed':
    'Le déverrouillage biométrique n’a pas fonctionné — utilisez la phrase secrète.',
  'native.vault.screenshots.label': 'Bloquer les captures d’écran et les aperçus',

  'native.nav.home': 'Accueil',
  'native.nav.settings': 'Réglages',
  'native.about.title': 'À propos',
  'native.about.version': 'Version',
  'native.about.network':
    'L’application n’a aucune permission réseau. Elle ne peut ouvrir aucune connexion — ni pour des mises à jour, ni pour des statistiques, ni par erreur.',
  'native.about.licenses': 'Licences',
  'native.about.source': 'Code source',
} satisfies Strings;
