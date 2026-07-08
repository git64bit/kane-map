"""Source URL reporting helpers for Kane-Map processing."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class SourceUrlSummary:
    source_id: str
    label: str
    layer: str
    status: str
    source_url: str
    source_page: str
    candidate_query: str
    acquisition_mode: str
    local_path: str
    source_format: str
    download_enabled: bool
    download_url: str
    download_path: str


def source_url_summaries(registry: dict[str, Any]) -> list[SourceUrlSummary]:
    sources = registry.get("sources", [])
    if not isinstance(sources, list):
        return []

    summaries: list[SourceUrlSummary] = []
    for source in sources:
        if not isinstance(source, dict):
            continue

        source_format = str(source.get("source_format", ""))
        candidate_query = str(source.get("candidate_query", ""))
        source_url = str(source.get("source_url", ""))
        download_url = str(source.get("download_url", ""))
        if not download_url:
            download_url = candidate_query if source_format == "arcgis_feature_service" else source_url

        summaries.append(
            SourceUrlSummary(
                source_id=str(source.get("source_id", "")),
                label=str(source.get("label", "")),
                layer=str(source.get("layer", "")),
                status=str(source.get("status", "")),
                source_url=source_url,
                source_page=str(source.get("source_page", "")),
                candidate_query=candidate_query,
                acquisition_mode=str(source.get("acquisition_mode", "")),
                local_path=str(source.get("local_path", "")),
                source_format=source_format,
                download_enabled=bool(source.get("download_enabled", False)),
                download_url=download_url,
                download_path=str(source.get("download_path", "")),
            )
        )

    return summaries


def count_acquisition_modes(summaries: list[SourceUrlSummary]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for summary in summaries:
        key = summary.acquisition_mode or "unspecified"
        counts[key] = counts.get(key, 0) + 1
    return counts
