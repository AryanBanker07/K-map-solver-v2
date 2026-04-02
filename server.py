#!/usr/bin/env python3
"""
Simple HTTP server for K-Map Solver
Run with: python server.py
Then open: http://localhost:8000
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"\n{'='*60}")
        print(f"  K-Map Solver Server")
        print(f"{'='*60}")
        print(f"\n  Server running at: {url}")
        print(f"  Serving from: {DIRECTORY}")
        print(f"\n  Press Ctrl+C to stop")
        print(f"{'='*60}\n")

        try:
            # Try to open browser automatically
            if os.name == 'nt':  # Windows
                webbrowser.open_new(url)
            elif os.name == 'posix':  # macOS, Linux, BSD
                webbrowser.open_new_tab(url)
        except:
            pass

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")
            return 0

if __name__ == "__main__":
    exit(main())
