# L'Agence du Sud · Agence web à Montpellier

Site vitrine statique de l'agence : offre « site 4 pages à 599 € avec maquette
offerte », réalisations détaillées, pages services, process, FAQ et contact.

Aucune dépendance, aucun build, aucun outil : ce sont des fichiers statiques
qu'un simple serveur HTTP suffit à servir.

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
