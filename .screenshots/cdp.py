"""Minimal CDP driver over a hand-rolled WebSocket client (no third-party deps)."""
import base64
import json
import os
import socket
import struct
import subprocess
import sys
import time
import urllib.request

PORT = 9223
HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL = "http://127.0.0.1:8765/index.html"


class WS:
    def __init__(self, url):
        rest = url.split("://", 1)[1]
        hostport, path = rest.split("/", 1)
        host, port = hostport.split(":")
        self.sock = socket.create_connection((host, int(port)))
        key = base64.b64encode(os.urandom(16)).decode()
        req = (
            f"GET /{path} HTTP/1.1\r\nHost: {hostport}\r\nUpgrade: websocket\r\n"
            f"Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(req.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.sock.recv(4096)
        self.buf = buf.split(b"\r\n\r\n", 1)[1]
        self.msg_id = 0

    def _recv(self, n):
        while len(self.buf) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise EOFError
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def send(self, payload):
        data = payload.encode()
        header = b"\x81"
        n = len(data)
        if n < 126:
            header += struct.pack("B", 0x80 | n)
        elif n < 65536:
            header += struct.pack("!BH", 0x80 | 126, n)
        else:
            header += struct.pack("!BQ", 0x80 | 127, n)
        mask = os.urandom(4)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
        self.sock.sendall(header + mask + masked)

    def recv(self):
        while True:
            b0, b1 = self._recv(2)
            opcode = b0 & 0x0F
            length = b1 & 0x7F
            if length == 126:
                length = struct.unpack("!H", self._recv(2))[0]
            elif length == 127:
                length = struct.unpack("!Q", self._recv(8))[0]
            payload = self._recv(length)
            if opcode == 1:
                return json.loads(payload.decode())
            if opcode == 8:
                raise EOFError

    def call(self, method, params=None):
        self.msg_id += 1
        mid = self.msg_id
        self.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = self.recv()
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})

    def wait_event(self, name, timeout=15):
        end = time.time() + timeout
        while time.time() < end:
            msg = self.recv()
            if msg.get("method") == name:
                return msg
        raise TimeoutError(name)


def launch():
    proc = subprocess.Popen(
        [
            CHROME,
            "--headless=new",
            f"--remote-debugging-port={PORT}",
            f"--user-data-dir={HERE}/profile",
            "--hide-scrollbars",
            "--no-first-run",
            "--disable-extensions",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(80):
        try:
            data = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list"))
            pages = [t for t in data if t["type"] == "page"]
            if pages:
                return proc, pages[0]["webSocketDebuggerUrl"]
        except Exception:
            pass
        time.sleep(0.25)
    raise RuntimeError("chrome did not start")


def shoot(ws, out, width, height, mobile, selector=None, pad=28, full=False):
    ws.call(
        "Emulation.setDeviceMetricsOverride",
        {"width": width, "height": height, "deviceScaleFactor": 2, "mobile": mobile},
    )
    ws.call("Page.navigate", {"url": URL})
    ws.wait_event("Page.loadEventFired")
    time.sleep(1.6)

    metrics = ws.call(
        "Runtime.evaluate",
        {
            "expression": "(() => {const s=document.querySelector('.split-scan');"
            "const l=s.children[0].getBoundingClientRect();"
            "const r=s.children[1].getBoundingClientRect();"
            "const img=s.querySelector('.split-media').getBoundingClientRect();"
            "return JSON.stringify({sw: document.documentElement.scrollWidth,"
            "cw: document.documentElement.clientWidth,"
            "bsw: document.body.scrollWidth,"
            "left: Math.round(l.height), right: Math.round(r.height),"
            "img: [Math.round(img.width), Math.round(img.height)],"
            "scanLinks: s.querySelectorAll('[href*=\"#/scan\"]').length});})()",
            "returnByValue": True,
        },
    )["result"]["value"]

    params = {"format": "png", "captureBeyondViewport": True}
    if selector:
        rect = ws.call(
            "Runtime.evaluate",
            {
                "expression": f"(() => {{const e=document.querySelector('{selector}');"
                "const r=e.getBoundingClientRect();"
                "return JSON.stringify({x:r.x+window.scrollX,y:r.y+window.scrollY,w:r.width,h:r.height});})()",
                "returnByValue": True,
            },
        )["result"]["value"]
        r = json.loads(rect)
        params["clip"] = {
            "x": max(0, r["x"] - pad),
            "y": max(0, r["y"] - pad),
            "width": min(width, r["w"] + pad * 2),
            "height": r["h"] + pad * 2,
            "scale": 1,
        }
    elif full:
        params["captureBeyondViewport"] = True

    png = ws.call("Page.captureScreenshot", params)["data"]
    with open(out, "wb") as fh:
        fh.write(base64.b64decode(png))
    return metrics


def main():
    proc, wsurl = launch()
    try:
        ws = WS(wsurl)
        ws.call("Page.enable")
        ws.call("Runtime.enable")
        desktop = shoot(
            ws, f"{HERE}/label-scan-desktop.png", 1024, 900, False, selector=".split-scan", pad=48
        )
        print("desktop-1024", desktop)
        wide = shoot(
            ws, f"{HERE}/label-scan-1280.png", 1280, 900, False, selector=".split-scan", pad=56
        )
        print("desktop-1280", wide)
        mobile = shoot(
            ws, f"{HERE}/label-scan-mobile.png", 390, 844, True, selector=".split-scan", pad=18
        )
        print("mobile", mobile)
        ws.call("Emulation.clearDeviceMetricsOverride")
    finally:
        proc.terminate()


if __name__ == "__main__":
    main()
