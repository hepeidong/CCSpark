import { Node, ResolutionPolicy, screen, size, Size, UITransform, Vec3, view } from "cc";
import { Debug } from "../../Debugger";

const _vec3Temp = new Vec3();

/**
 * name: 多分辨率适配
 * date: 2020/03/29
 * author: 何沛东
 * description: 多分辨率完美适配
 */
export class AdapterManager {
    private _designResolutionWidth: number;
    private _designResolutionHeight: number;
    private _frameSizeWidth: number;
    private _frameSizeHeight: number;
    private _adapterScele: number;
    private _width: number = 0;
    private _height: number = 0;
    private _bangForWidth: number = 0;
    private _bangForHeight: number = 0;
    private _screenSize: Size = new Size(0, 0);
    private _rate: number;
    
    constructor() {
        
    }

    private static _ins: AdapterManager = null;
    public static get instance(): AdapterManager {
        return this._ins = this._ins ? this._ins : new AdapterManager();
    }

    /**水平偏移 */
    public get width(): number { return this._width; }
    /**垂直偏移 */
    public get height(): number { return this._height; }
    /**有刘海时的水平偏移 */
    public get bangForWidth(): number { return this._bangForWidth; }
    /**有刘海时的垂直偏移 */
    public get bangForHeight(): number { return this._bangForHeight; }
    /**适配后的缩放因子 */
    public get rate(): number { return this._rate; }
    public get scaleX(): number { 
        return screen.windowSize.width / this._designResolutionWidth;
    }
    public get scaleY(): number {
        return screen.windowSize.height / this._designResolutionHeight;
    }

    /**
     * 开始适配，不需要外部调用
     * @param autoAdapter 是否自动适配
     */
    public adapter(autoAdapter: boolean) {
        this._designResolutionWidth = view.getDesignResolutionSize().width;
        this._designResolutionHeight = view.getDesignResolutionSize().height;
        this._frameSizeWidth = screen.windowSize.width;
        this._frameSizeHeight = screen.windowSize.height;
        this._screenSize.width = this._designResolutionHeight / this._frameSizeHeight * this._frameSizeWidth;
        this._screenSize.height = this._designResolutionWidth / this._frameSizeWidth * this._frameSizeHeight;

        let fitWidth: boolean;
        let fitHeight: boolean;
        if (autoAdapter) {
            if(this._designResolutionWidth / this._frameSizeWidth >= this._designResolutionHeight / this._frameSizeHeight) {
                fitWidth = true;
                fitHeight = false;
                view.setDesignResolutionSize(this._designResolutionWidth, this._designResolutionHeight, ResolutionPolicy.FIXED_WIDTH);
            }
            else {
                fitWidth = false;
                fitHeight = true;
                view.setDesignResolutionSize(this._designResolutionWidth, this._designResolutionHeight, ResolutionPolicy.FIXED_HEIGHT);
            }
        }

        if (fitWidth && fitHeight) {
            this.adapterShowAll();
        }
        else if (!fitWidth && fitHeight) {
            this.adapterFitHeight();
        }
        else if (fitWidth && !fitHeight) {
            this.adapteerFitWidth();
        }
    }

    /** 适配节点的宽*/
    public adapterWidth(target: Node) {
        const ui = target.getComponent(UITransform);
        ui.width += this.width * 2;
    }
    /**适配节点的高 */
    public adapterHeight(target: Node) {
        const ui = target.getComponent(UITransform);
        ui.height += this.height * 2;
    }
    /**适配节点的X轴缩放系数 */
    public adapterScaleX(target: Node) {
        _vec3Temp.set(this.getScaleX(target), target.scale.y, target.scale.z);
        target.scale = _vec3Temp;
    }
    /**适配节点的Y轴缩放系数 */
    public adapterScaleY(target: Node) {
        _vec3Temp.set(target.scale.x, this.getScaleY(target),target.scale.z);
        target.scale = _vec3Temp;
    }
    /**适配节点的缩放系数 */
    public adapterScale(target: Node) {
        const scale = this.getScale(target);
        _vec3Temp.set(scale, scale, target.scale.z);
        target.scale = _vec3Temp;
    }
    /**适配后的屏幕大小 */
    public getScreenSize(): Size {
        // Debug.log('After the Adapter of screen size:', this._screenSize);
        return this._screenSize;
    }
    /**返回适配后的节点大小 */
    public getSize(target: Node): Size {
        const ui = target.getComponent(UITransform);
        return size(ui.width + this.width * 2, ui.height + this.height * 2);
    }
    /**目标节点适配后的铺满屏幕的缩放比例 */
    public getScale(target: Node): number {
        const ui = target.getComponent(UITransform);
        let realWidth: number = ui.width * this._adapterScele;
        let realHeight: number = ui.height * this._adapterScele;

        return Math.max(
            screen.windowSize.width / realWidth,
            screen.windowSize.height / realHeight
        );
    }
    /**目标节点适配后的铺满屏幕的X缩放比例 */
    public getScaleX(target: Node): number {
        const ui = target.getComponent(UITransform);
        let realWidth: number = ui.width * this._adapterScele;
        return screen.windowSize.width / realWidth;
    }
    /**目标节点适配后的铺满屏幕的Y缩放比例 */
    public getScaleY(target: Node): number {
        const ui = target.getComponent(UITransform);
        let realHeight: number = ui.height * this._adapterScele;
        return screen.windowSize.height / realHeight;
    }

    private adapterShowAll() {
        Debug.log('按比例拉伸宽高');
        this._adapterScele = Math.min(
            screen.windowSize.width / this._designResolutionWidth,
            screen.windowSize.height / this._designResolutionHeight
        );

        this._rate = Math.min(
            screen.windowSize.width / this._designResolutionWidth,
            screen.windowSize.height / this._designResolutionHeight
        );

        var screenWidth = this._screenSize.width - this._designResolutionWidth;
        var screenHeight = this._screenSize.height - this._designResolutionHeight;
        this._width = screenWidth / 2;
        this._height = screenHeight / 2;

        this.adapterBang();
    }

    private adapterFitHeight() {
        Debug.log('宽保持不变, 适配高');
        this._adapterScele = screen.windowSize.height / this._designResolutionHeight;
        this._rate = screen.windowSize.height / this._designResolutionHeight;

        var screenWidth = this._screenSize.width - this._designResolutionWidth;
        this._width = screenWidth / 2;
        this._height = 0;

        this.adapterBang();
    }

    private adapteerFitWidth() {
        Debug.log('高保持不变,适配宽');
        this._adapterScele = screen.windowSize.width / this._designResolutionWidth;
        this._rate = screen.windowSize.width / this._designResolutionWidth;

        var screenHeight = this._screenSize.height - this._designResolutionHeight;
        this._width = 0;
        this._height = screenHeight / 2;

        this.adapterBang();
    }

    private adapterBang() {
        //横版
        if (this._frameSizeWidth > this._frameSizeHeight) {
            if (this._frameSizeWidth / this._frameSizeHeight > 2) {
                let tempWidth: number = this._frameSizeHeight * 2;
                var screenWidth = this._designResolutionHeight / this._frameSizeHeight * tempWidth - this._designResolutionWidth;
                this._bangForWidth = screenWidth / 2 - this._width;
                this._bangForHeight = 0;
            }
        }
        //竖版
        else if (this._frameSizeWidth < this._frameSizeHeight) {
            if (this._frameSizeHeight / this._frameSizeWidth > 2) {
                let tempHeight: number = this._frameSizeWidth * 2;
                var screenHeight = this._designResolutionWidth / this._frameSizeWidth * tempHeight - this._designResolutionHeight;
                this._bangForWidth = 0;
                this._bangForHeight = screenHeight / 2 - this._height;
            }
        }
    }
}
 