const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = 3003;
const FETCH_TIMEOUT = 3000;

const cache   = new Map();
const CACHE_TTL = 5 * 60 * 1000;

let modeEnLigne = true;

app.use(express.static(path.join(__dirname, '..', 'src')));
app.use('/dist', express.static(path.join(__dirname, '..', 'dist')));

// --- Chargement du dataset offline ---
const datasetPath = path.join(__dirname, 'dataset.json');
let datasetOffline = null;
try {
    datasetOffline = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
    console.log(`[offline] Dataset chargé : ${datasetOffline.products.length} produits`);
} catch (e) {
    console.warn(`[offline] Impossible de charger dataset.json : ${e.message}`);
}

function rechercheOffline(query) {
    if (!datasetOffline) return { products: [], count: 0 };
    const q = query.toLowerCase();
    const produits = datasetOffline.products.filter(
        p => p.product_name.toLowerCase().includes(q)
    );
    return { products: produits, count: produits.length };
}

// --- Route principale ---
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 3) {
        return res.status(400).json({ error: 'Recherche trop courte (minimum 3 caractères)' });
    }

    // Cache (online uniquement)
    const cached = cache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[cache] hit → "${query}"`);
        return res.json(cached.data);
    }

    // Tentative online avec timeout
    const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=50&json=true`;
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        console.log(`[online] → GET "${query}"`);
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'NutriScan/1.0 (learning project)' },
        });
        clearTimeout(timer);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();
        // Normalise hits → products (search.openfoodfacts.org retourne { hits: [] })
        const rawList = json.hits ?? json.products ?? [];
        const data = { products: rawList, count: json.count ?? rawList.length };

        if (!modeEnLigne) {
            modeEnLigne = true;
            console.log('[online] Connexion rétablie — retour en mode online');
        }
        cache.set(query, { data, timestamp: Date.now() });
        console.log(`[online] ← ${response.status} "${query}" (${rawList.length} produits)`);
        res.setHeader('X-Mode', 'online');
        return res.json(data);

    } catch (e) {
        if (modeEnLigne) {
            modeEnLigne = false;
            console.warn(`[offline] Bascule offline — raison : ${e.message}`);
        }
        const data = rechercheOffline(query);
        console.log(`[offline] "${query}" → ${data.count} résultat(s) local(aux)`);
        res.setHeader('X-Mode', 'offline');
        return res.json(data);
    }
});

// --- Endpoint utilitaire : mode actuel ---
app.get('/api/mode', (_req, res) => {
    res.json({ mode: modeEnLigne ? 'online' : 'offline' });
});

app.listen(PORT, () => {
    console.log(`Serveur niveau3 démarré → http://localhost:${PORT}`);
});
