"""Shared paths and constants for Kane-Map processing scripts."""

from __future__ import annotations

from pathlib import Path

PROCESSING_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PROCESSING_ROOT.parent
INPUT_DIR = PROCESSING_ROOT / "input"
OUTPUT_DIR = PROCESSING_ROOT / "output"
MANIFEST_PATH = OUTPUT_DIR / "manifest.json"

SUPPORTED_DATA_EXTENSIONS = {
    ".csv",
    ".json",
    ".geojson",
    ".js",
}

IGNORED_NAMES = {
    "README.md",
    "manifest.json",
}

MANIFEST_VERSION = 1
PROJECT_NAME = "kane-map"
