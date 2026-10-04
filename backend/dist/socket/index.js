"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToAll = exports.emitToAdmin = exports.emitToUser = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const index_js_1 = require("../config/index.js");
const jwt_js_1 = require("../utils/jwt.js");
let io = null;
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: index_js_1.config.frontendUrl,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        try {
            const decoded = (0, jwt_js_1.verifyToken)(token);
            socket.data.user = decoded;
            next();
        }
        catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.data.user;
        if (user) {
            // Join user specific room
            socket.join(`user:${user.userId}`);
            // If admin, join admin room
            if (user.role === 'ADMIN') {
                socket.join('role:ADMIN');
            }
            else {
                socket.join('role:MEMBER');
            }
        }
        socket.on('disconnect', () => {
            // Disconnected
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};
exports.getIO = getIO;
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
};
exports.emitToUser = emitToUser;
const emitToAdmin = (event, data) => {
    if (io) {
        io.to('role:ADMIN').emit(event, data);
    }
};
exports.emitToAdmin = emitToAdmin;
const emitToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};
exports.emitToAll = emitToAll;
