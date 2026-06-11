import { fetchProducts } from './api.js';
import type { Product } from './types.js';

type Grade = 'a' | 'b' | 'c' | 'd' | 'e' | 'tous';
type Tri   = 'defaut' | 'nom' | 'categorie' | 'nutriscore';

const scoreColors: Record<string, string> = {
    a: '#1D9E75',
    b: '#639922',
    c: '#D4AC0D',
    d: '#E67E22',
    e: '#E24B4A',
};
const scoreOrder: Record<string, number> = { a: 1, b: 2, c: 3, d: 4, e: 5 };

const btnRechercher = document.getElementById('btn-rechercher') as HTMLButtonElement;
const listResultats  = document.getElementById('resultats')     as HTMLDivElement;
const inputRecherche = document.getElementById('searchValue')   as HTMLInputElement;
const selectTri      = document.getElementById('tri')           as HTMLSelectElement;
const filtreBtns     = document.querySelectorAll<HTMLButtonElement>('.filtre-btn');
const compteur       = document.getElementById('compteur')      as HTMLParagraphElement;
const nbProduits     = document.getElementById('nbProduits')    as HTMLSpanElement;
const queryAffichee  = document.getElementById('queryAffichee') as HTMLSpanElement;

let allProducts: Product[] = [];
let filtreActif: Grade     = 'tous';

// --- Filtre ---
function resetFiltres(): void {
    filtreBtns.forEach(b => {
        b.style.backgroundColor = '';
        b.style.color = '';
    });
}

filtreBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        filtreActif = btn.dataset.grade as Grade;
        resetFiltres();
        const color = filtreActif === 'tous' ? '#6B7280' : (scoreColors[filtreActif] ?? '#6B7280');
        btn.style.backgroundColor = color;
        btn.style.color = 'white';
        afficherResultats(filtrerEtTrier());
    });
});

// --- Tri ---
selectTri.addEventListener('change', () => afficherResultats(filtrerEtTrier()));

// --- Logique filtre + tri ---
function filtrerEtTrier(): Product[] {
    let produits = filtreActif === 'tous'
        ? [...allProducts]
        : allProducts.filter(p => p.nutriscore_grade === filtreActif);

    const tri = selectTri.value as Tri;
    if (tri === 'nom') {
        produits.sort((a, b) => a.product_name.localeCompare(b.product_name));
    } else if (tri === 'categorie') {
        produits.sort((a, b) => (a.categories ?? '').localeCompare(b.categories ?? ''));
    } else if (tri === 'nutriscore') {
        produits.sort((a, b) =>
            (scoreOrder[a.nutriscore_grade] ?? 9) - (scoreOrder[b.nutriscore_grade] ?? 9)
        );
    }
    return produits;
}

// --- Qualité des données ---
function compterManquants(p: Product): number {
    let n = 0;
    if (p.nutriments['energy-kcal_100g'] === null) n++;
    if (p.nutriments.sugars_100g          === null) n++;
    if (p.nutriments.fat_100g             === null) n++;
    if (p.nutriments.proteins_100g        === null) n++;
    if (!scoreColors[p.nutriscore_grade])           n++;
    return n;
}

// --- Helpers rendu ---
const novaColors: Record<number, string> = {
    1: '#1D9E75', 2: '#639922', 3: '#E67E22', 4: '#E24B4A',
};

function badgeNutriscore(grade: string): string {
    const color = scoreColors[grade];
    if (!color) return `<div class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-200 text-gray-400 font-bold text-xs" title="Nutri-Score non renseigné">?</div>`;
    return `<div class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white font-bold text-sm" style="background-color:${color};">${grade.toUpperCase()}</div>`;
}

function cellNutriment(label: string, v: number | null, unit: string = 'g'): string {
    const valHtml = v !== null
        ? `<p class="text-sm font-semibold text-gray-900">${parseFloat(v.toFixed(3))}</p><p class="text-xs text-gray-400">${unit}</p>`
        : `<p class="text-sm font-semibold text-gray-300">—</p><p class="text-xs text-gray-200">${unit}</p>`;
    return `<div class="p-3 text-center"><p class="text-xs text-gray-400 mb-1">${label}</p>${valHtml}</div>`;
}

function texte(val: string): string {
    return (!val || val === '—') ? `<span class="text-gray-300">—</span>` : val;
}

function novaTag(nova: number): string {
    const color = novaColors[nova];
    if (!color) return `<span class="text-gray-300">—</span>`;
    return `<span class="font-semibold" style="color:${color};">${nova}</span>`;
}

// --- Rendu ---
function mettreAJourCompteur(nb: number, query: string): void {
    nbProduits.textContent    = String(nb);
    queryAffichee.textContent = `"${query}"`;
    compteur.classList.toggle('hidden', nb === 0 && query === '');
}

function afficherEtatInitial(): void {
    compteur.classList.add('hidden');
    listResultats.innerHTML = `
        <div class="text-center py-12 text-gray-400">
            <p class="text-4xl mb-3">🔍</p>
            <p class="text-sm">Saisissez un nom de produit pour commencer.</p>
        </div>
    `;
}

function afficherAucunResultat(query: string): void {
    listResultats.innerHTML = `
        <div class="text-center py-12 text-gray-400">
            <p class="text-4xl mb-3">😕</p>
            <p class="text-sm">Aucun produit trouvé pour <strong class="text-gray-700">"${query}"</strong>.</p>
        </div>
    `;
}

function afficherResultats(produits: Product[]): void {
    if (produits.length === 0) {
        listResultats.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <p class="text-sm">Aucun produit pour ce filtre.</p>
            </div>
        `;
        return;
    }
    listResultats.innerHTML = produits.map((r: Product) => `
        <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div class="flex items-center gap-4 p-4 border-b border-gray-50">
                <div class="flex-1 min-w-0">
                    <h2 class="text-sm font-semibold text-gray-900 truncate">${r.product_name}</h2>
                    <p class="text-xs text-gray-400">${texte(r.brands)}</p>
                </div>
                ${badgeNutriscore(r.nutriscore_grade)}
            </div>
            <div class="grid grid-cols-4 divide-x divide-gray-100">
                ${cellNutriment('Calories', r.nutriments['energy-kcal_100g'], 'kcal')}
                ${cellNutriment('Sucres',   r.nutriments.sugars_100g)}
                ${cellNutriment('Graisses', r.nutriments.fat_100g)}
                ${cellNutriment('Protéines',r.nutriments.proteins_100g)}
            </div>
            <div class="flex flex-wrap gap-3 px-4 py-2 bg-gray-50 text-xs text-gray-400">
                <span>🌍 ${texte(r.countries)}</span>
                <span>🔢 <span class="font-mono">${texte(r.code)}</span></span>
                <span>Nova : ${novaTag(r.nova_group)}</span>
            </div>
        </div>
    `).join('');
}

afficherEtatInitial();

btnRechercher.addEventListener('click', async (): Promise<void> => {
    const query = inputRecherche.value.trim().toLowerCase();

    if (!query) {
        allProducts = [];
        afficherEtatInitial();
        return;
    }

    if (query.length < 3) {
        listResultats.innerHTML = `
            <div class="text-center py-12 text-amber-400">
                <p class="text-4xl mb-3">✏️</p>
                <p class="text-sm">Saisissez au moins <strong>3 caractères</strong> pour lancer la recherche.</p>
            </div>
        `;
        return;
    }

    try {
        const data = await fetchProducts(query);
        allProducts = data.products
            .filter((r: Product) => r.product_name.toLowerCase().includes(query))
            .filter((r: Product) => compterManquants(r) <= 2);

        mettreAJourCompteur(allProducts.length, query);

        if (allProducts.length === 0) {
            afficherAucunResultat(query);
        } else {
            afficherResultats(filtrerEtTrier());
        }
    } catch {
        listResultats.innerHTML = `
            <div class="text-center py-12 text-red-400">
                <p class="text-sm">Erreur lors du chargement des données.</p>
            </div>
        `;
    }
});
