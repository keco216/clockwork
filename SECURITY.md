# Security Policy

Clockwork generates TOTP codes. If it is wrong, people lose access to their
accounts — or worse, keep using a code generator that leaks the one secret it
was built to protect. Security reports are welcome and will be taken seriously.

## Reporting a vulnerability

Email **kevincolic@outlook.com**. Please do not open a public issue for anything
that could put users at risk before it is fixed.

Useful in a report: what you did, what happened, what you expected, and the
browser and version. A proof of concept helps but is not required — a clear
description of the flaw is enough.

You should get a first response within a week. If a fix is needed, the release
notes will say what changed and credit you unless you prefer otherwise.

## Supported versions

The latest release on `main` is the only supported version. This is a single
static page with no server component; "updating" means reloading the hosted app
or downloading a newer `clockwork.html`.

## What this tool promises

These are the properties worth attacking. If you can break one of them, that is
a vulnerability:

- **No network at runtime.** After the page has loaded, Clockwork makes no
  requests of any kind — no CDNs, no fonts, no analytics, no telemetry, no
  update pings. The single-file build enforces this with
  `Content-Security-Policy: connect-src 'none'`; the hosted app sends the same
  policy as a real HTTP header.
- **No storage unless you ask for it.** By default nothing is written to
  `localStorage`, `sessionStorage`, IndexedDB or cookies. Close the tab and the
  secrets are gone. The optional vault is strictly opt-in and stores only an
  encrypted envelope — never plaintext, never the passphrase, never a derived
  key.
- **Cryptography only via the Web Crypto API.** HMAC-SHA-1/256/512 for the codes,
  PBKDF2-SHA-256 (600,000 iterations) and AES-256-GCM for the vault. No bundled
  crypto implementations. Key material is imported as `extractable: false`, so
  even our own code cannot read it back.
- **No input is ever treated as HTML.** Account rows are built by cloning
  `<template>` elements; every value goes in through `textContent`. There is no
  `innerHTML` and no `eval` anywhere, and `'unsafe-eval'` is not in the CSP.
- **The code is the whole product.** No build-time telemetry, no postinstall
  scripts of our own, exactly one runtime dependency (jsQR, for decoding QR
  images).

## Out of scope

Not because they do not matter, but because no web application can defend
against them:

- **A compromised device.** Malware, a hostile browser extension, or another
  user on the same account can read the secrets straight out of the input field.
  If the machine is owned, so is everything on it.
- **Phishing of the codes themselves.** A fake login page can ask for your
  password _and_ your six digits and replay both within seconds. Your code lives
  for 30 seconds; an attacker needs two. This is a limitation of TOTP as a
  standard, not of this implementation. The only defence is a method that checks
  the domain: passkeys or a FIDO2 security key.
- **A wrong system clock.** TOTP has no anchor other than the local clock. If it
  drifts by more than about 30 seconds, Clockwork produces valid codes for the
  wrong time window and the server rejects them.
- **A weak vault passphrase.** 600,000 PBKDF2 iterations make each guess
  expensive, not impossible. A short passphrase stays a short passphrase.
- **Shoulder surfing.** While the tab is open the codes are on screen. The
  **Clear** button and the vault's auto-lock limit that window.
- **Whoever serves you the page.** If you use the hosted app you also have to
  trust that the host serves the same file tomorrow as today. Downloading
  `clockwork.html` and opening it locally removes that party entirely — it is a
  static file you can read in a text editor.

## Verifying the claims yourself

Every promise above is meant to be checkable, not believed:

```bash
npm ci && npm test        # RFC 4226 / 6238 / 4648 test vectors, 514 tests
npm run build             # produces dist/ and dist/clockwork.html

# No network API survives into the bundle — expect 0 for every pattern
for p in 'fetch(' XMLHttpRequest WebSocket sendBeacon EventSource; do
  echo "$p: $(grep -oF "$p" dist/clockwork.html | wc -l)"
done
```

Then open `dist/clockwork.html` with the browser's network tab recording: one
request, the document itself.
