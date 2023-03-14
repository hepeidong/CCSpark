import { dragonBones, Node } from "cc";
import { cck_animat_dragonBonesAnimat_type, cck_animat_resolved_type, cck_animat_spineAnimat_type, IDragonBonesAnimat } from "../lib.cck";
import { Debug } from "../Debugger";
import { SAFE_CALLBACK } from "../Define";
import { DBLoad } from "../res/LoadAnimation";
import { utils } from "../utils";
import { AnimatBase } from "./AnimatBase";

export  class DragonBonesAnimat extends AnimatBase {
    private _selfDB: dragonBones.ArmatureDisplay;
    private _animatList: cck_animat_dragonBonesAnimat_type[];
    private _timeoutID: number = 0;

    private static isStop: boolean = false;
    constructor(target: Node, bundle: string) {
        super(() => {
            if (DragonBonesAnimat.isStop && this._animatList) {
                for (let i: number = 0; i < this._animatList.length; ++i) {
                    this._animatList[i].props.played = true;
                }
                this.stop();
            }
            DragonBonesAnimat.isStop = false;
        });

        this._animatLoad = new DBLoad(bundle);
        this._animatList = [];
        this._target = target;
        this._selfDB = this._target.getComponent(dragonBones.ArmatureDisplay);
        if (!this._selfDB) {
            this._status = 'rejected';
            this._err = new Error('该结点没有 ArmatureDisplay 组件！');
        }
    }

    public static stopAll(): void {
        this.isStop = true;
    }

    public getDB(): dragonBones.ArmatureDisplay {
        return this._selfDB;
    }

    public addCallback(callback: cck_animat_resolved_type): void {
        let len: number = this._animatList.length;
        this._animatList[len - 1].callbacks.push(callback);
    }

    public addAnimatProps(props: IDragonBonesAnimat): void {
        try {
            props.delay = props.delay ? props.delay : 0;
            props.loop = props.loop ? props.loop : false;
            props.played = props.played ? props.played : false;
            props.repeatCount = (utils.isNull(props.repeatCount)  || utils.isUndefined(props.repeatCount)) ? -1 : props.repeatCount;
            if (props.loop) {
                props.repeatCount = 0;
            }
            if (!utils.isNull(props.timeScale) && !utils.isUndefined(props.timeScale)) {
                this._selfDB.timeScale = props.timeScale;
            }
            this._animatList.push({ props: props, callbacks: [] });
        } catch (error) {
            this._status = 'rejected';
            this._err = error;
        }
    }

    //龙骨皮肤加载
    public async dBSkinLoaded(props: IDragonBonesAnimat, isClear: boolean) {
        if (props.url) {
            let asset = await this.awaitLoad(dragonBones.ArmatureDisplay, props.url);
            if (asset) {
                props.armatureDisplay.dragonAsset = asset[0];
                props.armatureDisplay.dragonAtlasAsset = asset[1];
                this.replaceSkin(props.armatureDisplay.armature(), isClear);
            }
        }
        else {
            this.replaceSkin(props.armatureDisplay.armature());
        }
    }

    //加载龙骨动画
    public async dBLoaded(props: IDragonBonesAnimat) {
        if (props.url) {
            let asset = await this.awaitLoad(dragonBones.ArmatureDisplay, props.url);
            if (asset) {
                this.setDB(asset, props.armatureName);
            }
        }
    }

    /**开始播放 */
    public play(): DragonBonesAnimat {
        try {
            if (this._status === 'pending') {
                let props: IDragonBonesAnimat = this._animatList[this.index].props;
                if (!props.played) {
                    this.playInterval();
                }
            }
        } catch (error) {
            this._status = 'rejected';
            this._err = error;
        }
        return this;
    }
    
    /**停止播放 */
    public stop(): DragonBonesAnimat {
        this._target.pauseSystemEvents(true);
        return this;
    }

    /**抛出异常 */
    public catch(reject: (e: Error) => void): void {
        if (this._status === 'rejected') {
            SAFE_CALLBACK(reject, this._err);
        }
    }

    /**下一个动画播放前的回调 */
    public onNext(callback: Function): DragonBonesAnimat {
        this._nextCallback = callback;
        return this;
    }

    private setDB(asset: any[], armatureName: string) {
        this._selfDB.dragonAsset = asset[0];
        this._selfDB.dragonAtlasAsset = asset[1];
        this._selfDB.armatureName = armatureName;
    }

    /**
     * 替换皮肤
     * @param armature 要替换的皮肤所在的骨架
     * @param isClear 不显示身体
     */
     private replaceSkin(armature: dragonBones.Armature, isClear: boolean = false) {
        let factory: dragonBones.CCFactory = dragonBones.CCFactory.getInstance();
        Debug.assert(!this._selfDB.armature(), '当前龙骨的armature为' + typeof this._selfDB.armature());
        Debug.assert(!armature.armatureData.defaultSkin, '当前龙骨换皮部位的默认皮肤为' + typeof armature.armatureData.defaultSkin);
        Debug.log('替换的龙骨的armature', this._selfDB.armature(), armature.armatureData.defaultSkin);
        factory.replaceSkin(this._selfDB.armature(), armature.armatureData.defaultSkin, isClear);
    }

    private playInterval() {
        this.registerEvent();
        let props: IDragonBonesAnimat = this._animatList[this.index].props;
        if (props.delay > 0) {
            this._timeoutID = setTimeout(() => {
                clearTimeout(this._timeoutID);
                this._selfDB.playAnimation(props.name, props.repeatCount);
            }, this._animatList[this.index].props.delay * 1000);
        }
        else {
            this._selfDB.playAnimation(props.name, props.repeatCount);
        }
    }

    private registerEventStart() {
        this._selfDB.once(dragonBones.EventObject.START, (evt: any) => {
            let animat: cck_animat_spineAnimat_type = this._animatList[this.index];
            if (animat) {
                let callbacks: cck_animat_resolved_type[] = animat.callbacks;
                for (let e of callbacks) {
                    if (e.type === 'play') {
                        SAFE_CALLBACK(e.call, evt);
                    }
                }
            }
            
        }, this);
    }

    private registerEventComplete() {
        this._selfDB.once(dragonBones.EventObject.COMPLETE, (evt: any) => {
            let animat: cck_animat_spineAnimat_type = this._animatList[this.index];
            if (animat) {
                let callbacks: cck_animat_resolved_type[] = animat.callbacks;
                for (let e of callbacks) {
                    if (e.type === 'stop') {
                        SAFE_CALLBACK(e.call, evt);
                    }
                }
            }
            this.index++;
            if (this.index < this._animatList.length) {
                this._status = 'pending';
                SAFE_CALLBACK(this._nextCallback);
            }
        }, this);

    }

    private registerEventLoopComplete() {
        this._selfDB.once(dragonBones.EventObject.LOOP_COMPLETE, (evt: any) => {
            let animat: cck_animat_spineAnimat_type = this._animatList[this.index];
            if (animat) {
                let callbacks: cck_animat_resolved_type[] = animat.callbacks;
                for (let e of callbacks) {
                    if (e.type === 'complate') {
                        SAFE_CALLBACK(e.call, evt);
                    }
                }
            }
            
        }, this);
    }

    private registerEvent() {
        this.registerEventStart();
        this.registerEventComplete();
        this.registerEventLoopComplete();
    }
}