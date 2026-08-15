package io.github.keco216.clockwork.ui

import io.github.keco216.clockwork.R

/**
 * ERZEUGT von scripts/native-strings.mjs. Nicht von Hand aendern.
 *
 * Bildet die i18n-Schluessel des Web-Katalogs auf Ressourcen-Ids ab. Der
 * Kern wirft Schluessel (siehe core/Errors.kt), die Oberflaeche schlaegt
 * sie hier nach.
 */
object StringKeys {
    /** `null`, wenn der Schluessel unbekannt ist — der Aufrufer nimmt dann
     *  die neutrale Auffangmeldung, genau wie `translateLibMessage` im Web. */
    fun resourceFor(key: String): Int? = when (key) {
        "brand.tagline" -> R.string.brand_tagline
        "skip.toCodes" -> R.string.skip_toCodes
        "status.line" -> R.string.status_line
        "status.offline" -> R.string.status_offline
        "status.vault.off" -> R.string.status_vault_off
        "status.vault.locked" -> R.string.status_vault_locked
        "status.vault.open" -> R.string.status_vault_open
        "zone.input" -> R.string.zone_input
        "zone.vault" -> R.string.zone_vault
        "zone.codes" -> R.string.zone_codes
        "input.legend" -> R.string.input_legend
        "input.placeholder" -> R.string.input_placeholder
        "input.help.formats" -> R.string.input_help_formats
        "input.help.images" -> R.string.input_help_images
        "input.help.migration" -> R.string.input_help_migration
        "input.help.more" -> R.string.input_help_more
        "shortcut.modifier" -> R.string.shortcut_modifier
        "input.count.join" -> R.string.input_count_join
        "key.clear" -> R.string.key_clear
        "key.qrImage" -> R.string.key_qrImage
        "key.camera" -> R.string.key_camera
        "key.cameraStop" -> R.string.key_cameraStop
        "key.copy" -> R.string.key_copy
        "key.copyDone" -> R.string.key_copyDone
        "key.copyFailed" -> R.string.key_copyFailed
        "viewfinder.hint" -> R.string.viewfinder_hint
        "filter.label" -> R.string.filter_label
        "filter.placeholder" -> R.string.filter_placeholder
        "filter.empty" -> R.string.filter_empty
        "strip.spec" -> R.string.strip_spec
        "strip.period" -> R.string.strip_period
        "strip.next" -> R.string.strip_next
        "strip.seconds.abbr" -> R.string.strip_seconds_abbr
        "strip.seconds.title" -> R.string.strip_seconds_title
        "strip.seconds.valid" -> R.string.strip_seconds_valid
        "strip.accountFallback" -> R.string.strip_accountFallback
        "strip.copyAria" -> R.string.strip_copyAria
        "strip.copyAnnounce" -> R.string.strip_copyAnnounce
        "strip.copyFailedHint" -> R.string.strip_copyFailedHint
        "fault.title" -> R.string.fault_title
        "vault.state.off" -> R.string.vault_state_off
        "vault.state.locked" -> R.string.vault_state_locked
        "vault.state.open" -> R.string.vault_state_open
        "vault.explain" -> R.string.vault_explain
        "vault.explain.crypto" -> R.string.vault_explain_crypto
        "vault.explain.more" -> R.string.vault_explain_more
        "vault.pass.new" -> R.string.vault_pass_new
        "vault.pass.existing" -> R.string.vault_pass_existing
        "vault.action.seal" -> R.string.vault_action_seal
        "vault.action.unseal" -> R.string.vault_action_unseal
        "vault.action.deriving" -> R.string.vault_action_deriving
        "vault.action.lock" -> R.string.vault_action_lock
        "vault.action.update" -> R.string.vault_action_update
        "vault.action.wipe" -> R.string.vault_action_wipe
        "vault.action.wipeConfirm" -> R.string.vault_action_wipeConfirm
        "vault.timeout.label" -> R.string.vault_timeout_label
        "vault.error.nothingToStore" -> R.string.vault_error_nothingToStore
        "vault.error.noVault" -> R.string.vault_error_noVault
        "vault.error.noPassphrase" -> R.string.vault_error_noPassphrase
        "vault.error.sealFailed" -> R.string.vault_error_sealFailed
        "vault.error.unsealFailed" -> R.string.vault_error_unsealFailed
        "vault.msg.sealed" -> R.string.vault_msg_sealed
        "vault.msg.resealed" -> R.string.vault_msg_resealed
        "vault.msg.unsealed" -> R.string.vault_msg_unsealed
        "vault.msg.locked" -> R.string.vault_msg_locked
        "vault.msg.wiped" -> R.string.vault_msg_wiped
        "vault.msg.wipedNote" -> R.string.vault_msg_wipedNote
        "scan.noQr" -> R.string.scan_noQr
        "scan.unreadable" -> R.string.scan_unreadable
        "scan.done" -> R.string.scan_done
        "scan.camera.notFound" -> R.string.scan_camera_notFound
        "scan.camera.busy" -> R.string.scan_camera_busy
        "scan.camera.failed" -> R.string.scan_camera_failed
        "import.skipped" -> R.string.import_skipped
        "import.skip.hotp" -> R.string.import_skip_hotp
        "import.skip.algorithm" -> R.string.import_skip_algorithm
        "import.skip.emptySecret" -> R.string.import_skip_emptySecret
        "import.unnamed" -> R.string.import_unnamed
        "import.unreadable" -> R.string.import_unreadable
        "vacant.demo" -> R.string.vacant_demo
        "lang.label" -> R.string.lang_label
        "lang.aria" -> R.string.lang_aria
        "err.base32.paddingInside" -> R.string.err_base32_paddingInside
        "err.base32.empty" -> R.string.err_base32_empty
        "err.base32.badChar" -> R.string.err_base32_badChar
        "err.base32.badLength" -> R.string.err_base32_badLength
        "err.uri.invalid" -> R.string.err_uri_invalid
        "err.uri.scheme" -> R.string.err_uri_scheme
        "err.uri.hotp" -> R.string.err_uri_hotp
        "err.uri.type" -> R.string.err_uri_type
        "err.uri.typeEmpty" -> R.string.err_uri_typeEmpty
        "err.uri.noSecret" -> R.string.err_uri_noSecret
        "err.uri.badLabel" -> R.string.err_uri_badLabel
        "err.uri.algorithm" -> R.string.err_uri_algorithm
        "err.uri.digits" -> R.string.err_uri_digits
        "err.uri.period" -> R.string.err_uri_period
        "err.uri.integer" -> R.string.err_uri_integer
        "err.otp.digits" -> R.string.err_otp_digits
        "err.otp.emptySecret" -> R.string.err_otp_emptySecret
        "err.line.unreadable" -> R.string.err_line_unreadable
        "err.vault.openFailed" -> R.string.err_vault_openFailed
        "err.vault.badFormat" -> R.string.err_vault_badFormat
        "err.vault.version" -> R.string.err_vault_version
        "err.vault.base64" -> R.string.err_vault_base64
        "err.vault.iterations" -> R.string.err_vault_iterations
        "err.migration.notExport" -> R.string.err_migration_notExport
        "err.migration.noData" -> R.string.err_migration_noData
        "err.migration.badPercent" -> R.string.err_migration_badPercent
        "err.migration.badBase64" -> R.string.err_migration_badBase64
        "err.migration.noAccounts" -> R.string.err_migration_noAccounts
        "native.vacant.text" -> R.string.vacant_text
        "native.colophon.note" -> R.string.colophon_note
        "native.scan.camera.unavailable" -> R.string.scan_camera_unavailable
        "native.scan.camera.denied" -> R.string.scan_camera_denied
        "native.vault.lockOnHide" -> R.string.vault_lockOnHide
        "native.vault.locked.hidden" -> R.string.vault_locked_hidden
        "native.vault.error.storageBlocked" -> R.string.vault_error_storageBlocked
        "native.vault.biometric.label" -> R.string.vault_biometric_label
        "native.vault.biometric.note" -> R.string.vault_biometric_note
        "native.vault.biometric.cancel" -> R.string.vault_biometric_cancel
        "native.vault.biometric.unavailable" -> R.string.vault_biometric_unavailable
        "native.vault.biometric.invalidated" -> R.string.vault_biometric_invalidated
        "native.vault.biometric.failed" -> R.string.vault_biometric_failed
        "native.vault.screenshots.label" -> R.string.vault_screenshots_label
        "native.nav.home" -> R.string.nav_home
        "native.nav.settings" -> R.string.nav_settings
        "native.about.title" -> R.string.about_title
        "native.about.version" -> R.string.about_version
        "native.about.network" -> R.string.about_network
        "native.about.licenses" -> R.string.about_licenses
        "native.about.source" -> R.string.about_source
        else -> null
    }

    /** Dasselbe fuer die Mehrzahl-Eintraege. */
    fun pluralFor(key: String): Int? = when (key) {
        "input.count.accounts" -> R.plurals.input_count_accounts
        "input.count.errors" -> R.plurals.input_count_errors
        "strip.digits" -> R.plurals.strip_digits
        "vault.timeout.minutes" -> R.plurals.vault_timeout_minutes
        "vault.locked.idle" -> R.plurals.vault_locked_idle
        "import.done" -> R.plurals.import_done
        else -> null
    }

    /** Die Platzhalter je Schluessel, in der Reihenfolge der Basissprache. */
    fun placeholdersFor(key: String): List<String> = when (key) {
        "status.line" -> listOf("connection", "vault")
        "input.help.formats" -> listOf("nameSecret", "uri", "hash")
        "input.help.images" -> listOf("paste")
        "input.help.migration" -> listOf("migration")
        "input.count.accounts" -> listOf("n")
        "input.count.errors" -> listOf("n")
        "input.count.join" -> listOf("accounts", "errors")
        "filter.empty" -> listOf("query")
        "strip.spec" -> listOf("algorithm", "digits", "period")
        "strip.digits" -> listOf("n")
        "strip.period" -> listOf("n")
        "strip.accountFallback" -> listOf("n")
        "strip.copyAria" -> listOf("name")
        "strip.copyAnnounce" -> listOf("digits")
        "vault.explain.crypto" -> listOf("iterations")
        "vault.timeout.minutes" -> listOf("n")
        "vault.locked.idle" -> listOf("n")
        "import.done" -> listOf("n")
        "import.skipped" -> listOf("list")
        "import.skip.hotp" -> listOf("label")
        "import.skip.algorithm" -> listOf("label")
        "import.skip.emptySecret" -> listOf("label")
        "err.base32.badChar" -> listOf("char", "position")
        "err.base32.badLength" -> listOf("length")
        "err.uri.scheme" -> listOf("scheme")
        "err.uri.type" -> listOf("type")
        "err.uri.algorithm" -> listOf("value")
        "err.uri.digits" -> listOf("value", "min", "max")
        "err.uri.period" -> listOf("value")
        "err.uri.integer" -> listOf("name", "value")
        "err.otp.digits" -> listOf("value", "min", "max")
        "err.vault.version" -> listOf("version", "expected")
        "err.vault.base64" -> listOf("field")
        "err.vault.iterations" -> listOf("value")
        else -> emptyList()
    }
}
