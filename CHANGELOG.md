# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [Unreleased]

### Added
- OCR calibration: save and reuse the board crop across screenshots.
- OCR debug panel (dev-only) showing per-cell confidence and progress metrics.
- Per-cell OCR timeout with worker reset to avoid long hangs.

### Changed
- OCR selection is now click-and-drag instead of click-twice.
- OCR guidance text clarified to select the full 4x4 board.

### Fixed
- OCR now uses the current drag selection reliably during recognition.
