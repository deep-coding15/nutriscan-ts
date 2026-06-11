export interface Nutriment {
    'energy-kcal_100g': number | null;
    sugars_100g: number | null;
    fat_100g: number | null;
    proteins_100g: number | null;
    fiber_100g: number | null;
}

export interface Product {
    code: string;
    product_name: string;
    brands: string;
    countries: string;
    nutriscore_grade: string;
    nova_group: number;
    categories: string;
    nutriments: Nutriment;
}

export interface DataResponse {
    products: Product[];
    count: number;
}
