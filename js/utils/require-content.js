"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const Module = module.constructor;
function requireContent(code, filename, context) {
    const paths = Module._nodeModulePaths(path_1.dirname(filename));
    const parent = module;
    const mod = new Module(filename, parent);
    mod.filename = filename;
    mod.exports = context;
    mod.loaded = true;
    mod.paths = paths;
    mod._compile(code, filename);
    const xports = mod.exports;
    parent.children && parent.children.splice(parent.children.indexOf(mod), 1);
    return xports;
}
exports.requireContent = requireContent;
