#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
out_dir="${TRIVIALHTTP_BUILD_DIR:-build}"
mkdir -p "$out_dir"
cc -std=c11 -Wall -Wextra -O2 -o "$out_dir/trivialhttp" \
  src/trivialhttp.c src/platform.c src/http.c src/sector_storage.c
printf '%s\n' "Wrote $out_dir/trivialhttp"
