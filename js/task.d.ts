/// <reference types="when" />
import { Namespace } from './namespace';
import { Context } from './context';
export interface TaskOptions {
    argv: any;
    visible: boolean;
    description: string;
    name: string;
    concurrency: number;
    before?: Function;
    after?: Function;
}
export declare class Task {
    private action;
    static _id: number;
    options: TaskOptions;
    namespace: Namespace;
    private _pool;
    private _running;
    constructor(context: Context, action: Function, name?: string, options?: TaskOptions);
    readonly context: Context;
    clone(): Task;
    api(mainTaskId: string): any;
    execute(argv?: any, hooks?: boolean): When.Promise<any>;
    getPath(): string;
    /**
     *
     * Register the task to its namespace and be visible
     *
     * @memberof Task
     */
    link(): void;
    /**
     *
     * Unregister the task to its namespace and be hidden
     *
     * @memberof Task
     */
    unlink(): void;
    private _prepare(argv?);
    private _execute(argv?);
    private _next();
    _clean(params: any): void;
}
