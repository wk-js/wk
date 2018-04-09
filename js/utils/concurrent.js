"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const when_1 = __importDefault(require("when"));
const guard_1 = __importDefault(require("when/guard"));
const parallel_1 = __importDefault(require("when/parallel"));
function parallel(tasks, guard_count) {
    const guardTask = guard_1.default.bind(null, guard_1.default.n(guard_count));
    const guardedTasks = tasks.map(guardTask);
    return parallel_1.default(guardedTasks);
}
exports.parallel = parallel;
function map(array, guard_count, mapFn) {
    const guardedMapFn = guard_1.default(guard_1.default.n(guard_count), mapFn);
    return when_1.default.map(array, guardedMapFn);
}
exports.map = map;
