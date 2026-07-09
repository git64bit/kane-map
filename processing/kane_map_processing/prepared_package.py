"""Package prepared Kane-Map layers into a browser-loadable bundle.

This module copies files from processing/output/prepared into a versioned
bundle directory under processing/output/bundles. It does not load large JSON
layers into memory.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from kane_map_processing.config import MANIFEST_PATH, OUTPUT_DIR, PREPARED_DIR, REPORTS_DIR

BUNDLES_DIR = OUTPUT_DIR / "bundles"
PACKAGE_REPORT_PATH = REPORTS_DIR / "prepared_package_report.json"
DEFAULT_REQUIRED_LAYERS = (
    "county_boundary.json",
    "roads.json",
    "water.json",
    "buildings.json",
    "address_points.json",
)


@dataclass(frozen=True)
class PreparedFile:
    name: str
    path: Path
    size_bytes: int
    sha256: str | None = None


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError(f"Expected object in {path}")
    return data


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, sort_keys=True)
        f.write("\n")


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def find_prepared_files() -> list[PreparedFile]:
    files: list[PreparedFile] = []
    if not PREPARED_DIR.exists():
        return files
    for path in sorted(PREPARED_DIR.glob("*.json")):
        if path.is_file():
            files.append(PreparedFile(name=path.name, path=path, size_bytes=path.stat().st_size))
    return files


def missing_required_layers(files: list[PreparedFile]) -> list[str]:
    present = {item.name for item in files}
    return [name for name in DEFAULT_REQUIRED_LAYERS if name not in present]


def build_bundle_name(name: str | None) -> str:
    clean = (name or "").strip()
    if clean:
        return clean
    return f"kane-map-prepared-{utc_stamp()}"


def build_bundle_manifest(
    *,
    bundle_name: str,
    bundle_dir: Path,
    files: list[PreparedFile],
    include_hashes: bool,
) -> dict[str, Any]:
    source_manifest = read_json(MANIFEST_PATH) if MANIFEST_PATH.exists() else {}
    layers = []
    for item in files:
        sha = file_sha256(item.path) if include_hashes else None
        layers.append(
            {
                "name": item.path.stem,
                "file": f"layers/{item.name}",
                "bytes": item.size_bytes,
                "sha256": sha,
            }
        )

    total_bytes = sum(item.size_bytes for item in files)
    return {
        "schema": "kane-map-prepared-bundle-v1",
        "bundle_name": bundle_name,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_prepared_dir": str(PREPARED_DIR),
        "bundle_dir": str(bundle_dir),
        "layer_count": len(layers),
        "total_bytes": total_bytes,
        "layers": layers,
        "source_manifest": source_manifest,
    }


def copy_bundle_files(bundle_dir: Path, files: list[PreparedFile]) -> None:
    layers_dir = bundle_dir / "layers"
    layers_dir.mkdir(parents=True, exist_ok=True)
    for item in files:
        shutil.copy2(item.path, layers_dir / item.name)


def write_readme(bundle_dir: Path, bundle_name: str) -> None:
    readme = bundle_dir / "README.txt"
    readme.write_text(
        "Kane-Map prepared data bundle\n"
        f"Bundle: {bundle_name}\n\n"
        "This directory is generated from processing/output/prepared.\n"
        "It is intended for local/offline browser testing and should not be committed to GitHub.\n\n"
        "Files:\n"
        "  bundle_manifest.json\n"
        "  layers/*.json\n",
        encoding="utf-8",
    )


def zip_bundle(bundle_dir: Path, *, compress: bool) -> Path:
    zip_path = bundle_dir.with_suffix(".zip")
    mode = zipfile.ZIP_DEFLATED if compress else zipfile.ZIP_STORED
    with zipfile.ZipFile(zip_path, "w", compression=mode) as zf:
        for path in sorted(bundle_dir.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(bundle_dir.parent))
    return zip_path


def package_prepared_data(args: argparse.Namespace) -> dict[str, Any]:
    files = find_prepared_files()
    missing = missing_required_layers(files)
    bundle_name = build_bundle_name(args.bundle_name)
    bundle_dir = BUNDLES_DIR / bundle_name

    report: dict[str, Any] = {
        "mode": "execute" if args.execute else "dry_run",
        "status": "pending",
        "bundle_name": bundle_name,
        "bundle_dir": str(bundle_dir),
        "prepared_dir": str(PREPARED_DIR),
        "prepared_files": [item.name for item in files],
        "prepared_file_count": len(files),
        "prepared_total_bytes": sum(item.size_bytes for item in files),
        "missing_required_layers": missing,
        "zip_requested": bool(args.zip),
        "zip_created": None,
    }

    if missing and not args.allow_missing:
        report["status"] = "blocked_missing_required_layers"
        report["message"] = "required prepared layers are missing"
        return report

    if bundle_dir.exists() and not args.force:
        report["status"] = "output_exists"
        report["message"] = "bundle directory exists; use --force to replace it"
        return report

    if not args.execute:
        report["status"] = "dry_run"
        report["message"] = "ready; no bundle written"
        return report

    if bundle_dir.exists():
        shutil.rmtree(bundle_dir)
    bundle_dir.mkdir(parents=True, exist_ok=True)

    copy_bundle_files(bundle_dir, files)
    manifest = build_bundle_manifest(
        bundle_name=bundle_name,
        bundle_dir=bundle_dir,
        files=files,
        include_hashes=bool(args.hashes),
    )
    write_json(bundle_dir / "bundle_manifest.json", manifest)
    write_readme(bundle_dir, bundle_name)

    zip_path = None
    if args.zip:
        zip_path = zip_bundle(bundle_dir, compress=bool(args.compress))

    report.update(
        {
            "status": "packaged",
            "message": "prepared data bundle written",
            "bundle_manifest": str(bundle_dir / "bundle_manifest.json"),
            "zip_created": str(zip_path) if zip_path else None,
        }
    )
    return report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Package prepared Kane-Map data files.")
    parser.add_argument("--execute", action="store_true", help="Write the bundle.")
    parser.add_argument("--force", action="store_true", help="Replace an existing bundle directory.")
    parser.add_argument("--bundle-name", default=None, help="Specific bundle directory name.")
    parser.add_argument("--allow-missing", action="store_true", help="Allow missing required layers.")
    parser.add_argument("--hashes", action="store_true", help="Calculate SHA-256 hashes for layer files.")
    parser.add_argument("--zip", action="store_true", help="Also create a .zip archive of the bundle.")
    parser.add_argument("--compress", action="store_true", help="Compress the .zip archive.")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    report = package_prepared_data(args)
    write_json(PACKAGE_REPORT_PATH, report)

    print("Kane-Map prepared data packaging")
    print(f"Mode: {report['mode'].upper()}")
    print(f"Status: {report['status']}")
    print(f"Prepared files: {report['prepared_file_count']}")
    print(f"Prepared bytes: {report['prepared_total_bytes']}")
    print(f"Bundle: {report['bundle_dir']}")
    if report.get("missing_required_layers"):
        print(f"Missing required layers: {', '.join(report['missing_required_layers'])}")
    if report.get("message"):
        print(f"Message: {report['message']}")
    if report.get("zip_created"):
        print(f"Zip: {report['zip_created']}")
    print(f"Wrote {PACKAGE_REPORT_PATH}")
    if not args.execute:
        print("Dry run only. Use --execute to write the bundle.")
    return 0 if report["status"] in {"dry_run", "packaged"} else 1


if __name__ == "__main__":
    raise SystemExit(main())
