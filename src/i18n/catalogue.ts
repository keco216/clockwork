/**
 * Alle Sprachen in einem Objekt.
 *
 * ── Warum alles gebündelt wird und nichts nachgeladen ──────────────────────
 * Weil diese App offline funktionieren muss — auch als eine einzelne HTML-Datei
 * auf einem USB-Stick. Ein `import()` je Sprache wäre eine Netzwerkanfrage, und
 * genau die darf es hier nicht geben (CSP: `connect-src 'none'`). Die
 * Textmenge ist klein genug, dass das kein Handel ist: Der gesamte Katalog
 * wiegt weniger als eine einzige Schriftdatei.
 */

import type { Catalogue } from './runtime';

import ar from './locales/ar';
import bg from './locales/bg';
import cs from './locales/cs';
import da from './locales/da';
import de from './locales/de';
import el from './locales/el';
import en from './locales/en';
import es from './locales/es';
import et from './locales/et';
import fi from './locales/fi';
import fr from './locales/fr';
import he from './locales/he';
import hi from './locales/hi';
import hr from './locales/hr';
import hu from './locales/hu';
import id from './locales/id';
import it from './locales/it';
import ja from './locales/ja';
import ko from './locales/ko';
import lt from './locales/lt';
import lv from './locales/lv';
import nb from './locales/nb';
import nl from './locales/nl';
import pl from './locales/pl';
import ptBR from './locales/pt-BR';
import ptPT from './locales/pt-PT';
import ro from './locales/ro';
import ru from './locales/ru';
import sk from './locales/sk';
import sl from './locales/sl';
import sv from './locales/sv';
import th from './locales/th';
import tr from './locales/tr';
import uk from './locales/uk';
import vi from './locales/vi';
import zhHans from './locales/zh-Hans';
import zhHant from './locales/zh-Hant';

export const CATALOGUE: Catalogue = {
  de,
  en,
  fr,
  it,
  es,
  'pt-PT': ptPT,
  'pt-BR': ptBR,
  nl,
  pl,
  cs,
  sk,
  hu,
  sl,
  hr,
  ro,
  bg,
  el,
  sv,
  da,
  nb,
  fi,
  et,
  lv,
  lt,
  tr,
  ru,
  uk,
  ar,
  he,
  hi,
  id,
  vi,
  th,
  ja,
  ko,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
};
