# Travel Stories Web-App

Eine Web-Anwendung, die während der Autofahrt interessante Geschichten über Ortschaften erzählt.

## Features

- 🚗 GPS-basierte Ortserkennung
- 📖 Automatische Generierung von Geschichten über lokale Orte
- 🔊 Text-to-Speech Ausgabe
- 📱 Responsive Design für mobile Nutzung
- 🌙 Dark Mode für augenschonende Bedienung
- ⚙️ Konfigurierbare Einstellungen

## Technologie-Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **APIs**: 
  - Google Gemini API (Content-Generierung)
  - Web Speech API (Text-to-Speech)
  - Geolocation API (GPS)
  - OpenStreetMap Nominatim (Reverse Geocoding)

## Setup

### 1. Google Gemini API Key

1. Besuche [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Erstelle einen neuen API-Schlüssel
3. Öffne die App und gehe zu den Einstellungen
4. Gib deinen API-Schlüssel ein und speichere ihn

### 2. Installation

```bash
# Repository klonen oder Dateien herunterladen
git clone [repository-url]
cd travel-stories

# Lokalen Server starten (optional)
python -m http.server 8000
# oder
npx serve .
```

### 3. Nutzung

1. Öffne `index.html` in einem modernen Browser
2. Erlaube GPS-Zugriff wenn gefragt
3. Gib deinen Gemini API-Schlüssel in den Einstellungen ein
4. Klicke auf "Stories starten"
5. Fahre los und höre interessante Geschichten!

## Browser-Kompatibilität

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## Datenschutz

- Alle Daten werden lokal im Browser gespeichert
- GPS-Daten werden nur für die Ortserkennung verwendet
- API-Schlüssel wird sicher im localStorage gespeichert
- Keine Datenübertragung an Drittanbieter außer den konfigurierten APIs

## Entwicklung

### Projektstruktur

```
travel-stories/
├── index.html          # Haupt-Interface
├── app.js             # Anwendungslogik
├── config.js          # Konfiguration
├── style.css          # Styling
├── README.md          # Diese Datei
└── project.md         # Projektbeschreibung
```

### TODO

- [ ] Implementierung der Hauptfunktionalität
- [ ] GPS-Integration
- [ ] Gemini API Integration
- [ ] Text-to-Speech Implementation
- [ ] Fehlerbehandlung
- [ ] Testing

## Lizenz

MIT License - Siehe LICENSE Datei für Details