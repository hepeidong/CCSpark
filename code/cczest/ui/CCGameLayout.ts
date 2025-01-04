import { SAFE_CALLBACK, SAFE_CALLBACK_CALLER } from "../Define";
import { IGameLayout, ITweenAnimat } from "zest";
import { CCBaseLayout } from "../app/CCBaseLayout";
import { Animation, AnimationClip, Button, Node, Tween, tween, v3, _decorator } from "cc";
import { EventSystem } from "../event";
import { TweenAnimat, tweenAnimat, TweenAudio } from "../animat_audio";

const _vec3Temp_1 = v3(1.3, 1.3, 1);
const _vec3Temp_2 = v3(1, 1, 1);
const _vec3Temp_3 = v3(0, 0, 1);

const {ccclass, property} = _decorator;

@ccclass("GameLayoutProperty")
class GameLayoutProperty {
    @property({
        type: AnimationClip,
        displayName: "窗口弹出动画"
    })
    popupClip: AnimationClip = null;

    @property({
        type: AnimationClip,
        displayName: "窗口关闭动画"
    })
    closeClip: AnimationClip = null;

    @property({
        type: Node,
        displayName: "返回按钮"
    })
    backBtn: Node = null;
}

@ccclass("CCGameLayout")
export class CCGameLayout extends CCBaseLayout implements IGameLayout {

    @property(GameLayoutProperty)
    private gameLayoutProperty: GameLayoutProperty = new GameLayoutProperty();


    onLoad() {
        let animat: Animation = this.node.getComponent(Animation);
        if (!animat) {
            animat = this.node.addComponent(Animation);
        }
        this.gameLayoutProperty.popupClip && animat.addClip(this.gameLayoutProperty.popupClip);
        this.gameLayoutProperty.closeClip && animat.addClip(this.gameLayoutProperty.closeClip);
    }

    private _popupAction: Tween<Node>;
    private _closeAction: Tween<Node>;
    private _startFn: Function;
    private _startCaller: any;
    private _completeFn: Function;
    private _completeCaller: any;
    private _bundleName: string;
    private _tweenAnimat: ITweenAnimat;

    start() {
        
    }

    /**创建TweenAnimat对象 */
    public createTweenAnimat() {
        return TweenAnimat.create(this._bundleName);
    }

    /**创建TweenAudio对象 */
    public createTweenAudio() {
        return TweenAudio.create(this._bundleName);
    }

    public popup(): void {
        if (this.gameLayoutProperty.popupClip) {
            this.playAnimat(this.gameLayoutProperty.popupClip.name, this._startFn, this._startCaller);
        }
        else if (this._popupAction) {
            this.node.scale.set(0, 0);
            this._popupAction.start();
        }
        else {
            SAFE_CALLBACK_CALLER(this._startFn, this._startCaller);
        }
    }

    public close(): void {
        if (this.gameLayoutProperty.closeClip) {
            this.playAnimat(this.gameLayoutProperty.closeClip.name, this._completeFn, this._completeCaller);
        }
        else if (this._closeAction) {
            this._closeAction.start();
        }
        else {
            SAFE_CALLBACK_CALLER(this._completeFn, this._completeCaller);
        }
    }

    /**
     * 弹起窗口时执行的回调
     * @param listener 
     * @param caller 
     */
    public setStartListener(listener: Function, caller: any): void {
        this._startFn = listener;
        this._startCaller = caller;
    }

    /**
     * 弹起窗口后执行的回调
     * @param listener 
     * @param caller 
     */
    public setCompleteListener(listener: Function, caller: any): void {
        this._completeFn = listener;
        this._completeCaller = caller;
    }

    public setPopupSpring() {
        const tween1 = tween(this.node).to(0.1, {scale: _vec3Temp_1});
        const tween2 = tween(this.node).to(0.1, {scale: _vec3Temp_2}).call(() => {
            SAFE_CALLBACK_CALLER(this._startFn, this._startCaller);
        });
        this._popupAction = tween(this.node).sequence(tween1, tween2);
        this._closeAction = this.getCloseAction();
    }

    public setBackBtnListener(listener: Function) {
        if (this.gameLayoutProperty.backBtn) {
            if (this.gameLayoutProperty.backBtn.getComponent(Button)) {
                EventSystem.click(this.gameLayoutProperty.backBtn, this, () => {
                    SAFE_CALLBACK(listener);
                })
            }
            else {
                this.gameLayoutProperty.backBtn.on(Node.EventType.TOUCH_START, () => {}, this);
                this.gameLayoutProperty.backBtn.on(Node.EventType.TOUCH_END, () => {
                    SAFE_CALLBACK(listener);
                }, this);
            }
        }
    }

    private getCloseAction() {
        const tween1 = tween(this.node).to(0.1, {scale: _vec3Temp_3}).call(() => {
            SAFE_CALLBACK_CALLER(this._completeFn, this._completeCaller);
        });
        return tween1;
    }

    private playAnimat(name: string, callback: Function, caller: any) {
        if (!this._tweenAnimat) {
            this._tweenAnimat = tweenAnimat(this.node);
        }
        this._tweenAnimat.clip({name: name}).onStop(() => {
            SAFE_CALLBACK_CALLER(callback, caller);
        }).play();
    }
    // update (dt) {}
}
