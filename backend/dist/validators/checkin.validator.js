"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInQuerySchema = void 0;
const zod_1 = require("zod");
exports.checkInQuerySchema = zod_1.z.object({
    date: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
});
