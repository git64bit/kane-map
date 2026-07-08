"""Raw-staging helpers for Kane-Map processing.

Staging is the boundary between acquired source files and working raw files.
Batch 030 only stages direct GeoJSON downloads. ZIP/shapefile conversion is
reserved for later processing batches.
"""

from __future__ import annotations

import json
import shutil
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import INPUT_DIR, RAW_STAGING_REPORT_PATH
from .source_download import build_download_plan
from .source_registry import is_safe_relative_path


@dataclass(frozen=True)
class RawStagePlanItem:
    source_id: str
    label: str
    layer: str
    download_path: str
    raw_path: str
    action: str
    ready: bool
    reason: str


@dataclass(frozen=True)
class RawStageResult:
    source_id: str
    action: str
    ok: bool
    path: str
    bytes_written: int
    message: str


def build_raw_stage_plan(
    registry: dict[str, Any],
    selected_source_ids: set[str] | None = None,
) -> list[RawStagePlanItem]:
    plan = build_download_plan(registry, selected_source_ids=selected_source_ids)
    by_id = {
        str(source.get("source_id")): source
        for source in registry.get("sources", [])
        if isinstance(source, dict)
    }

    stage_plan: list[RawStagePlanItem] = []
    for download_item in plan:
        source = by_id.get(download_item.source_id, {})
        raw_path = str(source.get("local_path") or "")
        download_path = download_item.output_path

        action = "skip"
        ready = False
        reason = download_item.reason

        if not download_item.enabled:
            reason = download_item.reason
        elif not raw_path:
            reason = "missing raw local_path"
        elif not is_safe_relative_path(raw_path) or not raw_path.startswith("raw/"):
            reason = "raw local_path must be inside raw/"
        elif not download_path:
            reason = "missing download path"
        else:
            source_file = INPUT_DIR / download_path
            if not source_file.exists():
                reason = "download file missing"
            elif Path(download_path).suffix.lower() == ".geojson" and Path(raw_path).suffix.lower() == ".geojson":
                action = "copy_geojson"
                ready = True
                reason = "ready to copy downloaded GeoJSON into raw/"
            elif Path(download_path).suffix.lower() == ".zip":
                action = "needs_conversion"
                reason = "ZIP source requires extraction/conversion in a later batch"
            else:
                action = "unsupported"
                reason = "no staging rule for this download/raw format combination"

        stage_plan.append(
            RawStagePlanItem(
                source_id=download_item.source_id,
                label=download_item.label,
                layer=download_item.layer,
                download_path=download_path,
                raw_path=raw_path,
                action=action,
                ready=ready,
                reason=reason,
            )
        )

    return stage_plan


def stage_plan_item(item: RawStagePlanItem, force: bool = False) -> RawStageResult:
    if not item.ready:
        return RawStageResult(item.source_id, item.action, True, item.raw_path, 0, item.reason)

    source_file = INPUT_DIR / item.download_path
    raw_file = INPUT_DIR / item.raw_path
    raw_file.parent.mkdir(parents=True, exist_ok=True)

    if raw_file.exists() and not force:
        return RawStageResult(
            item.source_id,
            "exists",
            True,
            str(raw_file),
            raw_file.stat().st_size,
            "existing raw file kept; use --force to overwrite",
        )

    temp_path = raw_file.with_suffix(raw_file.suffix + ".part")
    try:
        shutil.copyfile(source_file, temp_path)
        temp_path.replace(raw_file)
        return RawStageResult(
            item.source_id,
            "copied",
            True,
            str(raw_file),
            raw_file.stat().st_size,
            "downloaded GeoJSON copied into raw/",
        )
    except OSError as exc:
        if temp_path.exists():
            temp_path.unlink()
        return RawStageResult(item.source_id, "error", False, str(raw_file), 0, str(exc))


def write_raw_staging_report(
    plan: list[RawStagePlanItem],
    results: list[RawStageResult],
    report_path: Path = RAW_STAGING_REPORT_PATH,
) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "report_type": "raw_staging",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "plan": [asdict(item) for item in plan],
        "results": [asdict(result) for result in results],
        "counts": {
            "planned": len(plan),
            "ready": sum(1 for item in plan if item.ready),
            "copied": sum(1 for result in results if result.action == "copied"),
            "existing": sum(1 for result in results if result.action == "exists"),
            "needs_conversion": sum(1 for item in plan if item.action == "needs_conversion"),
            "errors": sum(1 for result in results if not result.ok),
        },
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
