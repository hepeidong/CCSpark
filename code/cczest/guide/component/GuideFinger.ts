import { createSprite, restoreParent } from "../guide_utils";
import { EventType, GuideNormalEvent } from "../GuideEnum";
import { utils } from "../../utils";
import { EventSystem } from "../../event";
import { GuideTarget } from "./GuideTarget";
import { Animation, Button, Component, Node, Tween, tween, UITransform, v3, Vec3, _decorator } from "cc";
import { EDITOR } from "cc/env";
import { tweenAnimat } from "../../animat_audio";
import { app } from "../../app";
import { GuideManager } from "../GuideManager";
import { getPriority } from "../../util";
import { GuideAction } from "../GuideAction";
import { Debug } from "../../Debugger";
import { IFingerAction, IGuideComponent, ITweenAnimat } from "zest";


const {
    ccclass, 
    property,
    executeInEditMode, 
    disallowMultiple} = _decorator;

@ccclass("GuideFinger")
@executeInEditMode
@disallowMultiple
export  class GuideFinger extends Component implements IGuideComponent {
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
        tooltip: "手指的初始位置"
    })
    position: Vec3 = v3();

    private _repeatCount: number;             
    private _canClick: boolean;
    private _clicked: boolean = false;        //防止重复点击
    private _guideTargets: GuideTarget[];     //引导目标暂存
    private _guideInfo: GuideAction;          //引导数据信息暂存
    private _lightTargets: Node[];            //引导高亮节点暂存
    private _targetZIndex: number[] = [];     //目标节点的zIndex
    private _lightParents: Node[] = [];       //高亮父节点
    private _effectTweenAnimat: ITweenAnimat; 
    private _tweenAction: Tween<Node>;

    onLoad () {
        this.createNode();
        if (!EDITOR) {
            this.init();
            GuideManager.instance.on(EventType.GUIDE_OVER, this.onGuideOver, this);
            EventSystem.event.on(GuideNormalEvent.FINGER_EVENT, this, this.onFingerEvent);
        }
    }

    start () {
        
    }

    private onFingerEvent() {
        this.currentGuideComplete().then(() => GuideManager.instance.guideContinue());
    }

    private init() {
        this._repeatCount = 0;
        this._canClick = false;
        this._clicked = false;        
        this._targetZIndex = [];
        this._lightParents = [];
    }

    protected onDestroy(): void {
        if (!EDITOR) {
            GuideManager.instance.off(EventType.GUIDE_OVER, this.onGuideOver, this);
        }
    }

    private onGuideOver() {
        this.node.active = false;
    }

    private createNode() {
        if (!this.finger) {
            this.finger = new Node('finger');
            this.finger.addComponent(UITransform);
            this.node.addChild(this.finger);
            this.finger.position = this.position;
        }
        if (!this._effect) {
            this._effect = createSprite('effect');
            this._effect.addComponent(Animation);
            this.finger.addChild(this._effect);
        }
    }

    doGuideSkip(): void {
        this.node.active = false;
        this.currentGuideComplete().then(() => GuideManager.instance.guideSkipAll()).catch(() => GuideManager.instance.guideSkipAll());
    }

    /**执行引导 */
    public execGuide() {
        this.log(this.execGuide, "开始执行手指引导！");
        this._repeatCount = 0;
        this._canClick = false;
        this._clicked = false;   
        this.storageGuideData();
        this.fingerTurn();
        this.fingerMove();
        this.addLightTargetsToGuideLayer();
        this.addClickEvent();
    }

    public clear() {
        if (this._effectTweenAnimat) {
            this._effectTweenAnimat.clear();
        }
    }

    private addLightTargetsToGuideLayer() {
        if (this._guideTargets.length > 0) {
            for (const target of this._lightTargets) {
                this._lightParents.push(target.parent);
                this._targetZIndex.push(getPriority(target));
                GuideManager.instance.addChildToGuideLayer(target);
            }
        }
    }

    private addClickEvent() {
        if (this._guideTargets.length > 0) {
            const target: Node = this._guideTargets[0].target;
            if (target.getComponent(Button)) {
                if (!target['guideTouchRegist']) {
                    target['guideTouchRegist'] = true;
                    EventSystem.addClickEventHandler(target, this, 'onClicked');
                }
            }
            else {
                this.error(this.execGuide, `'${this._guideTargets[0].target.name}'目标节点缺少'Button'组件！`);
            }
        }
    }

    onClicked() {
        if (this._canClick) {
            this._canClick = false;
            this._tweenAction.stop();
            this.currentGuideComplete().then(() => GuideManager.instance.guideContinue());
        }
    }

    //修正手指的翻转
    private fingerTurn() {
        const fingerUI = this.finger.getComponent(UITransform);
        let width: number = fingerUI.width * (1 - fingerUI.anchorX);
        if (this.finger.position.x > 0) {
            let distance: number = app.adapter.getScreenSize().width / 2 - this.finger.position.x;
            if (width > distance) {
                this.finger.scale.set(-1, this.finger.scale.y);
                this.finger.scale.set()
            }
        }
        else if (this.finger.position.x < 0) {
            let distance: number = this.finger.position.x - app.adapter.getScreenSize().width / 2;
            if (width > distance) {
                this.finger.scale.set(1, this.finger.scale.y);
            }
        }
    }

    //手指移动
    private fingerMove() {
        let posisions: Vec3[] = GuideManager.instance.getTargetPosition();
        if (posisions.length > 0) {
            const data = GuideManager.instance.guideAction.getData<IFingerAction>();
            const easing = data.easing;
            this.playAnimat(false);
            //计算手指和引导目标两点距离
            const dis0: number = utils.MathUtil.Vector2D.distance(this.finger.position, v3(posisions[0].x, posisions[0].y));
            //计算移动时间
            const t0: number = dis0 / GuideManager.instance.fingerSpeed;
            this._tweenAction = tween(this.finger).to(t0, {position: v3(posisions[0].x, posisions[0].y)}, {easing: easing});
            
            if (posisions.length > 1) {
                const len = posisions.length;
                const currentPos = v3();
                for (let i = 1; i < len; ++i) {
                    currentPos.set(posisions[i - 1].x, posisions[i - 1].y);
                    const pos = v3(posisions[i].x, posisions[i].y);
                    const d = utils.MathUtil.Vector2D.distance(currentPos, pos);
                    const fingerSpeed = data.speed * 200; //手指循环移动速度
                    const t = d / fingerSpeed;
                    this._tweenAction.to(t, {position: pos}, {easing: easing});
                }
                this._tweenAction.call(() => this.tweenActionCall(len));
                this._tweenAction.repeat(data.repeatTotal, this._tweenAction);
            }
            else {
                this._tweenAction.call(() => this.tweenActionCall(posisions.length));
            }
            this._tweenAction.start();
        }
    }

    private tweenActionCall(len: number) {
        this._repeatCount++;
        if (this._repeatCount === 1) {
            GuideManager.instance.hideBlockInputLayer();
            this._canClick = true;
        }
        if (len === 1) {
            this.playAnimat(true);
        }
    }

    private playAnimat(play: boolean) {
        if (!this._effectTweenAnimat) {
            this._effectTweenAnimat = tweenAnimat(this._effect);
        }
        if (play) {
            this._effectTweenAnimat.defaultClip().play().catch(err => {
                this.error(this.playAnimat, "手指引导动画执行错误：", err);
            });
        }
        else {
            this._effectTweenAnimat.defaultClip().onStop(() => {
                const len = this._effect.children.length;
                for (let i: number = 0; i < len; ++i) {
                    this._effect.children[i].active = false;
                    if (this._effect.children[i].getComponent(Animation)) {
                        tweenAnimat(this._effect.children[i]).defaultClip().stop();
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

    //当前这一步引导完成，下一步引导执行
    private currentGuideComplete() {
        return new Promise((resolve, reject) => {
            if (!this._clicked && this._guideTargets && this._lightTargets) {
                this._clicked = true;
                const guideTargets = this._guideTargets;
                const lightTargets = this._lightTargets;
                for (let guideTarget of guideTargets) {
                    const guideIds = guideTarget.guideIds;
                    const len = guideIds.length;
                    for (let i: number = 0; i < len; ++i) {
                        if (this._guideInfo.guideId === guideIds[i]) {
                            guideIds.splice(i, 1);
                            let index: number = 0;
                            for (let ele of lightTargets) {
                                restoreParent(ele, this._targetZIndex[index], this._lightParents[index++]);
                            }
                            this._targetZIndex.splice(0, this._targetZIndex.length);
                            this._lightParents.splice(0, this._lightParents.length);
                            this.node.active = false;
                            resolve(true);
                            break;
                        }
                    }
                }
            }
            else {
                reject();
            }
        });
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
        
    }
}
