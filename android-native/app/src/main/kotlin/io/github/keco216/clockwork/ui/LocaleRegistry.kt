package io.github.keco216.clockwork.ui

/**
 * ERZEUGT von scripts/native-strings.mjs aus src/i18n/registry.ts.
 * Nicht von Hand aendern.
 *
 * Die Eigennamen stehen im Katalog und nicht in den Plattformdaten — sonst
 * hiesse dieselbe Sprache je nach Geraet anders (gemessen: zh-Hans ist bei
 * Android „中文 (简体)", im Katalog „简体中文").
 *
 * Die Reihenfolge ist die des Web-Umschalters: nach Eigennamen, mit einem
 * festen en-Collator sortiert. Wer seine Sprache sucht, sucht nach ihrem
 * Namen — nicht nach dem englischen und nicht nach dem Code.
 */
data class LocaleMeta(
    val code: String,
    val name: String,
    val rtl: Boolean,
    val script: String,
)

val LOCALES: List<LocaleMeta> = listOf(
    LocaleMeta("id", "Bahasa Indonesia", false, "latin"),
    LocaleMeta("cs", "Čeština", false, "latin"),
    LocaleMeta("da", "Dansk", false, "latin"),
    LocaleMeta("de", "Deutsch", false, "latin"),
    LocaleMeta("et", "Eesti", false, "latin"),
    LocaleMeta("en", "English", false, "latin"),
    LocaleMeta("es", "Español", false, "latin"),
    LocaleMeta("fr", "Français", false, "latin"),
    LocaleMeta("hr", "Hrvatski", false, "latin"),
    LocaleMeta("it", "Italiano", false, "latin"),
    LocaleMeta("lv", "Latviešu", false, "latin"),
    LocaleMeta("lt", "Lietuvių", false, "latin"),
    LocaleMeta("hu", "Magyar", false, "latin"),
    LocaleMeta("nl", "Nederlands", false, "latin"),
    LocaleMeta("nb", "Norsk bokmål", false, "latin"),
    LocaleMeta("pl", "Polski", false, "latin"),
    LocaleMeta("pt-BR", "Português (Brasil)", false, "latin"),
    LocaleMeta("pt-PT", "Português (Portugal)", false, "latin"),
    LocaleMeta("ro", "Română", false, "latin"),
    LocaleMeta("sk", "Slovenčina", false, "latin"),
    LocaleMeta("sl", "Slovenščina", false, "latin"),
    LocaleMeta("fi", "Suomi", false, "latin"),
    LocaleMeta("sv", "Svenska", false, "latin"),
    LocaleMeta("vi", "Tiếng Việt", false, "vietnamese"),
    LocaleMeta("tr", "Türkçe", false, "latin"),
    LocaleMeta("el", "Ελληνικά", false, "greek"),
    LocaleMeta("bg", "Български", false, "cyrillic"),
    LocaleMeta("ru", "Русский", false, "cyrillic"),
    LocaleMeta("uk", "Українська", false, "cyrillic"),
    LocaleMeta("he", "עברית", true, "hebrew"),
    LocaleMeta("ar", "العربية", true, "arabic"),
    LocaleMeta("hi", "हिन्दी", false, "devanagari"),
    LocaleMeta("th", "ไทย", false, "thai"),
    LocaleMeta("ko", "한국어", false, "korean"),
    LocaleMeta("ja", "日本語", false, "japanese"),
    LocaleMeta("zh-Hans", "简体中文", false, "hans"),
    LocaleMeta("zh-Hant", "繁體中文", false, "hant"),
)
