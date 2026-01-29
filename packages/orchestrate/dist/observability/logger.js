"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
exports.getLogger = getLogger;
const logger_config_1 = require("./logger-config");
class Logger {
    constructor(name) {
        this.name = name;
    }
    debug(message, meta) {
        logger_config_1.winstonLogger.debug(`[${this.name}] ${message}`, meta);
    }
    info(message, meta) {
        logger_config_1.winstonLogger.info(`[${this.name}] ${message}`, meta);
    }
    warn(message, meta) {
        logger_config_1.winstonLogger.warn(`[${this.name}] ${message}`, meta);
    }
    error(message, meta) {
        logger_config_1.winstonLogger.error(`[${this.name}] ${message}`, meta);
    }
    // Add HTTP logging level for requests
    http(message, meta) {
        logger_config_1.winstonLogger.log('http', `[${this.name}] ${message}`, meta);
    }
}
exports.Logger = Logger;
const registry = {};
function getLogger(name) {
    if (!registry[name]) {
        registry[name] = new Logger(name);
    }
    return registry[name];
}
