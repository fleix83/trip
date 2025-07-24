# 🚗 Travel Stories - Reisegeschichten

> **GPS-basierte Geschichten während der Autofahrt**

Eine Progressive Web App, die automatisch interessante Geschichten über Orte erzählt, während du fährst. Nutzt GPS-Tracking, KI-Story-Generation und Text-to-Speech für ein hands-free Reiseerlebnis.

[![Live Demo](https://img.shields.io/badge/🚀-Live%20Demo-4CAF50)](https://fleix83.github.io/trip/)
[![PWA Ready](https://img.shields.io/badge/📱-PWA%20Ready-blue)](#progressive-web-app)
[![License MIT](https://img.shields.io/badge/📄-MIT%20License-green)](#lizenz)

## ✨ Features

- 🗺️ **GPS-Tracking** - Automatische Positionserkennung alle 30 Sekunden
- 🤖 **KI-Geschichten** - Generierung mit Google Gemini API
- 🔊 **Text-to-Speech** - Deutsche Sprachausgabe optimiert für Autofahrten  
- 📱 **Mobile-First** - Responsive Design für Smartphone/Tablet
- 🌙 **Dark Mode** - Augenschonend für Nachtfahrten
- 💾 **Offline-Modus** - Fallback-Geschichten ohne Internet
- 🎭 **Simulationsmodus** - Testen ohne GPS für Entwicklung
- 📍 **Smart Caching** - 24h Zwischenspeicherung von Geschichten

## 🚀 Schnellstart

### 1. **Google Gemini API-Schlüssel besorgen**

1. Gehe zu [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Erstelle einen kostenlosen API-Schlüssel
3. Kopiere den Schlüssel (beginnt mit `AIza...`)

### 2. **App öffnen**

**Option A: Direkt nutzen**
```
https://fleix83.github.io/trip/
```

**Option B: Lokal ausführen**
```bash
git clone https://github.com/fleix83/trip.git
cd trip
python -m http.server 8000
# Öffne http://localhost:8000
```

### 3. **Einrichten**

1. 📱 Öffne die App auf deinem Smartphone
2. ⚙️ Klicke auf "Einstellungen"
3. 🔑 Gib deinen Gemini API-Schlüssel ein
4. 💾 Klicke "Speichern"
5. ▶️ Starte deine erste Geschichte!

## 📖 Bedienungsanleitung

### **Für Autofahrten**

1. **Vorbereitung**
   - Smartphone ins Auto-Halterung
   - App öffnen und API-Schlüssel eingeben
   - GPS-Berechtigung erteilen

2. **Während der Fahrt**
   - "▶️ Stories starten" drücken
   - Bei >5km Entfernung neue Geschichte
   - Oder "⏭️ Überspringen" für sofortige Story

3. **Steuerung**
   - 🔄 **Wiederholen** - Aktuelle Geschichte nochmal
   - ⏭️ **Überspringen** - Neue Geschichte anfordern
   - ⏹️ **Stoppen** - Alle Geschichten beenden

### **Einstellungen**

- **🔑 API-Schlüssel** - Gemini API für KI-Geschichten
- **🎚️ Sprechgeschwindigkeit** - 0.5x bis 2.0x
- **🌙 Dark Mode** - Ein/Aus
- **🔧 Debug Modus** - Entwicklerinfos anzeigen
- **🎭 Simulationsmodus** - Test ohne GPS

## 🛠️ Technische Details

### **Tech-Stack**
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **APIs**: Google Gemini, Web Speech, Geolocation, Nominatim
- **PWA**: Service Worker, Web App Manifest
- **Storage**: localStorage, sessionStorage

### **Projektstruktur**
```
trip/
├── index.html          # 📱 Haupt-Interface
├── app.js             # 🧠 Anwendungslogik (1400+ Zeilen)
├── config.js          # ⚙️ Konfiguration & Fallback-Stories
├── style.css          # 🎨 Responsive Dark Mode Design
├── manifest.json      # 📱 PWA Manifest
├── sw.js             # 💾 Service Worker
├── project.md        # 📋 Originalanforderungen
└── README.md         # 📖 Diese Datei
```

### **Story-Pipeline**
```
GPS → Reverse Geocoding → Gemini API → Text-to-Speech
 ↓         ↓                 ↓           ↓
Position  Ortsname      KI-Geschichte  Audio
```

## 🔧 Troubleshooting

### **❌ Keine Geschichten**

**Problem**: App nutzt nur Fallback-Stories
```javascript
// Debug in Browser-Konsole
diagnose()
```

**Lösungen**:
- ✅ API-Schlüssel korrekt eingegeben? (39 Zeichen, `AIza...`)
- ✅ Internet-Verbindung vorhanden?
- ✅ GPS-Berechtigung erteilt?
- ✅ Inkognito-Modus deaktiviert?

### **📍 GPS-Probleme**

**Symptom**: "GPS-Anfrage ist zeitüberschritten"
- ✅ Im Freien testen (nicht in Gebäuden)
- ✅ Standort-Dienste aktiviert
- ✅ Browser-Berechtigung erteilt
- ✅ Simulationsmodus für Tests nutzen

### **🔊 Kein Audio**

**Symptom**: Text wird angezeigt, aber nicht gesprochen
- ✅ Lautstärke aufgedreht
- ✅ Browser unterstützt Web Speech API
- ✅ Deutsche Sprache im System verfügbar
- ✅ Nicht stumm geschaltet

### **📱 Mobile Probleme**

**Android Chrome**:
- localStorage manchmal blockiert → sessionStorage Fallback
- PWA installieren für bessere Performance

**iOS Safari**:
- "Zur Startseite hinzufügen" nutzen
- Vollbild-Modus aktivieren

## 🧪 Entwicklung & Testing

### **Debug-Modus**
```javascript
// Browser-Konsole
diagnose()  // Vollständiger System-Check
```

### **Simulationsmodus**
- ⚙️ Einstellungen → "Simulationsmodus" aktivieren
- Rotiert durch: Basel → Bern → Zürich → Lausanne → Genf
- Perfekt zum Testen ohne Auto fahren zu müssen

### **Performance-Optimierung**
- 💾 Stories 24h gecacht (localStorage)
- 🔄 Rate-Limiting: 1 Request/Sekunde (Nominatim)
- 🎯 Retry-Logic: 3 Versuche mit exponential backoff
- ⚡ Service Worker für Offline-Nutzung

## 🌍 Progressive Web App

### **Installation**

**Android Chrome**:
1. "Zur Startseite hinzufügen" Banner
2. Oder: Menü → "App installieren"

**iOS Safari**:
1. Teilen-Button → "Zum Home-Bildschirm"
2. Icon erscheint auf Startbildschirm

### **Offline-Funktionalität**
- 📄 Core App Files gecacht
- 📚 Fallback-Stories für D-A-CH Region
- 🔄 Background Sync für später

## 🗺️ Roadmap

### **v1.1 (Geplant)**
- [ ] 🎵 Hintergrundmusik-Integration
- [ ] 📊 Statistiken (Kilometer, Stories gehört)
- [ ] 🗺️ Karten-Integration mit Story-Markern
- [ ] 👥 Social Sharing von Lieblings-Stories

### **v1.2 (Ideen)**
- [ ] 🎯 Persönliche Interessen (Geschichte, Natur, etc.)
- [ ] 📱 Push-Notifications für interessante Orte
- [ ] 🌐 Mehrsprachigkeit (EN, FR, IT)
- [ ] 🔗 Integration mit Navigationssystemen

## 🤝 Contributing

Beiträge willkommen! 

1. Fork das Repository
2. Feature-Branch erstellen: `git checkout -b feature/amazing-feature`
3. Committen: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Pull Request öffnen

## ⚖️ Lizenz

MIT License - Details siehe [LICENSE](LICENSE)

## 🙏 Credits

- **KI-Stories**: [Google Gemini API](https://ai.google.dev)
- **Geo-Daten**: [OpenStreetMap Nominatim](https://nominatim.org)
- **Entwicklung**: Claude Code Assistant
- **Icons**: SVG selbst erstellt
- **Fallback-Stories**: Kuratiert für deutsche Regionen

---

**📧 Fragen? Issues? Feedback?**
- GitHub Issues: [github.com/fleix83/trip/issues](https://github.com/fleix83/trip/issues)
- Live Demo: [fleix83.github.io/trip](https://fleix83.github.io/trip)

*Happy Traveling! 🚗💨*