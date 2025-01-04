import { _decorator, Component, Node } from 'cc';
import { IAnimationAction, IGuideComponent, ITweenAudio } from 'zest';
import { GuideManager } from '../GuideManager';
import { Prefab } from 'cc';
import { EDITOR } from 'cc/env';
import { AnimationType } from '../GuideEnum';
import { Res } from '../../res/Res';
import { Debug } from '../../Debugger';
import { utils } from '../../utils';
import { instantiate } from 'cc';
import { tweenAnimat, TweenAudio, tweenAudio } from '../../animat_audio';
const {
    ccclass, 
    executeInEditMode, 
    disallowMultiple
} = _decorator;

@ccclass('GuideAnimation')
@executeInEditMode
@disallowMultiple
export class GuideAnimation extends Component implements IGuideComponent {

    private _assets: string[];
    private _tweenAudio: ITweenAudio;
    protected onLoad(): void {
        if (!EDITOR) {
            this._assets = [];
        }
    }

    start() {
        
    }

    doGuideSkip(): void {
        this.node.active = false;
        GuideManager.instance.guideSkipAll();
    }

    execGuide(): void {
        const bundle = GuideManager.instance.bundle;
        const data = GuideManager.instance.guideAction.getData<IAnimationAction>();
        const animationId = data.animationId;
        const animationType = data.animationType;
        if (animationType === AnimationType.PLAY) {
            const loader = Res.getLoader(bundle);
            const source = data.source.replace(new RegExp(".prefab"), "");
            const asset = loader.get(source, Prefab);
            if (asset) {
                this.playAnimation(asset, animationId, bundle, data.audio);
            }
            else {
                loader.load(source, Prefab, (err, asset) => {
                    if (err) {
                        this.error(this.execGuide, err);
                    }
                    else {
                        this._assets.push(source);
                        this.playAnimation(asset, animationId, bundle, data.audio);
                    }
                });
            }
        }
        else if (animationType === AnimationType.MOVE) {
            if (this._tweenAudio) {
                this._tweenAudio.stop();
            }
            const child = this.node.getChildByName(animationId);
            child.removeFromParent();
            GuideManager.instance.guideContinue();
        }
    }

    clear(): void {
        const loader = Res.getLoader(GuideManager.instance.bundle);
        for (const path of this._assets) {
            const asset = loader.get(path, Prefab);
            loader.delete(asset);
        }
        this._tweenAudio.clear();
    }

    private playAnimation(asset: Prefab, animationId: string, bundle: string, audio: string) {
        const node = instantiate(asset);
        node.name = animationId;
        //播放音频
        if (audio.length > 0) {
            audio = audio.replace(new RegExp(".mp3"), "");
            if (!this._tweenAudio) {
                this._tweenAudio = tweenAudio(bundle).audio(TweenAudio.Model.ORDER);
            }
            this._tweenAudio.bgm({url: audio}).onPlay(() => {
                this.node.addChild(node);
                tweenAnimat(node, bundle).defaultClip().onStop(() => {
                    GuideManager.instance.guideContinue();
                }).play();
            }).play().catch(err => {
                this.error(this.playAnimation, err);
            });
        }
        else {
            this.node.addChild(node);
            tweenAnimat(node, bundle).defaultClip().onStop(() => {
                GuideManager.instance.guideContinue();
            }).play();
        }
    }

    private log(fn: Function, ...subst: any[]) {
        Debug.log(utils.StringUtil.format("[GuideAnimation:%s]", fn.name), ...subst);
    }

    private error(fn: Function, ...subst: any[]) {
        Debug.error(utils.StringUtil.format("[GuideAnimation:%s]", fn.name), ...subst);
    }

    update(deltaTime: number) {
        
    }
}


