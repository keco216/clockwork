# Clockwork

**A TOTP authenticator that runs entirely on your device.** Two-factor codes are
computed locally from RFC 4226 and RFC 6238, implemented from scratch — no OTP
library, no network requests, and nothing stored unless you ask for it.

[![CI](https://github.com/keco216/clockwork/actions/workflows/ci.yml/badge.svg)](https://github.com/keco216/clockwork/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-F05A28.svg)](LICENSE)
[![Runtime dependencies: 1](https://img.shields.io/badge/runtime%20deps-1-F05A28.svg)](package.json)

**[Open the app](https://clockwork-sage.vercel.app)** ·
[Single-file download](https://github.com/keco216/clockwork/releases/latest/download/clockwork.html) ·
[F-Droid](https://f-droid.org/en/packages/io.github.keco216.clockwork/) ·
[Ausführliche deutsche Dokumentation](docs/README.de.md)

| Light                                          | Dark                                         |
| ---------------------------------------------- | -------------------------------------------- |
| ![Clockwork, light](docs/screenshot-light.png) | ![Clockwork, dark](docs/screenshot-dark.png) |

---

> [!IMPORTANT]
> **The Android signing key changed on 12 August 2026.** If you installed
> `clockwork.apk` from release v1.5.3 or earlier, the update will be refused —
> uninstall the old app and install the new one. **Uninstalling deletes a vault
> stored on that device**, so unlock it and copy your entries out as plain text
> first. The previous key was lost in a machine change; this is not a compromise
> and not a handover. Certificate SHA-256: `1685316f…aa53` → `d31e10a4…cf3f`.
> F-Droid and the web app are unaffected. [Details](docs/README.de.md#der-signaturschlüssel-hat-am-12082026-gewechselt)

## What it does

- **Generates TOTP codes** — SHA-1, SHA-256 or SHA-512, 6 to 8 digits, any
  period. The countdown is a 30-mark dial with a rotating hand, because a hand
  on a scale gives you a readable position.
- **Takes input in every shape you have it** — raw Base32, `otpauth://` URIs, a
  whole Google Authenticator export, or a QR code from the camera, a file, a
  drag or the clipboard. Broken lines get explained, not swallowed.
- **Optionally remembers your secrets** behind a passphrase: strictly opt-in,
  AES-256-GCM over PBKDF2-SHA-256 with 600,000 iterations, with an auto-lock.
  On Android the vault can also unlock with a fingerprint.
- **Speaks 37 languages**, all bundled, including right-to-left layouts.
- **Runs as a web app, a PWA, one self-contained HTML file, or a native
  Android app** — Kotlin and Jetpack Compose since v2.0.

## Why trust this?

An authenticator asks you to paste in the one secret that protects your
accounts. Every claim here is meant to be checked, not believed:

- **Verified against the standards, not against itself.** The suite runs all 10
  HOTP vectors from RFC 4226 appendix D and all 18 TOTP vectors from RFC 6238
  appendix B, on three levels — HMAC, truncation, final code. Base32 is checked
  against RFC 4648 section 10. Run `npm test` yourself: 594 tests. The native
  Android app runs its own 231 against the same vectors
  (`gradlew testDebugUnitTest`).
- **Offline by design, not by configuration.** After load the app makes no
  requests at all; the single-file build ships
  `Content-Security-Policy: connect-src 'none'`. The Android app declares **no
  INTERNET permission** — check it with `aapt2 dump badging`.
- **Zero storage is the default.** No `localStorage`, no cookies, no IndexedDB
  until you switch the vault on. Close the tab and the secrets are gone.
- **One runtime dependency**, [jsQR](https://github.com/cozmo/jsQR), only for
  turning pixels into text. It never touches the crypto path.
- **No analytics, no telemetry, no update pings, no external fonts.**

```bash
# The whole promise in one command, after `npm run build`:
for p in 'fetch(' XMLHttpRequest WebSocket sendBeacon EventSource; do
  echo "$p: $(grep -oF "$p" dist/clockwork.html | wc -l)"
done
# every count is 0
```

## Quick start

Use the [hosted app](https://clockwork-sage.vercel.app), install from
[F-Droid](https://f-droid.org/en/packages/io.github.keco216.clockwork/), or
download `clockwork.html` from the
[latest release](https://github.com/keco216/clockwork/releases/latest) and open
it locally — no server, no connection, no install.

From source:

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # 594 tests
npm run build      # dist/ (PWA) + dist/clockwork.html (single file)
```

To try it without a real account, use the RFC 4226 test key — Base32 for the
text `12345678901234567890`:

```
GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ
```

## The Android app is native since v2.0

Version 2.0 replaced the WebView shell with a **native app in Kotlin and
Jetpack Compose** — same application ID, so an existing 1.x install updates in
place (from the same source; see below). The arithmetic did not move: Base32,
HOTP, TOTP, the `otpauth://` parser and the protobuf reader are hand-written
here too and run against the same RFC vectors; only `javax.crypto` stands in
for `crypto.subtle`. The vault opens the same envelope with the same
passphrase — now optionally behind a fingerprint, whose key sits in the
Android Keystore and is invalidated the moment a new fingerprint is enrolled.
The passphrase remains the only way back in.

Worth knowing before you install:

- **Android 8.0 (API 26) or newer.** Below that, 1.5.4 stays the last version.
- **The permissions, all of them:** `CAMERA` (scanning QR codes),
  `USE_BIOMETRIC` plus `USE_FINGERPRINT` up to API 27 (vault unlock), and one
  signature-level permission androidx generates itself — verify with
  `aapt2 dump badging`. Still **no INTERNET**, and the app does not even let
  Play Services fetch an emoji font; very new emoji show as boxes instead.
- **One WebView moment remains, explained rather than hidden:** the first
  start after an update from 1.x reads the old shell's vault out of
  `localStorage`, once. In operation there is no browser engine.

The full story — what changed, what it costs, every number measured — is in
the [German documentation](docs/README.de.md#die-native-app-kotlin-ab-v20).

## Where you can get it — and why that matters

Android only accepts an update signed with the same key as the installed app.
Three channels, three signatures — none of them interchangeable:

| Source                                                                  | Who holds the signing key              |
| ----------------------------------------------------------------------- | -------------------------------------- |
| GitHub release                                                          | this project — SHA-256 `d31e10a4…cf3f` |
| [F-Droid](https://f-droid.org/en/packages/io.github.keco216.clockwork/) | F-Droid, with its own key              |
| Google Play — _closed testing, not public yet_                          | Google, via Play App Signing           |

**No two of them can update each other**, and Android will not let you install
one over the other. Switching source therefore means: **uninstall first — which
deletes a vault stored on that device** — then install from the new source. So
pick one source and stay with it, or unlock your vault and copy the entries out
as plain text before you switch.

Making F-Droid ship this project's own APK would need a reproducible build and
two extra fields in the catalogue recipe (`Binaries`, `AllowedAPKSigningKeys`).
Neither is in place: measured against F-Droid's build of the same commit, 14
entries still differ, all from toolchain versions rather than the recipe.
Details in the
[German documentation](docs/README.de.md#eine-signatur-für-beide-wege--der-stand-v154).

## Limits worth knowing

**Set up backup codes before you rely on any authenticator.** They are the only
thing that gets you back in when a secret is gone — no authenticator app can
help you there.

- **TOTP does not stop real-time phishing.** A fake login page can ask for your
  password _and_ your code and replay both. Only a method that checks the
  domain — passkeys or a FIDO2 key — closes that.
- **A stolen secret is stolen for good**, and nobody notices. The only cure is
  re-enrolling with the provider.
- **A wrong system clock produces wrong codes.** TOTP has no other anchor.
- **A compromised device compromises everything on it.**

Full threat model: [SECURITY.md](SECURITY.md). Privacy policy:
[clockwork-sage.vercel.app/privacy.html](https://clockwork-sage.vercel.app/privacy.html)
— nothing is collected, spelled out.

## Documentation

This README is deliberately short. Everything else lives in the
[**German long-form documentation**](docs/README.de.md): how TOTP works step by
step, why the vault is built the way it is, the design decisions, all measured
numbers, and the mistakes found along the way.

| Document                                                     | What is in it                                             |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| [`docs/README.de.md`](docs/README.de.md)                     | the full documentation (German)                           |
| [`docs/fdroid-vorbereitung.md`](docs/fdroid-vorbereitung.md) | F-Droid inclusion, build recipe, reproducibility findings |
| [`docs/play-store.md`](docs/play-store.md)                   | Google Play groundwork, data-safety answers               |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)                         | rules that keep the promises intact                       |
| [`SECURITY.md`](SECURITY.md)                                 | threat model and how to report a problem                  |

Translation fixes from native speakers are the most useful contribution — 35 of
the 37 languages were machine-translated, and no test can check how a sentence
sounds. Found a security problem? Please do not open a public issue; see
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 Kevin. The bundled fonts (Inter, Chivo Mono) are under the
SIL Open Font License; their licence texts sit next to them in
`src/assets/fonts/`.
