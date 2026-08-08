/**
 * עברית — שפה הנכתבת מימין לשמאל (dir="rtl").
 *
 * מונחים: סוד (secret) · כספת (vault) · חשבון · מִשְׁפַּט־סיסמה (passphrase) ·
 *   רשומה · קוד · לוח שעון. שמות תקנים ופרוטוקולים נשארים בלטינית
 *   (Base32, SHA-1, otpauth) — כך הם כתובים בכל מקום.
 * מִשְׁלָב: ענייני ותמציתי, כמו בכלי פיתוח.
 * מירכאות: „ … ” כמקובל, ובמקומות טכניים נשמר הכתיב הלטיני.
 * ספרות: נשארות לטיניות בכל מקום — הקודים מועתקים לשדות התחברות זרים.
 * רבים: ל‑CLDR יש one, two ו‑other (בגרסאות ישנות גם many). המספר {n} נשאר
 *   בכל צורה — הרצועה היא מונה, לא משפט.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — מאמת TOTP',
  'meta.description':
    'Clockwork — מאמת TOTP. מייצר קודי אימות דו־שלבי כולו בדפדפן, בלי אף בקשת רשת.',
  'brand.tagline': 'מאמת TOTP · RFC 6238',
  'skip.toCodes': 'דילוג אל הקודים',

  'status.line': '{connection} · {vault}',
  'status.offline': 'לא מקוון',
  'status.vault.off': 'שום דבר לא נשמר',
  'status.vault.locked': 'הכספת נעולה',
  'status.vault.open': 'הכספת פתוחה',

  'zone.input': 'קלט',
  'zone.vault': 'כספת',
  'zone.codes': 'קודים',

  'input.legend': 'רשומה אחת בכל שורה',
  'input.help.formats': 'Base32, ‏{nameSecret} או {uri} — מעורבבים. {hash} פותח הערה.',
  'input.help.images': 'אפשר גם לגרור לכאן תמונות של קוד QR או להדביק עם {paste}.',
  'input.help.migration': 'ייצוא מ‑Google Authenticator ‏({migration}) מומר מאליו.',
  'input.help.more': 'כל תבניות הקלט',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': {
    one: '{n} חשבון',
    two: '{n} חשבונות',
    many: '{n} חשבונות',
    other: '{n} חשבונות',
  },
  'input.count.errors': {
    one: '{n} שגיאה',
    two: '{n} שגיאות',
    many: '{n} שגיאות',
    other: '{n} שגיאות',
  },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'ריקון',
  'key.qrImage': 'QR מתמונה',
  'key.camera': 'מצלמה',
  'key.cameraStop': 'כיבוי המצלמה',
  'key.copy': 'העתקה',
  'key.copyDone': 'הועתק',
  'key.copyFailed': 'נכשל',

  'viewfinder.hint': 'החזיקו את קוד ה‑QR בתוך המסגרת',

  'filter.label': 'סינון חשבונות',
  'filter.placeholder': 'סינון לפי שם',
  'filter.empty': 'אין התאמה ל־"{query}".',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': {
    one: '{n} ספרה',
    two: '{n} ספרות',
    many: '{n} ספרות',
    other: '{n} ספרות',
  },
  'strip.period': '{n} שנ׳',
  'strip.next': 'הבא',
  'strip.seconds.abbr': 'שנ׳',
  'strip.seconds.title': 'שניות',
  'strip.seconds.valid': 'תקף',
  'strip.accountFallback': 'חשבון {n}',
  'strip.copyAria': 'העתקת הקוד של {name}',
  'strip.copyAnnounce': 'הקוד {digits} הועתק',
  'strip.copyFailedHint': 'ההעתקה נכשלה. סמנו את הקוד ידנית.',

  'fault.title': 'השורה אינה קריאה',

  'vault.state.off': 'כבויה — שום דבר לא נשמר',
  'vault.state.locked': 'נעולה — נדרש משפט־סיסמה',
  'vault.state.open': 'פתוחה — הסודות נמצאים בשדה הטקסט',
  'vault.explain':
    'כברירת מחדל Clockwork אינו שומר דבר. אם תפעיל את הכספת, הקלט יישאר כאן מוצפן ' +
    'במשפט־הסיסמה שלך — בלעדיו הבלוק השמור חסר ערך.',
  'vault.explain.crypto':
    'המפתח נגזר ממשפט־הסיסמה באמצעות ‏PBKDF2-SHA-256 עם {iterations} חזרות, וההצפנה היא ' +
    '‏AES-256-GCM. נשמרת רק המעטפה החתומה: לא הטקסט הגלוי, לא משפט־הסיסמה ולא המפתח ' +
    'הנגזר.',
  'vault.explain.more': 'כל הפרטים',
  'vault.pass.new': 'משפט־סיסמה חדש',
  'vault.pass.existing': 'משפט־סיסמה',
  'vault.action.seal': 'שמירה מוצפנת',
  'vault.action.unseal': 'פתיחה',
  'vault.action.deriving': 'נגזר מפתח …',
  'vault.action.lock': 'נעילה',
  'vault.action.update': 'שמירה מחדש',
  'vault.action.wipe': 'מחיקת הכול',
  'vault.action.wipeConfirm': 'למחוק באמת?',
  'vault.timeout.label': 'ננעלת מאליה לאחר',
  'vault.timeout.minutes': {
    one: '{n} דקה',
    two: '{n} דקות',
    many: '{n} דקות',
    other: '{n} דקות',
  },
  'vault.lockOnHide': 'וגם ביציאה מהלשונית',

  'vault.error.nothingToStore': 'אין מה לשמור — שדה הטקסט ריק.',
  'vault.error.storageBlocked': 'הדפדפן אינו מתיר שמירה (גלישה פרטית?).',
  'vault.error.noVault': 'לא שמורה שום כספת.',
  'vault.error.noPassphrase': 'בלי משפט־סיסמה אין מפתח.',
  'vault.error.sealFailed': 'השמירה נכשלה.',
  'vault.error.unsealFailed': 'הפתיחה נכשלה.',

  'vault.msg.sealed': 'הכספת נשמרה מוצפנת.',
  'vault.msg.resealed': 'הכספת הוצפנה מחדש.',
  'vault.msg.unsealed': 'הכספת נפתחה.',
  'vault.msg.locked': 'הכספת ננעלה.',
  'vault.msg.wiped': 'הכספת נמחקה.',
  'vault.msg.wipedNote': 'נמחקה. לא נשאר דבר באחסון.',
  'vault.locked.idle': {
    one: 'ננעלה לאחר {n} דקה בלי קלט.',
    two: 'ננעלה לאחר {n} דקות בלי קלט.',
    many: 'ננעלה לאחר {n} דקות בלי קלט.',
    other: 'ננעלה לאחר {n} דקות בלי קלט.',
  },
  'vault.locked.hidden': 'ננעלה ביציאה מהלשונית.',

  'scan.noQr': 'בתמונה לא זוהה שום קוד QR.',
  'scan.unreadable': 'לא הצלחנו לקרוא את התמונה — זו באמת תמונה?',
  'scan.done': 'קוד ה‑QR נקרא והוכנס.',
  'scan.camera.unavailable':
    'הסביבה הזאת אינה מוסרת מצלמה. בפתיחה כקובץ ‏(file://)‎ רוב הדפדפנים חוסמים אותה — ' +
    '„QR מתמונה” עובד תמיד.',
  'scan.camera.denied': 'המצלמה נדחתה. אפסו את ההרשאה בדפדפן — או השתמשו ב„QR מתמונה”.',
  'scan.camera.notFound': 'אין מצלמה מחוברת. „QR מתמונה” עובד בכל זאת.',
  'scan.camera.busy': 'המצלמה תפוסה כרגע בידי תוכנה אחרת.',
  'scan.camera.failed': 'לא הצלחנו להפעיל את המצלמה. „QR מתמונה” עובד תמיד.',

  'import.done': {
    one: 'נקלט {n} חשבון מייצוא Google Authenticator',
    two: 'נקלטו {n} חשבונות מייצוא Google Authenticator',
    many: 'נקלטו {n} חשבונות מייצוא Google Authenticator',
    other: 'נקלטו {n} חשבונות מייצוא Google Authenticator',
  },
  'import.skipped': 'דולגו: {list}',
  'import.skip.hotp': '{label} ‏(HOTP, מבוסס מונה)',
  'import.skip.algorithm': '{label} (אלגוריתם שאינו נתמך)',
  'import.skip.emptySecret': '{label} (סוד ריק)',
  'import.unnamed': 'ללא שם',
  'import.unreadable': 'הייצוא אינו קריא.',

  'vacant.text': 'סוד, קישור otpauth או תמונת QR — דבר מאלה אינו עוזב את הדפדפן הזה.',
  'vacant.demo': 'הוספת מפתח בדיקה',
  'colophon.note': 'בלי רשת · בלי אחסון · HMAC דרך Web Crypto API',

  'lang.label': 'שפה',
  'lang.aria': 'בחירת שפה',

  'err.base32.paddingInside': 'התו „=” מותר רק בסוף (הוא ריפוד ותו לא).',
  'err.base32.empty': 'מפתח הסוד ריק.',
  'err.base32.badChar':
    'תו לא חוקי „{char}” במקום {position}. ‏Base32 מכיר רק A–Z ו‑2–7 — הספרות 0, 1 ו‑8 אינן ' +
    'מופיעות בו (בלבול עם O, I ו‑B?).',
  'err.base32.badLength':
    'אורך לא חוקי: {length} תווים (בלי רווחים וריפוד). ‏Base32 מקודד 5 בתים ב‑8 תווים; בבלוק ' +
    'האחרון אפשריים רק 2, 4, 5, 7 או 8 תווים. כנראה חסר תו אחד או שיש אחד מיותר.',

  'err.uri.invalid': 'זה אינו URI תקין. מצופה „otpauth://totp/…”.',
  'err.uri.scheme': 'סכמה לא מוכרת „{scheme}”. מצופה „otpauth”.',
  'err.uri.hotp':
    'זהו URI מסוג HOTP (מבוסס מונה). היישום הזה מייצר רק קודי TOTP מבוססי זמן — אחרת היה ' +
    'צריך לשמור את מצב המונה.',
  'err.uri.type': 'סוג לא מוכר „{type}”. אחרי „otpauth://” חייב לבוא „totp”.',
  'err.uri.typeEmpty': '(ריק)',
  'err.uri.noSecret': 'חסר ב‑URI הפרמטר „secret”.',
  'err.uri.badLabel': 'בתווית ה‑URI יש קידוד אחוזים שבור (למשל „%” בודד).',
  'err.uri.algorithm': 'אלגוריתם לא מוכר „{value}”. נתמכים SHA1, SHA256 ו‑SHA512.',
  'err.uri.digits': 'ערך לא חוקי ל„digits”: {value}. מותר מ‑{min} עד {max}.',
  'err.uri.period': 'ערך לא חוקי ל„period”: {value}. מצופות 1 עד 3600 שניות.',
  'err.uri.integer': 'הפרמטר „{name}” חייב להיות מספר שלם; נמצא „{value}”.',

  'err.otp.digits': 'מספר ספרות לא חוקי: {value}. מותר מ‑{min} עד {max}.',
  'err.otp.emptySecret': 'הסוד ריק — אי אפשר לחשב ממנו שום קוד.',

  'err.line.unreadable': 'לא הצלחנו לקרוא את השורה הזאת.',

  'err.vault.openFailed': 'הכספת לא נפתחה. משפט־סיסמה שגוי — או שהנתונים השמורים שונו.',
  'err.vault.badFormat': 'לנתוני הכספת השמורים תבנית לא מוכרת.',
  'err.vault.version': 'גרסת כספת {version} אינה נתמכת (מצופה: {expected}).',
  'err.vault.base64': 'השדה „{field}” בנתוני הכספת אינו Base64 תקין.',
  'err.vault.iterations': 'מספר חזרות לא חוקי: {value}.',

  'err.migration.notExport':
    'זה אינו ייצוא של Google Authenticator. מצופה ' + '„otpauth-migration://offline?data=…”.',
  'err.migration.noData': 'חסר ב‑URI הפרמטר „data”.',
  'err.migration.badPercent': 'בפרמטר „data” יש קידוד אחוזים שבור.',
  'err.migration.badBase64': 'הפרמטר „data” אינו Base64 תקין.',
  'err.migration.noAccounts': 'בייצוא הזה אין שום חשבון.',
} satisfies Strings;
