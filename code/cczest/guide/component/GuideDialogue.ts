import { Component, game, Node, UITransform, _decorator } from "cc";
import { EDITOR } from "cc/env";
import { GuideManager } from "../GuideManager";
import { createText, createTip, curText } from "../guide_utils";
import { Debug } from "../../Debugger";
import { utils } from "../../utils";
import { instantiate } from "cc";
import { Animation } from "cc";
import { tween } from "cc";
import { ActorAction, ActorMoveModel, SourceType, TweenEasingType } from "../GuideEnum";
import { TweenEasing } from "cc";
import { find } from "cc";
import { IDialogAction, IGuideComponent, ITweenAnimat, ITweenAudio } from "zest";
import { Res } from "../../res/Res";
import { tweenAnimat, TweenAudio, tweenAudio } from "../../animat_audio";
import { v3 } from "cc";
import { Sprite } from "cc";
import { Layers } from "cc";
import { sp } from "cc";
import { UIOpacity } from "cc";
import { RichText } from "cc";
import { dragonBones } from "cc";
import { Size } from "cc";

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
export  class GuideDialogue extends Component implements IGuideComponent {

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
        range: [0, 1, 0.02],
        tooltip: '文字显示的时间间隔(秒)',
        slide: true
    })
    private duration: number = 0.1;

    private _playText: boolean = false;
    private _timeout: number = 0;
    private _descript: string;
    private _roleMap: Map<string, Node>;
    private _currentText: RichText;
    private _tweenAnimat: ITweenAnimat;
    private _tempStrArr: string[] = [];
    private _actorAction: string;
    private _tweenAudio: ITweenAudio;

    onLoad () {
        this.node.getComponent(UITransform).setContentSize(new Size(2000, 2000));
        this.createNode();
        const rate = typeof game.frameRate === "string" ? parseInt(game.frameRate) : game.frameRate;
        if (this.duration < (1 / rate)) {
            this.duration = 1 / rate;
        }
        if (!EDITOR) {
            this.init();
            this.node.on(Node.EventType.TOUCH_START, function() {}, this);
            this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
        }
    }

    start () {
        
    }

    init() {
        this._playText = false;
        this._timeout = 0;
        this._roleMap =new Map();
    }

    private createNode() {
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
        if (this._actorAction === ActorAction.DIALOG) {
            if (this._tweenAudio) {
                this._tweenAudio.stop();
            }
            if (this._tempStrArr.length > 0 && this._playText) {
                this._currentText.string = this._descript;
                this._playText = false;
                this.tip.active = true;
                this._tempStrArr = null;
                this._tempStrArr = [];
            }
            else if (this._tempStrArr.length === 0) {
                GuideManager.instance.guideContinue();
            }
        }
    }

    doGuideSkip(): void {
        this.node.active = false;
        GuideManager.instance.guideSkipAll();
    }

    execGuide() {
        this.log(this.execGuide, "开始执行对话引导！");
        this._timeout     = 0;
        this.tip.active   = false;
        const data        = GuideManager.instance.guideAction.getData<IDialogAction>();
        this._descript    = data.descript;
        this._actorAction = data.actorAction;
        if (this._actorAction === ActorAction.DIALOG) {
            //演员对话
            this.actorDialog(data);
        }
        else {
            if (this._actorAction === ActorAction.INTO) {
                //演员进场
                this.actorInto(data);
            }
            else if (this._actorAction === ActorAction.OUT) {
                //演员退场
                this.actorOut(data);
            }
        }
    }

    clear(): void {
        if (this._tweenAnimat) {
            this._tweenAnimat.clear();
        }
        if (this._tweenAudio) {
            this._tweenAudio.clear();
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

    private actorDialog(data: IDialogAction) {
        const roleId = data.roleId;
        if (!this._roleMap.has(roleId)) {
            this.error(this.execGuide, "没有创建演员，请在对话引导前先增加演员入场行为！");
        }
        else {
            const sourceType = data.sourceType;
            const role = this._roleMap.get(roleId);
            role.getChildByName("textNode").active = true;
            const text = find("textNode/text", role);
            this._currentText = text.getComponent(RichText);
            this._currentText.string = "";
            curText(this._descript, this._tempStrArr);
            //播放音频
            const audio = data.audio.replace(new RegExp(".mp3"), "");
            if (audio.length > 0) {
                if (!this._tweenAudio) {
                    this._tweenAudio = tweenAudio("guide").audio(TweenAudio.Model.ORDER);
                }
                this._tweenAudio.effect({
                    url: audio,
                    oneShot: false
                }).onPlay(() => {
                    this._playText = true;
                    this.startDialog(data, sourceType, role);
                }).play().catch(err => {
                    this.error(this.actorDialog, err);
                });
            }
            else {
                this._playText = true;
                this.startDialog(data, sourceType, role);
            }
        }
    }

    private startDialog(data: IDialogAction, sourceType: string, role: Node) {
        const animatName = data.animatName;
        if (sourceType === SourceType.SPINE) {
            if (animatName.length > 0) {
                this._tweenAnimat.target(role).spine({name: animatName}).play().catch(err => {
                    this.error(this.actorDialog, err);
                });
            }
        }
        else if (sourceType === SourceType.DRAGON_BONES) {
            if (animatName.length > 0) {
                this._tweenAnimat.target(role).db({name: animatName}).play().catch(err => {
                    this.error(this.actorDialog, err);
                });
            }
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
                this.actorMove(roleNode, data.position.x, data.position.y, data.duration, data.easing).then(() => {
                    this.node.removeChild(roleNode);
                    this._roleMap.delete(roleId);
                    roleNode.destroy();
                    this.node.active = false;
                });
                break;
            case ActorMoveModel.FADE_OUT:
                //演员以淡入的方式离场
                this.actorFadeOut(roleNode, data.duration, data.easing).then(() => {
                    this.node.removeChild(roleNode);
                    this._roleMap.delete(roleId);
                    roleNode.destroy();
                });
                break;
            default: 
                break;
        }
    }

    private loadRoleAsset(roleNode: Node, data: IDialogAction) {
        return new Promise<boolean>((resolve, reject) => {
            const sourceType = data.sourceType;
            if (sourceType === SourceType.IMAGE) {
                if (!roleNode.getComponent(Sprite)) {
                    roleNode.addComponent(Sprite);
                }
                const loader = Res.getLoader(GuideManager.instance.bundle);
                const source = data.source.replace(new RegExp(".png"), "").replace(new RegExp(".jpg"), "");
                loader.setSpriteFrame(roleNode, source).then(flag => {
                    resolve(flag);
                }).catch(err => {
                    reject(err);
                });
            }
            else if (sourceType === SourceType.SPINE) {
                if (!roleNode.getComponent(sp.Skeleton)) {
                    const skeleton = roleNode.addComponent(sp.Skeleton);
                    skeleton.loop = false;
                    skeleton.premultipliedAlpha = false;
                }
                if (!this._tweenAnimat) {
                    this._tweenAnimat = tweenAnimat(roleNode, GuideManager.instance.bundle);
                }
                else {
                    this._tweenAnimat.target(roleNode);
                }
                const source = data.source.replace(new RegExp(".json"), "");
                this._tweenAnimat.spine({
                    name: data.animatName,
                    url: source
                }).onStop(() => {
                    resolve(true);
                }).play().catch(err => {
                    reject(err);
                });
            }
            else if (sourceType === SourceType.DRAGON_BONES) {
                if (!roleNode.getComponent(dragonBones.ArmatureDisplay)) {
                    roleNode.addComponent(dragonBones.ArmatureDisplay);
                }
                if (!this._tweenAnimat) {
                    this._tweenAnimat = tweenAnimat(roleNode, GuideManager.instance.bundle);
                }
                else {
                    this._tweenAnimat.target(roleNode);
                }
                const source = data.source.replace(new RegExp(".json"), "");
                this._tweenAnimat.db({
                    name: data.animatName,
                    url: source
                }).onStop(() => {
                    resolve(true);
                }).play().catch(err => {
                    reject(err);
                });
            }
        });
    }

    private actorMove(actor: Node, x: number, y: number, duration: number, easingType: TweenEasing) {
        return new Promise(resolve => {
            let easingObj: {easing: TweenEasing};
            if (TweenEasingType.indexOf(easingType) > -1) {
                easingObj = {easing: easingType};
            }
            tween(actor).to(duration, {position: _vec3Temp.set(x, y)}, easingObj).call(() => {
                resolve(true);
                GuideManager.instance.guideContinue();
            }).start();
        });
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
        let easingObj: {easing: TweenEasing};
        if (TweenEasingType.indexOf(easingType) > -1) {
            easingObj = {easing: easingType};
        }
        tween(uiOpacity).to(duration, {opacity: 255}, easingObj).call(() => {
            GuideManager.instance.guideContinue();
        }).start();
    }

    private actorFadeOut(actor: Node, duration: number, easingType: TweenEasing) {
        return new Promise(resolve => {
            const uiOpacity = actor.getComponent(UIOpacity);
            let easingObj: {easing: TweenEasing};
            if (TweenEasingType.indexOf(easingType) > -1) {
                easingObj = {easing: easingType};
            }
            tween(uiOpacity).to(duration, {opacity: 0}, easingObj).call(() => {
                resolve(true);
                this.node.active = false;
                GuideManager.instance.guideContinue();
            }).start();
        });
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
                this._currentText.string = this._tempStrArr.pop();
                if (this._tempStrArr.length === 0) {
                    this._playText = false;
                    this.tip.active = true;
                }
            }
        }
    }
}
