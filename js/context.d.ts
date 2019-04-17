/// <reference types="when" />
import { Namespace } from './namespace';
import { Task, TaskOptions } from './task';
import { TaskRunner } from './task-runner';
import { Importer } from './importer';
export declare class Context {
    name?: string | undefined;
    static contexts: {
        [key: string]: Context;
    };
    Tasks: Record<string, Task>;
    defaultNamespace: Namespace;
    taskRunner: TaskRunner;
    currentNamespace: Namespace;
    importer: Importer;
    constructor(name?: string | undefined);
    api(): {
        namespace: (name: string, closure: Function) => Namespace;
        task: (...args: (string | Function | TaskOptions)[]) => Task;
        infos: (info: string, value?: any) => string | string[] | undefined;
        getContextApi: typeof Context.getContextApi;
        createContext: typeof Context.createContext;
    } & {
        resolve: (filename: string) => string;
        require: (filename: string) => any;
        load: (filename: string, asNamespace?: boolean) => void;
        read: (filename: string) => string;
    } & {
        run: (nameOrTask: string | Task, argv?: any) => any & {
            promise: When.Promise<any>;
            pipe: (nameOrTask: string, argv?: any) => any & any;
        };
        serie: (...names: (string | Task)[]) => When.Promise<any[]>;
        parallel: (...names: (string | Task)[]) => When.Promise<any>;
    };
    task(...args: (string | Function | TaskOptions)[]): Task;
    namespace(name: string, closure: Function): Namespace;
    infos(info: string, value?: any): string | string[] | undefined;
    static getContext(name: string): Context;
    static getContextApi(name: string): {
        namespace: (name: string, closure: Function) => Namespace;
        task: (...args: (string | Function | TaskOptions)[]) => Task;
        infos: (info: string, value?: any) => string | string[] | undefined;
        getContextApi: typeof Context.getContextApi;
        createContext: typeof Context.createContext;
    } & {
        resolve: (filename: string) => string;
        require: (filename: string) => any;
        load: (filename: string, asNamespace?: boolean) => void;
        read: (filename: string) => string;
    } & {
        run: (nameOrTask: string | Task, argv?: any) => any & {
            promise: When.Promise<any>;
            pipe: (nameOrTask: string, argv?: any) => any & any;
        };
        serie: (...names: (string | Task)[]) => When.Promise<any[]>;
        parallel: (...names: (string | Task)[]) => When.Promise<any>;
    };
    static createContext(name: string): Context;
}
