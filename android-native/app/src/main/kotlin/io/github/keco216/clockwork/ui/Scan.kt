package io.github.keco216.clockwork.ui

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.SystemClock
import android.util.Size
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.CameraState
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import io.github.keco216.clockwork.scan.decodeQrLuminance
import io.github.keco216.clockwork.scan.decodeQrPixels
import io.github.keco216.clockwork.scan.luminanceFromPlane
import io.github.keco216.clockwork.ui.theme.Dimens
import io.github.keco216.clockwork.ui.theme.LocalColors
import io.github.keco216.clockwork.ui.theme.TextStyles
import java.io.IOException
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * QR-Import: Kamera und Bilddatei — das native Gegenstueck zu `ui/scan.ts`.
 *
 * Zwei der vier Web-Wege gibt es hier: „QR aus Bild" ueber den Photo Picker
 * und die Kamera ueber CameraX. Ziehen und Einfuegen sind Browser-Gesten;
 * auf dem Telefon uebernimmt der Picker beide Rollen (er sieht auch
 * Screenshots).
 *
 * Beide Wege enden im selben Aufruf `onScan(text)` — was daraus wird,
 * entscheidet der Aufrufer. Genau wie im Web wird der Inhalt eines QR-Codes
 * wie eine getippte Zeile behandelt: angehaengt, geparst, sichtbar. Niemals
 * legt ein Scan still Konten an.
 */

/** Wie oft das Kamerabild geprueft wird — 8/s wie im Web. Mehr kostet Akku. */
private const val SCAN_INTERVAL_MS = 125L

/**
 * Zielaufloesung der Analyse — dieselbe Groessenordnung wie `getUserMedia`
 * im Web (ideal 1280 × 720). Die Voreinstellung von ImageAnalysis waere
 * 640 × 480, und daran scheitern dichte Migrations-QRs: Ein Sammel-Export
 * mit mehreren Konten hat schnell ueber 100 Module je Kante.
 */
private val ANALYSIS_SIZE = Size(1280, 720)

/**
 * Groesste Kantenlaenge, mit der ein gewaehltes Bild dekodiert wird.
 *
 * Ein Kamerafoto hat heute 4000+ Pixel je Kante — als ARGB waeren das ueber
 * 60 MB Arbeitsspeicher fuer ein Muster, das ZXing auch in 2048 sicher
 * findet (ein dichter Migrations-QR mit ~120 Modulen hat dann noch ueber
 * 15 Pixel je Modul). Verkleinert wird in Zweierpotenzen ueber
 * `inSampleSize`, dem verlustarmen Weg des Decoders.
 */
private const val MAX_IMAGE_EDGE = 2048

@Composable
fun ScanControls(
    active: Boolean,
    onScan: (String) -> Unit,
    onNote: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val feedback = rememberFeedback()

    // KEIN rememberSaveable: Nach einem Prozess-Neustart soll die Kamera
    // nicht ungefragt wieder anspringen. Configuration-Changes ueberleben
    // ohnehin in der Komposition (`configChanges` im Manifest).
    var scanning by remember { mutableStateOf(false) }
    var decoding by remember { mutableStateOf(false) }

    val cameraKeyFocus = remember { FocusRequester() }
    var viewfinderFocused by remember { mutableStateOf(false) }

    /* Wer den Sucher mit „Kamera aus" schliesst, steht mit dem Fokus AUF
       diesem Knopf — und der verschwindet gleich mit. Ein Bauteil, das den
       Fokus haelt und aus der Komposition faellt, gibt ihn nicht weiter.
       Deshalb erst fragen, ob der Fokus ueberhaupt im Sucher liegt, und nur
       dann zurueckgeben — sonst risse ein Kamera-TREFFER den Fokus aus dem
       Feld, in das gerade jemand tippt. Wortgleich die Regel aus `scan.ts`. */
    fun closeViewfinder() {
        scanning = false
        if (viewfinderFocused) cameraKeyFocus.requestFocus()
    }

    // Faehrt die Eingabe-Schublade zu (oder wechselt die Buehne), endet der
    // Sucher mit — die V10-Regel: Beim Zuklappen wird eine laufende Kamera
    // beendet, nichts filmt hinter einer geschlossenen Schublade weiter.
    LaunchedEffect(active) {
        if (!active) closeViewfinder()
    }

    // Ausserhalb der Klick-Lambdas aufgeloest: `text()` ist ein Composable
    // und darf in einem Callback nicht mehr aufgerufen werden.
    val unavailableText = text("native.scan.camera.unavailable")
    val deniedText = text("native.scan.camera.denied")
    val noQrText = text("scan.noQr")
    val unreadableText = text("scan.unreadable")

    val askCamera = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        // Abgelehnt heisst hier BEIDES, den frischen Nein-Tipp und das
        // dauerhafte „nicht mehr fragen" — der Text zeigt deshalb auf die
        // App-Einstellungen des Systems, den Weg, der immer offen ist.
        if (granted) scanning = true else onNote(deniedText)
    }

    val pickImage = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia(),
    ) { uri ->
        if (uri == null || decoding) return@rememberLauncherForActivityResult
        decoding = true
        scope.launch {
            when (val outcome = decodePickedImage(context, uri)) {
                is PickOutcome.Found -> {
                    // Ein Treffer ist ein Ergebnis, kein Tastendruck (N15/3).
                    feedback(Feedback.Confirm)
                    onScan(outcome.text)
                }
                PickOutcome.NoQr -> onNote(noQrText)
                PickOutcome.Unreadable -> onNote(unreadableText)
            }
            decoding = false
        }
    }

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(Dimens.gapPair),
    ) {
        // Das Zweiergitter aus V10: beide Tasten gleich breit, „QR aus Bild"
        // zuerst — es funktioniert immer, die Kamera nur mit Erlaubnis.
        Row(horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair)) {
            Key(
                label = text("key.qrImage"),
                onClick = {
                    pickImage.launch(
                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
                    )
                },
                modifier = Modifier.weight(1f),
                glyph = { tint -> ImageGlyph(tint) },
            )
            Key(
                label = text("key.camera"),
                onClick = {
                    when {
                        scanning -> {}
                        // Ohne Kamera-Hardware gar nicht erst nach der
                        // Berechtigung fragen — ein Dialog fuer etwas, das es
                        // nicht gibt, waere die schlechteste Auskunft.
                        !context.packageManager.hasSystemFeature(
                            PackageManager.FEATURE_CAMERA_ANY,
                        ) -> onNote(unavailableText)

                        ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
                            PackageManager.PERMISSION_GRANTED -> scanning = true

                        else -> askCamera.launch(Manifest.permission.CAMERA)
                    }
                },
                modifier = Modifier
                    .weight(1f)
                    .focusRequester(cameraKeyFocus),
                glyph = { tint -> CameraGlyph(tint) },
            )
        }

        if (scanning) {
            Viewfinder(
                onFound = { found ->
                    /* Der wichtigste haptische Moment der App: Wer einen QR-Code
                       filmt, sieht auf das MOTIV und nicht auf den Schirm. Ohne
                       Rueckmeldung haelt man das Telefon weiter still und
                       wartet auf etwas, das schon passiert ist. */
                    feedback(Feedback.Confirm)
                    closeViewfinder()
                    onScan(found)
                },
                onProblem = { message ->
                    closeViewfinder()
                    onNote(message)
                },
                onStop = ::closeViewfinder,
                modifier = Modifier.onFocusChanged { viewfinderFocused = it.hasFocus },
            )
        }
    }
}

/**
 * Der Sucher: Kamerabild, vier Signal-Winkel, Hinweiszeile, „Kamera aus".
 *
 * ── Bewegung ──────────────────────────────────────────────────────────────
 * Der Sucher erscheint und verschwindet OHNE Fahrt — wie im Web, wo er ein
 * `hidden`-Umschalter ist und in den 25 Motion-Zusagen nicht vorkommt. Die
 * einzige Bewegung dieses Bausteins ist das Kamerabild selbst; reduced-motion
 * hat hier also nichts abzuschalten.
 *
 * ── Lebenszyklus ──────────────────────────────────────────────────────────
 * `bindToLifecycle` schliesst die Kamera bei ON_STOP von selbst — das native
 * Gegenstueck zur `visibilitychange`-Regel des Webs: Ein laufender Sucher,
 * den niemand sieht, ist verschwendeter Akku und ein unnoetiges Datenrisiko.
 * Anders als im Web oeffnet er sich beim Zurueckkommen wieder, denn der
 * Sucher steht dann sichtbar auf dem Schirm — eine App, die ihn kommentarlos
 * schwarz liesse, saehe kaputt aus.
 */
@Composable
private fun Viewfinder(
    onFound: (String) -> Unit,
    onProblem: (String) -> Unit,
    onStop: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalColors.current
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val notFoundText = text("scan.camera.notFound")
    val busyText = text("scan.camera.busy")
    val failedText = text("scan.camera.failed")

    val previewView = remember {
        PreviewView(context).apply {
            /* COMPATIBLE erzwingt eine TextureView. Die Voreinstellung
               (SurfaceView) malt in ein EIGENES Fenster unter der Komposition —
               der Radius-Beschnitt der Karte griffe dort nicht, und das Video
               schaute an den vier Ecken unter der Rundung hervor. Dasselbe
               Problem hat die Web-Fassung mit `overflow: hidden` am Video und
               loest es dort mit `isolation: isolate`. */
            implementationMode = PreviewView.ImplementationMode.COMPATIBLE
            // FILL_CENTER = `object-fit: cover`: Der Rahmen ist quadratisch,
            // das Kamerabild nicht — es fuellt und wird beschnitten.
            scaleType = PreviewView.ScaleType.FILL_CENTER
        }
    }

    DisposableEffect(lifecycleOwner) {
        // Die Analyse laeuft auf einem EIGENEN Thread — „abseits des
        // Main-Threads" ist hier woertlich ein Executor, den der Analyzer
        // exklusiv bekommt. Dekodiert wird direkt darauf, ohne weiteren Hop.
        val analysisExecutor = Executors.newSingleThreadExecutor()
        val mainExecutor = ContextCompat.getMainExecutor(context)
        // Mehrere Bilder koennen denselben Code finden, bevor die Kamera
        // schliesst — geliefert wird trotzdem nur einmal.
        val delivered = AtomicBoolean(false)
        var provider: ProcessCameraProvider? = null

        val future = ProcessCameraProvider.getInstance(context)
        future.addListener({
            val ready = try {
                future.get()
            } catch (error: Exception) {
                onProblem(failedText)
                return@addListener
            }
            provider = ready

            // Wie `facingMode: 'environment'` ohne `exact` im Web: bevorzugt
            // die Rueckkamera, nimmt sonst die vorhandene — ein Geraet mit
            // nur einer Frontkamera scannt trotzdem.
            val selector = when {
                ready.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA) ->
                    CameraSelector.DEFAULT_BACK_CAMERA
                ready.hasCamera(CameraSelector.DEFAULT_FRONT_CAMERA) ->
                    CameraSelector.DEFAULT_FRONT_CAMERA
                else -> {
                    onProblem(notFoundText)
                    return@addListener
                }
            }

            val preview = Preview.Builder().build().also {
                it.surfaceProvider = previewView.surfaceProvider
            }

            val analysis = ImageAnalysis.Builder()
                // Immer nur das JUENGSTE Bild: Ein QR-Sucher braucht keinen
                // Rueckstau — ein uebersprungenes Bild kostet nichts, das
                // naechste kommt sofort.
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .setResolutionSelector(
                    ResolutionSelector.Builder()
                        .setResolutionStrategy(
                            ResolutionStrategy(
                                ANALYSIS_SIZE,
                                ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER,
                            ),
                        )
                        .build(),
                )
                .build()

            var lastAttempt = 0L
            analysis.setAnalyzer(analysisExecutor) { frame ->
                frame.use { image ->
                    val now = SystemClock.elapsedRealtime()
                    if (delivered.get() || now - lastAttempt < SCAN_INTERVAL_MS) return@use
                    lastAttempt = now

                    val plane = image.planes[0]
                    val buffer = plane.buffer
                    buffer.rewind()
                    val bytes = ByteArray(buffer.remaining())
                    buffer.get(bytes)

                    // Nur die Y-Ebene; Drehung ist egal, ZXing findet die
                    // Suchmuster in jeder Lage — jsQR bekommt im Web ebenfalls
                    // das ungedrehte Videobild.
                    val luminance = luminanceFromPlane(
                        bytes,
                        plane.rowStride,
                        plane.pixelStride,
                        image.width,
                        image.height,
                    )
                    val found = decodeQrLuminance(luminance, image.width, image.height)
                    if (found != null && delivered.compareAndSet(false, true)) {
                        mainExecutor.execute { onFound(found) }
                    }
                }
            }

            try {
                val camera = ready.bindToLifecycle(lifecycleOwner, selector, preview, analysis)
                /* Der eine Fehlerfall, den erst die LAUFENDE Kamera meldet:
                   belegt durch eine andere App. Im Web ist das der
                   `NotReadableError` von getUserMedia; hier kommt er als
                   CameraState ueber die Lebenszeit herein. Nur die klar
                   endgueltigen Codes brechen ab — alles andere darf CameraX
                   selbst weiter versuchen. */
                camera.cameraInfo.cameraState.observe(lifecycleOwner) { state ->
                    when (state.error?.code) {
                        CameraState.ERROR_CAMERA_IN_USE,
                        CameraState.ERROR_MAX_CAMERAS_IN_USE,
                        -> onProblem(busyText)

                        CameraState.ERROR_CAMERA_DISABLED,
                        CameraState.ERROR_CAMERA_FATAL_ERROR,
                        -> onProblem(failedText)

                        else -> {}
                    }
                }
            } catch (error: IllegalStateException) {
                onProblem(failedText)
            } catch (error: IllegalArgumentException) {
                onProblem(failedText)
            }
        }, mainExecutor)

        onDispose {
            // unbindAll ist hier nicht zu grob: Diese App hat genau einen
            // Kamera-Nutzer. Der Zustands-Beobachter haengt am selben
            // LifecycleOwner und endet mit dem letzten Zustand der Kamera.
            provider?.unbindAll()
            analysisExecutor.shutdown()
        }
    }

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(Dimens.gapPair),
    ) {
        Box(
            modifier = Modifier
                // Quadratisch, weil ein QR-Code quadratisch ist — und auf
                // 22 rem (352 dp) begrenzt, damit der Sucher nicht die halbe
                // Seite einnimmt. Beides die Masse aus `panels.css`.
                .widthIn(max = 352.dp)
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(RoundedCornerShape(Dimens.radiusPanel))
                .background(colors.surfaceFill),
        ) {
            AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())
            ViewfinderMarks(modifier = Modifier.fillMaxSize())
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Dimens.gapPair),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BasicText(
                text = text("viewfinder.hint"),
                style = TextStyles.small.copy(color = colors.ink3),
                modifier = Modifier.weight(1f),
            )
            Key(label = text("key.cameraStop"), onClick = onStop)
        }
    }
}

/**
 * Die vier Eckwinkel — kein Zierrat: Sie zeigen, wohin der QR-Code gehoert.
 *
 * Masse aus `panels.css`: 18 dp Schenkel, 16 dp (`--sp-4`) vom Rand. Strich
 * und Rundung kommen seit N12 aus dem Zeichensatz (`Glyph.stroke`, runde
 * Kappen, gerundete Ecke) — sie sind damit dieselben wie am Winkel und am
 * Zifferblatt. Gezeichnet statt aus einer Icon-Bibliothek, und ohne Semantik:
 * Im Web sind die vier Spans `aria-hidden`.
 */
@Composable
private fun ViewfinderMarks(modifier: Modifier = Modifier) {
    val colors = LocalColors.current

    Canvas(modifier = modifier) {
        val inset = Dimens.sp4.toPx()
        val leg = 18.dp.toPx()
        val w = size.width
        val h = size.height

        drawViewfinderCorner(inset, inset, true, true, leg, colors.signal)
        drawViewfinderCorner(w - inset, inset, false, true, leg, colors.signal)
        drawViewfinderCorner(inset, h - inset, true, false, leg, colors.signal)
        drawViewfinderCorner(w - inset, h - inset, false, false, leg, colors.signal)
    }
}

/* ── „QR aus Bild": der Photo-Picker-Weg ────────────────────────────────── */

private sealed interface PickOutcome {
    class Found(val text: String) : PickOutcome
    data object NoQr : PickOutcome
    data object Unreadable : PickOutcome
}

/**
 * Dekodiert ein gewaehltes Bild — vollstaendig abseits des Main-Threads.
 *
 * Der Photo Picker liefert eine `content://`-URI ohne jede
 * Speicher-Berechtigung; gelesen wird sie genau zweimal (Masse, dann
 * verkleinert die Pixel). Gemessen am haeufigsten Fall — ein
 * Handy-Bildschirmfoto — bleibt der ganze Weg unter der 150-ms-Schwelle,
 * ab der die Web-Fassung ihren Wartezeiger zeigt; groessere Kamerafotos
 * kappt `MAX_IMAGE_EDGE` vorher.
 */
private suspend fun decodePickedImage(context: Context, uri: Uri): PickOutcome =
    withContext(Dispatchers.Default) {
        val bitmap = readScaledBitmap(context, uri) ?: return@withContext PickOutcome.Unreadable
        val pixels = IntArray(bitmap.width * bitmap.height)
        bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
        val width = bitmap.width
        val height = bitmap.height
        bitmap.recycle()

        val text = decodeQrPixels(pixels, width, height)
        if (text == null) PickOutcome.NoQr else PickOutcome.Found(text)
    }

/** Laedt das Bild in Zweierpotenzen verkleinert; `null`, wenn es keins ist. */
private fun readScaledBitmap(context: Context, uri: Uri): Bitmap? {
    val resolver = context.contentResolver
    return try {
        /* Der Maessen-Durchgang. VORSICHT, hier sass ein gemessener Fehler:
           `decodeStream` gibt mit `inJustDecodeBounds` IMMER null zurueck —
           es fuellt nur die Options. Ein Elvis auf diesem Rueckgabewert
           erklaerte jedes gueltige Bild fuer unlesbar. Ob es ein Bild war,
           sagen allein die outWidth/outHeight danach. */
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        val measured = resolver.openInputStream(uri) ?: return null
        measured.use { BitmapFactory.decodeStream(it, null, bounds) }
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= MAX_IMAGE_EDGE) {
            sample *= 2
        }

        val options = BitmapFactory.Options().apply {
            inSampleSize = sample
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }
        resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }
    } catch (error: IOException) {
        // „Das Bild konnte nicht gelesen werden — ist es wirklich ein Bild?"
        null
    } catch (error: SecurityException) {
        // Die URI kann zwischen Wahl und Lesen ungueltig werden (Anbieter
        // widerruft) — derselbe Nutzertext, denn der Ausweg ist derselbe.
        null
    }
}
