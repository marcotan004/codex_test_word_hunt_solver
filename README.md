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

The API runs on `http://localhost:5174` by default. You can change the API URL by setting `VITE_API_URL` in the client environment.

## Notes

- Dictionary is in `/Users/marcotan/Desktop/codex_test_word_hunt_solver/server/data/words.txt`.
- OCR is handled in the browser (Tesseract.js). Drag to select the 4x4 grid before running OCR.
