import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/', 'dist-single/', 'node_modules/', 'coverage/'] },

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
    files: ['scripts/**/*.mjs', 'vite.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },

  // Muss zuletzt stehen: schaltet alle Regeln ab, die Prettier ohnehin regelt.
  prettier,
);
