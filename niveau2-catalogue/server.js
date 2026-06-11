const express = require('express');
const path    = require('path');

const app  = express();
const PORT = 3002;

// Cache en mémoire : query → { data, timestamp }
const cache   = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

app.use(express.static(path.join(__dirname, 'src')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 3) {
        return res.status(400).json({ error: 'Recherche trop courte (minimum 3 caractères)' });
    }

    // Retourne le cache si disponible et récent
    const cached = cache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[proxy] cache hit → "${query}"`);
        return res.json(cached.data);
    }

    const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=10&json=true`;

    try {
        console.log(`[proxy] → GET ${url}`);
        const response = await fetch(url, {
            headers: { 'User-Agent': 'NutriScan/1.0 (learning project)' }
        });
        console.log(`[proxy] ← ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const body = await response.text();
            console.error(`[proxy] corps erreur :`, body.slice(0, 20000));
            throw new Error(`Erreur API : ${response.status}`);
        }

        const data = await response.json();
        cache.set(query, { data, timestamp: Date.now() });
        res.json(data);
        console.log("data: ", data);
    } catch (e) {
        console.error(`[proxy] exception :`, e.message);
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur démarré → http://localhost:${PORT}`);
});
