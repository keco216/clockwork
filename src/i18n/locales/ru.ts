/**
 * Русский.
 *
 * Словарь: secret · сейф (vault) · учётная запись · парольная фраза
 *   (passphrase) · запись · код · циферблат. «Secret» остаётся латиницей — так
 *   он называется и на страницах самих поставщиков.
 * Регистр: безличный и деловой, как в инструментах для разработчиков.
 * Кавычки: « … », по русской типографике. Буква «ё» пишется там, где нужна.
 * Множественное число: CLDR даёт one (1, 21 …), few (2–4, 22–24 …),
 *   many (0, 5–20 …) и other (дробные).
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — аутентификатор TOTP',
  'meta.description':
    'Clockwork — аутентификатор TOTP. Создаёт коды двухфакторной проверки целиком в браузере, ' +
    'без единого сетевого запроса.',
  'brand.tagline': 'Аутентификатор TOTP · RFC 6238',
  'skip.toCodes': 'Перейти к кодам',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Без сети',
  'status.vault.off': 'ничего не сохраняется',
  'status.vault.locked': 'сейф заперт',
  'status.vault.open': 'сейф открыт',

  'zone.input': 'Ввод',
  'zone.vault': 'Сейф',
  'zone.codes': 'Коды',

  'input.legend': 'По одной записи в строке',
  'input.placeholder':
    'напр. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} или {uri} — вперемешку. {hash} начинает заметку.',
  'input.help.images':
    'Изображения с QR-кодом можно перетащить сюда или вставить сочетанием {paste}.',
  'input.help.migration':
    'Выгрузки из Google Authenticator ({migration}) преобразуются сами собой.',
  'input.help.more': 'Все форматы ввода',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': {
    one: '{n} учётная запись',
    few: '{n} учётные записи',
    many: '{n} учётных записей',
    other: '{n} учётной записи',
  },
  'input.count.errors': {
    one: '{n} ошибка',
    few: '{n} ошибки',
    many: '{n} ошибок',
    other: '{n} ошибки',
  },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Очистить',
  'key.qrImage': 'QR из изображения',
  'key.camera': 'Камера',
  'key.cameraStop': 'Выключить камеру',
  'key.copy': 'Копировать',
  'key.copyDone': 'Скопировано',
  'key.copyFailed': 'Не удалось',

  'viewfinder.hint': 'Держите QR-код в рамке',

  'filter.label': 'Фильтр учётных записей',
  'filter.placeholder': 'Фильтр по имени',
  'filter.empty': 'Ничего не найдено по запросу «{query}».',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': {
    one: '{n} цифра',
    few: '{n} цифры',
    many: '{n} цифр',
    other: '{n} цифры',
  },
  'strip.period': '{n} с',
  'strip.next': 'далее',
  'strip.seconds.abbr': 'с',
  'strip.seconds.title': 'секунды',
  'strip.seconds.valid': 'действует',
  'strip.accountFallback': 'Запись {n}',
  'strip.copyAria': 'Скопировать код для {name}',
  'strip.copyAnnounce': 'Код {digits} скопирован',
  'strip.copyFailedHint': 'Скопировать не удалось. Выделите код вручную.',

  'fault.title': 'Строка не читается',

  'vault.state.off': 'Выключен — ничего не сохраняется',
  'vault.state.locked': 'Заперт — нужна парольная фраза',
  'vault.state.open': 'Открыт — secret’ы лежат в текстовом поле',
  'vault.explain':
    'По умолчанию Clockwork не сохраняет ничего. Если включить сейф, введённое останется ' +
    'здесь зашифрованным вашей парольной фразой — без неё сохранённый блок ничего не ' +
    'стоит.',
  'vault.explain.crypto':
    'Ключ выводится из парольной фразы через PBKDF2-SHA-256 с {iterations} итерациями, а ' +
    'шифрует AES-256-GCM. Сохраняется только запечатанный конверт: никогда открытый ' +
    'текст, никогда парольная фраза, никогда выведенный ключ.',
  'vault.explain.more': 'Все подробности',
  'vault.pass.new': 'Новая парольная фраза',
  'vault.pass.existing': 'Парольная фраза',
  'vault.action.seal': 'Сохранить зашифрованным',
  'vault.action.unseal': 'Отпереть',
  'vault.action.deriving': 'Выводится ключ …',
  'vault.action.lock': 'Запереть',
  'vault.action.update': 'Сохранить заново',
  'vault.action.wipe': 'Удалить всё',
  'vault.action.wipeConfirm': 'Точно удалить?',
  'vault.timeout.label': 'Запирается сам через',
  'vault.timeout.minutes': {
    one: '{n} минуту',
    few: '{n} минуты',
    many: '{n} минут',
    other: '{n} минуты',
  },
  'vault.lockOnHide': 'и при уходе со вкладки',

  'vault.error.nothingToStore': 'Сохранять нечего — текстовое поле пусто.',
  'vault.error.storageBlocked': 'Браузер не разрешает сохранение (приватный режим?).',
  'vault.error.noVault': 'Ни один сейф не сохранён.',
  'vault.error.noPassphrase': 'Без парольной фразы нет ключа.',
  'vault.error.sealFailed': 'Сохранить не удалось.',
  'vault.error.unsealFailed': 'Отпереть не удалось.',

  'vault.msg.sealed': 'Сейф сохранён в зашифрованном виде.',
  'vault.msg.resealed': 'Сейф зашифрован заново.',
  'vault.msg.unsealed': 'Сейф отперт.',
  'vault.msg.locked': 'Сейф заперт.',
  'vault.msg.wiped': 'Сейф удалён.',
  'vault.msg.wipedNote': 'Удалено. В хранилище больше ничего не осталось.',
  'vault.locked.idle': {
    one: 'Заперт после {n} минуты без ввода.',
    few: 'Заперт после {n} минут без ввода.',
    many: 'Заперт после {n} минут без ввода.',
    other: 'Заперт после {n} минуты без ввода.',
  },
  'vault.locked.hidden': 'Заперт при уходе со вкладки.',

  'scan.noQr': 'На изображении не удалось разобрать ни одного QR-кода.',
  'scan.unreadable': 'Изображение не удалось прочитать — это точно изображение?',
  'scan.done': 'QR-код прочитан и вставлен.',
  'scan.camera.unavailable':
    'Эта среда не выдаёт камеру. При открытии как файла (file://) большинство браузеров её ' +
    'блокируют — «QR из изображения» работает всегда.',
  'scan.camera.denied':
    'В камере отказано. Сбросьте разрешение в браузере — или возьмите ' + '«QR из изображения».',
  'scan.camera.notFound': 'Камера не подключена. «QR из изображения» работает и так.',
  'scan.camera.busy': 'Камеру сейчас занимает другая программа.',
  'scan.camera.failed': 'Камеру не удалось запустить. «QR из изображения» работает всегда.',

  'import.done': {
    one: 'Из выгрузки Google Authenticator перенесена {n} учётная запись',
    few: 'Из выгрузки Google Authenticator перенесены {n} учётные записи',
    many: 'Из выгрузки Google Authenticator перенесено {n} учётных записей',
    other: 'Из выгрузки Google Authenticator перенесено {n} учётной записи',
  },
  'import.skipped': 'пропущено: {list}',
  'import.skip.hotp': '{label} (HOTP, на основе счётчика)',
  'import.skip.algorithm': '{label} (алгоритм не поддерживается)',
  'import.skip.emptySecret': '{label} (пустой secret)',
  'import.unnamed': 'Без имени',
  'import.unreadable': 'Выгрузка не читается.',

  'vacant.text': 'Секрет, ссылка otpauth или изображение QR — ничто из этого не покидает браузер.',
  'vacant.demo': 'Вставить тестовый ключ',
  'colophon.note': 'Никакой сети · никакого хранилища · HMAC через Web Crypto API',

  'lang.label': 'Язык',
  'lang.aria': 'Выберите язык',

  'err.base32.paddingInside': 'Знак «=» может стоять только в конце (это всего лишь заполнение).',
  'err.base32.empty': 'Ключ secret пуст.',
  'err.base32.badChar':
    'Недопустимый знак «{char}» на месте {position}. Base32 знает только A–Z и 2–7 — цифры ' +
    '0, 1 и 8 в нём не встречаются (перепутаны с O, I и B?).',
  'err.base32.badLength':
    'Недопустимая длина: {length} знаков (без пробелов и заполнения). Base32 кодирует 5 байт ' +
    'в 8 знаков; в последнем блоке возможны только 2, 4, 5, 7 или 8 знаков. Скорее всего, ' +
    'одного знака не хватает или один лишний.',

  'err.uri.invalid': 'Это не годный URI. Ожидается «otpauth://totp/…».',
  'err.uri.scheme': 'Неизвестная схема «{scheme}». Ожидается «otpauth».',
  'err.uri.hotp':
    'Это URI типа HOTP (на основе счётчика). Это приложение создаёт только коды TOTP, ' +
    'привязанные ко времени — иначе пришлось бы хранить состояние счётчика.',
  'err.uri.type': 'Неизвестный тип «{type}». После «otpauth://» должно стоять «totp».',
  'err.uri.typeEmpty': '(пусто)',
  'err.uri.noSecret': 'В URI не хватает параметра «secret».',
  'err.uri.badLabel': 'В метке URI испорчено процентное кодирование (например, одинокий знак «%»).',
  'err.uri.algorithm': 'Неизвестный алгоритм «{value}». Поддерживаются SHA1, SHA256 и SHA512.',
  'err.uri.digits': 'Недопустимое значение «digits»: {value}. Разрешено от {min} до {max}.',
  'err.uri.period': 'Недопустимое значение «period»: {value}. Ожидается от 1 до 3600 секунд.',
  'err.uri.integer': 'Параметр «{name}» должен быть целым числом; найдено «{value}».',

  'err.otp.digits': 'Недопустимое число цифр: {value}. Разрешено от {min} до {max}.',
  'err.otp.emptySecret': 'Secret пуст — из него нельзя вычислить ни одного кода.',

  'err.line.unreadable': 'Эту строку не удалось прочитать.',

  'err.vault.openFailed':
    'Сейф не открылся. Неверная парольная фраза — или сохранённые данные были изменены.',
  'err.vault.badFormat': 'Сохранённые данные сейфа имеют неизвестный формат.',
  'err.vault.version': 'Версия сейфа {version} не поддерживается (ожидалась: {expected}).',
  'err.vault.base64': 'Поле «{field}» данных сейфа не является годным Base64.',
  'err.vault.iterations': 'Недопустимое число итераций: {value}.',

  'err.migration.notExport':
    'Это не выгрузка Google Authenticator. Ожидается ' + '«otpauth-migration://offline?data=…».',
  'err.migration.noData': 'В URI не хватает параметра «data».',
  'err.migration.badPercent': 'В параметре «data» испорчено процентное кодирование.',
  'err.migration.badBase64': 'Параметр «data» не является годным Base64.',
  'err.migration.noAccounts': 'В этой выгрузке нет ни одной учётной записи.',
} satisfies Strings;
