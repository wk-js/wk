import { Context } from "./context";
export declare class Importer {
    context: Context;
    paths: string[];
    extensions: string[];
    constructor(context: Context);
    api(): {
        resolve: (filename: string) => string;
        require: (filename: string) => any;
        load: (filename: string, asNamespace?: boolean) => void;
        read: (filename: string) => string;
    };
    resolve(filename: string): string;
    require(filename: string): any;
    load(filename: string, asNamespace?: boolean): void;
    read(filename: string): string;
}
