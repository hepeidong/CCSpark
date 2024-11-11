import { EventTouch, instantiate, Node, NodePool, Prefab, UITransform, v3, Vec2, Vec3 } from "cc";
import { tweenAnimat } from "../animat_audio";
import { MAX_PRIORITY } from "../Define";
import { setPriority } from "../util";
import { WindowManager } from "./WindowManager";
import { Debug } from "../Debugger";
import { tools } from "../tools";
import { ITweenAnimat } from "../lib.ccspark";

const MAX_COUNT = 20;

const _vec3Temp = v3();
const _worldVec3Temp = v3();

export class TouchEffect {
    private _index: number;
    private _target: Node;
    private _pool: NodePool;
    private _tweenAnimatPool: tools.ObjectPool<ITweenAnimat>;
    constructor() {
        this._index = 0;
        this._pool = new NodePool();
        this._tweenAnimatPool = new tools.ObjectPool();
    }

    public init(uiLayer: number) {
        let touchParent: Node = new Node('touchParent');
        touchParent.layer = uiLayer;
        let ui = touchParent.getComponent(UITransform);
        if (!ui) {
            ui = touchParent.addComponent(UITransform);
        }
        ui.width = 2000;
        ui.height = 2000;
        setPriority(touchParent, MAX_PRIORITY);
        WindowManager.instance.addToTop(touchParent);
        let overversion: boolean = true; //版本是否超过3.4
        if (touchParent.eventProcessor) {
            //版本兼容
            const touchListener = touchParent.eventProcessor.touchListener;
            if (touchListener) {
                overversion = false;
                touchListener.setSwallowTouches(false);
            }
        }
        touchParent.on(Node.EventType.TOUCH_START, (evt: EventTouch) => {
            if (overversion) {
                evt.preventSwallow = true;
            }
            this.play(evt.getUILocation());
        }, this);
        touchParent.on(Node.EventType.TOUCH_END, (evt: EventTouch) => {
            if (overversion) {
                evt.preventSwallow = true;
            }
        });
        touchParent.on(Node.EventType.TOUCH_CANCEL, (evt: EventTouch) => {
            if (overversion) {
                evt.preventSwallow = true;
            }
        });
    }

    /**
     * 初始化触摸点击特效，
     * @param prefab 挂载了点击特效帧动画的预制体
     */
    public initEffectAsset(prefab: Prefab) {
        if (prefab) {
            this._target = instantiate(prefab);
            setPriority(this._target, MAX_PRIORITY);
        }
    }

    public play(worldPos: Vec2) {
        if (this._pool.size() <= MAX_COUNT) {
            let node: Node;
            if (this._pool.size() > 0) {
                node = this._pool.get();
            }
            else {
                node = instantiate(this._target);
                node.name = node.name + this._index.toString();
                this._index++;
            }
            WindowManager.instance.addToTop(node);
            const parentUI = node.parent.getComponent(UITransform);
            let pos: Vec3 = parentUI.convertToNodeSpaceAR(_worldVec3Temp.set(worldPos.x, worldPos.y));
            node.position = _vec3Temp.set(pos.x, pos.y);
            let tween: ITweenAnimat;
            if (this._tweenAnimatPool.has()) {
                tween = this._tweenAnimatPool.get();
                tween.target(node);
            }
            else {
                tween = tweenAnimat(node);
            }
            tween.defaultClip().onStop(() => {
                this._pool.put(node);
                this._tweenAnimatPool.put(tween);
            }).play().catch(err => {
                Debug.error("触摸特效动画播放异常：", err);
            });
        }
    }
}