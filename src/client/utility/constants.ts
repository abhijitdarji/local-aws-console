let API_BASE_URL: string;
if (import.meta.env.MODE === 'development') {
    API_BASE_URL = `http://localhost:${import.meta.env.VITE_PORT}/api`;
} else {
    API_BASE_URL = '/api';
}

export abstract class Constants {
    static readonly API_URL = API_BASE_URL;
    static readonly APP_NAME = "LocalAWS";
    static readonly APP_VERSION = "1.0.0";
    static readonly PREFERENCES_CACHE_DURATION = 1000 * 60 * 60 * 24 * 7; // 1 week
    static readonly API_CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
}