/**
 * ไทย.
 *
 * อภิธานศัพท์: secret · ตู้นิรภัย (vault) · บัญชี · วลีรหัสผ่าน (passphrase) ·
 *   รายการ · รหัส · หน้าปัด คำว่า „secret“ คงไว้เป็นอักษรละติน — หน้าเว็บของ
 *   ผู้ให้บริการก็เขียนแบบนั้น
 * น้ำเสียง: เป็นกลางและกระชับ อย่างเครื่องมือสำหรับนักพัฒนา
 * อัญประกาศ: “ … ”
 * พหูพจน์: ภาษาไทยไม่เปลี่ยนรูปตามจำนวน CLDR จึงมีรูปเดียว (other)
 * การตัดบรรทัด: ภาษาไทยไม่มีช่องว่างระหว่างคำ จึงตั้ง line-break ไว้ให้เบราว์เซอร์
 *   ตัดตามพจนานุกรม (ดู styles/scripts.css)
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — ตัวยืนยันตัวตน TOTP',
  'meta.description':
    'Clockwork — ตัวยืนยันตัวตน TOTP สร้างรหัสสองชั้นภายในเบราว์เซอร์ทั้งหมด โดยไม่มีคำขอเครือข่ายแม้แต่ครั้งเดียว',
  'brand.tagline': 'ตัวยืนยันตัวตน TOTP · RFC 6238',
  'skip.toCodes': 'ข้ามไปยังรหัส',

  'status.line': '{connection} · {vault}',
  'status.offline': 'ออฟไลน์',
  'status.vault.off': 'ไม่มีการบันทึกสิ่งใด',
  'status.vault.locked': 'ตู้นิรภัยล็อกอยู่',
  'status.vault.open': 'ตู้นิรภัยเปิดอยู่',

  'zone.input': 'การป้อน',
  'zone.vault': 'ตู้นิรภัย',
  'zone.codes': 'รหัส',

  'input.legend': 'หนึ่งรายการต่อหนึ่งบรรทัด',
  'input.placeholder':
    'เช่น JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} หรือ {uri} — ปนกันได้ {hash} เริ่มต้นบันทึกย่อ',
  'input.help.images': 'ภาพรหัส QR ลากมาวางที่นี่ก็ได้ หรือวางด้วย {paste}',
  'input.help.migration': 'ไฟล์ส่งออกจาก Google Authenticator ({migration}) จะถูกแปลงให้เอง',
  'input.help.more': 'รูปแบบข้อมูลทั้งหมด',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { other: '{n} บัญชี' },
  'input.count.errors': { other: 'ผิดพลาด {n} รายการ' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'ล้าง',
  'key.qrImage': 'QR จากภาพ',
  'key.camera': 'กล้อง',
  'key.cameraStop': 'ปิดกล้อง',
  'key.copy': 'คัดลอก',
  'key.copyDone': 'คัดลอกแล้ว',
  'key.copyFailed': 'ล้มเหลว',

  'viewfinder.hint': 'ถือรหัส QR ไว้ในกรอบ',

  'filter.label': 'กรองบัญชี',
  'filter.placeholder': 'กรองตามชื่อ',
  'filter.empty': 'ไม่มีรายการที่ตรงกับ “{query}”',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { other: '{n} หลัก' },
  'strip.period': '{n} วิ',
  'strip.next': 'ถัดไป',
  'strip.seconds.abbr': 'วิ',
  'strip.seconds.title': 'วินาที',
  'strip.seconds.valid': 'ใช้ได้',
  'strip.accountFallback': 'บัญชี {n}',
  'strip.copyAria': 'คัดลอกรหัสของ {name}',
  'strip.copyAnnounce': 'คัดลอกรหัส {digits} แล้ว',
  'strip.copyFailedHint': 'คัดลอกไม่สำเร็จ กรุณาเลือกรหัสด้วยมือ',

  'fault.title': 'บรรทัดนี้อ่านไม่ออก',

  'vault.state.off': 'ปิดอยู่ — ไม่มีการบันทึกสิ่งใด',
  'vault.state.locked': 'ล็อกอยู่ — ต้องใช้วลีรหัสผ่าน',
  'vault.state.open': 'เปิดอยู่ — secret อยู่ในช่องข้อความ',
  'vault.explain':
    'ตามค่าเริ่มต้น Clockwork ไม่เก็บอะไรเลย หากเปิดตู้เซฟ ' +
    'สิ่งที่ป้อนไว้จะอยู่ที่นี่โดยเข้ารหัสด้วยวลีรหัสผ่านของคุณ — ถ้าไม่มีวลีนั้น ' +
    'บล็อกที่เก็บไว้ก็ไร้ค่า',
  'vault.explain.crypto':
    'กุญแจได้มาจากวลีรหัสผ่านด้วย PBKDF2-SHA-256 จำนวน {iterations} รอบ และ AES-256-GCM ' +
    'ทำหน้าที่เข้ารหัส ที่เก็บไว้มีเพียงซองที่ปิดผนึกแล้ว ไม่เคยเก็บข้อความธรรมดา ' +
    'ไม่เคยเก็บวลีรหัสผ่าน และไม่เคยเก็บกุญแจที่ได้มา',
  'vault.explain.more': 'รายละเอียดทั้งหมด',
  'vault.pass.new': 'วลีรหัสผ่านใหม่',
  'vault.pass.existing': 'วลีรหัสผ่าน',
  'vault.action.seal': 'บันทึกแบบเข้ารหัส',
  'vault.action.unseal': 'ปลดล็อก',
  'vault.action.deriving': 'กำลังสร้างกุญแจ …',
  'vault.action.lock': 'ล็อก',
  'vault.action.update': 'บันทึกใหม่',
  'vault.action.wipe': 'ลบทั้งหมด',
  'vault.action.wipeConfirm': 'ลบจริงหรือ?',
  'vault.timeout.label': 'ล็อกเองหลังจาก',
  'vault.timeout.minutes': { other: '{n} นาที' },
  'vault.lockOnHide': 'และเมื่อออกจากแท็บ',

  'vault.error.nothingToStore': 'ไม่มีอะไรให้บันทึก — ช่องข้อความว่างอยู่',
  'vault.error.storageBlocked': 'เบราว์เซอร์ไม่ยอมให้บันทึก (โหมดส่วนตัวหรือเปล่า?)',
  'vault.error.noVault': 'ไม่มีตู้นิรภัยที่บันทึกไว้',
  'vault.error.noPassphrase': 'ไม่มีวลีรหัสผ่านก็ไม่มีกุญแจ',
  'vault.error.sealFailed': 'บันทึกไม่สำเร็จ',
  'vault.error.unsealFailed': 'ปลดล็อกไม่สำเร็จ',

  'vault.msg.sealed': 'บันทึกตู้นิรภัยแบบเข้ารหัสแล้ว',
  'vault.msg.resealed': 'เข้ารหัสตู้นิรภัยใหม่แล้ว',
  'vault.msg.unsealed': 'ปลดล็อกตู้นิรภัยแล้ว',
  'vault.msg.locked': 'ล็อกตู้นิรภัยแล้ว',
  'vault.msg.wiped': 'ลบตู้นิรภัยแล้ว',
  'vault.msg.wipedNote': 'ลบแล้ว ไม่มีอะไรเหลืออยู่ในที่เก็บ',
  'vault.locked.idle': { other: 'ล็อกหลังจาก {n} นาทีที่ไม่มีการป้อน' },
  'vault.locked.hidden': 'ล็อกเมื่อออกจากแท็บ',

  'scan.noQr': 'ในภาพไม่พบรหัส QR ใดเลย',
  'scan.unreadable': 'อ่านภาพไม่ได้ — นี่เป็นภาพจริงหรือ?',
  'scan.done': 'อ่านรหัส QR และใส่ให้แล้ว',
  'scan.camera.unavailable':
    'สภาพแวดล้อมนี้ไม่เปิดให้ใช้กล้อง เมื่อเปิดเป็นไฟล์ (file://) เบราว์เซอร์ส่วนใหญ่จะปิดกั้นไว้ — ' +
    '“QR จากภาพ” ใช้ได้เสมอ',
  'scan.camera.denied': 'กล้องถูกปฏิเสธ ตั้งค่าสิทธิ์ในเบราว์เซอร์ใหม่ — หรือใช้ “QR จากภาพ”',
  'scan.camera.notFound': 'ไม่มีกล้องเชื่อมต่ออยู่ “QR จากภาพ” ยังใช้ได้',
  'scan.camera.busy': 'ขณะนี้โปรแกรมอื่นกำลังใช้กล้องอยู่',
  'scan.camera.failed': 'เริ่มกล้องไม่ได้ “QR จากภาพ” ใช้ได้เสมอ',

  'import.done': { other: 'รับมา {n} บัญชีจากไฟล์ส่งออกของ Google Authenticator' },
  'import.skipped': 'ข้ามไป: {list}',
  'import.skip.hotp': '{label} (HOTP อาศัยตัวนับ)',
  'import.skip.algorithm': '{label} (อัลกอริทึมที่ไม่รองรับ)',
  'import.skip.emptySecret': '{label} (secret ว่าง)',
  'import.unnamed': 'ไม่มีชื่อ',
  'import.unreadable': 'ไฟล์ส่งออกอ่านไม่ออก',

  'vacant.text': 'ซีเคร็ต ลิงก์ otpauth หรือรูป QR — ไม่มีสิ่งใดออกจากเบราว์เซอร์นี้',
  'vacant.demo': 'ใส่คีย์ทดสอบ',
  'colophon.note': 'ไม่มีเครือข่าย · ไม่มีที่เก็บ · HMAC ผ่าน Web Crypto API',

  'lang.label': 'ภาษา',
  'lang.aria': 'เลือกภาษา',

  'err.base32.paddingInside': 'อักขระ “=” วางได้เฉพาะท้ายสุด (เป็นเพียงตัวเติมเท่านั้น)',
  'err.base32.empty': 'กุญแจ secret ว่างเปล่า',
  'err.base32.badChar':
    'อักขระไม่ถูกต้อง “{char}” ที่ตำแหน่ง {position} Base32 รู้จักเพียง A–Z และ 2–7 — ' +
    'เลข 0, 1 และ 8 ไม่ปรากฏในนั้น (สับสนกับ O, I และ B หรือเปล่า?)',
  'err.base32.badLength':
    'ความยาวไม่ถูกต้อง: {length} อักขระ (ไม่นับช่องว่างและตัวเติม) Base32 เข้ารหัส 5 ไบต์เป็น 8 อักขระ ' +
    'บล็อกสุดท้ายเป็นได้เพียง 2, 4, 5, 7 หรือ 8 อักขระ เป็นไปได้ว่าขาดไปหนึ่งอักขระหรือเกินมาหนึ่ง',

  'err.uri.invalid': 'นี่ไม่ใช่ URI ที่ใช้ได้ ต้องเป็น “otpauth://totp/…”',
  'err.uri.scheme': 'สกีมาที่ไม่รู้จัก “{scheme}” ต้องเป็น “otpauth”',
  'err.uri.hotp':
    'นี่คือ URI แบบ HOTP (อาศัยตัวนับ) แอปนี้สร้างเฉพาะรหัส TOTP ที่อิงเวลา — มิฉะนั้นต้องเก็บสถานะตัวนับไว้',
  'err.uri.type': 'ชนิดที่ไม่รู้จัก “{type}” หลัง “otpauth://” ต้องเป็น “totp”',
  'err.uri.typeEmpty': '(ว่าง)',
  'err.uri.noSecret': 'ใน URI ขาดพารามิเตอร์ “secret”',
  'err.uri.badLabel': 'ป้ายของ URI มีการเข้ารหัสเปอร์เซ็นต์ที่เสีย (เช่น “%” เดี่ยว ๆ)',
  'err.uri.algorithm': 'อัลกอริทึมที่ไม่รู้จัก “{value}” ที่รองรับคือ SHA1, SHA256 และ SHA512',
  'err.uri.digits': 'ค่าของ “digits” ไม่ถูกต้อง: {value} อนุญาตตั้งแต่ {min} ถึง {max}',
  'err.uri.period': 'ค่าของ “period” ไม่ถูกต้อง: {value} ต้องอยู่ระหว่าง 1 ถึง 3600 วินาที',
  'err.uri.integer': 'พารามิเตอร์ “{name}” ต้องเป็นจำนวนเต็ม แต่พบ “{value}”',

  'err.otp.digits': 'จำนวนหลักไม่ถูกต้อง: {value} อนุญาตตั้งแต่ {min} ถึง {max}',
  'err.otp.emptySecret': 'secret ว่างเปล่า — คำนวณรหัสจากมันไม่ได้',

  'err.line.unreadable': 'อ่านบรรทัดนี้ไม่ได้',

  'err.vault.openFailed': 'เปิดตู้นิรภัยไม่ได้ วลีรหัสผ่านผิด — หรือข้อมูลที่บันทึกไว้ถูกแก้ไข',
  'err.vault.badFormat': 'ข้อมูลตู้นิรภัยที่บันทึกไว้อยู่ในรูปแบบที่ไม่รู้จัก',
  'err.vault.version': 'ตู้นิรภัยรุ่น {version} ไม่รองรับ (ที่ต้องการ: {expected})',
  'err.vault.base64': 'ช่อง “{field}” ของข้อมูลตู้นิรภัยไม่ใช่ Base64 ที่ถูกต้อง',
  'err.vault.iterations': 'จำนวนรอบไม่ถูกต้อง: {value}',

  'err.migration.notExport':
    'นี่ไม่ใช่ไฟล์ส่งออกของ Google Authenticator ต้องเป็น “otpauth-migration://offline?data=…”',
  'err.migration.noData': 'ใน URI ขาดพารามิเตอร์ “data”',
  'err.migration.badPercent': 'พารามิเตอร์ “data” มีการเข้ารหัสเปอร์เซ็นต์ที่เสีย',
  'err.migration.badBase64': 'พารามิเตอร์ “data” ไม่ใช่ Base64 ที่ถูกต้อง',
  'err.migration.noAccounts': 'ในไฟล์ส่งออกนี้ไม่มีบัญชีใดเลย',

  'native.vacant.text': 'ซีเคร็ต ลิงก์ otpauth หรือรูป QR — ไม่มีสิ่งใดออกจากอุปกรณ์นี้',

  'native.colophon.note': 'ไม่มีเครือข่าย · ไม่มีที่เก็บ · HMAC ผ่าน javax.crypto',

  'native.scan.camera.unavailable': 'อุปกรณ์นี้ไม่เปิดให้ใช้กล้อง — “QR จากภาพ” ใช้ได้เสมอ',
  'native.scan.camera.denied':
    'กล้องถูกปฏิเสธ ให้สิทธิ์ในการตั้งค่าแอปของระบบ — หรือใช้ “QR จากภาพ”',
  'native.vault.lockOnHide': 'และเมื่อออกจากแอป',
  'native.vault.locked.hidden': 'ล็อกเมื่อออกจากแอป',
  'native.vault.error.storageBlocked': 'เขียนตู้นิรภัยไม่ได้ — พื้นที่เก็บข้อมูลเต็มหรือเปล่า?',
  'native.vault.biometric.label': 'ปลดล็อกด้วยไบโอเมตริก',
  'native.vault.biometric.note':
    'เป็นทางลัด ไม่ใช่กุญแจดอกที่สอง วลีรหัสผ่านยังเป็นทางกลับทางเดียว',
  'native.vault.biometric.cancel': 'ใช้วลีรหัสผ่าน',
  'native.vault.biometric.unavailable': 'อุปกรณ์นี้ไม่ได้ตั้งไบโอเมตริกแบบเข้ม',
  'native.vault.biometric.invalidated':
    'มีการลงทะเบียนไบโอเมตริกใหม่ ทางลัดจึงหายไป ปลดล็อกด้วยวลีรหัสผ่านแล้วเปิดใหม่อีกครั้ง',
  'native.vault.biometric.failed': 'ปลดล็อกด้วยไบโอเมตริกไม่สำเร็จ — ใช้วลีรหัสผ่าน',
  'native.vault.screenshots.label': 'บล็อกภาพหน้าจอและตัวอย่าง',
} satisfies Strings;
