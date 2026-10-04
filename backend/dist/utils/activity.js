"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.logActivity = void 0;
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const index_js_1 = require("../socket/index.js");
const logActivity = async ({ userId, action, description }) => {
    try {
        const activity = await prisma_js_1.default.activityLog.create({
            data: {
                userId: userId || null,
                action,
                description,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        // Real-time broadcast
        (0, index_js_1.emitToAll)('activity:new', activity);
        return activity;
    }
    catch (error) {
        console.error('Failed to record activity log:', error);
    }
};
exports.logActivity = logActivity;
const createNotification = async ({ userId, title, message }) => {
    try {
        const notification = await prisma_js_1.default.notification.create({
            data: {
                userId,
                title,
                message,
            },
        });
        // Send real-time notification to the user
        (0, index_js_1.emitToUser)(userId, 'notification:new', notification);
        return notification;
    }
    catch (error) {
        console.error('Failed to create notification:', error);
    }
};
exports.createNotification = createNotification;
