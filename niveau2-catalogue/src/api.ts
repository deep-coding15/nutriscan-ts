import type { DataResponse } from './types.js';

const DATASET_URL = './dataset.json';

export async function fetchProducts(): Promise<DataResponse> {
    const response = await fetch(DATASET_URL);

    if (!response.ok)
        throw new Error(`Erreur HTTP : ${response.status}`);

    return response.json() as Promise<DataResponse>;
}
