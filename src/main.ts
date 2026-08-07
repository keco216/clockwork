/**
 * Einstiegspunkt.
 *
 * Der Import des Stylesheets ist kein Zufall, sondern Absicht: Vite bündelt es
 * dadurch mit ins Ergebnis. Beim Single-File-Build landet das CSS als
 * `<style>`-Block direkt in der HTML-Datei — und die Datei bleibt vollständig
 * offline lauffähig, ohne irgendetwas nachzuladen.
 */

import './style.css';
import { startApp } from './ui/app';

startApp();
