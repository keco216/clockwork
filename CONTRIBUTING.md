# Contributing

Thanks for looking. This is a small, deliberately old-fashioned codebase:
vanilla TypeScript, no framework, no CSS library, hand-written crypto against
the RFC test vectors. Everything below exists so that a change does not
accidentally cost the project the properties it was built for.

## Getting set up

```bash
npm install
npm run dev        # dev server on http://localhost:5173
```

Before you open a pull request, run the whole chain — CI runs exactly this:

```bash
npm run typecheck
npm run lint
npx prettier --check .
npm test
npm run build
```

Other scripts: `npm run format` (write), `npm run test:watch`, `npm run preview`,
`npm run shots` (Playwright walk-through plus screenshots).

`npm run shots` needs a server already running, and it expects port **5180**:

```bash
npx vite --port 5180 --strictPort &
node scripts/shoot.mjs http://localhost:5180
```

## Improving a translation — the most useful thing you can do

The interface speaks 37 languages. English is the source of truth, German is
the editorial reference, and **35 of the 37 were translated without a native
speaker**. The structure is tested — keys, placeholders, plural categories —
but no test can check whether a sentence sounds right.

These 14 are the ones worth looking at first. They have rich inflection where
the plural form depends on case, or a software vocabulary that is less settled
than English or German:

> Magyar · Slovenščina · Hrvatski · Română · Български · Ελληνικά · Eesti ·
> Latviešu · Lietuvių · العربية · עברית · हिन्दी · Tiếng Việt · ไทย

**Native-speaker corrections are explicitly welcome**, down to a single word.
A pull request that fixes one awkward sentence is a good pull request; you do
not need to review a whole file.

To change a text, edit `src/i18n/locales/<code>.ts`. Each file starts with a
glossary comment recording the terminology and register chosen for that
language — please keep those decisions consistent, or change them deliberately
and update the comment.

Then run `npm test`. The tests will tell you what is missing: a key, a
placeholder, a plural form that this language needs.

### Adding a language

1. Copy `src/i18n/locales/en.ts` to `xx.ts` and translate it. Keep the
   `satisfies Strings` at the end — that is what turns a forgotten key into a
   compiler error instead of a blank spot in the interface.
2. Import it in `src/i18n/catalogue.ts` and add it to the object.
3. Describe it in `src/i18n/registry.ts`: code, endonym, direction, script.

## Rules that are not up for negotiation

These are the reasons the project is worth using at all. A change that breaks
one of them will be turned down even if the code is good.

1. **No OTP libraries.** `base32`, `hotp`, `totp` and `otpauth-uri` are written
   from scratch. The only borrowed crypto primitive is `crypto.subtle`.
2. **No protobuf library.** `src/lib/protobuf.ts` is ours, about 120 lines.
3. **No i18n library.** `src/i18n/` is ours. The only borrowed pieces are
   `Intl.PluralRules` and `Intl.NumberFormat` — CLDR data every browser ships.
4. **`src/lib/` stays byte-identical.** It has not changed since v1 and is
   frozen on purpose: it is the part you have to trust. Check with
   `git diff <base>..HEAD -- src/lib/` — it must come back empty. One
   consequence: the German error messages thrown in there are not translated
   there, but at the boundary in `src/i18n/lib-text.ts`.
5. **No network request at runtime.** No CDNs, no external fonts, no analytics,
   no update pings. Everything is bundled. Measure after any change:
   ```bash
   for p in 'fetch(' XMLHttpRequest WebSocket sendBeacon EventSource; do
     echo "$p: $(grep -oF "$p" dist/clockwork.html | wc -l)"
   done
   ```
   Every count must be 0.
6. **Nothing is stored without the vault.** No `localStorage`, no
   `sessionStorage`, no cookies. The vault is strictly opt-in and writes only
   the encrypted envelope.
7. **User input is never HTML.** Account rows are built by cloning
   `<template>`; every value goes in through `textContent`. No `innerHTML`, no
   `eval`.
8. **No UI or CSS framework.** Hand-written CSS with design tokens.
9. **Every language is bundled.** No `import()` per language — that would be a
   network request, and the single-file build forbids it via CSP. Fewer
   languages is a _build-time_ choice (`CLOCKWORK_LANGS`, see
   `scripts/locale-subset.ts`), and it deliberately does not apply to the dev
   server or the test run.
10. **No text in `src/ui/`.** Everything goes through `t()`. `ui-literals.test.ts`
    enforces it; exceptions need an entry there with a reason.

## Design system

The guiding idea is a **precision instrument** in the spirit of Dieter Rams,
softened since v5 by Apple's sense of material. The one rule that decided every
detail: **what you touch is soft, what you read is sharp.**

- **Every value comes from `src/styles/tokens.css`.** No component ever sets its
  own colour, size, radius, shadow or easing.
- **The palette is binding:** ink `#171614`, paper `#F5F3EF`, night `#131210`,
  signal `#F05A28`. Paper and night sit on the panels — they are the _housing_.
  `--ground` underneath them is a derived tone, the desk the device rests on.
- **Two signal tokens:** `--signal` (brand value, for marks and areas, 3:1 is
  enough) and `--signal-text` (deeper, 4.6:1, for small text on paper).
- **Exactly one accent**, only for states that mean something: the last five
  seconds, a confirmed copy, an open vault, the scanner frame. Never decoration.
- **Two typefaces**, local under `src/assets/fonts/`: Instrument Sans for the
  interface, Chivo Mono for the codes. No Google Fonts link.
- **No donut ring.** The countdown is a radial 30-mark scale with a rotating
  hand — the same geometry as the brand emblem.
- **Three radii and no more:** `--radius-panel` (18 px) for housing groups,
  `--radius-field` (12 px) for inputs, `--radius-inset` (8 px) for small parts,
  plus `--radius-key` for the pill every button is.
- **Five surface rungs, each with a job:** workbench → housing → recessed →
  panel → touched. Until v1.2.0 there were three, and one token stood for both
  "recessed" and "touched" — that is, for opposites. In dark mode the ladder
  climbs _upward_: night is the housing and the panels rise above it, because
  night on the panels leaves at most 1.122:1 of room underneath.
- **Two elevation levels and no more:** level 1 is a housing group on the
  ground, level 2 is the sticky masthead above everything. Every raised surface
  also carries a hairline — a shadow alone does not survive a high-contrast
  setting or a printout.
- **A height ladder for controls:** 32 px for the select, 40 px
  (`--control-h`) for fields and buttons, 44 px for the two disclosures
  (`--touch-min`), 48 px for a panel's one primary action, 24 px for chips.
- **Accounts are still not cards.** The _group_ is rounded and raised; the
  channel strips inside it stay strips, separated by hairlines that start
  behind the dial. Turning each account into its own card would undo the whole
  idea.
- **`backdrop-filter` does not appear at all.** Up to v1.1.0 it sat on the
  sticky masthead. It is gone: a cover plate you can see through is not one,
  and an opaque masthead has a contrast you can actually compute, because it no
  longer depends on whatever happens to scroll underneath it.
- **Grain only on the workbench**, outside the device. On a surface you read
  from, grain is not material — it is unrest.
- **No gradients, no glow.** Soft diffusion yes, glowing no. There is no shadow
  in the signal colour.
- **Springs for the surface, linear for the instrument.** UI motion uses
  `--ease-spring` at 150–350 ms. The countdown hand keeps computing linearly
  from the clock: a spring curve on a time display is a lie about time.

### Measure it, do not eyeball it

Three scripts exist because three claims cannot be checked by looking:

```bash
node scripts/check-bundle.mjs      # the offline promise, measured on the bundle
node scripts/check-contrast.mjs    # WCAG AA, measured on rendered pixels
node scripts/check-tokens.mjs      # no component sets its own values
```

`check-contrast.mjs` reads the pixels the browser actually painted — including
opacity and half-covering hairlines — rather than computing from tokens, because
overlapping surfaces only exist once something is drawn. It measures **92 pairs**
across both colour schemes, including the full matrix of every text step on
every surface of the ladder. Run it after any change to colours or opacity. It
needs a server on port 5180.

It also checks its own setup. If the "self-test" line fails, the measurement is
broken rather than the colour — the two self-tests require that the masthead
reads the same value over three very different test surfaces, which catches both
an accidentally transparent masthead and one the script never saw at all.

`check-tokens.mjs` reads the source instead: no component may set its own
spacing, colour or radius. It also compares the two `theme-color` meta tags
against `--case`, because those are the only place in the project where a
palette value has to be copied by hand — and copied values do not travel. They
had been stale for three versions before anyone noticed.

## Traps that have already caught someone

Kept here because each one cost real time:

- **`hidden` loses against your own display rules.** That is why
  `[hidden] { display: none !important }` sits in `style.css`. Do not remove it.
- **Cascade by `@import` order.** Two classes of equal specificity in different
  files are decided by import order. That is why `.field` carries the shared
  base _without_ a height and `.slot__field` / `.vault__pass` set theirs.
- **`background` on a mark container colours the whole rectangle.** For the
  scale marks set `color`, not `background`.
- **Check every regex on user input for catastrophic backtracking.** `/=+$/`
  was quadratic; there is a runtime regression test in `base32.test.ts`.
- **`URLSearchParams` destroys Base64** (`+` becomes a space). The migration
  parser cuts the raw value out by hand.
- **The Google export carries RAW secret bytes**, not Base32.
- **RFC 6238 appendix B uses three differently sized seeds** (20/32/64 bytes),
  even though the prose says "the same secret".
- **`grid-template-areas` fixes the column count itself.** Changing only
  `grid-template-columns` in a media query is not enough — the areas hold the
  old grid. That is how a channel strip once ran 60 px past the edge on a phone
  without showing up on any screenshot.
- **The browser paints before the script runs.** At this bundle size, anything
  JavaScript fills in afterwards is a layout shift. Whatever gets populated at
  startup needs its space reserved in the HTML.
- **A `?.` swallows typos too.** A dead selector in `shoot.mjs` silently showed
  nothing for a long time. In a checking script, print a finding instead.
- **Vite escapes attribute values.** In the built HTML the CSP reads
  `connect-src &#39;none&#39;`, not with real apostrophes. Searching the bundle
  for a CSP directive fails otherwise.
- **A Vite plugin that reads source needs `enforce: 'pre'`.** Otherwise Vite's
  esbuild pass has already reprinted the file, the line-wise search finds
  nothing — and what is left is a valid bundle that looks fine.

## Commits and pull requests

- Commit subjects follow `type(scope): summary` — `feat`, `fix`, `docs`,
  `test`, `perf`, `chore`. Existing history is in German and **ASCII only**
  (`fuer`, `kuenftige`); please keep both.
- Code comments explain **why**, not what. This started as a learning project
  and stayed one — a non-obvious decision deserves its reason next to it.
- Decisions the issue left open go in the README.
- Priority when weighing options: **security > design quality > simplicity.**

## Reporting a security problem

Please do not open a public issue. See [SECURITY.md](SECURITY.md).
