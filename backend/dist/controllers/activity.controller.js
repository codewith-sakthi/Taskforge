"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityLogs = void 0;
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const getActivityLogs = async (req, res, next) => {
    try {
        const { userId, action, search, page = '1', limit = '20' } = req.query;
        const user = req.user;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        // Non-admin can only see their own activities
        if (user.role !== 'ADMIN') {
            where.userId = user.id;
        }
        else if (userId && typeof userId === 'string') {
            where.userId = userId;
        }
        if (action && typeof action === 'string') {
            where.action = action;
        }
        if (search && typeof search === 'string') {
            where.OR = [
                { description: { contains: search } },
                { action: { contains: search } },
            ];
        }
        const [total, activities] = await Promise.all([
            prisma_js_1.default.activityLog.count({ where }),
            prisma_js_1.default.activityLog.findMany({
                where,
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
        ]);
        res.json({
            activities,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getActivityLogs = getActivityLogs;
