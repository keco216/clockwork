/**
 * 简体中文。
 *
 * 术语：secret（密钥串）· 保险箱（vault）· 账户 · 密码短语（passphrase）·
 *   条目 · 验证码 · 表盘。标准与协议名保留拉丁字母（Base32、SHA-1、otpauth）——
 *   各处皆如此书写。
 * 语气：中性、简练，如同开发者工具。
 * 引号：“ … ”。
 * 数字：一律使用拉丁数字，验证码要粘贴到别处的登录框里。
 * 复数：汉语不随数量变形，CLDR 只有一种形式（other）。
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP 验证器',
  'meta.description': 'Clockwork — TOTP 验证器。完全在浏览器内生成两步验证码，不发出任何网络请求。',
  'brand.tagline': 'TOTP 验证器 · RFC 6238',
  'skip.toCodes': '跳到验证码',

  'status.line': '{connection} · {vault}',
  'status.offline': '离线',
  'status.vault.off': '什么都不保存',
  'status.vault.locked': '保险箱已锁',
  'status.vault.open': '保险箱已开',

  'zone.input': '输入',
  'zone.vault': '保险箱',
  'zone.codes': '验证码',

  'input.legend': '每行一个条目',
  'input.placeholder':
    '例如：JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32、{nameSecret} 或 {uri} —— 可以混排。{hash} 开始一条备注。',
  'input.help.images': '二维码图片也可以拖到这里，或者用 {paste} 粘贴。',
  'input.help.migration': 'Google 身份验证器的导出（{migration}）会自动转换。',
  'input.help.more': '全部输入格式',
  'shortcut.modifier': 'Ctrl',

  // 数字与量词之间不留空（“3个账户”）——这是中文的写法，
  // 也顺带避免等宽字体在这里留下过大的空隙。
  'input.count.accounts': { other: '{n}个账户' },
  'input.count.errors': { other: '{n}处错误' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': '清空',
  'key.qrImage': '从图片读二维码',
  'key.camera': '摄像头',
  'key.cameraStop': '关闭摄像头',
  'key.copy': '复制',
  'key.copyDone': '已复制',
  'key.copyFailed': '失败',

  'viewfinder.hint': '把二维码放进取景框',

  'filter.label': '筛选账户',
  'filter.placeholder': '按名称筛选',
  'filter.empty': '没有与“{query}”匹配的项。',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { other: '{n} 位' },
  'strip.period': '{n} 秒',
  'strip.next': '下一个',
  'strip.seconds.abbr': '秒',
  'strip.seconds.title': '秒',
  'strip.seconds.valid': '有效',
  'strip.accountFallback': '账户 {n}',
  'strip.copyAria': '复制 {name} 的验证码',
  'strip.copyAnnounce': '已复制验证码 {digits}',
  'strip.copyFailedHint': '复制失败。请手动选中验证码。',

  'fault.title': '此行无法读取',

  'vault.state.off': '关闭 —— 什么都不保存',
  'vault.state.locked': '已锁 —— 需要密码短语',
  'vault.state.open': '已开 —— secret 在文本框里',
  'vault.explain':
    'Clockwork 默认什么都不保存。打开保险箱后，输入的内容会用你的密码短语加密后留在这里；没有密码短语，保存下来的那一块毫无价值。',
  'vault.explain.crypto':
    '密钥由密码短语经 PBKDF2-SHA-256 迭代 {iterations} 次导出，加密由 AES-256-GCM ' +
    '完成。保存的只有封好的信封：明文、密码短语和导出的密钥都不会存下来。',
  'vault.explain.more': '全部细节',
  'vault.pass.new': '新的密码短语',
  'vault.pass.existing': '密码短语',
  'vault.action.seal': '加密保存',
  'vault.action.unseal': '打开',
  'vault.action.deriving': '正在派生密钥 …',
  'vault.action.lock': '上锁',
  'vault.action.update': '重新保存',
  'vault.action.wipe': '全部删除',
  'vault.action.wipeConfirm': '真的删除？',
  'vault.timeout.label': '无人操作多久后自动上锁',
  'vault.timeout.minutes': { other: '{n} 分钟' },
  'vault.lockOnHide': '离开标签页时也上锁',

  'vault.error.nothingToStore': '没有可保存的内容 —— 文本框是空的。',
  'vault.error.storageBlocked': '浏览器不允许保存（无痕模式？）。',
  'vault.error.noVault': '没有保存过任何保险箱。',
  'vault.error.noPassphrase': '没有密码短语就没有密钥。',
  'vault.error.sealFailed': '保存失败。',
  'vault.error.unsealFailed': '打开失败。',

  'vault.msg.sealed': '保险箱已加密保存。',
  'vault.msg.resealed': '保险箱已重新加密。',
  'vault.msg.unsealed': '保险箱已打开。',
  'vault.msg.locked': '保险箱已上锁。',
  'vault.msg.wiped': '保险箱已删除。',
  'vault.msg.wipedNote': '已删除。存储里什么都不剩了。',
  'vault.locked.idle': { other: '{n} 分钟无输入，已上锁。' },
  'vault.locked.hidden': '离开标签页时已上锁。',

  'scan.noQr': '图片里认不出二维码。',
  'scan.unreadable': '图片读不出来 —— 这真是一张图片吗？',
  'scan.done': '二维码已读取并填入。',
  'scan.camera.unavailable':
    '这个环境不提供摄像头。以文件方式打开时（file://），多数浏览器会封锁它 ——' +
    '“从图片读二维码”始终可用。',
  'scan.camera.denied': '摄像头被拒绝。请在浏览器里重置权限，或改用“从图片读二维码”。',
  'scan.camera.notFound': '没有接上摄像头。“从图片读二维码”照样可用。',
  'scan.camera.busy': '摄像头正被另一个程序占用。',
  'scan.camera.failed': '摄像头启动不了。“从图片读二维码”始终可用。',

  'import.done': { other: '已从 Google 身份验证器的导出中取入 {n} 个账户' },
  'import.skipped': '已跳过：{list}',
  'import.skip.hotp': '{label}（HOTP，基于计数器）',
  'import.skip.algorithm': '{label}（不支持的算法）',
  'import.skip.emptySecret': '{label}（secret 为空）',
  'import.unnamed': '未命名',
  'import.unreadable': '导出无法读取。',

  'vacant.text': '密钥、otpauth 链接或二维码图片——都不会离开这个浏览器。',
  'vacant.demo': '插入测试密钥',
  'colophon.note': '无网络 · 无存储 · HMAC 经由 Web Crypto API',

  'lang.label': '语言',
  'lang.aria': '选择语言',

  'err.base32.paddingInside': '字符“=”只能放在末尾（它不过是填充）。',
  'err.base32.empty': 'secret 密钥是空的。',
  'err.base32.badChar':
    '第 {position} 位上是无效字符“{char}”。Base32 只认得 A–Z 和 2–7 —— 数字 0、1、8 不会' +
    '出现（是不是和 O、I、B 弄混了？）。',
  'err.base32.badLength':
    '长度无效：{length} 个字符（不含空格与填充）。Base32 把 5 个字节编成 8 个字符；最后' +
    '一块只可能是 2、4、5、7 或 8 个字符。多半是少了一个字符，或者多了一个。',

  'err.uri.invalid': '这不是有效的 URI。应当是“otpauth://totp/…”。',
  'err.uri.scheme': '未知的方案“{scheme}”。应当是“otpauth”。',
  'err.uri.hotp':
    '这是 HOTP 的 URI（基于计数器）。本应用只生成基于时间的 TOTP 验证码 —— 另一种需要把' +
    '计数器的值保存下来。',
  'err.uri.type': '未知的类型“{type}”。“otpauth://”之后必须是“totp”。',
  'err.uri.typeEmpty': '（空）',
  'err.uri.noSecret': 'URI 里缺少参数“secret”。',
  'err.uri.badLabel': 'URI 的标签里有坏掉的百分号编码（例如单独一个“%”）。',
  'err.uri.algorithm': '未知的算法“{value}”。支持 SHA1、SHA256 和 SHA512。',
  'err.uri.digits': '“digits”的取值无效：{value}。允许 {min} 到 {max}。',
  'err.uri.period': '“period”的取值无效：{value}。应当是 1 到 3600 秒。',
  'err.uri.integer': '参数“{name}”必须是整数；找到的是“{value}”。',

  'err.otp.digits': '位数无效：{value}。允许 {min} 到 {max}。',
  'err.otp.emptySecret': 'secret 是空的 —— 由它算不出任何验证码。',

  'err.line.unreadable': '这一行读不出来。',

  'err.vault.openFailed': '保险箱打不开。密码短语不对 —— 或者保存的数据被改动过。',
  'err.vault.badFormat': '保存的保险箱数据格式不明。',
  'err.vault.version': '不支持保险箱版本 {version}（期望：{expected}）。',
  'err.vault.base64': '保险箱数据的“{field}”字段不是有效的 Base64。',
  'err.vault.iterations': '迭代次数无效：{value}。',

  'err.migration.notExport':
    '这不是 Google 身份验证器的导出。应当是“otpauth-migration://offline?data=…”。',
  'err.migration.noData': 'URI 里缺少参数“data”。',
  'err.migration.badPercent': '参数“data”里有坏掉的百分号编码。',
  'err.migration.badBase64': '参数“data”不是有效的 Base64。',
  'err.migration.noAccounts': '这份导出里没有任何账户。',

  'native.vacant.text': '密钥、otpauth 链接或二维码图片——都不会离开这个设备。',

  'native.colophon.note': '无网络 · 无存储 · HMAC 经由 javax.crypto',

  'native.scan.camera.unavailable': '这个设备不提供摄像头 ——“从图片读二维码”始终可用。',
  'native.scan.camera.denied':
    '摄像头被拒绝。请在系统的应用设置里授予权限，或改用“从图片读二维码”。',
  'native.vault.lockOnHide': '离开应用时也上锁',
  'native.vault.locked.hidden': '离开应用时已上锁。',
  'native.vault.error.storageBlocked': '保险箱写不进去 — 存储空间满了吗？',
  'native.vault.biometric.label': '用生物识别解锁',
  'native.vault.biometric.note': '这是捷径，不是第二把钥匙：回来的路只有密码短语。',
  'native.vault.biometric.cancel': '改用密码短语',
  'native.vault.biometric.unavailable': '这台设备没有设置强生物识别。',
  'native.vault.biometric.invalidated':
    '注册了新的生物识别，捷径没了。请用密码短语解锁，再重新打开它。',
  'native.vault.biometric.failed': '生物识别解锁没成功 — 请用密码短语。',
  'native.vault.screenshots.label': '阻止截图和预览',
} satisfies Strings;
