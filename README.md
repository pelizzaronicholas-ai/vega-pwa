# V.E.G.A — Vectored Engine Gauge & Aim
**Ballistic AI · Created by Shooting-Labs since 2026**

Calcolatore balistico G7 con voce, stage PRS, shot detection audio, BLE per Calypso/Kestrel/Garmin.

---

## Deploy su GitHub Pages (gratuito, 5 minuti)

### 1. Crea il repository
- Vai su [github.com](https://github.com) → **New repository**
- Nome repo: `vega-ballistic` (o come preferisci)
- Visibilità: **Public** (richiesto per GitHub Pages gratuito)
- NON inizializzare con README

### 2. Aggiorna `vite.config.js`
Apri `vite.config.js` e modifica la riga `base`:
```js
base: '/NOME-TUO-REPO/',   // es. '/vega-ballistic/'
```

### 3. Push del codice
```bash
git init
git add .
git commit -m "VEGA v2 initial deploy"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/vega-ballistic.git
git push -u origin main
```

### 4. Attiva GitHub Pages
- Nel repo → **Settings** → **Pages**
- Source: **GitHub Actions**
- Salva

### 5. Deploy automatico
Il workflow `.github/workflows/deploy.yml` si attiva ad ogni push su `main`.
Dopo ~2 minuti la PWA è live su:
```
https://TUO-USERNAME.github.io/vega-ballistic/
```

---

## Sviluppo locale

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build produzione in dist/
npm run preview    # preview della build
```

---

## Struttura progetto

```
vega-pwa/
├── src/
│   ├── App.jsx        ← componente principale V.E.G.A
│   └── main.jsx       ← entry React
├── public/
│   └── vega.jpg       ← splash image
├── .github/
│   └── workflows/
│       └── deploy.yml ← GitHub Actions auto-deploy
├── index.html
├── vite.config.js
└── package.json
```

---

## Feature v2

| Feature | Stato |
|---------|-------|
| Solver G7 RK4 (.22LR → .50 BMG) | ✅ |
| Toggle MOA / MRAD | ✅ |
| Splash screen 2s | ✅ |
| Voce IT (wake word "Vega") | ✅ |
| Stage library 5 stage PRS | ✅ |
| Stage live con guida vocale | ✅ |
| Timer countdown con avvisi | ✅ |
| Shot detection audio (toggle) | ✅ |
| MV manuale (media + SD) | ✅ |
| Geolocation quota auto | ✅ |
| Range card completa | ✅ |
| Dope card stage | ✅ |
| BLE Calypso Ultrasonic | ⏳ v3 |
| BLE Kestrel 5700 | ⏳ v3 |
| BLE Garmin Xero C1 | ⏳ v3 |
| PDF import stage | ⏳ v3 |

---

## Note tecniche

- **Voce**: richiede Chrome/Edge desktop o Android. Safari iOS non supporta `SpeechRecognition`.
- **Shot detection**: `getUserMedia` richiede HTTPS — funziona su GitHub Pages (HTTPS nativo).
- **BLE**: Web Bluetooth richiede Chrome/Edge su desktop o Android. Non Safari/Firefox.
- **BC G7**: valori in lb/in² × 703.07 = kg/m² — conversione gestita internamente nel solver.

---

**Shooting-Labs © 2026 — Nicholas Pelizzaro**
