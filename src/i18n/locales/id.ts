/**
 * Bahasa Indonesia.
 *
 * Glosarium: secret · brankas (vault) · akun · frasa sandi (passphrase) ·
 *   entri · kode · muka jam. „Secret“ dibiarkan apa adanya — begitulah tertulis
 *   di halaman penyedia layanan.
 * Ragam: netral dan ringkas, seperti pada perkakas pengembang.
 * Tanda kutip: “ … ”.
 * Jamak: bahasa Indonesia tidak membedakan tunggal dan jamak menurut angka,
 *   sehingga CLDR hanya mengenal satu bentuk (other).
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — autentikator TOTP',
  'meta.description':
    'Clockwork — autentikator TOTP. Membuat kode dua faktor sepenuhnya di peramban, tanpa ' +
    'satu pun permintaan jaringan.',
  'brand.tagline': 'Autentikator TOTP · RFC 6238',
  'skip.toCodes': 'Lompat ke kode',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Luring',
  'status.vault.off': 'tidak ada yang disimpan',
  'status.vault.locked': 'brankas terkunci',
  'status.vault.open': 'brankas terbuka',

  'zone.input': 'Masukan',
  'zone.vault': 'Brankas',
  'zone.codes': 'Kode',

  'input.legend': 'Satu entri per baris',
  'input.placeholder':
    'mis. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} atau {uri} — bercampur. {hash} memulai catatan.',
  'input.help.images': 'Gambar QR juga bisa diseret ke sini atau ditempel dengan {paste}.',
  'input.help.migration':
    'Ekspor dari Google Authenticator ({migration}) diubah dengan sendirinya.',
  'input.help.more': 'Semua format masukan',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { other: '{n} akun' },
  'input.count.errors': { other: '{n} galat' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Kosongkan',
  'key.qrImage': 'QR dari gambar',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Matikan kamera',
  'key.copy': 'Salin',
  'key.copyDone': 'Tersalin',
  'key.copyFailed': 'Gagal',

  'viewfinder.hint': 'Tahan kode QR di dalam bingkai',

  'filter.label': 'Saring akun',
  'filter.placeholder': 'Saring menurut nama',
  'filter.empty': 'Tidak ada yang cocok dengan “{query}”.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { other: '{n} digit' },
  'strip.period': '{n} dtk',
  'strip.next': 'berikutnya',
  'strip.seconds.abbr': 'dtk',
  'strip.seconds.title': 'detik',
  'strip.seconds.valid': 'berlaku',
  'strip.accountFallback': 'Akun {n}',
  'strip.copyAria': 'Salin kode untuk {name}',
  'strip.copyAnnounce': 'Kode {digits} tersalin',
  'strip.copyFailedHint': 'Penyalinan gagal. Sorot kodenya dengan tangan.',

  'fault.title': 'Baris tidak terbaca',

  'vault.state.off': 'Mati — tidak ada yang disimpan',
  'vault.state.locked': 'Terkunci — perlu frasa sandi',
  'vault.state.open': 'Terbuka — secret ada di bidang teks',
  'vault.explain':
    'Secara bawaan Clockwork tidak menyimpan apa pun. Jika lemari besi dinyalakan, ' +
    'masukan tetap di sini terenkripsi dengan frasa sandi Anda — tanpa itu blok yang ' +
    'tersimpan tidak berguna.',
  'vault.explain.crypto':
    'Kunci diturunkan dari frasa sandi lewat PBKDF2-SHA-256 dengan {iterations} iterasi, ' +
    'dan AES-256-GCM yang mengenkripsi. Hanya amplop tersegel yang disimpan: tidak pernah ' +
    'teks terbuka, tidak pernah frasa sandi, tidak pernah kunci turunan.',
  'vault.explain.more': 'Semua detail',
  'vault.pass.new': 'Frasa sandi baru',
  'vault.pass.existing': 'Frasa sandi',
  'vault.action.seal': 'Simpan terenkripsi',
  'vault.action.unseal': 'Buka',
  'vault.action.deriving': 'Kunci sedang diturunkan …',
  'vault.action.lock': 'Kunci',
  'vault.action.update': 'Simpan lagi',
  'vault.action.wipe': 'Hapus semua',
  'vault.action.wipeConfirm': 'Benar-benar dihapus?',
  'vault.timeout.label': 'Mengunci sendiri setelah',
  'vault.timeout.minutes': { other: '{n} menit' },
  'vault.lockOnHide': 'dan saat meninggalkan tab',

  'vault.error.nothingToStore': 'Tidak ada yang bisa disimpan — bidang teks kosong.',
  'vault.error.storageBlocked': 'Peramban tidak mengizinkan penyimpanan (mode pribadi?).',
  'vault.error.noVault': 'Tidak ada brankas yang tersimpan.',
  'vault.error.noPassphrase': 'Tanpa frasa sandi tidak ada kunci.',
  'vault.error.sealFailed': 'Penyimpanan gagal.',
  'vault.error.unsealFailed': 'Pembukaan gagal.',

  'vault.msg.sealed': 'Brankas tersimpan terenkripsi.',
  'vault.msg.resealed': 'Brankas dienkripsi ulang.',
  'vault.msg.unsealed': 'Brankas terbuka.',
  'vault.msg.locked': 'Brankas terkunci.',
  'vault.msg.wiped': 'Brankas terhapus.',
  'vault.msg.wipedNote': 'Terhapus. Tidak ada lagi yang tersisa di penyimpanan.',
  'vault.locked.idle': { other: 'Terkunci setelah {n} menit tanpa masukan.' },
  'vault.locked.hidden': 'Terkunci saat tab ditinggalkan.',

  'scan.noQr': 'Tidak ada kode QR yang terbaca pada gambar.',
  'scan.unreadable': 'Gambar tidak bisa dibaca — apakah itu memang gambar?',
  'scan.done': 'Kode QR terbaca dan disisipkan.',
  'scan.camera.unavailable':
    'Lingkungan ini tidak memberikan kamera. Ketika dibuka sebagai berkas (file://), ' +
    'kebanyakan peramban memblokirnya — “QR dari gambar” selalu berhasil.',
  'scan.camera.denied':
    'Kamera ditolak. Atur ulang izinnya di peramban — atau pakai “QR dari gambar”.',
  'scan.camera.notFound': 'Tidak ada kamera yang tersambung. “QR dari gambar” tetap berhasil.',
  'scan.camera.busy': 'Kamera sedang dipakai program lain.',
  'scan.camera.failed': 'Kamera tidak bisa dijalankan. “QR dari gambar” selalu berhasil.',

  'import.done': { other: '{n} akun diambil dari ekspor Google Authenticator' },
  'import.skipped': 'dilewati: {list}',
  'import.skip.hotp': '{label} (HOTP, berbasis pencacah)',
  'import.skip.algorithm': '{label} (algoritme tidak didukung)',
  'import.skip.emptySecret': '{label} (secret kosong)',
  'import.unnamed': 'Tanpa nama',
  'import.unreadable': 'Ekspor tidak terbaca.',

  'vacant.text':
    'Secret, tautan otpauth, atau gambar QR — tidak ada yang meninggalkan peramban ini.',
  'vacant.demo': 'Sisipkan kunci uji',
  'colophon.note': 'Tanpa jaringan · tanpa penyimpanan · HMAC lewat Web Crypto API',

  'lang.label': 'Bahasa',
  'lang.aria': 'Pilih bahasa',

  'err.base32.paddingInside': 'Karakter “=” hanya boleh berada di akhir (itu sekadar pengisi).',
  'err.base32.empty': 'Kunci secret kosong.',
  'err.base32.badChar':
    'Karakter tidak sah “{char}” pada posisi {position}. Base32 hanya mengenal A–Z dan 2–7 — ' +
    'angka 0, 1 dan 8 tidak muncul di dalamnya (tertukar dengan O, I dan B?).',
  'err.base32.badLength':
    'Panjang tidak sah: {length} karakter (tanpa spasi dan pengisi). Base32 mengodekan 5 bita ' +
    'menjadi 8 karakter; pada blok terakhir hanya mungkin 2, 4, 5, 7 atau 8 karakter. ' +
    'Kemungkinan besar ada satu karakter yang kurang atau satu yang berlebih.',

  'err.uri.invalid': 'Ini bukan URI yang sah. Yang diharapkan “otpauth://totp/…”.',
  'err.uri.scheme': 'Skema tidak dikenal “{scheme}”. Yang diharapkan “otpauth”.',
  'err.uri.hotp':
    'Ini URI HOTP (berbasis pencacah). Aplikasi ini hanya membuat kode TOTP berbasis waktu — ' +
    'untuk yang lain, keadaan pencacah harus disimpan.',
  'err.uri.type': 'Jenis tidak dikenal “{type}”. Setelah “otpauth://” harus ada “totp”.',
  'err.uri.typeEmpty': '(kosong)',
  'err.uri.noSecret': 'Parameter “secret” tidak ada di URI.',
  'err.uri.badLabel':
    'Label URI mengandung pengodean persen yang rusak (misalnya sebuah “%” tunggal).',
  'err.uri.algorithm': 'Algoritme tidak dikenal “{value}”. Yang didukung SHA1, SHA256 dan SHA512.',
  'err.uri.digits': 'Nilai tidak sah untuk “digits”: {value}. Diizinkan {min} sampai {max}.',
  'err.uri.period': 'Nilai tidak sah untuk “period”: {value}. Diharapkan 1 sampai 3600 detik.',
  'err.uri.integer': 'Parameter “{name}” harus berupa bilangan bulat; ditemukan “{value}”.',

  'err.otp.digits': 'Jumlah digit tidak sah: {value}. Diizinkan {min} sampai {max}.',
  'err.otp.emptySecret': 'Secret kosong — tidak ada kode yang bisa dihitung darinya.',

  'err.line.unreadable': 'Baris ini tidak bisa dibaca.',

  'err.vault.openFailed':
    'Brankas tidak bisa dibuka. Frasa sandi salah — atau data yang tersimpan telah diubah.',
  'err.vault.badFormat': 'Data brankas yang tersimpan berformat tidak dikenal.',
  'err.vault.version': 'Versi brankas {version} tidak didukung (diharapkan: {expected}).',
  'err.vault.base64': 'Bidang “{field}” pada data brankas bukan Base64 yang sah.',
  'err.vault.iterations': 'Jumlah iterasi tidak sah: {value}.',

  'err.migration.notExport':
    'Ini bukan ekspor Google Authenticator. Yang diharapkan ' +
    '“otpauth-migration://offline?data=…”.',
  'err.migration.noData': 'Parameter “data” tidak ada di URI.',
  'err.migration.badPercent': 'Parameter “data” mengandung pengodean persen yang rusak.',
  'err.migration.badBase64': 'Parameter “data” bukan Base64 yang sah.',
  'err.migration.noAccounts': 'Tidak ada akun di dalam ekspor ini.',
} satisfies Strings;
