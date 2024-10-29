import { SAFE_CALLBACK } from "../Define";
import { ClipLoad } from "../res/LoadAnimation";
import { AnimatBase } from "./AnimatBase";
import { Animation, AnimationClip, AnimationState, Node } from "cc";
import { cck_animat_frameAnimat_type, cck_animat_resolved_type, IFrameAnimat } from "../lib.cck";
import { utils } from "../utils";

export  class FrameAnimat extends AnimatBase<cck_animat_frameAnimat_type> {
    private _animator: Animation;
    private static isStop: boolean = false;
    constructor(target: Node, bundle: string) {
        super(() => {
            if (FrameAnimat.isStop && this._animatList) {
                this._animatList.forEach(animat => {
                    animat.props.played = true;
                });
                this.stop();
            }
            FrameAnimat.isStop = false;
        });

        this._animatLoad = new ClipLoad(bundle)
        this._target = target;
        this._animator = this._target.getComponent(Animation);
        if (!this._animator) {
            this._status = 'rejected';
            this._err = new Error('该节点没有Animation组件!');
            this.callRejected();
        }
    }

    public static stopAll(): void {
        this.isStop = true;
    }

    public getAnimation(): Animation {
        return this._animator;
    }

    public addCallback(callback: cck_animat_resolved_type): void {
        if (this._animatList.length > 0) {
            const len: number = this._animatList.length;
            const animat = this._animatList.back(len - 1);
            animat.callbacks.push(callback);
        }
    }

    public addAnimatProps(props: IFrameAnimat): void {
        try {
            props.delay = props.delay ? props.delay : 0;
            // props.loop = props.loop ? props.loop : false;
            props.repeatCount = props.repeatCount;
            props.startTime = props.startTime ? props.startTime : 0;
            props.default = props.default ? props.default : false;
            props.played = props.played ? props.played : false;

            if (props.default) {
                props.name = this._animator.defaultClip.name;
            }
            this._animatList.push({ props: props, callbacks: [] });
        } catch (error) {
            this._status = 'rejected';
            this._err = error;
            this.callRejected();
        }
    }

    //加载clip动画
    public async animationLoaded(props: IFrameAnimat) {
        if (props.clip) {
            this.addClip(props.clip);
        }
        else {
            let asset = await this.awaitLoad(Animation, props.url);
            if (asset) {
                this.addClip(asset);
            }
        }
    }

    public play(): FrameAnimat {
        try {
            if (this._status === 'pending') {
                this._status = 'resolved';
                const animat = this._animatList.back(this.index);
                let props: IFrameAnimat = animat.props;
                //没有播放完成
                if (!props.played) {
                    let state: AnimationState = this._animator.getState(props.name);
                    state.delay = props.delay;
                    state.time = props.startTime;
                    //迭代播放动画若干次
                    if (!utils.isUndefined(props.repeatCount) && !utils.isNull(props.repeatCount)) {
                        state.repeatCount = props.repeatCount;
                    }
                    
                    if (utils.isUndefined(props.speed) && utils.isNull(props.speed)) {
                        state.speed = props.speed;
                    }
                    if (props.duration !== undefined && props.duration !== null) {
                        state.duration = props.duration;
                    }
                    this.registerEvent();
                    this._animator.play(props.name);
                }
            }
        } catch (error) {
            this._status = 'rejected';
            this._err = error;
            this.callRejected();
        }
        return this;
    }

    public onNext(callback: Function): FrameAnimat {
        this._nextCallback = callback;
        return this;
    }

    public stop(): FrameAnimat {
        this._animator.stop();
        return this;
    }

    public catch(reject: (e: Error) => void): void {
        if (this._status === 'rejected') {
            SAFE_CALLBACK(reject, this._err);
        }
        else {
            this._rejected = reject;
        }
    }

    public pause(): FrameAnimat {
        this._animator.pause();
        return this;
    }

    public resume(): FrameAnimat {
        this._animator.resume();
        return this;
    }

    private addClip(clip: AnimationClip): void {
        this._animator.addClip(clip);
    }

    private registerEventPlay() {
        this._animator.once(Animation.EventType.PLAY, (evt) => {
            if (this._animatList.length > 0) {
                const animat = this._animatList.back(this.index);
                let callbacks: cck_animat_resolved_type[] = animat.callbacks;
                for (let e of callbacks) {
                    if (e.type === "play") {
                        SAFE_CALLBACK(e.call, evt);
                    }
                }
            }
        }, this);
    }

    private registerEventStop() {
        this._animator.once(Animation.EventType.STOP, (evt) => {
            if (this._animatList.length > 0) {
                const animat = this._animatList.back(this.index);
                let callbacks: cck_animat_resolved_type[] = animat.callbacks;
                for (let e of callbacks) {
                    if (e.type === "stop") {
                        SAFE_CALLBACK(e.call, evt);
                    }
                }
                this._status = "pending";
                this.index++;
                if (this.index < this._animatList.length) {
                    SAFE_CALLBACK(this._nextCallback);
                }
                else {
                    this.reset();
                }
            }
        }, this);
    }

    private registerEvent(): void {
        this.registerEventPlay();
        this.registerEventStop();
    }
}