import { DEBUG } from "cc/env";


/**调试模式 */
export const CCK_DEBUG: boolean = DEBUG;
/**日志显示时间 */
export const SHOW_DATE: boolean = false;

export const MAX_PRIORITY = 10000;


export function SAFE_CALLBACK(fn: Function, ...args: any) {
    if (typeof fn === 'function') {
        fn.apply(window, args);
        return true;
    }
    return false;
}

export function SAFE_CALLBACK_CALLER(fn: Function, caller: any, ...args: any) {
    if (typeof fn === 'function') {
        fn.apply(caller, args);
        return true;
    }
    return false;
}

export const STARTUP = {
    name: ""
}
