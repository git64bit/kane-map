#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p build
x86_64-w64-mingw32-gcc -std=c11 -Wall -Wextra -O2 \
  -o build/trivialhttp.exe src/trivialhttp.c -lws2_32 -lshell32
printf '%s\n' "Wrote trivialhttp/build/trivialhttp.exe"
