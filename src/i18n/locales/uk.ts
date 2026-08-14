/**
 * Українська.
 *
 * Словник: secret · сейф (vault) · обліковий запис · парольна фраза
 *   (passphrase) · запис · код · циферблат. «Secret» лишається латинкою — так
 *   він зветься й на сторінках самих постачальників.
 * Регістр: безособовий і діловий, як в інструментах для розробників.
 * Лапки: « … », за українською типографікою.
 * Множина: CLDR дає one (1, 21 …), few (2–4, 22–24 …), many (0, 5–20 …)
 *   та other (дробові).
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — автентифікатор TOTP',
  'meta.description':
    'Clockwork — автентифікатор TOTP. Створює коди двофакторної перевірки цілком у браузері, ' +
    'без жодного мережевого запиту.',
  'brand.tagline': 'Автентифікатор TOTP · RFC 6238',
  'skip.toCodes': 'Перейти до кодів',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Без мережі',
  'status.vault.off': 'нічого не зберігається',
  'status.vault.locked': 'сейф замкнено',
  'status.vault.open': 'сейф відкрито',

  'zone.input': 'Введення',
  'zone.vault': 'Сейф',
  'zone.codes': 'Коди',

  'input.legend': 'По одному запису в рядку',
  'input.placeholder':
    'напр. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} або {uri} — упереміш. {hash} починає нотатку.',
  'input.help.images':
    'Зображення з QR-кодом можна перетягнути сюди або вставити сполученням {paste}.',
  'input.help.migration': 'Вивантаження з Google Authenticator ({migration}) перетворюються самі.',
  'input.help.more': 'Усі формати введення',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': {
    one: '{n} обліковий запис',
    few: '{n} облікові записи',
    many: '{n} облікових записів',
    other: '{n} облікового запису',
  },
  'input.count.errors': {
    one: '{n} помилка',
    few: '{n} помилки',
    many: '{n} помилок',
    other: '{n} помилки',
  },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Очистити',
  'key.qrImage': 'QR із зображення',
  'key.camera': 'Камера',
  'key.cameraStop': 'Вимкнути камеру',
  'key.copy': 'Копіювати',
  'key.copyDone': 'Скопійовано',
  'key.copyFailed': 'Не вдалося',

  'viewfinder.hint': 'Тримайте QR-код у рамці',

  'filter.label': 'Фільтрувати облікові записи',
  'filter.placeholder': 'Фільтр за назвою',
  'filter.empty': 'Нічого не знайдено за запитом «{query}».',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': {
    one: '{n} цифра',
    few: '{n} цифри',
    many: '{n} цифр',
    other: '{n} цифри',
  },
  'strip.period': '{n} с',
  'strip.next': 'далі',
  'strip.seconds.abbr': 'с',
  'strip.seconds.title': 'секунди',
  'strip.seconds.valid': 'дійсний',
  'strip.accountFallback': 'Запис {n}',
  'strip.copyAria': 'Скопіювати код для {name}',
  'strip.copyAnnounce': 'Код {digits} скопійовано',
  'strip.copyFailedHint': 'Скопіювати не вдалося. Виділіть код вручну.',

  'fault.title': 'Рядок не читається',

  'vault.state.off': 'Вимкнено — нічого не зберігається',
  'vault.state.locked': 'Замкнено — потрібна парольна фраза',
  'vault.state.open': 'Відкрито — secret’и лежать у текстовому полі',
  'vault.explain':
    'За умовчанням Clockwork не зберігає нічого. Якщо увімкнути сейф, введене залишиться ' +
    'тут зашифрованим вашою парольною фразою — без неї збережений блок нічого не варте.',
  'vault.explain.crypto':
    'Ключ виводиться з парольної фрази через PBKDF2-SHA-256 з {iterations} ітераціями, а ' +
    'шифрує AES-256-GCM. Зберігається лише запечатаний конверт: ніколи відкритий текст, ' +
    'ніколи парольна фраза, ніколи виведений ключ.',
  'vault.explain.more': 'Усі подробиці',
  'vault.pass.new': 'Нова парольна фраза',
  'vault.pass.existing': 'Парольна фраза',
  'vault.action.seal': 'Зберегти зашифрованим',
  'vault.action.unseal': 'Відімкнути',
  'vault.action.deriving': 'Виводиться ключ …',
  'vault.action.lock': 'Замкнути',
  'vault.action.update': 'Зберегти наново',
  'vault.action.wipe': 'Видалити все',
  'vault.action.wipeConfirm': 'Точно видалити?',
  'vault.timeout.label': 'Замикається сам через',
  'vault.timeout.minutes': {
    one: '{n} хвилину',
    few: '{n} хвилини',
    many: '{n} хвилин',
    other: '{n} хвилини',
  },
  'vault.lockOnHide': 'і коли ви йдете зі вкладки',

  'vault.error.nothingToStore': 'Зберігати нічого — текстове поле порожнє.',
  'vault.error.storageBlocked': 'Браузер не дозволяє зберігати (приватний режим?).',
  'vault.error.noVault': 'Жодного сейфа не збережено.',
  'vault.error.noPassphrase': 'Без парольної фрази немає ключа.',
  'vault.error.sealFailed': 'Зберегти не вдалося.',
  'vault.error.unsealFailed': 'Відімкнути не вдалося.',

  'vault.msg.sealed': 'Сейф збережено в зашифрованому вигляді.',
  'vault.msg.resealed': 'Сейф зашифровано наново.',
  'vault.msg.unsealed': 'Сейф відімкнено.',
  'vault.msg.locked': 'Сейф замкнено.',
  'vault.msg.wiped': 'Сейф видалено.',
  'vault.msg.wipedNote': 'Видалено. У сховищі більше нічого не лишилося.',
  'vault.locked.idle': {
    one: 'Замкнено після {n} хвилини без введення.',
    few: 'Замкнено після {n} хвилин без введення.',
    many: 'Замкнено після {n} хвилин без введення.',
    other: 'Замкнено після {n} хвилини без введення.',
  },
  'vault.locked.hidden': 'Замкнено при виході зі вкладки.',

  'scan.noQr': 'На зображенні не вдалося розібрати жодного QR-коду.',
  'scan.unreadable': 'Зображення не вдалося прочитати — це точно зображення?',
  'scan.done': 'QR-код прочитано і вставлено.',
  'scan.camera.unavailable':
    'Це середовище не видає камеру. При відкритті як файла (file://) більшість браузерів її ' +
    'блокують — «QR із зображення» працює завжди.',
  'scan.camera.denied':
    'У камері відмовлено. Скиньте дозвіл у браузері — або візьміть «QR із зображення».',
  'scan.camera.notFound': 'Камеру не під’єднано. «QR із зображення» працює і так.',
  'scan.camera.busy': 'Камеру зараз займає інша програма.',
  'scan.camera.failed': 'Камеру не вдалося запустити. «QR із зображення» працює завжди.',

  'import.done': {
    one: 'З вивантаження Google Authenticator перенесено {n} обліковий запис',
    few: 'З вивантаження Google Authenticator перенесено {n} облікові записи',
    many: 'З вивантаження Google Authenticator перенесено {n} облікових записів',
    other: 'З вивантаження Google Authenticator перенесено {n} облікового запису',
  },
  'import.skipped': 'пропущено: {list}',
  'import.skip.hotp': '{label} (HOTP, на основі лічильника)',
  'import.skip.algorithm': '{label} (алгоритм не підтримується)',
  'import.skip.emptySecret': '{label} (порожній secret)',
  'import.unnamed': 'Без назви',
  'import.unreadable': 'Вивантаження не читається.',

  'vacant.text': 'Секрет, посилання otpauth або зображення QR — ніщо з цього не залишає браузер.',
  'vacant.demo': 'Вставити тестовий ключ',
  'colophon.note': 'Жодної мережі · жодного сховища · HMAC через Web Crypto API',

  'lang.label': 'Мова',
  'lang.aria': 'Виберіть мову',

  'err.base32.paddingInside': 'Знак «=» може стояти лише в кінці (це тільки заповнення).',
  'err.base32.empty': 'Ключ secret порожній.',
  'err.base32.badChar':
    'Неприпустимий знак «{char}» на місці {position}. Base32 знає лише A–Z та 2–7 — цифри ' +
    '0, 1 і 8 в ньому не трапляються (переплутано з O, I та B?).',
  'err.base32.badLength':
    'Неприпустима довжина: {length} знаків (без пробілів і заповнення). Base32 кодує 5 байтів ' +
    'у 8 знаків; в останньому блоці можливі лише 2, 4, 5, 7 або 8 знаків. Найімовірніше, ' +
    'одного знака бракує або один зайвий.',

  'err.uri.invalid': 'Це не придатний URI. Очікується «otpauth://totp/…».',
  'err.uri.scheme': 'Невідома схема «{scheme}». Очікується «otpauth».',
  'err.uri.hotp':
    'Це URI типу HOTP (на основі лічильника). Цей застосунок створює лише коди TOTP, ' +
    'прив’язані до часу — інакше довелося б зберігати стан лічильника.',
  'err.uri.type': 'Невідомий тип «{type}». Після «otpauth://» має стояти «totp».',
  'err.uri.typeEmpty': '(порожньо)',
  'err.uri.noSecret': 'В URI бракує параметра «secret».',
  'err.uri.badLabel': 'У мітці URI зіпсоване відсоткове кодування (наприклад, самотній знак «%»).',
  'err.uri.algorithm': 'Невідомий алгоритм «{value}». Підтримуються SHA1, SHA256 та SHA512.',
  'err.uri.digits': 'Неприпустиме значення «digits»: {value}. Дозволено від {min} до {max}.',
  'err.uri.period': 'Неприпустиме значення «period»: {value}. Очікується від 1 до 3600 секунд.',
  'err.uri.integer': 'Параметр «{name}» має бути цілим числом; знайдено «{value}».',

  'err.otp.digits': 'Неприпустима кількість цифр: {value}. Дозволено від {min} до {max}.',
  'err.otp.emptySecret': 'Secret порожній — з нього не обчислити жодного коду.',

  'err.line.unreadable': 'Цей рядок не вдалося прочитати.',

  'err.vault.openFailed':
    'Сейф не відкрився. Хибна парольна фраза — або збережені дані було змінено.',
  'err.vault.badFormat': 'Збережені дані сейфа мають невідомий формат.',
  'err.vault.version': 'Версія сейфа {version} не підтримується (очікувалася: {expected}).',
  'err.vault.base64': 'Поле «{field}» даних сейфа не є придатним Base64.',
  'err.vault.iterations': 'Неприпустима кількість ітерацій: {value}.',

  'err.migration.notExport':
    'Це не вивантаження Google Authenticator. Очікується ' +
    '«otpauth-migration://offline?data=…».',
  'err.migration.noData': 'В URI бракує параметра «data».',
  'err.migration.badPercent': 'У параметрі «data» зіпсоване відсоткове кодування.',
  'err.migration.badBase64': 'Параметр «data» не є придатним Base64.',
  'err.migration.noAccounts': 'У цьому вивантаженні немає жодного облікового запису.',

  'native.vacant.text':
    'Секрет, посилання otpauth або зображення QR — ніщо з цього не залишає пристрій.',

  'native.colophon.note': 'Жодної мережі · жодного сховища · HMAC через javax.crypto',

  'native.scan.camera.unavailable':
    'Цей пристрій не видає камеру — «QR із зображення» працює завжди.',
  'native.scan.camera.denied':
    'У камері відмовлено. Надайте дозвіл у системних налаштуваннях застосунку — або візьміть «QR із зображення».',
  'native.vault.lockOnHide': 'і коли ви виходите із застосунку',
  'native.vault.locked.hidden': 'Замкнено при виході із застосунку.',
  'native.vault.error.storageBlocked': 'Сейф не вдалося записати — чи не заповнене сховище?',
  'native.vault.biometric.label': 'Відмикати біометрією',
  'native.vault.biometric.note':
    'Це коротший шлях, а не другий ключ: парольна фраза лишається єдиною дорогою назад.',
  'native.vault.biometric.cancel': 'Узяти парольну фразу',
  'native.vault.biometric.unavailable': 'На цьому пристрої не налаштовано сильної біометрії.',
  'native.vault.biometric.invalidated':
    'Зареєстровано нову біометрію, тож коротшого шляху більше немає. Відімкніть парольною фразою і ввімкніть його знову.',
  'native.vault.biometric.failed': 'Відімкнути біометрією не вдалося — візьміть парольну фразу.',
  'native.vault.screenshots.label': 'Забороняти знімки екрана та попередній перегляд',
} satisfies Strings;
