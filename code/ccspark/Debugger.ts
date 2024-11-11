import { assert, debug, error, log, sys, warn } from "cc";
import { CCK_DEBUG } from "./Define";
import { utils } from "./utils";


export class Debug {
    static log = function log(msg: any, ...subst: any[]){}
    static warn = function warn(msg: any, ...subst: any[]){}
    static error = function error(msg: any, ...subst: any[]){}
    static debug = function debug(msg: any, ...subst: any[]){}
    static info = function info(msg: any, ...subst: any[]){}
    static assert = function assert(condition?: boolean, ...data: any[]){}

    static initDebugSetting(logTag: string): void {
        if (CCK_DEBUG) {
            if (sys.isNative) {
                this.log = log.bind(log, utils.StringUtil.logFormat(logTag, 'LOG'));
                this.warn = warn.bind(warn, utils.StringUtil.logFormat(logTag, 'WARN'));
                this.error = error.bind(error, utils.StringUtil.logFormat(logTag, 'ERROR'));
                this.debug = debug.bind(debug, utils.StringUtil.logFormat(logTag, 'KIT_DEBUG'));
                this.assert = assert.bind(assert, utils.StringUtil.logFormat(logTag, 'ASSERT'));
            }
            else {
                this.log = console.log.bind(console, utils.StringUtil.logFormat(logTag, 'LOG'));
                this.warn = console.warn.bind(console, utils.StringUtil.logFormat(logTag, 'WARN'));
                this.error = console.error.bind(console, utils.StringUtil.logFormat(logTag, 'ERROR'));
                this.info = console.info.bind(console, utils.StringUtil.logFormat(logTag, 'INFO'));
                this.debug = console.debug.bind(console, utils.StringUtil.logFormat(logTag, 'KIT_DEBUG'));
                this.assert = console.assert.bind(console, utils.StringUtil.logFormat(logTag, 'ASSERT'));
            }
            
        }
    }
}