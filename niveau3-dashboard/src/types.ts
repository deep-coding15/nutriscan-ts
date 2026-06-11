export interface Nutriments {
    'energy-kcal_100g'?: number | null;
    sugars_100g?: number | null;
    fat_100g?: number | null;
    proteins_100g?: number | null;
    fiber_100g?: number | null;
}

export type Grade = 'a' | 'b' | 'c' | 'd' | 'e' | '?';

export interface RawProduct {
    code?: string;
    product_name?: string;
    brands?: string;
    countries?: string;
    nutriscore_grade?: string;
    nova_group?: number;
    categories?: string;
    nutriments?: Nutriments;
}

export interface Dist extends Record<Grade, number> {}

export interface Stats {
    total: number;
    dist: Dist;
    avgScore: string | null;
    avgKcal: number | null;
    goodPct: number | null;
}
