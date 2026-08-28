"""Dev server for Ingredient_Check.

Threaded and no-cache, so edits show up on a plain reload and a single stalled
browser connection cannot block the whole server.
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "favicon" in self.path:
            return
        super().log_message(fmt, *args)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    server = ThreadingHTTPServer(("127.0.0.1", port), partial(Handler, directory="."))
    server.daemon_threads = True
    print(f"Serving http://127.0.0.1:{port}/")
    server.serve_forever()
