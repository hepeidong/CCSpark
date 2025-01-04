import { Director, director, Node } from "cc";
import { SAFE_CALLBACK } from "../Define";
import { AnimatLoad } from "../res/LoadAnimation";
import { tools } from "../tools";
import { Asset } from "cc";
import { Res } from "../res/Res";
import { AnimatPlayStatus, cc_zest_animat_resolved_type } from "zest";


export  abstract class AnimatBase<T> {
    private _bundle: string;
    protected _status: AnimatPlayStatus;
    protected _err: Error;
    protected _target: Node;
    protected index: number;
    /**动画队列 */
    protected _animatList: tools.Queue<T>;
    protected _nextCallback: Function;
    protected _animatLoad: AnimatLoad;
    protected _assets: Map<string, Asset>;
    protected _playEnd: Function; //动画列表播放完成，即所有动画都播放完了
    protected _rejected: Function;

    constructor(bundle: string, callback: (...args: any[]) => void) {
        this._bundle = bundle;
        this._status = "pending";
        this.index   = 0;
        this._animatList = new tools.Queue();
        this._assets     = new Map();
        director.on(Director.EVENT_BEFORE_UPDATE, callback, this);
    }

    abstract target(target: Node): void;
    abstract addCallback(callback: cc_zest_animat_resolved_type): void;
    abstract addAnimatProps(props: any): void;
    /**开始播放 */
    abstract play(): AnimatBase<T>;
    /**停止播放 */
    abstract stop(): AnimatBase<T>;
    /**抛出异常 */
    abstract catch(reject: (e: Error) => void): void;
    /**下一个动画播放前的回调 */
    abstract onNext(callback: Function): AnimatBase<T>;

    public pause(): AnimatBase<T> { return this; }
    public resume(): AnimatBase<T> { return this; }

    public reset() {
        this.index = 0;
        this._status = "pending";
        this._animatList.clear();
        SAFE_CALLBACK(this._playEnd);
    }

    public setPlayEnd(callback: Function) {
        this._playEnd = callback;
    }

    public clear() {
        if (Res.hasLoader(this._bundle)) {
            const loader = Res.getLoader(this._bundle);
            this._assets.forEach((asset) => {
                loader.delete(asset);
            });
            this._assets.clear();
        }
    }

    protected awaitLoad(type: any, url: string) {
        return new Promise((resolve: (val: any) => void, reject: (err: any) => void) => {
            const component = this._target.getComponent(type);
            if (component) {
                this._animatLoad.loadAnimat(url, (err, asset) => {
                    if (err) {
                        reject({rejected: "rejected", err});
                        return;
                    }
                    resolve(asset);
                });
            }
            else {
                reject({rejected: "rejected"});
            }
        });
    }

    protected callRejected() {
        if (this._status === "rejected") {
            SAFE_CALLBACK(this._rejected, this._err);
        }
    }
}