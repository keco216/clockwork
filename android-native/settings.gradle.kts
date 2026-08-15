// Eigenstaendiges Gradle-Projekt neben android/ (Capacitor). Die beiden teilen
// sich NICHTS ausser dem Repo: eigener Wrapper, eigener Versionskatalog, eigene
// Abhaengigkeiten. Ein gemeinsames Root-Projekt haette den 1.x-Bau an jede
// Aenderung hier gekettet — und der laeuft auf F-Droids Buildserver.

pluginManagement {
    repositories {
        // Reihenfolge mit Absicht: Google Maven zuerst und INHALTLICH BEGRENZT.
        // Ohne die Filter durchsucht Gradle bei jedem fremden Artefakt erst
        // Google und dann Central — zwei Anfragen statt einer.
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    // Ein Modul, das sein eigenes Repository mitbringt, waere eine Bezugsquelle
    // ausserhalb dieser Datei — genau das soll nicht passierbar sein.
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "clockwork-native"
include(":app")
