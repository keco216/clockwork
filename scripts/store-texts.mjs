/**
 * Die Store-Texte — EINE Quelle fuer zwei Baeume.
 *
 * Dieselbe Bauart wie `scripts/csp.ts` und `scripts/site.ts`: Was an zwei
 * Stellen ausgeliefert wird, steht an EINER Stelle im Quelltext, und ein Test
 * vergleicht das Ergebnis. `play/listing/<locale>/` geht an Play,
 * `fastlane/metadata/android/<locale>/` liest F-Droid direkt aus dem Repo —
 * beide zeigen denselben Eintrag, und ohne diese Datei driften sie beim
 * naechsten Release auseinander, weil jeder Kanal fuer sich plausibel aussieht
 * (N23).
 *
 * Geschrieben werden die Dateien von `scripts/store-listing.mjs`.
 *
 * ── Warum diese Texte so aussehen ─────────────────────────────────────────
 * Drei Befunde aus dem ASO-Durchgang (15.08.2026), alle drei am Ist-Stand
 * gemessen und nicht geraten:
 *
 *   1. Der Titel verschenkte alles. „Clockwork" sind 9 von 30 Zeichen und
 *      kein Suchwort — gesucht wird nach „authenticator", „2FA", „TOTP".
 *      Der Titel wiegt beim Ranking schwerer als jedes andere Feld.
 *   2. Die Langbeschreibung beschrieb die 1.x-App („Einzeldatei-Bau, getragen
 *      von einem System-WebView"). Fuer 2.0 ist das falsch — und der
 *      WebView-Satz war auch vorher ein Nachteil im Schaufenster: Er klang
 *      nach Behelf, obwohl er ehrlich gemeint war.
 *   3. Das staerkste Argument stand zu weit hinten. Aegis, 2FAS und Ente haben
 *      alle Netzzugriff (Sync, Icons, Update-Pruefung). Clockwork hat die
 *      BERECHTIGUNG nicht, und das kann jeder im Manifest nachsehen. Es gehoert
 *      in Titelnaehe, in die Kurzbeschreibung und in den ersten Absatz.
 *
 * Jede Zusage in diesen Texten ist im Repo nachpruefbar. Das ist ihre Staerke
 * und ihre Verpflichtung: Wer eine Zeile aendert, prueft sie am Endstand nach.
 */

/** Die Grenzen der Play Console, Stand August 2026. F-Droid ist grosszuegiger. */
export const GRENZEN = {
  title: 30,
  short_description: 80,
  full_description: 4000,
  /* Play zeigt „Neu in dieser Version" bis 500 Zeichen, F-Droid schneidet
     laengere Eintraege ebenfalls ab. Also 500 fuer beide. */
  changelog: 500,
};

/* Der versionCode, zu dem der Changelog gehoert, stand bis D1b hier als harte
   Zahl. Er kommt jetzt aus `scripts/version.mjs`, also aus `package.json` —
   `store-listing.mjs` holt ihn direkt von dort. Eine Konstante an dieser
   Stelle waere eine zweite Quelle gewesen, und genau die ist beim Sprung von
   2.0.0 auf 2.0.1 aufgefallen. */

export const TEXTE = {
  'en-US': {
    title: 'Clockwork: 2FA Authenticator',
    short_description: 'Offline 2FA authenticator: TOTP codes, no network permission, no accounts.',
    full_description: `Clockwork is a two-factor authenticator (2FA) that generates TOTP codes entirely on your device. It declares no INTERNET permission at all — the app cannot open a connection, and you can check that in the manifest before you believe a word of this.

That is the difference. Most authenticator apps hold network access for sync, service icons or update checks. Clockwork does not have the permission, so the question never comes up.

WHAT IT DOES
• Generates TOTP codes (RFC 6238) — SHA-1, SHA-256 or SHA-512, 6 to 8 digits, any period.
• Add accounts the way you happen to have them: scan a QR code, import a QR image, paste an otpauth:// link, or type a Base32 secret. A full Google Authenticator export is converted automatically.
• A dial with 30 marks and a moving hand shows the time left — a position you read at a glance, not a shrinking bar.
• One tap copies the code, and the next one is on screen before it becomes valid.
• Broken input is explained line by line, never silently swallowed.

YOUR SECRETS STAY YOURS
• By default nothing is stored at all. Close the app and the secrets are gone.
• Switch the vault on and they stay here, encrypted with your passphrase: AES-256-GCM, key derived by PBKDF2-SHA-256 with 600,000 iterations. Only the sealed envelope is written to disk — never the plaintext, never the passphrase, never the derived key.
• Unlock with your fingerprint if you want to. The passphrase stays the only way back in.
• Locks automatically after a time you choose and when you leave the app. Screenshots and preview images can be blocked.
• Android backup is switched off, so the encrypted vault never leaves the device.

PRIVACY
Nothing is collected, because there is nowhere for it to go. No analytics, no telemetry, no update pings, no advertising identifiers, no accounts, no ads. The camera permission serves the QR scanner alone and is declared optional hardware — importing a QR image works without it.

BUILT TO BE CHECKED
Open source under the MIT licence. The OTP algorithms are written from scratch against the RFC test vectors — no OTP library. Source code, test suite and the measurement scripts behind every claim above are public at github.com/keco216/clockwork.

Speaks 37 languages, all bundled, including right-to-left layouts.

Android 8.0 or newer. On Android 7, 1.5.4 stays the final version.

One thing, independent of this app: set up backup codes with every provider before you rely on any authenticator. They are the only thing that gets you back in when a secret is gone.`,
    changelog: `Clockwork 2.0 is a native Android app, rewritten in Kotlin and Jetpack Compose — no browser engine any more.

• Android 8.0 or newer. On Android 7, 1.5.4 stays the final version.
• An existing vault is carried over on update — nothing to export, nothing to type again.
• Unlock with your fingerprint. The passphrase stays the only way back in.
• Still no INTERNET permission.`,
  },

  'de-DE': {
    title: 'Clockwork: 2FA-Authenticator',
    short_description:
      'Offline-2FA-Authenticator: TOTP-Codes ohne Netzwerk-Berechtigung, ohne Konto.',
    full_description: `Clockwork ist ein Zwei-Faktor-Authenticator (2FA), der TOTP-Codes vollständig auf deinem Gerät erzeugt. Die App deklariert keine INTERNET-Berechtigung — sie kann keine Verbindung öffnen, und das steht für jeden nachlesbar im Manifest, bevor man ein Wort davon glaubt.

Das ist der Unterschied. Die meisten Authenticator-Apps halten Netzzugriff für Sync, Dienst-Icons oder Update-Prüfungen. Clockwork hat die Berechtigung nicht, also stellt sich die Frage gar nicht.

WAS SIE KANN
• TOTP-Codes nach RFC 6238 — SHA-1, SHA-256 oder SHA-512, 6 bis 8 Stellen, beliebige Periode.
• Konten hinzufügen, wie du sie gerade hast: QR-Code scannen, QR-Bild importieren, otpauth://-Link einfügen oder Base32-Secret tippen. Ein kompletter Google-Authenticator-Export wird automatisch umgewandelt.
• Ein Zifferblatt mit 30er-Teilung und wanderndem Zeiger zeigt die Restzeit — eine Position, die man auf einen Blick abliest, kein schrumpfender Balken.
• Ein Tipp kopiert den Code, und der nächste steht schon da, bevor er gilt.
• Kaputte Eingaben werden Zeile für Zeile erklärt statt still verschluckt.

DEINE SECRETS BLEIBEN DEINE
• Voreingestellt wird gar nichts gespeichert. App zu, Secrets weg.
• Schaltest du den Tresor ein, bleiben sie hier — verschlüsselt mit deiner Passphrase: AES-256-GCM, Schlüssel abgeleitet per PBKDF2-SHA-256 mit 600.000 Iterationen. Auf die Platte geht nur der versiegelte Umschlag: nie der Klartext, nie die Passphrase, nie der abgeleitete Schlüssel.
• Aufsperren per Fingerabdruck, wenn du magst. Die Passphrase bleibt der einzige Weg zurück.
• Sperrt automatisch nach einer Zeit deiner Wahl und beim Verlassen der App. Bildschirmfotos und Vorschaubilder lassen sich sperren.
• Das Android-Backup ist abgeschaltet — der verschlüsselte Tresor verlässt das Gerät nicht.

DATENSCHUTZ
Es wird nichts erhoben, weil es nirgendwo hingehen könnte. Kein Analytics, keine Telemetrie, keine Update-Abfragen, keine Werbe-Kennungen, keine Konten, keine Werbung. Die Kamera-Berechtigung dient allein dem QR-Sucher und ist als freiwillige Hardware deklariert — QR aus Bild funktioniert ohne sie.

ZUM NACHPRÜFEN GEBAUT
Open Source unter der MIT-Lizenz. Die OTP-Algorithmen sind von Hand nach den RFC-Testvektoren geschrieben — keine OTP-Bibliothek. Quelltext, Testlauf und die Messskripte hinter jeder Zusage oben liegen öffentlich unter github.com/keco216/clockwork.

Spricht 37 Sprachen, alle mitgebündelt, auch Layouts von rechts nach links.

Ab Android 8.0. Auf Android 7 bleibt 1.5.4 die letzte Fassung.

Eine Sache, unabhängig von dieser App: Richte bei jedem Anbieter Backup-Codes ein, bevor du dich auf einen Authenticator verlässt. Sie sind das Einzige, was dich wieder hineinlässt, wenn ein Secret weg ist.`,
    changelog: `Clockwork 2.0 ist eine native Android-App, neu geschrieben in Kotlin und Jetpack Compose — keine Browser-Engine mehr.

• Ab Android 8.0. Auf Android 7 bleibt 1.5.4 die letzte Fassung.
• Ein vorhandener Tresor wandert beim Update von selbst mit — nichts exportieren, nichts neu tippen.
• Aufsperren per Fingerabdruck. Die Passphrase bleibt der einzige Weg zurück.
• Weiterhin keine INTERNET-Berechtigung.`,
  },
};
