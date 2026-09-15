# Building TrivialHTTP

TrivialHTTP is intentionally a small native C program. The source is shared across supported desktop platforms, while each platform is built with an appropriate native or cross compiler.

## Supported targets

| Target | Build environment | Output | Status |
| --- | --- | --- | --- |
| Linux x86-64 | Linux x86-64 with GCC | `trivialhttp` | supported |
| Windows x86-64 | Linux x86-64 with MinGW-w64 | `trivialhttp.exe` | supported |
| macOS | native macOS command-line tools | `trivialhttp` | supported source/build target |

The CIVICVS Project Environment (CPE) build workstation is authoritative for the Linux x86-64 and Windows x86-64 builds. macOS must be built and tested in a native macOS environment; the CPE Linux workstation does not carry or emulate an Apple SDK.

Signing and notarization are release/distribution concerns and are separate from source portability and compilation support.

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
