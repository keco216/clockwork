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
- **Speaks 37 languages**, all bundled, including right-to-left layouts.
- **Runs as a web app, a PWA, one self-contained HTML file, or an Android app.**

## Why trust this?

An authenticator asks you to paste in the one secret that protects your
accounts. Every claim here is meant to be checked, not believed:

- **Verified against the standards, not against itself.** The suite runs all 10
  HOTP vectors from RFC 4226 appendix D and all 18 TOTP vectors from RFC 6238
  appendix B, on three levels — HMAC, truncation, final code. Base32 is checked
  against RFC 4648 section 10. Run `npm test` yourself: 548 tests.
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
npm test           # 548 tests
npm run build      # dist/ (PWA) + dist/clockwork.html (single file)
```

To try it without a real account, use the RFC 4226 test key — Base32 for the
text `12345678901234567890`:

```
GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ
```

## Where you can get it — and why that matters

Android only accepts an update signed with the same key as the installed app.
Each source signs with its own:

| Source                                                                  | Who signs                              |
| ----------------------------------------------------------------------- | -------------------------------------- |
| GitHub release                                                          | this project — SHA-256 `d31e10a4…cf3f` |
| [F-Droid](https://f-droid.org/en/packages/io.github.keco216.clockwork/) | F-Droid, with its own key              |
| Google Play — _prepared, not published yet_                             | Google, via Play App Signing           |

**No two of them can update each other.** Pick one source and stay with it; if
you switch, copy your vault entries out as text before uninstalling. Making
F-Droid ship this project's own APK would need a reproducible build — measured
against F-Droid's build of the same commit, 14 entries still differ, all from
toolchain versions rather than the recipe. Details in the
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
