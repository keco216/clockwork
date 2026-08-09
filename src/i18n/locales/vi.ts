/**
 * Tiếng Việt.
 *
 * Thuật ngữ: secret · két (vault) · tài khoản · cụm mật khẩu (passphrase) ·
 *   mục · mã · mặt số. „Secret“ giữ nguyên — trang của các nhà cung cấp cũng
 *   viết như vậy.
 * Giọng văn: trung tính, ngắn gọn, như trong công cụ dành cho lập trình viên.
 * Dấu ngoặc kép: “ … ”.
 * Số nhiều: tiếng Việt không đổi hình thái theo số, CLDR chỉ có một dạng
 *   (other).
 * Chữ viết: dấu tiếng Việt nằm ngoài bộ chữ đi kèm của Inter, nên
 *   nhóm chữ „vietnamese“ dùng phông hệ thống (xem styles/scripts.css).
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — trình xác thực TOTP',
  'meta.description':
    'Clockwork — trình xác thực TOTP. Tạo mã hai lớp hoàn toàn trong trình duyệt, không một ' +
    'yêu cầu mạng nào.',
  'brand.tagline': 'Trình xác thực TOTP · RFC 6238',
  'skip.toCodes': 'Nhảy tới các mã',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Ngoại tuyến',
  'status.vault.off': 'không lưu gì cả',
  'status.vault.locked': 'két đã khoá',
  'status.vault.open': 'két đang mở',

  'zone.input': 'Nhập vào',
  'zone.vault': 'Két',
  'zone.codes': 'Mã',

  'input.legend': 'Mỗi dòng một mục',
  'input.help.formats': 'Base32, {nameSecret} hoặc {uri} — trộn lẫn. {hash} mở đầu một ghi chú.',
  'input.help.images': 'Ảnh mã QR cũng có thể kéo vào đây hoặc dán bằng {paste}.',
  'input.help.migration': 'Bản xuất từ Google Authenticator ({migration}) được chuyển đổi tự động.',
  'input.help.more': 'Mọi định dạng đầu vào',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { other: '{n} tài khoản' },
  'input.count.errors': { other: '{n} lỗi' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Xoá trống',
  'key.qrImage': 'QR từ ảnh',
  'key.camera': 'Máy ảnh',
  'key.cameraStop': 'Tắt máy ảnh',
  'key.copy': 'Sao chép',
  'key.copyDone': 'Đã chép',
  'key.copyFailed': 'Thất bại',

  'viewfinder.hint': 'Giữ mã QR trong khung',

  'filter.label': 'Lọc tài khoản',
  'filter.placeholder': 'Lọc theo tên',
  'filter.empty': 'Không có gì khớp với “{query}”.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { other: '{n} chữ số' },
  'strip.period': '{n} giây',
  'strip.next': 'tiếp theo',
  'strip.seconds.abbr': 'g',
  'strip.seconds.title': 'giây',
  'strip.seconds.valid': 'còn hiệu lực',
  'strip.accountFallback': 'Tài khoản {n}',
  'strip.copyAria': 'Sao chép mã của {name}',
  'strip.copyAnnounce': 'Đã chép mã {digits}',
  'strip.copyFailedHint': 'Sao chép thất bại. Hãy bôi đen mã bằng tay.',

  'fault.title': 'Dòng không đọc được',

  'vault.state.off': 'Tắt — không lưu gì cả',
  'vault.state.locked': 'Đã khoá — cần cụm mật khẩu',
  'vault.state.open': 'Đang mở — các secret nằm trong ô văn bản',
  'vault.explain':
    'Theo mặc định Clockwork không lưu gì cả. Nếu bật hầm, phần đã nhập sẽ ở lại đây dưới ' +
    'dạng mã hoá bằng cụm mật khẩu của bạn — không có nó thì khối đã lưu chẳng có giá ' +
    'trị.',
  'vault.explain.crypto':
    'Khoá được suy ra từ cụm mật khẩu bằng PBKDF2-SHA-256 với {iterations} lần lặp, còn ' +
    'AES-256-GCM lo việc mã hoá. Chỉ phong bì đã niêm phong được lưu: không bao giờ là ' +
    'văn bản rõ, không bao giờ là cụm mật khẩu, không bao giờ là khoá dẫn xuất.',
  'vault.explain.more': 'Mọi chi tiết',
  'vault.pass.new': 'Cụm mật khẩu mới',
  'vault.pass.existing': 'Cụm mật khẩu',
  'vault.action.seal': 'Lưu đã mã hoá',
  'vault.action.unseal': 'Mở khoá',
  'vault.action.deriving': 'Đang dẫn xuất khoá …',
  'vault.action.lock': 'Khoá',
  'vault.action.update': 'Lưu lại',
  'vault.action.wipe': 'Xoá tất cả',
  'vault.action.wipeConfirm': 'Xoá thật chứ?',
  'vault.timeout.label': 'Tự khoá sau',
  'vault.timeout.minutes': { other: '{n} phút' },
  'vault.lockOnHide': 'và khi rời khỏi thẻ',

  'vault.error.nothingToStore': 'Không có gì để lưu — ô văn bản trống.',
  'vault.error.storageBlocked': 'Trình duyệt không cho lưu (chế độ riêng tư?).',
  'vault.error.noVault': 'Không có két nào được lưu.',
  'vault.error.noPassphrase': 'Không có cụm mật khẩu thì không có khoá.',
  'vault.error.sealFailed': 'Lưu thất bại.',
  'vault.error.unsealFailed': 'Mở khoá thất bại.',

  'vault.msg.sealed': 'Đã lưu két ở dạng mã hoá.',
  'vault.msg.resealed': 'Đã mã hoá lại két.',
  'vault.msg.unsealed': 'Đã mở khoá két.',
  'vault.msg.locked': 'Đã khoá két.',
  'vault.msg.wiped': 'Đã xoá két.',
  'vault.msg.wipedNote': 'Đã xoá. Trong kho không còn gì.',
  'vault.locked.idle': { other: 'Đã khoá sau {n} phút không nhập gì.' },
  'vault.locked.hidden': 'Đã khoá khi rời khỏi thẻ.',

  'scan.noQr': 'Không nhận ra mã QR nào trong ảnh.',
  'scan.unreadable': 'Không đọc được ảnh — đây có thật là ảnh không?',
  'scan.done': 'Đã đọc mã QR và chèn vào.',
  'scan.camera.unavailable':
    'Môi trường này không cấp máy ảnh. Khi mở dưới dạng tệp (file://) phần lớn trình duyệt ' +
    'chặn nó — “QR từ ảnh” thì lúc nào cũng chạy.',
  'scan.camera.denied':
    'Máy ảnh bị từ chối. Hãy đặt lại quyền trong trình duyệt — hoặc dùng “QR từ ảnh”.',
  'scan.camera.notFound': 'Không có máy ảnh nào được nối. “QR từ ảnh” vẫn chạy.',
  'scan.camera.busy': 'Máy ảnh đang được một chương trình khác dùng.',
  'scan.camera.failed': 'Không khởi động được máy ảnh. “QR từ ảnh” lúc nào cũng chạy.',

  'import.done': { other: 'Đã lấy {n} tài khoản từ bản xuất Google Authenticator' },
  'import.skipped': 'bỏ qua: {list}',
  'import.skip.hotp': '{label} (HOTP, dựa trên bộ đếm)',
  'import.skip.algorithm': '{label} (thuật toán không được hỗ trợ)',
  'import.skip.emptySecret': '{label} (secret rỗng)',
  'import.unnamed': 'Không tên',
  'import.unreadable': 'Bản xuất không đọc được.',

  'vacant.text': 'Secret, liên kết otpauth hoặc ảnh QR — không có gì rời khỏi trình duyệt này.',
  'vacant.demo': 'Chèn khóa thử',
  'colophon.note': 'Không mạng · không lưu trữ · HMAC qua Web Crypto API',

  'lang.label': 'Ngôn ngữ',
  'lang.aria': 'Chọn ngôn ngữ',

  'err.base32.paddingInside': 'Ký tự “=” chỉ được đứng ở cuối (nó chỉ là phần đệm).',
  'err.base32.empty': 'Khoá secret rỗng.',
  'err.base32.badChar':
    'Ký tự không hợp lệ “{char}” ở vị trí {position}. Base32 chỉ biết A–Z và 2–7 — các chữ số ' +
    '0, 1 và 8 không xuất hiện trong đó (nhầm với O, I và B?).',
  'err.base32.badLength':
    'Độ dài không hợp lệ: {length} ký tự (không kể dấu cách và phần đệm). Base32 mã hoá 5 byte ' +
    'thành 8 ký tự; khối cuối chỉ có thể là 2, 4, 5, 7 hoặc 8 ký tự. Nhiều khả năng thiếu một ' +
    'ký tự hoặc thừa một ký tự.',

  'err.uri.invalid': 'Đây không phải URI hợp lệ. Cần có “otpauth://totp/…”.',
  'err.uri.scheme': 'Lược đồ lạ “{scheme}”. Cần có “otpauth”.',
  'err.uri.hotp':
    'Đây là URI kiểu HOTP (dựa trên bộ đếm). Ứng dụng này chỉ tạo mã TOTP theo thời gian — ' +
    'nếu không thì phải lưu trạng thái bộ đếm.',
  'err.uri.type': 'Kiểu lạ “{type}”. Sau “otpauth://” phải là “totp”.',
  'err.uri.typeEmpty': '(rỗng)',
  'err.uri.noSecret': 'URI thiếu tham số “secret”.',
  'err.uri.badLabel': 'Nhãn của URI có mã hoá phần trăm bị hỏng (chẳng hạn một “%” lẻ loi).',
  'err.uri.algorithm': 'Thuật toán lạ “{value}”. Hỗ trợ SHA1, SHA256 và SHA512.',
  'err.uri.digits': 'Giá trị “digits” không hợp lệ: {value}. Cho phép từ {min} đến {max}.',
  'err.uri.period': 'Giá trị “period” không hợp lệ: {value}. Cần từ 1 đến 3600 giây.',
  'err.uri.integer': 'Tham số “{name}” phải là số nguyên; tìm thấy “{value}”.',

  'err.otp.digits': 'Số chữ số không hợp lệ: {value}. Cho phép từ {min} đến {max}.',
  'err.otp.emptySecret': 'Secret rỗng — không tính được mã nào từ đó.',

  'err.line.unreadable': 'Không đọc được dòng này.',

  'err.vault.openFailed': 'Không mở được két. Sai cụm mật khẩu — hoặc dữ liệu đã lưu bị sửa đổi.',
  'err.vault.badFormat': 'Dữ liệu két đã lưu có định dạng lạ.',
  'err.vault.version': 'Phiên bản két {version} không được hỗ trợ (cần: {expected}).',
  'err.vault.base64': 'Trường “{field}” của dữ liệu két không phải Base64 hợp lệ.',
  'err.vault.iterations': 'Số vòng lặp không hợp lệ: {value}.',

  'err.migration.notExport':
    'Đây không phải bản xuất của Google Authenticator. Cần có ' +
    '“otpauth-migration://offline?data=…”.',
  'err.migration.noData': 'URI thiếu tham số “data”.',
  'err.migration.badPercent': 'Tham số “data” có mã hoá phần trăm bị hỏng.',
  'err.migration.badBase64': 'Tham số “data” không phải Base64 hợp lệ.',
  'err.migration.noAccounts': 'Trong bản xuất này không có tài khoản nào.',
} satisfies Strings;
