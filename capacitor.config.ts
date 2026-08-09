import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Der Android-Wrap trägt bewusst die EINZELDATEI, nicht den PWA-Build:
 *
 *   - Kein Service Worker. Die Dateien liegen ohnehin im APK — ein Cache über
 *     lokalen Dateien wäre eine zweite Update-Maschinerie ohne Nutzen. Updates
 *     kommen als neues APK, so wie es auf Android gedacht ist.
 *   - `connect-src 'none'`. Die schärfere CSP der Einzeldatei gilt damit
 *     wörtlich auch in der App: Sie KANN keine Netzwerkverbindung aufbauen.
 *
 * `scripts/android-web.mjs` legt dist/clockwork.html als index.html nach
 * dist-android/ — `npm run android` verkettet Bau, Kopie und Sync.
 *
 * Die App-ID folgt dem F-Droid-Muster für GitHub-Projekte: eine real
 * existierende, vom Projektkonto kontrollierte Domäne (github.com/keco216),
 * rückwärts gelesen. Eine erfundene com.-Adresse wäre eine Behauptung.
 */
const config: CapacitorConfig = {
  appId: 'io.github.keco216.clockwork',
  appName: 'Clockwork',
  webDir: 'dist-android',
  android: {
    // Die Oberfläche braucht color-mix() in oklab (tokens.css, seit v1.3.0);
    // das kann der System-WebView ab Chromium 111. Ältere WebViews bekämen
    // kaputte Farben ohne Fehlermeldung — Capacitor zeigt unterhalb dieser
    // Grenze stattdessen einen ehrlichen Hinweis auf das WebView-Update.
    minWebViewVersion: 111,
  },
};

export default config;
