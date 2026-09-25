"""Static server for the audio preview on port 8770, reachable from the local network.
Serves this folder; /assets-sounds/ maps read-only to ../cooking-game-assets/sounds for A/B comparison."""
import http.server, functools, os, socketserver
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = (ROOT.parent / "cooking-game-assets" / "sounds").resolve()

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".ogg": "audio/ogg"}
    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if clean.startswith("/assets-sounds/"):
            p = (ASSETS / clean[len("/assets-sounds/"):]).resolve()
            return str(p) if str(p).startswith(str(ASSETS)) else str(ROOT / "__nope__")
        return super().translate_path(path)
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

if __name__ == "__main__":
    os.chdir(ROOT)
    Server(("0.0.0.0", 8770), functools.partial(Handler, directory=str(ROOT))).serve_forever()
