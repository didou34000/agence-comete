# Comète · Agence web à Montpellier

Site vitrine statique de l'agence : offre « site 4 pages à 599 € avec maquette
offerte », réalisations, process, FAQ et contact.

## Contenu

| Fichier / dossier | Rôle |
|---|---|
| `index.html` | Page principale (une seule page, navigation par ancres) |
| `mentions-legales.html` | Mentions légales |
| `styles.css` | Toute la mise en forme |
| `script.js` | Animations, carrousel du hero, FAQ, formulaire |
| `assets/` | Captures des réalisations et des démos (JPEG optimisés) |
| `demos/` | Cinq sites de démonstration par métier |
| `robots.txt`, `sitemap.xml` | Référencement |

Aucune dépendance, aucun build : ce sont des fichiers statiques.
Les polices proviennent de Google Fonts.

## Développement local

```bash
python3 -m http.server 4173
```

Puis ouvrir http://localhost:4173

## À personnaliser avant la mise en ligne

- L'adresse e-mail `bonjour@agence-comete.fr` (encore fictive)
- Le nom de domaine dans les balises SEO (`agence-comete.fr`)
- Les chiffres de la section statistiques et le « + 37 projets » du portfolio
- Le formulaire de contact ouvre le logiciel de mail ; pour un envoi direct,
  brancher un service type Formspree (voir le commentaire dans `script.js`)
