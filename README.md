# GeoQuest - Länder und Hauptstädte dieser Erde

Ein interaktives Geographie-Lernspiel zum Erkunden und Üben von Ländern und Hauptstädten weltweit.

## Über das Projekt

GeoQuest kombiniert spielerisches Lernen mit modernen Lerntechniken. Die Methode ist inspiriert von der Birkenbihl-Methode für gehirngerechtes Lernen und der (antiken) Software "Länder dieser Erde" von Omikron Software.

## Spielmodi

### Entdecken

Klicke auf Länder auf der Weltkarte und höre dir die Namen und Hauptstädte mit Text-to-Speech an. Perfekt zum ersten Kennenlernen und Wiederholen.

### Karten-Quiz

- **Länder finden**: Finde das gesuchte Land auf der Karte
- **Hauptstädte finden**: Klicke auf das Land mit der gesuchten Hauptstadt

### Multiple-Choice-Quiz

- **Länder-Quiz**: Wähle die richtige Hauptstadt zum angezeigten Land
- **Hauptstadt-Quiz**: Wähle das richtige Land zur angezeigten Hauptstadt

## Lernkonzept

GeoQuest folgt dem Prinzip des **gehirngerechten Lernens**: Ablenkungsfreie, fokussierte Vermittlung des Lernstoffs in schneller Abfolge. Durch aktives Wiederholen und unmittelbares Feedback entsteht ein Lernfluss, der es ermöglicht, große Mengen an Information in kurzer Zeit aufzunehmen – so können beispielsweise alle Länder Afrikas in etwa 40 Minuten gelernt werden.

Die Kombination aus visueller Karte, gezielten Fragen und sofortiger Rückmeldung sorgt für:

- **Fokussiertes Lernen** ohne Ablenkung
- **Schnelle Wiederholung** für effektive Einprägung
- **Aktives Abrufen** statt passivem Konsumieren
- **Mehrfache Perspektiven** durch verschiedene Spielmodi

Eine Sprachausgabe unterstützt zusätzlich die Verknüpfung von visuellen und auditiven Reizen.

## Empfohlene Vorgehensweise

**Länder lernen:**
Beginne mit dem Modus **"Karten-Quiz: Länder"**. Die direkte Interaktion mit der Karte prägt die Positionen der Länder am effektivsten ein.

**Hauptstädte lernen:**
Nutze das **"Multiple-Choice-Quiz: Hauptstädte"**. Die Auswahl zwischen mehreren Optionen aktiviert das Gehirn optimal und führt schneller zum Lernerfolg als die Suche auf der Karte.

Wähle jeweils eine Region (z.B. Afrika, Europa) und arbeite diese konzentriert durch, bevor du zur nächsten wechselst.

## Installation und Nutzung

### Online nutzen

GeoQuest kann hier verwendet werden: https://searle.github.io/geoquest/

### Lokal installieren

```bash
git clone https://github.com/searle/geoguess.git
cd geoguess
yarn
yarn run dev
```

Öffne anschließend den im Terminal angezeigten Link (z.B. `http://localhost:5173`) in deinem Browser.

## Datenquellen und Lizenzen

Diese Anwendung nutzt öffentlich verfügbare Geodaten:

- **Länderdaten und Geometrien**: [mledoze/countries](https://github.com/mledoze/countries) (Open Database License)
- **Deutsche Übersetzungen**: [GeoNames.org](https://www.geonames.org/) (Creative Commons Attribution 4.0 License)

## Technisches

TypeScript und React-basierte Webanwendung mit interaktiven Karten und deutscher Sprachausgabe.
