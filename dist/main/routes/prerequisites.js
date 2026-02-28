"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prerequisitesRouter = void 0;
const express_1 = require("express");
const child_process_1 = require("child_process");
const store_1 = require("../store");
exports.prerequisitesRouter = (0, express_1.Router)();
exports.prerequisitesRouter.get('/check', (_req, res) => {
    const config = (0, store_1.getConfig)();
    const results = {};
    // Check llama-server / llama.cpp
    if (config.llamaCppPath) {
        try {
            (0, child_process_1.execSync)(`"${config.llamaCppPath}" --version`, { timeout: 5000 });
            results.llamaCpp = { found: true, path: config.llamaCppPath };
        }
        catch {
            results.llamaCpp = { found: false, path: config.llamaCppPath };
        }
    }
    else {
        // Try common locations
        const tryPaths = ['llama-server', 'llama-cli', '/usr/local/bin/llama-server'];
        let found = false;
        for (const p of tryPaths) {
            try {
                const out = (0, child_process_1.execSync)(`which ${p}`, { timeout: 3000 }).toString().trim();
                results.llamaCpp = { found: true, path: out };
                found = true;
                break;
            }
            catch { /* continue */ }
        }
        if (!found)
            results.llamaCpp = { found: false };
    }
    res.json(results);
});
