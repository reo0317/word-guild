"""ブラウザー検査専用の排他HTTP配信。終了まで所有し、障害を記録する。"""

import os
import socket
import traceback
from datetime import UTC, datetime
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Event, Thread
from time import monotonic
from urllib.request import urlopen


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def log_request(self, code="-", size="-"):
        self.server.record("response", path=self.path, status=code)

    def do_GET(self):
        self.server.record("request", path=self.path)
        try:
            if self.path == "/__quality_health":
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"ready")
            else:
                super().do_GET()
            self.server.record("request_finished", path=self.path)
        except Exception:
            self.server.record("request_error", path=self.path, error=traceback.format_exc())
            raise


class BrowserServer(ThreadingHTTPServer):
    # WindowsのSO_REUSEADDRは稼働中の同ポートの再束縛を許す。検査ごとに排他所有する。
    allow_reuse_address = False
    request_queue_size = 128
    daemon_threads = True

    def __init__(self, root):
        self.events = []
        self.started = monotonic()
        self.ready = Event()
        self.thread = None
        super().__init__(("127.0.0.1", 0), partial(Handler, directory=str(root)))
        self.url = f"http://127.0.0.1:{self.server_port}"
        self.record("bound", address=self.server_address, pid=os.getpid())

    def record(self, kind, **details):
        self.events.append(
            dict(
                kind=kind,
                at=datetime.now(UTC).isoformat(),
                seconds=round(monotonic() - self.started, 6),
                **details,
            )
        )

    def server_bind(self):
        if os.name == "nt":
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()

    def handle_error(self, request, client_address):
        self.record("handler_error", client=client_address, error=traceback.format_exc())

    def serve(self):
        self.record("serving")
        self.ready.set()
        try:
            self.serve_forever(poll_interval=0.05)
        except Exception:
            self.record("serve_error", error=traceback.format_exc())
        finally:
            self.record("serve_returned")

    def __enter__(self):
        self.thread = Thread(target=self.serve, name="quality-http", daemon=False)
        self.thread.start()
        try:
            assert self.ready.wait(5), "検査HTTPの起動に失敗"
            self.assert_running()
        except Exception:
            self.__exit__(None, None, None)
            raise
        return self

    def assert_running(self):
        assert self.thread and self.thread.is_alive(), "検査HTTPスレッドが終了"
        with urlopen(self.url + "/__quality_health", timeout=5) as response:
            assert response.status == 200 and response.read() == b"ready", "検査HTTP応答が不正"
        self.record("health_ok")

    def __exit__(self, *args):
        self.record("shutdown_requested")
        self.shutdown()
        self.thread.join(timeout=5)
        self.server_close()
        self.record("closed", thread_alive=self.thread.is_alive())
        assert not self.thread.is_alive(), "検査HTTPを終了できない"

    def snapshot(self):
        return {
            "url": self.url,
            "exclusive_address": os.name == "nt",
            "queue_size": self.request_queue_size,
            "events": list(self.events),
        }
