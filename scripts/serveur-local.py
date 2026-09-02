#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Serveur de développement qui imite le comportement de Vercel.

`python3 -m http.server` ne sait pas résoudre les URLs sans extension.
Or vercel.json active `cleanUrls`, donc tous les liens internes du site
sont écrits sans le « .html » : en local, chacun renvoyait un 404, et
naviguer était impossible.

Ce serveur applique les deux règles de vercel.json :
  - cleanUrls    : /page  ->  page.html
  - trailingSlash: false   ->  /page/ redirige vers /page
Plus la page 404.html en repli, comme le fait Vercel.

    python3 scripts/serveur-local.py [port]      (4173 par défaut)
"""
import http.server, os, socketserver, sys, urllib.parse

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=RACINE, **kw)

    def translate_path(self, path):
        chemin = urllib.parse.urlparse(path).path
        local = super().translate_path(path)

        if os.path.isdir(local):
            index = os.path.join(local, 'index.html')
            if os.path.exists(index):
                return index

        # cleanUrls : on tente le .html quand l'URL n'a pas d'extension
        if not os.path.exists(local) and not os.path.splitext(chemin)[1]:
            avec = local.rstrip('/') + '.html'
            if os.path.exists(avec):
                return avec
            index = os.path.join(local.rstrip('/'), 'index.html')
            if os.path.exists(index):
                return index

        return local

    def send_error(self, code, message=None, explain=None):
        page = os.path.join(RACINE, '404.html')
        if code == 404 and os.path.exists(page):
            corps = open(page, 'rb').read()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(corps)))
            self.end_headers()
            self.wfile.write(corps)
            return
        super().send_error(code, message, explain)

    def end_headers(self):
        """Aucune mise en cache en développement.

        Sans ça le navigateur garde l'ancienne feuille de style et on
        croit que la page est cassée alors que le serveur envoie déjà la
        bonne version. Ça nous a coûté plusieurs faux diagnostics : la
        règle est donc posée ici une fois pour toutes. En production,
        c'est vercel.json qui décide, et lui met de vrais caches.
        """
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, *a):
        pass                                   # sortie silencieuse


class Serveur(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    with Serveur(('', PORT), Handler) as s:
        print('  http://localhost:%d  (cleanUrls actif, Ctrl+C pour arrêter)' % PORT)
        s.serve_forever()
