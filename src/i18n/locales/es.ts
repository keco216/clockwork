/**
 * Español (neutro, sin voseo ni localismos).
 *
 * Glosario: secret · caja fuerte (vault) · cuenta · frase de contraseña
 *   (passphrase) · entrada · código · esfera. « Secret » se deja tal cual: es la
 *   palabra que aparece en las páginas de los proveedores.
 * Registro: impersonal y sobrio, como en las herramientas para desarrolladores.
 * Comillas: « … » en los textos; los signos de apertura ¿ ¡ se usan como manda
 *   la ortografía.
 * Plural: CLDR da one/many/other; « many » solo afecta a cifras enormes y repite
 *   el texto de « other ».
 */

import type { Strings } from '../strings';

export default {
  'meta.title': 'Clockwork — Autenticador TOTP',
  'meta.description':
    'Clockwork — autenticador TOTP. Genera códigos de dos factores por completo en el ' +
    'navegador, sin ninguna petición de red.',
  'brand.tagline': 'Autenticador TOTP · RFC 6238',
  'skip.toCodes': 'Ir a los códigos',

  'status.line': '{connection} · {vault}',
  'status.offline': 'Sin conexión',
  'status.vault.off': 'no se guarda nada',
  'status.vault.locked': 'caja fuerte cerrada',
  'status.vault.open': 'caja fuerte abierta',

  'zone.input': 'Entrada',
  'zone.vault': 'Caja fuerte',
  'zone.codes': 'Códigos',

  'input.legend': 'Una entrada por línea',
  'input.placeholder':
    'p. ej. JBSWY3DPEHPK3PXP\n' +
    'GitHub: jbsw y3dp ehpk 3pxp\n' +
    'otpauth://totp/ACME:kevin@example.com?secret=JBSWY3DPEHPK3PXP',
  'input.help.formats': 'Base32, {nameSecret} o {uri} — mezclados. {hash} inicia una nota.',
  'input.help.images':
    'Las imágenes con código QR también se pueden arrastrar aquí o pegar con {paste}.',
  'input.help.migration':
    'Las exportaciones de Google Authenticator ({migration}) se convierten automáticamente.',
  'input.help.more': 'Todos los formatos de entrada',
  'shortcut.modifier': 'Ctrl',

  'input.count.accounts': { one: '{n} cuenta', many: '{n} cuentas', other: '{n} cuentas' },
  'input.count.errors': { one: '{n} error', many: '{n} errores', other: '{n} errores' },
  'input.count.join': '{accounts} · {errors}',

  'key.clear': 'Vaciar',
  'key.qrImage': 'QR desde imagen',
  'key.camera': 'Cámara',
  'key.cameraStop': 'Apagar cámara',
  'key.copy': 'Copiar',
  'key.copyDone': 'Copiado',
  'key.copyFailed': 'Falló',

  'viewfinder.hint': 'Mantén el código QR dentro del marco',

  'filter.label': 'Filtrar cuentas',
  'filter.placeholder': 'Filtrar por nombre',
  'filter.empty': 'Nada coincide con «{query}».',

  'strip.spec': '{algorithm} · {digits} · {period}',
  'strip.digits': { one: '{n} dígito', many: '{n} dígitos', other: '{n} dígitos' },
  'strip.period': '{n} s',
  'strip.next': 'sigue',
  'strip.seconds.abbr': 's',
  'strip.seconds.title': 'segundos',
  'strip.seconds.valid': 'válido',
  'strip.accountFallback': 'Cuenta {n}',
  'strip.copyAria': 'Copiar el código de {name}',
  'strip.copyAnnounce': 'Código {digits} copiado',
  'strip.copyFailedHint': 'La copia falló. Selecciona el código a mano.',

  'fault.title': 'Línea ilegible',

  'vault.state.off': 'Apagada — no se guarda nada',
  'vault.state.locked': 'Cerrada — hace falta la frase de contraseña',
  'vault.state.open': 'Abierta — los secrets están en el campo de texto',
  'vault.explain':
    'Por defecto Clockwork no guarda nada. Si activas la caja fuerte, lo introducido ' +
    'queda aquí cifrado con tu frase de contraseña: sin ella el bloque guardado no vale ' +
    'nada.',
  'vault.explain.crypto':
    'La clave se deriva de la frase de contraseña con PBKDF2-SHA-256 y {iterations} ' +
    'iteraciones, y AES-256-GCM se encarga del cifrado. Solo se guarda el sobre sellado: ' +
    'nunca el texto en claro, nunca la frase de contraseña, nunca la clave derivada.',
  'vault.explain.more': 'Todos los detalles',
  'vault.pass.new': 'Nueva frase de contraseña',
  'vault.pass.existing': 'Frase de contraseña',
  'vault.action.seal': 'Guardar cifrado',
  'vault.action.unseal': 'Abrir',
  'vault.action.deriving': 'Derivando la clave …',
  'vault.action.lock': 'Cerrar',
  'vault.action.update': 'Guardar de nuevo',
  'vault.action.wipe': 'Borrarlo todo',
  'vault.action.wipeConfirm': '¿Borrar de verdad?',
  'vault.timeout.label': 'Se cierra sola después de',
  'vault.timeout.minutes': { one: '{n} minuto', many: '{n} minutos', other: '{n} minutos' },
  'vault.lockOnHide': 'y al salir de la pestaña',

  'vault.error.nothingToStore': 'No hay nada que guardar — el campo de texto está vacío.',
  'vault.error.storageBlocked': 'El navegador no permite guardar (¿modo privado?).',
  'vault.error.noVault': 'No hay ninguna caja fuerte guardada.',
  'vault.error.noPassphrase': 'Sin frase de contraseña no hay clave.',
  'vault.error.sealFailed': 'No se pudo guardar.',
  'vault.error.unsealFailed': 'No se pudo abrir.',

  'vault.msg.sealed': 'Caja fuerte guardada cifrada.',
  'vault.msg.resealed': 'Caja fuerte cifrada de nuevo.',
  'vault.msg.unsealed': 'Caja fuerte abierta.',
  'vault.msg.locked': 'Caja fuerte cerrada.',
  'vault.msg.wiped': 'Caja fuerte borrada.',
  'vault.msg.wipedNote': 'Borrada. No queda nada en el almacenamiento.',
  'vault.locked.idle': {
    one: 'Cerrada tras {n} minuto sin entradas.',
    many: 'Cerrada tras {n} minutos sin entradas.',
    other: 'Cerrada tras {n} minutos sin entradas.',
  },
  'vault.locked.hidden': 'Cerrada al salir de la pestaña.',

  'scan.noQr': 'En la imagen no se reconoce ningún código QR.',
  'scan.unreadable': 'No se pudo leer la imagen — ¿es de verdad una imagen?',
  'scan.done': 'Código QR leído e insertado.',
  'scan.camera.unavailable':
    'Este entorno no da acceso a ninguna cámara. Al abrir el archivo directamente (file://) ' +
    'la mayoría de los navegadores la bloquean — « QR desde imagen » siempre funciona.',
  'scan.camera.denied':
    'Se denegó la cámara. Restablece el permiso en el navegador — o usa « QR desde imagen ».',
  'scan.camera.notFound':
    'No hay ninguna cámara conectada. « QR desde imagen » funciona igualmente.',
  'scan.camera.busy': 'Otro programa está usando la cámara en este momento.',
  'scan.camera.failed': 'No se pudo iniciar la cámara. « QR desde imagen » siempre funciona.',

  'import.done': {
    one: '{n} cuenta tomada de la exportación de Google Authenticator',
    many: '{n} cuentas tomadas de la exportación de Google Authenticator',
    other: '{n} cuentas tomadas de la exportación de Google Authenticator',
  },
  'import.skipped': 'omitidas: {list}',
  'import.skip.hotp': '{label} (HOTP, basado en contador)',
  'import.skip.algorithm': '{label} (algoritmo no admitido)',
  'import.skip.emptySecret': '{label} (secret vacío)',
  'import.unnamed': 'Sin nombre',
  'import.unreadable': 'Exportación ilegible.',

  'vacant.text': 'Secreto, enlace otpauth o imagen QR: nada de eso sale de este navegador.',
  'vacant.demo': 'Insertar clave de prueba',
  'colophon.note': 'Sin red · sin almacenamiento · HMAC mediante la Web Crypto API',

  'lang.label': 'Idioma',
  'lang.aria': 'Elegir idioma',

  'err.base32.paddingInside': 'El carácter « = » solo puede ir al final (no es más que relleno).',
  'err.base32.empty': 'La clave secret está vacía.',
  'err.base32.badChar':
    'Carácter no válido « {char} » en la posición {position}. Base32 solo conoce A–Z y 2–7 — ' +
    'las cifras 0, 1 y 8 no aparecen (¿confundidas con O, I y B?).',
  'err.base32.badLength':
    'Longitud no válida: {length} caracteres (sin espacios ni relleno). Base32 codifica ' +
    '5 bytes en 8 caracteres; en el último bloque solo caben 2, 4, 5, 7 u 8 caracteres. ' +
    'Probablemente falta un carácter o sobra uno.',

  'err.uri.invalid': 'Esto no es una URI válida. Se espera « otpauth://totp/… ».',
  'err.uri.scheme': 'Esquema desconocido « {scheme} ». Se espera « otpauth ».',
  'err.uri.hotp':
    'Esto es una URI HOTP (basada en contador). Esta aplicación solo genera códigos TOTP ' +
    'basados en el tiempo — para lo otro habría que guardar el estado del contador.',
  'err.uri.type': 'Tipo desconocido « {type} ». Tras « otpauth:// » debe ir « totp ».',
  'err.uri.typeEmpty': '(vacío)',
  'err.uri.noSecret': 'En la URI falta el parámetro « secret ».',
  'err.uri.badLabel':
    'La etiqueta de la URI contiene una codificación por ciento rota (por ejemplo un « % » ' +
    'suelto).',
  'err.uri.algorithm': 'Algoritmo desconocido « {value} ». Se admiten SHA1, SHA256 y SHA512.',
  'err.uri.digits': 'Valor no válido para « digits »: {value}. Se admiten de {min} a {max}.',
  'err.uri.period': 'Valor no válido para « period »: {value}. Se esperan de 1 a 3600 segundos.',
  'err.uri.integer': 'El parámetro « {name} » debe ser un número entero; se encontró « {value} ».',

  'err.otp.digits': 'Número de dígitos no válido: {value}. Se admiten de {min} a {max}.',
  'err.otp.emptySecret': 'El secret está vacío — de ahí no se puede calcular ningún código.',

  'err.line.unreadable': 'No se pudo leer esta línea.',

  'err.vault.openFailed':
    'No se pudo abrir la caja fuerte. Frase de contraseña incorrecta — o los datos guardados ' +
    'fueron alterados.',
  'err.vault.badFormat': 'Los datos guardados de la caja fuerte tienen un formato desconocido.',
  'err.vault.version':
    'La versión {version} de la caja fuerte no es compatible (se esperaba: {expected}).',
  'err.vault.base64': 'El campo « {field} » de los datos de la caja fuerte no es Base64 válido.',
  'err.vault.iterations': 'Número de iteraciones no válido: {value}.',

  'err.migration.notExport':
    'Esto no es una exportación de Google Authenticator. Se espera ' +
    '« otpauth-migration://offline?data=… ».',
  'err.migration.noData': 'En la URI falta el parámetro « data ».',
  'err.migration.badPercent': 'El parámetro « data » contiene una codificación por ciento rota.',
  'err.migration.badBase64': 'El parámetro « data » no es Base64 válido.',
  'err.migration.noAccounts': 'En esta exportación no hay ninguna cuenta.',

  'native.vacant.text':
    'Secreto, enlace otpauth o imagen QR: nada de eso sale de este dispositivo.',

  'native.colophon.note': 'Sin red · sin almacenamiento · HMAC mediante javax.crypto',

  'native.scan.camera.unavailable':
    'Este dispositivo no da acceso a ninguna cámara — « QR desde imagen » siempre funciona.',
  'native.scan.camera.denied':
    'Se denegó la cámara. Concede el permiso en los ajustes de aplicaciones del sistema — o usa « QR desde imagen ».',
  'native.vault.lockOnHide': 'y al salir de la aplicación',
  'native.vault.locked.hidden': 'Cerrada al salir de la aplicación.',
  'native.vault.error.storageBlocked':
    'No se pudo escribir la caja fuerte — ¿está lleno el almacenamiento?',
  'native.vault.biometric.label': 'Desbloquear con biometría',
  'native.vault.biometric.note':
    'Un atajo, no una segunda llave: la frase de contraseña sigue siendo el único camino de vuelta.',
  'native.vault.biometric.cancel': 'Usar la frase de contraseña',
  'native.vault.biometric.unavailable':
    'Este dispositivo no tiene configurada una biometría fuerte.',
  'native.vault.biometric.invalidated':
    'Se registró una biometría nueva, así que el atajo desapareció. Desbloquea con la frase de contraseña y vuelve a activarlo.',
  'native.vault.biometric.failed':
    'El desbloqueo biométrico no funcionó — usa la frase de contraseña.',
  'native.vault.screenshots.label': 'Bloquear capturas de pantalla y vistas previas',

  'native.nav.home': 'Inicio',
  'native.nav.settings': 'Ajustes',
  'native.about.title': 'Acerca de',
  'native.about.version': 'Versión',
  'native.about.network':
    'La aplicación no tiene permiso de red. No puede abrir ninguna conexión: ni para actualizaciones, ni para estadísticas, ni por error.',
  'native.about.licenses': 'Licencias',
  'native.about.source': 'Código fuente',
} satisfies Strings;
