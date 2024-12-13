import { Node } from "cc";
import { GuideTarget } from "./component/GuideTarget";
import { GuideAction } from "./GuideAction"
import { GuideSearch } from "./GuideSearch";
import { Debug } from "../Debugger";
import { tools } from "../tools";
import { EventSystem } from "../event";
import { EventType, GuideType } from "./GuideEnum";
import { utils } from "../utils";
import { IFingerAction, ITextAction } from "../lib.zest";


export class GuideGroup {
    private _isValid: boolean;
    private _close: boolean;                    //关闭引导功能
    private _isGuideLaunched: boolean;          //引导已经启动
    private _isGuiding: boolean;                //正在引导
    private _isAgainExecute: boolean;              //重新发起执行，发生在UI界面还没打开时，下一步引导已经开始，导致引导无法继续走下去，此时就会需要在UI打开后重新再发起引导
    private _lastUiId: string;
    private _currentGuide: GuideAction;
    private _group: Map<string, GuideAction>;
    private _guideSearch: GuideSearch;
    private _guideActionPool: tools.ObjectPool<GuideAction>;
    constructor(guideSearch: GuideSearch) {
        this._guideSearch = guideSearch;
        this._isValid = false;
        this.reset();
        this._group = new Map();
        this._guideActionPool = new tools.ObjectPool();
    }

    public get isValid() { return this._isValid; }
    public get isClose() { return this._close; }
    public get isGuideLaunched(): boolean { return this._isGuideLaunched; }
    public get isGuiding(): boolean { return this._isGuiding; }
    public get isAgainExecute(): boolean { return this._isAgainExecute; }
    public get guideTargets(): GuideTarget[] {
        let targets: GuideTarget[] = [];
        const targetId = this._currentGuide.getData<IFingerAction|ITextAction>().targetId;
        for (const id of targetId) {
            if (this._guideSearch.getGuideTargets().has(id)) {
                targets.push(this._guideSearch.getGuideTargets().get(id));
            }
        }
        return targets;
    }
    public get lightTargets(): Node[] { return this._guideSearch.getLightTargets().get(this._currentGuide.guideId); }
    public get currentGuide() { return this._currentGuide; }
    public get guideGroup() { return this._group; }

    private reset() {
        this._close = false;
        this._isGuideLaunched = false;
        this._isAgainExecute = false;
        this._lastUiId = "";
    }

    public initGuideGroup(data: {}) {
        this.reset();
        if (this._group.size > 0) {
            this._group.forEach(guideAction => {
                this._guideActionPool.put(guideAction);
            });
            this._group.clear();
        }
        for (const key in data) {
            const guideInfo = data[key];
            if (this._guideActionPool.has()) {
                const guideAction = this._guideActionPool.get();
                guideAction.setGuideConfig(guideInfo);
                this._group.set(key, guideAction);
            }
            else {
                const guideAction = new GuideAction(guideInfo);
                this._group.set(key, guideAction);
            }
        }
        this._isValid = this._group.size > 0;
        this._guideSearch.setGuideGroup(this._group);
    }

    /**引导回退 */
    public guideRollBack(syncGuideId: string) {
        if (this._group.has(syncGuideId)) {
            const guideAction: GuideAction = this._group.get(syncGuideId);
            this.setCurrentGuide(guideAction);
        }
    }

    /**当前引导启动 */
    public guideLaunch(syncGuideId: string) {
        this.log(this.guideLaunch, "引导启动");
        if (this._isValid && !this._close) {
            //开始执行引导，这里是接着之前的引导，可能需要打开相应的界面
            if (this._group.has(syncGuideId)) {
                const guideAction: GuideAction = this._group.get(syncGuideId);
                if (guideAction.syncId.length > 0) {
                    //暂存上一步引导的uiId
                    this._isGuideLaunched = true;
                    this._lastUiId = guideAction.getData<IFingerAction|ITextAction>().uiId;
                    const guideId = guideAction.syncId;

                    const currentGuide = this._group.get(guideId);
                    this.setCurrentGuide(currentGuide);
                    this.guideStart();
                }
                else {
                    this.guideOver();
                }
            }
            else {
                //如果没有缓存的引导数据，就从第一个引导数据开始引导
                this._isGuideLaunched = true;
                //取第一个引导id
                this.setCurrentGuide(this.getFirstGuideAction());
                this.guideStart();
            }
        }
    }

    /**暂停引导 */
    public guidePause() {
        this._close = true;
        this._isGuideLaunched = false;
        this._isGuiding = false;
    }

    /**强制打开引导 */
    public guideOpen(syncGuideId: string) {
        this._close = false;
        if (!this.judgeCurrentGuide() || this._close) {
            if (this.hasGuideAction(syncGuideId)) {
                this.log(this.guideOpen, '加载引导层视图');
                if (!this._close) {
                    EventSystem.event.emit(GuideGroup.Event.SHOW_GUIDE_VIEW);
                }
            }
        }
    }

    /**
     * 恢复引导
     */
    public guideResume() {
        this._close = false;
        this._isGuideLaunched = true;
        this._isGuiding = true;
        this.guideContinue();
    }

    /**当前引导完成，继续下一步引导 */
    public guideContinue() {
        if (this._isGuiding && !this._close) {
            this.log(this.guideContinue, '当前引导完成，继续下一步引导');
            this.guideComplete();
            if (this._currentGuide.syncId.length > 0) {
                //暂存上一步引导的uiId
                this._lastUiId = this._currentGuide.getData<IFingerAction|ITextAction>().uiId;
                const guideAction = this._group.get(this._currentGuide.syncId);
                this.setCurrentGuide(guideAction);
                if (this.judgeCurrentGuide() && !this._close) {
                    if (!this.switchUI()) {
                        this.newStepGuide();
                    }
                    else {
                        this.guideStart();
                    }
                }
            }
            else if (this._currentGuide.syncId.length === 0) {
                this.guideOver();
            }
        }
    }

    public hasGuideAction(syncGuideId: string) {
        if (syncGuideId.length === 0) {
            return true;
        }
        else if (this._group.has(syncGuideId)) {
            const guideAction = this._group.get(syncGuideId);
            return guideAction.syncId.length !== 0;
        }
        //这里表示执行的是新的引导组，之前存储的引导id已经无效，新的引导组里面是没有存储的这个引导id对应的引导动作
        else if (this._group.size > 0) {
            return true;
        }
        else {
            return false;
        }
    }

    /**判定当前引导currentGuide是否有效 */
    private judgeCurrentGuide() {
        if (this._currentGuide instanceof GuideAction) {
            return this._currentGuide.isValid();
        }
        return false;
    }

    private setCurrentGuide(guideAction: GuideAction) {
        if (this._currentGuide instanceof GuideAction) {
            this._currentGuide.setIsValid(false);
        }
        this._currentGuide = guideAction;
    }

    /**是否切换了UI */
    private switchUI() {
        this.log(this.switchUI, "执行引导所在的页面：", `上一个引导执行所在的页面“${this._lastUiId}”`, `当前引导执行所在的页面“${this._currentGuide.getData().uiId}”`);
        if (typeof this._lastUiId !== "string") {
            return false;
        }

        else return this._lastUiId !== this._currentGuide.getData().uiId;
    }

    /**当前这一步引导开始执行 */
    public guideStart() {
        //对话引导、图片引导、动画引导都不需要在特定页面上进行，因为没有引导目标，纯粹就是显示对话或者显示图片或者播放动画。
        //所以，不需要判断特定UI页面是否打开，因为uiId是空字符。
        if (this._currentGuide.guideType === GuideType.DIALOGUE ||
            this._currentGuide.guideType === GuideType.IMAGE ||
            this._currentGuide.guideType === GuideType.ANIMATION
        ) {
            this.newStepGuide();
        }
        else if (this._guideSearch.isViewOpen(this._currentGuide.getData().uiId)) {
            this.newStepGuide();
        }
        else {
            this._isAgainExecute = true;
        }
    }

    private newStepGuide() {
        this.log(this.newStepGuide, '新的引导开始执行', this._currentGuide.guideId);
        this._isGuiding = true;
        this._isAgainExecute = false;  //开始后，重新发起引导的标志要重置为false
        EventSystem.event.emit(GuideGroup.Event.SHOW_GUIDE_MASK, this._currentGuide.getData().uiId);
        EventSystem.event.emit(EventType.GUIDE_START, this._currentGuide.guideId);
    }

    /**当前这一步引导完成 */
    private guideComplete() {
        EventSystem.event.emit(GuideGroup.Event.SYNC_TO_STORAGE, this._currentGuide.guideId);
        EventSystem.event.emit(EventType.GUIDE_COMPLETE, this._currentGuide.guideId);
    }

    /**本轮引导结束 */
    private guideOver() {
        this.log(this.guideOver, '本轮引导结束');
        this._isGuiding = false;
        this._isValid = false;
        this._group.forEach(guideAction => {
            this._guideActionPool.put(guideAction);
        });
        this._group.clear();
        this._guideSearch.clear();
        EventSystem.event.emit(GuideGroup.Event.HIDE_GUIDE_MASK);
        EventSystem.event.emit(EventType.GUIDE_OVER, this._currentGuide.guideId);
    }

    private getFirstGuideAction() {
        const keyItertor =this._group.keys();
        for (const key of keyItertor) {
            //取第一个引导id，取完之后立刻退出循环
            return this._group.get(key);
        }
        return null;
    }

    private log(fn: Function, ...subst: any[]) {
        Debug.log(utils.StringUtil.format("[GuideGroup:%s]", fn.name), ...subst);
    }
}

export namespace GuideGroup {
    export enum Event {
        SHOW_GUIDE_VIEW = "show_guide_view",
        SHOW_GUIDE_MASK = "show_guide_mask",
        SYNC_TO_STORAGE = "sync_to_storage",
        HIDE_GUIDE_MASK = "hide_guide_mask"
    }
}