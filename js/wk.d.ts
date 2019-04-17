/// <reference types="when" />
import { Context } from "./context";
declare const wk: {
    namespace: (name: string, closure: Function) => import("./namespace").Namespace;
    task: (...args: (string | Function | import("./task").TaskOptions)[]) => import("./task").Task;
    infos: (info: string, value?: any) => string | string[] | undefined;
    getContextApi: typeof Context.getContextApi;
    createContext: typeof Context.createContext;
} & {
    resolve: (filename: string) => string;
    require: (filename: string) => any;
    load: (filename: string, asNamespace?: boolean) => void;
    read: (filename: string) => string;
} & {
    run: (nameOrTask: string | import("./task").Task, argv?: any) => any & {
        promise: When.Promise<any>;
        pipe: (nameOrTask: string, argv?: any) => any & any;
    };
    serie: (...names: (string | import("./task").Task)[]) => When.Promise<any[]>;
    parallel: (...names: (string | import("./task").Task)[]) => When.Promise<any>;
};
export default wk;
