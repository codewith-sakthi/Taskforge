"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getNotifications = void 0;
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const getNotifications = async (req, res, next) => {
    try {
        const user = req.user;
        const notifications = await prisma_js_1.default.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        const unreadCount = await prisma_js_1.default.notification.count({
            where: { userId: user.id, isRead: false },
        });
        res.json({
            notifications,
            unreadCount,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
const markNotificationAsRead = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = req.user;
        const notification = await prisma_js_1.default.notification.findUnique({
            where: { id },
        });
        if (!notification || notification.userId !== user.id) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        const updated = await prisma_js_1.default.notification.update({
            where: { id },
            data: { isRead: true },
        });
        res.json({
            message: 'Notification marked as read',
            notification: updated,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = async (req, res, next) => {
    try {
        const user = req.user;
        await prisma_js_1.default.notification.updateMany({
            where: { userId: user.id, isRead: false },
            data: { isRead: true },
        });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        next(error);
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
