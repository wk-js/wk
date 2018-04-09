"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const function_1 = require("lol/utils/function");
const path_1 = require("path");
const fs_1 = require("./utils/fs");
const fs_2 = require("fs");
const require_content_1 = require("./utils/require-content");
class Importer {
    constructor(context) {
        this.context = context;
        this.paths = [];
        this.extensions = ['', '.js'];
        function_1.bind(this, 'resolve', 'require', 'load');
        if (process.mainModule) {
            this.paths.push(path_1.dirname(process.mainModule.filename));
        }
        this.paths.push(process.cwd());
    }
    api() {
        return {
            resolve: this.resolve,
            require: this.require,
            load: this.load
        };
    }
    resolve(filename) {
        let path = null;
        for (let i = 0, ilen = this.paths.length; i < ilen; i++) {
            for (let j = 0, jlen = this.extensions.length; j < jlen; j++) {
                path = path_1.join(this.paths[i], filename + this.extensions[j]);
                if (fs_1.isFile(path)) {
                    return path;
                }
            }
        }
        throw new Error(`Cannot find module '${filename}'`);
    }
    require(filename) {
        const path = this.resolve(filename);
        const content = fs_2.readFileSync(path_1.relative(process.cwd(), path), 'utf-8');
        const contentExports = require_content_1.requireContent(content, path);
        if (this.paths.indexOf(path_1.dirname(path)) === -1) {
            this.paths.unshift(path_1.dirname(path));
        }
        return contentExports;
    }
    load(filename, asNamespace = false) {
        const contentExports = this.require(filename);
        if (typeof contentExports !== 'function') {
            throw new Error(`Cannot load '${filename}. module.exports is not a Function.'`);
        }
        const api = this.context.api();
        if (asNamespace) {
            let ns_name = path_1.basename(filename).split('.').shift();
            if (ns_name && ns_name.length > 0) {
                this.context.namespace(ns_name, () => {
                    contentExports(api);
                });
            }
            return;
        }
        contentExports(api);
    }
}
exports.Importer = Importer;
