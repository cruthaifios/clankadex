"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const SERVER_PORT = Number(process.env.PORT) || 19321;
(0, server_1.startServer)(SERVER_PORT).then(() => {
    console.log(`Clankadex web app running at http://localhost:${SERVER_PORT}`);
});
