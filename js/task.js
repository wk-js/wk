"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const object_1 = require("lol/utils/object");
const namespace_1 = require("./namespace");
const when_1 = require("when");
const generator_1 = require("./utils/generator");
class Task {
    constructor(context, action, name, options) {
        this.action = action;
        this.options = {
            argv: {},
            visible: false,
            name: '_noname',
            concurrency: -1,
            description: ''
        };
        this._pool = [];
        this._running = 0;
        if (!name) {
            Task._id++;
            name = this.options.name + Task._id;
        }
        this.options.name = name;
        if (options) {
            this.options = object_1.merge(this.options, options);
        }
        this.namespace = namespace_1.Namespace.findOrCreateNamespace(name, context);
        this.link();
    }
    get context() {
        return this.namespace.context;
    }
    clone() {
        const task = new Task(this.context, this.action, this.options.name);
        task.options = object_1.clone(this.options);
        return task;
    }
    execute(argv, hooks = false) {
        return when_1.promise((resolve, reject) => {
            this._pool.push({ resolve, reject, argv, hooks });
            this._next();
        })
            .then((value) => {
            this._running--;
            this._next();
            return value;
        });
    }
    getPath() {
        return this.namespace.getPath(this.options.name);
    }
    /**
     *
     * Register the task to its namespace and be visible
     *
     * @memberof Task
     */
    link() {
        this.namespace.registerTask(this);
    }
    /**
     *
     * Unregister the task to its namespace and be hidden
     *
     * @memberof Task
     */
    unlink() {
        this.namespace.unregisterTask(this);
    }
    _prepare(argv) {
        // Set ARGV
        argv = object_1.merge({}, this.options.argv, argv || {});
        // Set task path
        const path = this.getPath();
        if (Array.isArray(argv._) && argv._[0] !== path) {
            argv._.unshift(path);
        }
        else {
            argv._ = [path];
        }
        return { argv };
    }
    _execute(argv) {
        const params = this._prepare(argv);
        let value = this.action(this.context.api(), params.argv);
        // Generator case
        if (generator_1.isGenerator(this.action) && generator_1.isGeneratorLike(value)) {
            const generator = value;
            value = new Promise((resolve) => {
                let next;
                const iterate = (v) => {
                    next = generator.next(v);
                    if (next.done) {
                        return resolve(next.value);
                    }
                    if (when_1.isPromiseLike(next.value)) {
                        return next.value.then(iterate);
                    }
                    return iterate(next.value);
                };
                iterate();
            });
            value.then(() => this._clean(params));
        }
        // Promise case
        else if (when_1.isPromiseLike(value)) {
            value.then(() => this._clean(params));
        }
        // Synchronous case
        else {
            this._clean(params);
        }
        return value;
    }
    _next() {
        if (this.options.concurrency > -1 && this._running >= this.options.concurrency)
            return;
        const task = this._pool.shift();
        if (!task)
            return;
        this._running++;
        const value = this._execute(task.argv);
        task.resolve(value);
    }
    _clean(params) {
        // delete this.context.stores[params.id]
    }
}
Task._id = 0;
exports.Task = Task;
