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
import { Layers } from "cc";
import { GuideImage } from "./GuideImage";
import { Button } from "cc";
import { Label } from "cc";
import { EventSystem } from "../../event";
import { IGuideComponent, IGuideHelper } from "zest";
import { GuideAnimation } from "./GuideAnimation";
import { setPriority } from "../../util";
import { GuideCamera } from "./GuideCamera";


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
export  class GuideHelper extends Component implements IGuideHelper {

    @property(Node)
    private _guideMask: Node = null;

    @property(Node)
    private _guideLayer: Node = null;

    @property(Node)
    private _guideBlockInput: Node = null;

    @property(Node)
    private _guideParent: Node = null;

    @property(Node)
    private guide: Node = null;

    @property({
        type: Button,
        tooltip: "跳过引导按钮选项，该按钮只跳过当前引导组的所有引导"
    })
    skip: Button = null;

    @property({
        range: [0.1, 10, 0.1],
        slide: true,
        tooltip: "值越大，手指移动速度越快",
        displayName: '手指移动速度'
    })
    private fingerSpeed: number = 5;

    @property({
        range: [0.1, 10, 0.1],
        slide: true,
        tooltip: "值越大，摄像机移动速度越快",
        displayName: '摄像机移动速度'
    })
    private cameraSpeed: number = 2;

    @property({
        tooltip: "选中该选项，增加手指引导",
        displayName: "手指引导"
    })
    isFinger: boolean = false;

    @property({
        type: Node,
        visible(this: GuideHelper) {
            if (!this.guideFinger && this.isFinger) {
                let newNode: Node = new Node("guideFinger");
                if (newNode) {
                    this.guideFinger = newNode;
                    this.guideFinger.layer = Layers.Enum.UI_2D;
                    this.guideFinger.addComponent(UITransform);
                    this.guideFinger.addComponent("GuideFinger");
                    this.guide.addChild(this.guideFinger);
                    setPriority(this.guideFinger, 3);
                }
            }
            else if (!this.isFinger) {
                this.guide.removeChild(this.guideFinger);
                this.guideFinger = null;
            }
            return this.isFinger;
        }
    })
    guideFinger: Node = null;

    @property({
        tooltip: '选中该选项，增加对话引导',
        displayName: "对话引导"
    })
    isDialogue: boolean = false;

    @property({
        type: Node,
        visible(this: GuideHelper) {
            if (!this.guideDialogue && this.isDialogue) {
                let newNode: Node = new Node("guideDialogue");
                if (newNode) {
                    this.guideDialogue = newNode;
                    this.guideDialogue.layer = Layers.Enum.UI_2D;
                    this.guideDialogue.addComponent(UITransform);
                    this.guideDialogue.addComponent("GuideDialogue");
                    this.guide.addChild(this.guideDialogue);
                    setPriority(this.guideDialogue, 2);
                }
            }
            else if (!this.isDialogue) {
                this.guide.removeChild(this.guideDialogue);
                this.guideDialogue = null;
            }
            return this.isDialogue;
        }
    })
    guideDialogue: Node = null;

    @property({
        tooltip: '选中该选项，增加文本引导',
        displayName: "文本引导"
    })
    isText: boolean = false;

    @property({
        type: Node,
        visible(this: GuideHelper) {
            if (!this.guideText && this.isText) {
                let newNode: Node = new Node("guideText");
                if (newNode) {
                    this.guideText = newNode;
                    this.guideText.layer = Layers.Enum.UI_2D;
                    this.guideText.addComponent(UITransform);
                    this.guideText.addComponent("GuideText");
                    this.guide.addChild(this.guideText);
                    setPriority(this.guideText, 4);
                }
            }
            else if (!this.isText) {
                this.guide.removeChild(this.guideText);
                this.guideText = null;
            }
            return this.isText;
        }
    })
    guideText: Node = null;

    @property({
        tooltip: '选中该选项，增加图片引导',
        displayName: "图片引导"
    })
    isImage: boolean = false;

    @property({
        type: Node,
        visible(this: GuideHelper) {
            if (!this.guideImage && this.isImage) {
                let newNode: Node = new Node("guideImage");
                if (newNode) {
                    this.guideImage = newNode;
                    this.guideImage.layer = Layers.Enum.UI_2D;
                    this.guideImage.addComponent(UITransform);
                    this.guideImage.addComponent("GuideImage");
                    this.guide.addChild(this.guideImage);
                    setPriority(this.guideImage, 1);
                }
            }
            else if (!this.isImage) {
                this.guide.removeChild(this.guideImage);
                this.guideImage = null;
            }
            return this.isImage;
        }
    })
    guideImage: Node = null;

    @property({
        tooltip: '选中该选项，增加动画引导',
        displayName: "动画引导"
    })
    isAnimation: boolean = false;

    @property({
        type: Node,
        visible(this: GuideHelper) {
            if (!this.guideAnimation && this.isAnimation) {
                let newNode: Node = new Node("guideAnimation");
                if (newNode) {
                    this.guideAnimation = newNode;
                    this.guideAnimation.layer = Layers.Enum.UI_2D;
                    this.guideAnimation.addComponent(UITransform);
                    this.guideAnimation.addComponent("GuideAnimation");
                    this.guide.addChild(this.guideAnimation);
                    setPriority(this.guideAnimation, 0);
                }
            }
            else if (!this.isAnimation) {
                this.guide.removeChild(this.guideAnimation);
                this.guideAnimation = null;
            }
            return this.isAnimation;
        }
    })
    guideAnimation: Node = null;

    @property({
        tooltip: '选中该选项，增加摄像机引导',
        displayName: "摄像机引导"
    })
    isCamera: boolean = false;

    @property({
        type: Node,
        visible(this: GuideHelper) {
            if (!this.guideCamera && this.isCamera) {
                let newNode: Node = new Node("guideCamera");
                if (newNode) {
                    this.guideCamera = newNode;
                    this.guideCamera.layer = Layers.Enum.UI_2D;
                    this.guideCamera.addComponent("GuideCamera");
                    this.guide.addChild(this.guideCamera);
                    setPriority(this.guideCamera, 5);
                }
            }
            else if (!this.isCamera) {
                this.guide.removeChild(this.guideCamera);
                this.guideCamera = null;
            }
            return this.isCamera;
        }
    })
    guideCamera: Node = null;

    private _startGuideId: string;
    private _startExecute: boolean = false;
    private _viewOpenStatus: boolean = false;

    onLoad() {
        this.createNode();
        if (!EDITOR) {
            GuideManager.instance.setFingerSpeed(this.fingerSpeed);
            GuideManager.instance.setCameraSpeed(this.cameraSpeed);
            GuideManager.instance.addGuideMaskAndLayer(this._guideMask, this._guideLayer);
            GuideManager.instance.on(EventType.GUIDE_START, this.onStartGuide, this);
            GuideManager.instance.on(EventType.GUIDE_SKIP, this.onSkipGuide, this);
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
        GuideManager.instance.off(EventType.GUIDE_SKIP, this.onSkipGuide, this);
        GuideManager.instance.off(EventType.GUIDE_OVER, this.onGuideOver, this);
        GuideManager.instance.off(GuideNormalEvent.HIDE_BLOCK_INPUT_LAYER, this.onHideBlockInput, this);
    }

    public clear() {
        if (this.guideDialogue) {
            this.guideDialogue.getComponent(GuideDialogue).clear();
        }
        if (this.guideFinger) {
            this.guideFinger.getComponent(GuideFinger).clear();
        }
        if (this.guideImage) {
            this.guideImage.getComponent(GuideImage).clear();
        }
        if (this.guideText) {
            this.guideText.getComponent(GuideText).clear();
        }
        if (this.guideAnimation) {
            this.guideAnimation.getComponent(GuideAnimation).clear();
        }
        if (this.guideCamera) {
            this.guideCamera.getComponent(GuideCamera).clear();
        }
    }

    private createNode() {
        if (!this.node.getComponent(UITransform)) {
            this.node.addComponent(UITransform);
        }
        if (!this._guideMask) {
            const newNode: Node = new Node("guideMask");
            newNode.layer = Layers.Enum.UI_2D;
            newNode.addComponent(Sprite);
            newNode.addComponent(AdapterWidget).size = true;
            newNode.addComponent(BlockInputEvents);
            this._guideMask = newNode;
            this.node.addChild(this._guideMask);
        }
        if (!this._guideLayer) {
            const newNode: Node = new Node("guideLayer");
            newNode.layer = Layers.Enum.UI_2D;
            newNode.addComponent(UITransform);
            this._guideLayer = newNode;
            this.node.addChild(this._guideLayer);
        }
        if (!this._guideBlockInput) {
            const newNode: Node = new Node("guideBlockInput");
            newNode.layer = Layers.Enum.UI_2D;
            newNode.addComponent(UITransform);
            newNode.addComponent(AdapterWidget).size = true;
            newNode.addComponent(BlockInputEvents);
            this._guideBlockInput = newNode;
            this.node.addChild(this._guideBlockInput);
        }
        if (!this._guideParent) {
            const newNode: Node = new Node("guide");
            newNode.layer = Layers.Enum.UI_2D;
            this._guideParent = newNode;
            this.node.addChild(this._guideParent);
        }
        if (!this.guide) {
            const newNode: Node = new Node("guide");
            newNode.layer = Layers.Enum.UI_2D;
            this.guide = newNode;
            this.node.addChild(this.guide);
        }
        if (!this.skip) {
            const newNode: Node = new Node("skip");
            newNode.layer = Layers.Enum.UI_2D;
            const title = new Node("title");
            title.layer = Layers.Enum.UI_2D;
            const label = title.addComponent(Label);
            label.string = "跳过";
            label.fontSize = 30;
            newNode.addChild(title);
            this.skip = newNode.addComponent(Button);
            this.skip.transition = Button.Transition.SCALE;
            this.skip.getComponent(UITransform).height = 40;
            this.node.addChild(this.skip.node);
            EventSystem.addClickEventHandler(this.skip.node, this, "onSkipClicked");
        }
    }

    private init() {
        this._guideMask && (this._guideMask.active = false);
        this._guideBlockInput && (this._guideBlockInput.active = false);
        this.guideFinger && (this.guideFinger.active = false);
        this.guideDialogue && (this.guideDialogue.active = false);
        this.guideText && (this.guideText.active = false);
        this.guideImage && (this.guideImage.active = false);
        this.guideAnimation && (this.guideAnimation.active = false);
        this.guideCamera && (this.guideCamera.active = false);
    }

    private onStartGuide(guideId: string) {
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

    private onSkipGuide(guideId: string) {
        this.skipGUide(guideId);
    }

    private onGuideOver() {
        this._startExecute = false;
        this._viewOpenStatus = false;
    }

    private onHideBlockInput() {
        this._guideBlockInput.active = false;
    }

    onSkipClicked() {
        GuideManager.instance.guideSkipAll();
    }

    private getGuideObj(guideId: string) {
        let guideObj: IGuideComponent|undefined;
        if (GuideManager.instance.isGuiding) {
            if (GuideManager.instance.guideType === GuideType.DIALOGUE) {
                guideObj = this.execDialogueGuide();
            }
            else if (GuideManager.instance.guideType === GuideType.FINGER) {
                guideObj = this.execFingerGuide(guideId);
            }
            else if (GuideManager.instance.guideType === GuideType.TEXT) {
                guideObj = this.execTextGuide(guideId);
            }
            else if (GuideManager.instance.guideType === GuideType.IMAGE) {
                guideObj = this.execImageGuide();
            }
            else if (GuideManager.instance.guideType === GuideType.ANIMATION) {
                guideObj = this.execAnimationGuide();
            }
            else if (GuideManager.instance.guideType === GuideType.CAMERA) {
                guideObj = this.execCameraGuide(guideId);
            }
        }
        return guideObj;
    }

    private execGuide(guideId: string) {
        let guideObj = this.getGuideObj(guideId);
        if (guideObj) {
            guideObj.execGuide();
        }
    }

    private skipGUide(guideId: string) {
        let guideObj = this.getGuideObj(guideId);
        if (guideObj) {
            guideObj.doGuideSkip();
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

    private execImageGuide() {
        this.log(this.execImageGuide, "图片引导");
        this._guideMask && (this._guideMask.active = true);
        this.guideImage && (this.guideImage.active = true);
        return this.guideImage.getComponent(GuideImage);
    }

    private execAnimationGuide() {
        this.log(this.execAnimationGuide, "动画引导");
        this._guideMask && (this._guideMask.active = false);
        this.guideAnimation && (this.guideAnimation.active = true);
        return this.guideAnimation.getComponent(GuideAnimation);
    }

    private execCameraGuide(guideId: string) {
        this.log(this.execCameraGuide, "摄像机引导");
        if (GuideManager.instance.searchLightTarget(guideId)) {
            this._guideMask && (this._guideMask.active = true);
            this.guideAnimation && (this.guideCamera.active = true);
            this._guideBlockInput && (this._guideBlockInput.active = true);
            return this.guideCamera.getComponent(GuideCamera);
        }
        else {
            this.log(this.execCameraGuide, "没有高亮节点", guideId);
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
        let view = ui.getView(guideAction.getData().uiId);
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
