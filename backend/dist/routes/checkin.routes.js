"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const checkin_controller_js_1 = require("../controllers/checkin.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticateUser);
// Member routes
router.post('/check-in', checkin_controller_js_1.checkIn);
router.post('/check-out', checkin_controller_js_1.checkOut);
router.get('/my', checkin_controller_js_1.getMyTodayCheckIn);
// Admin route
router.get('/', auth_middleware_js_1.requireAdmin, checkin_controller_js_1.getAllCheckIns);
exports.default = router;
