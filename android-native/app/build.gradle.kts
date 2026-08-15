import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

/* Signierung: derselbe Mechanismus wie in der 1.x-Fassung, damit es nur EINEN
   Weg gibt, an den Release-Schluessel zu kommen. Der Schluessel liegt
   AUSSERHALB des Repos; die Umgebungsvariable CLOCKWORK_KEYSTORE zeigt auf
   eine properties-Datei mit storeFile/storePassword/keyAlias/keyPassword.
   Ohne die Variable entsteht ein UNSIGNIERTES Release — wer klont, baut ohne
   Umbau, und weder Pfade noch Geheimnisse geraten ins Repo oder in die CI.

   Falle aus der Fallensammlung, hier nur zur Erinnerung: In key.properties muss jeder
   Backslash VERDOPPELT stehen. Gradle liest die Datei als Java-Properties, und
   dort entwertet der Backslash das naechste Zeichen — aus C:\Users\... wird
   sonst ein relativer Pfad, und Gradle sucht ihn unter .gradle\daemon\. */
val keystoreProps: Properties? = System.getenv("CLOCKWORK_KEYSTORE")
    ?.let { file(it) }
    ?.takeIf { it.exists() }
    ?.let { propsFile -> Properties().apply { propsFile.inputStream().use { load(it) } } }

/* ── Der Schalter fuer die Store-Bilder (N18) ───────────────────────────────
   Die Ueber-Karte zeigt die Version, die der PackageManager meldet — im
   Debug-Bau also „2.0.0-dev-debug (20000)". Auf einem Play-Bild waere das
   falsch: Ausgeliefert wird 2.0.0 (20000), und ein Store-Bild soll zeigen, was
   ankommt, nicht die Werkstattmarkierung.

   Deshalb NICHT den Versionsnamen im Bild nachtraeglich uebermalen (das waere
   die erfundene UI, die N18 ausdruecklich verbietet) und auch nicht `-dev`
   dauerhaft entfernen (das ist eine Release-Entscheidung, siehe
   Release-Checkliste der Projektnotizen). Stattdessen ein ausdruecklicher, opt-in
   Schalter: `-Pclockwork.storeShot` nimmt fuer diesen einen Bau die
   Werkstattmarkierungen aus dem Versionsnamen — und nur die. Die
   applicationId behaelt ihr `.dev`, der Bau bleibt also neben einer
   installierten 1.x gefahrlos, und in der Oberflaeche ist davon nichts zu
   sehen. `scripts/store-shots.mjs` setzt den Schalter und sagt es im Lauf an. */
val storeShot = providers.gradleProperty("clockwork.storeShot").isPresent

android {
    namespace = "io.github.keco216.clockwork"

    /* compileSdk und targetSdk sind aus android/variables.gradle ABGELESEN
       (beide 36), damit beide Fassungen dieselbe Plattform sehen. */
    compileSdk = 36

    defaultConfig {
        applicationId = "io.github.keco216.clockwork"

        /* minSdk 26 statt der 24 der WebView-Fassung — bewusst hoeher, und der
           Grund faellt mit dem WebView weg: Die 1.x-Fassung musste eine
           WebView-Untergrenze garantieren (111 wegen color-mix in oklab), die
           native Fassung rechnet gar nicht mehr im Browser. Was 26 dafuer
           mitbringt, wird hier tatsaechlich gebraucht:
             - java.time (Instant/Duration) ohne Desugaring-Krueckstock,
             - AES im Android-Keystore mit setUserAuthenticationRequired,
               also die Grundlage der Biometrie-Entsperrung (P7),
             - Variable-Font-Unterstuetzung im Ressourcensystem, ohne die
               Inter und Chivo Mono als je vier statische Schnitte einzoegen.
           Der Preis ist gemessen klein: Android 8.0 ist von 2017. */
        minSdk = 26
        targetSdk = 36

        /* Dieselbe Zaehlweise wie in 1.x: Major*10000 + Minor*100 + Patch.
           2.0.1 ist damit 20001 und liegt ueber jedem 1.x-Stand — die native
           Fassung kann die WebView-Fassung also spaeter als Update abloesen,
           was P8 (Tresor-Uebernahme) ueberhaupt erst moeglich macht.

           ── Warum nicht mehr 20000 (D1, 15.08.2026) ─────────────────────
           Der 2.0.0-Bau ist in den geschlossenen Test gegangen und trug dort
           einen bekannten Defekt: Play teilte das Bundle nach Sprachen auf,
           35 der 37 Sprachen kamen auf dem Geraet nie an (der bundle-Block
           weiter unten raeumt das weg). Play nimmt eine Nummer kein zweites
           Mal an — 20000 steht damit dauerhaft fuer den defekten Stand.

           Oeffentlich hat 2.0.0 nie existiert, nur zwei Tester im
           geschlossenen Test. Getrennte Nummern je Kanal waeren auf Dauer
           teurer als dieser eine Ziffernwechsel, deshalb geht 2.0.1 auf
           ALLE drei Kanaele: Play, F-Droid, GitHub. */
        versionCode = 20001

        /* Bis zum 15.08.2026 stand hier `if (storeShot) "2.0.0" else "2.0.0-dev"`.
           Das `-dev` war die Werkstattmarkierung des Zweigs, solange er nichts
           auslieferte — und es steckte NICHT im Debug-Suffix, ein Release-Bau
           haette es also in der Ueber-Karte gezeigt.

           Mit dem ersten Play-Bau ist der Zweig kein Prototyp mehr: Was hier
           steht, ist der Auslieferungsstand. `-dev` ist deshalb weg (Punkt 2
           der Release-Checkliste der Projektnotizen). Der Debug-Bau bleibt
           unterscheidbar — er traegt weiter `.dev` an der applicationId und
           `-debug` am Versionsnamen.

           Seit D1 steht hier 2.0.1 — die Begruendung fuer den Ziffernwechsel
           haengt am versionCode darueber. */
        versionName = "2.0.1"
    }

    signingConfigs {
        if (keystoreProps != null) {
            create("release") {
                storeFile = file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        debug {
            /* Das Suffix ist der Grund, warum der Prototyp gefahrlos neben der
               installierten 1.5.4 leben kann: andere applicationId, also eine
               andere App fuer das System. Genau deshalb kann ein Debug-Build
               die 1.x-Installation aber auch NIE aktualisieren — der
               Migrationsbeweis in P8 braucht zwingend einen Release-Build mit
               derselben Signatur. */
            applicationIdSuffix = ".dev"
            versionNameSuffix = if (storeShot) null else "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (keystoreProps != null) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    /* Kein Google-Metadatenblock im Signaturblock — dieselbe Begruendung wie in
       der 1.x-Fassung: eine verschluesselte, nur fuer Google lesbare
       Abhaengigkeitsliste, die F-Droid ablehnt. Ausfuehrlich in
       docs/play-store.md. */
    dependenciesInfo {
        includeInApk = false
        includeInBundle = false
    }

    /* ── Sprach-Splits AUS (D1, 15.08.2026) ────────────────────────────────
       Play zerlegt ein Bundle per Voreinstellung nach ABI, Bildschirmdichte
       UND Sprache und installiert nur die Teile, die zum Geraet passen. Fuer
       eine App mit EIGENER Sprachwahl ueber 37 Sprachen ist das der falsche
       Zuschnitt: Wer auf einem deutschen Telefon Franzoesisch waehlt, findet
       die franzoesischen Ressourcen nicht vor — sie sind nie installiert
       worden —, und die Auswahl faellt still auf die Basissprache zurueck.
       Dasselbe gilt fuer die Sprachwahl der Plattform ab API 33, die an
       `localeConfig` haengt: Der Waehler zeigt alle 37 an, geliefert sind
       zwei.

       So ist es im geschlossenen Test aufgefallen: Es gingen nur Deutsch
       (die Geraetesprache) und Englisch (die Basis). Der Fehler sass NICHT
       in der App, sondern im Auslieferungsweg, und er betrifft
       ausschliesslich Play: F-Droid und der GitHub-Kanal liefern ein
       universelles APK, in dem alle 37 Sprachen ohnehin stecken. Deshalb hat
       ihn keiner der Laeufe P0-P9 gesehen — sie haben alle gegen APKs
       gemessen, nie gegen ein installiertes Bundle.

       Gemessen am `BundleConfig.pb` des 2.0.0-Bundles: `splits_config` war
       LEER, es galten also bundletools Voreinstellungen, und die teilen auf.
       Der Preis dieser vier Zeilen ist ebenfalls gemessen (bundletool 1.18.3,
       `get-size total` gegen ein deutsches Geraet, x86_64, Dichte 420,
       API 36): der Download steigt von 2.182.124 auf 2.358.940 Byte, also um
       176.816 Byte oder 8,1 %. Der Satz Split-APKs faellt dabei von 87 auf 13
       Teile, die 74 Sprach-Splits (zusammen 1.553.412 Byte) verschwinden in
       `base-master`. Die theoretische Obergrenze waere die ganze
       Ressourcentabelle (765.840 Byte) gewesen — so teuer ist es nicht, weil
       Basis und Geraetesprache vorher schon drin waren und der Rest gut
       packt.

       Der andere Weg — Sprachen bei Bedarf ueber `SplitInstallManager`
       nachladen — ist geprueft und verworfen: Er braucht Play Core, also
       eine proprietaere Abhaengigkeit, die den F-Droid-Bau und die
       Netz-Zusage bricht. Ausfuehrlich in docs/geprueft-und-verworfen.md. */
    bundle {
        language {
            enableSplit = false
        }
    }

    buildFeatures {
        compose = true
        /* BuildConfig aus: Die App liest ihre Version ueber den PackageManager,
           wenn sie sie braucht. Eine generierte Klasse fuer nichts. */
        buildConfig = false
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    packaging {
        resources {
            // Lizenz-Beiwerk der Abhaengigkeiten blaeht nur das APK.
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.kotlinx.coroutines.android)

    /* AppCompat steht hier fuer GENAU EINE Sache: die per-App-Sprachwahl
       (AppCompatDelegate.setApplicationLocales). Ab API 33 macht das der
       LocaleManager der Plattform; darunter braucht es AppCompat, und minSdk
       ist 26. Nichts anderes aus diesem Paket wird benutzt — die Oberflaeche
       ist Compose Foundation. */
    implementation(libs.androidx.appcompat)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.foundation)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.text)
    /* KEIN androidx.compose.material / material3. Die Hausregel „kein
       UI-Framework" gilt nativ genauso wie im Web: Foundation ist die
       Plattform, Material waere das Framework. Jedes Bauteil entsteht aus
       Foundation-Primitiven — so wie die Web-Fassung aus rohem CSS entsteht
       und nicht aus Tailwind. */

    debugImplementation(libs.androidx.compose.ui.tooling)
    implementation(libs.androidx.compose.ui.tooling.preview)

    /* Kamera und QR (P6). CameraX ist Plattform-Infrastruktur wie der Rest von
       androidx: Preview + ImageAnalysis ersetzen getUserMedia + Canvas der
       Web-Fassung. camera-view liefert die PreviewView — Compose bettet sie
       ueber AndroidView ein; das offizielle camera-compose-Artefakt ist noch
       Alpha und faellt damit aus (nur stabile Fassungen, wie ueberall hier).

       ZXing core ist das native Gegenstueck zu jsQR: pures Java, Apache-2.0,
       keine Play-Services-Bindung — es sieht Pixel und liefert Text, die
       OTP-Rechnung bleibt vollstaendig die eigene. ML Kit waere bequemer und
       ist proprietaer; ausgeschlossen. */
    implementation(libs.androidx.camera.core)
    implementation(libs.androidx.camera.camera2)
    implementation(libs.androidx.camera.lifecycle)
    implementation(libs.androidx.camera.view)
    implementation(libs.zxing.core)

    /* Biometrie (P7). `BiometricPrompt` ist die einzige Art, einen
       Keystore-Schluessel mit `setUserAuthenticationRequired` freizuschalten:
       Der `CryptoObject` geht in die System-Abfrage hinein und kommt
       freigeschaltet zurueck — die App bekommt den Fingerabdruck selbst nie zu
       sehen. Ein eigener Dialog kann das grundsaetzlich nicht.

       Die Bibliothek zieht `androidx.fragment` mit; das ist der Grund, warum
       die Abfrage eine FragmentActivity braucht. MainActivity ist ueber
       AppCompatActivity ohnehin eine. */
    implementation(libs.androidx.biometric)

    /* Der Start-Bildschirm (N15). Er ist NICHT bloss Kosmetik: Zwischen dem
       Antippen des Icons und dem ersten Compose-Bild zeigt Android das
       `windowBackground` — eine leere Flaeche in `--ground`, die genau so lange
       steht, wie die App zum Starten braucht. Mit dem Splash steht dort das
       Markenzeichen, und der Uebergang ins erste Bild gehoert der Plattform
       statt dem Zufall.

       Die Bibliothek gibt es aus einem Grund: Die Plattform-API dahinter kam
       erst mit API 31, minSdk ist 26. Sie bildet dieselbe Deklaration auf
       beiden Seiten der Grenze ab — genau die Sorte Aufgabe, fuer die eine
       androidx-Bibliothek da ist, und dieselbe Begruendung wie bei AppCompat
       fuer die per-App-Sprachwahl. */
    implementation(libs.androidx.core.splashscreen)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
}

/* ── Dauerpruefung: kein Material in dem, was ausgeliefert wird ─────────────
   „Kein UI-Framework" ist eine der harten Regeln des Projekts, und eine harte
   Regel gehoert gemessen statt behauptet — dieselbe Linie wie check-tokens.mjs
   im Web.

   Der Befund, der diese Aufgabe ausgeloest hat: `androidx.compose.material3`
   liegt sehr wohl im DEBUG-Klassenpfad. Es kommt nicht aus unseren
   Abhaengigkeiten, sondern aus `androidx.compose.ui:ui-tooling` (die
   Vorschau-Infrastruktur von Android Studio), das ueber material3 zeichnet.
   `ui-tooling` ist `debugImplementation` und wandert nicht ins Release —
   gemessen ist der Release-Klassenpfad frei von JEDEM
   `androidx.compose.material*`-Artefakt, auch von material-ripple.

   Genau diese Trennung prueft die Aufgabe hier, und zwar am RELEASE-Pfad:
   Wer morgen aus Bequemlichkeit einen Material-Knopf benutzt, faellt auf. */
val checkNoMaterial by tasks.registering {
    group = "verification"
    description = "Faellt aus, wenn Compose Material in den Release-Klassenpfad geraet."

    val classpath = configurations.named("releaseRuntimeClasspath")
    // Die Aufloesung gehoert in die Ausfuehrung, nicht in die Konfiguration —
    // sonst loest jeder Gradle-Aufruf den ganzen Klassenpfad auf.
    doLast {
        val offenders = classpath.get()
            .incoming.resolutionResult.allComponents
            .map { it.id.displayName }
            .filter { it.startsWith("androidx.compose.material") }
            .sorted()

        if (offenders.isNotEmpty()) {
            throw GradleException(
                "Compose Material im Release-Klassenpfad:\n  " +
                    offenders.joinToString("\n  ") +
                    "\nDie Oberflaeche wird aus Foundation-Primitiven gebaut. " +
                    "Siehe Kommentar ueber dieser Aufgabe.",
            )
        }
        logger.lifecycle("checkNoMaterial: kein androidx.compose.material* im Release — gemessen.")
    }
}

tasks.named("check") { dependsOn(checkNoMaterial) }
