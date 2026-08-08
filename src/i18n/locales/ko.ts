/**
 * 한국어.
 *
 * 용어: 시크릿 (secret) · 금고 (vault) · 계정 · 암호 문구 (passphrase) ·
 *   항목 · 코드 · 문자판. 규격과 프로토콜 이름은 로마자 그대로 (Base32,
 *   SHA-1, otpauth) — 어디서나 그렇게 쓴다.
 * 문체: 해라체가 아닌 간결한 합쇼체 없이, 명사형과 평서형을 섞은 도구다운 말투.
 * 따옴표: “ … ”.
 * 숫자: 어디서나 로마 숫자. 코드는 다른 로그인 칸에 붙여 넣는 것이기 때문이다.
 * 복수: 한국어는 수에 따라 형태가 바뀌지 않으므로 CLDR 분류는 other 하나뿐.
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — TOTP 인증기',
  'meta.description':
    'Clockwork — TOTP 인증기. 2단계 인증 코드를 전부 브라우저 안에서 만든다. 네트워크 요청은 ' +
    '하나도 하지 않는다.',
  'brand.tagline': 'TOTP 인증기 · RFC 6238',
  'skip.toCodes': '코드로 건너뛰기',

  'status.line': '{connection} · {vault}',
  'status.offline': '오프라인',
  'status.vault.off': '아무것도 저장하지 않음',
  'status.vault.locked': '금고 잠김',
  'status.vault.open': '금고 열림',

  'zone.input': '입력',
  'zone.vault': '금고',
  'zone.codes': '코드',

  'input.legend': '한 줄에 한 항목',
  'input.help.formats': 'Base32, {nameSecret} 또는 {uri} — 섞어도 된다. {hash} 는 메모를 시작한다.',
  'input.help.images': 'QR 이미지는 여기로 끌어 놓거나 {paste} 로 붙여 넣어도 된다.',
  'input.help.migration': 'Google Authenticator 내보내기 ({migration}) 는 저절로 변환된다.',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { other: '계정 {n}개' },
  'input.count.errors': { other: '오류 {n}개' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': '비우기',
  'key.qrImage': '이미지에서 QR',
  'key.camera': '카메라',
  'key.cameraStop': '카메라 끄기',
  'key.copy': '복사',
  'key.copyDone': '복사함',
  'key.copyFailed': '실패',

  'viewfinder.hint': 'QR 코드를 테두리 안에 두기',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { other: '{n}자리' },
  'strip.period': '{n}초',
  'strip.next': '다음',
  'strip.seconds.abbr': '초',
  'strip.seconds.title': '초',
  'strip.seconds.valid': '유효',
  'strip.accountFallback': '계정 {n}',
  'strip.copyAria': '{name} 의 코드 복사',
  'strip.copyAnnounce': '코드 {digits} 복사함',
  'strip.copyFailedHint': '복사에 실패했다. 코드를 손으로 선택하기 바란다.',

  'fault.title': '읽을 수 없는 줄',

  'vault.state.off': '꺼짐 — 아무것도 저장하지 않음',
  'vault.state.locked': '잠김 — 암호 문구 필요',
  'vault.state.open': '열림 — 시크릿이 텍스트 칸에 있음',
  'vault.explain':
    'Clockwork 는 기본적으로 아무것도 저장하지 않는다. 원한다면 입력한 내용을 암호 문구로 ' +
    '암호화해 여기에 남겨 둘 수 있다. PBKDF2-SHA-256 을 {iterations}회 돌린 뒤 AES-256-GCM. ' +
    '암호 문구가 없으면 저장된 덩어리는 아무 쓸모가 없다.',
  'vault.pass.new': '새 암호 문구',
  'vault.pass.existing': '암호 문구',
  'vault.action.seal': '암호화해 저장',
  'vault.action.unseal': '열기',
  'vault.action.deriving': '키를 유도하는 중 …',
  'vault.action.lock': '잠그기',
  'vault.action.update': '다시 저장',
  'vault.action.wipe': '전부 지우기',
  'vault.action.wipeConfirm': '정말 지울까?',
  'vault.timeout.label': '이 시간이 지나면 저절로 잠긴다:',
  'vault.timeout.minutes': { other: '{n}분' },
  'vault.lockOnHide': '탭을 떠날 때도 잠근다',

  'vault.error.nothingToStore': '저장할 것이 없다 — 텍스트 칸이 비어 있다.',
  'vault.error.storageBlocked': '브라우저가 저장을 허용하지 않는다 (시크릿 모드?).',
  'vault.error.noVault': '저장된 금고가 없다.',
  'vault.error.noPassphrase': '암호 문구가 없으면 키도 없다.',
  'vault.error.sealFailed': '저장에 실패했다.',
  'vault.error.unsealFailed': '여는 데 실패했다.',

  'vault.msg.sealed': '금고를 암호화해 저장했다.',
  'vault.msg.resealed': '금고를 다시 암호화했다.',
  'vault.msg.unsealed': '금고를 열었다.',
  'vault.msg.locked': '금고를 잠갔다.',
  'vault.msg.wiped': '금고를 지웠다.',
  'vault.msg.wipedNote': '지웠다. 저장 공간에 남은 것이 없다.',
  'vault.locked.idle': { other: '{n}분 동안 입력이 없어 잠갔다.' },
  'vault.locked.hidden': '탭을 떠나서 잠갔다.',

  'scan.noQr': '이미지에서 QR 코드를 알아볼 수 없었다.',
  'scan.unreadable': '이미지를 읽을 수 없었다 — 정말 이미지인가?',
  'scan.done': 'QR 코드를 읽어 넣었다.',
  'scan.camera.unavailable':
    '이 환경은 카메라를 내주지 않는다. 파일로 열면 (file://) 대부분의 브라우저가 카메라를 ' +
    '막는다 — “이미지에서 QR” 은 언제나 된다.',
  'scan.camera.denied':
    '카메라가 거부되었다. 브라우저에서 권한을 다시 설정하거나 “이미지에서 QR” 을 쓰기 바란다.',
  'scan.camera.notFound': '연결된 카메라가 없다. “이미지에서 QR” 은 그래도 된다.',
  'scan.camera.busy': '지금 다른 프로그램이 카메라를 쓰고 있다.',
  'scan.camera.failed': '카메라를 켜지 못했다. “이미지에서 QR” 은 언제나 된다.',

  'import.done': { other: 'Google Authenticator 내보내기에서 계정 {n}개를 가져왔다' },
  'import.skipped': '건너뜀: {list}',
  'import.skip.hotp': '{label} (HOTP, 카운터 방식)',
  'import.skip.algorithm': '{label} (지원하지 않는 알고리즘)',
  'import.skip.emptySecret': '{label} (빈 시크릿)',
  'import.unnamed': '이름 없음',
  'import.unreadable': '내보내기를 읽을 수 없다.',

  'vacant.text': '아직 입력한 것이 없다. 위에 시크릿을 넣기.',
  'colophon.note': '네트워크 없음 · 저장 없음 · HMAC 은 Web Crypto API 로',

  'lang.label': '언어',
  'lang.aria': '언어 선택',

  'err.base32.paddingInside': '문자 “=” 는 끝에만 올 수 있다 (채움일 뿐이다).',
  'err.base32.empty': '시크릿 키가 비어 있다.',
  'err.base32.badChar':
    '{position}번째 자리에 잘못된 문자 “{char}”. Base32 는 A–Z 와 2–7 만 안다 — 숫자 0, 1, 8 ' +
    '은 나오지 않는다 (O, I, B 와 헷갈렸을까?).',
  'err.base32.badLength':
    '잘못된 길이: {length}자 (공백과 채움 제외). Base32 는 5바이트를 8자로 부호화한다. ' +
    '마지막 덩어리에는 2, 4, 5, 7, 8자만 들어갈 수 있다. 한 자가 모자라거나 한 자가 남는 ' +
    '듯하다.',

  'err.uri.invalid': '올바른 URI 가 아니다. “otpauth://totp/…” 를 기대한다.',
  'err.uri.scheme': '알 수 없는 스킴 “{scheme}”. “otpauth” 를 기대한다.',
  'err.uri.hotp':
    'HOTP URI (카운터 방식) 다. 이 앱은 시간 기반 TOTP 코드만 만든다 — 그쪽은 카운터 값을 ' +
    '저장해야 한다.',
  'err.uri.type': '알 수 없는 종류 “{type}”. “otpauth://” 다음에는 “totp” 가 와야 한다.',
  'err.uri.typeEmpty': '(비어 있음)',
  'err.uri.noSecret': 'URI 에 “secret” 매개변수가 없다.',
  'err.uri.badLabel': 'URI 의 라벨에 깨진 퍼센트 부호화가 있다 (예를 들어 홀로 있는 “%”).',
  'err.uri.algorithm': '알 수 없는 알고리즘 “{value}”. SHA1, SHA256, SHA512 를 지원한다.',
  'err.uri.digits': '“digits” 의 값이 잘못됨: {value}. {min}부터 {max}까지 허용한다.',
  'err.uri.period': '“period” 의 값이 잘못됨: {value}. 1초부터 3600초까지 기대한다.',
  'err.uri.integer': '매개변수 “{name}” 은 정수여야 한다. 찾은 값은 “{value}”.',

  'err.otp.digits': '자릿수가 잘못됨: {value}. {min}부터 {max}까지 허용한다.',
  'err.otp.emptySecret': '시크릿이 비어 있다 — 그것으로는 코드를 계산할 수 없다.',

  'err.line.unreadable': '이 줄은 읽을 수 없었다.',

  'err.vault.openFailed': '금고를 열지 못했다. 암호 문구가 틀렸거나 저장된 데이터가 바뀌었다.',
  'err.vault.badFormat': '저장된 금고 데이터의 형식을 알 수 없다.',
  'err.vault.version': '금고 버전 {version} 은 지원하지 않는다 (기대: {expected}).',
  'err.vault.base64': '금고 데이터의 “{field}” 항목이 올바른 Base64 가 아니다.',
  'err.vault.iterations': '반복 횟수가 잘못됨: {value}.',

  'err.migration.notExport':
    'Google Authenticator 내보내기가 아니다. “otpauth-migration://offline?data=…” 를 ' +
    '기대한다.',
  'err.migration.noData': 'URI 에 “data” 매개변수가 없다.',
  'err.migration.badPercent': '“data” 매개변수에 깨진 퍼센트 부호화가 있다.',
  'err.migration.badBase64': '“data” 매개변수가 올바른 Base64 가 아니다.',
  'err.migration.noAccounts': '이 내보내기에는 계정이 하나도 없다.',
} satisfies Strings;
