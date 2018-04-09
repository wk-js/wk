"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function* g() {
    yield 0;
}
exports.GeneratorConstructor = g.constructor;
function isGenerator(value) {
    return value instanceof exports.GeneratorConstructor;
}
exports.isGenerator = isGenerator;
function isGeneratorLike(value) {
    return typeof value === 'object' && 'next' in value && 'throw' in value;
}
exports.isGeneratorLike = isGeneratorLike;
