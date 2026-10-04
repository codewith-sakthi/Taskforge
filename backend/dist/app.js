"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const index_js_1 = require("./config/index.js");
const index_js_2 = __importDefault(require("./routes/index.js"));
const errorHandler_middleware_js_1 = require("./middleware/errorHandler.middleware.js");
const app = (0, express_1.default)();
// Security headers
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: [index_js_1.config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Request logging in development
if (index_js_1.config.nodeEnv === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'TeamPulse API' });
});
// Main API routes
app.use('/api', index_js_2.default);
// Global 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: `API endpoint ${req.originalUrl} not found` });
});
// Centralized error handler
app.use(errorHandler_middleware_js_1.errorHandler);
exports.default = app;
