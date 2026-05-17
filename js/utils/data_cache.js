import { ApiService }  from '../api/api_service.js';
import { fetchToast } from './fetch_toast.js';

export class DataCache {
    constructor() {
        this._cache    = {};
        this._inflight = {};
    }

    async fetch(endpoint, ttlMs = 29_000) {
        const now = Date.now();
        const hit = this._cache[endpoint];

        // Return fresh cache — no toast needed
        if (hit && (now - hit.ts) < ttlMs) return hit.data;

        // Reuse in-flight request — toast already showing
        if (this._inflight[endpoint]) return this._inflight[endpoint];

        // New network request — show the toast
        fetchToast.show();

        this._inflight[endpoint] = ApiService.call(endpoint, 'GET')
            .then(data => {
                this._cache[endpoint] = { data, ts: Date.now() };
                delete this._inflight[endpoint];
                fetchToast.hide();
                return data;
            })
            .catch(err => {
                delete this._inflight[endpoint];
                fetchToast.hide();
                throw err;
            });

        return this._inflight[endpoint];
    }

    invalidate(...endpoints) {
        endpoints.forEach(ep => {
            delete this._cache[ep];
            delete this._inflight[ep];
        });
    }

    invalidateAll() {
        this._cache    = {};
        this._inflight = {};
    }
}

export const cache = new DataCache();