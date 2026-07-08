"""Shared paths and constants for Kane-Map processing scripts."""

from __future__ import annotations

from pathlib import Path

PROCESSING_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PROCESSING_ROOT.parent

INPUT_DIR = PROCESSING_ROOT / "input"
RAW_INPUT_DIR = INPUT_DIR / "raw"
SOURCE_DIR = INPUT_DIR / "sources"
SOURCE_REGISTRY_PATH = SOURCE_DIR / "source_registry.json"

OUTPUT_DIR = PROCESSING_ROOT / "output"
PREPARED_DIR = OUTPUT_DIR / "prepared"
REPORTS_DIR = OUTPUT_DIR / "reports"
MANIFEST_PATH = OUTPUT_DIR / "manifest.json"
SOURCE_INTAKE_REPORT_PATH = REPORTS_DIR / "source_intake_report.json"

SUPPORTED_DATA_EXTENSIONS = {
    ".csv",
    ".json",
    ".geojson",
    ".js",
}

SUPPORTED_RAW_EXTENSIONS = {
    ".csv",
    ".json",
    ".geojson",
    ".gpkg",
    ".zip",
    ".shp",
    ".kml",
    ".kmz",
}

IGNORED_NAMES = {
    "README.md",
    "manifest.json",
}

MANIFEST_VERSION = 1
SOURCE_REGISTRY_VERSION = 1
PROJECT_NAME = "kane-map"

