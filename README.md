# Mathe-Labore

Interaktive HTML-Labore für den Mathematikunterricht (Klasse 8 und 9). Alle Labore teilen sich ein Gerüst und werden mit `build.py` zu eigenständigen Dateien gebaut.

## Aufbau

```
labs/                  Quelle: hier wird gearbeitet
  _shared/             gemeinsames Gerüst aller Labore
    page.html          Seitenvorlage (Kopf, Tab-Leiste, Rechentrainer, Profi, Popups)
    base.css           Farben, Layout, Karten, Regler, Popups
    core.js            Helfer, Koordinatensystem (Board), Ziehen, Zahlen einlesen
    trainer.js         Rechentrainer: 4 Stufen, Fortschritt, Prüfen, Musterbeispiel, Glückwunsch
    profi.js           Profi-Quiz
    app.js             Tabs, Adresse (#rechentrainer …), Start
    admin/             Anmeldung + Verbindung zum Apps Script (nur Admin-Version)
    start.html         Startseite für GitHub Pages
  geraden/, parabel/, tangenten/   je ein Labor (siehe unten)
build.py               baut alles in labore/, adminpanel/ und docs/
labore/                fertige eigenständige Dateien (erzeugt)
adminpanel/            Server (Code.gs), Lehrer-Oberfläche (Admin.html), Admin-Versionen (erzeugt)
docs/                  GitHub Pages (erzeugt, bis auf config.js)
```

Nach jeder Änderung in `labs/` oder an `adminpanel/Admin.html`:

```sh
python3 build.py
```

Erzeugte Dateien nie von Hand ändern, sie werden überschrieben.

## `labore/`

| Datei | Klasse | Inhalt |
|---|---|---|
| `Geraden-Labor.html` | 8 | Lineare Funktionen: Steigung und y-Achsenabschnitt erkunden, Gerade durch zwei Punkte, Rechentrainer mit 4 Stufen (Stufe 4: Textaufgaben), Profi-Fragen |
| `Parabel-Labor.html` | 9 | Quadratische Funktionen: Scheitelpunktform, drei Formen (allgemeine Form, Scheitelpunkt-, Nullstellenform), pq-Formel, Rechentrainer, Profi-Fragen |
| `Tangenten-Labor.html` | 9 | Zusatz für Schnelle, nur Erkunden: Tangente an y = x² mit Lupe, Steigungen an Parabeln bestimmen → die Punkte (Stelle | Steigung) liegen auf einer Geraden, Kurve mit x³ → sie liegen auf einer Parabel |
| `Scheitelpunktform.html` | 9 | ältere Einzeldatei, nicht Teil des Builds |

Jede Datei ist eigenständig und läuft ohne Server direkt im Browser.
Im Rechentrainer schalten 3 richtige Aufgaben die nächste Stufe frei. Danach öffnet sich der Profi-Tab mit Multiple-Choice-Verständnisfragen.
Mit `#alle` am Ende der Adresse sind alle Stufen und der Profi-Tab sofort offen (für die Lehrkraft).

## Neues Labor anlegen

1. Ordner `labs/<id>/` anlegen (`<id>` klein, ohne Umlaute, z. B. `potenzen`). Am einfachsten `labs/geraden/` kopieren.
2. `lab.json` (Steckbrief):
   - `id` wie der Ordner, `title` (z. B. „Potenz-Labor“), `thema`, `klasse` (für das Adminpanel)
   - `icon`: SVG-Pfad für das Symbol, 32×32
   - `tabs`: die Erkunden-Tabs mit `id`, `label`, `slug` (für die Adresse). Rechentrainer und Profi kommen automatisch dahinter.
   - `skizze` („Gerade“, „Parabel“ …), `win` (Text im Glückwunsch-Popup), `profi` (Titel bei fast allen Profi-Fragen richtig)
   - `"ueben": false`: nur Erkunden-Tabs, ohne Rechentrainer und Profi (dann entfallen `skizze`, `win`, `profi` und in `lab.js` `LEVELS` … `PRO`; siehe `labs/tangenten/`)
3. `tabs.html`: je Erkunden-Tab eine `<section id="tab-<id>" class="tab">`.
4. `style.css`: nur was dieses Labor zusätzlich braucht (Farbklassen, Formeln).
5. `lab.js`, in dieser Reihenfolge:
   - Code der Erkunden-Tabs (`new Board($("cXy"))`, Regler, Zeichenfunktionen)
   - `LEVELS` (4 Stufen), `makeTask(l)`, `drawTrain()` und `EXAMPLES` (Musterbeispiel je Stufe), Format oben in `_shared/trainer.js`
   - `PRO` (Profi-Fragen), Format oben in `_shared/profi.js`
   - zum Schluss `EXPLORE = { draw, canvases, init, quiz }`, damit das Gerüst die Tabs zeichnen und starten kann
6. `python3 build.py`. Das Labor erscheint in `labore/`, auf GitHub Pages, auf der Startseite und im Adminpanel (die Labor-Liste `adminpanel/Labs.gs` wird mit erzeugt).
7. Für die Google-Version zusätzlich `adminpanel/<Id>.html` in den Drive-Ordner *Adminpanel* legen.

Was in mehr als einem Labor gebraucht wird, gehört nach `labs/_shared/`.

## `adminpanel/`

Version der beiden Labore mit Anmeldung und Lehrer-Oberfläche, als Google-Apps-Script-Web-App:

- Die Kinder melden sich nur mit ihrem Vornamen an.
- Die Lehrkraft schaltet die Tabs nacheinander frei.
- Die Lehrkraft sieht live, wer online ist und wie weit jedes Kind ist.

Einrichtung: siehe [`adminpanel/ANLEITUNG.md`](adminpanel/ANLEITUNG.md).

Die Seiten für die Kinder und das Adminpanel laufen über GitHub Pages aus `docs/`:
[amueller-89.github.io/mathe-labore](https://amueller-89.github.io/mathe-labore/) (`/geraden`, `/parabel`, `/admin`).
Sie sprechen das Apps Script über `doPost` an. Dessen Adresse steht in `docs/config.js`.
`docs/` wird von `build.py` erzeugt (bis auf `config.js`).

- `Code.gs`: Server (Google Apps Script, Daten in den Skripteigenschaften)
- `Admin.html`: Lehrer-Oberfläche
- `Labs.gs`: Labor-Liste für den Server, von `build.py` aus den Steckbriefen erzeugt
- `Geraden.html`, `Parabel.html`: Admin-Versionen der Labore, von `build.py` erzeugt

### Lokal testen

`tests/mockserver.js` führt `Code.gs` mit nachgebauten Google-Diensten aus. `tests/ta1.js` spielt mit Playwright eine Unterrichtsstunde durch: Anmeldung, Freigaben, Rechnerwechsel, Profi, Entfernen.

```sh
node adminpanel/tests/mockserver.js 8765 &
node adminpanel/tests/ta1.js              # Apps-Script-Modus
MODE=pages node adminpanel/tests/ta1.js   # GitHub-Pages-Modus
```
