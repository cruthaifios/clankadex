"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModels = getModels;
exports.saveModels = saveModels;
exports.getConfig = getConfig;
exports.saveConfig = saveConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR))
        fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DEFAULT_CONFIG = {
    llamaCppPath: '',
    defaultContextSize: 2048,
    defaultGpuLayers: 0,
    serverPort: 8080,
};
function readJson(filename, fallback) {
    ensureDataDir();
    const fp = path.join(DATA_DIR, filename);
    if (!fs.existsSync(fp))
        return fallback;
    try {
        return JSON.parse(fs.readFileSync(fp, 'utf-8'));
    }
    catch {
        return fallback;
    }
}
function writeJson(filename, data) {
    ensureDataDir();
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}
function getModels() {
    return readJson('models.json', []);
}
function saveModels(models) {
    writeJson('models.json', models);
}
function getConfig() {
    return { ...DEFAULT_CONFIG, ...readJson('config.json', {}) };
}
function saveConfig(config) {
    const current = getConfig();
    const updated = { ...current, ...config };
    writeJson('config.json', updated);
    return updated;
}
