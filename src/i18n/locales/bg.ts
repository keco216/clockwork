/**
 * Български.
 *
 * Речник: secret · сейф (vault) · акаунт · парола-фраза (passphrase) · запис ·
 *   код · циферблат. „Secret“ остава на латиница — така пише и на страниците на
 *   доставчиците.
 * Регистър: безличен и делови, както в инструментите за разработчици.
 * Кавички: „ … “, според българската типография.
 * Множествено число: CLDR дава one и other.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP удостоверител',
  'meta.description':
    'Clockwork — TOTP удостоверител. Създава двуфакторни кодове изцяло в браузъра, без нито ' +
    'една мрежова заявка.',
  'brand.tagline': 'TOTP удостоверител · RFC 6238',
  'skip.toCodes': 'Към кодовете',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Без мрежа',
  'status.vault.off': 'нищо не се запазва',
  'status.vault.locked': 'сейфът е заключен',
  'status.vault.open': 'сейфът е отворен',

  'zone.input': 'Вход',
  'zone.vault': 'Сейф',
  'zone.codes': 'Кодове',

  'input.legend': 'По един запис на ред',
  'input.placeholder':
    'напр. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} или {uri} — смесено. {hash} започва бележка.',
  'input.help.images': 'Изображения с QR код може да се влачат тук или да се поставят с {paste}.',
  'input.help.migration':
    'Износите от Google Authenticator ({migration}) се преобразуват автоматично.',
  'input.help.more': 'Всички входни формати',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} акаунт', other: '{n} акаунта' },
  'input.count.errors': { one: '{n} грешка', other: '{n} грешки' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Изчисти',
  'key.qrImage': 'QR от изображение',
  'key.camera': 'Камера',
  'key.cameraStop': 'Изключи камерата',
  'key.copy': 'Копирай',
  'key.copyDone': 'Копирано',
  'key.copyFailed': 'Неуспешно',

  'viewfinder.hint': 'Дръжте QR кода в рамката',

  'filter.label': 'Филтриране на акаунтите',
  'filter.placeholder': 'Филтриране по име',
  'filter.empty': 'Нищо не съвпада с „{query}“.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} цифра', other: '{n} цифри' },
  'strip.period': '{n} с',
  'strip.next': 'следва',
  'strip.seconds.abbr': 'с',
  'strip.seconds.title': 'секунди',
  'strip.seconds.valid': 'валиден',
  'strip.accountFallback': 'Акаунт {n}',
  'strip.copyAria': 'Копирай кода за {name}',
  'strip.copyAnnounce': 'Кодът {digits} е копиран',
  'strip.copyFailedHint': 'Копирането се провали. Маркирайте кода на ръка.',

  'fault.title': 'Редът е нечетлив',

  'vault.state.off': 'Изключен — нищо не се запазва',
  'vault.state.locked': 'Заключен — нужна е парола-фраза',
  'vault.state.open': 'Отворен — secret-ите са в текстовото поле',
  'vault.explain':
    'По подразбиране Clockwork не запазва нищо. Ако включите сейфа, въведеното остава тук ' +
    'шифрирано с вашата парола-фраза — без нея запазеният блок не струва нищо.',
  'vault.explain.crypto':
    'Ключът се извежда от парола-фразата чрез PBKDF2-SHA-256 с {iterations} итерации, а ' +
    'шифрира AES-256-GCM. Запазва се само запечатаният плик: никога открития текст, ' +
    'никога парола-фразата, никога изведения ключ.',
  'vault.explain.more': 'Всички подробности',
  'vault.pass.new': 'Нова парола-фраза',
  'vault.pass.existing': 'Парола-фраза',
  'vault.action.seal': 'Запази шифровано',
  'vault.action.unseal': 'Отключи',
  'vault.action.deriving': 'Извежда се ключ …',
  'vault.action.lock': 'Заключи',
  'vault.action.update': 'Запази отново',
  'vault.action.wipe': 'Изтрий всичко',
  'vault.action.wipeConfirm': 'Наистина ли да се изтрие?',
  'vault.timeout.label': 'Заключва се сам след',
  'vault.timeout.minutes': { one: '{n} минута', other: '{n} минути' },
  'vault.lockOnHide': 'и при напускане на раздела',

  'vault.error.nothingToStore': 'Няма какво да се запази — текстовото поле е празно.',
  'vault.error.storageBlocked': 'Браузърът не позволява запазване (частен режим?).',
  'vault.error.noVault': 'Няма запазен сейф.',
  'vault.error.noPassphrase': 'Без парола-фраза няма ключ.',
  'vault.error.sealFailed': 'Запазването се провали.',
  'vault.error.unsealFailed': 'Отключването се провали.',

  'vault.msg.sealed': 'Сейфът е запазен шифровано.',
  'vault.msg.resealed': 'Сейфът е шифрован наново.',
  'vault.msg.unsealed': 'Сейфът е отключен.',
  'vault.msg.locked': 'Сейфът е заключен.',
  'vault.msg.wiped': 'Сейфът е изтрит.',
  'vault.msg.wipedNote': 'Изтрито. В хранилището не остана нищо.',
  'vault.locked.idle': {
    one: 'Заключен след {n} минута без въвеждане.',
    other: 'Заключен след {n} минути без въвеждане.',
  },
  'vault.locked.hidden': 'Заключен при напускане на раздела.',

  'scan.noQr': 'В изображението не се разпозна никакъв QR код.',
  'scan.unreadable': 'Изображението не можа да бъде прочетено — наистина ли е изображение?',
  'scan.done': 'QR кодът е прочетен и вмъкнат.',
  'scan.camera.unavailable':
    'Тази среда не предоставя камера. При отваряне като файл (file://) повечето браузъри я ' +
    'блокират — „QR от изображение“ работи винаги.',
  'scan.camera.denied':
    'Камерата беше отказана. Нулирайте разрешението в браузъра — или използвайте ' +
    '„QR от изображение“.',
  'scan.camera.notFound': 'Няма свързана камера. „QR от изображение“ работи въпреки това.',
  'scan.camera.busy': 'Камерата се използва в момента от друга програма.',
  'scan.camera.failed': 'Камерата не можа да бъде стартирана. „QR от изображение“ работи винаги.',

  'import.done': {
    one: 'Приет {n} акаунт от износа на Google Authenticator',
    other: 'Приети {n} акаунта от износа на Google Authenticator',
  },
  'import.skipped': 'пропуснати: {list}',
  'import.skip.hotp': '{label} (HOTP, на основата на брояч)',
  'import.skip.algorithm': '{label} (неподдържан алгоритъм)',
  'import.skip.emptySecret': '{label} (празен secret)',
  'import.unnamed': 'Без име',
  'import.unreadable': 'Износът е нечетлив.',

  'vacant.text':
    'Секрет, връзка otpauth или QR изображение — нищо от това не напуска този браузър.',
  'vacant.demo': 'Вмъкване на тестов ключ',
  'colophon.note': 'Без мрежа · без хранилище · HMAC през Web Crypto API',

  'lang.label': 'Език',
  'lang.aria': 'Изберете език',

  'err.base32.paddingInside': 'Знакът „=“ може да стои само накрая (той е само запълване).',
  'err.base32.empty': 'Ключът secret е празен.',
  'err.base32.badChar':
    'Невалиден знак „{char}“ на позиция {position}. Base32 познава само A–Z и 2–7 — цифрите ' +
    '0, 1 и 8 не се срещат в него (объркани с O, I и B?).',
  'err.base32.badLength':
    'Невалидна дължина: {length} знака (без интервали и запълване). Base32 кодира 5 байта в ' +
    '8 знака; в последния блок са възможни само 2, 4, 5, 7 или 8 знака. Вероятно липсва знак ' +
    'или има един в повече.',

  'err.uri.invalid': 'Това не е валиден URI. Очаква се „otpauth://totp/…“.',
  'err.uri.scheme': 'Непозната схема „{scheme}“. Очаква се „otpauth“.',
  'err.uri.hotp':
    'Това е HOTP URI (на основата на брояч). Това приложение създава само кодове TOTP, ' +
    'основани на времето — иначе би трябвало да се запазва състоянието на брояча.',
  'err.uri.type': 'Непознат вид „{type}“. След „otpauth://“ трябва да стои „totp“.',
  'err.uri.typeEmpty': '(празно)',
  'err.uri.noSecret': 'В URI липсва параметърът „secret“.',
  'err.uri.badLabel':
    'Етикетът на URI съдържа развалено процентно кодиране (например самотен „%“).',
  'err.uri.algorithm': 'Непознат алгоритъм „{value}“. Поддържат се SHA1, SHA256 и SHA512.',
  'err.uri.digits': 'Невалидна стойност за „digits“: {value}. Позволени са от {min} до {max}.',
  'err.uri.period': 'Невалидна стойност за „period“: {value}. Очакват се от 1 до 3600 секунди.',
  'err.uri.integer': 'Параметърът „{name}“ трябва да е цяло число; намерено беше „{value}“.',

  'err.otp.digits': 'Невалиден брой цифри: {value}. Позволени са от {min} до {max}.',
  'err.otp.emptySecret': 'Secret е празен — от него не може да се изчисли никакъв код.',

  'err.line.unreadable': 'Този ред не можа да бъде прочетен.',

  'err.vault.openFailed':
    'Сейфът не можа да се отвори. Грешна парола-фраза — или запазените данни са били ' +
    'променени.',
  'err.vault.badFormat': 'Запазените данни на сейфа са в непознат формат.',
  'err.vault.version': 'Версия на сейфа {version} не се поддържа (очаквана: {expected}).',
  'err.vault.base64': 'Полето „{field}“ от данните на сейфа не е валиден Base64.',
  'err.vault.iterations': 'Невалиден брой итерации: {value}.',

  'err.migration.notExport':
    'Това не е износ от Google Authenticator. Очаква се ' + '„otpauth-migration://offline?data=…“.',
  'err.migration.noData': 'В URI липсва параметърът „data“.',
  'err.migration.badPercent': 'Параметърът „data“ съдържа развалено процентно кодиране.',
  'err.migration.badBase64': 'Параметърът „data“ не е валиден Base64.',
  'err.migration.noAccounts': 'В този износ няма никакви акаунти.',
} satisfies Strings;
