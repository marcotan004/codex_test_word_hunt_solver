# Auto-Recognize Board Letters Plan

## Summary
Build a client-side, deterministic auto-recognition pipeline that:
1) finds the board in a full screenshot via color segmentation,
2) crops the 4x4 tile grid,
3) extracts each tile’s letter mask, and
4) matches against a built-in A–Z template set to populate the grid with confidence scores.

## Scope and Goals
- Goal: One-click auto-recognition from a full screenshot like the sample.
- Success criteria: On upright screenshots, >95% correct letters without manual selection; recognition completes <1s on typical laptops.
- Out of scope: OCR, server-side processing, perspective correction for tilted images.

## Key Decisions
- Runtime: Client-only (browser).
- Method: Template matching (no OCR).
- Input: Full screenshot auto-detect (upright).

## Public APIs / Interfaces
- New module: `client/src/lib/autoDetect.ts`
  - `detectBoardRect(imageData: ImageData): Rect | null`
  - `extractGrid(imageData: ImageData, rect: Rect): ImageData[]`
  - `recognizeTile(tile: ImageData, templates: TemplateSet): { letter: string; score: number; secondScore: number }`
  - `recognizeBoard(image: HTMLImageElement): { letters: string[]; scores: number[]; debug: DebugInfo }`

- New types (same module or `client/src/lib/autoDetectTypes.ts`):
  - `Rect = { x: number; y: number; w: number; h: number }`
  - `Template = { letter: string; data: Float32Array; size: number }`
  - `TemplateSet = Record<string, Template>`

## Implementation Plan

### 1) Template Pack (Built-In)
- Add `client/public/templates/` containing 26 PNGs named `A.png` … `Z.png`.
- Each PNG is a cropped single tile at a fixed size (e.g., 128x128), letter centered, same style as game tiles.
- Add a short `templates/README.md` describing capture guidelines:
  - Crop tightly to the tile.
  - Keep letter centered.
  - Keep original colors (don’t pre-threshold).

Template preprocessing (at runtime):
- For each template image:
  - Resize to `TEMPLATE_SIZE = 64` square.
  - Convert to grayscale.
  - Extract letter mask: keep pixels darker than a threshold (adaptive based on mean/median); set to 1 for letter, 0 for background.
  - Normalize to zero-mean and unit norm for NCC scoring.

### 2) Board Detection (Color Segmentation, No OCR)
- Load the screenshot into a canvas and create `ImageData`.
- Convert to HSV and find green board region:
  - `H` in [70°, 140°], `S > 0.25`, `V > 0.2` (tweakable constants).
- Create a binary mask of green pixels.
- Find the largest connected component (simple flood-fill) and compute its bounding box.
- Expand bounds slightly (2–4%) to include the border.
- If no component found, return `null` and show “board not detected” message.

### 3) Tile Grid Extraction (Assume Upright)
- Within the board bounding box:
  - Detect the wood tile region by thresholding for warm colors (high R and G, moderate B) to compute a tighter inner bounding box.
  - This avoids green border padding.
- Divide the inner box into a 4x4 grid.
- Add a per-cell inset padding (e.g., 6–10% of cell size) to avoid rounded edges.

### 4) Letter Recognition via Template Matching
- For each cell:
  - Convert to grayscale.
  - Threshold dark pixels to get a letter mask.
  - Normalize mask size to `TEMPLATE_SIZE`.
  - Compute normalized cross-correlation (NCC) with each template.
  - Choose the best letter.
  - Confidence: `bestScore - secondScore` and `bestScore` (both exposed).

### 5) UI Integration
- Add a new panel or mode in `OcrPanel` (renamed to `AutoDetectPanel`) controlled by a new feature flag:
  - `VITE_FEATURE_AUTO_RECOG=true`
- UI flow:
  - Upload screenshot → “Auto-Detect Board” → show letters + confidence.
  - If detection fails, show error and allow manual crop (optional fallback).

### 6) Debug / Developer Tools
- Dev-only debug overlay:
  - Draw detected board rectangle and tile grid.
  - Show per-tile confidence.
- Optional “show masks” toggle to visualize letter masks.

## Testing Plan
- Fixtures: Add 3–5 sample screenshots in `client/src/assets/fixtures/`.
- Unit tests (Vitest):
  - `detectBoardRect` returns expected bounds for fixtures.
  - `recognizeBoard` returns expected 16-letter array for fixtures.
- If canvas APIs are missing in test environment, add `canvas` as a dev dependency and use it to load fixture images into `ImageData`.

## Edge Cases and Failure Modes
- Board not detected (no large green region) → show error.
- Low confidence tiles → highlight in UI and allow manual correction.
- If template matching returns ambiguous scores, prefer higher confidence and show top-2 letters in debug.

## Assumptions / Defaults
- Screenshots are upright (no rotation or perspective skew).
- Board background is green and tiles are wood with black letters, matching the sample image.
- Built-in template pack is available and matches the game’s tile style.

## Deliverables
- Template pack in `client/public/templates/`.
- Auto-recognition module in `client/src/lib/autoDetect.ts`.
- New UI panel or mode for auto recognition.
- Dev-only debug overlay.
- Tests and fixtures.
