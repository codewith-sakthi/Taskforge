"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireMember = exports.requireAdmin = exports.authenticateUser = void 0;
const jwt_js_1 = require("../utils/jwt.js");
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const authenticateUser = async (req, res, next) => {
    try {
        let token;
        // Check Authorization Bearer header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.cookies && req.cookies.token) {
            // Check HTTP-only cookie
            token = req.cookies.token;
        }
        if (!token) {
            res.status(401).json({ message: 'Authentication required. Please log in.' });
            return;
        }
        const decoded = (0, jwt_js_1.verifyToken)(token);
        const user = await prisma_js_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            res.status(401).json({ message: 'User account not found.' });
            return;
        }
        if (user.status === 'INACTIVE') {
            res.status(403).json({ message: 'Your account has been deactivated. Please contact an administrator.' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Session expired or invalid token. Please log in again.' });
    }
};
exports.authenticateUser = authenticateUser;
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireMember = (req, res, next) => {
    if (!req.user || (req.user.role !== 'MEMBER' && req.user.role !== 'ADMIN')) {
        res.status(403).json({ message: 'Access denied. Member privileges required.' });
        return;
    }
    next();
};
exports.requireMember = requireMember;
