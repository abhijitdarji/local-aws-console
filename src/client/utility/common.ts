
export abstract class CommonUtils {
    static isFunction(value: any): value is Function {
        return typeof value === 'function';
    }
}