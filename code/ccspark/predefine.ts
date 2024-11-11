import { Debug } from "./Debugger";
import { STARTUP } from "./Define";
import { Editor } from "./editor/Editor";
import { EDITOR } from "cc/env";
import { js } from "cc";
import { Constructor, global } from "./lib.ccspark";


var _global = typeof window === 'undefined' ? global : window;

if (!EDITOR) {
    if (!_global.enable) {
        _global.enable = true;
        Editor.Dialog.closeAddChildBox();
        Debug.initDebugSetting(STARTUP.name);
        const classRef = js.getClassByName(STARTUP.name) as Constructor;
        if (classRef) {
            new classRef();
            Debug.log('游戏启动');
        }
        else {
            Debug.error("缺少游戏主程序入口类");
        }
    }
}