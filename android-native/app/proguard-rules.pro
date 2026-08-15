# R8-Regeln.
#
# Bewusst fast leer: Compose und androidx liefern ihre Keep-Regeln als consumer
# rules mit, und `core/` ist reines Kotlin ohne Reflexion — dort gibt es nichts
# zu bewahren, was R8 nicht selbst sieht. Eine Regel, die nichts schuetzt,
# schuetzt spaeter auch das nicht, was wirklich gefaehrdet waere.
#
# Was hier NICHT stehen darf: ein pauschales `-keep class io.github.keco216.**`.
# Das haette die Verkleinerung stillschweigend abgeschaltet, und die APK-Groesse
# in P9 waere eine gemessene Zahl ohne Aussage.

# Zeilennummern fuer lesbare Stacktraces behalten, Dateinamen verschleiern.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
