# Mathe-Labore

Interaktive HTML-Visualisierungen für den Mathematikunterricht (Klasse 8 und 9). Jede Datei ist eigenständig und läuft ohne Server direkt im Browser.

## `labore/`

| Datei | Klasse | Inhalt |
|---|---|---|
| `Geraden-Labor.html` | 8 | Lineare Funktionen: Steigung und y-Achsenabschnitt erkunden, Gerade durch zwei Punkte, Rechentrainer mit 4 Stufen, Profi-Fragen |
| `Parabel-Labor.html` | 9 | Quadratische Funktionen: pq-Formel, drei Formen (Normal-, Scheitelpunkt-, Nullstellenform), Scheitelpunktform, Rechentrainer, Profi-Fragen |
| `Scheitelpunktform.html` | 9 | Scheitelpunktform mit Reglern und Quiz |

Gestaltung: Dark Mode, Regler in kleinen Schritten, Farbcode für die Parameter.
Im Rechentrainer schalten 3 richtige Aufgaben die nächste Stufe frei. Danach öffnet sich der Profi-Tab mit Multiple-Choice-Verständnisfragen.
Mit `#alle` am Ende der Adresse sind alle Stufen und der Profi-Tab sofort offen (für die Lehrkraft).

## `adminpanel/`

Version der beiden Labore mit Anmeldung und Lehrer-Oberfläche, als Google-Apps-Script-Web-App:

- Die Kinder melden sich nur mit ihrem Vornamen an.
- Die Lehrkraft schaltet die Tabs nacheinander frei.
- Die Lehrkraft sieht live, wer online ist und wie weit jedes Kind ist.

Einrichtung: siehe [`adminpanel/ANLEITUNG.md`](adminpanel/ANLEITUNG.md).

Die Seiten für die Kinder und das Adminpanel laufen über GitHub Pages aus `docs/`:
[amueller-89.github.io/mathe-labore](https://amueller-89.github.io/mathe-labore/) (`/geraden`, `/parabel`, `/admin`).
Sie sprechen das Apps Script über `doPost` an. Dessen Adresse steht in `docs/config.js`.
`docs/` wird von `build_labs.py` erzeugt.

- `Code.gs`: Server (Google Apps Script, Daten in einer Google-Tabelle)
- `Admin.html`: Lehrer-Oberfläche
- `Geraden.html`, `Parabel.html`: werden von `build_labs.py` aus den Dateien in `labore/` erzeugt. Nicht von Hand ändern, sondern das Original ändern und neu bauen:

```sh
python3 adminpanel/build_labs.py
```

### Lokal testen

`tests/mockserver.js` führt `Code.gs` mit nachgebauten Google-Diensten aus. `tests/ta1.js` spielt mit Playwright eine Unterrichtsstunde durch: Anmeldung, Freigaben, Rechnerwechsel, Profi, Entfernen.

```sh
node adminpanel/tests/mockserver.js 8765 &
node adminpanel/tests/ta1.js              # Apps-Script-Modus
MODE=pages node adminpanel/tests/ta1.js   # GitHub-Pages-Modus
```
