#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p build
cc -std=c11 -Wall -Wextra -O2 -o build/trivialhttp \
  src/trivialhttp.c src/platform.c src/http.c src/sector_storage.c
printf '%s\n' "Wrote trivialhttp/build/trivialhttp"
