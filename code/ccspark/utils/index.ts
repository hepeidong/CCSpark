import { CCStringUtil } from "./CCStringUtil";
import { CCDateUtil } from "./CCDateUtil";
import { CCMathUtil } from "./CCMathUtil";
import { CCEngineUtil } from "./CCEngineUtil";
import { CCObjectUtil } from "./CCObjectUtil";
import { js } from "cc";
export * from "./UUID";


const types = {
    object: '[object Object]',
    array: '[object Array]',
    function: '[object Function]',
    null: '[object Null]',
    undefined: '[object Undefined]'
}

export class utils {
    public static get StringUtil() {return CCStringUtil;}
    public static get DateUtil() {return CCDateUtil;}
    public static get MathUtil() {return CCMathUtil;}
    public static get EngineUtil() {return CCEngineUtil;}
    public static get ObjectUtil() {return CCObjectUtil;}
}

export namespace utils {

    export function isObject(arg: any): boolean {
        return Object.prototype.toString.call(arg) === types.object || typeof arg === 'object';
    }

    export function isArray(arg: any): boolean {
        return Object.prototype.toString.call(arg) === types.array;
    }

    export function isFunction(arg: any): boolean {
        return Object.prototype.toString.call(arg) === types.function || typeof arg === 'function';
    }

    export function isNumber(arg: any): boolean {
        return js.isNumber(arg);
    }

    export function isString(arg: any): boolean {
        return js.isString(arg);
    }

    export function isNull(arg: any): boolean {
        return Object.prototype.toString.call(arg) === types.null;
    }

    export function isUndefined(arg: any): boolean {
        return Object.prototype.toString.call(arg) === types.undefined || typeof arg === 'undefined';
    }
}