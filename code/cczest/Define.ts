import { DEBUG } from "cc/env";


/**调试模式 */
export const SPARK_DEBUG: boolean = DEBUG;
/**日志显示时间 */
export const SHOW_DATE: boolean = false;

export const MAX_PRIORITY = 10000;


export function SAFE_CALLBACK(func: Function, ...args: any) {
    if (typeof func === 'function') {
        func(...args);
        return true;
    }
    return false;
}

export function SAFE_CALLBACK_CALLER(func: Function, caller: any, ...args: any) {
    if (typeof func === 'function') {
        func.apply(caller, args);
        return true;
    }
    return false;
}

export const STARTUP = {
    name: ""
}
