// Configuration module
export class Config {
    constructor() {
        this.settings = new Map();
        this.loadDefaults();
    }

    loadDefaults() {
        this.settings.set('precision', 2);
        this.settings.set('debug', false);
        this.settings.set('logLevel', 'info');
        this.settings.set('maxCalculations', 1000);
    }

    get(key, defaultValue = null) {
        return this.settings.get(key) || defaultValue;
    }

    set(key, value) {
        this.settings.set(key, value);
    }

    has(key) {
        return this.settings.has(key);
    }

    getAll() {
        return Object.fromEntries(this.settings);
    }
}
