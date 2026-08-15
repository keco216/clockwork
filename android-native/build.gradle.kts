// Wurzelprojekt: haelt nur die Plugin-Deklarationen zusammen. Gebaut wird in
// :app — ein zweites Modul gibt es bewusst nicht. Die Trennung "reine Logik"
// gegen "Android" laeuft hier ueber das PAKET core/ (kein Android-Import) und
// wird von JVM-Unit-Tests bewiesen, nicht ueber eine Modulgrenze. Ein eigenes
// Gradle-Modul kostet Konfigurationszeit und haette denselben Beweis erbracht.

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
