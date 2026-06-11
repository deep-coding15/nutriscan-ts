"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProducts = fetchProducts;
const DATASET_URL = './dataset.json';
async function fetchProducts() {
    const response = await fetch(DATASET_URL);
    if (!response.ok)
        throw new Error(`Erreur HTTP : ${response.status}`);
    return response.json();
}
