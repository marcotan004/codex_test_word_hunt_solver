# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [Unreleased]

### Fixed
- OCR worker creation now uses explicit local asset paths and has a startup timeout.

## [0.1.0] - 2026-02-08

### Added
- OCR calibration: save and reuse the board crop across screenshots.
- OCR debug panel (dev-only) showing per-cell confidence and progress metrics.
- Per-cell OCR timeout with worker reset to avoid long hangs.
- OCR worker startup timeout with stage tracking in debug mode.

### Changed
- OCR selection is now click-and-drag instead of click-twice.
- OCR guidance text clarified to select the full 4x4 board.

### Fixed
- OCR now uses the current drag selection reliably during recognition.
