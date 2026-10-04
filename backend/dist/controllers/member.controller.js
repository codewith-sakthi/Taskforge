"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.resetMemberPassword = exports.toggleMemberStatus = exports.updateMember = exports.createMember = exports.getMemberById = exports.getMembers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const member_validator_js_1 = require("../validators/member.validator.js");
const activity_js_1 = require("../utils/activity.js");
const date_js_1 = require("../utils/date.js");
const index_js_1 = require("../socket/index.js");
const getMembers = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        const todayStr = (0, date_js_1.getTodayDateString)();
        const where = {
            role: 'MEMBER',
        };
        if (status && (status === 'ACTIVE' || status === 'INACTIVE')) {
            where.status = status;
        }
        if (search && typeof search === 'string') {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
            ];
        }
        const members = await prisma_js_1.default.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                tasksAssigned: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        progress: true,
                        priority: true,
                        dueDate: true,
                        updatedAt: true,
                    },
                    orderBy: { updatedAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const formattedMembers = members.map((member) => {
            const total = member.tasksAssigned.length;
            const completed = member.tasksAssigned.filter((t) => t.status === 'COMPLETED').length;
            const inProgress = member.tasksAssigned.filter((t) => t.status === 'IN_PROGRESS').length;
            const overdue = member.tasksAssigned.filter((t) => t.status !== 'COMPLETED' && new Date(t.dueDate) < new Date()).length;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
            const activeTask = member.tasksAssigned.find((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING') || null;
            const lastCompleted = member.tasksAssigned.find((t) => t.status === 'COMPLETED') || null;
            return {
                id: member.id,
                name: member.name,
                email: member.email,
                phone: member.phone,
                role: member.role,
                status: member.status,
                createdAt: member.createdAt,
                totalTasks: total,
                completedTasks: completed,
                inProgressTasks: inProgress,
                overdueTasks: overdue,
                completionRate,
                currentTask: activeTask ? activeTask.title : null,
                currentTaskId: activeTask ? activeTask.id : null,
                taskProgress: activeTask ? activeTask.progress : (completed > 0 ? 100 : 0),
                lastCompletedTask: lastCompleted ? lastCompleted.title : null,
                lastCompletedAt: lastCompleted ? lastCompleted.updatedAt : null,
            };
        });
        res.json({ members: formattedMembers });
    }
    catch (error) {
        next(error);
    }
};
exports.getMembers = getMembers;
const getMemberById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const member = await prisma_js_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                tasksAssigned: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        priority: true,
                        category: true,
                        status: true,
                        progress: true,
                        startDate: true,
                        dueDate: true,
                        createdAt: true,
                        updatedAt: true,
                        updates: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
        });
        if (!member) {
            res.status(404).json({ message: 'Team member not found' });
            return;
        }
        const total = member.tasksAssigned.length;
        const completed = member.tasksAssigned.filter((t) => t.status === 'COMPLETED').length;
        const inProgress = member.tasksAssigned.filter((t) => t.status === 'IN_PROGRESS').length;
        const overdue = member.tasksAssigned.filter((t) => t.status !== 'COMPLETED' && new Date(t.dueDate) < new Date()).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        res.json({
            member: {
                ...member,
                totalTasks: total,
                completedTasks: completed,
                inProgressTasks: inProgress,
                overdueTasks: overdue,
                completionRate,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMemberById = getMemberById;
const createMember = async (req, res, next) => {
    try {
        const { name, email, phone, password } = member_validator_js_1.createMemberSchema.parse(req.body);
        const existingUser = await prisma_js_1.default.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            res.status(409).json({ message: 'A team member with this email already exists.' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const member = await prisma_js_1.default.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                phone: phone || null,
                passwordHash,
                role: 'MEMBER',
                status: 'ACTIVE',
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
        await (0, activity_js_1.logActivity)({
            userId: req.user?.id,
            action: 'MEMBER_CREATED',
            description: `Admin created team member ${member.name} (${member.email})`,
        });
        (0, index_js_1.emitToAdmin)('member:created', member);
        res.status(201).json({
            message: 'Team member created successfully',
            member,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createMember = createMember;
const updateMember = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, email, phone, status } = member_validator_js_1.updateMemberSchema.parse(req.body);
        const existingMember = await prisma_js_1.default.user.findUnique({
            where: { id },
        });
        if (!existingMember) {
            res.status(404).json({ message: 'Team member not found' });
            return;
        }
        if (email && email.toLowerCase() !== existingMember.email) {
            const emailTaken = await prisma_js_1.default.user.findUnique({
                where: { email: email.toLowerCase() },
            });
            if (emailTaken) {
                res.status(409).json({ message: 'Email is already in use by another user' });
                return;
            }
        }
        const updated = await prisma_js_1.default.user.update({
            where: { id },
            data: {
                name: name !== undefined ? name : existingMember.name,
                email: email !== undefined ? email.toLowerCase() : existingMember.email,
                phone: phone !== undefined ? phone : existingMember.phone,
                status: status !== undefined ? status : existingMember.status,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                updatedAt: true,
            },
        });
        await (0, activity_js_1.logActivity)({
            userId: req.user?.id,
            action: 'MEMBER_UPDATED',
            description: `Admin updated details for ${updated.name}`,
        });
        (0, index_js_1.emitToAdmin)('member:updated', updated);
        (0, index_js_1.emitToUser)(id, 'profile:updated', updated);
        res.json({
            message: 'Team member updated successfully',
            member: updated,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMember = updateMember;
const toggleMemberStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        if (!status || (status !== 'ACTIVE' && status !== 'INACTIVE')) {
            res.status(400).json({ message: 'Valid status (ACTIVE or INACTIVE) is required' });
            return;
        }
        const member = await prisma_js_1.default.user.findUnique({
            where: { id },
        });
        if (!member) {
            res.status(404).json({ message: 'Team member not found' });
            return;
        }
        const updated = await prisma_js_1.default.user.update({
            where: { id },
            data: { status },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
            },
        });
        const action = status === 'INACTIVE' ? 'MEMBER_DEACTIVATED' : 'MEMBER_ACTIVATED';
        const actionDesc = status === 'INACTIVE' ? 'deactivated' : 'activated';
        await (0, activity_js_1.logActivity)({
            userId: req.user?.id,
            action,
            description: `Admin ${actionDesc} team member ${updated.name}`,
        });
        (0, index_js_1.emitToAdmin)('member:status_changed', updated);
        (0, index_js_1.emitToUser)(id, 'auth:status_changed', { status });
        res.json({
            message: `Team member ${actionDesc} successfully`,
            member: updated,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleMemberStatus = toggleMemberStatus;
const resetMemberPassword = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { newPassword } = member_validator_js_1.resetPasswordSchema.parse(req.body);
        const member = await prisma_js_1.default.user.findUnique({
            where: { id },
        });
        if (!member) {
            res.status(404).json({ message: 'Team member not found' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_js_1.default.user.update({
            where: { id },
            data: { passwordHash },
        });
        await (0, activity_js_1.logActivity)({
            userId: req.user?.id,
            action: 'PASSWORD_RESET',
            description: `Admin reset password for ${member.name}`,
        });
        await (0, activity_js_1.createNotification)({
            userId: member.id,
            title: 'Password Reset',
            message: 'Your account password has been reset by the administrator.',
        });
        res.json({ message: `Password reset successfully for ${member.name}` });
    }
    catch (error) {
        next(error);
    }
};
exports.resetMemberPassword = resetMemberPassword;
const updateProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const { name, phone } = member_validator_js_1.updateProfileSchema.parse(req.body);
        const updated = await prisma_js_1.default.user.update({
            where: { id: req.user.id },
            data: {
                name: name || req.user.name,
                phone: phone !== undefined ? phone : req.user.phone,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
            },
        });
        await (0, activity_js_1.logActivity)({
            userId: req.user.id,
            action: 'PROFILE_UPDATED',
            description: `${updated.name} updated their profile info`,
        });
        res.json({
            message: 'Profile updated successfully',
            user: updated,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
