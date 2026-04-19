import { CONFIG } from "./BASE_URL.js";

export class ApiService {
    static async call(endpoint, method = 'GET', data = null) {
        const token = localStorage.getItem('access_token');
        const headers = {};

        if (token && token !== "null" && token !== "undefined") {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = { method, headers };

        if (data) {
            if (data instanceof FormData) {
                options.body = data;
            } else {
                headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            }
        }

        try {
            const res = await fetch(`${CONFIG.API_URL}${endpoint}`, options);

            if (res.status === 401) {
                const token = localStorage.getItem('access_token');

                if (!token || token === "null") {
                    localStorage.removeItem('access_token');
                    window.location.href = '/frontend/web/html/admin_login.html';
                    return;
                }

                console.warn("401 received but token exists");
            }

            return await res.json();
        } catch (error) {
            console.error("Connection to Server API failed:", error);
            throw error;
        }

    }
}