/// <reference types="when" />
import { Context } from "./context";
import { Task } from "./task";
export declare class TaskRunner {
    context: Context;
    concurrency: number;
    constructor(context: Context);
    api(): {
        run: (nameOrTask: string | Task, argv?: any) => any & {
            promise: When.Promise<any>;
            pipe: (nameOrTask: string, argv?: any) => any & any;
        };
        serie: (...names: (string | Task)[]) => When.Promise<any[]>;
        parallel: (...names: (string | Task)[]) => When.Promise<any>;
    };
    promiseApi(promise: When.Promise<any>): {
        run: (nameOrTask: string | Task, argv?: any) => any & {
            promise: When.Promise<any>;
            pipe: (nameOrTask: string, argv?: any) => any & any;
        };
        serie: (...names: (string | Task)[]) => When.Promise<any[]>;
        parallel: (...names: (string | Task)[]) => When.Promise<any>;
    } & {
        promise: When.Promise<any>;
        pipe: (nameOrTask: string, argv?: any) => {
            run: (nameOrTask: string | Task, argv?: any) => any & any;
            serie: (...names: (string | Task)[]) => When.Promise<any[]>;
            parallel: (...names: (string | Task)[]) => When.Promise<any>;
        } & any;
    };
    run(nameOrTask: string | Task, argv?: any): {
        run: (nameOrTask: string | Task, argv?: any) => any & {
            promise: When.Promise<any>;
            pipe: (nameOrTask: string, argv?: any) => any & any;
        };
        serie: (...names: (string | Task)[]) => When.Promise<any[]>;
        parallel: (...names: (string | Task)[]) => When.Promise<any>;
    } & {
        promise: When.Promise<any>;
        pipe: (nameOrTask: string, argv?: any) => {
            run: (nameOrTask: string | Task, argv?: any) => any & any;
            serie: (...names: (string | Task)[]) => When.Promise<any[]>;
            parallel: (...names: (string | Task)[]) => When.Promise<any>;
        } & any;
    };
    pipe(promise: When.Promise<any>): (nameOrTask: string, argv?: any) => {
        run: (nameOrTask: string | Task, argv?: any) => any & {
            promise: When.Promise<any>;
            pipe: any;
        };
        serie: (...names: (string | Task)[]) => When.Promise<any[]>;
        parallel: (...names: (string | Task)[]) => When.Promise<any>;
    } & {
        promise: When.Promise<any>;
        pipe: any;
    };
    serie(...names: (string | Task)[]): When.Promise<any[]>;
    parallel(...names: (string | Task)[]): When.Promise<any>;
    private _resolve;
    private _resolveTask;
}
