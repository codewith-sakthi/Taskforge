"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSameDay = exports.getTodayDateString = void 0;
const getTodayDateString = (date = new Date()) => {
    // Format as YYYY-MM-DD using local/IST timezone default
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
exports.getTodayDateString = getTodayDateString;
const isSameDay = (date1, date2) => {
    return (date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate());
};
exports.isSameDay = isSameDay;
