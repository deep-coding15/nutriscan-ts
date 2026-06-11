# NutriScan

Exploration progressive de l'API [Open Food Facts](https://world.openfoodfacts.org/) — de JavaScript Vanilla jusqu'à TypeScript avancé.

Chaque niveau est autonome dans son dossier. La stack monte en complexité : Vanilla JS → TypeScript + interfaces → architecture en couches avec cache et serveur Express.

---

## Structure du projet

```
nutriscan-ts/
├── niveau1-scanner/     ← JS Vanilla, dataset local, pas de serveur
├── niveau2-catalogue/   ← TypeScript, filtres, serveur Express (port 3002)
└── niveau3-dashboard/   ← TypeScript avancé, cache, stats, mode offline (port 3003)
```

---

## Niveau 1 — Mini scanner (JS Vanilla)

**Stack :** HTML · CSS (Tailwind CDN) · JavaScript  
**Données :** dataset local `src/dataset.json` (pas d'appel réseau)

Saisie d'un nom de produit → filtrage dans le dataset → affichage des résultats avec Nutri-Score coloré et tableau de nutriments (calories, sucres, graisses, protéines).

```bash
cd niveau1-scanner
# Ouvrir src/index.html directement dans le navigateur
```

---

## Niveau 2 — Catalogue typé

**Stack :** TypeScript · esbuild · Express  
**Serveur :** `http://localhost:3002`

Interfaces TypeScript complètes (`Product`, `Nutriments`, `DataResponse`). Appels fetch typés vers un serveur Express qui proxifie Open Food Facts avec fallback sur le dataset local en cas d'indisponibilité.

```bash
cd niveau2-catalogue
npm install
npm run build    # compile src/ → dist/bundle.js via esbuild
npm start        # lance le serveur Express sur le port 3002
# Ouvrir src/index.html dans le navigateur
```

---

## Niveau 3 — Dashboard qualité

**Stack :** TypeScript · esbuild · Express  
**Serveur :** `http://localhost:3003`

Dashboard d'analyse nutritionnelle avec :

- Distribution des Nutri-Scores sous forme de barres interactives
- Statistiques agrégées : score moyen, % produits bons (A/B), calories moyennes
- Classement des 8 produits les moins caloriques
- Cache en mémoire (`Map<string, RawProduct[]>`) — indicateur de cache hit/miss
- Indicateur de mode online/offline (header `X-Mode` renvoyé par le serveur)

```bash
cd niveau3-dashboard
npm install
npm run build    # compile src/ → dist/bundle.js via esbuild
npm start        # lance le serveur Express sur le port 3003
# Ouvrir src/index.html dans le navigateur
```

---

## API utilisée

```
Recherche : https://world.openfoodfacts.org/cgi/search.pl?search_terms=<query>&json=1
Produit   : https://world.openfoodfacts.org/api/v0/product/<barcode>.json
```

Pas de clé API requise. Les serveurs Express des niveaux 2 et 3 servent de proxy avec fallback offline sur un dataset local.

---

## Prérequis

- Node.js 18+
- npm
