import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'dist-single/',
      'dist-test/',
      'dist-android/',
      'node_modules/',
      'coverage/',
      'android/',
      // Der Kotlin-Zweig baut nach android-native/**/build/. Darin liegt unter
      // anderem Gradles HTML-Testbericht mit eigenem JavaScript — Bauergebnis,
      // kein Quelltext. In der CI faellt das nicht auf (dort laeuft kein
      // Gradle), lokal sonst schon.
      'android-native/',
    ],
  },

  js.configs.recommended,

  // Typ-gestützte Regeln: fängt z. B. `no-floating-promises` ab — in einer App,
  // die dauernd `await crypto.subtle...` aufruft, ist das die wichtigste Regel.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Die Konfigurationsdateien selbst sind reines JS und stehen in keinem
  // tsconfig-Projekt — dort die typbasierten Regeln abschalten.
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  { files: ['src/**/*.ts'], languageOptions: { globals: globals.browser } },
  {
    files: ['src/**/*.test.ts'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['scripts/**/*.mjs', 'scripts/**/*.ts', 'vite.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // Die Playwright-Skripte laufen in Node, schicken aber Rückrufe über
    // `page.evaluate()` in den Browser — dort gibt es `document` und `window`.
    // Nur die, die das wirklich tun: `shoot-compare.mjs` fotografiert bloß und
    // braucht die Browser-Globals nicht, also soll es sie auch nicht bekommen.
    files: [
      'scripts/shoot.mjs',
      'scripts/check-contrast.mjs',
      'scripts/check-motion.mjs',
      'scripts/shoot-grid.mjs',
      'scripts/shoot-mobile.mjs',
      'scripts/shoot-play.mjs',
      // `store-frames.mjs` zeichnet die Store-Bilder in einem Canvas IM
      // Browser — `document`, `Image` und `FontFace` stehen dort, nicht in
      // Node. `store-shots.mjs` dagegen redet nur mit adb und bekommt sie
      // deshalb nicht.
      'scripts/store-frames.mjs',
    ],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },

  // Muss zuletzt stehen: schaltet alle Regeln ab, die Prettier ohnehin regelt.
  prettier,
);
