import when from 'when';
export declare function parallel(tasks: any[], guard_count: number): any;
export declare function map<T>(array: any[], guard_count: number, mapFn: (value: T, index?: Number | undefined) => T): when.Promise<T>;
