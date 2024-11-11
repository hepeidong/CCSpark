import { Component, game, Label, Node, UITransform, _decorator } from "cc";
import { EDITOR } from "cc/env";
import { GuideManager } from "../GuideManager";
import { createSprite, createText, createTip } from "../guide_utils";
import { Debug } from "../../Debugger";
import { utils } from "../../utils";
import { instantiate } from "cc";
import { Animation } from "cc";
import { tween } from "cc";
import { ActorAction, ActorMoveModel, SourceType, TweenEasingType } from "../GuideEnum";
import { Vec3 } from "cc";
import { TweenEasing } from "cc";
import { find } from "cc";
import { IDialogAction, ITweenAnimat } from "../../lib.ccspark";
import { Res } from "../../res/Res";
import { tweenAnimat } from "../../animat_audio";
import { v3 } from "cc";
import { Sprite } from "cc";
import { Layers } from "cc";
import { SpriteFrame } from "cc";
import { sp } from "cc";
import { UIOpacity } from "cc";

const _vec3Temp = v3();

const {
    ccclass, 
    property, 
    executeInEditMode, 
    disallowMultiple
} = _decorator;

@ccclass("GuideDialogue")
@executeInEditMode
@disallowMultiple
export  class GuideDialogue extends Component {

    @property({
        type: Node,
        tooltip: '角色模板'
    })
    private roleTemp: Node = null;

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
    private _roleMap: Map<string, Node>;
    private _currentText: Label;
    private _tweenAnimat: ITweenAnimat;

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
        this._roleMap =new Map();
    }

    createNode() {
        if (!this.roleTemp) {
            this.roleTemp = new Node("role");
            this.roleTemp.layer = Layers.Enum.UI_2D;
            this.roleTemp.addComponent(UITransform);
            this.node.addChild(this.roleTemp);
            const textNode = new Node("textNode");
            textNode.layer = Layers.Enum.UI_2D;
            textNode.addComponent(UITransform);
            textNode.addComponent(Animation);
            const text = createText("text");
            textNode.addChild(text);
            this.roleTemp.addChild(textNode);
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

        const data = GuideManager.instance.guideAction.getData<IDialogAction>();
        const actorAction = data.actorAction;
        if (actorAction === ActorAction.DIALOG) {
            if (this._charIndex === this._descript.length) {
                // this.node.active = false;
                GuideManager.instance.guideContinue();
            }
        }
    }

    execGuide() {
        this.log(this.execGuide, "开始执行对话引导！");
        this._charIndex = 0;
        this._timeout   = 0;
        this.node.active = true;
        this.tip.active  = false;
        this._descript   = GuideManager.instance.guideAction.descript;
        const data = GuideManager.instance.guideAction.getData<IDialogAction>();
        const roleId = data.roleId;
        const actorAction = data.actorAction;
        if (actorAction === ActorAction.DIALOG) {
            //演员对话
            this.actorDialog(roleId);
        }
        else {
            if (actorAction === ActorAction.INTO) {
                //演员进场
                this.actorInto(data);
            }
            else if (actorAction === ActorAction.OUT) {
                //演员退场
                this.actorOut(data);
            }
        }
    }

    private actorInto(data: IDialogAction) {
        const roleId = data.roleId;
        if (!this._roleMap.has(roleId)) {
            const newRole = instantiate(this.roleTemp);
            this.node.addChild(newRole);
            this._roleMap.set(roleId, newRole);
        }
        const roleNode = this._roleMap.get(roleId);
        roleNode.getChildByName("textNode").active = false;
        //加载图片资源
        this.loadRoleAsset(roleNode, data).then(() => {
            //入场的方式
            const actorMoveModel = data.actorMoveModel;
            //入场的动画
            switch(actorMoveModel) {
                case ActorMoveModel.MOVE:
                    //角色移动的方式入场
                    _vec3Temp.set(data.startPosition.x, data.startPosition.y);
                    roleNode.position = _vec3Temp;
                    this.actorMove(roleNode, data.position.x, data.position.y, data.duration, data.easing);
                    break;
                case ActorMoveModel.FADE_IN:
                    //演员以淡入的方式入场
                    _vec3Temp.set(data.startPosition.x, data.startPosition.y);
                    roleNode.position = _vec3Temp;
                    this.actorFadeIn(roleNode, data.duration, data.easing);
                    break;
                default: 
                    break;
            }
        }).catch(err => {
            this.error(this.execGuide, err);
        });
    }

    private actorDialog(roleId: string) {
        if (!this._roleMap.has(roleId)) {
            this.error(this.execGuide, "没有创建演员，请在对话引导前先增加演员入场行为！");
        }
        else {
            this._playText = true;
            const role = this._roleMap.get(roleId);
            role.getChildByName("textNode").active = true;
            const text = find("textNode/text", role);
            this._currentText = text.getComponent(Label);
            this._currentText.string = "";
        }
    }

    private actorOut(data: IDialogAction) {
        const roleId = data.roleId;
        const roleNode = this._roleMap.get(roleId);
        roleNode.getChildByName("textNode").active = false;
        const actorMoveModel = data.actorMoveModel;
        //离场的动画
        switch(actorMoveModel) {
            case ActorMoveModel.MOVE:
                //角色移动的方式离场
                this.actorMove(roleNode, data.startPosition.x, data.startPosition.y, data.duration, data.easing);
                break;
            case ActorMoveModel.FADE_OUT:
                //演员以淡入的方式离场
                this.actorFadeOut(roleNode, data.duration, data.easing);
                break;
            default: 
                break;
        }
    }

    private loadRoleAsset(roleNode: Node, data: IDialogAction) {
        return new Promise<null>((resolve, reject) => {
            if (data.sourceType === SourceType.IMAGE) {
                try {
                    if (!roleNode.getComponent(Sprite)) {
                        roleNode.addComponent(Sprite);
                    }
                    const loader = Res.getLoader(GuideManager.instance.bundble);
                    loader.load(data.source, SpriteFrame, (err, asset) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            loader.setSpriteFrame(roleNode, data.source);
                            resolve(null);
                        }
                    });
                    
                } catch (error) {
                    reject(error);
                }
            }
            else if (data.sourceType === SourceType.SPINE) {
                if (!roleNode.getComponent(sp.Skeleton)) {
                    roleNode.addComponent(sp.Skeleton);
                }
                if (!this._tweenAnimat) {
                    this._tweenAnimat = tweenAnimat(roleNode, GuideManager.instance.bundble);
                }
                else {
                    this._tweenAnimat.target(roleNode);
                }
                this._tweenAnimat.spine({
                    name: data.name,
                    url: data.source
                }).play().catch(err => {
                    reject(err);
                }).onStop(() => {
                    resolve(null);
                });
            }
        });
    }

    private actorMove(actor: Node, x: number, y: number, duration: number, easingType: TweenEasing) {
        if (TweenEasingType.indexOf(easingType) > -1) {
            tween(actor).to(duration, {position: _vec3Temp.set(x, y)}, {easing: easingType}).call(() => {
                GuideManager.instance.guideContinue();
            }).start();
        }
        else {
            tween(actor).to(duration, {position: _vec3Temp.set(x, y)}).call(() => {
                GuideManager.instance.guideContinue();
            }).start();
        }
    }

    private actorFadeIn(actor: Node, duration: number, easingType: TweenEasing) {
        let uiOpacity: UIOpacity;
        if (!actor.getComponent(UIOpacity)) {
            uiOpacity = actor.addComponent(UIOpacity);
        }
        else {
            uiOpacity = actor.getComponent(UIOpacity);
        }
        uiOpacity.opacity = 0;
        if (TweenEasingType.indexOf(easingType) > -1) {
            tween(uiOpacity).to(duration, {opacity: 255}, {easing: easingType}).call(() => {
                GuideManager.instance.guideContinue();
            }).start();
        }
        else {
            tween(uiOpacity).to(duration, {opacity: 255}).call(() => {
                GuideManager.instance.guideContinue();
            }).start();
        }
    }

    private actorFadeOut(actor: Node, duration: number, easingType: TweenEasing) {
        const uiOpacity = actor.getComponent(UIOpacity);
        if (TweenEasingType.indexOf(easingType) > -1) {
            tween(uiOpacity).to(duration, {opacity: 0}, {easing: easingType}).call(() => {
                GuideManager.instance.guideContinue();
            }).start();
        }
        else {
            tween(uiOpacity).to(duration, {opacity: 0}).call(() => {
                GuideManager.instance.guideContinue();
            }).start();
        }
    }

    start () {
        
    }

    private log(fn: Function, ...subst: any[]) {
        Debug.log(utils.StringUtil.format("[GuideDialogue:%s]", fn.name), ...subst);
    }

    private error(fn: Function, ...subst: any[]) {
        Debug.error(utils.StringUtil.format("[GuideDialogue:%s]", fn.name), ...subst);
    }

    update (dt: number) {
        if (this._playText) {
            this._timeout += dt;
            if (this._timeout >= this.duration) {
                this._timeout = 0;
                this._currentText.string += this._descript[this._charIndex++];
                if (this._charIndex >= this._descript.length) {
                    this._playText = false;
                    this.tip.active = true;
                }
            }
        }
    }
}
