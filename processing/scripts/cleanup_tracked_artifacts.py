#!/usr/bin/env python3
"""Find and optionally untrack generated artifacts that should not be in Git."""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path


SAFE_READMES = {
    "processing/input/downloads/README.md",
    "processing/input/raw/README.md",
    "processing/output/prepared/README.md",
    "processing/output/bundles/README.md",
    "processing/output/chunks/README.md",
    "processing/output/reports/README.md",
}

TRACKED_PREFIXES = (
    "processing/input/downloads/",
    "processing/input/raw/",
    "processing/output/prepared/",
    "processing/output/bundles/",
    "processing/output/chunks/",
    "processing/output/reports/",
)

GENERATED_PARTS = (
    "/__pycache__/",
    "__pycache__/",
)

GENERATED_SUFFIXES = (
    ".pyc",
    ".pyo",
    ".pyd",
)


def run_git(args: list[str], *, capture: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        check=True,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )


def repo_root() -> Path:
    result = run_git(["rev-parse", "--show-toplevel"])
    return Path(result.stdout.strip())


def tracked_files() -> list[str]:
    result = run_git(["ls-files"])
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def is_generated(path: str) -> bool:
    if path in SAFE_READMES:
        return False
    if any(part in path for part in GENERATED_PARTS):
        return True
    if path.endswith(GENERATED_SUFFIXES):
        return True
    if path.startswith(TRACKED_PREFIXES):
        return True
    return False


def generated_tracked_files() -> list[str]:
    return [path for path in tracked_files() if is_generated(path)]


def git_rm_cached(paths: list[str]) -> None:
    if not paths:
        return
    batch_size = 100
    for start in range(0, len(paths), batch_size):
        batch = paths[start : start + batch_size]
        run_git(["rm", "--cached", "--ignore-unmatch", "--", *batch], capture=False)


def print_status(paths: list[str], execute: bool) -> None:
    mode = "EXECUTE" if execute else "DRY_RUN"
    print("Kane-Map repository cleanup")
    print(f"Mode: {mode}")
    print(f"Tracked generated files: {len(paths)}")
    if paths:
        print()
        for path in paths:
            print(path)
    print()
    if execute:
        print("Generated files were removed from the Git index only.")
        print("Local working copies, if present, were left in place.")
        print("Run git status from the repository root before committing.")
    else:
        print("Dry run only. Use --execute to untrack these files.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Untrack generated Kane-Map artifacts.")
    parser.add_argument("--execute", action="store_true", help="Run git rm --cached for generated files.")
    args = parser.parse_args()

    root = repo_root()
    paths = generated_tracked_files()
    if args.execute:
        git_rm_cached(paths)
    print_status(paths, args.execute)
    print(f"Repository root: {root}")


if __name__ == "__main__":
    main()
