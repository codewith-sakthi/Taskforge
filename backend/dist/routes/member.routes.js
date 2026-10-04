"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const member_controller_js_1 = require("../controllers/member.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// All member routes require authentication
router.use(auth_middleware_js_1.authenticateUser);
// Member self profile update
router.put('/profile', member_controller_js_1.updateProfile);
// Admin only routes
router.get('/', auth_middleware_js_1.requireAdmin, member_controller_js_1.getMembers);
router.post('/', auth_middleware_js_1.requireAdmin, member_controller_js_1.createMember);
router.get('/:id', auth_middleware_js_1.requireAdmin, member_controller_js_1.getMemberById);
router.put('/:id', auth_middleware_js_1.requireAdmin, member_controller_js_1.updateMember);
router.patch('/:id/status', auth_middleware_js_1.requireAdmin, member_controller_js_1.toggleMemberStatus);
router.post('/:id/reset-password', auth_middleware_js_1.requireAdmin, member_controller_js_1.resetMemberPassword);
exports.default = router;
