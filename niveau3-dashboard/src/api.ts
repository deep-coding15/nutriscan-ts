import type { Grade, RawProduct, Dist, Stats } from './types.js';

const scoreMap: Record<Grade, number> = { a: 1, b: 2, c: 3, d: 4, e: 5, '?': 0 };
const cache = new Map<string, RawProduct[]>();
let lastMode: 'online' | 'offline' = 'online';

export function getCacheSize(): number { return cache.size; }
export function isCached(query: string): boolean { return cache.has(query); }
export function getLastMode(): 'online' | 'offline' { return lastMode; }

export function toGrade(raw: string): Grade {
    const g = raw.toLowerCase();
    return (g === 'a' || g === 'b' || g === 'c' || g === 'd' || g === 'e') ? g as Grade : '?';
}

export async function fetchProducts(query: string): Promise<RawProduct[]> {
    const cached = cache.get(query);
    if (cached) return cached;
    const url = `http://localhost:3003/api/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    lastMode = res.headers.get('X-Mode') === 'offline' ? 'offline' : 'online';
    const data = await res.json();
    const products: RawProduct[] = (data.products ?? [])
        .filter((p: RawProduct) => toGrade(p.nutriscore_grade ?? '') !== '?');
    cache.set(query, products);
    return products;
}

export function computeStats(products: RawProduct[]): Stats {
    const total = products.length;
    const dist: Dist = { a: 0, b: 0, c: 0, d: 0, e: 0, '?': 0 };
    let scoreSum = 0, scoreCount = 0, kcalSum = 0, kcalCount = 0;

    products.forEach(p => {
        const grade = toGrade(p.nutriscore_grade ?? '');
        dist[grade]++;
        if (grade !== '?') { scoreSum += scoreMap[grade]; scoreCount++; }
        const k = p.nutriments?.['energy-kcal_100g'];
        if (k && k > 0) { kcalSum += k; kcalCount++; }
    });

    return {
        total,
        dist,
        avgScore: scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : null,
        avgKcal:  kcalCount  > 0 ? Math.round(kcalSum / kcalCount)   : null,
        goodPct:  total      > 0 ? Math.round(((dist.a + dist.b) / total) * 100) : null,
    };
}
