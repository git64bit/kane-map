# Building TrivialHTTP

TrivialHTTP is intentionally a small native C program. The source is shared across supported desktop platforms, while each platform is built with an appropriate native or cross compiler.

## Supported targets

| Target | Build environment | Output | Status |
| --- | --- | --- | --- |
| Linux x86-64 | Linux x86-64 with GCC | `trivialhttp` | supported |
| Windows x86-64 | Linux x86-64 with MinGW-w64 | `trivialhttp.exe` | supported |
| macOS arm64 | native Apple Silicon macOS | `trivialhttp` | supported |
| macOS x86-64 | native Intel macOS | `trivialhttp` | supported |

The CIVICVS Project Environment (CPE) build workstation is authoritative for the Linux x86-64 and Windows x86-64 builds. macOS is built and tested on native GitHub-hosted macOS runners; the CPE Linux workstation does not carry or emulate an Apple SDK.

Signing and notarization are release/distribution concerns and are separate from source portability and compilation support.

## Native macOS acceptance

The repository workflow `.github/workflows/trivialhttp-macos.yml` runs the same tracked `trivialhttp/scripts/build-macos.sh` on both native macOS architectures:

```text
macos-15       -> Apple Silicon / arm64
macos-15-intel -> Intel / x86-64
```

Each job:

1. records the macOS, architecture, and compiler identity;
2. builds TrivialHTTP with the repository-owned macOS build script;
3. executes `trivialhttp --help` natively;
4. serves a test `index.html` on `127.0.0.1` and verifies the returned bytes;
5. records the binary type and SHA-256;
6. uploads the native binary and build evidence as a workflow artifact.

The workflow runs for relevant changes on `main`, relevant pull requests, and manual dispatch.

## Build scripts

From the repository root:

```bash
bash trivialhttp/scripts/build-linux.sh
bash trivialhttp/scripts/build-windows-mingw.sh
bash trivialhttp/scripts/build-macos.sh
```

By default the scripts write beneath `trivialhttp/build/` for developer convenience.

For controlled build environments, set `TRIVIALHTTP_BUILD_DIR` to an absolute or relative output directory outside the Git source tree:

```bash
TRIVIALHTTP_BUILD_DIR=/home/cpe-build/build/TrivialHTTP/linux-x86_64 \
  bash trivialhttp/scripts/build-linux.sh

TRIVIALHTTP_BUILD_DIR=/home/cpe-build/build/TrivialHTTP/windows-x86_64 \
  bash trivialhttp/scripts/build-windows-mingw.sh
```

The CPE uses the external-output form so generated binaries never dirty the source checkout.

## Runtime contract

Build environment changes do not change the TrivialHTTP runtime contract. TrivialHTTP remains a minimal loopback-only helper for local USB/browser applications. See `README.md` and `SPEC.md` for the normative runtime behavior.
