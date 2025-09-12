// Logging utility with different log levels
export class Logger {
    constructor(name = 'Logger') {
        this.name = name;
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        this.currentLevel = this.levels.info;
    }

    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.currentLevel = this.levels[level];
        }
    }

    error(message, ...args) {
        if (this.currentLevel >= this.levels.error) {
            console.error(`[${this.name}] ERROR:`, message, ...args);
        }
    }

    warn(message, ...args) {
        if (this.currentLevel >= this.levels.warn) {
            console.warn(`[${this.name}] WARN:`, message, ...args);
        }
    }

    info(message, ...args) {
        if (this.currentLevel >= this.levels.info) {
            console.info(`[${this.name}] INFO:`, message, ...args);
        }
    }

    debug(message, ...args) {
        if (this.currentLevel >= this.levels.debug) {
            console.debug(`[${this.name}] DEBUG:`, message, ...args);
        }
    }

    log(level, message, ...args) {
        if (this.levels.hasOwnProperty(level)) {
            this[level](message, ...args);
        }
    }
}
