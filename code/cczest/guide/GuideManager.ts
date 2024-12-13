import { Debug } from "../Debugger";
import { utils } from "../utils";
import { GuideTarget } from "./component/GuideTarget";
import { GuideNormalEvent, Scope } from "./GuideEnum";
import { GuideSearch } from "./GuideSearch";
import { Component, director, Node, UITransform, Vec3 } from "cc";
import { IGuideManager, IGuideWindow } from "../lib.zest";
import { EventSystem } from "../event";
import { GuideGroup } from "./GuideGroup";
import { GuideAction } from "./GuideAction";
import { ui } from "../ui";

const _vec3Temp = new Vec3();


/**
 * name: 引导管理类
 * date: 2020/04/22
 * author: 何沛东
 * description: 控制和管理游戏中的引导
 */
export class GuideManager implements IGuideManager {
    private _fingerSpeed: number;                              //手指移动速度
    private _syncGuideId: string;                              //同步引导id
    private _guideSearch: GuideSearch;                         //引导检索
    private _guideMask: Node;                                  //引导遮罩
    private _guideLayer: Node;                                 //引导层节点
    private _guideWindow: string;                              //引导视图的访问ID
    private _group: GuideGroup;                                //引导组
    private _fileData: {};                                     //引导数据文件的数据

    private constructor() {
        this._syncGuideId = "";
        this._guideSearch = new GuideSearch();
        this._group = new GuideGroup(this._guideSearch);

        EventSystem.event.on(GuideGroup.Event.SHOW_GUIDE_VIEW, this, this.onShowGuideView);
        EventSystem.event.on(GuideGroup.Event.SHOW_GUIDE_MASK, this, this.onShowGuideMask);
        EventSystem.event.on(GuideGroup.Event.SYNC_TO_STORAGE, this, this.syncToStorage);
        EventSystem.event.on(GuideGroup.Event.HIDE_GUIDE_MASK, this, this.onHideGuideMask);
    }

    private static _ins: GuideManager = null;
    public static get instance(): GuideManager {
        return this._ins = this._ins ? this._ins : new GuideManager();
    }


    public get bundble() { return ui.getView(this._guideWindow).bundbleName; }
    public get isGuideClose(): boolean { return this._group.isClose; }
    public get isGuideLaunched(): boolean { return this._group.isGuideLaunched; }
    public get isGuiding(): boolean { return this._group.isGuiding; }
    public get isAgainExecute(): boolean { return this._group.isAgainExecute; }
    public get guideData(): {} { return this._fileData; }
    public get guideAction(): GuideAction { return this._group.currentGuide; }
    public get guideTargets(): GuideTarget[] { return this._group.guideTargets; }
    /**已经执行完的最后的一个引导id，存储的是距离还未执行的引导id最近的一个已执行完的引导id */
    public get guideId() { return this._syncGuideId; }
    public get fingerSpeed(): number { return this._fingerSpeed; }
    public get guideGroup() { return this._group.guideGroup; }
    public get guideType(): number { return this.guideAction.guideType; }
    public get lightTargets(): Node[] { return this._group.lightTargets; }

    private onShowGuideView() {
        ui.open(this._guideWindow);
    }

    private onShowGuideMask(uiId: string) {
        if (this._guideMask) {
            this._guideMask.active = !this._guideSearch.isParentPanel(uiId);
        }
    }

    private onHideGuideMask() {
        const guideView = ui.getView(this._guideWindow) as IGuideWindow;
        guideView.closeGuideWindow();
    }

    /**将引导存储到缓存中 */
    private syncToStorage(guideId: string) {
        this._syncGuideId = guideId;
    }

    /**
     * 设置引导视图
     * @param accessId 
     */
    public setGuideView(accessId: string): void {
        this._guideWindow = accessId;
    }

    /**
     * 增加引导视图
     * @param uiId 
     * @param target
     */
    public addGuideView(uiId: string, target: Node, scope: Scope): void {
        this._guideSearch.addGuideView(uiId, target, scope);
    }

    /**
     * 删除引导视图
     * @param uiId 
     * @param scope 
     */
    public removeGuideView(uiId: string, scope: Scope) {
        this._guideSearch.removeGuideView(uiId, scope);
    }

    /**
     * 增加遮罩节点和引导层节点
     * @param mask 
     * @param layer
     */
    public addGuideMaskAndLayer(mask: Node, layer: Node): void {
        this._guideMask = mask;
        this._guideLayer = layer;
    }

    /**
     * 把引导目标节点移动到引导层节点下
     * @param target 
     */
    public addChildToGuideLayer(target: Node): void {
        if (this._guideLayer) {
            let tarPos: Vec3 = utils.EngineUtil.convertPosition(target, this._guideLayer);
            target.removeFromParent();
            target.parent = this._guideLayer;
            target.position.set(tarPos.x, tarPos.y);
        }
    }

    /**
     * 移动到指定父节点下
     * @param target 
     * @param parent 
     */
    public removeToParent(target: Node, parent: Node) {
        let tarPos: Vec3 = utils.EngineUtil.convertPosition(target, parent);
        target.removeFromParent();
        target.parent = parent;
        target.position.set(tarPos.x, tarPos.y);
    }

    /**隐藏阻塞事件层 */
    public hideBlockInputLayer() {
        EventSystem.event.emit(GuideNormalEvent.HIDE_BLOCK_INPUT_LAYER);
    }

    /**
     * 检索所有高亮节点
     * @param guideId 
     */
    public searchLightTarget(guideId: string): boolean {
        this._guideSearch.searchLightTarget(guideId);
        return this.lightTargets && this.lightTargets.length > 0;
    }

    /**引导回退 */
    public guideRollBack() {
        this._group.guideRollBack(this._syncGuideId);
    }

    /**
     * 设置手指移动速度
     * @param speed 
     */
    public setFingerSpeed(speed: number): void {
        this._fingerSpeed = (speed > 10 ? 10 : speed) * 200;
    }

    /**
     * 设置引导数据文件
     * @param file 
     */
    public setGuideFile(file: {}): void {
        this._fileData = file;
    }

    /**
     * 注册引导执行回调
     * @param type 事件类型
     * @param listeners 监听回调
     * @param caller 事件注册者
     */
    public on(type: string, listeners: Function, caller: any) {
        EventSystem.event.on(type, caller, listeners);
    }

    /**
     * 注销引导执行回调
     * @param type 事件类型
     * @param listeners 监听回调
     * @param caller 事件注册者
     */
    public off(type: string, listeners: Function, caller: any) {
        EventSystem.event.off(type, caller, listeners);
    }

    /**在当前这一组引导组内，是否还有引导未执行完 */
    public hasGuideAction(): boolean {
        return this._group.hasGuideAction(this._syncGuideId);
    }

    public getGuideTargets() {
        return this._guideSearch.getGuideTargets();
    }

    /**暂停引导 */
    public guidePause() {
        this._group.guidePause();
    }

     /**引导恢复, 恢复后的引导,将执行下一步引导 */
     public guideResume() {
        this._group.guideResume();
    }

    /**
     * 同步引导组，在开始引导之前，必须要先同步引导组
     * @param groupId 引导组id
     * @param guideId 引导id，一般为存储的上一次已经执行完的id，如果没有，则可以不传
     */
    public syncGuideGroup(groupId: string, guideId: string = "") {
        if (this._fileData) {
            if (groupId in this._fileData) {
                this._group.initGuideGroup(this._fileData[groupId]);
                if (typeof guideId === "string") {
                    this._syncGuideId = guideId;
                }
            }
        }
        else {
            this.error(this.syncGuideGroup, "没有设置引导数据，请先设置引导数据！调用 ‘setGuideFile’ 函数可以设置引导数据。");
        }
    }

    /**
     * 打开引导，让引导开始执行
     */
    public guideOpen() {
        this._group.guideOpen(this._syncGuideId);
    }

    /**在手指引导之后执行下一步, 在某些情况下可能会需要调用, 通常调用此接口的可能性不大 */
    public execNextStepAfterFingerGuide() {
        EventSystem.event.emit(GuideNormalEvent.FINGER_EVENT);
    }

    public againExecute() {
        this._group.guideStart();
    }

    /**当前引导启动 */
    public guideLaunch() {
        this._group.guideLaunch(this._syncGuideId);
    }

    /**当前引导完成，继续下一步引导 */
    public guideContinue() {
        this._group.guideContinue();
    }

    /**删除引导目标 */
    public delGuideTarget(targetId: string): boolean {
        return this._guideSearch.getGuideTargets().delete(targetId);
    }

    /**获取引导目标的位置 */
    public getTargetPosition(): Vec3[] {
        let vecs: Vec3[] = [];
        const guideTargets = this.guideTargets;
        for (const guideTarget of guideTargets) {
            const canvas = director.getScene().getChildByName("Canvas");
            vecs.push(utils.EngineUtil.convertPosition(guideTarget.target, canvas));
        }
        return vecs;
    }

    /**
     * 设置引导文本的位置
     * @param guideComponent 引导组件
     * @param text 文本节点
     */
    public setTextPos(guideComponent: Component, text: Node) {
        let textPos = utils.EngineUtil.convertPosition(this.guideTargets[0].target, guideComponent.node);

        text.position.set(textPos.x, textPos.y);
        //转换到Canvas节点坐标系下, 用于计算锚点
        const canvas = director.getScene().getChildByName("Canvas");
        let pos: Vec3 = utils.EngineUtil.convertPosition(text, canvas);
        const uiTransform = text.getComponent(UITransform);
        const targetUI = this.guideTargets[0].target.getComponent(UITransform);
        let width: number = uiTransform.width / 2;
        //计算是否需要显示在引导目标上方, 若目标下方还有足够空间, 显示在下方
        let anchorY: number = (text.position.y + uiTransform.height - targetUI.height / 2) > 10 ? 1 : 0;
        uiTransform.anchorY = anchorY;
        //计算文本是否超出屏幕外, 或者距离屏幕边界太近, 是, 则修正位置
        const canvasUI = canvas.getComponent(UITransform);
        let offset = canvasUI.width / 2 - Math.abs(pos.x);
        _vec3Temp.x = text.position.x;
        _vec3Temp.y = text.position.y;
        if (offset < width) {
            _vec3Temp.x = text.position.x > 0 ? text.position.x - Math.abs(width - offset) - 30 : text.position.x + Math.abs(width - offset) + 30;
        }
        else if (offset - width < 20) {
            _vec3Temp.x = text.position.x > 0 ? text.position.x - 30 : text.position.x + 30;
        }

        if (anchorY === 0) {
            _vec3Temp.y = text.position.y + targetUI.height / 2 + 10 + uiTransform.height / 2;
        }
        else if (anchorY === 1) {
            _vec3Temp.y = text.position.y - targetUI.height / 2 - 10 - uiTransform.height / 2;
        }
        text.position = _vec3Temp;
    }

    private error(fn: Function, ...subst: any[]) {
        Debug.error(utils.StringUtil.format("[GuideManager:%s]", fn.name), ...subst);
    }
}
