"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCheckIns = exports.getMyTodayCheckIn = exports.checkOut = exports.checkIn = void 0;
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const date_js_1 = require("../utils/date.js");
const activity_js_1 = require("../utils/activity.js");
const index_js_1 = require("../socket/index.js");
const checkIn = async (req, res, next) => {
    try {
        const user = req.user;
        const todayStr = (0, date_js_1.getTodayDateString)();
        const now = new Date();
        // Check if there is already a check-in for today
        const existingCheckIn = await prisma_js_1.default.checkIn.findFirst({
            where: {
                userId: user.id,
                date: todayStr,
            },
        });
        if (existingCheckIn) {
            if (existingCheckIn.status === 'ACTIVE' && !existingCheckIn.checkOutTime) {
                res.status(400).json({ message: 'You are already checked in for today.' });
                return;
            }
            if (existingCheckIn.status === 'COMPLETED' || existingCheckIn.checkOutTime) {
                res.status(400).json({ message: 'You have already completed your check-in and check-out for today.' });
                return;
            }
        }
        const checkInRecord = await prisma_js_1.default.checkIn.create({
            data: {
                userId: user.id,
                date: todayStr,
                checkInTime: now,
                status: 'ACTIVE',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        await (0, activity_js_1.logActivity)({
            userId: user.id,
            action: 'MEMBER_CHECKED_IN',
            description: `${user.name} checked in for work today at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
        });
        (0, index_js_1.emitToAdmin)('checkin:new', checkInRecord);
        (0, index_js_1.emitToUser)(user.id, 'checkin:status_changed', checkInRecord);
        res.status(201).json({
            message: 'Checked in successfully',
            checkIn: checkInRecord,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.checkIn = checkIn;
const checkOut = async (req, res, next) => {
    try {
        const user = req.user;
        const todayStr = (0, date_js_1.getTodayDateString)();
        const now = new Date();
        const existingCheckIn = await prisma_js_1.default.checkIn.findFirst({
            where: {
                userId: user.id,
                date: todayStr,
            },
        });
        if (!existingCheckIn) {
            res.status(400).json({ message: 'You cannot check out before checking in for today.' });
            return;
        }
        if (existingCheckIn.checkOutTime || existingCheckIn.status === 'COMPLETED') {
            res.status(400).json({ message: 'You have already checked out for today.' });
            return;
        }
        const updatedCheckIn = await prisma_js_1.default.checkIn.update({
            where: { id: existingCheckIn.id },
            data: {
                checkOutTime: now,
                status: 'COMPLETED',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        await (0, activity_js_1.logActivity)({
            userId: user.id,
            action: 'MEMBER_CHECKED_OUT',
            description: `${user.name} checked out at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
        });
        (0, index_js_1.emitToAdmin)('checkout:new', updatedCheckIn);
        (0, index_js_1.emitToUser)(user.id, 'checkin:status_changed', updatedCheckIn);
        res.json({
            message: 'Checked out successfully',
            checkIn: updatedCheckIn,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.checkOut = checkOut;
const getMyTodayCheckIn = async (req, res, next) => {
    try {
        const user = req.user;
        const todayStr = (0, date_js_1.getTodayDateString)();
        const todayCheckIn = await prisma_js_1.default.checkIn.findFirst({
            where: {
                userId: user.id,
                date: todayStr,
            },
        });
        // Recent 10 checkins for user
        const history = await prisma_js_1.default.checkIn.findMany({
            where: { userId: user.id },
            orderBy: { checkInTime: 'desc' },
            take: 10,
        });
        let currentStatus = 'NOT CHECKED IN';
        if (todayCheckIn) {
            currentStatus = todayCheckIn.checkOutTime ? 'COMPLETED' : 'ACTIVE';
        }
        res.json({
            todayCheckIn,
            currentStatus,
            history,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyTodayCheckIn = getMyTodayCheckIn;
const getAllCheckIns = async (req, res, next) => {
    try {
        const { date, userId, status, page = '1', limit = '20', search } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (date && typeof date === 'string') {
            where.date = date;
        }
        if (userId && typeof userId === 'string') {
            where.userId = userId;
        }
        if (status && typeof status === 'string') {
            where.status = status;
        }
        if (search && typeof search === 'string') {
            where.user = {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                ],
            };
        }
        const [total, checkIns] = await Promise.all([
            prisma_js_1.default.checkIn.count({ where }),
            prisma_js_1.default.checkIn.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            status: true,
                        },
                    },
                },
                orderBy: { checkInTime: 'desc' },
                skip,
                take: limitNum,
            }),
        ]);
        // Calculate duration for each record
        const formattedCheckIns = checkIns.map((ci) => {
            let durationMinutes = null;
            if (ci.checkInTime && ci.checkOutTime) {
                const diffMs = new Date(ci.checkOutTime).getTime() - new Date(ci.checkInTime).getTime();
                durationMinutes = Math.round(diffMs / (1000 * 60));
            }
            return {
                ...ci,
                durationMinutes,
            };
        });
        res.json({
            checkIns: formattedCheckIns,
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
exports.getAllCheckIns = getAllCheckIns;
