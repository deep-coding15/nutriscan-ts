# 🥫 NutriScan — Feuille de route projet

> **Nom de repo GitHub suggéré :** `nutriscan-ts`  
> *Court, lisible, typé dans le nom — montre directement la stack.*  
> Alternatives : `food-quality-dashboard` · `openfoodfacts-explorer` · `nutriscore-viewer`

---

## Mon choix pour toi : Open Food Facts API

### Pourquoi cette API ?

C'est la connexion parfaite entre ton projet ML Nutri-Score (XGBoost, classification binaire déjà réalisé à ENSA) et tes compétences frontend à construire. Tu connais déjà la donnée — tu vas maintenant la **visualiser et l'exposer**.

[Open Food Facts](https://publicapis.io/open-food-facts-api) donne accès à une base mondiale de produits alimentaires avec leurs ingrédients, nutriments, allergènes et plus encore — API RESTful, réponses JSON, **pas de clé requise**.

```
Base URL : https://world.openfoodfacts.org/api/v0/product/{barcode}.json
Recherche : https://world.openfoodfacts.org/cgi/search.pl?search_terms=coca&json=1
```

---

## 🎯 Objectifs métier progressifs

### Niveau 1 — JS Vanilla · *Fetch + DOM*

**Mini scanner de produit**

- Saisir un nom de produit → afficher ses infos (nom, marque, Nutri-Score, image)
- Gérer les états : chargement / résultat / erreur / produit introuvable
- 👉 Concepts : `fetch`, `async/await`, manipulation DOM, gestion d'erreurs

---

### Niveau 2 — TypeScript · *Typage + interfaces*

**Catalogue typé avec filtres**

- Typer toute la réponse API avec des `interface` TypeScript (`Product`, `Nutriments`, `NutriScore`…)
- Ajouter un filtre par Nutri-Score (A / B / C / D / E)
- Trier par nom ou par score nutritionnel
- 👉 Concepts : interfaces TS, génériques, `fetch` typé, gestion du `null` / `undefined`

---

### Niveau 3 — TypeScript avancé · *Architecture + qualité*

**Dashboard qualité produit** *(ton terrain naturel)*

- Afficher des stats : % de produits par grade Nutri-Score dans une catégorie
- Mettre en place une architecture en couches : `ApiService` / `ProductModel` / `UIRenderer`
- Gérer un cache local simple (`Map<string, Product>`) pour éviter les appels répétés
- 👉 Concepts : classes TS, séparation des responsabilités, patterns que tu retrouveras dans Angular (services, modèles)

---

### Bonus — Pont vers Angular

Réécrire le niveau 2 ou 3 en Angular une fois que tu le commences — tu auras déjà toute la logique métier, il ne restera qu'à migrer vers les composants et `HttpClient`.

---

## Structure de fichiers suggérée (niveaux 2 et 3)

```
nutriscan-ts/
├── index.html
├── src/
│   ├── types/
│   │   └── product.ts       ← interfaces TypeScript
│   ├── services/
│   │   └── foodApi.ts       ← appels fetch typés
│   ├── utils/
│   │   └── display.ts       ← manipulation DOM
│   └── main.ts              ← point d'entrée
└── tsconfig.json
```

> 💡 Cette architecture `types / services / utils` est exactement celle qu'Angular formalise avec ses composants et services — tu construis les bons réflexes dès maintenant.