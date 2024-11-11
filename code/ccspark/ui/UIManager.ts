import { IContainer, IUIControlConfig } from "../lib.cck";


/**
 * author: HePeiDong
 * date: 2021/3/20
 * name: ui控制
 * description: 
 */
export class UIManager {
    private _uiConfig: IContainer<IUIControlConfig>;
    private constructor() {
        
    }

    private static _ins: UIManager = null;
    public static get instance(): UIManager {
        return this._ins = this._ins ? this._ins : new UIManager();
    }

    public get uiConfig(): IContainer<IUIControlConfig> { return this._uiConfig; }


    /**
     * 设置ui配置表文件数据，此接口用于引导框架
     * @param file 
     */
    public setUIConfig(file: IContainer<IUIControlConfig>) {
        this._uiConfig = file;
    }

    /**
     * 是否为页面视图，此接口用于引导框架
     * @param uiId 
     */
    public isView(uiId: string): boolean {
        return this._uiConfig.get(uiId) ? this._uiConfig.get(uiId).uiType === 1 : false;
    }

    /**
     * 是否为按钮，此接口用于引导框架
     * @param uiId 
     */
    public isButton(uiId: string): boolean {
        return this._uiConfig.get(uiId) ? this._uiConfig.get(uiId).uiType === 2 : false;
    }

    /**
     * 是否为页面中的某个显示区域，此接口用于引导框架
     * @param uiId 
     */
    public isPanel(uiId: string): boolean {
        return this._uiConfig.get(uiId) ? this._uiConfig.get(uiId).uiType === 3 : false;
    }
}