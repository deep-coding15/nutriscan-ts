"use strict";
(() => {
  // src/api.ts
  var DATASET_URL = "./dataset.json";
  async function fetchProducts() {
    const response = await fetch(DATASET_URL);
    if (!response.ok)
      throw new Error(`Erreur HTTP : ${response.status}`);
    return response.json();
  }

  // src/script.ts
  var scoreColors = {
    a: "#1D9E75",
    b: "#639922",
    c: "#D4AC0D",
    d: "#E67E22",
    e: "#E24B4A"
  };
  var btnRechercher = document.getElementById("btn-rechercher");
  var listResultats = document.getElementById("resultats");
  var inputRecherche = document.getElementById("searchValue");
  function afficherEtatInitial() {
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
    const liste = produits.map((r) => `
        <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div class="flex items-center gap-4 p-4 border-b border-gray-50">
                <div class="flex-1 min-w-0">
                    <h2 class="text-sm font-semibold text-gray-900 truncate">${r.product_name}</h2>
                    <p class="text-xs text-gray-400">${r.brands}</p>
                </div>
                <div class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white font-bold text-sm"
                     style="background-color: ${scoreColors[r.nutriscore_grade] ?? "#9CA3AF"};">
                    ${r.nutriscore_grade?.toUpperCase() ?? "?"}
                </div>
            </div>
            <div class="grid grid-cols-4 divide-x divide-gray-100">
                <div class="p-3 text-center">
                    <p class="text-xs text-gray-400 mb-1">Calories</p>
                    <p class="text-sm font-semibold text-gray-900">${r.nutriments["energy-kcal_100g"] ?? "\u2014"}</p>
                    <p class="text-xs text-gray-400">kcal</p>
                </div>
                <div class="p-3 text-center">
                    <p class="text-xs text-gray-400 mb-1">Sucres</p>
                    <p class="text-sm font-semibold text-gray-900">${r.nutriments.sugars_100g ?? "\u2014"} g</p>
                </div>
                <div class="p-3 text-center">
                    <p class="text-xs text-gray-400 mb-1">Graisses</p>
                    <p class="text-sm font-semibold text-gray-900">${r.nutriments.fat_100g ?? "\u2014"} g</p>
                </div>
                <div class="p-3 text-center">
                    <p class="text-xs text-gray-400 mb-1">Prot\xE9ines</p>
                    <p class="text-sm font-semibold text-gray-900">${r.nutriments.proteins_100g ?? "\u2014"} g</p>
                </div>
            </div>
            <div class="flex flex-wrap gap-3 px-4 py-2 bg-gray-50 text-xs text-gray-400">
                <span>\u{1F30D} ${r.countries}</span>
                <span>\u{1F522} <span class="font-mono">${r.code}</span></span>
                <span>Nova : <span class="font-semibold text-gray-600">${r.nova_group ?? "\u2014"}</span></span>
            </div>
        </div>
    `);
    listResultats.innerHTML = liste.join("");
  }
  afficherEtatInitial();
  btnRechercher.addEventListener("click", async () => {
    const query = inputRecherche.value.trim().toLowerCase();
    if (!query) {
      afficherEtatInitial();
      return;
    }
    try {
      const data = await fetchProducts();
      const produitsTrouves = data.products.filter(
        (r) => r.product_name.toLowerCase().includes(query)
      );
      if (produitsTrouves.length === 0) {
        afficherAucunResultat(query);
      } else {
        afficherResultats(produitsTrouves);
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
