#!/usr/bin/env python3
"""
The Economic Wardrobe — local save server
Run this instead of `python3 -m http.server 8080`
It serves the site AND saves your edits back to the HTML files.
"""

import json, os, re
from http.server import HTTPServer, SimpleHTTPRequestHandler

SAVE_PASSWORD = 'wardrobe2024'   # must match js/editor.js
PORT          = 8080
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))


class SaveHandler(SimpleHTTPRequestHandler):

    def do_POST(self):
        if self.path != '/save':
            self.send_error(404)
            return

        length  = int(self.headers.get('Content-Length', 0))
        body    = self.rfile.read(length)
        payload = json.loads(body)

        password = payload.get('password', '')
        filename = payload.get('file', '')
        fields   = payload.get('fields', {})   # { data-id : html-content }

        # ── Auth ──────────────────────────────────────────────
        if password != SAVE_PASSWORD:
            self._json(403, {'error': 'wrong password'})
            return

        # ── Validate filename (no path traversal) ─────────────
        filename = os.path.basename(filename)
        if not filename.endswith('.html'):
            self._json(400, {'error': 'bad filename'})
            return

        filepath = os.path.join(BASE_DIR, filename)
        if not os.path.exists(filepath):
            self._json(404, {'error': 'file not found'})
            return

        # ── Read current file ──────────────────────────────────
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()

        # ── Replace each editable field by data-save-id ───────
        changed = 0
        for field_id, new_content in fields.items():
            # Match the opening tag that has this data-save-id, capture tag + attrs,
            # then replace everything up to the next closing tag of the same element.
            # We target: <TAG ... data-save-id="FIELD_ID" ...>OLD CONTENT</TAG>
            pattern = (
                r'(<(?:p|h1|h2|h3|span|div)[^>]*'
                r'data-save-id="' + re.escape(field_id) + r'"'
                r'[^>]*>)'
                r'(.*?)'
                r'(</(?:p|h1|h2|h3|span|div)>)'
            )
            replacement = r'\g<1>' + new_content.replace('\\', '\\\\') + r'\g<3>'
            new_html, n = re.subn(pattern, replacement, html, flags=re.DOTALL)
            if n:
                html = new_html
                changed += n

        # ── Write back ────────────────────────────────────────
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)

        self._json(200, {'saved': changed, 'file': filename})

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type',  'application/json')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, fmt, *args):
        # Quiet down static-file noise, show saves
        if '/save' in (args[0] if args else ''):
            print(f'  💾  {fmt % args}')


if __name__ == '__main__':
    os.chdir(BASE_DIR)
    print(f'\n  The Economic Wardrobe — save server')
    print(f'  Running at http://localhost:{PORT}')
    print(f'  Edit URL:  http://localhost:{PORT}/article-byzantine.html?edit={SAVE_PASSWORD}')
    print(f'\n  Ctrl+C to stop\n')
    HTTPServer(('', PORT), SaveHandler).serve_forever()
