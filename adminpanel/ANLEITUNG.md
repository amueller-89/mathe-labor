# Labor mit Adminpanel: Einrichtung

Diese Version von Geraden-Labor (UIIIb) und Parabel-Labor (OIIIa) läuft als Google-Apps-Script in deinem Google-Konto.
Die Kinder melden sich mit ihrem Vornamen an. Du schaltest im Admin-Link die Tabs frei und siehst den Fortschritt.
Die Originaldateien in `Visualisierungen/` bleiben unverändert.

Dateien in diesem Ordner:

- `Code.gs` und `Labs.gs` (Liste der Labore) gehören ins Apps-Script-Projekt. Das erledigt die automatische Bereitstellung (unten); von Hand: beide Dateien im Editor anlegen und den Inhalt einfügen.
- `Admin.html`, `Geraden.html`, `Parabel.html` bleiben einfach hier liegen. Das Script liest sie direkt aus diesem Ordner.
  Bitte nicht umbenennen oder verschieben.

## Einmalig einrichten (ca. 10 Minuten)

1. **Tabelle anlegen:** In Google Drive in diesem Ordner auf *Neu → Google Tabellen* klicken und die Tabelle z. B. „Labor-Daten“ nennen.
2. **Script öffnen:** In der Tabelle *Erweiterungen → Apps Script*. Oben links das Projekt z. B. „Labor“ nennen.
3. **Code.gs:** Den ganzen Inhalt der vorhandenen Datei `Code.gs` löschen und den Inhalt von `Code.gs` aus diesem Ordner einfügen.
4. Speichern (Strg+S / Cmd+S). HTML-Dateien musst du im Editor **nicht** anlegen.
   **Admin-Schlüssel:** Links das Zahnrad *Projekteinstellungen* → ganz unten *Skripteigenschaften* → *Skripteigenschaft hinzufügen*:
   Name `ADMIN_SCHLUESSEL`, Wert ein eigenes Wort (nur Buchstaben und Ziffern, z. B. `Kreide42Mond`). Speichern.
   Der Schlüssel steht damit nicht im Code und bleibt bei jedem Update erhalten.
5. **Bereitstellen:** Oben rechts *Bereitstellen → Neue Bereitstellung*. Beim Zahnrad „Typ auswählen“ **Web-App** wählen.
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**

   Dann *Bereitstellen*. Google fragt nach Zugriff auf die Tabelle und auf Google Drive (zum Lesen der HTML-Dateien): *Zugriff autorisieren*, dein Konto wählen.
   Kommt „Google hat diese App nicht überprüft“: *Erweitert → Zu Labor wechseln (unsicher)* → *Zulassen*. Das ist normal bei eigenen Scripts.
6. **Web-App-URL kopieren** (endet auf `/exec`). Das ist die Grundadresse für alle Links.

## Die Links (GitHub Pages, ohne Google-Banner)

Die Seiten liegen auf GitHub Pages und holen sich die Daten im Hintergrund vom Apps Script.

- Startseite: `https://amueller-89.github.io/mathe-labor/`
- Kinder UIIIb: `https://amueller-89.github.io/mathe-labor/gerade`
- Kinder OIIIa: `https://amueller-89.github.io/mathe-labor/parabel`
- Du (Admin): `https://amueller-89.github.io/mathe-labor/admin`: fragt einmal nach dem Admin-Schlüssel und merkt ihn sich in diesem Browser.

Die Adresse des Scripts steht in `docs/config.js` im GitHub-Repo. Sie ändert sich nicht, solange du bei Updates *Bereitstellungen verwalten → Bearbeiten → Neue Version* benutzt.

Die alten Google-Links (`WEB-APP-URL?lab=geraden` usw.) funktionieren weiterhin, aber mit Banner.

## So funktioniert es im Unterricht

- **Anmelden:** Beim ersten Aufruf tippen die Kinder ihren Vornamen ein. Mit genau demselben Namen geht es an jedem Rechner weiter (Groß/Kleinschreibung egal). Sitzt am selben Rechner später ein anderes Kind, fragt die Seite „Bist du …?“, und es kann „Nein, ich bin jemand anderes“ wählen.
- **Freischalten:** Am Anfang ist nur Tab 1 frei. Im Adminpanel tippst du auf einen Tab, um ihn freizugeben oder wieder zu sperren. Bei den Kindern ändert sich das spätestens nach 20 Sekunden, ohne Neuladen. Ist gar nichts frei, sehen die Kinder „Gleich geht’s los“.
- **Profi ★:** Diesen Tab sieht ein Kind nur, wenn du ihn freigegeben hast **und** es alle 4 Stufen im Rechentrainer geschafft hat (3 richtige je Stufe).
- **Überwachen:** Das Adminpanel aktualisiert sich alle 5 Sekunden. Es zeigt, wer online ist, in welchem Tab das Kind gerade ist, die Punkte je Stufe mit Fehlversuchen (✗), 🏆 bei geschafftem Rechentrainer, und den Stand im Profi-Teil.
- **Sammelknöpfe:** *Alle Tabs freischalten* / *Alle Tabs verstecken*. *Alle zurücksetzen*: alle behalten ihren Namen, fangen aber bei null an (die Labore laden sich dafür kurz neu). *Alle löschen*: alle Namen und Fortschritte dieses Labors weg. Die beiden letzten brauchen einen zweiten Klick zur Bestätigung.
- **Neu laden:** Die Adresse merkt sich den Tab (z. B. `…/geraden#rechentrainer`). Nach F5 landen die Kinder ohne Nachfrage wieder dort.
- **Entfernen:** Löscht ein Kind samt Fortschritt, z. B. bei einem Tippfehler im Namen. Meldet es sich wieder an, fängt es von vorn an.
- **Was gespeichert wird:** Der Rechentrainer-Fortschritt kommt beim Rechnerwechsel mit. Der Profi-Teil fängt an einem neuen Rechner wieder bei Frage 1 an, das Adminpanel zeigt aber den letzten Stand. Die Daten liegen in den Skripteigenschaften des Scripts (schnell und ohne Stau bei vielen gleichzeitigen Anmeldungen). Das Blatt „Schueler“ der Tabelle stammt aus der alten Version und wird nicht mehr benutzt.
- Die Kinder sehen oben einen grauen Google-Balken („Diese Anwendung wurde von einem Google Apps Script-Nutzer erstellt“). Das lässt sich bei privaten Konten nicht abschalten.

## Datenschutz

Die eingetippten Namen liegen in deinem Google-Konto. Lass die Kinder deshalb nur Vornamen oder Spitznamen eintippen und prüfe, ob deine Schule dafür Vorgaben hat.
Zum Aufräumen nach der Einheit: im Adminpanel *Alle löschen*.

## Wenn sich etwas ändern soll

- **Neue Version einer HTML-Datei** (z. B. neue Profi-Fragen): Sie wird einfach hier im Ordner ersetzt und ist sofort aktiv. Du musst nichts tun.
- **Neue Version von Code.gs / Labs.gs:** passiert automatisch, sobald die automatische Bereitstellung (unten) eingerichtet ist.
  Von Hand: Inhalt im Editor ersetzen, speichern, dann *Bereitstellen → Bereitstellungen verwalten → Stift (Bearbeiten) → Version: Neue Version → Bereitstellen*.
  So bleibt die Adresse gleich. Eine *neue* Bereitstellung würde eine neue Adresse erzeugen.

## Automatisch bereitstellen (einmalig einrichten, ca. 10 Minuten)

Danach landet jede Änderung an `Code.gs` oder `Labs.gs` im GitHub-Repo von selbst im Apps Script, als neue Version der bestehenden Bereitstellung (gleiche Adresse).
Das erledigt der GitHub-Workflow `.github/workflows/apps-script.yml` mit Googles Werkzeug *clasp*.

1. **Apps Script API einschalten:** https://script.google.com/home/usersettings öffnen, *Google Apps Script API* auf **An**.
2. **Script-ID notieren:** Im Apps-Script-Editor *Projekteinstellungen* (Zahnrad) → *IDs* → *Script-ID* kopieren.
3. **Bei clasp anmelden (auf dem Laptop, Terminal):**
   ```sh
   npx @google/clasp@2.4.2 login
   ```
   Es öffnet sich der Browser, dein Google-Konto wählen, *Zulassen*. Danach liegt in deinem Home-Ordner die Datei `~/.clasprc.json`.
   Wichtig: genau Version 2.4.2 nehmen, der Workflow erwartet deren Dateiformat.
4. **Zwei Secrets im GitHub-Repo anlegen:** github.com/amueller-89/mathe-labore → *Settings → Secrets and variables → Actions → New repository secret*:
   - `CLASPRC_JSON`: kompletter Inhalt von `~/.clasprc.json` (z. B. `cat ~/.clasprc.json | pbcopy`, dann einfügen)
   - `SCRIPT_ID`: die Script-ID aus Schritt 2
5. **Testen:** Repo → *Actions → Apps Script bereitstellen → Run workflow*. Grüner Haken = fertig.
   Im Apps-Script-Editor unter *Bereitstellungen verwalten* steht dann eine neue Version „GitHub …“.

Hinweis: `CLASPRC_JSON` ist ein Zugangsschlüssel zu deinen Scripts und deinem Drive. GitHub zeigt Secrets niemandem an, auch nicht im öffentlichen Repo.
Zum Widerrufen: https://myaccount.google.com/permissions → *clasp* → Zugriff entfernen.

**Ohne GitHub-Secret (Laptop-Variante):** Schritte 1 bis 3, dann im Ordner `adminpanel/` eine Datei `.clasp.json` mit `{"scriptId":"DEINE-SCRIPT-ID","rootDir":"."}` anlegen (ist in `.gitignore`).
Danach genügt nach jeder Änderung `sh adminpanel/deploy.sh`.
