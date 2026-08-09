/**
 * हिन्दी.
 *
 * शब्दावली: सीक्रेट (secret) · तिजोरी (vault) · खाता · पासफ़्रेज़ (passphrase) ·
 *   प्रविष्टि · कोड · डायल. मानकों और प्रोटोकॉलों के नाम रोमन लिपि में ही रहते
 *   हैं (Base32, SHA-1, otpauth) — वे हर जगह ऐसे ही लिखे जाते हैं.
 * शैली: निर्वैयक्तिक और सीधी, जैसी डेवलपर उपकरणों में होती है.
 * उद्धरण चिह्न: „ … ” का प्रयोग नहीं; हिन्दी में “ … ” चलता है.
 * अंक: सर्वत्र रोमन अंक — कोड विदेशी लॉगिन फ़ील्ड में चिपकाए जाते हैं.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP प्रमाणक',
  'meta.description':
    'Clockwork — TOTP प्रमाणक. दो-चरणीय कोड पूरी तरह ब्राउज़र में ही बनाता है, एक भी नेटवर्क ' +
    'अनुरोध किए बिना.',
  'brand.tagline': 'TOTP प्रमाणक · RFC 6238',
  'skip.toCodes': 'कोड तक जाएँ',

  'status.line': '{connection} · {vault}',
  'status.offline': 'ऑफ़लाइन',
  'status.vault.off': 'कुछ भी सहेजा नहीं जाता',
  'status.vault.locked': 'तिजोरी बंद है',
  'status.vault.open': 'तिजोरी खुली है',

  'zone.input': 'इनपुट',
  'zone.vault': 'तिजोरी',
  'zone.codes': 'कोड',

  'input.legend': 'हर पंक्ति में एक प्रविष्टि',
  'input.help.formats': 'Base32, {nameSecret} या {uri} — मिलाजुला. {hash} से टिप्पणी शुरू होती है.',
  'input.help.images': 'QR चित्र यहाँ खींचकर भी लाए जा सकते हैं या {paste} से चिपकाए जा सकते हैं.',
  'input.help.migration': 'Google Authenticator के निर्यात ({migration}) अपने आप बदल दिए जाते हैं.',
  'input.help.more': 'सभी इनपुट प्रारूप',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} खाता', other: '{n} खाते' },
  'input.count.errors': { one: '{n} त्रुटि', other: '{n} त्रुटियाँ' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'खाली करें',
  'key.qrImage': 'चित्र से QR',
  'key.camera': 'कैमरा',
  'key.cameraStop': 'कैमरा बंद करें',
  'key.copy': 'कॉपी करें',
  'key.copyDone': 'कॉपी हो गया',
  'key.copyFailed': 'विफल',

  'viewfinder.hint': 'QR कोड को फ़्रेम में रखें',

  'filter.label': 'खाते फ़िल्टर करें',
  'filter.placeholder': 'नाम से फ़िल्टर करें',
  'filter.empty': 'कुछ भी “{query}” से मेल नहीं खाता।',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} अंक', other: '{n} अंक' },
  'strip.period': '{n} से',
  'strip.next': 'अगला',
  'strip.seconds.abbr': 'से',
  'strip.seconds.title': 'सेकंड',
  'strip.seconds.valid': 'वैध',
  'strip.accountFallback': 'खाता {n}',
  'strip.copyAria': '{name} का कोड कॉपी करें',
  'strip.copyAnnounce': 'कोड {digits} कॉपी हो गया',
  'strip.copyFailedHint': 'कॉपी करना विफल रहा. कोड हाथ से चुनें.',

  'fault.title': 'पंक्ति पढ़ी नहीं जा सकी',

  'vault.state.off': 'बंद — कुछ भी सहेजा नहीं जाता',
  'vault.state.locked': 'बंद — पासफ़्रेज़ चाहिए',
  'vault.state.open': 'खुली — सीक्रेट टेक्स्ट फ़ील्ड में हैं',
  'vault.explain':
    'डिफ़ॉल्ट रूप से Clockwork कुछ भी सहेजता नहीं। तिजोरी चालू करने पर आपकी दर्ज सामग्री ' +
    'आपके पासफ़्रेज़ से एन्क्रिप्ट होकर यहीं रहती है — उसके बिना सहेजा गया ब्लॉक बेकार ' +
    'है।',
  'vault.explain.crypto':
    'कुंजी पासफ़्रेज़ से PBKDF2-SHA-256 द्वारा {iterations} पुनरावृत्तियों में व्युत्पन्न ' +
    'होती है, और एन्क्रिप्शन AES-256-GCM करता है। सहेजा जाता है केवल सीलबंद लिफ़ाफ़ा: न ' +
    'सादा पाठ, न पासफ़्रेज़, न व्युत्पन्न कुंजी।',
  'vault.explain.more': 'सभी विवरण',
  'vault.pass.new': 'नया पासफ़्रेज़',
  'vault.pass.existing': 'पासफ़्रेज़',
  'vault.action.seal': 'एन्क्रिप्ट करके सहेजें',
  'vault.action.unseal': 'खोलें',
  'vault.action.deriving': 'कुंजी निकाली जा रही है …',
  'vault.action.lock': 'बंद करें',
  'vault.action.update': 'फिर से सहेजें',
  'vault.action.wipe': 'सब मिटाएँ',
  'vault.action.wipeConfirm': 'सचमुच मिटाएँ?',
  'vault.timeout.label': 'इतने समय बाद अपने आप बंद हो जाती है:',
  'vault.timeout.minutes': { one: '{n} मिनट', other: '{n} मिनट' },
  'vault.lockOnHide': 'और टैब छोड़ने पर भी',

  'vault.error.nothingToStore': 'सहेजने को कुछ नहीं है — टेक्स्ट फ़ील्ड खाली है.',
  'vault.error.storageBlocked': 'ब्राउज़र सहेजने नहीं देता (निजी मोड?).',
  'vault.error.noVault': 'कोई तिजोरी सहेजी नहीं गई है.',
  'vault.error.noPassphrase': 'पासफ़्रेज़ के बिना कोई कुंजी नहीं.',
  'vault.error.sealFailed': 'सहेजना विफल रहा.',
  'vault.error.unsealFailed': 'खोलना विफल रहा.',

  'vault.msg.sealed': 'तिजोरी एन्क्रिप्ट करके सहेजी गई.',
  'vault.msg.resealed': 'तिजोरी फिर से एन्क्रिप्ट की गई.',
  'vault.msg.unsealed': 'तिजोरी खुल गई.',
  'vault.msg.locked': 'तिजोरी बंद हो गई.',
  'vault.msg.wiped': 'तिजोरी मिटा दी गई.',
  'vault.msg.wipedNote': 'मिटा दी गई. भंडारण में कुछ नहीं बचा.',
  'vault.locked.idle': {
    one: '{n} मिनट बिना इनपुट के बीतने पर बंद हो गई.',
    other: '{n} मिनट बिना इनपुट के बीतने पर बंद हो गई.',
  },
  'vault.locked.hidden': 'टैब छोड़ने पर बंद हो गई.',

  'scan.noQr': 'चित्र में कोई QR कोड नहीं पहचाना जा सका.',
  'scan.unreadable': 'चित्र पढ़ा नहीं जा सका — क्या यह सचमुच चित्र है?',
  'scan.done': 'QR कोड पढ़ लिया और डाल दिया गया.',
  'scan.camera.unavailable':
    'यह परिवेश कैमरा नहीं देता. फ़ाइल के रूप में खोलने पर (file://) ज़्यादातर ब्राउज़र उसे रोक ' +
    'देते हैं — “चित्र से QR” हमेशा काम करता है.',
  'scan.camera.denied':
    'कैमरे से मना कर दिया गया. ब्राउज़र में अनुमति फिर से सेट करें — या “चित्र से QR” लें.',
  'scan.camera.notFound': 'कोई कैमरा जुड़ा नहीं है. “चित्र से QR” फिर भी काम करता है.',
  'scan.camera.busy': 'कैमरा इस समय किसी दूसरे प्रोग्राम के पास है.',
  'scan.camera.failed': 'कैमरा चालू नहीं हो सका. “चित्र से QR” हमेशा काम करता है.',

  'import.done': {
    one: 'Google Authenticator के निर्यात से {n} खाता लिया गया',
    other: 'Google Authenticator के निर्यात से {n} खाते लिए गए',
  },
  'import.skipped': 'छोड़े गए: {list}',
  'import.skip.hotp': '{label} (HOTP, काउंटर आधारित)',
  'import.skip.algorithm': '{label} (असमर्थित एल्गोरिद्म)',
  'import.skip.emptySecret': '{label} (खाली सीक्रेट)',
  'import.unnamed': 'बिना नाम',
  'import.unreadable': 'निर्यात पढ़ा नहीं जा सकता.',

  'vacant.text': 'सीक्रेट, otpauth लिंक या QR छवि — इनमें से कुछ भी इस ब्राउज़र से बाहर नहीं जाता।',
  'vacant.demo': 'परीक्षण कुंजी डालें',
  'colophon.note': 'कोई नेटवर्क नहीं · कोई भंडारण नहीं · HMAC Web Crypto API से',

  'lang.label': 'भाषा',
  'lang.aria': 'भाषा चुनें',

  'err.base32.paddingInside': 'अक्षर “=” केवल अंत में आ सकता है (वह मात्र भराव है).',
  'err.base32.empty': 'सीक्रेट कुंजी खाली है.',
  'err.base32.badChar':
    'स्थान {position} पर अमान्य अक्षर “{char}”. Base32 केवल A–Z और 2–7 जानता है — अंक 0, 1 ' +
    'और 8 उसमें आते ही नहीं (O, I और B से भ्रम हुआ?).',
  'err.base32.badLength':
    'अमान्य लंबाई: {length} अक्षर (रिक्तियों और भराव के बिना). Base32 पाँच बाइट को आठ अक्षरों ' +
    'में बदलता है; अंतिम खंड में केवल 2, 4, 5, 7 या 8 अक्षर संभव हैं. संभवतः एक अक्षर कम है ' +
    'या एक ज़्यादा.',

  'err.uri.invalid': 'यह मान्य URI नहीं है. अपेक्षित है “otpauth://totp/…”.',
  'err.uri.scheme': 'अनजान स्कीम “{scheme}”. अपेक्षित है “otpauth”.',
  'err.uri.hotp':
    'यह HOTP URI है (काउंटर आधारित). यह ऐप केवल समय आधारित TOTP कोड बनाता है — उसके लिए ' +
    'काउंटर की स्थिति सहेजनी पड़ती.',
  'err.uri.type': 'अनजान प्रकार “{type}”. “otpauth://” के बाद “totp” आना चाहिए.',
  'err.uri.typeEmpty': '(खाली)',
  'err.uri.noSecret': 'URI में “secret” पैरामीटर नहीं है.',
  'err.uri.badLabel': 'URI के लेबल में टूटी प्रतिशत-कोडिंग है (जैसे अकेला “%”).',
  'err.uri.algorithm': 'अनजान एल्गोरिद्म “{value}”. समर्थित हैं SHA1, SHA256 और SHA512.',
  'err.uri.digits': '“digits” का अमान्य मान: {value}. {min} से {max} तक की अनुमति है.',
  'err.uri.period': '“period” का अमान्य मान: {value}. 1 से 3600 सेकंड अपेक्षित हैं.',
  'err.uri.integer': 'पैरामीटर “{name}” पूर्णांक होना चाहिए; मिला “{value}”.',

  'err.otp.digits': 'अमान्य अंक संख्या: {value}. {min} से {max} तक की अनुमति है.',
  'err.otp.emptySecret': 'सीक्रेट खाली है — उससे कोई कोड नहीं निकाला जा सकता.',

  'err.line.unreadable': 'यह पंक्ति पढ़ी नहीं जा सकी.',

  'err.vault.openFailed': 'तिजोरी नहीं खुली. पासफ़्रेज़ ग़लत — या सहेजा गया डेटा बदल दिया गया है.',
  'err.vault.badFormat': 'सहेजे गए तिजोरी डेटा का प्रारूप अनजान है.',
  'err.vault.version': 'तिजोरी संस्करण {version} समर्थित नहीं है (अपेक्षित: {expected}).',
  'err.vault.base64': 'तिजोरी डेटा का “{field}” फ़ील्ड मान्य Base64 नहीं है.',
  'err.vault.iterations': 'अमान्य पुनरावृत्ति संख्या: {value}.',

  'err.migration.notExport':
    'यह Google Authenticator का निर्यात नहीं है. अपेक्षित है ' +
    '“otpauth-migration://offline?data=…”.',
  'err.migration.noData': 'URI में “data” पैरामीटर नहीं है.',
  'err.migration.badPercent': '“data” पैरामीटर में टूटी प्रतिशत-कोडिंग है.',
  'err.migration.badBase64': '“data” पैरामीटर मान्य Base64 नहीं है.',
  'err.migration.noAccounts': 'इस निर्यात में कोई खाता नहीं है.',
} satisfies Strings;
