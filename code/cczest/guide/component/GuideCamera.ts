import { _decorator, Component, Node } from 'cc';
import { ICameraAction, IGuideComponent } from 'zest';
import { GuideManager } from '../GuideManager';
import { GuideTarget } from './GuideTarget';
import { GuideAction } from '../GuideAction';
import { Vec3 } from 'cc';
import { v3 } from 'cc';
import { utils } from '../../utils';
import { Tween } from 'cc';
import { tween } from 'cc';
import { getPriority } from '../../util';
import { restoreParent } from '../guide_utils';
import { EDITOR } from 'cc/env';
import { Debug } from '../../Debugger';
import { GuideCameraPool } from '../GuideCameraPool';
const {
    ccclass, 
    executeInEditMode, 
    disallowMultiple
} = _decorator;

@ccclass('GuideCamera')
@executeInEditMode
@disallowMultiple
export class GuideCamera extends Component implements IGuideComponent {

    private _guideTargets: GuideTarget[];     //引导目标暂存
    private _guideInfo: GuideAction;          //引导数据信息暂存
    private _lightTargets: Node[];            //引导高亮节点暂存
    private _targetZIndex: number[] = [];     //目标节点的zIndex
    private _lightParents: Node[] = [];       //高亮父节点

    protected onLoad(): void {
        if (!EDITOR) {
            this.init();
        }
    }

    start() {
        
    }

    private init() {
        this._targetZIndex = [];
        this._lightParents = [];
    }

    doGuideSkip(): void {
        this.node.active = false;
        this.currentGuideComplete().then(() => GuideManager.instance.guideSkipAll()).catch(() => GuideManager.instance.guideSkipAll());
    }

    execGuide(): void {
        this.log(this.execGuide, "开始执行摄像机引导！");
        this.storageGuideData();
        this.fingerMove();
        this.addLightTargetsToGuideLayer();
    }

    clear(): void {
        
    }

    //暂存引导相关数据
    private storageGuideData() {
        this._guideInfo = GuideManager.instance.guideAction;
        this._guideTargets = GuideManager.instance.guideTargets;
        this._lightTargets = GuideManager.instance.lightTargets;
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

    //摄像机移动
    private fingerMove() {
        let posisions: Vec3[] = GuideManager.instance.getTargetPosition();
        if (posisions.length > 0) {
            const data = GuideManager.instance.guideAction.getData<ICameraAction>();
            const cameraId = data.cameraId;
            if (GuideCameraPool.instance.has(cameraId)) {
                const easing = data.easing;
                const delay = data.delay;
                const speed = GuideManager.instance.cameraSpeed;
                const node = GuideCameraPool.instance.get(cameraId);
                const tweenAction: Tween<Node> = tween(node);
                const len = posisions.length;
                const currentPos = v3();
                for (let i = 0; i < len; ++i) {
                    //计算摄像机和引导目标两点距离
                    if (i === 0) {
                        currentPos.set(node.position.x, node.position.y);
                    }
                    else {
                        currentPos.set(posisions[i - 1].x, posisions[i - 1].y) ;
                    }
                    const pos = v3(posisions[i].x, posisions[i].y);
                    const d = utils.MathUtil.Vector2D.distance(currentPos, pos);
                    const t = d / speed;//计算移动时间
                    tweenAction.to(t, {position: pos}, {easing: easing});
                }
                tweenAction.delay(delay);
                tweenAction.call(() => this.tweenActionCall());
                tweenAction.start();
            }
            else {
                this.error(this.fingerMove, `缺少 Id 为 ${cameraId} 的摄像机！`);
            }
        }
    }

    private tweenActionCall() {
        GuideManager.instance.hideBlockInputLayer();
        this.currentGuideComplete().then(() => GuideManager.instance.guideContinue());
    }

    //当前这一步引导完成，下一步引导执行
    private currentGuideComplete() {
        return new Promise((resolve, reject) => {
            if (this._guideTargets && this._lightTargets) {
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

    private log(fn: Function, ...subst: any[]) {
        Debug.log(utils.StringUtil.format("[GuideCamera:%s]", fn.name), ...subst);
    }

    private error(fn: Function, ...subst: any[]) {
        Debug.error(utils.StringUtil.format("[GuideCamera:%s]", fn.name), ...subst);
    }

    update(deltaTime: number) {
        
    }
}


