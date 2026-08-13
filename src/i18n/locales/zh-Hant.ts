/**
 * 繁體中文。
 *
 * 術語：secret（金鑰串）· 保險箱（vault）· 帳戶 · 密碼短語（passphrase）·
 *   項目 · 驗證碼 · 錶盤。標準與協定名保留拉丁字母（Base32、SHA-1、otpauth）——
 *   各處皆如此書寫。
 * 語氣：中性、簡練，如同開發者工具。
 * 引號：「 … 」，依繁體中文的排印慣例。
 * 數字：一律使用拉丁數字，驗證碼要貼到別處的登入欄位裡。
 * 複數：漢語不隨數量變形，CLDR 只有一種形式（other）。
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP 驗證器',
  'meta.description':
    'Clockwork — TOTP 驗證器。完全在瀏覽器內產生兩步驟驗證碼，不發出任何網路請求。',
  'brand.tagline': 'TOTP 驗證器 · RFC 6238',
  'skip.toCodes': '跳到驗證碼',

  'status.line': '{connection} · {vault}',
  'status.offline': '離線',
  'status.vault.off': '什麼都不儲存',
  'status.vault.locked': '保險箱已鎖',
  'status.vault.open': '保險箱已開',

  'zone.input': '輸入',
  'zone.vault': '保險箱',
  'zone.codes': '驗證碼',

  'input.legend': '每行一個項目',
  'input.placeholder':
    '例如：JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32、{nameSecret} 或 {uri} —— 可以混排。{hash} 開始一則註記。',
  'input.help.images': 'QR 碼圖片也可以拖到這裡，或者用 {paste} 貼上。',
  'input.help.migration': 'Google 驗證器的匯出（{migration}）會自動轉換。',
  'input.help.more': '全部輸入格式',
  'shortcut.modifier': 'Ctrl',

  // 數字與量詞之間不留空（「3個帳戶」）——這是中文的寫法，
  // 也順帶避免等寬字體在這裡留下過大的空隙。
  'input.count.accounts': { other: '{n}個帳戶' },
  'input.count.errors': { other: '{n}處錯誤' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': '清空',
  'key.qrImage': '從圖片讀 QR 碼',
  'key.camera': '相機',
  'key.cameraStop': '關閉相機',
  'key.copy': '複製',
  'key.copyDone': '已複製',
  'key.copyFailed': '失敗',

  'viewfinder.hint': '把 QR 碼放進取景框',

  'filter.label': '篩選帳戶',
  'filter.placeholder': '依名稱篩選',
  'filter.empty': '沒有與「{query}」相符的項目。',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { other: '{n} 位' },
  'strip.period': '{n} 秒',
  'strip.next': '下一個',
  'strip.seconds.abbr': '秒',
  'strip.seconds.title': '秒',
  'strip.seconds.valid': '有效',
  'strip.accountFallback': '帳戶 {n}',
  'strip.copyAria': '複製 {name} 的驗證碼',
  'strip.copyAnnounce': '已複製驗證碼 {digits}',
  'strip.copyFailedHint': '複製失敗。請手動選取驗證碼。',

  'fault.title': '此行無法讀取',

  'vault.state.off': '關閉 —— 什麼都不儲存',
  'vault.state.locked': '已鎖 —— 需要密碼短語',
  'vault.state.open': '已開 —— secret 在文字方塊裡',
  'vault.explain':
    'Clockwork 預設什麼都不儲存。打開保險箱後，輸入的內容會用你的密碼短語加密後留在這裡；沒有密碼短語，儲存下來的那一塊毫無價值。',
  'vault.explain.crypto':
    '金鑰由密碼短語經 PBKDF2-SHA-256 迭代 {iterations} 次導出，加密由 AES-256-GCM ' +
    '完成。儲存的只有封好的信封：明文、密碼短語和導出的金鑰都不會存下來。',
  'vault.explain.more': '全部細節',
  'vault.pass.new': '新的密碼短語',
  'vault.pass.existing': '密碼短語',
  'vault.action.seal': '加密儲存',
  'vault.action.unseal': '開啟',
  'vault.action.deriving': '正在推導金鑰 …',
  'vault.action.lock': '上鎖',
  'vault.action.update': '重新儲存',
  'vault.action.wipe': '全部刪除',
  'vault.action.wipeConfirm': '真的刪除？',
  'vault.timeout.label': '無人操作多久後自動上鎖',
  'vault.timeout.minutes': { other: '{n} 分鐘' },
  'vault.lockOnHide': '離開分頁時也上鎖',

  'vault.error.nothingToStore': '沒有可儲存的內容 —— 文字方塊是空的。',
  'vault.error.storageBlocked': '瀏覽器不允許儲存（無痕模式？）。',
  'vault.error.noVault': '沒有儲存過任何保險箱。',
  'vault.error.noPassphrase': '沒有密碼短語就沒有金鑰。',
  'vault.error.sealFailed': '儲存失敗。',
  'vault.error.unsealFailed': '開啟失敗。',

  'vault.msg.sealed': '保險箱已加密儲存。',
  'vault.msg.resealed': '保險箱已重新加密。',
  'vault.msg.unsealed': '保險箱已開啟。',
  'vault.msg.locked': '保險箱已上鎖。',
  'vault.msg.wiped': '保險箱已刪除。',
  'vault.msg.wipedNote': '已刪除。儲存空間裡什麼都不剩了。',
  'vault.locked.idle': { other: '{n} 分鐘無輸入，已上鎖。' },
  'vault.locked.hidden': '離開分頁時已上鎖。',

  'scan.noQr': '圖片裡認不出 QR 碼。',
  'scan.unreadable': '圖片讀不出來 —— 這真的是一張圖片嗎？',
  'scan.done': 'QR 碼已讀取並填入。',
  'scan.camera.unavailable':
    '這個環境不提供相機。以檔案方式開啟時（file://），多數瀏覽器會封鎖它 ——' +
    '「從圖片讀 QR 碼」始終可用。',
  'scan.camera.denied': '相機遭到拒絕。請在瀏覽器裡重設權限，或改用「從圖片讀 QR 碼」。',
  'scan.camera.notFound': '沒有接上相機。「從圖片讀 QR 碼」照樣可用。',
  'scan.camera.busy': '相機正被另一個程式占用。',
  'scan.camera.failed': '相機啟動不了。「從圖片讀 QR 碼」始終可用。',

  'import.done': { other: '已從 Google 驗證器的匯出中取入 {n} 個帳戶' },
  'import.skipped': '已略過：{list}',
  'import.skip.hotp': '{label}（HOTP，以計數器為準）',
  'import.skip.algorithm': '{label}（不支援的演算法）',
  'import.skip.emptySecret': '{label}（secret 為空）',
  'import.unnamed': '未命名',
  'import.unreadable': '匯出無法讀取。',

  'vacant.text': '密鑰、otpauth 連結或 QR 圖片——都不會離開這個瀏覽器。',
  'vacant.demo': '插入測試金鑰',
  'colophon.note': '無網路 · 無儲存 · HMAC 經由 Web Crypto API',

  'lang.label': '語言',
  'lang.aria': '選擇語言',

  'err.base32.paddingInside': '字元「=」只能放在末尾（它不過是填充）。',
  'err.base32.empty': 'secret 金鑰是空的。',
  'err.base32.badChar':
    '第 {position} 位上是無效字元「{char}」。Base32 只認得 A–Z 和 2–7 —— 數字 0、1、8 不會' +
    '出現（是不是和 O、I、B 弄混了？）。',
  'err.base32.badLength':
    '長度無效：{length} 個字元（不含空格與填充）。Base32 把 5 個位元組編成 8 個字元；最後' +
    '一塊只可能是 2、4、5、7 或 8 個字元。多半是少了一個字元，或者多了一個。',

  'err.uri.invalid': '這不是有效的 URI。應當是「otpauth://totp/…」。',
  'err.uri.scheme': '未知的配置「{scheme}」。應當是「otpauth」。',
  'err.uri.hotp':
    '這是 HOTP 的 URI（以計數器為準）。本應用只產生以時間為準的 TOTP 驗證碼 —— 另一種需要' +
    '把計數器的值儲存下來。',
  'err.uri.type': '未知的類型「{type}」。「otpauth://」之後必須是「totp」。',
  'err.uri.typeEmpty': '（空）',
  'err.uri.noSecret': 'URI 裡缺少參數「secret」。',
  'err.uri.badLabel': 'URI 的標籤裡有壞掉的百分號編碼（例如單獨一個「%」）。',
  'err.uri.algorithm': '未知的演算法「{value}」。支援 SHA1、SHA256 和 SHA512。',
  'err.uri.digits': '「digits」的取值無效：{value}。允許 {min} 到 {max}。',
  'err.uri.period': '「period」的取值無效：{value}。應當是 1 到 3600 秒。',
  'err.uri.integer': '參數「{name}」必須是整數；找到的是「{value}」。',

  'err.otp.digits': '位數無效：{value}。允許 {min} 到 {max}。',
  'err.otp.emptySecret': 'secret 是空的 —— 由它算不出任何驗證碼。',

  'err.line.unreadable': '這一行讀不出來。',

  'err.vault.openFailed': '保險箱打不開。密碼短語不對 —— 或者儲存的資料被改動過。',
  'err.vault.badFormat': '儲存的保險箱資料格式不明。',
  'err.vault.version': '不支援保險箱版本 {version}（預期：{expected}）。',
  'err.vault.base64': '保險箱資料的「{field}」欄位不是有效的 Base64。',
  'err.vault.iterations': '迭代次數無效：{value}。',

  'err.migration.notExport':
    '這不是 Google 驗證器的匯出。應當是「otpauth-migration://offline?data=…」。',
  'err.migration.noData': 'URI 裡缺少參數「data」。',
  'err.migration.badPercent': '參數「data」裡有壞掉的百分號編碼。',
  'err.migration.badBase64': '參數「data」不是有效的 Base64。',
  'err.migration.noAccounts': '這份匯出裡沒有任何帳戶。',

  'native.vacant.text': '密鑰、otpauth 連結或 QR 圖片——都不會離開這個裝置。',
} satisfies Strings;
