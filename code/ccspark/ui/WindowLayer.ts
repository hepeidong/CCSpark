import { Layers, Node, Size, size, UITransform } from "cc";
import { IWindowBase } from "../lib.ccspark";
import { MAX_PRIORITY } from "../Define";
import { app } from "../app";
import { setPriority } from "../util";

/**
 * author: HePeiDong
 * date: 2019/9/11
 * name: 窗口类
 * description: 构建窗口层级结构，总共分为三层，分别是根节点层，中间层，顶部层, 其中顶部层为最顶层。
 */
export class WindowLayer {
    /***************游戏层级结构*****************/
    private _rootLayer: Node;          //根视图层
    private _centerLayer: Node;        //中心层
    private _topLayer: Node;           //顶层

    private _centerZIndex: number;         //中间层窗口层级
    private _topZIndex: number;            //顶部层窗口层级

    constructor() {
        
    }

    private setContentSize(target: Node, size: Size) {
        const ui = target.getComponent(UITransform);
        ui.width = size.width;
        ui.height = size.height;
    }

    public init(canvas: Node, layer: Layers.Enum): boolean {
        this._centerZIndex = 0;
        this._topZIndex = 0;
        //适配后的节点层大小
        const canvasUI = canvas.getComponent(UITransform);
        let canvasSize = size(canvasUI.width, canvasUI.height);
        canvasSize.width += app.adapterManager.width * 2;
        canvasSize.height += app.adapterManager.height * 2;

        this._rootLayer = new Node('rootLayer');          //根视图
        this._rootLayer.layer = layer;
        setPriority(this._rootLayer, 0);
        canvas.addChild(this._rootLayer);
        this.setContentSize(this._rootLayer, canvasSize);

        this._centerLayer = new Node('centerLayer');      //中心层
        this._centerLayer.layer = layer;
        setPriority(this._centerLayer, MAX_PRIORITY / 2);
        canvas.addChild(this._centerLayer);
        this.setContentSize(this._centerLayer, canvasSize);

        this._topLayer = new Node('topLayer');            //顶层
        this._topLayer.layer = layer;
        setPriority(this._topLayer, MAX_PRIORITY);
        canvas.addChild(this._topLayer);
        this.setContentSize(this._topLayer, canvasSize);
        return true;
    }

    /**
     * 增加根视图
     * @param view 根视图结点
     */
    public addRootWindow(view: IWindowBase): boolean {
        if (!this._rootLayer.getChildByName(view.node.name)) {
            this._rootLayer.addChild(view.node);
            return true;
        }
        return false;
    }

    /**
     * 增加中间窗口
     * @param view 视图结点
     * @param hasMask 是否增加背景遮罩, 默认不增加
     */
    public addCenterWindow(view: IWindowBase, hasMask: boolean = false): boolean {
        if (!this._centerLayer.getChildByName(view.node.name)) {
            hasMask && app.game.sceneManager.addViewMaskTo(this._centerLayer, view, this._centerZIndex++);
            setPriority(view.node, this._centerZIndex);
            this._centerLayer.addChild(view.node);
            return true;
        }
        return false;
    }

    /**
     * 增加顶层窗口
     * @param view 视图控结点
     * @param hasMask 是否增加背景遮罩, 默认不增加
     */
    public addTopWindow(view: IWindowBase, hasMask: boolean = false): boolean {
        if (!this._topLayer.getChildByName(view.node.name)) {
            hasMask && app.game.sceneManager.addViewMaskTo(this._topLayer, view, this._topZIndex++);
            setPriority(view.node, this._topZIndex);
            this._topLayer.addChild(view.node);
            return true;
        }
        return false;
    }

    /**
     * 增加toast提示
     * @param view 
     * @returns 
     */
    public addToastTip(view: IWindowBase) {
        this._topLayer.addChild(view.node);
        return true;
    }

    public addToTop(node: Node) {
        if (!this._topLayer.getChildByName(node.name)) {
            this._topLayer.addChild(node);
        }
    }

    public addToCenter(node: Node) {
        if (!this._centerLayer.getChildByName(node.name)) {
            this._centerLayer.addChild(node);
        }
    }
}