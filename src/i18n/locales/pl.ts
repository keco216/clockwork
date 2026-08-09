/**
 * Polski.
 *
 * Słownik: secret · sejf (vault) · konto · hasło (passphrase) · wpis · kod ·
 *   tarcza. „Secret” zostaje w oryginale — tak nazywają to sami dostawcy.
 *   „Hasło” zamiast dosłownej „frazy hasłowej”: w aplikacji nie ma żadnego
 *   innego hasła, więc nie ma czego mylić, a przyciski zostają krótkie.
 * Rejestr: bezosobowy, rzeczowy — jak w narzędziach dla programistów.
 * Cudzysłowy: „ … ”, zgodnie z polską typografią.
 * Liczba mnoga: cztery formy CLDR — one (1), few (2–4, 22–24…),
 *   many (0, 5–21, 25–31…), other (ułamki).
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — uwierzytelnianie TOTP',
  'meta.description':
    'Clockwork — generator kodów TOTP. Tworzy kody dwuskładnikowe w całości w przeglądarce, ' +
    'bez żadnych zapytań sieciowych.',
  'brand.tagline': 'Uwierzytelnianie TOTP · RFC 6238',
  'skip.toCodes': 'Przejdź do kodów',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Bez sieci',
  'status.vault.off': 'nic nie jest zapisywane',
  'status.vault.locked': 'sejf zamknięty',
  'status.vault.open': 'sejf otwarty',

  'zone.input': 'Wejście',
  'zone.vault': 'Sejf',
  'zone.codes': 'Kody',

  'input.legend': 'Jeden wpis w wierszu',
  'input.placeholder':
    'np. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} albo {uri} — pomieszane. {hash} zaczyna notatkę.',
  'input.help.images': 'Obrazy z kodem QR można też tu przeciągnąć albo wkleić przez {paste}.',
  'input.help.migration':
    'Eksporty z Google Authenticatora ({migration}) są przekształcane automatycznie.',
  'input.help.more': 'Wszystkie formaty wejściowe',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': {
    one: '{n} konto',
    few: '{n} konta',
    many: '{n} kont',
    other: '{n} konta',
  },
  'input.count.errors': {
    one: '{n} błąd',
    few: '{n} błędy',
    many: '{n} błędów',
    other: '{n} błędu',
  },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Wyczyść',
  'key.qrImage': 'QR z obrazu',
  'key.camera': 'Kamera',
  'key.cameraStop': 'Wyłącz kamerę',
  'key.copy': 'Kopiuj',
  'key.copyDone': 'Skopiowano',
  'key.copyFailed': 'Nie udało się',

  'viewfinder.hint': 'Trzymaj kod QR w ramce',

  'filter.label': 'Filtruj konta',
  'filter.placeholder': 'Filtruj według nazwy',
  'filter.empty': 'Nic nie pasuje do „{query}”.',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': {
    one: '{n} cyfra',
    few: '{n} cyfry',
    many: '{n} cyfr',
    other: '{n} cyfry',
  },
  'strip.period': '{n} s',
  'strip.next': 'następny',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'sekundy',
  'strip.seconds.valid': 'ważny',
  'strip.accountFallback': 'Konto {n}',
  'strip.copyAria': 'Skopiuj kod dla {name}',
  'strip.copyAnnounce': 'Skopiowano kod {digits}',
  'strip.copyFailedHint': 'Kopiowanie się nie udało. Zaznacz kod ręcznie.',

  'fault.title': 'Wiersz nieczytelny',

  'vault.state.off': 'Wyłączony — nic nie jest zapisywane',
  'vault.state.locked': 'Zamknięty — potrzebne hasło',
  'vault.state.open': 'Otwarty — secrety są w polu tekstowym',
  'vault.explain':
    'Domyślnie Clockwork nie zapisuje niczego. Po włączeniu sejfu wpisane dane zostają ' +
    'tutaj zaszyfrowane hasłem — bez niego zapisany blok jest bezwartościowy.',
  'vault.explain.crypto':
    'Klucz powstaje z hasła przez PBKDF2-SHA-256 z {iterations} iteracjami, a szyfruje ' +
    'AES-256-GCM. Zapisywana jest tylko zamknięta koperta: nigdy jawny tekst, nigdy ' +
    'hasło, nigdy wyprowadzony klucz.',
  'vault.explain.more': 'Wszystkie szczegóły',
  'vault.pass.new': 'Nowe hasło',
  'vault.pass.existing': 'Hasło',
  'vault.action.seal': 'Zapisz zaszyfrowane',
  'vault.action.unseal': 'Otwórz',
  'vault.action.deriving': 'Wyprowadzanie klucza …',
  'vault.action.lock': 'Zamknij',
  'vault.action.update': 'Zapisz ponownie',
  'vault.action.wipe': 'Usuń wszystko',
  'vault.action.wipeConfirm': 'Na pewno usunąć?',
  'vault.timeout.label': 'Zamyka się sam po',
  'vault.timeout.minutes': {
    one: '{n} minucie',
    few: '{n} minutach',
    many: '{n} minutach',
    other: '{n} minuty',
  },
  'vault.lockOnHide': 'oraz przy opuszczeniu karty',

  'vault.error.nothingToStore': 'Nie ma czego zapisać — pole tekstowe jest puste.',
  'vault.error.storageBlocked': 'Przeglądarka nie pozwala zapisywać (tryb prywatny?).',
  'vault.error.noVault': 'Żaden sejf nie jest zapisany.',
  'vault.error.noPassphrase': 'Bez hasła nie ma klucza.',
  'vault.error.sealFailed': 'Zapis się nie powiódł.',
  'vault.error.unsealFailed': 'Otwarcie się nie powiodło.',

  'vault.msg.sealed': 'Sejf zapisany w postaci zaszyfrowanej.',
  'vault.msg.resealed': 'Sejf zaszyfrowany ponownie.',
  'vault.msg.unsealed': 'Sejf otwarty.',
  'vault.msg.locked': 'Sejf zamknięty.',
  'vault.msg.wiped': 'Sejf usunięty.',
  'vault.msg.wipedNote': 'Usunięty. W pamięci nic już nie zostało.',
  'vault.locked.idle': {
    one: 'Zamknięty po {n} minucie bez wpisywania.',
    few: 'Zamknięty po {n} minutach bez wpisywania.',
    many: 'Zamknięty po {n} minutach bez wpisywania.',
    other: 'Zamknięty po {n} minuty bez wpisywania.',
  },
  'vault.locked.hidden': 'Zamknięty przy opuszczeniu karty.',

  'scan.noQr': 'Na obrazie nie udało się rozpoznać żadnego kodu QR.',
  'scan.unreadable': 'Nie udało się odczytać obrazu — czy to na pewno obraz?',
  'scan.done': 'Kod QR odczytany i wstawiony.',
  'scan.camera.unavailable':
    'To środowisko nie udostępnia kamery. Przy otwarciu jako plik (file://) większość ' +
    'przeglądarek ją blokuje — „QR z obrazu” działa zawsze.',
  'scan.camera.denied':
    'Odmówiono dostępu do kamery. Zresetuj uprawnienie w przeglądarce — albo użyj ' +
    '„QR z obrazu”.',
  'scan.camera.notFound': 'Nie podłączono żadnej kamery. „QR z obrazu” i tak działa.',
  'scan.camera.busy': 'Kamera jest właśnie używana przez inny program.',
  'scan.camera.failed': 'Nie udało się uruchomić kamery. „QR z obrazu” działa zawsze.',

  'import.done': {
    one: 'Przejęto {n} konto z eksportu Google Authenticatora',
    few: 'Przejęto {n} konta z eksportu Google Authenticatora',
    many: 'Przejęto {n} kont z eksportu Google Authenticatora',
    other: 'Przejęto {n} konta z eksportu Google Authenticatora',
  },
  'import.skipped': 'pominięto: {list}',
  'import.skip.hotp': '{label} (HOTP, oparty na liczniku)',
  'import.skip.algorithm': '{label} (nieobsługiwany algorytm)',
  'import.skip.emptySecret': '{label} (pusty secret)',
  'import.unnamed': 'Bez nazwy',
  'import.unreadable': 'Eksport nieczytelny.',

  'vacant.text': 'Secret, link otpauth albo obraz QR — nic z tego nie opuszcza tej przeglądarki.',
  'vacant.demo': 'Wstaw klucz testowy',
  'colophon.note': 'Bez sieci · bez zapisu · HMAC przez Web Crypto API',

  'lang.label': 'Język',
  'lang.aria': 'Wybierz język',

  'err.base32.paddingInside': 'Znak „=” może stać tylko na końcu (to wyłącznie wypełnienie).',
  'err.base32.empty': 'Klucz secret jest pusty.',
  'err.base32.badChar':
    'Nieprawidłowy znak „{char}” na pozycji {position}. Base32 zna tylko A–Z i 2–7 — cyfry ' +
    '0, 1 i 8 w nim nie występują (pomylone z O, I i B?).',
  'err.base32.badLength':
    'Nieprawidłowa długość: {length} znaków (bez spacji i wypełnienia). Base32 koduje 5 ' +
    'bajtów w 8 znakach; w ostatnim bloku możliwe są tylko 2, 4, 5, 7 lub 8 znaków. ' +
    'Prawdopodobnie brakuje znaku albo jest jeden za dużo.',

  'err.uri.invalid': 'To nie jest prawidłowy URI. Oczekiwano „otpauth://totp/…”.',
  'err.uri.scheme': 'Nieznany schemat „{scheme}”. Oczekiwano „otpauth”.',
  'err.uri.hotp':
    'To jest URI typu HOTP (oparty na liczniku). Ta aplikacja tworzy wyłącznie kody TOTP ' +
    'oparte na czasie — inaczej trzeba by zapisywać stan licznika.',
  'err.uri.type': 'Nieznany typ „{type}”. Po „otpauth://” musi stać „totp”.',
  'err.uri.typeEmpty': '(pusty)',
  'err.uri.noSecret': 'W URI brakuje parametru „secret”.',
  'err.uri.badLabel':
    'Etykieta URI zawiera uszkodzone kodowanie procentowe (na przykład pojedynczy „%”).',
  'err.uri.algorithm': 'Nieznany algorytm „{value}”. Obsługiwane są SHA1, SHA256 i SHA512.',
  'err.uri.digits': 'Nieprawidłowa wartość „digits”: {value}. Dozwolone od {min} do {max}.',
  'err.uri.period': 'Nieprawidłowa wartość „period”: {value}. Oczekiwano od 1 do 3600 sekund.',
  'err.uri.integer': 'Parametr „{name}” musi być liczbą całkowitą; znaleziono „{value}”.',

  'err.otp.digits': 'Nieprawidłowa liczba cyfr: {value}. Dozwolone od {min} do {max}.',
  'err.otp.emptySecret': 'Secret jest pusty — nie da się z niego policzyć żadnego kodu.',

  'err.line.unreadable': 'Nie udało się odczytać tego wiersza.',

  'err.vault.openFailed':
    'Nie udało się otworzyć sejfu. Błędne hasło — albo zapisane dane zostały zmienione.',
  'err.vault.badFormat': 'Zapisane dane sejfu mają nieznany format.',
  'err.vault.version': 'Wersja sejfu {version} nie jest obsługiwana (oczekiwano: {expected}).',
  'err.vault.base64': 'Pole „{field}” danych sejfu nie jest prawidłowym Base64.',
  'err.vault.iterations': 'Nieprawidłowa liczba iteracji: {value}.',

  'err.migration.notExport':
    'To nie jest eksport z Google Authenticatora. Oczekiwano ' +
    '„otpauth-migration://offline?data=…”.',
  'err.migration.noData': 'W URI brakuje parametru „data”.',
  'err.migration.badPercent': 'Parametr „data” zawiera uszkodzone kodowanie procentowe.',
  'err.migration.badBase64': 'Parametr „data” nie jest prawidłowym Base64.',
  'err.migration.noAccounts': 'W tym eksporcie nie ma żadnych kont.',
} satisfies Strings;
