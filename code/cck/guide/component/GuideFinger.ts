import { createSprite, createText, restoreParent } from "../guide_utils";
import { EventType, GuideNormalEvent } from "../GuideEnum";
import { utils } from "../../utils";
import { EventSystem } from "../../event";
import { GuideTarget } from "./GuideTarget";
import { Animation, Button, Component, Label, Node, Tween, tween, UITransform, v3, Vec3, _decorator } from "cc";
import { EDITOR } from "cc/env";
import { animat } from "../../animat_audio";
import { app } from "../../app";
import { GuideManager } from "../GuideManager";
import { getPriority, setPriority } from "../../util";
import { GuideAction } from "../GuideAction";
import { Debug } from "../../Debugger";


const {
    ccclass, 
    property,
    executeInEditMode, 
    menu, 
    disallowMultiple} = _decorator;

@ccclass("GuideFinger")
@executeInEditMode
@disallowMultiple
@menu('游戏通用组件/引导/引导类型/GuideFinger(手指引导)')
export  class GuideFinger extends Component {
    @property({
        type: Node,
        tooltip: '指引特效'
    })
    private _effect: Node = null;

    @property({
        type: Node,
        tooltip: '手指引导的手指节点，可在该节点绑定相应的Animation动画'
    })
    private finger: Node = null;

    @property({
        type: Node,
        tooltip: '文本说明'
    })
    private text: Node = null;

    @property(Node)
    private _textParent: Node = null;

    private _auto: boolean = false;           //自动执行下一步引导
    private _clicked: boolean = false;        //防止重复点击
    private _timeout: number = 0;      
    private _interval: number = 4;            //自动引导时间间隔
    private _guideTargets: GuideTarget[]; //引导目标暂存
    private _guideInfo: GuideAction;      //引导数据信息暂存
    private _lightTargets: Node[];         //引导高亮节点暂存
    private _targetZIndex: number[] = [];     //目标节点的zIndex
    private _lightParents: Node[] = [];    //高亮父节点

    onLoad () {
        this.createNode();
        if (!EDITOR) {
            GuideManager.instance.on(EventType.GUIDE_OVER, this.onGuideOver, this);
            EventSystem.event.on(GuideNormalEvent.FINGER_EVENT, this, this.nextGuide);
        }
    }

    start () {
        
    }

    protected onDestroy(): void {
        GuideManager.instance.off(EventType.GUIDE_OVER, this.onGuideOver, this);
    }

    private onGuideOver() {
        this.node.active = false
    }

    createNode() {
        if (!this.finger) {
            this.finger = new Node('finger');
            this.finger.addComponent(UITransform);
            this.node.addChild(this.finger);
        }
        if (!this._effect) {
            this._effect = createSprite('effect');
            this._effect.addComponent(Animation);
            this.finger.addChild(this._effect);
        }
        if (!this.text) {
            this.text = createText('text');
            this._textParent = new Node('textNode');
            this._textParent.addComponent(UITransform);
            this._textParent.addChild(this.text);
            this.node.addChild(this._textParent);
        }
        setPriority(this.text, 200);
    }

    /**执行引导 */
    public execGuide() {
        this.log(this.execGuide, "开始执行手指引导！");
        this.node.active = true;
        this._clicked = false;
        this.storageGuideData();
        this.fingerTurn();
        this.fingerMove();
        if (this._guideTargets.length === 0) {
            return;
        }
               
        this.text.getComponent(Label).string = GuideManager.instance.guideAction.descript;
        let is: boolean = utils.isNull(GuideManager.instance.guideAction.descript) || utils.isUndefined(GuideManager.instance.guideAction.descript) || GuideManager.instance.guideAction.descript === 'null';
        is && (this.text.getComponent(Label).string = '');
        this._textParent.active = !is;
        const textUI = this.text.getComponent(UITransform);
        const textParentUI = this._textParent.getComponent(UITransform);
        textParentUI.width = textParentUI.width < textUI.width ? textUI.width : textParentUI.width;
        textParentUI.height = textParentUI.height < textUI.height ? textUI.height : textParentUI.height;
        GuideManager.instance.setTextPos(this, this._textParent);

        for (let e of this._lightTargets) {
            this._lightParents.push(e.parent);
            this._targetZIndex.push(getPriority(e));
            GuideManager.instance.addChildToGuideLayer(e);
        }
        
        const target: Node = this._guideTargets[0].target;
        if (target.getComponent(Button)) {
            if (!target['guideTouchRegist']) {
                target['guideTouchRegist'] = true;
                EventSystem.addClickEventHandler(target, this, 'nextGuide');
            }
        }
        else {
            this._auto = true;
            this.disable(false);
        }
    }

    //修正手指的翻转
    private fingerTurn() {
        const fingerUI = this.finger.getComponent(UITransform);
        let width: number = fingerUI.width * (1 - fingerUI.anchorX);
        if (this.finger.position.x > 0) {
            let distance: number = app.adapterManager.getScreenSize().width / 2 - this.finger.position.x;
            if (width > distance) {
                this.finger.scale.set(-1, this.finger.scale.y);
                this.finger.scale.set()
            }
        }
        else if (this.finger.position.x < 0) {
            let distance: number = this.finger.position.x - app.adapterManager.getScreenSize().width / 2;
            if (width > distance) {
                this.finger.scale.set(1, this.finger.scale.y);
            }
        }
    }

    //手指移动
    private fingerMove() {
        let posisions: Vec3[] = GuideManager.instance.getTargetPosition();
        if (posisions.length === 0) {
            return;
        }
        this.playAnimat(false);
        //计算手指和引导目标两点距离
        let dis: number = utils.MathUtil.Vector2D.distance(this.finger.position, v3(posisions[0].x, posisions[0].y));
        //计算移动时间
        let t: number = dis / GuideManager.instance.fingerSpeed;
        let tweenAction: Tween<Node> = tween(this.finger).to(t, {position: v3(posisions[0].x, posisions[0].y)});
        if (posisions.length > 1) {
            tweenAction.repeatForever(tween(this.finger).to(t, {position: v3(posisions[1].x, posisions[1].y)}));
        }
        tweenAction.call(() => {
            GuideManager.instance.hideBlockInputLayer();
            if (posisions.length === 1) {
                this.playAnimat(true);
            }
        });
        tweenAction.start();
    }

    playAnimat(play: boolean) {
        if (play) {
            animat(this._effect).defaultClip().play().catch(err => {
                this.error(this.playAnimat, "手指引导动画执行错误：", err);
            });
        }
        else {
            animat(this._effect).defaultClip().onStop(() => {
                for (let i: number = 0; i < this._effect.children.length; ++i) {
                    this._effect.children[i].active = false;
                    if (this._effect.children[i].getComponent(Animation)) {
                        animat(this._effect.children[i]).defaultClip().stop();
                    }
                }
            }).stop().catch(err => {
                this.error(this.playAnimat, "手指引导动画执行错误：", err);
            });
        }
    }

    //暂存引导相关数据
    private storageGuideData() {
        this._guideInfo = GuideManager.instance.guideAction;
        this._guideTargets = GuideManager.instance.guideTargets;
        this._lightTargets = GuideManager.instance.lightTargets;
    }

    //下一步引导执行
    private nextGuide() {
        if (this._clicked) return;
        if (!this._guideTargets || !this._lightTargets) {
            return;
        }
        this._clicked = true;
        for (let guideTarget of this._guideTargets) {
            for (let i: number = 0; i < guideTarget.guideIds.length; ++i) {
                if (this._guideInfo.guideId === guideTarget.guideIds[i]) {
                    guideTarget.guideIds.splice(i, 1);
                    let index: number = 0;
                    for (let ele of this._lightTargets) {
                        restoreParent(ele, this._targetZIndex[index], this._lightParents[index++]);
                    }
                    this._targetZIndex.splice(0, this._targetZIndex.length);
                    this._lightParents.splice(0, this._lightParents.length);
                    this.node.active = false;
                    GuideManager.instance.guideContinue();
                    break;
                }
            }
        }
    }

    private disable(enable: boolean) {
        for (let guideTarget of this._guideTargets) {
            let button = guideTarget.target.getComponent(Button);
            if (button) {
                button.interactable = enable;
            }
        }
    }

    private log(fn: Function, ...subst: any[]) {
        Debug.log(utils.StringUtil.format("[GuideFinger:%s]", fn.name), ...subst);
    }

    private error(fn: Function, ...subst: any[]) {
        Debug.error(utils.StringUtil.format("[GuideFinger:%s]", fn.name), ...subst);
    }

    update (dt: number) {
        if (this._auto) {
            this._timeout += dt;
            if (this._timeout >= this._interval) {
                this._auto = false;
                this._timeout = 0;
                this.disable(true);
                this.nextGuide();
            }
        }
    }
}
