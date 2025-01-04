import { Debug } from "../../Debugger";
import { createTip, createText, restoreParent, curText } from "../guide_utils";
import { Component, game, Node, Size, UITransform, _decorator } from "cc";
import { EDITOR } from "cc/env";
import { utils } from "../../utils";
import { GuideManager } from "../GuideManager";
import { getPriority } from "../../util";
import { IGuideComponent, ITextAction } from "zest";
import { RichText } from "cc";

const {
    ccclass, 
    property, 
    executeInEditMode, 
    disallowMultiple
} = _decorator;

@ccclass("GuideText")
@executeInEditMode
@disallowMultiple
export  class GuideText extends Component implements IGuideComponent {

    @property({
        type: RichText,
        displayName: '文本内容'
    })
    private text: RichText = null;

    @property({
        type: Node,
        displayName: '提示点击'
    })
    private tip: Node = null;

    @property({
        range: [0, 1, 0.02],
        slide: true,
        tooltip: '文字显示的时间间隔(秒)，如果时间为0，则会直接显示文本'
    })
    private duration: number = 0.1;

    @property({
        tooltip: "勾选后，文本将自动显示到需要引导的目标节点附近",
        displayName: "自动修正位置"
    })
    private correctedPosition: boolean = false;

    private _timeout: number;            //超时记录
    private _playText: boolean;          //开始显示文本
    private _descript: string;           //文本内容
    private _lightTargets: Node[];         //引导高亮节点暂存
    private _targetZIndex: number[] = [];     //目标节点的zIndex
    private _lightParents: Node[] = [];    //高亮父节点
    private _tempStrArr: string[] = [];

    onLoad () {
        this.node.getComponent(UITransform).setContentSize(new Size(2000, 2000));
        this.creatNode();
        if (!EDITOR) {
            this.init();
            this.node.on(Node.EventType.TOUCH_START, function() {}, this);
            this.node.on(Node.EventType.TOUCH_START, this.onClick, this);
        }
    }

    start () {
        
    }

    init() {
        this._playText = false;
        this._timeout = 0;
    }

    private creatNode() {
        if (!this.text) {
            this.text = createText('text').getComponent(RichText);
            this.node.addChild(this.text.node);
        }

        if (!this.tip) {
            this.tip = createTip('tip');
            this.node.addChild(this.tip);
        }
        const rate = typeof game.frameRate === "string" ? parseInt(game.frameRate) : game.frameRate;
        if (this.duration > 0) {
            if (this.duration < (1 / rate)) {
                this.duration = 1 / rate;
            }
        }
    }

    onClick() {
        if (this._tempStrArr.length > 0 && this._playText) {
            this._playText = false;
            this.text.string = this._descript;
            this.tip.active = true;
            this._tempStrArr = null;
            this._tempStrArr = [];
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

    doGuideSkip(): void {
        this.node.active = false;
        GuideManager.instance.guideSkipAll();
    }

    public execGuide() {
        this.log(this.execGuide, "开始执行文本引导！");
        this._timeout = 0;
        this.tip.active = false;
        this.text.string = "";
        this.storageGuideData();
        this._descript = GuideManager.instance.guideAction.getData<ITextAction>().descript;
        let is: boolean = utils.isNull(this._descript) || utils.isUndefined(this._descript) || this._descript === 'null';
        is && (this._descript = "");

        if (this._lightTargets) {
            for (let e of this._lightTargets) {
                this._lightParents.push(e.parent);
                this._targetZIndex.push(getPriority(e));
                GuideManager.instance.addChildToGuideLayer(e);
            }
        }
        if (this.duration === 0) {
            this.text.string = this._descript;
        }
        else {
            this._playText = true;
            curText(this._descript, this._tempStrArr);
        }
        if (this.correctedPosition) {
            GuideManager.instance.setTextPos(this, this.text.node);
        }
    }

    clear(): void {
        
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
        if (this._playText) {
            this._timeout += dt;
            if (this._timeout >= this.duration) {
                this._timeout = 0;
                this.text.string = this._tempStrArr.pop();
                if (this._tempStrArr.length === 0) {
                    this._playText = false;
                    this.tip.active = true;
                }
            }
        }
    }
}
