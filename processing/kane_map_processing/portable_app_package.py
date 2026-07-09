"""Package Kane-Map as a portable offline county application folder."""

from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from kane_map_processing.config import OUTPUT_DIR, REPORTS_DIR
except ImportError:  # pragma: no cover
    PROCESSING_ROOT = Path(__file__).resolve().parents[1]
    OUTPUT_DIR = PROCESSING_ROOT / "output"
    REPORTS_DIR = OUTPUT_DIR / "reports"

APP_SOURCES = [
    "index.html",
    "src",
    "styles",
    "style.css",
    "assets",
    "README.md",
    "ROADMAP.md",
]
DEFAULT_APP_SLUG = "kane-county-map"
DEFAULT_DATA_DIR = Path("data") / "kane-county"
BUNDLES_ROOT = OUTPUT_DIR / "bundles"
APPS_ROOT = OUTPUT_DIR / "apps"
REPORT_PATH = REPORTS_DIR / "portable_app_package_report.json"
MANIFEST_NAME = "chunk_manifest.json"
PORTABLE_CONFIG_NAME = "portable_config.js"


@dataclass(frozen=True)
class CopyItem:
    source: Path
    destination: Path
    kind: str


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def latest_chunked_bundle(bundles_root: Path = BUNDLES_ROOT) -> Path:
    if not bundles_root.exists():
        raise FileNotFoundError(f"Missing bundles directory: {bundles_root}")
    candidates = [
        path
        for path in bundles_root.iterdir()
        if path.is_dir()
        and path.name.startswith("kane-map-chunked-prepared-")
        and (path / MANIFEST_NAME).exists()
    ]
    if not candidates:
        raise FileNotFoundError(f"No chunked prepared bundle found in {bundles_root}")
    return max(candidates, key=lambda path: path.stat().st_mtime)


def app_output_path(apps_root: Path, app_slug: str, output_name: str | None) -> Path:
    name = output_name or f"{app_slug}-{utc_stamp()}"
    return apps_root / name


def manifest_summary(manifest_path: Path) -> dict[str, Any]:
    manifest = read_json(manifest_path)
    return {
        "type": manifest.get("type"),
        "generated_at": manifest.get("generated_at"),
        "total_layers": int(manifest.get("total_layers") or 0),
        "total_chunks": int(manifest.get("total_chunks") or 0),
        "total_features": int(manifest.get("total_features") or 0),
        "total_bytes": int(manifest.get("total_bytes") or 0),
        "layers": [
            {
                "layer": layer.get("layer"),
                "chunk_count": int(layer.get("chunk_count") or len(layer.get("chunks") or [])),
                "feature_count": int(layer.get("feature_count") or 0),
            }
            for layer in manifest.get("layers", [])
            if isinstance(layer, dict)
        ],
    }


def collect_app_items(root: Path, app_root: Path) -> list[CopyItem]:
    items: list[CopyItem] = []
    for relative in APP_SOURCES:
        source = root / relative
        if not source.exists():
            continue
        kind = "directory" if source.is_dir() else "file"
        items.append(CopyItem(source=source, destination=app_root / relative, kind=kind))
    return items


def validate_inputs(root: Path, data_bundle: Path) -> list[str]:
    warnings: list[str] = []
    if not (root / "index.html").exists():
        warnings.append("missing index.html in repository root")
    if not (root / "src").exists():
        warnings.append("missing src/ in repository root")
    if not data_bundle.exists():
        warnings.append(f"missing data bundle: {data_bundle}")
    if data_bundle.exists() and not (data_bundle / MANIFEST_NAME).exists():
        warnings.append(f"missing data bundle manifest: {data_bundle / MANIFEST_NAME}")
    return warnings


def remove_existing(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)


def copy_item(item: CopyItem) -> int:
    if item.kind == "directory":
        if item.destination.exists():
            shutil.rmtree(item.destination)
        shutil.copytree(
            item.source,
            item.destination,
            ignore=shutil.ignore_patterns("__pycache__", "*.pyc", ".git"),
        )
        return directory_size(item.destination)
    item.destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(item.source, item.destination)
    return item.destination.stat().st_size


def directory_size(path: Path) -> int:
    total = 0
    for child in path.rglob("*"):
        if child.is_file():
            total += child.stat().st_size
    return total


def count_files(path: Path) -> int:
    if not path.exists():
        return 0
    return sum(1 for child in path.rglob("*") if child.is_file())


def write_portable_config(app_root: Path, data_relative_path: Path) -> None:
    """Write generated production defaults outside src/.

    The browser source config remains safe for the GitHub repository and defaults to
    demo. This generated root file is loaded by src/data/realBundleConfig.js and
    survives later USB test updates where only src/ is recopied.
    """

    data_path = data_relative_path.as_posix()
    (app_root / PORTABLE_CONFIG_NAME).write_text(
        f'''(function attachKaneMapPortableConfig(global) {{
  "use strict";

  const realBundleOverride = {{
    enabledByDefault: true,
    manifestName: "chunk_manifest.json",
    defaultBundlePath: "{data_path}",
    label: "Kane County production bundle",
    urlParameters: {{
      source: ["data", "source", "mode"],
      bundle: ["bundle", "bundleRoot", "bundle-root"]
    }}
  }};

  global.KaneMapPortableConfig = {{
    type: "kane-map-portable-config",
    role: "portable-production-default",
    dataPath: "{data_path}",
    realBundleConfig: realBundleOverride
  }};

  global.KaneMapRealBundleConfig = Object.assign(
    {{}},
    global.KaneMapRealBundleConfig || {{}},
    realBundleOverride
  );
}})(window);
''',
        encoding="utf-8",
    )


def write_app_readme(app_root: Path, app_slug: str, summary: dict[str, Any]) -> None:
    text = f"""Kane-Map portable county application

Application: {app_slug}
Generated: {datetime.now(timezone.utc).isoformat()}

This folder is intended to be copied to a USB drive and run locally.
It contains application code plus the prepared chunked county data bundle.

Data summary:
- layers: {summary.get('total_layers')}
- chunks: {summary.get('total_chunks')}
- features: {summary.get('total_features')}
- bytes: {summary.get('total_bytes')}

Important:
- This is a local/offline application bundle.
- The data files are not intended to be pushed to GitHub.
- The root {PORTABLE_CONFIG_NAME} file controls the portable production-data default.
- The src/ folder can be refreshed during USB testing without resetting that default.
- A small local static file-serving launcher may be added later for Windows, Mac, and Linux/MATE.
- Local HTTP, if used, is only a local file-serving mechanism. It is not a backend.
"""
    (app_root / "APP_README.txt").write_text(text, encoding="utf-8")


def write_portable_manifest(
    app_root: Path,
    app_slug: str,
    data_relative_path: Path,
    data_bundle: Path,
    data_summary: dict[str, Any],
    copied_files: int,
    bytes_written: int,
) -> None:
    payload = {
        "type": "kane-map-portable-county-app",
        "app_slug": app_slug,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_path": data_relative_path.as_posix(),
        "portable_config": PORTABLE_CONFIG_NAME,
        "source_data_bundle_name": data_bundle.name,
        "source_data_bundle_role": "processing-node-source-only",
        "copied_files": copied_files,
        "bytes_written": bytes_written,
        "data_summary": data_summary,
        "notes": [
            "Generated on the processing node.",
            "The original processing-node source path is intentionally not recorded in this portable manifest.",
            "Copy this folder to USB for offline use.",
            "Do not commit this generated app bundle to GitHub.",
            "Portable production defaults are stored outside src/ in portable_config.js.",
        ],
    }
    write_json(app_root / "portable_manifest.json", payload)


def package_portable_app(
    data_bundle: Path | None = None,
    apps_root: Path = APPS_ROOT,
    app_slug: str = DEFAULT_APP_SLUG,
    output_name: str | None = None,
    execute: bool = False,
    force: bool = False,
) -> dict[str, Any]:
    root = repo_root()
    selected_data_bundle = data_bundle or latest_chunked_bundle()
    app_root = app_output_path(apps_root, app_slug, output_name)
    data_relative_path = DEFAULT_DATA_DIR
    data_destination = app_root / data_relative_path
    warnings = validate_inputs(root, selected_data_bundle)
    data_summary: dict[str, Any] = {}
    if not warnings:
        data_summary = manifest_summary(selected_data_bundle / MANIFEST_NAME)

    app_items = collect_app_items(root, app_root)
    planned_files = len([item for item in app_items if item.kind == "file"])
    planned_directories = len([item for item in app_items if item.kind == "directory"])
    data_files = count_files(selected_data_bundle)

    result: dict[str, Any] = {
        "mode": "EXECUTE" if execute else "DRY_RUN",
        "status": "packaged" if execute and not warnings else "dry_run" if not execute else "warning",
        "repository_root": str(root),
        "data_bundle": str(selected_data_bundle),
        "app_root": str(app_root),
        "data_destination": str(data_destination),
        "app_slug": app_slug,
        "planned_app_files": planned_files,
        "planned_app_directories": planned_directories,
        "portable_config": str(app_root / PORTABLE_CONFIG_NAME),
        "data_files": data_files,
        "data_summary": data_summary,
        "warnings": warnings,
        "bytes_written": 0,
        "copied_files": 0,
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    if execute:
        if warnings:
            result["message"] = "warnings present; portable app not written"
        else:
            if app_root.exists() and not force:
                raise FileExistsError(f"Portable app already exists; use --force: {app_root}")
            if force:
                remove_existing(app_root)
            app_root.mkdir(parents=True, exist_ok=True)

            bytes_written = 0
            for item in app_items:
                bytes_written += copy_item(item)

            if data_destination.exists():
                shutil.rmtree(data_destination)
            shutil.copytree(
                selected_data_bundle,
                data_destination,
                ignore=shutil.ignore_patterns("__pycache__", "*.pyc"),
            )
            bytes_written += directory_size(data_destination)

            write_portable_config(app_root, data_relative_path)
            write_app_readme(app_root, app_slug, data_summary)
            copied_files = count_files(app_root)
            write_portable_manifest(
                app_root,
                app_slug,
                data_relative_path,
                selected_data_bundle,
                data_summary,
                copied_files,
                bytes_written,
            )
            bytes_written = directory_size(app_root)
            result["bytes_written"] = bytes_written
            result["copied_files"] = count_files(app_root)
            result["message"] = "portable county app written"
    else:
        result["message"] = "ready; no files copied"

    write_json(REPORT_PATH, result)
    return result


def print_result(result: dict[str, Any]) -> None:
    print("Kane-Map portable county app packaging")
    print(f"Mode: {result['mode']}")
    print(f"Status: {result['status']}")
    print(f"Repository root: {result['repository_root']}")
    print(f"Data bundle: {result['data_bundle']}")
    print(f"App root: {result['app_root']}")
    print(f"Data destination: {result['data_destination']}")
    print(f"Portable config: {result['portable_config']}")
    print(f"Planned app directories: {result['planned_app_directories']}")
    print(f"Planned data files: {result['data_files']}")
    summary = result.get("data_summary") or {}
    if summary:
        print(f"Data layers: {summary.get('total_layers')}")
        print(f"Data chunks: {summary.get('total_chunks')}")
        print(f"Data features: {summary.get('total_features')}")
    warnings = result.get("warnings") or []
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"  {warning}")
    print(f"Bytes written: {result['bytes_written']}")
    print(f"Copied files: {result['copied_files']}")
    print(f"Wrote {REPORT_PATH}")
    if result["mode"] == "DRY_RUN":
        print("Dry run only. Use --execute to write the portable app bundle.")
    else:
        print(result.get("message", ""))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true", help="write portable app folder")
    parser.add_argument("--force", action="store_true", help="replace output folder if it exists")
    parser.add_argument("--data-bundle", type=Path, default=None, help="chunked prepared data bundle to include")
    parser.add_argument("--apps-root", type=Path, default=APPS_ROOT, help="output parent for portable apps")
    parser.add_argument("--app-slug", default=DEFAULT_APP_SLUG, help="portable app name prefix")
    parser.add_argument("--output-name", default=None, help="exact output folder name")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = package_portable_app(
        data_bundle=args.data_bundle,
        apps_root=args.apps_root,
        app_slug=args.app_slug,
        output_name=args.output_name,
        execute=args.execute,
        force=args.force,
    )
    print_result(result)


if __name__ == "__main__":
    main()
