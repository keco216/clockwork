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

   Falle aus CLAUDE.md, hier nur zur Erinnerung: In key.properties muss jeder
   Backslash VERDOPPELT stehen. Gradle liest die Datei als Java-Properties, und
   dort entwertet der Backslash das naechste Zeichen — aus C:\Users\... wird
   sonst ein relativer Pfad, und Gradle sucht ihn unter .gradle\daemon\. */
val keystoreProps: Properties? = System.getenv("CLOCKWORK_KEYSTORE")
    ?.let { file(it) }
    ?.takeIf { it.exists() }
    ?.let { propsFile -> Properties().apply { propsFile.inputStream().use { load(it) } } }

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
           2.0.0 ist damit 20000 und liegt ueber jedem 1.x-Stand — die native
           Fassung kann die WebView-Fassung also spaeter als Update abloesen,
           was P8 (Tresor-Uebernahme) ueberhaupt erst moeglich macht. */
        versionCode = 20000
        versionName = "2.0.0-dev"
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
            versionNameSuffix = "-debug"
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
