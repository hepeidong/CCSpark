import { SAFE_CALLBACK } from "../Define";
import { SpineLoad } from "../res/LoadAnimation";
import { AnimatBase } from "./AnimatBase";
import { Node, sp } from "cc";
import { cc_spark_animat_resolved_type, cc_spark_animat_spineAnimat_type, ISpineAnimat } from "../lib.ccspark";
import { tools } from "../tools";


export  class SpineAnimat extends AnimatBase<cc_spark_animat_spineAnimat_type> {
    private _skeleton: sp.Skeleton;
    private _frameRate: number = 30; //动画帧率
    private static isStop: boolean = false;
    constructor(target: Node, bundle: string) {
        super(() => {
            if (SpineAnimat.isStop && this._animatList) {
                this._animatList.forEach(animat => {
                    animat.props.played = true;
                });
                this.stop();
            }
            SpineAnimat.isStop = false;
        });

        this._animatLoad = new SpineLoad(bundle);
        this.target(target);
    }

    public static stopAll(): void {
        this.isStop = true;
    }

    public target(target: Node): void {
        this._target = target;
        this._skeleton = this._target.getComponent(sp.Skeleton);
        if (!this._skeleton) {
            this._status = 'rejected';
            this._err = new Error('该结点没有 Skeleton 组件！');
            this.callRejected();
        }
        else {
            this.registerEvent();
        }
    }

    public pause(): SpineAnimat {
        this._skeleton.paused = true;
        return this;
    }

    public resume(): SpineAnimat {
        this._skeleton.paused = false;
        return this;
    }

    public getSkeleton(): sp.Skeleton {
        return this._skeleton;
    }

    public addCallback(callback: cc_spark_animat_resolved_type) {
        if (this._animatList.length > 0) {
            const len: number = this._animatList.length;
            const animat = this._animatList.back(len - 1);
            animat.callbacks.push(callback);
        }
    }

    public setSkeletonData(data: sp.SkeletonData) {
        this._skeleton.skeletonData = data;
    }

    public addAnimatProps(props: ISpineAnimat): void {
        try {
            props.delay = props.delay ? props.delay : 0;
            props.loop = props.loop ? props.loop : false;
            props.repeatCount = props.repeatCount ? props.repeatCount : 1;
            props.trackIndex = (props.trackIndex === null || props.trackIndex === undefined) ? 0 : props.trackIndex;
            props.played = props.played ? props.played : false;

            this._animatList.push({props: props, callbacks: []});
        } catch (error) {
            this._status = 'rejected';
            this._err = error;
            this.callRejected();
        }
    }

    /**
     * 指定帧播放动画
     */
    private setSpineAniWithFrame(props: ISpineAnimat): void{
        let trackEntry = this._skeleton.getCurrent(props.trackIndex);
        let duration = trackEntry.animation.duration;//动画时长
        let frames = Math.ceil(this._frameRate * duration);//总帧数
        let secondsPerFrame = 1 / this._frameRate;//一帧时间

        props.beginFrame = props.beginFrame || 1;
        props.endFrame = props.endFrame || frames;
        let beginTime = props.beginFrame * secondsPerFrame;
        let endTime = props.endFrame * secondsPerFrame;
        if (beginTime <= 0) beginTime = 0;
        if (endTime >= duration) endTime = duration;

        this._skeleton.timeScale = 0;
        trackEntry.animationStart = beginTime;  //开始时间
        trackEntry.animationEnd = endTime; //结束时间
        this._skeleton.timeScale = 1;
    }

    //加载spine骨骼动画
    public async skeletonLoaded(props: ISpineAnimat) {
        if (props.url) {
            let asset = await this.awaitLoad(sp.Skeleton, props.url);
            if (asset) {
                this.setSkeletonData(asset);
            }
        }
    }

    public play(): SpineAnimat {
        try {
            if (this._status === 'pending') {
                this._status = 'resolved';
                const animat = this._animatList.back(this.index);
                let props: ISpineAnimat = animat.props;
                if (!props.played) {
                    if (this.index === 0) {
                        this.playInterval();
                    }
                    else {
                        props.repeatCount--;
                        if (props.beginFrame) {
                            this.setSpineAniWithFrame(props);
                        }
                        this._skeleton.addAnimation(props.trackIndex, props.name, props.loop, props.delay);
                    }
                }
            }
        } catch (error) {
            this._status = 'rejected';
            this._err = error;
            this.callRejected();
        }
        return this;
    }

    public onNext(callback: Function): SpineAnimat {
        this._nextCallback = callback;
        return this;
    }

    public stop(): SpineAnimat {
        this._target.pauseSystemEvents(true);
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

    private playInterval() {
        const animat = this._animatList.back(this.index);
        const delay = animat.props.delay;
        tools.Timer.setInterval(() => {
            const cuurAnimat = this._animatList.back(this.index);
            let props: ISpineAnimat = cuurAnimat.props;
            props.repeatCount--;
            this._skeleton.setAnimation(props.trackIndex, props.name, props.loop);
        }, delay);
    }

    private registerEventStart() {
        this._skeleton.setStartListener((evt: any) => {
            if (this._animatList.length > 0) {
                const animat = this._animatList.back(this.index);
                let callbacks: cc_spark_animat_resolved_type[] = animat.callbacks;
                for (let e of callbacks) {
                    if (e.type === 'play') {
                        SAFE_CALLBACK(e.call, evt);
                    }
                }
            }
        });
    }

    private registerEventComplete() {
        this._skeleton.setCompleteListener((evt: any) => {
            if (this._animatList.length > 0) {
                const animat = this._animatList.back(this.index);
                for (let e of animat.callbacks) {
                    if (e.type === 'stop') {
                        SAFE_CALLBACK(e.call, evt);
                    }
                }
                const props = animat.props;
                //迭代播放动画若干次
                if (!props.loop) {
                    if (props.repeatCount > 0) {
                        props.repeatCount--;
                        this._skeleton.setAnimation(props.trackIndex, props.name, false);
                    }
                    else {
                        this._status = 'pending';
                        this.index++;
                        if (this.index < this._animatList.length) {
                            SAFE_CALLBACK(this._nextCallback);
                        }
                        else {
                            this.reset();
                        }
                    }
                }
            }
        });
    }

    private registerEvent(): void {
        this.registerEventStart();
        this.registerEventComplete();
    }
}