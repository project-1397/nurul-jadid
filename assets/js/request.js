class DataManager {
    static async setData(key, value, expirationDurationInSeconds = 86400) {
        const expiresAt = new Date(Date.now() + expirationDurationInSeconds * 1000).toISOString();
        const dataEntry = {value, expiresAt};
        localStorage.setItem(key, JSON.stringify(dataEntry));
    }

    static async getData(key) {
        try {
            const entry = JSON.parse(localStorage.getItem(key));
            if (!entry) {
                return null;
            }
            const {value, expiresAt} = entry;
            if (new Date(expiresAt) < new Date()) {
                localStorage.removeItem(key);
                return null;
            }
            return value;
        } catch (err) {
            console.error("Error retrieving data from localStorage: ", err);
            return null;
        }
    }

    static getToken(tokenName) {
        return document.querySelector(`meta[name="${tokenName}"]`)?.getAttribute("content");
    }

    static async fetchWithRetry(url, options = {}, maxRetries = 3, delayMs = 500) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    if (!response.ok && [500, 404, 405, 401, 403].includes(response.status)) {
                        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
                    }
                }
                const responseBackup = response.clone();
                try {
                    return await response.json();
                } catch (jsonError) {
                    const text = await responseBackup.text();
                    throw new Error(`Expected JSON but received: ${text}`);
                }
            } catch (error) {
                console.error(`Fetch error on attempt ${i + 1}: `, error);
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    delayMs *= 2; // Exponential backoff
                } else {
                    throw error;
                }
            }
        }
    }

    static async requestApi(url, {method = "GET", data = null, isFormData = false} = {}) {
        const headers = new Headers();
        if (!isFormData && method !== "GET" && method !== "HEAD") {
            headers.append("Content-Type", "application/json");
            data = JSON.stringify({...data, _token: this.getToken("X-CSRF-TOKEN")});
        } else if (isFormData && method !== "GET") {
            data.append('_token', this.getToken("X-CSRF-TOKEN"));
        } else if (method === "GET") {
            headers.append("Accept", "application/json");
            headers.append("Content-Type", "application/json");
            headers.append("X-CSRF-TOKEN", this.getToken("X-CSRF-TOKEN"));
        }

        const body = (method !== "GET" && method !== "HEAD") ? data : null;
        const requestOptions = {
            method, headers, body, cache: "no-store", mode: "cors"
        };

        return this.fetchWithRetry(url, requestOptions);
    }

    static async fetchData(url, data = {}, method = "GET", isFormData = false) {
        return DataManager.requestApi(url, {method, data, isFormData});
    }

    static async postData(url, data) {
        return this.fetchData(url, data, "POST");
    }

    static async putData(url, data) {
        return this.fetchData(url, data, "POST");
    }

    static async deleteData(url) {
        return this.fetchData(url, {}, "POST");
    }

    static async formData(url, formData, method = "POST") {
        return this.fetchData(url, formData, method, true);
    }

    static async readData(url, params = {}) {
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            url += '?' + queryString;
        }
        return this.fetchData(url, {}, "GET");
    }

    static async executeOperations(url, key, cacheTime = 60, data = {}) {
        const existingData = await this.getData(key);
        if (existingData) {
            return existingData;
        }

        const fetchedData = await this.fetchData(url, data, "GET");
        if (fetchedData) {
            await this.setData(key, fetchedData, cacheTime);
        }
        return fetchedData || null;
    }

    static openLoading() {
        Swal.fire({
            title: 'Mohon tunggu...',
            text: 'Permintaan anda sedang diproses',
            icon: 'info',
            allowEscapeKey: false,
            showConfirmButton: false,
            allowOutsideClick: false,
            backdrop: 'rgba(0,0,30,0.92)',
            didOpen: () => Swal.showLoading()
        });
    }
}
