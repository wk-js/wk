"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
function isFile(path) {
    try {
        const stat = fs_1.statSync(path);
        if (!stat.isFile())
            throw 'Not a file';
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.isFile = isFile;
