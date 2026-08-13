/**
 * Türkçe.
 *
 * Sözlük: secret · kasa (vault) · hesap · parola cümlesi (passphrase) · girdi ·
 *   kod · kadran. „Secret“ olduğu gibi bırakıldı — sağlayıcıların sayfalarında
 *   da böyle yazıyor.
 * Üslup: kişisel olmayan, yalın — geliştirici araçlarındaki gibi.
 * Tırnak: “ … ”, Türkçe tipografiye uygun.
 * Çoğul: Türkçede sayıdan sonra ad tekil kalır (“5 hesap”), bu yüzden „one“ ve
 *   „other“ aynıdır. Bu bir kopyalama hatası değil.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP kimlik doğrulayıcı',
  'meta.description':
    'Clockwork — TOTP kimlik doğrulayıcı. İki adımlı kodları tamamen tarayıcıda üretir, tek ' +
    'bir ağ isteği bile göndermeden.',
  'brand.tagline': 'TOTP kimlik doğrulayıcı · RFC 6238',
  'skip.toCodes': 'Kodlara geç',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Çevrimdışı',
  'status.vault.off': 'hiçbir şey saklanmıyor',
  'status.vault.locked': 'kasa kilitli',
  'status.vault.open': 'kasa açık',

  'zone.input': 'Giriş',
  'zone.vault': 'Kasa',
  'zone.codes': 'Kodlar',

  'input.legend': 'Her satıra bir girdi',
  'input.placeholder':
    'örn. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} ya da {uri} — karışık. {hash} bir not başlatır.',
  'input.help.images': 'QR görselleri buraya sürüklenebilir ya da {paste} ile yapıştırılabilir.',
  'input.help.migration':
    'Google Authenticator dışa aktarımları ({migration}) kendiliğinden dönüştürülür.',
  'input.help.more': 'Tüm giriş biçimleri',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} hesap', other: '{n} hesap' },
  'input.count.errors': { one: '{n} hata', other: '{n} hata' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Boşalt',
  'key.qrImage': 'Görselden QR',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Kamerayı kapat',
  'key.copy': 'Kopyala',
  'key.copyDone': 'Kopyalandı',
  'key.copyFailed': 'Başarısız',

  'viewfinder.hint': 'QR kodu çerçevenin içinde tutun',

  'filter.label': 'Hesapları filtrele',
  'filter.placeholder': 'Ada göre filtrele',
  'filter.empty': '“{query}” ile eşleşen yok.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} basamak', other: '{n} basamak' },
  'strip.period': '{n} sn',
  'strip.next': 'sıradaki',
  'strip.seconds.abbr': 'sn',
  'strip.seconds.title': 'saniye',
  'strip.seconds.valid': 'geçerli',
  'strip.accountFallback': '{n}. hesap',
  'strip.copyAria': '{name} kodunu kopyala',
  'strip.copyAnnounce': '{digits} kodu kopyalandı',
  'strip.copyFailedHint': 'Kopyalama başarısız oldu. Kodu elle seçin.',

  'fault.title': 'Satır okunamıyor',

  'vault.state.off': 'Kapalı — hiçbir şey saklanmıyor',
  'vault.state.locked': 'Kilitli — parola cümlesi gerekiyor',
  'vault.state.open': 'Açık — secret’lar metin alanında',
  'vault.explain':
    'Clockwork varsayılan olarak hiçbir şey saklamaz. Kasayı açarsanız girdi burada ' +
    'parola cümlenizle şifreli kalır — o olmadan saklanan blok hiçbir işe yaramaz.',
  'vault.explain.crypto':
    'Anahtar, parola cümlesinden PBKDF2-SHA-256 ile {iterations} yineleme sonunda ' +
    'türetilir; şifrelemeyi AES-256-GCM yapar. Yalnızca mühürlü zarf saklanır: ne açık ' +
    'metin, ne parola cümlesi, ne de türetilen anahtar.',
  'vault.explain.more': 'Tüm ayrıntılar',
  'vault.pass.new': 'Yeni parola cümlesi',
  'vault.pass.existing': 'Parola cümlesi',
  'vault.action.seal': 'Şifreli sakla',
  'vault.action.unseal': 'Kilidi aç',
  'vault.action.deriving': 'Anahtar türetiliyor …',
  'vault.action.lock': 'Kilitle',
  'vault.action.update': 'Yeniden sakla',
  'vault.action.wipe': 'Hepsini sil',
  'vault.action.wipeConfirm': 'Gerçekten silinsin mi?',
  'vault.timeout.label': 'Şu süre sonunda kendi kendine kilitlenir:',
  'vault.timeout.minutes': { one: '{n} dakika', other: '{n} dakika' },
  'vault.lockOnHide': 've sekmeden ayrılınca',

  'vault.error.nothingToStore': 'Saklanacak bir şey yok — metin alanı boş.',
  'vault.error.storageBlocked': 'Tarayıcı saklamaya izin vermiyor (gizli mod?).',
  'vault.error.noVault': 'Saklanmış bir kasa yok.',
  'vault.error.noPassphrase': 'Parola cümlesi olmadan anahtar da olmaz.',
  'vault.error.sealFailed': 'Saklama başarısız oldu.',
  'vault.error.unsealFailed': 'Kilit açma başarısız oldu.',

  'vault.msg.sealed': 'Kasa şifreli olarak saklandı.',
  'vault.msg.resealed': 'Kasa yeniden şifrelendi.',
  'vault.msg.unsealed': 'Kasanın kilidi açıldı.',
  'vault.msg.locked': 'Kasa kilitlendi.',
  'vault.msg.wiped': 'Kasa silindi.',
  'vault.msg.wipedNote': 'Silindi. Depolamada hiçbir şey kalmadı.',
  'vault.locked.idle': {
    one: '{n} dakika giriş yapılmadığı için kilitlendi.',
    other: '{n} dakika giriş yapılmadığı için kilitlendi.',
  },
  'vault.locked.hidden': 'Sekmeden ayrılınca kilitlendi.',

  'scan.noQr': 'Görselde hiçbir QR kod seçilemedi.',
  'scan.unreadable': 'Görsel okunamadı — bu gerçekten bir görsel mi?',
  'scan.done': 'QR kod okundu ve eklendi.',
  'scan.camera.unavailable':
    'Bu ortam kamera vermiyor. Dosya olarak açıldığında (file://) tarayıcıların çoğu onu ' +
    'engeller — “Görselden QR” her zaman çalışır.',
  'scan.camera.denied':
    'Kameraya izin verilmedi. İzni tarayıcıda sıfırlayın — ya da “Görselden QR” kullanın.',
  'scan.camera.notFound': 'Bağlı kamera yok. “Görselden QR” yine de çalışır.',
  'scan.camera.busy': 'Kamerayı şu anda başka bir program kullanıyor.',
  'scan.camera.failed': 'Kamera başlatılamadı. “Görselden QR” her zaman çalışır.',

  'import.done': {
    one: 'Google Authenticator dışa aktarımından {n} hesap alındı',
    other: 'Google Authenticator dışa aktarımından {n} hesap alındı',
  },
  'import.skipped': 'atlananlar: {list}',
  'import.skip.hotp': '{label} (HOTP, sayaca dayalı)',
  'import.skip.algorithm': '{label} (desteklenmeyen algoritma)',
  'import.skip.emptySecret': '{label} (boş secret)',
  'import.unnamed': 'Adsız',
  'import.unreadable': 'Dışa aktarım okunamıyor.',

  'vacant.text': 'Secret, otpauth bağlantısı veya QR görüntüsü — hiçbiri bu tarayıcıdan çıkmaz.',
  'vacant.demo': 'Test anahtarı ekle',
  'colophon.note': 'Ağ yok · depolama yok · HMAC, Web Crypto API üzerinden',

  'lang.label': 'Dil',
  'lang.aria': 'Dil seçin',

  'err.base32.paddingInside': '“=” karakteri yalnızca sonda durabilir (yalnızca doldurmadır).',
  'err.base32.empty': 'Secret anahtarı boş.',
  'err.base32.badChar':
    '{position}. konumda geçersiz karakter: “{char}”. Base32 yalnızca A–Z ve 2–7 tanır — ' +
    '0, 1 ve 8 rakamları onda geçmez (O, I ve B ile mi karıştırıldı?).',
  'err.base32.badLength':
    'Geçersiz uzunluk: {length} karakter (boşluklar ve doldurma hariç). Base32, 5 baytı ' +
    '8 karakterle kodlar; son blokta yalnızca 2, 4, 5, 7 ya da 8 karakter olabilir. ' +
    'Büyük olasılıkla bir karakter eksik ya da bir fazla.',

  'err.uri.invalid': 'Bu geçerli bir URI değil. Beklenen: “otpauth://totp/…”.',
  'err.uri.scheme': 'Bilinmeyen şema “{scheme}”. Beklenen: “otpauth”.',
  'err.uri.hotp':
    'Bu bir HOTP URI’si (sayaca dayalı). Bu uygulama yalnızca zamana dayalı TOTP kodları ' +
    'üretir — öteki için sayaç durumunun saklanması gerekirdi.',
  'err.uri.type': 'Bilinmeyen tür “{type}”. “otpauth://” ardından “totp” gelmelidir.',
  'err.uri.typeEmpty': '(boş)',
  'err.uri.noSecret': 'URI’de “secret” parametresi eksik.',
  'err.uri.badLabel': 'URI etiketinde bozuk yüzde kodlaması var (örneğin tek başına bir “%”).',
  'err.uri.algorithm': 'Bilinmeyen algoritma “{value}”. Desteklenenler: SHA1, SHA256 ve SHA512.',
  'err.uri.digits': '“digits” için geçersiz değer: {value}. İzin verilen: {min}–{max}.',
  'err.uri.period': '“period” için geçersiz değer: {value}. Beklenen: 1–3600 saniye.',
  'err.uri.integer': '“{name}” parametresi tam sayı olmalı; bulunan: “{value}”.',

  'err.otp.digits': 'Geçersiz basamak sayısı: {value}. İzin verilen: {min}–{max}.',
  'err.otp.emptySecret': 'Secret boş — bundan hiçbir kod hesaplanamaz.',

  'err.line.unreadable': 'Bu satır okunamadı.',

  'err.vault.openFailed':
    'Kasa açılamadı. Yanlış parola cümlesi — ya da saklanan veriler değiştirilmiş.',
  'err.vault.badFormat': 'Saklanan kasa verileri bilinmeyen bir biçimde.',
  'err.vault.version': '{version} kasa sürümü desteklenmiyor (beklenen: {expected}).',
  'err.vault.base64': 'Kasa verilerinin “{field}” alanı geçerli Base64 değil.',
  'err.vault.iterations': 'Geçersiz yineleme sayısı: {value}.',

  'err.migration.notExport':
    'Bu bir Google Authenticator dışa aktarımı değil. Beklenen: ' +
    '“otpauth-migration://offline?data=…”.',
  'err.migration.noData': 'URI’de “data” parametresi eksik.',
  'err.migration.badPercent': '“data” parametresinde bozuk yüzde kodlaması var.',
  'err.migration.badBase64': '“data” parametresi geçerli Base64 değil.',
  'err.migration.noAccounts': 'Bu dışa aktarımda hiç hesap yok.',

  'native.vacant.text':
    'Secret, otpauth bağlantısı veya QR görüntüsü — hiçbiri bu cihazdan çıkmaz.',

  'native.colophon.note': 'Ağ yok · depolama yok · HMAC, javax.crypto üzerinden',
} satisfies Strings;
