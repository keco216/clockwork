/**
 * 日本語。
 *
 * 用語: シークレット (secret) · 金庫 (vault) · アカウント · パスフレーズ
 *   (passphrase) · 項目 · コード · 文字盤。規格名やプロトコル名はラテン文字の
 *   まま (Base32、SHA-1、otpauth) — どこでもそう書かれている。
 * 文体: です・ます調は使わず、簡潔な常体。開発者向けの道具にふさわしい調子。
 * 括弧: 「 … 」。
 * 数字: どこでも半角のラテン数字。コードは外部のログイン欄へ貼り付けるもの。
 * 複数形: 日本語は数によって形が変わらないため、CLDR の分類は other のみ。
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP 認証アプリ',
  'meta.description':
    'Clockwork — TOTP 認証アプリ。二段階認証のコードをすべてブラウザー内で生成する。' +
    'ネットワーク要求は一切行わない。',
  'brand.tagline': 'TOTP 認証アプリ · RFC 6238',
  'skip.toCodes': 'コードへ移動',

  'status.line': '{connection} · {vault}',
  'status.offline': 'オフライン',
  'status.vault.off': '何も保存しない',
  'status.vault.locked': '金庫は施錠中',
  'status.vault.open': '金庫は解錠中',

  'zone.input': '入力',
  'zone.vault': '金庫',
  'zone.codes': 'コード',

  'input.legend': '1 行に 1 項目',
  'input.placeholder':
    '例: JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32、{nameSecret}、{uri} — 混在可。{hash} で注記が始まる。',
  'input.help.images': 'QR 画像はここへドラッグするか、{paste} で貼り付けてもよい。',
  'input.help.migration': 'Google Authenticator のエクスポート ({migration}) は自動で変換される。',
  'input.help.more': '入力形式をすべて表示',
  'shortcut.modifier': 'Ctrl',

  // 数量 + 助数詞のあいだは詰める (「3件」)。それが日本語の書き方であり、
  // ついでに等幅の空白がここで開きすぎるのも避けられる。
  'input.count.accounts': { other: '{n}件のアカウント' },
  'input.count.errors': { other: '{n}件のエラー' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': '消去',
  'key.qrImage': '画像から QR',
  'key.camera': 'カメラ',
  'key.cameraStop': 'カメラを止める',
  'key.copy': 'コピー',
  'key.copyDone': 'コピーした',
  'key.copyFailed': '失敗',

  'viewfinder.hint': 'QR コードを枠内に収める',

  'filter.label': 'アカウントを絞り込む',
  'filter.placeholder': '名前で絞り込む',
  'filter.empty': '「{query}」に一致するものはない。',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { other: '{n} 桁' },
  'strip.period': '{n} 秒',
  'strip.next': '次',
  'strip.seconds.abbr': '秒',
  'strip.seconds.title': '秒',
  'strip.seconds.valid': '有効',
  'strip.accountFallback': 'アカウント {n}',
  'strip.copyAria': '{name} のコードをコピー',
  'strip.copyAnnounce': 'コード {digits} をコピーした',
  'strip.copyFailedHint': 'コピーに失敗した。コードを手で選択してほしい。',

  'fault.title': '読み取れない行',

  'vault.state.off': 'オフ — 何も保存しない',
  'vault.state.locked': '施錠中 — パスフレーズが必要',
  'vault.state.open': '解錠中 — シークレットはテキスト欄にある',
  'vault.explain':
    'Clockwork は既定では何も保存しない。金庫を入れれば、入力はパスフレーズで暗号化されたままここに残る。パスフレーズがなければ、保存された塊には何の価値もない。',
  'vault.explain.crypto':
    '鍵はパスフレーズから PBKDF2-SHA-256 を {iterations} 回かけて導き、暗号化は AES-256-GCM ' +
    'が担う。保存されるのは封をした包みだけで、平文もパスフレーズも導いた鍵も残らない。',
  'vault.explain.more': '詳細をすべて表示',
  'vault.pass.new': '新しいパスフレーズ',
  'vault.pass.existing': 'パスフレーズ',
  'vault.action.seal': '暗号化して保存',
  'vault.action.unseal': '解錠',
  'vault.action.deriving': '鍵を導出中 …',
  'vault.action.lock': '施錠',
  'vault.action.update': '保存し直す',
  'vault.action.wipe': 'すべて削除',
  'vault.action.wipeConfirm': '本当に削除する?',
  'vault.timeout.label': '自動で施錠するまで',
  'vault.timeout.minutes': { other: '{n} 分' },
  'vault.lockOnHide': 'タブを離れたときも施錠する',

  'vault.error.nothingToStore': '保存するものがない — テキスト欄が空。',
  'vault.error.storageBlocked': 'ブラウザーが保存を許さない (プライベートモード?)。',
  'vault.error.noVault': '金庫は保存されていない。',
  'vault.error.noPassphrase': 'パスフレーズがなければ鍵もない。',
  'vault.error.sealFailed': '保存に失敗した。',
  'vault.error.unsealFailed': '解錠に失敗した。',

  'vault.msg.sealed': '金庫を暗号化して保存した。',
  'vault.msg.resealed': '金庫を暗号化し直した。',
  'vault.msg.unsealed': '金庫を解錠した。',
  'vault.msg.locked': '金庫を施錠した。',
  'vault.msg.wiped': '金庫を削除した。',
  'vault.msg.wipedNote': '削除した。保存領域には何も残っていない。',
  'vault.locked.idle': { other: '{n} 分間の無操作で施錠した。' },
  'vault.locked.hidden': 'タブを離れたので施錠した。',

  'scan.noQr': '画像から QR コードを読み取れなかった。',
  'scan.unreadable': '画像を読み込めなかった — 本当に画像?',
  'scan.done': 'QR コードを読み取って挿入した。',
  'scan.camera.unavailable':
    'この環境ではカメラを使えない。ファイルとして開いた場合 (file://)、多くのブラウザーが' +
    'カメラを塞ぐ — 「画像から QR」なら必ず動く。',
  'scan.camera.denied':
    'カメラが拒否された。ブラウザーで許可を設定し直すか、「画像から QR」を使ってほしい。',
  'scan.camera.notFound': 'カメラが接続されていない。「画像から QR」なら動く。',
  'scan.camera.busy': 'カメラは別のプログラムが使用中。',
  'scan.camera.failed': 'カメラを起動できなかった。「画像から QR」なら必ず動く。',

  'import.done': {
    other: 'Google Authenticator のエクスポートから {n} 件のアカウントを取り込んだ',
  },
  'import.skipped': '見送り: {list}',
  'import.skip.hotp': '{label} (HOTP、カウンター方式)',
  'import.skip.algorithm': '{label} (未対応のアルゴリズム)',
  'import.skip.emptySecret': '{label} (シークレットが空)',
  'import.unnamed': '名称未設定',
  'import.unreadable': 'エクスポートを読み取れない。',

  'vacant.text': 'シークレット、otpauth リンク、QR 画像 — どれもこのブラウザーから出ない。',
  'vacant.demo': 'テスト鍵を挿入',
  'colophon.note': 'ネットワークなし · 保存なし · HMAC は Web Crypto API 経由',

  'lang.label': '言語',
  'lang.aria': '言語を選ぶ',

  'err.base32.paddingInside': '文字「=」は末尾にしか置けない (単なる詰め物)。',
  'err.base32.empty': 'シークレット鍵が空。',
  'err.base32.badChar':
    '{position} 文字目に不正な文字「{char}」。Base32 は A–Z と 2–7 しか知らない — ' +
    '数字の 0、1、8 は現れない (O、I、B と取り違えた?)。',
  'err.base32.badLength':
    '不正な長さ: {length} 文字 (空白と詰め物を除く)。Base32 は 5 バイトを 8 文字に符号化する。' +
    '最後の塊に入るのは 2、4、5、7、8 文字のいずれかだけ。おそらく 1 文字足りないか、' +
    '1 文字多い。',

  'err.uri.invalid': 'これは正しい URI ではない。期待するのは「otpauth://totp/…」。',
  'err.uri.scheme': '未知のスキーム「{scheme}」。期待するのは「otpauth」。',
  'err.uri.hotp':
    'これは HOTP の URI (カウンター方式)。このアプリは時刻に基づく TOTP コードしか作らない — ' +
    'そちらはカウンターの値を保存する必要がある。',
  'err.uri.type': '未知の種別「{type}」。「otpauth://」の後には「totp」が来る。',
  'err.uri.typeEmpty': '(空)',
  'err.uri.noSecret': 'URI に引数「secret」がない。',
  'err.uri.badLabel': 'URI のラベルにパーセント符号化の壊れがある (単独の「%」など)。',
  'err.uri.algorithm': '未知のアルゴリズム「{value}」。対応するのは SHA1、SHA256、SHA512。',
  'err.uri.digits': '「digits」の値が不正: {value}。許されるのは {min}〜{max}。',
  'err.uri.period': '「period」の値が不正: {value}。期待するのは 1〜3600 秒。',
  'err.uri.integer': '引数「{name}」は整数でなければならない。見つかったのは「{value}」。',

  'err.otp.digits': '桁数が不正: {value}。許されるのは {min}〜{max}。',
  'err.otp.emptySecret': 'シークレットが空 — そこからはコードを計算できない。',

  'err.line.unreadable': 'この行は読み取れなかった。',

  'err.vault.openFailed':
    '金庫を開けられなかった。パスフレーズが違うか、保存されたデータが書き換えられている。',
  'err.vault.badFormat': '保存された金庫データの形式が不明。',
  'err.vault.version': '金庫のバージョン {version} には対応していない (期待: {expected})。',
  'err.vault.base64': '金庫データの項目「{field}」が正しい Base64 ではない。',
  'err.vault.iterations': '反復回数が不正: {value}。',

  'err.migration.notExport':
    'これは Google Authenticator のエクスポートではない。期待するのは' +
    '「otpauth-migration://offline?data=…」。',
  'err.migration.noData': 'URI に引数「data」がない。',
  'err.migration.badPercent': '引数「data」にパーセント符号化の壊れがある。',
  'err.migration.badBase64': '引数「data」が正しい Base64 ではない。',
  'err.migration.noAccounts': 'このエクスポートにはアカウントが入っていない。',

  'native.vacant.text': 'シークレット、otpauth リンク、QR 画像 — どれもこの端末から出ない。',

  'native.colophon.note': 'ネットワークなし · 保存なし · HMAC は javax.crypto 経由',
} satisfies Strings;
