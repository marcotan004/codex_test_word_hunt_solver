# Word Hunt Solver (Client + API)

## Setup

1. Install server dependencies:

```bash
cd /Users/marcotan/Desktop/codex_test_word_hunt_solver/server
npm install
```

2. Install client dependencies:

```bash
cd /Users/marcotan/Desktop/codex_test_word_hunt_solver/client
npm install
```

## Run

1. Start the API:

```bash
cd /Users/marcotan/Desktop/codex_test_word_hunt_solver/server
npm run dev
```

2. Start the client:

```bash
cd /Users/marcotan/Desktop/codex_test_word_hunt_solver/client
npm run dev
```

### Convenience scripts

Start both server and client:

```bash
/Users/marcotan/Desktop/codex_test_word_hunt_solver/scripts/dev-up.sh
```

Stop both:

```bash
/Users/marcotan/Desktop/codex_test_word_hunt_solver/scripts/dev-down.sh
```

## Docker

Run client + server with Docker Compose:

```bash
cd /Users/marcotan/Desktop/codex_test_word_hunt_solver
docker compose up --build
```

Stop:

```bash
docker compose down
```

Client: `http://localhost:8080`  
Server: `http://localhost:5174`

The API runs on `http://localhost:5174` by default. You can change the API URL by setting `VITE_API_URL` in the client environment.

## API Docs (Swagger)

When the server is running, open:

- `http://localhost:5174/docs`

## Feature Flags (Client)

Create a `.env` in `/Users/marcotan/Desktop/codex_test_word_hunt_solver/client` or copy `.env.example`.

- `VITE_FEATURE_OCR=true|false` (default: false)
- `VITE_FEATURE_OCR_DEBUG=true|false` (default: false, dev-only)

## OCR Usage (Client)

1. Enable OCR with `VITE_FEATURE_OCR=true`.
2. Upload a screenshot.
3. Click and drag to select the full 4x4 board (not a single letter).
4. Run OCR to fill the grid.

Optional:
- Click "Save grid position" once to reuse the same board crop for future screenshots (stored in localStorage).
- Click "Clear saved grid" to reset calibration.
- In dev mode, set `VITE_FEATURE_OCR_DEBUG=true` to show OCR progress metrics and per-cell confidence.

## Notes

- Dictionary is in `/Users/marcotan/Desktop/codex_test_word_hunt_solver/server/data/words_dictionary.json` (from dwyl/english-words).
- OCR is handled in the browser (Tesseract.js). Drag to select the 4x4 grid before running OCR.
- Scoring is fixed:
  - 3 letters: 100
  - 4 letters: 400
  - 5 letters: 800
  - 6 letters: 1400
  - 7 letters: 1800
  - 8 letters: 2200
  - 9+ letters: 2200 + 400 per extra letter
