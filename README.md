# Taj Mahal (Tadsch Mahal) – Webbasierter Lokaler Multiplayer

Eine webbasierte Umsetzung des preisgekrönten Brettspiels **Taj Mahal** von **Reiner Knizia** mit **lokalem asymmetrischem Multiplayer**.

Die technische Architektur orientiert sich exakt an der modernen, kostenlosen Web-Stack-Architektur der lokalen Poker-App:
- **Backend:** Node.js (ESM), Express, Socket.io, qrcode
- **Frontend:** Responsive Web-Standards (HTML5, CSS3, Vanilla JS, SVG-Overlay) – ganz ohne kostenpflichtige Cloud-Dienste oder Build-Tools.
- **Tisch-Client (`table.html`):** Zentrales Spielbrett für PC, Tablet oder TV mit Punkteleiste, Hof des Großmoguls und den 12 Provinzen.
- **Handy-Controller (`player.html`):** Privater Bildschirm für jedes Smartphone mit geheimen Handkarten, Farbzwang-Validierung und Palast-Setz-Auswahl.

---

## Schnellstart

1. **Abhängigkeiten installieren** (bereits erfolgt):
   ```bash
   npm install
   ```

2. **Server starten:**
   Doppelklick auf `start.bat` oder im Terminal:
   ```bash
   npm start
   ```

3. **Spiel eröffnen:**
   - Der Tisch-Bildschirm öffnet sich unter `http://localhost:3000/table.html` (oder `http://localhost:3000`).
   - Klicke auf **"📱 Handy verbinden"**, um den **QR-Code** anzuzeigen.
   - Alle Mitspieler scannen den QR-Code mit ihrer Handykamera (gleiches WLAN) und wählen ihren Spielernamen sowie ihre Spielerfarbe (Rot, Blau, Grün, Gelb, Violett).
   - Klicke am Tisch-Bildschirm auf **"▶ Spiel starten"**.

---

## Ordnerstruktur

```
tadsch-mahal/
├── public/
│   ├── board.jpg             # Originales Spielbrett (1024x719)
│   ├── common.css            # Gemeinsame Farben, Mogul-Thema, Schriftarten
│   ├── index.html            # Startportal (Tisch oder Handy wählen)
│   ├── table.html            # Hauptbrett-Ansicht (Host / Tablet / PC)
│   ├── table.css             # Styling für Hauptbrett & Großanzeige
│   ├── table.js              # SVG-Overlay, Städte, Paläste, Wertungsleiste
│   ├── player.html           # Smartphone-Controller (Handkarten, Züge)
│   ├── player.css            # Touch-optimiertes Smartphone-Layout
│   └── player.js             # Karten-Auswahl, Farbzwang, Palast-Platzierung
├── server/
│   ├── index.js              # Express, Socket.io, QR-Code-Generator, IP-Erkennung
│   ├── taj-mahal-engine.js   # Komplette Knizia-Spiellogik, Mehrheiten & Punkte
│   └── board-data.js         # Graph mit 12 Provinzen, 49 Städten (16 Festungen)
├── test/
│   └── game-engine.test.js   # Node.js Testsuite für Regeln & Berechnungen
├── package.json              # Abhängigkeiten & Scripts
├── start.bat                 # Windows-Starter für Server & Browser
└── README.md
```

---

## Regelumsetzung nach "tadschmahal.pdf"

1. **12 Besuche (Provinzen):**
   - Die Provinzen werden in aufsteigender Reihenfolge ihrer achteckigen Plättchennummern (1 bis 12) besucht.
   - Provinz 12 ist immer Agra (die einzige Provinz mit 5 Städten).

2. **Aktionen im Spielzug:**
   - **Karten ausspielen:** Genau 1 reguläre Farbkarte (+ optional 1 weiße Karte oder Sonderkarte).
   - **Farbzwang:** Ab der zweiten Farbkarte im selben Besuch darf nur dieselbe Farbe wie die erste Farbkarte gespielt werden (außer die Sonderkarte *Freie Farbwahl* wird eingesetzt).

3. **Rückzug & Mehrheiten:**
   - Beim Rückzug vergleicht das System die Symbole des Spielers mit allen verbliebenen aktiven Spielern.
   - **Strikte Mehrheit:** Nur wer *echt mehr* Symbole hat als jeder andere aktive Spieler, gewinnt den jeweiligen Einfluss:
     - **Wesir, General, Mönch, Prinzessin:** Einflussmarke + 1 Palast auf eine freie Stadt in der aktuellen Provinz (auf Festungen wird das Bonusplättchen gewertet).
     - **Großmogul:** Krone + 1 Kronenpalast auf eine beliebige Stadt (auch bereits besetzte Städte!).
     - **Elefant:** Aktuelles achteckiges Provinz-Plättchen.

4. **Punkteberechnung:**
   - **Waren & Plättchen:** 1 Punkt pro Ware auf dem Plättchen + 1 Punkt für jede passende bereits gesammelte Ware.
   - **Palast-Netzwerk (BFS-Graphsuche):** 1 Punkt für die aktuelle Provinz + 1 Punkt für jede andere Provinz, die über eine ununterbrochene Kette eigener Paläste verbunden ist.
   - **Schlusswertung (nach Besuch 12):** 1 Punkt je Sonderkarte, weiße Karte und Karte der meistvertretenen Handkartenfarbe ("längste Farbe").
