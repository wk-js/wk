"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const namespace_1 = require("./namespace");
const task_1 = require("./task");
const task_runner_1 = require("./task-runner");
const function_1 = require("lol/utils/function");
const importer_1 = require("./importer");
const crypto_1 = require("crypto");
class Context {
    constructor(name) {
        this.name = name;
        this.Tasks = {};
        this.stores = {};
        function_1.bind(this, 'task', 'namespace', 'store', 'infos');
        if (!this.name) {
            this.name = crypto_1.createHash('md5').update(Date.now() + '').digest('hex');
        }
        Context.contexts[this.name] = this;
        this.defaultNamespace = new namespace_1.Namespace('default', this);
        this.currentNamespace = this.defaultNamespace;
        this.taskRunner = new task_runner_1.TaskRunner(this);
        this.importer = new importer_1.Importer(this);
    }
    api() {
        return Object.assign({
            namespace: this.namespace,
            task: this.task,
            store: this.store,
            infos: this.infos,
            getContextApi: Context.getContextApi,
            createContext: Context.createContext
        }, this.importer.api(), this.taskRunner.api());
    }
    store(store_key, value) {
        if (typeof value !== 'undefined') {
            this.stores[store_key] = value;
        }
        return this.stores[store_key];
    }
    task(...args) {
        const parameters = Array.prototype.slice.call(args);
        let name = undefined;
        let action = undefined;
        let options = undefined;
        parameters.forEach((param) => {
            if (typeof param === 'string') {
                name = param;
            }
            else if (typeof param === 'function') {
                action = param;
            }
            else if (typeof param === 'object') {
                options = param;
            }
        });
        if (!action) {
            throw new Error('Cannot create a task without action.');
        }
        // create task
        return new task_1.Task(this, action, name, options);
    }
    namespace(name, closure) {
        const previous = this.currentNamespace;
        const ns = namespace_1.Namespace.findOrCreateNamespace(name, this);
        this.currentNamespace = ns;
        closure.call(ns);
        // If the namespace as a default task
        // the path to the namespace will execute the default task
        if (ns.tasks.default) {
            const tsk = ns.tasks.default;
            tsk.unlink();
            tsk.namespace = ns.parent || ns.root;
            tsk.options.name = ns.name;
            tsk.link();
        }
        this.currentNamespace = previous;
        return ns;
    }
    infos(info, value) {
        switch (info) {
            case "name": {
                return this.name;
            }
            case "tasks": {
                return Object.keys(this.Tasks);
            }
            case "description": {
                if (this.Tasks[value]) {
                    return this.Tasks[value].options.description;
                }
                return '';
            }
        }
    }
    static getContext(name) {
        if (Context.contexts[name]) {
            return Context.contexts[name];
        }
        throw new Error(`Context with name "${name}" does not exist`);
    }
    static getContextApi(name) {
        return Context.getContext(name).api();
    }
    static createContext(name) {
        if (Context.contexts[name]) {
            return Context.contexts[name];
        }
        return new Context(name);
    }
}
Context.contexts = {};
exports.Context = Context;
