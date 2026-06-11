import type { DataResponse, Product } from './types.js';

const DATASET_URL = 'http://localhost:3002/api/search?q=';

interface RawProduct {
    code?: string;
    _id?: string;           // search.openfoodfacts.org utilise _id au lieu de code
    product_name?: string;
    brands?: string;
    countries_tags?: Array<string> | string;
    nutriscore_grade?: string;
    nova_group?: number;
    categories?: string;
    nutriments?: Record<string, number | null>;
}

function normaliserPays(raw: Array<string> | string | undefined): string[] {
    if (!raw) return [];
    const tags = Array.isArray(raw) ? raw : [raw];
    return tags
        .map(t => t.replace(/^[a-z]{2}:/, ''))
        .map(t => t.charAt(0).toUpperCase() + t.slice(1))
        .filter(Boolean);
}

function normaliserProduit(raw: RawProduct): Product {
    return {
        code:             raw.code ?? raw._id ?? '?',
        product_name:     raw.product_name ?? 'Nom inconnu',
        brands:           raw.brands        ?? '—',
        countries:        normaliserPays(raw.countries_tags),
        nutriscore_grade: raw.nutriscore_grade ?? '?',
        nova_group:       raw.nova_group    ?? 0,
        categories:       raw.categories    ?? '—',
        nutriments: {
            'energy-kcal_100g': raw.nutriments?.['energy-kcal_100g'] ?? null,
            sugars_100g:        raw.nutriments?.['sugars_100g']       ?? null,
            fat_100g:           raw.nutriments?.['fat_100g']          ?? null,
            proteins_100g:      raw.nutriments?.['proteins_100g']     ?? null,
            fiber_100g:         raw.nutriments?.['fiber_100g']        ?? null,
        },
    };
}

export async function fetchProducts(nameProduct: string): Promise<DataResponse> {
    const response = await fetch(DATASET_URL + encodeURIComponent(nameProduct));

    if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);

    const json = await response.json();
    // search.openfoodfacts.org retourne { hits: [...] }
    // world.openfoodfacts.org retourne { products: [...] }
    const rawList = (json.hits ?? json.products ?? []) as RawProduct[];
    return {
        products: rawList.map(normaliserProduit),
        count:    json.count ?? rawList.length,
    };
}
