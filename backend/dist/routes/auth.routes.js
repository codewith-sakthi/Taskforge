"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Rate limiter for auth endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per IP
    message: { message: 'Too many login attempts, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/login', authLimiter, auth_controller_js_1.login);
router.post('/logout', auth_middleware_js_1.authenticateUser, auth_controller_js_1.logout);
router.get('/me', auth_middleware_js_1.authenticateUser, auth_controller_js_1.getMe);
router.post('/change-password', auth_middleware_js_1.authenticateUser, auth_controller_js_1.changePassword);
exports.default = router;
