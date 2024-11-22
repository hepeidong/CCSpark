import { EDITOR } from "cc/env";

class Dialog {
    constructor() {

    }

    private static _ins: Dialog = null;
    public static get instance(): Dialog {
        return this._ins = this._ins ? this._ins : new Dialog();
    }

    /**关闭嵌套预制体警告 */
    public closeAddChildBox( ){
        // 屏蔽2.3.1版本prefab嵌套prefab的弹框问题
        if (EDITOR && !window["Editor"].isBuilder) {
            window["_Scene"].DetectConflict.beforeAddChild = function() {
                return false
            }
        }
    }

    public warningBox(title: string, content: string, buttons: string[] = ['确定']) {
        this.messageBox("warning", title, content, buttons);
    }

    public errorBox(title: string, content: string, buttons: string[] = ['确定']) {
        this.messageBox('error', title, content, buttons);
    }

    public questionBox(title: string, content: string, buttons: string[] = ['确定']) {
        this.messageBox('question', title, content, buttons);
    }

    public infoBox(title: string, content: string, buttons: string[] = ['确定']) {
        this.messageBox('info', title, content, buttons);
    }

    public noneBox(title: string, content: string, buttons: string[] = ['确定']) {
        this.messageBox('none', title, content, buttons);
    }

    private messageBox(type: string, title: string, content: string, buttons: string[]) {
        if (EDITOR) {
            window['Editor'].Dialog.messageBox({
                type: type,
                buttons: buttons,
                title: title,
                message: content
            });
        }
    }
}

export class Editor {
    public static Dialog: Dialog = Dialog.instance;
}