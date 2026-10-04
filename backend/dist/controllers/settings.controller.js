"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const activity_js_1 = require("../utils/activity.js");
const getSettings = async (req, res, next) => {
    try {
        const settings = await prisma_js_1.default.systemSetting.findMany();
        const settingsMap = {
            teamName: 'TeamPulse Core Team',
            checkInThresholdHours: '8',
            emailNotifications: 'true',
            timezone: 'Asia/Kolkata',
        };
        settings.forEach((s) => {
            settingsMap[s.key] = s.value;
        });
        res.json({ settings: settingsMap });
    }
    catch (error) {
        next(error);
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res, next) => {
    try {
        const { teamName, checkInThresholdHours, emailNotifications, timezone } = req.body;
        const entries = Object.entries({ teamName, checkInThresholdHours, emailNotifications, timezone });
        for (const [key, value] of entries) {
            if (value !== undefined) {
                await prisma_js_1.default.systemSetting.upsert({
                    where: { key },
                    update: { value: String(value) },
                    create: { key, value: String(value) },
                });
            }
        }
        await (0, activity_js_1.logActivity)({
            userId: req.user?.id,
            action: 'SETTINGS_UPDATED',
            description: `Admin updated organization system settings`,
        });
        res.json({ message: 'Settings updated successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSettings = updateSettings;
