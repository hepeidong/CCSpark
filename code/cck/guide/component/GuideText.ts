import { Debug } from "../../Debugger";
import { createTip, createText, restoreParent } from "../guide_utils";
import { Component, game, Label, Node, Size, UITransform, _decorator } from "cc";
import { EDITOR } from "cc/env";
import { utils } from "../../utils";
import { GuideManager } from "../GuideManager";
import { getPriority } from "../../util";

const {
    ccclass, 
    property, 
    executeInEditMode, 
    menu, 
    disallowMultiple
} = _decorator;

@ccclass("GuideText")
@executeInEditMode
@disallowMultiple
@menu('游戏通用组件/引导/引导类型/GuideText(文本引导)')
export  class GuideText extends Component {

    @property({
        type: Node,
        displayName: '文本内容标签'
    })
    private text: Node = null;

    @property({
        type: Node,
        displayName: '提示点击'
    })
    private tip: Node = null;

    @property({
        range: [0, 1, 0.1],
        slide: true,
        tooltip: '文字显示的时间间隔(秒)'
    })
    private duration: number = 0.1;

    private _charIndex: number;          //文本字符索引
    private _timeout: number;            //超时记录
    private _playText: boolean;          //开始显示文本
    private _descript: string;           //文本内容
    private _lightTargets: Node[];         //引导高亮节点暂存
    private _targetZIndex: number[] = [];     //目标节点的zIndex
    private _lightParents: Node[] = [];    //高亮父节点

    onLoad () {
        this.init();
        this.creatNode();
        
        if (!EDITOR) {
            this.node.on(Node.EventType.TOUCH_START, function() {}, this);
            this.node.on(Node.EventType.TOUCH_START, this.onClick, this);
        }
    }

    start () {
        
    }

    init() {
        this.node.getComponent(UITransform).setContentSize(new Size(2000, 2000));
        this._playText = false;
        this._timeout = 0;
        this._charIndex = 0;
    }

    creatNode() {
        if (!this.text) {
            this.text = createText('text');
            this.node.addChild(this.text);
        }

        if (!this.tip) {
            this.tip = createTip('tip');
            this.node.addChild(this.tip);
        }
        const rate = typeof game.frameRate === "string" ? parseInt(game.frameRate) : game.frameRate;
        if (this.duration < (1 / rate)) {
            this.duration = 1 / rate;
        }
    }

    onClick() {
        if (this._charIndex < this._descript.length && this._playText) {
            this._playText = false;
            this.text.getComponent(Label).string = this._descript;
            this.tip.active = true;
        }
        else {
            if (this._lightTargets) {
                let index: number = 0;
                for (let ele of this._lightTargets) {
                    restoreParent(ele, this._targetZIndex[index], this._lightParents[index++]);
                }
                this._targetZIndex.splice(0, this._targetZIndex.length);
                this._lightParents.splice(0, this._lightParents.length);
            }
            this.node.active = false;
            GuideManager.instance.guideContinue();
        }
    }

    public execGuide() {
        this.log(this.execGuide, "开始执行文本引导！");
        this._charIndex = 0;
        this._timeout = 0;
        this.node.active = true;
        this.tip.active = false;
        this._playText = true;
        this.storageGuideData();
        this._descript = GuideManager.instance.guideAction.descript;
        let is: boolean = utils.isNull(this._descript) || utils.isUndefined(this._descript) || this._descript === 'null';
        is && (this._descript = '');
        this.text.getComponent(Label).string = '';

        if (this._lightTargets) {
            for (let e of this._lightTargets) {
                this._lightParents.push(e.parent);
                this._targetZIndex.push(getPriority(e));
                GuideManager.instance.addChildToGuideLayer(e);
            }
        }
    }

    //暂存引导相关数据
    private storageGuideData() {
        this._lightTargets = GuideManager.instance.lightTargets;
        this.log(this.storageGuideData, "文本引导高亮节点", this._lightTargets);
    }

    private log(fn: Function, ...subst: any[]) {
        Debug.log(utils.StringUtil.format("[GuideText:%s]", fn.name), ...subst);
    }

    update (dt: number) {
        if (!this._playText) return;
        this._timeout += dt;
        if (this._timeout >= this.duration) {
            this._timeout = 0;
            this.text.getComponent(Label).string += this._descript[this._charIndex++];
            if (this._charIndex >= this._descript.length) {
                this._playText = false;
                this._charIndex = 0;
                this.tip.active = true;
            }
        }
    }
}
