"""Source URL reporting helpers for Kane-Map processing.

This module intentionally reports candidate acquisition information only.
It does not download files, query ArcGIS services, or transform geometry.
"""

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


def source_url_summaries(registry: dict[str, Any]) -> list[SourceUrlSummary]:
    sources = registry.get("sources", [])
    if not isinstance(sources, list):
        return []

    summaries: list[SourceUrlSummary] = []
    for source in sources:
        if not isinstance(source, dict):
            continue

        summaries.append(
            SourceUrlSummary(
                source_id=str(source.get("source_id", "")),
                label=str(source.get("label", "")),
                layer=str(source.get("layer", "")),
                status=str(source.get("status", "")),
                source_url=str(source.get("source_url", "")),
                source_page=str(source.get("source_page", "")),
                candidate_query=str(source.get("candidate_query", "")),
                acquisition_mode=str(source.get("acquisition_mode", "")),
                local_path=str(source.get("local_path", "")),
                source_format=str(source.get("source_format", "")),
            )
        )

    return summaries


def count_acquisition_modes(summaries: list[SourceUrlSummary]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for summary in summaries:
        key = summary.acquisition_mode or "unspecified"
        counts[key] = counts.get(key, 0) + 1
    return counts
