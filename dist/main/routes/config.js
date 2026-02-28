"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configRouter = void 0;
const express_1 = require("express");
const store_1 = require("../store");
exports.configRouter = (0, express_1.Router)();
exports.configRouter.get('/', (_req, res) => {
    res.json((0, store_1.getConfig)());
});
exports.configRouter.put('/', (req, res) => {
    const updated = (0, store_1.saveConfig)(req.body);
    res.json(updated);
});
