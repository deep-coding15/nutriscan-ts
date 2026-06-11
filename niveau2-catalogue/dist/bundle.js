"use strict";
(() => {
  // src/api.ts
  var DATASET_URL = "http://localhost:3002/api/search?q=";
  function normaliserProduit(raw) {
    return {
      code: raw.code ?? raw._id ?? "?",
      product_name: raw.product_name ?? "Nom inconnu",
      brands: raw.brands ?? "\u2014",
      countries: raw.countries ?? "\u2014",
      nutriscore_grade: raw.nutriscore_grade ?? "?",
      nova_group: raw.nova_group ?? 0,
      categories: raw.categories ?? "\u2014",
      nutriments: {
        "energy-kcal_100g": raw.nutriments?.["energy-kcal_100g"] ?? null,
        sugars_100g: raw.nutriments?.["sugars_100g"] ?? null,
        fat_100g: raw.nutriments?.["fat_100g"] ?? null,
        proteins_100g: raw.nutriments?.["proteins_100g"] ?? null,
        fiber_100g: raw.nutriments?.["fiber_100g"] ?? null
      }
    };
  }
  async function fetchProducts(nameProduct) {
    const response = await fetch(DATASET_URL + encodeURIComponent(nameProduct));
    if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
    const json = await response.json();
    const rawList = json.hits ?? json.products ?? [];
    return {
      products: rawList.map(normaliserProduit),
      count: json.count ?? rawList.length
    };
  }

  // src/script.ts
  var scoreColors = {
    a: "#1D9E75",
    b: "#639922",
    c: "#D4AC0D",
    d: "#E67E22",
    e: "#E24B4A"
  };
  var scoreOrder = { a: 1, b: 2, c: 3, d: 4, e: 5 };
  var btnRechercher = document.getElementById("btn-rechercher");
  var listResultats = document.getElementById("resultats");
  var inputRecherche = document.getElementById("searchValue");
  var selectTri = document.getElementById("tri");
  var filtreBtns = document.querySelectorAll(".filtre-btn");
  var compteur = document.getElementById("compteur");
  var nbProduits = document.getElementById("nbProduits");
  var queryAffichee = document.getElementById("queryAffichee");
  var allProducts = [];
  var filtreActif = "tous";
  function resetFiltres() {
    filtreBtns.forEach((b) => {
      b.style.backgroundColor = "";
      b.style.color = "";
    });
  }
  filtreBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filtreActif = btn.dataset.grade;
      resetFiltres();
      const color = filtreActif === "tous" ? "#6B7280" : scoreColors[filtreActif] ?? "#6B7280";
      btn.style.backgroundColor = color;
      btn.style.color = "white";
      afficherResultats(filtrerEtTrier());
    });
  });
  selectTri.addEventListener("change", () => afficherResultats(filtrerEtTrier()));
  function filtrerEtTrier() {
    let produits = filtreActif === "tous" ? [...allProducts] : allProducts.filter((p) => p.nutriscore_grade === filtreActif);
    const tri = selectTri.value;
    if (tri === "nom") {
      produits.sort((a, b) => a.product_name.localeCompare(b.product_name));
    } else if (tri === "categorie") {
      produits.sort((a, b) => (a.categories ?? "").localeCompare(b.categories ?? ""));
    } else if (tri === "nutriscore") {
      produits.sort(
        (a, b) => (scoreOrder[a.nutriscore_grade] ?? 9) - (scoreOrder[b.nutriscore_grade] ?? 9)
      );
    }
    return produits;
  }
  function compterManquants(p) {
    let n = 0;
    if (p.nutriments["energy-kcal_100g"] === null) n++;
    if (p.nutriments.sugars_100g === null) n++;
    if (p.nutriments.fat_100g === null) n++;
    if (p.nutriments.proteins_100g === null) n++;
    if (!scoreColors[p.nutriscore_grade]) n++;
    return n;
  }
  var novaColors = {
    1: "#1D9E75",
    2: "#639922",
    3: "#E67E22",
    4: "#E24B4A"
  };
  function badgeNutriscore(grade) {
    const color = scoreColors[grade];
    if (!color) return `<div class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-200 text-gray-400 font-bold text-xs" title="Nutri-Score non renseign\xE9">?</div>`;
    return `<div class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white font-bold text-sm" style="background-color:${color};">${grade.toUpperCase()}</div>`;
  }
  function cellNutriment(label, v, unit = "g") {
    const valHtml = v !== null ? `<p class="text-sm font-semibold text-gray-900">${parseFloat(v.toFixed(3))}</p><p class="text-xs text-gray-400">${unit}</p>` : `<p class="text-sm font-semibold text-gray-300">\u2014</p><p class="text-xs text-gray-200">${unit}</p>`;
    return `<div class="p-3 text-center"><p class="text-xs text-gray-400 mb-1">${label}</p>${valHtml}</div>`;
  }
  function texte(val) {
    return !val || val === "\u2014" ? `<span class="text-gray-300">\u2014</span>` : val;
  }
  function novaTag(nova) {
    const color = novaColors[nova];
    if (!color) return `<span class="text-gray-300">\u2014</span>`;
    return `<span class="font-semibold" style="color:${color};">${nova}</span>`;
  }
  function mettreAJourCompteur(nb, query) {
    nbProduits.textContent = String(nb);
    queryAffichee.textContent = `"${query}"`;
    compteur.classList.toggle("hidden", nb === 0 && query === "");
  }
  function afficherEtatInitial() {
    compteur.classList.add("hidden");
    listResultats.innerHTML = `
        <div class="text-center py-12 text-gray-400">
            <p class="text-4xl mb-3">\u{1F50D}</p>
            <p class="text-sm">Saisissez un nom de produit pour commencer.</p>
        </div>
    `;
  }
  function afficherAucunResultat(query) {
    listResultats.innerHTML = `
        <div class="text-center py-12 text-gray-400">
            <p class="text-4xl mb-3">\u{1F615}</p>
            <p class="text-sm">Aucun produit trouv\xE9 pour <strong class="text-gray-700">"${query}"</strong>.</p>
        </div>
    `;
  }
  function afficherResultats(produits) {
    if (produits.length === 0) {
      listResultats.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <p class="text-sm">Aucun produit pour ce filtre.</p>
            </div>
        `;
      return;
    }
    listResultats.innerHTML = produits.map((r) => `
        <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div class="flex items-center gap-4 p-4 border-b border-gray-50">
                <div class="flex-1 min-w-0">
                    <h2 class="text-sm font-semibold text-gray-900 truncate">${r.product_name}</h2>
                    <p class="text-xs text-gray-400">${texte(r.brands)}</p>
                </div>
                ${badgeNutriscore(r.nutriscore_grade)}
            </div>
            <div class="grid grid-cols-4 divide-x divide-gray-100">
                ${cellNutriment("Calories", r.nutriments["energy-kcal_100g"], "kcal")}
                ${cellNutriment("Sucres", r.nutriments.sugars_100g)}
                ${cellNutriment("Graisses", r.nutriments.fat_100g)}
                ${cellNutriment("Prot\xE9ines", r.nutriments.proteins_100g)}
            </div>
            <div class="flex flex-wrap gap-3 px-4 py-2 bg-gray-50 text-xs text-gray-400">
                <span>\u{1F30D} ${texte(r.countries)}</span>
                <span>\u{1F522} <span class="font-mono">${texte(r.code)}</span></span>
                <span>Nova : ${novaTag(r.nova_group)}</span>
            </div>
        </div>
    `).join("");
  }
  afficherEtatInitial();
  btnRechercher.addEventListener("click", async () => {
    const query = inputRecherche.value.trim().toLowerCase();
    if (!query) {
      allProducts = [];
      afficherEtatInitial();
      return;
    }
    if (query.length < 3) {
      listResultats.innerHTML = `
            <div class="text-center py-12 text-amber-400">
                <p class="text-4xl mb-3">\u270F\uFE0F</p>
                <p class="text-sm">Saisissez au moins <strong>3 caract\xE8res</strong> pour lancer la recherche.</p>
            </div>
        `;
      return;
    }
    try {
      const data = await fetchProducts(query);
      allProducts = data.products.filter((r) => r.product_name.toLowerCase().includes(query)).filter((r) => compterManquants(r) <= 2);
      mettreAJourCompteur(allProducts.length, query);
      if (allProducts.length === 0) {
        afficherAucunResultat(query);
      } else {
        afficherResultats(filtrerEtTrier());
      }
    } catch {
      listResultats.innerHTML = `
            <div class="text-center py-12 text-red-400">
                <p class="text-sm">Erreur lors du chargement des donn\xE9es.</p>
            </div>
        `;
    }
  });
})();
