import { fetchProducts, computeStats, toGrade, getCacheSize, isCached, getLastMode } from './api.js';
import type { Grade, RawProduct, Dist, Stats } from './types.js';

const nsColors: Record<Grade, string> = {
    a: '#1D9E75',
    b: '#639922',
    c: '#EF9F27',
    d: '#D85A30',
    e: '#E24B4A',
    '?': '#B4B2A9',
};

function el(id: string): HTMLElement {
    return document.getElementById(id) as HTMLElement;
}

function updateModeIndicator(): void {
    const mode = getLastMode();
    const pill = el('modePill');
    pill.className = `mode-pill ${mode}`;
    pill.textContent = mode === 'online' ? '🟢 online' : '🔴 offline';
}

function updateCacheDisplay(query: string, hit: boolean): void {
    if (hit) {
        el('cacheLabel').textContent = `Cache: hit pour "${query}"`;
    } else {
        const size = getCacheSize();
        el('cacheDot').classList.add('hit');
        el('cacheLabel').textContent = `Cache: ${size} requête${size > 1 ? 's' : ''}`;
    }
}

function renderStats(stats: Stats, query: string): void {
    el('statTotal').textContent = String(stats.total);
    el('statQuery').textContent = `"${query}"`;
    el('statAvg').textContent   = stats.avgScore !== null ? stats.avgScore + ' / 5' : '—';
    el('statGood').textContent  = stats.goodPct  !== null ? stats.goodPct  + ' %'   : '—';
    el('statKcal').textContent  = stats.avgKcal  !== null ? stats.avgKcal  + ' kcal': '—';

    const avgNum = parseFloat(stats.avgScore ?? '');
    const avgEl  = el('statAvg');
    if (!isNaN(avgNum)) {
        if      (avgNum <= 2) avgEl.style.color = '#1D9E75';
        else if (avgNum <= 3) avgEl.style.color = '#EF9F27';
        else                  avgEl.style.color = '#E24B4A';
    }
}

function renderBars(dist: Dist, total: number): void {
    const grades: Grade[] = ['a', 'b', 'c', 'd', 'e', '?'];
    const barClasses: Record<Grade, string> = {
        a: 'bar-a', b: 'bar-b', c: 'bar-c', d: 'bar-d', e: 'bar-e', '?': 'bar-x',
    };

    el('distTotal').textContent = `sur ${total} produits`;
    el('scoreBars').innerHTML = grades.map(g => {
        const count = dist[g];
        const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
        const label = g === '?' ? '?' : g.toUpperCase();
        return `
        <div class="score-row">
          <div class="score-letter" style="background: ${nsColors[g]}">${label}</div>
          <div class="bar-wrap">
            <div class="bar-fill ${barClasses[g]}" style="width: ${pct}%"></div>
          </div>
          <div class="score-count">${count}</div>
          <div class="score-pct">${pct} %</div>
        </div>`;
    }).join('');
}

function renderCalorieList(products: RawProduct[]): void {
    const withKcal = products
        .filter(p => (p.nutriments?.['energy-kcal_100g'] ?? 0) > 0)
        .sort((a, b) =>
            (a.nutriments?.['energy-kcal_100g'] ?? 0) -
            (b.nutriments?.['energy-kcal_100g'] ?? 0)
        )
        .slice(0, 8);

    if (withKcal.length === 0) {
        el('calorieList').innerHTML = '<div class="empty-panel">Aucune donnée calorique disponible.</div>';
        return;
    }

    el('calorieList').innerHTML = withKcal.map((p, i) => {
        const name    = p.product_name ?? 'Inconnu';
        const kcal    = Math.round(p.nutriments?.['energy-kcal_100g'] ?? 0);
        const grade   = toGrade(p.nutriscore_grade ?? '');
        const nsColor = nsColors[grade];
        const nsLabel = grade === '?' ? '?' : grade.toUpperCase();
        return `
        <div class="calorie-item">
          <div class="calorie-rank">${i + 1}</div>
          <div class="calorie-name">${name}</div>
          <div class="calorie-ns" style="background: ${nsColor}">${nsLabel}</div>
          <div class="calorie-val">${kcal} kcal</div>
        </div>`;
    }).join('');
}

async function analyze(): Promise<void> {
    const query = (el('searchInput') as HTMLInputElement).value.trim();
    if (!query) return;

    const spinner = el('spinner');
    spinner.classList.add('visible');

    try {
        const hit      = isCached(query);
        const products = await fetchProducts(query);
        updateCacheDisplay(query, hit);
        if (!hit) updateModeIndicator();

        const stats = computeStats(products);
        renderStats(stats, query);
        renderBars(stats.dist, stats.total);
        renderCalorieList(products);
    } catch {
        el('statQuery').textContent = 'Erreur API';
    }

    spinner.classList.remove('visible');
}

(el('searchBtn') as HTMLButtonElement).addEventListener('click', analyze);
(el('searchInput') as HTMLInputElement).addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') analyze();
});
