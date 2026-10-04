"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_js_1 = __importDefault(require("./app.js"));
const index_js_1 = require("./config/index.js");
const index_js_2 = require("./socket/index.js");
const httpServer = (0, http_1.createServer)(app_js_1.default);
// Initialize Socket.IO with HTTP Server
(0, index_js_2.initSocket)(httpServer);
const PORT = index_js_1.config.port;
httpServer.listen(PORT, () => {
    console.log(`🚀 TeamPulse Backend API running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO server listening on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${index_js_1.config.nodeEnv}`);
});
