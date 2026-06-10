const btnRechercher = document.getElementById('btn-rechercher');
const listResultats = document.getElementById('resultats');
const inputRecherche = document.getElementById('searchValue');
let nbProduits = document.getElementById("nbProduits");

const scoreColors = {
    a: '#1D9E75',
    b: '#639922',
    c: '#D4AC0D',
    d: '#E67E22',
    e: '#E24B4A'
};

function afficherEtatInitial() {
    nbProduits.innerText = '0';
    listResultats.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <p class="text-4xl mb-3">🔍</p>
                <p class="text-sm">Saisissez un nom de produit pour commencer.</p>
            </div>
        `;
}

function afficherAucunResultat(query) {
    nbProduits.innerText = '0';
    listResultats.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <p class="text-4xl mb-3">😕</p>
                <p class="text-sm">Aucun produit trouvé pour <strong class="text-gray-700">"${query}"</strong>.</p>
            </div>
        `;
}

function afficherResultats(produits) {
    const liste = produits.map(r => `
            <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div class="flex items-center gap-4 p-4 border-b border-gray-50">
                    <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl flex-shrink-0">🍫</div>
                    <div class="flex-1 min-w-0">
                        <h2 class="text-sm font-semibold text-gray-900 truncate">${r.product_name}</h2>
                        <p class="text-xs text-gray-400">${r.brands}</p>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <div class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white font-bold text-sm"
                             style="background-color: ${scoreColors[r.nutriscore_grade] || '#9CA3AF'};">
                            ${r.nutriscore_grade ? r.nutriscore_grade.toUpperCase() : '?'}
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-4 divide-x divide-gray-100">
                    <div class="p-3 text-center">
                        <p class="text-xs text-gray-400 mb-1">Calories</p>
                        <p class="text-sm font-semibold text-gray-900">${r.nutriments['energy-kcal_100g'] ?? '—'}</p>
                        <p class="text-xs text-gray-400">kcal</p>
                    </div>
                    <div class="p-3 text-center">
                        <p class="text-xs text-gray-400 mb-1">Sucres</p>
                        <p class="text-sm font-semibold text-gray-900">${r.nutriments.sugars_100g ?? '—'} g</p>
                    </div>
                    <div class="p-3 text-center">
                        <p class="text-xs text-gray-400 mb-1">Graisses</p>
                        <p class="text-sm font-semibold text-gray-900">${r.nutriments.fat_100g ?? '—'} g</p>
                    </div>
                    <div class="p-3 text-center">
                        <p class="text-xs text-gray-400 mb-1">Protéines</p>
                        <p class="text-sm font-semibold text-gray-900">${r.nutriments.proteins_100g ?? '—'} g</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-3 px-4 py-2 bg-gray-50 text-xs text-gray-400">
                    <span>🌍 ${r.countries}</span>
                    <span>🔢 <span class="font-mono">${r.code}</span></span>
                    <span>Nova : <span class="font-semibold text-gray-600">${r.nova_group ?? '—'}</span></span>
                </div>
            </div>
        `);
    nbProduits.innerText = liste.length;
    listResultats.innerHTML = liste.join('');
}

// État initial au chargement de la page
afficherEtatInitial();

btnRechercher.addEventListener('click', async () => {
    const query = inputRecherche.value.trim().toLowerCase();

    if (!query) {
        afficherEtatInitial();
        return;
    }

    const reponse = await fetch("./dataset.json");

    // 4. Convertir en JSON
    const data = await reponse.json();
    // 5. Utiliser les données
    console.log(data.products); // tableau de produits

    const produitsTrouves = data.products.filter(r =>
        r.product_name.toLowerCase().includes(query)
    );

    if (produitsTrouves.length === 0) {
        afficherAucunResultat(query);
    } else {
        afficherResultats(produitsTrouves);
    }
});

