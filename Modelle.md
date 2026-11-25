# Physikalische Modelle und Vereinfachungen

Diese Übersicht dokumentiert die implementierten Modelle, nicht die vollständige Beschreibung eines realen Stromnetzes oder Ladegeräts. Gemeinsamer Vertrag: `Konzept.md`. Die konkreten Funktionen stehen im Skript `physics` von `index.html`.

## 1. Idealer Transformator

`U₂ = U₁ · N₂ / N₁`

- U₁ und U₂: Effektivwerte sinusförmiger Wechselspannungen, in Volt.
- N₁ und N₂: Windungszahlen; keine Einheit.
- Geführte Versuche: U₁ = 6 V, N₁ = 100, N₂ = 100 / 200 / 50 → U₂ = 6 / 12 / 3 V.
- Anschließend freie Variation: U₁ = 2–12 V, Windungszahlen = 50–400 in 50er-Schritten.
- Der gemeinsame Eisenkern koppelt den magnetischen Fluss an beide getrennten Spulen.
- Idealisierung: vollständige Kopplung, keine Wicklungs-/Kernverluste, keine Sättigung, keine Lastsimulation. Die Wicklungen werden nur schematisch gezeichnet; die Zahl gezeichneter Bögen ist nicht die reale Windungszahl.

Bei gegebener Primärspannung und Primärwindungszahl wächst die Sekundärspannung proportional mit N₂. Die Regel „höher/niedriger als die Primärspannung“ setzt den Vergleich N₂ mit N₁ voraus.

## 2. Magnetfeld und Gleichstromvergleich

Die Animation verwendet eine dimensionslose Modellphase θ. `flux = −(U₁/N₁) cos(θ)` ist ein **normiertes Flusssignal**, kein kalibrierter Fluss in Weber. Der Betrag steuert die Sichtbarkeit, das Vorzeichen die Pfeilrichtung. Für feste Modellfrequenz ist die Flussamplitude proportional U₁/N₁; die Anzeige ist zur Sichtbarkeit begrenzt.

Die Testfunktion berechnet `instant = √2 · U₁ · N₂/N₁ · sin(θ)`. Damit stimmt die Phase mit der Ableitung des normierten Flusses überein; das Vorzeichen hängt von der gewählten Wicklungs-/Messrichtung ab. Die sichtbaren Spannungsanzeigen zeigen weiterhin **Effektivwerte**, keine Momentanwerte. Die Animation läuft stark zeitgedehnt, nicht mit Netzfrequenz.

Der Gleichstromvergleich ist ausdrücklich ein separates stationäres Strom-/Feldmodell: konstanter Primärstrom → konstanter magnetischer Fluss → keine dauerhafte induzierte Sekundärspannung. Ein- und Ausschalten können kurzzeitig Spannung induzieren, werden aber nicht simuliert. Eine dauernde Gleichspannungsquelle an einer ideal verlustlosen Spule wäre kein stationärer Gleichstromzustand und wird deshalb nicht behauptet.

Pause friert die Animation als Momentaufnahme ein; sie bedeutet keinen physikalischen Wechsel zu Gleichstrom. Reduced Motion startet pausiert. Beim Drucken, im Hintergrund und außerhalb des Labortabs wird die Feldanimation nicht fortgeschrieben.

## 3. Expertenauftrag A: Fernleitung

Einphasiges, ohmsches Ersatzmodell ohne Blindleistung:

- Empfangsleistung P = 10 MW = 10.000.000 W, konstant.
- Schleifenwiderstand R = 10 Ω, konstant.
- U ist die Spannung **am Empfangsende**: 20 / 110 / 220 / 380 kV.
- I = P/U.
- Verlustleistung Pᵥ = I²R.
- Einspeiseleistung Pₑᵢₙ = P + Pᵥ.
- Einspeisespannung Uₑᵢₙ = U + IR.

Die beiden letzten Beziehungen verhindern einen Energie-Widerspruch: Die Quelle muss die Nutzleistung **und** die Leitungsverluste bereitstellen. Stets gilt Uₑᵢₙ · I = Pₑᵢₙ. Der Wärmebalken ist relativ zum Verlust bei 20 kV normiert, keine Prozentanzeige des gesamten Wirkungsgrads.

| U am Empfang | I | Wärmeverlust | Einspeiseleistung |
|---:|---:|---:|---:|
| 20 kV | 500,00 A | 2.500,00 kW | 12,5000 MW |
| 110 kV | 90,91 A | 82,64 kW | 10,0826 MW |
| 220 kV | 45,45 A | 20,66 kW | 10,0207 MW |
| 380 kV | 26,32 A | 6,93 kW | 10,0069 MW |

Die Werte sind aus dem Modell berechnet, keine Messwerte eines realen Netzes. Das reale Höchstspannungsnetz ist dreiphasig; dort bezeichnet 380 kV eine Außenleiterspannung. Die hier berechneten Ströme dürfen deshalb nicht als reale Dreiphasen-Netzströme interpretiert werden. Vernachlässigt werden u. a. Blindleistung, Kapazität, Induktivität, Temperaturabhängigkeit und Isolations-/Koronaeffekte. Mehrere Umspannstufen bis zum Haushaltsnetz bleiben ausdrücklich Teil der Energiekette.

## 4. Expertenauftrag B: Ladegerät

Ein **Prinzipmodell**, kein realer Ladegeräte-Schaltplan:

- U₁ = 230 V Wechselspannung, N₁ = 460.
- N₂ = 10 / 20 / 40 / 80 / 460 → U₂ = 5 / 10 / 20 / 40 / 230 V Wechselspannung.
- Die Zielgröße 5 V ~ ist eine modellhafte Zwischenstufe. Sie ist weder fertige Smartphone-Gleichspannung noch Akkuspannung.
- Ein modernes Ladegerät nutzt weitere Elektronik: Netzgleichrichtung → Hochfrequenz-Schalten → HF-Übertrager → Ausgangsgleichrichtung, Filterung und Regelung. In vielen Schaltnetzteilen übernimmt ein HF-Übertrager Spannungsanpassung und galvanische Trennung. Bei Flyback-Schaltungen gehört auch die zeitversetzte magnetische Energiespeicherung zum Betrieb; das Labor bildet diese Schaltvorgänge nicht ab.
- Ausgangsspannung und Ladeprotokoll können sich je nach Gerät unterscheiden; Akku-Lademanagement ist nicht simuliert.

Die vereinfachte Untersuchung lehrt das Windungsverhältnis. Sie behauptet nicht, ein einfacher 50-Hz-Transformator allein könne das Smartphone versorgen.

## 5. Energieerhaltung und Sicherheit

Ein Transformator erzeugt keine Energie. Bei idealer Leistungsübertragung gilt P₁ = P₂. Bei gleicher Leistung bedeutet höhere Spannung kleinere Stromstärke. Dieser Zusammenhang ist als freiwillige Vertiefung enthalten; im unbelasteten Labor werden keine Lastströme vorgetäuscht.

Nur virtuell experimentieren. Keine Versuche an Steckdosen oder Hochspannungsanlagen; Ladegeräte nicht öffnen. Die Modellwerte sind keine Bauanleitung.

## Fachliche Quellen

Eigenständige Aufgaben, Grafiken und Implementierung; keine übernommenen Abbildungen.

- LEIFIphysik / Joachim Herz Stiftung, „Transformator“, Grundlagen der Induktion und des idealen Windungsverhältnisses: `https://www.leifiphysik.de/elektrizitaetslehre/induktion-generator-und-transformator/grundwissen/transformator`
- Texas Instruments, John Betten, Fachartikel SSZTCU9 (Februar 2024), Flyback-Betrieb mit Übertrager, Schalter und Ausgangsgleichrichtung: `https://www.ti.com/document-viewer/lit/html/SSZTCU9/GUID-D445DD7D-DE75-45D3-85FC-1D95660ACD69`
- Josef Leisen, Autorendarstellung des Lehr-Lern-Modells: `https://www.josefleisen.de/lehr-lern-modell`

Die konkrete Zeitplanung, das vereinfachte Leitungsmodell und die Zahlenwahl sind eigene didaktische Festlegungen gemäß Entwicklungsauftrag.
