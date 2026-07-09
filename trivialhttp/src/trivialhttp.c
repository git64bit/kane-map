#ifndef _WIN32
#define _POSIX_C_SOURCE 200809L
#define _XOPEN_SOURCE 700
#endif

/*
 * TrivialHTTP
 * Minimal local-only static file server for USB/browser applications.
 *
 * Design target:
 *   - no installation
 *   - no admin rights
 *   - bind only 127.0.0.1
 *   - serve only files under the selected root
 *   - GET/HEAD only
 *   - no writes
 *
 * This is intentionally small and conservative. It is not a general web server.
 */

#include <ctype.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#ifndef _CRT_SECURE_NO_WARNINGS
#define _CRT_SECURE_NO_WARNINGS
#endif
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <shellapi.h>
#include <direct.h>
#include <io.h>
#include <sys/stat.h>
#if defined(_MSC_VER)
#pragma comment(lib, "Ws2_32.lib")
#pragma comment(lib, "Shell32.lib")
#endif
typedef SOCKET th_socket_t;
#define TH_CLOSE closesocket
#define TH_INVALID_SOCKET INVALID_SOCKET
#define TH_SOCKLEN int
#ifndef PATH_MAX
#define PATH_MAX MAX_PATH
#endif
#define TH_PATH_SEP '\\'
#else
#include <arpa/inet.h>
#include <errno.h>
#include <fcntl.h>
#include <limits.h>
#include <netinet/in.h>
#include <signal.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <unistd.h>
typedef int th_socket_t;
#define TH_CLOSE close
#define TH_INVALID_SOCKET (-1)
#define TH_SOCKLEN socklen_t
#define TH_PATH_SEP '/'
#endif

#ifndef PATH_MAX
#define PATH_MAX 4096
#endif

#define TH_READ_BUF 8192
#define TH_SMALL_BUF 1024
#define TH_URL_BUF 2048
#define TH_VERSION "0.1.0"

typedef struct TrivialHttpOptions {
    char root[PATH_MAX];
    char root_real[PATH_MAX];
    char open_target[TH_SMALL_BUF];
    unsigned short port;
    int no_open;
    int once;
} TrivialHttpOptions;

static void print_usage(const char *program) {
    printf("TrivialHTTP %s\n", TH_VERSION);
    printf("Usage: %s [options]\n\n", program);
    printf("Options:\n");
    printf("  --root PATH       Folder to serve. Default: current directory.\n");
    printf("  --port PORT       Local port. Default: 0, meaning choose a free port.\n");
    printf("  --open PATH       Browser target path or URL. Default: /.\n");
    printf("  --no-open         Do not open the default browser.\n");
    printf("  --once            Serve one request, then exit. Useful for tests.\n");
    printf("  --help            Show this help.\n\n");
    printf("Kane-Map production example:\n");
    printf("  %s --root . --open \"/index.html?data=prepared&bundle=data/kane-county\"\n", program);
}

static int th_strlcpy(char *dst, const char *src, size_t dst_size) {
    size_t src_len = strlen(src);
    if (dst_size == 0) {
        return -1;
    }
    if (src_len >= dst_size) {
        memcpy(dst, src, dst_size - 1);
        dst[dst_size - 1] = '\0';
        return -1;
    }
    memcpy(dst, src, src_len + 1);
    return 0;
}

static int th_strlcat(char *dst, const char *src, size_t dst_size) {
    size_t dst_len = strlen(dst);
    if (dst_len >= dst_size) {
        return -1;
    }
    return th_strlcpy(dst + dst_len, src, dst_size - dst_len);
}

static int parse_port(const char *value, unsigned short *port_out) {
    char *end = NULL;
    long parsed = strtol(value, &end, 10);
    if (!value[0] || *end != '\0' || parsed < 0 || parsed > 65535) {
        return -1;
    }
    *port_out = (unsigned short)parsed;
    return 0;
}

static int parse_args(int argc, char **argv, TrivialHttpOptions *options) {
    memset(options, 0, sizeof(*options));
    th_strlcpy(options->root, ".", sizeof(options->root));
    th_strlcpy(options->open_target, "/", sizeof(options->open_target));
    options->port = 0;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--help") == 0 || strcmp(argv[i], "-h") == 0) {
            print_usage(argv[0]);
            return 1;
        } else if (strcmp(argv[i], "--root") == 0) {
            if (++i >= argc || th_strlcpy(options->root, argv[i], sizeof(options->root)) != 0) {
                fprintf(stderr, "Invalid --root value.\n");
                return -1;
            }
        } else if (strcmp(argv[i], "--port") == 0) {
            if (++i >= argc || parse_port(argv[i], &options->port) != 0) {
                fprintf(stderr, "Invalid --port value.\n");
                return -1;
            }
        } else if (strcmp(argv[i], "--open") == 0) {
            if (++i >= argc || th_strlcpy(options->open_target, argv[i], sizeof(options->open_target)) != 0) {
                fprintf(stderr, "Invalid --open value.\n");
                return -1;
            }
        } else if (strcmp(argv[i], "--no-open") == 0) {
            options->no_open = 1;
        } else if (strcmp(argv[i], "--once") == 0) {
            options->once = 1;
        } else {
            fprintf(stderr, "Unknown option: %s\n", argv[i]);
            return -1;
        }
    }
    return 0;
}

#ifdef _WIN32
static void normalize_backslashes(char *path) {
    for (; *path; path++) {
        if (*path == '/') {
            *path = '\\';
        }
    }
}

static int canonical_path(const char *input, char *out, size_t out_size) {
    DWORD len = GetFullPathNameA(input, (DWORD)out_size, out, NULL);
    if (len == 0 || len >= out_size) {
        return -1;
    }
    normalize_backslashes(out);
    size_t out_len = strlen(out);
    while (out_len > 3 && (out[out_len - 1] == '\\' || out[out_len - 1] == '/')) {
        out[out_len - 1] = '\0';
        out_len--;
    }
    return 0;
}

static int file_is_regular(const char *path) {
    DWORD attrs = GetFileAttributesA(path);
    if (attrs == INVALID_FILE_ATTRIBUTES) {
        return 0;
    }
    if (attrs & FILE_ATTRIBUTE_DIRECTORY) {
        return 0;
    }
    if (attrs & FILE_ATTRIBUTE_REPARSE_POINT) {
        return 0;
    }
    return 1;
}

static int path_under_root(const char *root, const char *candidate) {
    size_t root_len = strlen(root);
    if (_strnicmp(root, candidate, root_len) != 0) {
        return 0;
    }
    return candidate[root_len] == '\0' || candidate[root_len] == '\\' || candidate[root_len] == '/';
}
#else
static int canonical_path(const char *input, char *out, size_t out_size) {
    char *resolved = realpath(input, out);
    if (!resolved) {
        return -1;
    }
    if (strlen(out) >= out_size) {
        return -1;
    }
    size_t out_len = strlen(out);
    while (out_len > 1 && out[out_len - 1] == '/') {
        out[out_len - 1] = '\0';
        out_len--;
    }
    return 0;
}

static int file_is_regular(const char *path) {
    struct stat st;
    if (lstat(path, &st) != 0) {
        return 0;
    }
    if (S_ISLNK(st.st_mode)) {
        return 0;
    }
    if (!S_ISREG(st.st_mode)) {
        return 0;
    }
    return 1;
}

static int path_under_root(const char *root, const char *candidate) {
    size_t root_len = strlen(root);
    if (strncmp(root, candidate, root_len) != 0) {
        return 0;
    }
    return candidate[root_len] == '\0' || candidate[root_len] == '/';
}
#endif

static int hex_value(char c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return -1;
}

static int decode_url_path(const char *url, char *out, size_t out_size) {
    size_t j = 0;
    const char *p = url;

    while (*p && *p != '?' && *p != '#') {
        unsigned char c;
        if (*p == '%') {
            int hi = hex_value(p[1]);
            int lo = hex_value(p[2]);
            if (hi < 0 || lo < 0) {
                return -1;
            }
            c = (unsigned char)((hi << 4) | lo);
            p += 3;
        } else {
            c = (unsigned char)*p++;
        }

        if (c == '\0' || c < 32 || c == 127) {
            return -1;
        }
        if (c == '\\') {
            c = '/';
        }
        if (j + 1 >= out_size) {
            return -1;
        }
        out[j++] = (char)c;
    }
    out[j] = '\0';
    return 0;
}

static int unsafe_path_segments(const char *path) {
    char segment[PATH_MAX];
    size_t seg_len = 0;

    for (const char *p = path; ; p++) {
        char c = *p;
        if (c == ':' || c == '\0' || c == '/') {
            segment[seg_len] = '\0';
            if (strcmp(segment, "..") == 0) {
                return 1;
            }
            seg_len = 0;
            if (c == '\0') {
                break;
            }
            continue;
        }
        if (seg_len + 1 >= sizeof(segment)) {
            return 1;
        }
        segment[seg_len++] = c;
    }
    return 0;
}

static const char *mime_type_for_path(const char *path) {
    const char *dot = strrchr(path, '.');
    if (!dot) return "application/octet-stream";
    if (strcmp(dot, ".html") == 0 || strcmp(dot, ".htm") == 0) return "text/html; charset=utf-8";
    if (strcmp(dot, ".js") == 0 || strcmp(dot, ".mjs") == 0) return "application/javascript; charset=utf-8";
    if (strcmp(dot, ".css") == 0) return "text/css; charset=utf-8";
    if (strcmp(dot, ".json") == 0 || strcmp(dot, ".map") == 0) return "application/json; charset=utf-8";
    if (strcmp(dot, ".txt") == 0) return "text/plain; charset=utf-8";
    if (strcmp(dot, ".md") == 0) return "text/markdown; charset=utf-8";
    if (strcmp(dot, ".csv") == 0) return "text/csv; charset=utf-8";
    if (strcmp(dot, ".svg") == 0) return "image/svg+xml";
    if (strcmp(dot, ".png") == 0) return "image/png";
    if (strcmp(dot, ".jpg") == 0 || strcmp(dot, ".jpeg") == 0) return "image/jpeg";
    if (strcmp(dot, ".gif") == 0) return "image/gif";
    if (strcmp(dot, ".webp") == 0) return "image/webp";
    if (strcmp(dot, ".ico") == 0) return "image/x-icon";
    if (strcmp(dot, ".wasm") == 0) return "application/wasm";
    return "application/octet-stream";
}

static void send_simple(th_socket_t client, int status, const char *reason, const char *body, const char *extra_headers) {
    char header[TH_SMALL_BUF];
    size_t body_len = body ? strlen(body) : 0;
    int written = snprintf(header, sizeof(header),
        "HTTP/1.1 %d %s\r\n"
        "Server: TrivialHTTP/%s\r\n"
        "Content-Type: text/plain; charset=utf-8\r\n"
        "Content-Length: %zu\r\n"
        "Connection: close\r\n"
        "%s"
        "\r\n",
        status, reason, TH_VERSION, body_len, extra_headers ? extra_headers : "");
    if (written > 0) {
        send(client, header, (int)strlen(header), 0);
    }
    if (body_len > 0) {
        send(client, body, (int)body_len, 0);
    }
}

static int build_local_path(const TrivialHttpOptions *options, const char *url, char *local_path, size_t local_path_size) {
    char decoded[PATH_MAX];
    char relative[PATH_MAX];

    if (decode_url_path(url, decoded, sizeof(decoded)) != 0) {
        return 400;
    }

    const char *trimmed = decoded;
    while (*trimmed == '/') {
        trimmed++;
    }

    if (unsafe_path_segments(trimmed)) {
        return 403;
    }

    if (th_strlcpy(relative, trimmed, sizeof(relative)) != 0) {
        return 414;
    }
    if (relative[0] == '\0' || relative[strlen(relative) - 1] == '/') {
        if (th_strlcat(relative, "index.html", sizeof(relative)) != 0) {
            return 414;
        }
    }

    if (th_strlcpy(local_path, options->root_real, local_path_size) != 0) {
        return 500;
    }
    size_t root_len = strlen(local_path);
    if (root_len > 0 && local_path[root_len - 1] != '/' && local_path[root_len - 1] != '\\') {
        char sep[2] = { TH_PATH_SEP, '\0' };
        if (th_strlcat(local_path, sep, local_path_size) != 0) {
            return 500;
        }
    }
    for (char *p = relative; *p; p++) {
        if (*p == '/') {
            *p = TH_PATH_SEP;
        }
    }
    if (th_strlcat(local_path, relative, local_path_size) != 0) {
        return 414;
    }
    return 0;
}

static void serve_file(th_socket_t client, const TrivialHttpOptions *options, const char *method, const char *url) {
    int is_head = strcmp(method, "HEAD") == 0;
    if (strcmp(method, "GET") != 0 && !is_head) {
        send_simple(client, 405, "Method Not Allowed", "Method not allowed.\n", "Allow: GET, HEAD\r\n");
        return;
    }

    char candidate[PATH_MAX];
    char candidate_real[PATH_MAX];
    int build_result = build_local_path(options, url, candidate, sizeof(candidate));
    if (build_result == 400) {
        send_simple(client, 400, "Bad Request", "Bad request.\n", NULL);
        return;
    }
    if (build_result == 403) {
        send_simple(client, 403, "Forbidden", "Forbidden.\n", NULL);
        return;
    }
    if (build_result != 0) {
        send_simple(client, 414, "URI Too Long", "URI too long.\n", NULL);
        return;
    }

    if (!file_is_regular(candidate)) {
        send_simple(client, 404, "Not Found", "Not found.\n", NULL);
        return;
    }
    if (canonical_path(candidate, candidate_real, sizeof(candidate_real)) != 0 || !path_under_root(options->root_real, candidate_real)) {
        send_simple(client, 403, "Forbidden", "Forbidden.\n", NULL);
        return;
    }

    FILE *file = fopen(candidate_real, "rb");
    if (!file) {
        send_simple(client, 404, "Not Found", "Not found.\n", NULL);
        return;
    }
    if (fseek(file, 0, SEEK_END) != 0) {
        fclose(file);
        send_simple(client, 500, "Internal Server Error", "Could not read file.\n", NULL);
        return;
    }
    long file_size = ftell(file);
    if (file_size < 0) {
        fclose(file);
        send_simple(client, 500, "Internal Server Error", "Could not read file.\n", NULL);
        return;
    }
    rewind(file);

    char header[TH_SMALL_BUF];
    int header_len = snprintf(header, sizeof(header),
        "HTTP/1.1 200 OK\r\n"
        "Server: TrivialHTTP/%s\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %ld\r\n"
        "Cache-Control: no-store\r\n"
        "Connection: close\r\n"
        "\r\n",
        TH_VERSION, mime_type_for_path(candidate_real), file_size);
    if (header_len > 0) {
        send(client, header, (int)strlen(header), 0);
    }

    if (!is_head) {
        char buffer[16384];
        size_t n;
        while ((n = fread(buffer, 1, sizeof(buffer), file)) > 0) {
            if (send(client, buffer, (int)n, 0) < 0) {
                break;
            }
        }
    }
    fclose(file);
}

static void handle_client(th_socket_t client, const TrivialHttpOptions *options) {
    char buffer[TH_READ_BUF + 1];
    int received = recv(client, buffer, TH_READ_BUF, 0);
    if (received <= 0) {
        return;
    }
    buffer[received] = '\0';

    char method[16];
    char url[PATH_MAX];
    char version[32];
    if (sscanf(buffer, "%15s %4095s %31s", method, url, version) != 3) {
        send_simple(client, 400, "Bad Request", "Bad request.\n", NULL);
        return;
    }
    if (strncmp(version, "HTTP/", 5) != 0) {
        send_simple(client, 400, "Bad Request", "Bad request.\n", NULL);
        return;
    }
    serve_file(client, options, method, url);
}

static int initialize_sockets(void) {
#ifdef _WIN32
    WSADATA wsa;
    return WSAStartup(MAKEWORD(2, 2), &wsa) == 0 ? 0 : -1;
#else
    signal(SIGPIPE, SIG_IGN);
    return 0;
#endif
}

static void shutdown_sockets(void) {
#ifdef _WIN32
    WSACleanup();
#endif
}

static th_socket_t create_listener(unsigned short requested_port, unsigned short *actual_port) {
    th_socket_t listener = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (listener == TH_INVALID_SOCKET) {
        return TH_INVALID_SOCKET;
    }

    int yes = 1;
#ifdef _WIN32
    setsockopt(listener, SOL_SOCKET, SO_REUSEADDR, (const char *)&yes, sizeof(yes));
#else
    setsockopt(listener, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));
#endif

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    addr.sin_port = htons(requested_port);

    if (bind(listener, (struct sockaddr *)&addr, sizeof(addr)) != 0) {
        TH_CLOSE(listener);
        return TH_INVALID_SOCKET;
    }
    if (listen(listener, 16) != 0) {
        TH_CLOSE(listener);
        return TH_INVALID_SOCKET;
    }

    TH_SOCKLEN len = sizeof(addr);
    if (getsockname(listener, (struct sockaddr *)&addr, &len) != 0) {
        TH_CLOSE(listener);
        return TH_INVALID_SOCKET;
    }
    *actual_port = ntohs(addr.sin_port);
    return listener;
}

static void build_browser_url(unsigned short port, const char *target, char *url, size_t url_size) {
    if (strncmp(target, "http://", 7) == 0 || strncmp(target, "https://", 8) == 0) {
        th_strlcpy(url, target, url_size);
        return;
    }
    snprintf(url, url_size, "http://127.0.0.1:%u%s%s", port, target[0] == '/' ? "" : "/", target);
}

static void open_browser(const char *url) {
#ifdef _WIN32
    ShellExecuteA(NULL, "open", url, NULL, NULL, SW_SHOWNORMAL);
#else
    pid_t pid = fork();
    if (pid == 0) {
#ifdef __APPLE__
        execlp("open", "open", url, (char *)NULL);
#else
        execlp("xdg-open", "xdg-open", url, (char *)NULL);
#endif
        _exit(127);
    }
#endif
}

int main(int argc, char **argv) {
    TrivialHttpOptions options;
    int parse_result = parse_args(argc, argv, &options);
    if (parse_result > 0) {
        return 0;
    }
    if (parse_result < 0) {
        return 2;
    }

    if (canonical_path(options.root, options.root_real, sizeof(options.root_real)) != 0) {
        fprintf(stderr, "Could not resolve root folder: %s\n", options.root);
        return 2;
    }

    if (initialize_sockets() != 0) {
        fprintf(stderr, "Could not initialize sockets.\n");
        return 2;
    }

    unsigned short actual_port = 0;
    th_socket_t listener = create_listener(options.port, &actual_port);
    if (listener == TH_INVALID_SOCKET) {
        fprintf(stderr, "Could not bind 127.0.0.1:%u.\n", options.port);
        shutdown_sockets();
        return 2;
    }

    char browser_url[TH_URL_BUF];
    build_browser_url(actual_port, options.open_target, browser_url, sizeof(browser_url));

    printf("TrivialHTTP %s\n", TH_VERSION);
    printf("Root: %s\n", options.root_real);
    printf("URL:  %s\n", browser_url);
    printf("Bind: 127.0.0.1:%u\n", actual_port);
    printf("Press Ctrl+C to stop.\n");
    fflush(stdout);

    if (!options.no_open) {
        open_browser(browser_url);
    }

    for (;;) {
        struct sockaddr_in client_addr;
        TH_SOCKLEN client_len = sizeof(client_addr);
        th_socket_t client = accept(listener, (struct sockaddr *)&client_addr, &client_len);
        if (client == TH_INVALID_SOCKET) {
            continue;
        }
        handle_client(client, &options);
        TH_CLOSE(client);
        if (options.once) {
            break;
        }
    }

    TH_CLOSE(listener);
    shutdown_sockets();
    return 0;
}
