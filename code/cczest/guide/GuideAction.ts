import { IGuideAction } from "zest";

export class GuideAction implements IGuideAction {
    private _isValid: boolean;
    private _guideInfo: IGuideAction;                          //当前的引导配置信息

    constructor(guideInfo: IGuideAction) {
        this._guideInfo = guideInfo;
        this._isValid = true;
    }

    /**引导id */
    public get guideId() { return this._guideInfo.guideId; }
    /**引导类型0是手指引导，1是对话引导，2是文本引导 */
    public get guideType() { return this._guideInfo.guideType; }
    /**下一步引导的id，如果没有下一步引导，则为空字符 */
    public get syncId() { return this._guideInfo.syncId; }
    public getData<T = any>() { return this._guideInfo["data"] as T; }

    public isValid() { return this._isValid; }
    public setIsValid(isValid: boolean) {
        this._isValid = isValid;
    }

    public setGuideConfig(guideInfo: IGuideAction) {
        this._guideInfo = guideInfo;
        this._isValid = true;
    }
}