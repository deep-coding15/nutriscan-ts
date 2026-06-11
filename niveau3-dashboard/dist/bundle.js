"use strict";
(() => {
  // src/api.ts
  var scoreMap = { a: 1, b: 2, c: 3, d: 4, e: 5, "?": 0 };
  var cache = /* @__PURE__ */ new Map();
  var lastMode = "online";
  function getCacheSize() {
    return cache.size;
  }
  function isCached(query) {
    return cache.has(query);
  }
  function getLastMode() {
    return lastMode;
  }
  function toGrade(raw) {
    const g = raw.toLowerCase();
    return g === "a" || g === "b" || g === "c" || g === "d" || g === "e" ? g : "?";
  }
  async function fetchProducts(query) {
    const cached = cache.get(query);
    if (cached) return cached;
    const url = `http://localhost:3003/api/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    lastMode = res.headers.get("X-Mode") === "offline" ? "offline" : "online";
    const data = await res.json();
    const products = (data.products ?? []).filter((p) => toGrade(p.nutriscore_grade ?? "") !== "?");
    cache.set(query, products);
    return products;
  }
  function computeStats(products) {
    const total = products.length;
    const dist = { a: 0, b: 0, c: 0, d: 0, e: 0, "?": 0 };
    let scoreSum = 0, scoreCount = 0, kcalSum = 0, kcalCount = 0;
    products.forEach((p) => {
      const grade = toGrade(p.nutriscore_grade ?? "");
      dist[grade]++;
      if (grade !== "?") {
        scoreSum += scoreMap[grade];
        scoreCount++;
      }
      const k = p.nutriments?.["energy-kcal_100g"];
      if (k && k > 0) {
        kcalSum += k;
        kcalCount++;
      }
    });
    return {
      total,
      dist,
      avgScore: scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : null,
      avgKcal: kcalCount > 0 ? Math.round(kcalSum / kcalCount) : null,
      goodPct: total > 0 ? Math.round((dist.a + dist.b) / total * 100) : null
    };
  }

  // src/script.ts
  var nsColors = {
    a: "#1D9E75",
    b: "#639922",
    c: "#EF9F27",
    d: "#D85A30",
    e: "#E24B4A",
    "?": "#B4B2A9"
  };
  function el(id) {
    return document.getElementById(id);
  }
  function updateModeIndicator() {
    const mode = getLastMode();
    const pill = el("modePill");
    pill.className = `mode-pill ${mode}`;
    pill.textContent = mode === "online" ? "\u{1F7E2} online" : "\u{1F534} offline";
  }
  function updateCacheDisplay(query, hit) {
    if (hit) {
      el("cacheLabel").textContent = `Cache: hit pour "${query}"`;
    } else {
      const size = getCacheSize();
      el("cacheDot").classList.add("hit");
      el("cacheLabel").textContent = `Cache: ${size} requ\xEAte${size > 1 ? "s" : ""}`;
    }
  }
  function renderStats(stats, query) {
    el("statTotal").textContent = String(stats.total);
    el("statQuery").textContent = `"${query}"`;
    el("statAvg").textContent = stats.avgScore !== null ? stats.avgScore + " / 5" : "\u2014";
    el("statGood").textContent = stats.goodPct !== null ? stats.goodPct + " %" : "\u2014";
    el("statKcal").textContent = stats.avgKcal !== null ? stats.avgKcal + " kcal" : "\u2014";
    const avgNum = parseFloat(stats.avgScore ?? "");
    const avgEl = el("statAvg");
    if (!isNaN(avgNum)) {
      if (avgNum <= 2) avgEl.style.color = "#1D9E75";
      else if (avgNum <= 3) avgEl.style.color = "#EF9F27";
      else avgEl.style.color = "#E24B4A";
    }
  }
  function renderBars(dist, total) {
    const grades = ["a", "b", "c", "d", "e", "?"];
    const barClasses = {
      a: "bar-a",
      b: "bar-b",
      c: "bar-c",
      d: "bar-d",
      e: "bar-e",
      "?": "bar-x"
    };
    el("distTotal").textContent = `sur ${total} produits`;
    el("scoreBars").innerHTML = grades.map((g) => {
      const count = dist[g];
      const pct = total > 0 ? Math.round(count / total * 100) : 0;
      const label = g === "?" ? "?" : g.toUpperCase();
      return `
        <div class="score-row">
          <div class="score-letter" style="background: ${nsColors[g]}">${label}</div>
          <div class="bar-wrap">
            <div class="bar-fill ${barClasses[g]}" style="width: ${pct}%"></div>
          </div>
          <div class="score-count">${count}</div>
          <div class="score-pct">${pct} %</div>
        </div>`;
    }).join("");
  }
  function renderCalorieList(products) {
    const withKcal = products.filter((p) => (p.nutriments?.["energy-kcal_100g"] ?? 0) > 0).sort(
      (a, b) => (a.nutriments?.["energy-kcal_100g"] ?? 0) - (b.nutriments?.["energy-kcal_100g"] ?? 0)
    ).slice(0, 8);
    if (withKcal.length === 0) {
      el("calorieList").innerHTML = '<div class="empty-panel">Aucune donn\xE9e calorique disponible.</div>';
      return;
    }
    el("calorieList").innerHTML = withKcal.map((p, i) => {
      const name = p.product_name ?? "Inconnu";
      const kcal = Math.round(p.nutriments?.["energy-kcal_100g"] ?? 0);
      const grade = toGrade(p.nutriscore_grade ?? "");
      const nsColor = nsColors[grade];
      const nsLabel = grade === "?" ? "?" : grade.toUpperCase();
      return `
        <div class="calorie-item">
          <div class="calorie-rank">${i + 1}</div>
          <div class="calorie-name">${name}</div>
          <div class="calorie-ns" style="background: ${nsColor}">${nsLabel}</div>
          <div class="calorie-val">${kcal} kcal</div>
        </div>`;
    }).join("");
  }
  async function analyze() {
    const query = el("searchInput").value.trim();
    if (!query) return;
    const spinner = el("spinner");
    spinner.classList.add("visible");
    try {
      const hit = isCached(query);
      const products = await fetchProducts(query);
      updateCacheDisplay(query, hit);
      if (!hit) updateModeIndicator();
      const stats = computeStats(products);
      renderStats(stats, query);
      renderBars(stats.dist, stats.total);
      renderCalorieList(products);
    } catch {
      el("statQuery").textContent = "Erreur API";
    }
    spinner.classList.remove("visible");
  }
  el("searchBtn").addEventListener("click", analyze);
  el("searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") analyze();
  });
})();
