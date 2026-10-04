"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_controller_js_1 = require("../controllers/activity.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticateUser);
router.get('/', activity_controller_js_1.getActivityLogs);
exports.default = router;
