#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Importe une visite 360 exportee par le studio local dans le site.

Le studio (~/Desktop/SC/SITEV2/visite-360) produit un dossier statique
autonome, sans domaine tiers. Ce script le reprend et l'allege pour le web :

  1. ne garde que le panorama 4096 (-low), pas l'original 8192 ;
  2. le convertit en WebP, qui divise le poids par deux a l'oeil nu ;
  3. remet auto_label a true sur les positions dont le libelle est reste
     un nom de fichier Insta360 : le viewer sait deja les masquer, mais
     l'export les ecrit toutes a false, donc « Img 20260820 113143 00 030 »
     s'affichait comme un nom de piece ;
  4. reecrit les chemins dans tour.json ET dans le window.TOUR_DATA
     recopie en ligne dans index.html.

Usage : python3 scripts/importer-visite.py <dossier-export> <slug>
"""
import json, os, re, shutil, subprocess, sys

MOTIF_FICHIER = re.compile(r'^img[\s_-]*\d{6,}', re.I)


def convertir(src, dst, qualite=76):
    subprocess.run(['cwebp', '-quiet', '-q', str(qualite), src, '-o', dst], check=True)


def reecrire(donnees):
    """Chemins vers le WebP, une seule source, libelles auto masques."""
    for n in donnees['nodes']:
        base = os.path.splitext(os.path.basename(
            n['panorama']['sources'][-1]['src']))[0]           # la plus petite
        n['panorama']['sources'] = [
            {'src': 'panoramas/%s.webp' % base, 'width': 4096}
        ]
        n['panorama']['thumbnail'] = 'thumbs/%s.webp' % \
            os.path.splitext(os.path.basename(n['panorama']['thumbnail']))[0]
        if MOTIF_FICHIER.match(n['label'].replace(' ', '')) or \
           MOTIF_FICHIER.match(n['label']):
            n['auto_label'] = True
    return donnees


def main(export, slug):
    dest = os.path.join(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))), 'visites', slug)
    os.makedirs(os.path.join(dest, 'panoramas'), exist_ok=True)
    os.makedirs(os.path.join(dest, 'thumbs'), exist_ok=True)

    for f in ('index.html', 'viewer.js', 'app.js', 'style.css'):
        shutil.copy2(os.path.join(export, f), dest)
    shutil.copytree(os.path.join(export, 'vendor'),
                    os.path.join(dest, 'vendor'), dirs_exist_ok=True)

    donnees = reecrire(json.load(open(os.path.join(export, 'tour.json'))))

    for n in donnees['nodes']:
        base = os.path.splitext(os.path.basename(
            n['panorama']['sources'][0]['src']))[0]
        src = os.path.join(export, 'panoramas', base + '.jpg')
        if not os.path.exists(src):                       # le -low d'origine
            src = os.path.join(export, 'panoramas', base + '-low.jpg')
        convertir(src, os.path.join(dest, 'panoramas', base + '.webp'))

        vig = os.path.splitext(os.path.basename(n['panorama']['thumbnail']))[0]
        for ext in ('.jpg', '.jpeg', '.png', '.webp'):
            p = os.path.join(export, 'thumbs', vig + ext)
            if os.path.exists(p):
                convertir(p, os.path.join(dest, 'thumbs', vig + '.webp'), 72)
                break

    with open(os.path.join(dest, 'tour.json'), 'w', encoding='utf-8') as f:
        json.dump(donnees, f, ensure_ascii=False, separators=(',', ':'))

    # window.TOUR_DATA est recopie en ligne dans index.html : il doit suivre.
    p = os.path.join(dest, 'index.html')
    html = open(p, encoding='utf-8').read()
    html = re.sub(r'window\.TOUR_DATA\s*=\s*\{.*?\};',
                  'window.TOUR_DATA = %s;' % json.dumps(
                      donnees, ensure_ascii=False, separators=(',', ':')),
                  html, count=1, flags=re.S)
    open(p, 'w', encoding='utf-8').write(html)

    masques = sum(1 for n in donnees['nodes'] if n.get('auto_label'))
    print('  %d positions, %d libelles de fichier masques' %
          (len(donnees['nodes']), masques))
    print('  -> visites/%s/' % slug)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
