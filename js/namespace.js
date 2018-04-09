"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Namespace {
    /**
     * Creates an instance of Namespace.
     *
     * @param {String} name
     * @param {Namespace} parent
     *
     * @memberOf Namespace
     */
    constructor(name, context, parent) {
        this.name = name;
        this.context = context;
        this.parent = parent;
        this.children = {};
        this.tasks = {};
    }
    get root() {
        return this.context.defaultNamespace;
    }
    /**
     * Return the task from path
     *
     * @param {String} path
     * @return {Task | undefined}
     *
     * @memberOf Namespace
     */
    resolveTask(path) {
        const parts = path.split(':');
        const name = parts.pop();
        const ns = this.resolveNamespace(parts.join(':'));
        if (ns && name)
            return ns.tasks[name];
        return undefined;
    }
    /**
     * Return the namespace from path
     *
     * @param {String} path
     * @return {Namespace | undefined}
     *
     * @memberOf Namespace
     */
    resolveNamespace(path) {
        if (!path || path === this.name)
            return this;
        const parts = path.split(':');
        let ns = this;
        for (let i = 0, len = parts.length; ns && i < len; i++) {
            if (ns.children[parts[i]]) {
                ns = ns.children[parts[i]];
            }
            else {
                return undefined;
            }
        }
        return ns;
    }
    /**
     * Get current namespace path
     *
     * @param {String?} name
     * @return {String}
     *
     * @memberOf Namespace
     */
    getPath(name) {
        const path = [this.name];
        let next = true;
        let current = this;
        while (next) {
            if (current.parent) {
                path.push(current.parent.name);
                current = current.parent;
                continue;
            }
            next = false;
        }
        // Remove default namespace from path
        path.pop();
        const pth = path.reverse().join(':');
        if (name) {
            if (pth.length === 0)
                return name;
            return pth + ':' + name;
        }
        return pth;
    }
    /**
     * Register a task to the namespace
     *
     * @param {Task} task
     *
     * @memberOf Namespace
     */
    registerTask(task) {
        this.tasks[task.options.name] = task;
        this.context.Tasks[task.getPath()] = task;
    }
    /**
     * Unregister a task to the namespace
     *
     * @param {Task} task
     *
     * @memberOf Namespace
     */
    unregisterTask(task) {
        if (this.tasks[task.options.name] === task) {
            delete this.context.Tasks[task.getPath()];
            delete this.tasks[task.options.name];
        }
    }
    static findOrCreateNamespace(name, context) {
        // split name to have path
        const path = name.split(':');
        name = path.pop();
        // find or create namespace
        let currentNamespace = context.currentNamespace;
        if (path.length > 0) {
            path.forEach((ns_name) => {
                let ns = currentNamespace.resolveNamespace(ns_name);
                if (!ns) {
                    ns = new Namespace(ns_name, currentNamespace.context, currentNamespace);
                }
                currentNamespace.children[ns_name] = ns;
                currentNamespace = ns;
            });
        }
        return currentNamespace;
    }
}
exports.Namespace = Namespace;
