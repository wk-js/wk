import { Task } from './task';
import { Context } from './context';
export declare class Namespace {
    name: string;
    context: Context;
    parent?: Namespace | undefined;
    children: Record<string, Namespace>;
    tasks: Record<string, Task>;
    /**
     * Creates an instance of Namespace.
     *
     * @param {String} name
     * @param {Namespace} parent
     *
     * @memberOf Namespace
     */
    constructor(name: string, context: Context, parent?: Namespace | undefined);
    readonly root: Namespace;
    /**
     * Return the task from path
     *
     * @param {String} path
     * @return {Task | undefined}
     *
     * @memberOf Namespace
     */
    resolveTask(path: string): Task | undefined;
    /**
     * Return the namespace from path
     *
     * @param {String} path
     * @return {Namespace | undefined}
     *
     * @memberOf Namespace
     */
    resolveNamespace(path?: string): Namespace | undefined;
    /**
     * Get current namespace path
     *
     * @param {String?} name
     * @return {String}
     *
     * @memberOf Namespace
     */
    getPath(name?: string): string;
    /**
     * Register a task to the namespace
     *
     * @param {Task} task
     *
     * @memberOf Namespace
     */
    registerTask(task: Task): void;
    /**
     * Unregister a task to the namespace
     *
     * @param {Task} task
     *
     * @memberOf Namespace
     */
    unregisterTask(task: Task): void;
    static findOrCreateNamespace(name: string, context: Context): Namespace;
}
