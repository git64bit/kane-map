#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
out_dir="${TRIVIALHTTP_BUILD_DIR:-build}"
mkdir -p "$out_dir"
x86_64-w64-mingw32-gcc -std=c11 -Wall -Wextra -O2 \
  -o "$out_dir/trivialhttp.exe" \
  src/trivialhttp.c src/platform.c src/http.c src/sector_storage.c \
  -lws2_32 -lshell32
printf '%s\n' "Wrote $out_dir/trivialhttp.exe"
