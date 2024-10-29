import { Component, game, Label, Node, UITransform, _decorator } from "cc";
import { EDITOR } from "cc/env";
import { GuideManager } from "../GuideManager";
import { createSprite, createText, createTip } from "../guide_utils";
import { Debug } from "../../Debugger";
import { utils } from "../../utils";



const {
    ccclass, 
    property, 
    executeInEditMode, 
    menu, 
    disallowMultiple
} = _decorator;

@ccclass("GuideDialogue")
@executeInEditMode
@disallowMultiple
@menu('游戏通用组件/引导/引导类型/GuideDialogue(对话引导)')
export  class GuideDialogue extends Component {

    private _roleCount: number = 2;
    @property({
        tooltip: '角色个数',
        step: 1
    })
    private set roleCount(val: number) {
        this._roleCount = val;
        this.createNode();
    }
    private get roleCount(): number { return this._roleCount; }

    @property({
        type: Node,
        tooltip: '角色列表'
    })
    private roleList: Node[] = [];

    @property({
        type: Node,
        displayName: '提示点击'
    })
    private tip: Node = null;

    @property({
        range: [0, 1, 0.1],
        tooltip: '文字显示的时间间隔(秒)',
        slide: true
    })
    private duration: number = 0.1;

    private _playText: boolean = false;
    private _timeout: number = 0;
    private _charIndex: number = 0;
    private _descript: string;

    onLoad () {
        this.init();
        this.createNode();
        const rate = typeof game.frameRate === "string" ? parseInt(game.frameRate) : game.frameRate;
        if (this.duration < (1 / rate)) {
            this.duration = 1 / rate;
        }
        if (!EDITOR) {
            this.node.on(Node.EventType.TOUCH_START, function() {}, this);
            this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
        }
    }

    init() {
        const ui = this.node.getComponent(UITransform);
        ui.width = 2000;
        ui.height = 2000;
        this._playText = false;
        this._timeout = 0;
        this._charIndex = 0;
    }

    createNode() {
        for (let i: number = this.roleList.length; i < this.roleCount; ++i) {
            let role: Node = createSprite('role');
            role.addChild(createText('text'));
            this.node.addChild(role);
            this.roleList.push(role);
        }
        for (let i: number = 0; i < this.roleList.length - this.roleCount; ++i) {
            let node: Node = this.roleList.pop();
            node.removeFromParent();
        }

        if (!this.tip) {
            this.tip = createTip('tip');
            this.node.addChild(this.tip);
        }
    }

    onClick() {
        // if (this._charIndex < this._descript.length && this._playText) {
        //     this._playText = false;
        //     let index: number = GuideManager.instance.guideInfo.npc - 1;
        //     this.roleList[index].getChildByName('text').getComponent(Label).string = this._descript;
        //     this.tip.active = true;
        // }
        // else {
        //     this.node.active = false;
        //     GuideManager.instance.guideContinue();
        // }

        if (this._charIndex === this._descript.length) {
            this.node.active = false;
            GuideManager.instance.guideContinue();
        }
    }

    execGuide() {
        this.log(this.execGuide, "开始执行对话引导！");
        this._playText = true;
        this._charIndex = 0;
        this._timeout = 0;
        this.node.active = true;
        this.tip.active = false;
        this._descript = GuideManager.instance.guideAction.descript;
        for (let e of this.roleList) {
            e.getChildByName('text').getComponent(Label).string = '';
        }
    }

    start () {

    }

    private log(fn: Function, ...subst: any[]) {
        Debug.log(utils.StringUtil.format("[GuideDialogue:%s]", fn.name), ...subst);
    }

    update (dt: number) {
        if (!this._playText) return;

        this._timeout += dt;
        if (this._timeout >= this.duration) {
            this._timeout = 0;
            let index: number = GuideManager.instance.guideAction.npc - 1;
            this.roleList[index].getChildByName('text').getComponent(Label).string += this._descript[this._charIndex++];
            if (this._charIndex >= this._descript.length) {
                this._playText = false;
                this.tip.active = true;
            }
        }
    }
}
