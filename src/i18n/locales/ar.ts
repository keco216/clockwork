/**
 * العربية — لغة تُكتب من اليمين إلى اليسار (dir="rtl").
 *
 * المصطلحات: السرّ (secret) · الخزنة (vault) · حساب · عبارة المرور (passphrase) ·
 *   مُدخَل · رمز · مينا الساعة. بقيت أسماء المعايير والبروتوكولات باللاتينية
 *   (Base32، SHA-1، otpauth) لأنها تُكتب هكذا في كل مكان.
 * الأسلوب: محايد وموجز، كما في أدوات المطوّرين.
 * علامات الاقتباس: « … ».
 * الأرقام: تبقى لاتينية في كل مكان — الرموز تُنسخ إلى حقول تسجيل دخول أجنبية،
 *   وخط المينا لا يعرف غير الأرقام اللاتينية. خلط نظامَي أرقام على جهاز واحد
 *   خطأ في القراءة.
 * الجمع: للعربية ست صيغ (zero وone وtwo وfew وmany وother). يبقى العدد {n}
 *   ظاهرًا في كل صيغة — هذا مقصود: الشريط عدّاد لا جملة.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — مُوثِّق TOTP',
  'meta.description':
    'Clockwork — مُوثِّق TOTP. يُنشئ رموز التحقق بخطوتين داخل المتصفح بالكامل، دون أي طلب شبكة.',
  'brand.tagline': 'مُوثِّق TOTP · RFC 6238',
  'skip.toCodes': 'انتقل إلى الرموز',

  'status.line': '{connection} · {vault}',
  'status.offline': 'دون اتصال',
  'status.vault.off': 'لا يُحفظ شيء',
  'status.vault.locked': 'الخزنة مقفلة',
  'status.vault.open': 'الخزنة مفتوحة',

  'zone.input': 'الإدخال',
  'zone.vault': 'الخزنة',
  'zone.codes': 'الرموز',

  'input.legend': 'مُدخَل واحد في كل سطر',
  'input.placeholder':
    'مثال:\n' +
    'JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32 أو {nameSecret} أو {uri} — مختلطة. و{hash} تبدأ ملاحظة.',
  'input.help.images': 'يمكن أيضًا سحب صور رمز QR إلى هنا أو لصقها بـ {paste}.',
  'input.help.migration': 'تُحوَّل صادرات Google Authenticator ({migration}) تلقائيًا.',
  'input.help.more': 'كل صيغ الإدخال',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': {
    zero: '{n} حساب',
    one: '{n} حساب',
    two: '{n} حساب',
    few: '{n} حسابات',
    many: '{n} حسابًا',
    other: '{n} حساب',
  },
  'input.count.errors': {
    zero: '{n} خطأ',
    one: '{n} خطأ',
    two: '{n} خطأ',
    few: '{n} أخطاء',
    many: '{n} خطأً',
    other: '{n} خطأ',
  },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'إفراغ',
  'key.qrImage': 'QR من صورة',
  'key.camera': 'الكاميرا',
  'key.cameraStop': 'إيقاف الكاميرا',
  'key.copy': 'نسخ',
  'key.copyDone': 'نُسخ',
  'key.copyFailed': 'أخفق',

  'viewfinder.hint': 'أبقِ رمز QR داخل الإطار',

  'filter.label': 'تصفية الحسابات',
  'filter.placeholder': 'تصفية بالاسم',
  'filter.empty': 'لا يوجد ما يطابق «{query}».',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': {
    zero: '{n} خانة',
    one: '{n} خانة',
    two: '{n} خانة',
    few: '{n} خانات',
    many: '{n} خانة',
    other: '{n} خانة',
  },
  'strip.period': '{n} ث',
  'strip.next': 'التالي',
  'strip.seconds.abbr': 'ث',
  'strip.seconds.title': 'ثوانٍ',
  'strip.seconds.valid': 'صالح',
  'strip.accountFallback': 'حساب {n}',
  'strip.copyAria': 'انسخ رمز {name}',
  'strip.copyAnnounce': 'نُسخ الرمز {digits}',
  'strip.copyFailedHint': 'أخفق النسخ. حدِّد الرمز يدويًا.',

  'fault.title': 'سطر غير مقروء',

  'vault.state.off': 'مطفأة — لا يُحفظ شيء',
  'vault.state.locked': 'مقفلة — عبارة المرور مطلوبة',
  'vault.state.open': 'مفتوحة — الأسرار في حقل النص',
  'vault.explain':
    'لا يحفظ Clockwork شيئًا بشكل افتراضي. وإن شغّلت الخزنة بقي المُدخَل هنا مُعمّى ' +
    'بعبارة مرورك، وبغيرها لا قيمة للكتلة المحفوظة.',
  'vault.explain.crypto':
    'يُشتَق المفتاح من عبارة المرور بـ PBKDF2-SHA-256 عبر {iterations} تكرار، ويتولّى ' +
    'AES-256-GCM التعمية. ولا يُحفَظ سوى المُغلَّف المختوم: لا النص الصريح، ولا عبارة ' +
    'المرور، ولا المفتاح المُشتَق.',
  'vault.explain.more': 'كل التفاصيل',
  'vault.pass.new': 'عبارة مرور جديدة',
  'vault.pass.existing': 'عبارة المرور',
  'vault.action.seal': 'احفظ مُعمّى',
  'vault.action.unseal': 'افتح',
  'vault.action.deriving': 'يُشتَقّ المفتاح …',
  'vault.action.lock': 'أقفل',
  'vault.action.update': 'احفظ من جديد',
  'vault.action.wipe': 'احذف كل شيء',
  'vault.action.wipeConfirm': 'أتريد الحذف فعلًا؟',
  'vault.timeout.label': 'تُقفل من تلقائها بعد',
  'vault.timeout.minutes': {
    zero: '{n} دقيقة',
    one: '{n} دقيقة',
    two: '{n} دقيقة',
    few: '{n} دقائق',
    many: '{n} دقيقة',
    other: '{n} دقيقة',
  },
  'vault.lockOnHide': 'وعند مغادرة اللسان',

  'vault.error.nothingToStore': 'لا شيء يُحفظ — حقل النص فارغ.',
  'vault.error.storageBlocked': 'المتصفح لا يسمح بالحفظ (وضع التصفح الخاص؟).',
  'vault.error.noVault': 'لا خزنة محفوظة.',
  'vault.error.noPassphrase': 'بغير عبارة مرور لا مفتاح.',
  'vault.error.sealFailed': 'أخفق الحفظ.',
  'vault.error.unsealFailed': 'أخفق الفتح.',

  'vault.msg.sealed': 'حُفظت الخزنة مُعمّاة.',
  'vault.msg.resealed': 'أُعيد تعمية الخزنة.',
  'vault.msg.unsealed': 'فُتحت الخزنة.',
  'vault.msg.locked': 'أُقفلت الخزنة.',
  'vault.msg.wiped': 'حُذفت الخزنة.',
  'vault.msg.wipedNote': 'حُذفت. لم يبقَ شيء في التخزين.',
  'vault.locked.idle': {
    zero: 'أُقفلت بعد {n} دقيقة دون إدخال.',
    one: 'أُقفلت بعد {n} دقيقة دون إدخال.',
    two: 'أُقفلت بعد {n} دقيقة دون إدخال.',
    few: 'أُقفلت بعد {n} دقائق دون إدخال.',
    many: 'أُقفلت بعد {n} دقيقة دون إدخال.',
    other: 'أُقفلت بعد {n} دقيقة دون إدخال.',
  },
  'vault.locked.hidden': 'أُقفلت عند مغادرة اللسان.',

  'scan.noQr': 'لم يُميَّز أي رمز QR في الصورة.',
  'scan.unreadable': 'تعذّرت قراءة الصورة — أهي صورة حقًا؟',
  'scan.done': 'قُرئ رمز QR وأُدرج.',
  'scan.camera.unavailable':
    'هذه البيئة لا تتيح كاميرا. وعند فتح الملف مباشرة (file://) تحجبها أغلب المتصفحات — ' +
    'أما «QR من صورة» فيعمل دائمًا.',
  'scan.camera.denied': 'رُفضت الكاميرا. أعِد ضبط الإذن في المتصفح — أو استعمل «QR من صورة».',
  'scan.camera.notFound': 'لا كاميرا موصولة. و«QR من صورة» يعمل على أي حال.',
  'scan.camera.busy': 'الكاميرا مشغولة الآن ببرنامج آخر.',
  'scan.camera.failed': 'تعذّر تشغيل الكاميرا. و«QR من صورة» يعمل دائمًا.',

  'import.done': {
    zero: 'نُقل {n} حساب من صادرات Google Authenticator',
    one: 'نُقل {n} حساب من صادرات Google Authenticator',
    two: 'نُقل {n} حساب من صادرات Google Authenticator',
    few: 'نُقلت {n} حسابات من صادرات Google Authenticator',
    many: 'نُقل {n} حسابًا من صادرات Google Authenticator',
    other: 'نُقل {n} حساب من صادرات Google Authenticator',
  },
  'import.skipped': 'تُخطّي: {list}',
  'import.skip.hotp': '{label} (HOTP، قائم على عدّاد)',
  'import.skip.algorithm': '{label} (خوارزمية غير مدعومة)',
  'import.skip.emptySecret': '{label} (سرّ فارغ)',
  'import.unnamed': 'بلا اسم',
  'import.unreadable': 'الصادرات غير مقروءة.',

  'vacant.text': 'سر أو رابط otpauth أو صورة QR — لا شيء من ذلك يغادر هذا المتصفح.',
  'vacant.demo': 'إدراج مفتاح تجريبي',
  'colophon.note': 'لا شبكة · لا تخزين · HMAC عبر Web Crypto API',

  'lang.label': 'اللغة',
  'lang.aria': 'اختر اللغة',

  'err.base32.paddingInside': 'المحرف «=» لا يجوز إلا في النهاية (فهو حشو ليس إلا).',
  'err.base32.empty': 'مفتاح السرّ فارغ.',
  'err.base32.badChar':
    'محرف غير صالح «{char}» في الموضع {position}. لا يعرف Base32 غير A–Z و2–7 — والأرقام 0 ' +
    'و1 و8 لا ترد فيه (أخُلطت بـ O وI وB؟).',
  'err.base32.badLength':
    'طول غير صالح: {length} محرفًا (دون المسافات والحشو). يرمّز Base32 خمسة بايتات في ثمانية ' +
    'محارف؛ ولا يقبل الحقل الأخير غير 2 أو 4 أو 5 أو 7 أو 8 محارف. الأرجح أن محرفًا ناقص أو ' +
    'أن محرفًا زائد.',

  'err.uri.invalid': 'هذا ليس URI صالحًا. المتوقع «otpauth://totp/…».',
  'err.uri.scheme': 'مخطط مجهول «{scheme}». المتوقع «otpauth».',
  'err.uri.hotp':
    'هذا URI من نوع HOTP (قائم على عدّاد). لا ينشئ هذا التطبيق غير رموز TOTP المرتبطة ' +
    'بالوقت — وإلا لوجب حفظ حالة العدّاد.',
  'err.uri.type': 'نوع مجهول «{type}». يجب أن يأتي «totp» بعد «otpauth://».',
  'err.uri.typeEmpty': '(فارغ)',
  'err.uri.noSecret': 'ينقص URI المعامل «secret».',
  'err.uri.badLabel': 'يحوي وسم URI ترميزًا مئويًا معطوبًا (مثل «%» وحيدة).',
  'err.uri.algorithm': 'خوارزمية مجهولة «{value}». المدعوم: SHA1 وSHA256 وSHA512.',
  'err.uri.digits': 'قيمة غير صالحة لـ «digits»: {value}. المسموح من {min} إلى {max}.',
  'err.uri.period': 'قيمة غير صالحة لـ «period»: {value}. المتوقع من 1 إلى 3600 ثانية.',
  'err.uri.integer': 'يجب أن يكون المعامل «{name}» عددًا صحيحًا؛ وُجد «{value}».',

  'err.otp.digits': 'عدد خانات غير صالح: {value}. المسموح من {min} إلى {max}.',
  'err.otp.emptySecret': 'السرّ فارغ — لا يمكن حساب أي رمز منه.',

  'err.line.unreadable': 'تعذّرت قراءة هذا السطر.',

  'err.vault.openFailed':
    'تعذّر فتح الخزنة. عبارة المرور خاطئة — أو أن البيانات المحفوظة قد غُيّرت.',
  'err.vault.badFormat': 'بيانات الخزنة المحفوظة بصيغة مجهولة.',
  'err.vault.version': 'إصدار الخزنة {version} غير مدعوم (المتوقع: {expected}).',
  'err.vault.base64': 'الحقل «{field}» من بيانات الخزنة ليس Base64 صالحًا.',
  'err.vault.iterations': 'عدد تكرارات غير صالح: {value}.',

  'err.migration.notExport':
    'هذه ليست صادرات Google Authenticator. المتوقع ' + '«otpauth-migration://offline?data=…».',
  'err.migration.noData': 'ينقص URI المعامل «data».',
  'err.migration.badPercent': 'يحوي المعامل «data» ترميزًا مئويًا معطوبًا.',
  'err.migration.badBase64': 'المعامل «data» ليس Base64 صالحًا.',
  'err.migration.noAccounts': 'لا حسابات في هذه الصادرات.',

  'native.vacant.text': 'سر أو رابط otpauth أو صورة QR — لا شيء من ذلك يغادر هذا الجهاز.',
} satisfies Strings;
