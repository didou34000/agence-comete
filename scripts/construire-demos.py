#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fabrique les visites de démonstration à partir des panoramas Poly Haven.

Pourquoi un script plutôt que six pages écrites à la main : les six démos
partagent la même page et le même lecteur, seules changent les données. Une
retouche de gabarit se propage alors partout, et les cadrages restent au même
endroit que les liens, qui en dépendent.

RÈGLE DE FABRICATION, à ne pas contourner
-----------------------------------------
Un déplacement n'est proposé qu'entre deux panoramas pris **au même endroit
réel**, et il est posé sur une ouverture visible : une porte, une baie. Relier
deux lieux différents produirait une flèche qui ment, et c'est précisément ce
que personne ne pardonne à une visite virtuelle : on avance vers une porte et
on arrive ailleurs.

Les directions sont relevées sur les panoramas eux-mêmes, pas estimées : un
relevé à l'œil sur un équirectangulaire se trompe de vingt à quarante degrés,
ce qui suffit à poser la flèche sur un mur à côté de la porte.

Corollaire : quand il n'existe qu'un panorama d'un lieu, la démo n'a qu'une
position et l'annonce. Une seule vue à 360° reste une démonstration honnête.

    python3 scripts/construire-demos.py            (tout reconstruire)

Les sources attendues sont les JPG tonemappés 8192x4096 de Poly Haven, dans
SOURCES. Ils ne sont pas versionnés : seuls les WebP dérivés le sont.
"""
import json
import math
import os
import subprocess
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = os.environ.get("PANOS", "/tmp/pano")
LARGEUR_PANO = 4096          # comme l'export du studio
QUALITE_PANO = 72            # au-delà, la végétation double le poids sans se voir
IMG = os.path.join(RACINE, "assets", "img")


def v(vers, yaw, pitch):
    """Un passage, posé sur une ouverture visible.

    La vue d'arrivée n'est pas choisie ici : elle vaut toujours le cadrage
    d'ouverture du lieu d'arrivée, calculé plus bas. Comme ce cadrage montre
    forcément une sortie (le contrôle en fin de construction l'impose), on
    arrive toujours en voyant par où repartir.
    """
    return {"to": vers, "yaw": float(yaw), "pitch": float(pitch),
            "label": None, "targetYaw": None, "targetPitch": None}


def p(src, label, yaw, pitch, liens=()):
    return {"src": src, "label": label, "yaw": float(yaw), "pitch": float(pitch),
            "liens": list(liens)}


DEMOS = [
    {
        "slug": "appartement",
        "affiche": ("combination_room", -135, -4),
        "nom": "Appartement ancien",
        "resume": "Un vrai panorama 360° d’un salon ancien, à explorer librement.",
        "meta": "Visite virtuelle 360° d’un salon d’appartement ancien : parquet, "
                "portes moulurées et belle hauteur sous plafond. Démonstration de "
                "L'Agence du Sud, sans plateforme ni cookie.",
        "positions": [
            # Une vraie position 360°, sans inventer de passage vers un autre lieu.
            p("combination_room", "Le salon", -135, -4),
        ],
    },
    {
        "slug": "maison",
        "affiche": ("lythwood_terrace", 35, -6),
        "nom": "Maison de maître",
        "resume": "Du parc à la chambre, en passant par la terrasse et le salon.",
        "meta": "Visite virtuelle 360° d’une maison de maître : le parc, la terrasse, "
                "le salon et la chambre, reliés par leurs vraies ouvertures. "
                "Démonstration de L'Agence du Sud.",
        "positions": [
            # Ouvertures relevées : le porche de la maison depuis le parc (-97),
            # la baie vitrée depuis la terrasse (20), la porte du salon vers
            # l'aile des chambres (-38), sa baie vers le jardin (50), et la
            # porte de la chambre vers le reste de la maison (-113).
            p("lythwood_field", "Le parc", -97, -2, [
                v("lythwood_terrace", -97, -14)]),
            p("lythwood_terrace", "La terrasse", 10, -6, [
                v("lythwood_field", -70, -18),
                v("lythwood_lounge", 20, -12)]),
            p("lythwood_lounge", "Le salon", -80, -4, [
                v("lythwood_terrace", 50, -14),
                v("lythwood_room", -38, -12)]),
            p("lythwood_room", "La chambre", -70, -4, [
                v("lythwood_lounge", -113, -14)]),
        ],
    },
    {
        "slug": "hotel",
        "nom": "Chambre d’hôtel",
        "resume": "Une chambre et sa terrasse, en une vue.",
        "meta": "Vue à 360° d’une chambre d’hôtel ouvrant sur sa terrasse. "
                "Démonstration de L'Agence du Sud.",
        "positions": [p("relax_inn_seaview_suite", "La chambre", 85, -4)],
    },
    {
        "slug": "piscine",
        "nom": "Piscine et jardin",
        "resume": "Un bassin bordé de palmiers, en une vue.",
        "meta": "Vue à 360° d’un bassin bordé de palmiers. "
                "Démonstration de L'Agence du Sud.",
        "positions": [p("pool", "Le bassin", 85, 2)],
    },
    {
        "slug": "terrasse",
        "nom": "Terrasse en bord de mer",
        "resume": "Un salon d’été couvert face à la mer, en une vue.",
        "meta": "Vue à 360° d’une terrasse couverte face à la mer. "
                "Démonstration de L'Agence du Sud.",
        "positions": [p("sundowner_deck", "La terrasse", -60, -4)],
    },
]

GABARIT = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <!-- Cette visite-ci est une DÉMONSTRATION publique, liée depuis la page
       pilier et déclarée au sitemap : elle est donc ouverte à l'indexation.
       Les exports du studio arrivent en « noindex, nofollow » par défaut,
       et c'est le bon réglage pour la visite d'un client : ne l'ouvrir que
       pour ce qu'on assume de montrer publiquement. -->
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="description" content="{meta}">
  <link rel="canonical" href="https://lagencedusud.com/visites/{slug}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="L'Agence du Sud">
  <meta property="og:url" content="https://lagencedusud.com/visites/{slug}">
  <meta property="og:title" content="Visite virtuelle 360° : {nom}">
  <meta property="og:description" content="{resume}">
  <meta property="og:image" content="https://lagencedusud.com/assets/img/visite-{slug}.jpg">
  <meta property="og:image:width" content="1600">
  <meta property="og:image:height" content="800">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <title>Visite virtuelle 360° : {nom} | L'Agence du Sud</title>
  <link rel="stylesheet" href="/visites/_lecteur/vendor/pannellum.css">
  <link rel="stylesheet" href="/visites/_lecteur/style.css">
</head>
<body>
  <div id="viewer" aria-label="Visite virtuelle 360°"></div>

  <div id="loading" class="overlay">
    <div class="overlay-inner">
      <div class="spinner" aria-hidden="true"></div>
      <p class="overlay-title">{nom}</p>
      <p class="overlay-sub">Chargement de la visite…</p>
    </div>
  </div>

  <div id="error" class="overlay hidden">
    <div class="overlay-inner">
      <p class="overlay-title">Impossible d'afficher la visite</p>
      <p class="overlay-sub" id="error-message"></p>
      <button type="button" id="error-retry" class="btn">Réessayer</button>
    </div>
  </div>

  <header id="titlebar">
    <span id="tour-title">{nom}</span>
    <span id="scene-title"></span>
    <!-- Une visite se partage par mail ou par SMS, souvent sans le site autour :
         c'est parfois le seul endroit où le visiteur apprend qui l'a réalisée. -->
    <a id="marque" href="/visite-virtuelle-360#contact" target="_top">
      <span class="pastille" aria-hidden="true"></span>
      <span class="libelle">Visite réalisée par</span> L’Agence du Sud
    </a>
  </header>

  <nav id="bar" aria-label="Navigation entre les positions">
    <button type="button" id="btn-prev" class="bar-btn" aria-label="Position précédente" title="Position précédente">
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div id="chips" role="tablist" aria-label="Positions de la visite"></div>
    <button type="button" id="btn-next" class="bar-btn" aria-label="Position suivante" title="Position suivante">
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button type="button" id="btn-fs" class="bar-btn" aria-label="Plein écran" title="Plein écran">
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </nav>

  <script>window.TOUR_BASE = "/visites/{slug}/";</script>
  <script>window.TOUR_DATA = {donnees};</script>
  <script src="/visites/_lecteur/vendor/pannellum.js"></script>
  <script src="/visites/_lecteur/viewer.js"></script>
  <script src="/visites/_lecteur/app.js"></script>
<script src="/consentement.js" defer></script>
</body>
</html>
"""


def rendre(src, yaw, pitch, largeur, hauteur, hfov, sortie, qualite=80, jpg=False):
    """Un cadrage rectiligne : lisible, contrairement à un équirectangulaire."""
    vfov = 2 * math.degrees(math.atan(math.tan(math.radians(hfov) / 2) * hauteur / largeur))
    tmp = f"/tmp/rendu-{os.path.basename(sortie)}.png"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{SOURCES}/{src}.jpg", "-vf",
                    f"v360=e:rectilinear:yaw={yaw}:pitch={pitch}:h_fov={hfov}:v_fov={vfov:.2f}:"
                    f"w={largeur * 2}:h={hauteur * 2},scale={largeur}:{hauteur}:flags=lanczos",
                    tmp], check=True)
    if jpg:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-q:v", "4", sortie], check=True)
    else:
        subprocess.run(["cwebp", "-quiet", "-q", str(qualite), "-m", "6", tmp, "-o", sortie], check=True)
    os.remove(tmp)


def construire(demo):
    base = os.path.join(RACINE, "visites", demo["slug"])
    os.makedirs(os.path.join(base, "panoramas"), exist_ok=True)
    os.makedirs(os.path.join(base, "thumbs"), exist_ok=True)

    ids = {pos["src"] for pos in demo["positions"]}
    noeuds = []
    for ordre, pos in enumerate(demo["positions"]):
        for lien in pos["liens"]:
            assert lien["to"] in ids, f'{demo["slug"]} : passage vers un lieu absent, {lien["to"]}'

        src = os.path.join(SOURCES, pos["src"] + ".jpg")
        tmp = f"/tmp/equi-{pos['src']}.png"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-vf",
                        f"scale={LARGEUR_PANO}:{LARGEUR_PANO // 2}:flags=lanczos", tmp], check=True)
        subprocess.run(["cwebp", "-quiet", "-q", str(QUALITE_PANO), "-m", "6", tmp,
                        "-o", os.path.join(base, "panoramas", pos["src"] + ".webp")], check=True)
        os.remove(tmp)
        rendre(pos["src"], pos["yaw"], pos["pitch"], 320, 160, 95,
               os.path.join(base, "thumbs", pos["src"] + ".webp"))

        noeuds.append({
            "id": pos["src"], "label": pos["label"], "order": ordre,
            "panorama": {"width": 8192, "height": 4096,
                         "sources": [{"src": f'panoramas/{pos["src"]}.webp', "width": LARGEUR_PANO}],
                         "thumbnail": f'thumbs/{pos["src"]}.webp'},
            "view": {"yaw": pos["yaw"], "pitch": pos["pitch"], "hfov": 100},
            "northOffset": 0, "position": None, "links": pos["liens"], "auto_label": False,
        })

    cadrages = {pos["src"]: pos["yaw"] for pos in demo["positions"]}
    for noeud in noeuds:
        for lien in noeud["links"]:
            lien["targetYaw"] = cadrages[lien["to"]]

    visite = {
        "version": 1, "id": demo["slug"], "name": demo["nom"],
        "created": "2026-09-08T00:00:00.000Z", "updated": "2026-09-08T00:00:00.000Z",
        "settings": {"sceneFadeDuration": 900, "autoRotate": False,
                     "nadir": {"mode": "text", "text": "L’Agence du Sud",
                               "size": 190, "color": "#17130E"}},
        "startNodeId": demo["positions"][0]["src"], "nodes": noeuds,
    }
    with open(os.path.join(base, "tour.json"), "w", encoding="utf-8") as f:
        json.dump(visite, f, ensure_ascii=False, indent=2)
        f.write("\n")

    page = GABARIT.format(slug=demo["slug"], nom=demo["nom"], resume=demo["resume"],
                          meta=demo["meta"],
                          donnees=json.dumps(visite, ensure_ascii=False, separators=(",", ":")))
    with open(os.path.join(base, "index.html"), "w", encoding="utf-8") as f:
        f.write(page)

    # Vignettes de la page, en 16/9 et en partage social. Le cadrage
    # d'ouverture montre une porte : c'est bon pour s'orienter, pas pour
    # donner envie. « affiche » permet donc d'en choisir un autre.
    src, yaw, pitch = demo.get("affiche") or (demo["positions"][0]["src"],
                                              demo["positions"][0]["yaw"],
                                              demo["positions"][0]["pitch"])
    rendre(src, yaw, pitch, 900, 506, 84, os.path.join(IMG, f'visite-{demo["slug"]}.webp'))
    rendre(src, yaw, pitch, 1600, 800, 88, os.path.join(IMG, f'visite-{demo["slug"]}.jpg'), jpg=True)

    # Contrôle : chaque position doit montrer au moins un passage dès l'arrivée,
    # sinon le visiteur croit la visite bloquée et s'arrête là.
    for noeud in noeuds:
        if not noeud["links"]:
            continue
        vue, demi = noeud["view"]["yaw"], noeud["view"]["hfov"] / 2
        vus = [l for l in noeud["links"] if abs((l["yaw"] - vue + 180) % 360 - 180) <= demi]
        assert vus, f'{demo["slug"]} / {noeud["label"]} : aucun passage dans le champ d’ouverture'

    poids = sum(os.path.getsize(os.path.join(base, "panoramas", f))
                for f in os.listdir(os.path.join(base, "panoramas")))
    print(f'{demo["slug"]:12} {len(noeuds)} position(s)  {poids // 1024:5} Ko')


if __name__ == "__main__":
    voulus = sys.argv[1:]
    for demo in DEMOS:
        if not voulus or demo["slug"] in voulus:
            construire(demo)
