/**
 * Einstiegspunkt.
 *
 * Der Import des Stylesheets ist kein Zufall, sondern Absicht: Vite bündelt es
 * dadurch mit ins Ergebnis. Beim Single-File-Build landet das CSS als
 * `<style>`-Block direkt in der HTML-Datei — und die Datei bleibt vollständig
 * offline lauffähig, ohne irgendetwas nachzuladen.
 *
 * Die Reihenfolge unten ist wichtig: Erst steht die Sprache fest, dann wird das
 * Dokument beschriftet, dann verdrahtet sich die App. Andersherum würde die
 * Oberfläche einen Wimpernschlag lang in der Basissprache dastehen und beim
 * ersten Zeichnen umspringen.
 */

import './style.css';
import { applyStaticStrings } from './i18n/apply';
import { initLanguage } from './i18n/language';
import { startApp } from './ui/app';

/* PROTOTYP für die V7-Variantenwahl: `?shell=a|b|c` schaltet eine der drei
   Grob-Kompositionen aus styles/v7-shells.css an. Fliegt zusammen mit jener
   Datei wieder raus, sobald die Variante feststeht.

   Bewusst gegen eine Liste geprüft und nicht durchgereicht: Der Wert landet als
   Attribut im Dokument, und ein Attributwert aus der Adresszeile ist eine
   Nutzereingabe wie jede andere. */
const shell = new URLSearchParams(window.location.search).get('shell');
if (shell !== null && ['a', 'b', 'c'].includes(shell)) {
  document.documentElement.dataset['shell'] = shell;
}

initLanguage();
applyStaticStrings();
startApp();
