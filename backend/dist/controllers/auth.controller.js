"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getMe = exports.logout = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const jwt_js_1 = require("../utils/jwt.js");
const auth_validator_js_1 = require("../validators/auth.validator.js");
const activity_js_1 = require("../utils/activity.js");
const login = async (req, res, next) => {
    try {
        const { email, password } = auth_validator_js_1.loginSchema.parse(req.body);
        const user = await prisma_js_1.default.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password.' });
            return;
        }
        if (user.status === 'INACTIVE') {
            res.status(403).json({ message: 'Your account has been deactivated. Please contact an administrator.' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid email or password.' });
            return;
        }
        const token = (0, jwt_js_1.signToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        await (0, activity_js_1.logActivity)({
            userId: user.id,
            action: 'LOGIN',
            description: `${user.name} logged in to the platform`,
        });
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
        };
        res.json({
            message: 'Login successful',
            token,
            user: userResponse,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const logout = async (req, res, next) => {
    try {
        if (req.user) {
            await (0, activity_js_1.logActivity)({
                userId: req.user.id,
                action: 'LOGOUT',
                description: `${req.user.name} logged out`,
            });
        }
        res.clearCookie('token');
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        res.json({
            user: req.user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
const changePassword = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const { currentPassword, newPassword } = auth_validator_js_1.changePasswordSchema.parse(req.body);
        const user = await prisma_js_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            res.status(400).json({ message: 'Current password does not match.' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_js_1.default.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });
        await (0, activity_js_1.logActivity)({
            userId: user.id,
            action: 'PASSWORD_CHANGE',
            description: `${user.name} changed their password`,
        });
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
