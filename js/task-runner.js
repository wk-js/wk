"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const task_1 = require("./task");
const object_1 = require("lol/utils/object");
const wk_argv_parser_1 = require("wk-argv-parser");
const function_1 = require("lol/utils/function");
const when_1 = require("when");
const concurrent_1 = require("./utils/concurrent");
class TaskRunner {
    constructor(context) {
        this.context = context;
        this.concurrency = 10;
        function_1.bind(this, 'run', 'serie', 'parallel');
    }
    api() {
        return {
            run: this.run,
            serie: this.serie,
            parallel: this.parallel
        };
    }
    promiseApi(promise) {
        return Object.assign(this.api(), {
            promise: promise,
            pipe: this.pipe(promise)
        });
    }
    run(nameOrTask, argv) {
        let t;
        if (nameOrTask instanceof task_1.Task) {
            t = { task: nameOrTask, argv: argv };
        }
        else if (typeof nameOrTask === 'string') {
            t = this._resolveTask(nameOrTask);
        }
        if (!t) {
            throw new Error(`Task "${nameOrTask}" does not exists.`);
        }
        t.argv = object_1.merge({}, t.argv, argv);
        const promise = t.task.execute(t.argv);
        return this.promiseApi(promise);
    }
    pipe(promise) {
        return (nameOrTask, argv) => {
            const p = promise.then((result) => {
                argv = object_1.merge({}, argv || {}, { result: result });
                return this
                    .run(nameOrTask, argv)
                    .promise;
            });
            return this.promiseApi(p);
        };
    }
    serie(...names) {
        const tasks = this._resolve(names);
        const results = [];
        return when_1.reduce(tasks, (r, t) => {
            return this.run(t.task, t.argv).promise.then((value) => {
                r.push(value);
                return r;
            });
        }, results);
    }
    parallel(...names) {
        const tasks = this._resolve(names);
        return concurrent_1.map(tasks, this.concurrency, (t) => {
            return this.run(t.task, t.argv).promise;
        });
    }
    _resolve(names) {
        const tasks = [];
        for (let i = 0, res = null, len = names.length; i < len; i++) {
            res = this._resolveTask(names[i]);
            if (res)
                tasks.push(res);
        }
        return tasks;
    }
    _resolveTask(nameOrTask) {
        if (nameOrTask instanceof task_1.Task) {
            return {
                task: nameOrTask,
                argv: {}
            };
        }
        const argv = wk_argv_parser_1.Parser.parse(nameOrTask).params;
        nameOrTask = argv._[0];
        const tsk = this.context.defaultNamespace.resolveTask(nameOrTask);
        if (tsk) {
            return {
                task: tsk,
                argv: argv
            };
        }
        return null;
    }
}
exports.TaskRunner = TaskRunner;
