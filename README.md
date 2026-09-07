# L'Agence du Sud · Agence visuelle à Montpellier et à Paris

Site statique d'une **agence visuelle** : visites virtuelles 360°, photo et
vidéo par drone. La création de site internet est le second métier, entier,
sur sa propre page.

Aucune dépendance, aucun build, aucun outil : ce sont des fichiers statiques
qu'un simple serveur HTTP suffit à servir.

## Ancrage géographique

L'agence est présentée comme ayant **deux bases : Montpellier et Paris**, et
comme intervenant dans **les deux villes et leurs alentours**. Ce n'est
pas qu'une formule dans les textes, ça se joue à cinq endroits qu'il faut garder
cohérents entre eux, sous peine d'envoyer des signaux contradictoires à Google :

1. **Le pied de page** de chaque page (baseline, adresse, cocarde) — 20 pages.
2. **Les titres et descriptions** des pages génériques. Les pages de ville
   (Nîmes, Béziers, Sète, Lunel) restent volontairement mono-ville : leur intérêt
   est justement d'être étroitement ciblées.
3. **Les données structurées** : `address` reste Montpellier, c'est le siège
   déclaré au SIRET. Paris est un second `Place` — **Paris, 75017**, avec les
   coordonnées du centre de l'arrondissement. **Aucune rue n'est publiée**, ni pour
   Montpellier ni pour Paris : c'est un choix, les mentions légales renvoient à une
   communication sur demande. Ne pas en inventer une pour « faire propre ».
4. **Les balises `geo.*`** : `FR-34` et `FR-75`.
5. **La carte de France** de l'accueil : deux points en `carte-france__base`.
   Paris a été retirée de la liste des villes secondaires pour ne pas y figurer
   deux fois.

Ce qui manque encore pour que Paris pèse vraiment : des **pages d'atterrissage
parisiennes** sur le modèle des pages de ville existantes, et une **fiche Google
Business** pour l'établissement parisien. Sans elles, le site dit qu'il est à
Paris mais n'a rien pour se classer sur les requêtes locales parisiennes.

## Arborescence

| Fichier / dossier | Rôle |
|---|---|
| `index.html` | Page d'accueil (navigation par ancres) |
| `services/` | Trois pages service : site internet, identité visuelle, réseaux sociaux |
| `realisations/` | Trois cas clients : South Conciergerie, General Robotics, Iksee |
| `demos/` | Cinq sites de démonstration par métier, complets et autonomes (CSS et JS en ligne) |
| `mentions-legales.html` · `confidentialite.html` · `cgv.html` | Pages légales |
| `404.html` | Page d'erreur (servie automatiquement par Vercel) |
| `styles.css` | Toute la mise en forme, jetons de design compris |
| `script.js` | Menu, carrousel, FAQ, formulaire |
| `assets/fonts/` | Les deux familles du site auto-hébergées en woff2 |
| `assets/fonts/demos/` | Les polices propres à chaque démo, auto-hébergées elles aussi, plus une feuille par démo |
| `assets/img/` | Visuels en AVIF + WebP + JPEG de repli, trois largeurs |
| `assets/img/demos/` | Les photos de chaque démo, un dossier par métier |
| `favicon.svg` · `apple-touch-icon.png` · `site.webmanifest` | Icônes |
| `robots.txt` · `sitemap.xml` | Référencement |
| `visite-virtuelle-360.html` · `photo-video-drone.html` | Le **pôle image**, deuxième métier |
| `styles-360.css` | Toute la DA du pôle image, isolée |
| `visites/` | Les visites 360 publiées, un dossier autonome par visite |
| `assets/video/maison-*.mp4` | Les extraits de prise de vue aérienne |
| `scripts/importer-visite.py` | Reprend un export du studio 360 et l'allège pour le web |
| `lecteur-360.js` | Lecteur de vidéo 360 en WebGL, et ouverture de la visite en cadre |


## Deux métiers, deux pages d'entrée

Le site a été repositionné : l'accueil est celui d'une **agence visuelle**, pas
d'une agence web.

| Page | Métier | Direction artistique |
|---|---|---|
| `/` | Visite 360, drone, vidéo | Nuit, accent `--bleu`, Space Grotesk seule |
| `/visite-virtuelle-360` · `/photo-video-drone` | Détail du pôle image | idem |
| `/creation-site-internet` | Site vitrine 4 pages à 699 € | Crème, accent orange, Instrument Serif |

**La DA de la vente de site n'est pas touchée** : `creation-site-internet.html`
ne charge même pas `styles-360.css`. Toutes les règles du pôle sont portées par
`.pole-image` ou `.bande-pole`, jamais nues.

`.pole-image` **remappe les jetons de texte** (`--txt`, `--txt-2`, `--txt-3`,
`--accent-txt`, `--bleu-txt`) pour que tout composant hérité du site crème
reste lisible sur fond nuit. Sans ça le nom du fondateur ressortait à 1,07:1.
Si vous réutilisez un bloc crème sur une page sombre, vérifiez le contraste
avant de le laisser passer.

### Ce qui a bougé

Les ancres de l'offre site ont changé de page : `#offre`, `#process`, `#demos`,
`#engagements`, `#faq` et `#realisations` vivent maintenant sur
`/creation-site-internet`. `#agence` et `#contact` sont restés sur l'accueil,
et la page création a son propre bloc contact — un prospect chaud ne doit pas
être renvoyé vers l'accueil visuel pour trouver un formulaire.

## Le pôle image : visite virtuelle 360 et drone

Deuxième métier, sur la même marque. Il a **sa propre direction artistique** —
fond encre plein cadre, accent `--bleu`, Space Grotesk seule sans l'Instrument
Serif — et cette DA vit entièrement dans `styles-360.css`.

**Règle à ne pas casser** : chaque règle de cette feuille est portée soit par
`.pole-image` (posé sur le `<body>` des pages du pôle), soit par `.bande-pole`
(la porte posée sur l'accueil). Rien ne peut donc atteindre la DA des pages de
vente de site, qui reste strictement inchangée. Si vous ajoutez une règle,
préfixez-la.

### Les visites

`visites/appartement-temoin` est la **démonstration publique**. Elle est montée sur
des panoramas **CC0** de [Poly Haven](https://polyhaven.com/license) — domaine
public, usage commercial libre, aucune attribution obligatoire. Cinq positions,
2 Mo, servies en WebP 4096.

Le lecteur (`app.js`, `viewer.js`, `style.css`, `vendor/pannellum.*`) est celui du
studio, repris tel quel. Seules les données changent : `tour.json`, et le même
objet inliné dans `index.html` sous `window.TOUR_DATA`.

#### La règle sur les droits — à ne pas contourner

Deux retraits ont eu lieu, tous deux à la demande du fondateur, et ils fixent la
règle :

1. **La maison du fondateur** servait de visite de démonstration, et sept images du
   site en étaient tirées. Retirée.
2. **Les propriétés de clients** (villas filmées au drone) illustraient l'accueil et
   la page drone. Retirées aussi : filmer pour un client et publier son bien en
   vitrine publique sont deux autorisations différentes.

Ce qui reste sur le site se range donc en trois catégories, et **il faut savoir dans
laquelle on met chaque fichier avant de l'ajouter** :

| Catégorie | Ce qu'on peut en faire | Exemples actuels |
|---|---|---|
| **CC0** | Tout, y compris illustrer | `visites/appartement-temoin`, `pole-360-*` |
| **Ses propres plans sans bien privé identifiable** | Tout, et c'est le seul cas où on peut écrire « en vrai » | `gal-*`, `drone-*`, `mini-360` |
| **Bien d'un tiers** | Rien, sans accord écrit de diffusion publique | — |

Corollaire pour la galerie « Ce que ça donne, en vrai » de l'accueil : elle ne doit
contenir que la deuxième catégorie. Y glisser du CC0 ferait passer une image de
banque pour du travail d'agence.

Les visites de clients arrivent en `noindex`, ce qui est le bon défaut ; ne
l'ouvrir qu'avec un accord écrit.

Pour publier une visite produite par le studio :

```bash
python3 scripts/importer-visite.py <dossier-export> <slug>
```

### La vidéo 360

`lecteur-360.js` projette une vidéo équirectangulaire sur une sphère en WebGL, sans
bibliothèque : videojs-vr et consorts pèsent 200 à 600 Ko et appellent souvent un CDN,
ce qui casserait le « aucun domaine tiers » tenu depuis le début. Rien — ni la vidéo,
ni le contexte graphique — n'existe avant le clic.

Le bloc se règle en HTML, ce qui évite de ré-encoder pour recadrer :

| Attribut | Rôle |
|---|---|
| `data-video` | La vidéo, **strictement équirectangulaire** (rapport 2:1) |
| `data-lacet` · `data-tangage` | Orientation d'ouverture, en degrés |
| `data-champ` | Champ de vision d'ouverture, en degrés (100 par défaut) |
| `data-son` | Garde la piste audio et pose le bouton « couper le son » |

Le visiteur tourne à la souris, au doigt et aux flèches, cadre à la molette, au
pincement ou aux touches `+` / `−`, et met en pause au bouton ou à la barre d'espace.
La barre de commandes est posée en JavaScript et pas dans le HTML : tant que la vidéo
n'est pas lancée, il n'y a rien à commander, donc rien à masquer.

**Piège à connaître** : un export « reframé » de l'app Insta360 sort en 16:9. La sphère
y a été aplatie au montage, elle est perdue, et la vidéo ne peut plus tourner. Il faut
l'export équirectangulaire, reconnaissable à son rapport 2:1 (ici 5760 × 2880).

**Plaques d'immatriculation** : la caméra étant solidaire du véhicule, la plaque occupe
toujours le même rectangle de l'équirectangulaire — un cache fixe suffit, incrusté au
ré-encodage, donc irréversible. Ne jamais publier une vidéo de roulage sans cette
vérification.

Deux points appris en le faisant :

- **Serrer le cache sur la plaque.** Un cache deux fois trop grand donne une grosse
  tache de moyenne, bien plus voyante que la plaque elle-même.
- **Fondre ses bords.** L'alpha est calculé dans le patch (`geq`), il monte de 0 à 1 sur
  30 px depuis chaque bord. Passer par un masque en second flux d'entrée paraît plus
  simple mais désaccorde les cadences : la première tentative a allongé la vidéo de
  deux secondes et perdu 695 images.

### À produire

- **Tarifs** : les deux pages portent un emplacement en commentaire HTML. Rien
  n'a été inventé, les deux annoncent « sur devis » en attendant.
- **Galerie aérienne** : emplacement marqué dans `photo-video-drone.html`. Les 26
  photos de `~/Desktop/DRONE/100_0002` ne conviennent pas — ce sont des parkings.
  Le bon gisement est la carte de la caméra (`/Volumes/Insta360 X5/DCIM/100MEDIA`,
  62 vidéos), dont l'essentiel n'a jamais été copié sur le disque : les plans de
  propriétés y sont, notamment `DJI_0193`, `0210`, `0219`, `0220`, `0232`, `0253`,
  `0254` (intérieurs) et `0267`. **Sauvegarder cette carte** : les trois vidéos du
  site en viennent, et une carte se formate.

### Un sujet par emplacement

Cinq visuels de propriété, **cinq biens différents** : rien ne doit revenir deux
fois d'une page à l'autre, sous peine de donner l'impression qu'on n'a filmé
qu'une seule maison.

| Emplacement | Sujet | Rush |
|---|---|---|
| Hero de `photo-video-drone` | Coteau résidentiel au couchant | `DJI_0010` |
| « Vue du ciel » | Villa au store, en orbite | `DJI_0267` |
| « La maison et son jardin » | Le mas aux arcades | `DJI_0220` |
| « La piscine » | Bassin et cyprès | `DJI_0219` |
| Accueil, section vidéos | Maison en pierre, descente de façade | `DJI_0193` |

Les rushes sont sur la carte de la caméra, pas sur le disque. Avant d'en changer
un, vérifier trois choses sur **toute** la durée du plan retenu : pas de personne
identifiable, pas de plaque lisible, et pas de dérive vers un sujet vide (la
plupart de ces plans finissent sur de la broussaille).

## Système de design

Tout est piloté par des jetons déclarés en tête de `styles.css`. **Ne pas
écrire de valeur en dur** : si un espacement manque, ajouter un cran à
l'échelle plutôt qu'une exception.

- **Espacement** : `--sp-1` … `--sp-11`, échelle de 8 (4 px → 160 px).
- **Typographie** : `--fs-xs` … `--fs-4xl`, ratio 1,25. Trois crans fluides
  seulement, réservés aux titres (`--fs-titre-hero`, `-section`, `-bloc`).
- **Mouvement** : trois durées (`--t-vif`, `--t`, `--t-long`) et deux courbes.
  Pas de quatrième.
- **Largeurs de lecture** : `--mesure` (64 ch) pour la prose,
  `--mesure-etroite` (46 ch), `--mesure-large` (74 ch).
- **Conteneur** : `--page` (1240 px) et `--gouttiere`. Une seule classe
  `.wrap` cadre **toutes** les sections, colorées ou non : le fond va sur la
  `<section>`, le cadrage sur le `.wrap` à l'intérieur. C'est ce qui garantit
  que le bord gauche du contenu ne bouge jamais d'une section à l'autre.
- **Rythme vertical** : `.section`, plus `--majeure`, `--bande`, `--serree`.

### Doctrine de mouvement

Une seule chose bouge à la fois dans le champ de vision. Concrètement : une
seule animation en boucle infinie sur toute la page (le ruban), aucun
`will-change` permanent, et les apparitions au défilement sont pilotées en
CSS par `animation-timeline: view()`, pas de JavaScript, pas de classes
posées à la volée. Si le navigateur ne connaît pas cette propriété, le
contenu est simplement visible d'emblée.

## Développement local

```bash
python3 -m http.server 4173
```

Puis ouvrir http://localhost:4173

## À faire avant la mise en ligne

0. **Le formulaire a un champ `secteur`** (Montpellier / Paris / ailleurs). Il part
   dans le mail et doit être repris par le point d'envoi le jour où il sera branché,
   sinon on perdra l'information qui dit quelle ville traite la demande.
1. **Brancher le formulaire.** Ouvrir `script.js` et renseigner `POINT_ENVOI`
   avec l'URL d'un service de réception (Formspree, Web3Forms, une fonction
   serverless…). Tant que la constante est vide, le formulaire ouvre le
   logiciel de mail, ça fonctionne, mais beaucoup de visiteurs mobiles n'ont
   pas de client mail configuré, donc c'est le premier point à traiter.
2. **Vérifier l'adresse e-mail** `bonjour@lagencedusud.com` (elle apparaît
   dans `script.js`, les pages légales et le pied de page).
3. **Renseigner les réseaux sociaux** dans le pied de page : les liens
   Instagram et LinkedIn pointent aujourd'hui vers les pages d'accueil des
   plateformes.
4. **Ajouter le lien vers la fiche Google Business** et, quand il y aura des
   avis, une section témoignages signés (nom, entreprise, ville, lien vers
   l'avis). Les anciens témoignages anonymes ont été retirés : non attribués,
   ils desservaient la crédibilité.
5. **Ajouter prénoms et photos** dans la section « L'agence ». Elle tient
   debout sans, mais l'argument « vous parlez à ceux qui font » gagne
   beaucoup à être incarné.

## Notes techniques

- **Images** : trois largeurs (480/720/900) en AVIF et WebP, avec un JPEG de
  repli. Pour régénérer après ajout d'un visuel : redimensionner en 900 px de
  large et produire les variantes (`sharp`, `cwebp`/`avifenc`, ou tout autre
  encodeur). Le premier affichage de l'accueil pèse environ 260 Ko.
- **Polices** : auto-hébergées en woff2 avec `unicode-range`, donc le
  navigateur ne télécharge que le sous-ensemble utile. Deux familles de repli
  (`Grotesk repli`, `Serif repli`) sont calées sur les métriques des vraies
  polices via `size-adjust`, ce qui annule le décalage de mise en page au
  chargement. Aucune requête vers un domaine tiers.
- **Carte de France** : tracé dérivé des données ouvertes de l'État français
  (licence ouverte Etalab), projeté en Mercator et simplifié. Les positions
  des villes viennent de leurs coordonnées réelles.
- **Démos** : les cinq sites présentent des entreprises fictives. Ils portent
  `noindex, nofollow`, sont exclus dans `robots.txt` et affichent un bandeau
  permanent le précisant, pour qu'aucun d'eux ne soit jamais pris pour un vrai
  commerce dans les résultats de recherche.
  Chacun est un site complet : hero photo, prestations chiffrées, galerie,
  équipe, avis, questions fréquentes, formulaire et infos pratiques. Chacun a
  sa propre direction artistique, ses propres polices et son animation
  signature (aperçu qui suit le curseur chez le barbier, vitrine qui change au
  survol des plats au bistrot, barre de disponibilités à l'hôtel, vagues
  animées chez le loueur de jet ski, comparateur avant/après chez le
  paysagiste). Les vignettes de la page d'accueil (`assets/img/demo-*`) sont
  des captures réelles de ces pages : les regénérer si une démo change.
- **Photos** : les visuels des démos viennent d'Unsplash (licence Unsplash,
  usage commercial autorisé sans attribution). Les images payantes Unsplash+
  sont filigranées : ne jamais les utiliser.
- **Accessibilité** : lien d'évitement, contrastes AA vérifiés (les couleurs
  de texte sont opaques, pas des alpha empilés), navigation clavier complète,
  et `prefers-reduced-motion` respecté sur toutes les animations.
