# Labor mit Adminpanel: Einrichtung

Diese Version von Geraden-Labor (UIIIb) und Parabel-Labor (OIIIa) läuft als Google-Apps-Script in deinem Google-Konto.
Die Kinder melden sich mit ihrem Vornamen an. Du schaltest im Admin-Link die Tabs frei und siehst den Fortschritt.
Die Originaldateien in `Visualisierungen/` bleiben unverändert.

Dateien in diesem Ordner:

- `Code.gs` kommt in den Apps-Script-Editor (das ist das Einzige, was du kopierst).
- `Admin.html`, `Geraden.html`, `Parabel.html` bleiben einfach hier liegen. Das Script liest sie direkt aus diesem Ordner.
  Bitte nicht umbenennen oder verschieben.

## Einmalig einrichten (ca. 10 Minuten)

1. **Tabelle anlegen:** In Google Drive in diesem Ordner auf *Neu → Google Tabellen* klicken und die Tabelle z. B. „Labor-Daten“ nennen.
2. **Script öffnen:** In der Tabelle *Erweiterungen → Apps Script*. Oben links das Projekt z. B. „Labor“ nennen.
3. **Code.gs:** Den ganzen Inhalt der vorhandenen Datei `Code.gs` löschen und den Inhalt von `Code.gs` aus diesem Ordner einfügen.
   Ganz oben bei `ADMIN_SCHLUESSEL` statt `bitte-aendern` ein eigenes Wort eintragen (nur Buchstaben und Ziffern, z. B. `Kreide42Mond`).
4. Speichern (Strg+S / Cmd+S). HTML-Dateien musst du im Editor **nicht** anlegen.
5. **Bereitstellen:** Oben rechts *Bereitstellen → Neue Bereitstellung*. Beim Zahnrad „Typ auswählen“ **Web-App** wählen.
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**

   Dann *Bereitstellen*. Google fragt nach Zugriff auf die Tabelle und auf Google Drive (zum Lesen der HTML-Dateien): *Zugriff autorisieren*, dein Konto wählen.
   Kommt „Google hat diese App nicht überprüft“: *Erweitert → Zu Labor wechseln (unsicher)* → *Zulassen*. Das ist normal bei eigenen Scripts.
6. **Web-App-URL kopieren** (endet auf `/exec`). Das ist die Grundadresse für alle Links.

## Die Links

- Kinder UIIIb: `WEB-APP-URL?lab=geraden`
- Kinder OIIIa: `WEB-APP-URL?lab=parabel`
- Du (Admin): `WEB-APP-URL?admin=DEIN-SCHLUESSEL` (z. B. als Lesezeichen speichern)

Der Link für die Kinder steht auch im Adminpanel zum Kopieren. Die Adresse ist lang. Am einfachsten verteilst du sie im Computerraum über eine Datei oder eine Nachricht, die die Kinder anklicken.

## So funktioniert es im Unterricht

- **Anmelden:** Beim ersten Aufruf tippen die Kinder ihren Vornamen ein. Mit genau demselben Namen geht es an jedem Rechner weiter (Groß/Kleinschreibung egal). Sitzt am selben Rechner später ein anderes Kind, fragt die Seite „Bist du …?“, und es kann „Nein, ich bin jemand anderes“ wählen.
- **Freischalten:** Am Anfang ist nur Tab 1 frei. Im Adminpanel tippst du auf einen Tab, um ihn freizugeben oder wieder zu sperren. Bei den Kindern ändert sich das spätestens nach 20 Sekunden, ohne Neuladen. Ist gar nichts frei, sehen die Kinder „Gleich geht’s los“.
- **Profi ★:** Diesen Tab sieht ein Kind nur, wenn du ihn freigegeben hast **und** es alle 4 Stufen im Rechentrainer geschafft hat (3 richtige je Stufe).
- **Überwachen:** Das Adminpanel aktualisiert sich alle 10 Sekunden. Es zeigt, wer online ist, in welchem Tab das Kind gerade ist, die Punkte je Stufe mit Fehlversuchen (✗), 🏆 bei geschafftem Rechentrainer, und den Stand im Profi-Teil.
- **Entfernen:** Löscht ein Kind samt Fortschritt, z. B. bei einem Tippfehler im Namen. Meldet es sich wieder an, fängt es von vorn an.
- **Was gespeichert wird:** Der Rechentrainer-Fortschritt kommt beim Rechnerwechsel mit. Der Profi-Teil fängt an einem neuen Rechner wieder bei Frage 1 an, das Adminpanel zeigt aber den letzten Stand. Die Rohdaten stehen im Blatt „Schueler“ der Tabelle.
- Die Kinder sehen oben einen grauen Google-Balken („Diese Anwendung wurde von einem Google Apps Script-Nutzer erstellt“). Das lässt sich bei privaten Konten nicht abschalten.

## Datenschutz

Die eingetippten Namen liegen in deinem Google-Konto. Lass die Kinder deshalb nur Vornamen oder Spitznamen eintippen und prüfe, ob deine Schule dafür Vorgaben hat.
Zum Aufräumen nach der Einheit: im Adminpanel alle entfernen oder in der Tabelle das Blatt „Schueler“ leeren.

## Wenn sich etwas ändern soll

- **Neue Version einer HTML-Datei** (z. B. neue Profi-Fragen): Sie wird einfach hier im Ordner ersetzt und ist sofort aktiv. Du musst nichts tun.
- **Neue Version von Code.gs:** Inhalt im Editor ersetzen, speichern, dann *Bereitstellen → Bereitstellungen verwalten → Stift (Bearbeiten) → Version: Neue Version → Bereitstellen*.
  So bleibt die Adresse gleich. Eine *neue* Bereitstellung würde eine neue Adresse erzeugen.
