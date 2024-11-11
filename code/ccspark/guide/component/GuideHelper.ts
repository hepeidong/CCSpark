import { GuideFinger } from "./GuideFinger";
import { GuideDialogue } from "./GuideDialogue";
import { GuideText } from "./GuideText";
import { EventType, GuideNormalEvent, GuideType } from "../GuideEnum";
import { Debug } from "../../Debugger";
import { AdapterWidget } from "../../app/adapter_manager/component/AdapterWidget";
import { BlockInputEvents, Component, Node, Sprite, _decorator } from "cc";
import { EDITOR } from "cc/env";
import { ui } from "../../ui";
import { GuideManager } from "../GuideManager";
import { UITransform } from "cc";
import { utils } from "../../utils";


const {
    ccclass,
    property,
    executeInEditMode,
    menu,
    disallowMultiple
} = _decorator;


@ccclass("GuideHelper")
@executeInEditMode
@disallowMultiple
@menu('游戏通用组件/引导/GuideHelper(引导助手)')
export  class GuideHelper extends Component {

    @property(Node)
    private _guideMask: Node = null;

    @property(Node)
    private _guideLayer: Node = null;

    @property(Node)
    private _guideBlockInput: Node = null;

    @property({
        range: [0.1, 10, 0.1],
        slide: true,
        tooltip: "值越大，手指移动速度越快",
        displayName: '手指移动速度'
    })
    private fingerSpeed: number = 5;

    @property({
        tooltip: '选中该选项，增加手指引导'
    })
    isFinger: boolean = false;

    @property({
        type: Node,
        visible(this: GuideHelper) {
            if (!this.guideFinger && this.isFinger) {
                let newNode: Node = new Node("guideFinger");
                if (newNode) {
                    this.guideFinger = newNode;
                    this.guideFinger.addComponent(UITransform);
                    this.guideFinger.addComponent("GuideFinger");
                    this.node.addChild(this.guideFinger);
                }
            }
            else if (!this.isFinger) {
                this.node.removeChild(this.guideFinger);
                this.guideFinger = null;
            }
            return this.isFinger;
        }
    })
    guideFinger: Node = null;

    @property({
        tooltip: '选中该选项，增加对话框引导'
    })
    isDialogue: boolean = false;

    @property({
        type: Node,
        visible(this: GuideHelper) {
            if (!this.guideDialogue && this.isDialogue) {
                let newNode: Node = new Node("guideDialogue");
                if (newNode) {
                    this.guideDialogue = newNode;
                    this.guideDialogue.addComponent(UITransform);
                    this.guideDialogue.addComponent("GuideDialogue");
                    this.node.addChild(this.guideDialogue);
                }
            }
            else if (!this.isDialogue) {
                this.node.removeChild(this.guideDialogue);
                this.guideDialogue = null;
            }
            return this.isDialogue;
        }
    })
    guideDialogue: Node = null;

    @property({
        tooltip: '选中该选项，增加文本引导'
    })
    isText: boolean = false;

    @property({
        type: Node,
        visible(this: GuideHelper) {
            if (!this.guideText && this.isText) {
                let newNode: Node = new Node("guideText");
                if (newNode) {
                    this.guideText = newNode;
                    this.guideText.addComponent(UITransform);
                    this.guideText.addComponent("GuideText");
                    this.node.addChild(this.guideText);
                }
            }
            else if (!this.isText) {
                this.node.removeChild(this.guideText);
                this.guideText = null;
            }
            return this.isText;
        }
    })
    guideText: Node = null;

    private _startGuideId: string;
    private _startExecute: boolean = false;
    private _viewOpenStatus: boolean = false;

    onLoad() {
        this.createNode();
        if (!EDITOR) {
            GuideManager.instance.setFingerSpeed(this.fingerSpeed);
            GuideManager.instance.addGuideMaskAndLayer(this._guideMask, this._guideLayer);
            GuideManager.instance.on(EventType.GUIDE_START, this.onStartGuide, this);
            GuideManager.instance.on(EventType.GUIDE_OVER, this.onGuideOver, this);
            GuideManager.instance.on(GuideNormalEvent.HIDE_BLOCK_INPUT_LAYER, this.onHideBlockInput, this);
        }
    }

    start() {
        
    }

    protected onEnable(): void {
        if (!EDITOR) {
            this.init();
            GuideManager.instance.guideLaunch();
        }
    }

    protected onDestroy(): void {
        GuideManager.instance.off(EventType.GUIDE_START, this.onStartGuide, this);
        GuideManager.instance.off(EventType.GUIDE_OVER, this.onGuideOver, this);
        GuideManager.instance.off(GuideNormalEvent.HIDE_BLOCK_INPUT_LAYER, this.onHideBlockInput, this);
    }

    createNode() {
        if (!this.node.getComponent(UITransform)) {
            this.node.addComponent(UITransform);
        }
        if (!this._guideMask) {
            let newNode: Node = new Node("guideMask");
            newNode.addComponent(Sprite);
            newNode.addComponent(AdapterWidget).size = true;
            newNode.addComponent(BlockInputEvents);
            this._guideMask = newNode;
            this.node.addChild(this._guideMask);
        }
        if (!this._guideLayer) {
            let newNode: Node = new Node("guideLayer");
            newNode.addComponent(UITransform);
            this._guideLayer = newNode;
            this.node.addChild(this._guideLayer);
        }
        if (!this._guideBlockInput) {
            let newNode: Node = new Node("guideBlockInput");
            newNode.addComponent(UITransform);
            newNode.addComponent(AdapterWidget).size = true;
            newNode.addComponent(BlockInputEvents);
            this._guideBlockInput = newNode;
            this.node.addChild(this._guideBlockInput);
        }
    }

    init() {
        this._guideMask && (this._guideMask.active = false);
        this._guideBlockInput && (this._guideBlockInput.active = false);
        this.guideFinger && (this.guideFinger.active = false);
        this.guideDialogue && (this.guideDialogue.active = false);
        this.guideText && (this.guideText.active = false);
    }

    onStartGuide(guideId: string) {
        let status = this.getViewStatus(guideId);
        if (status > -1) {
            this._startExecute = true;
            this._startGuideId = guideId;
            this._viewOpenStatus = status === 1 ? true : false;
        }
        else {
            this.log(this.onStartGuide, "当前引导", guideId);
            this.execGuide(guideId);
        }
    }

    onGuideOver() {
        this._startExecute = false;
        this._viewOpenStatus = false;
    }

    onHideBlockInput() {
        this._guideBlockInput.active = false;
    }

    private execGuide(guideId: string) {
        if (GuideManager.instance.isGuiding) {
            let guideObj: GuideFinger | GuideText | GuideDialogue;
            if (GuideManager.instance.guideType === GuideType.DIALOGUE) {
                guideObj = this.execDialogueGuide();
            }
            else if (GuideManager.instance.guideType === GuideType.FINGER) {
                guideObj = this.execFingerGuide(guideId);
            }
            else if (GuideManager.instance.guideType === GuideType.TEXT) {
                guideObj = this.execTextGuide(guideId);
            }
            if (guideObj) {
                guideObj.execGuide();
            }
        }
    }

    private execDialogueGuide() {
        this.log(this.execDialogueGuide, "对话引导");
        this._guideMask && (this._guideMask.active = true);
        this.guideDialogue && (this.guideDialogue.active = true);
        return this.guideDialogue.getComponent(GuideDialogue);
    }

    private execFingerGuide(guideId: string) {
        this.log(this.execFingerGuide, "手指引导");
        if (GuideManager.instance.searchLightTarget(guideId)) {
            this._guideMask && (this._guideMask.active = true);
            this.guideFinger && (this.guideFinger.active = true);
            this._guideBlockInput && (this._guideBlockInput.active = true);
            return this.guideFinger.getComponent(GuideFinger);
        }
        else {
            this.log(this.execFingerGuide, "没有高亮节点", guideId);
        }
        return undefined;
    }

    private execTextGuide(guideId: string) {
        this.log(this.execTextGuide, "文本引导");
        if (GuideManager.instance.searchLightTarget(guideId)) {
            this._guideMask && (this._guideMask.active = true);
            this.guideText && (this.guideText.active = true);
            return this.guideText.getComponent(GuideText);
        }
        else {
            this.log(this.execTextGuide, "没有高亮节点", guideId);
        }
        return undefined;
    }

    /**
     * 获取引导的页面的状态, -1: ui管理中没有这个页面, 0: ui管理中有这个页面, 没有打开, 1: ui管理中有这个页面, 并且打开了
     * @param guideId 
     */
    private getViewStatus(guideId: string) {
        let status: number = -1;
        let guideAction = GuideManager.instance.guideGroup.get(guideId.toString());
        let view = ui.getView(guideAction.uiId);
        if (guideAction && view) {
            status = view.opened ? 1 : 0;
        }
        return status;
    }

    private setViewOpenStatus(guideId: string) {
        let status = this.getViewStatus(guideId);
        if (status > -1) this._viewOpenStatus = status === 1 ? true : false;
    }

    private log(fn: Function, ...subst: any[]) {
        Debug.log(utils.StringUtil.format("[GuideHelper:%s]", fn.name), ...subst);
    }

    update () {
        if (this._startExecute) {
            this.setViewOpenStatus(this._startGuideId);
            if (this._viewOpenStatus) {
                this._startExecute = false;
                this._viewOpenStatus = false;
                this.log(this.update, "当前引导", GuideManager.instance.guideAction.guideId);
                this.execGuide(this._startGuideId);
            }
        }
    }
}
