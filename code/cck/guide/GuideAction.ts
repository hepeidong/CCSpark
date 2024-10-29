import { IGuideAction } from "../lib.cck";

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
    /**引导目标节点id，例如手指指向的按钮节点id */
    public get targetId() { return this._guideInfo.targetId; }
    /**文本引导或对话引导的文字描述 */
    public get descript() { return this._guideInfo.descript; }
    /**ui视图界面ID */
    public get uiId() { return this._guideInfo.uiId; }
    /**下一步引导的id，如果没有下一步引导，则为空字符 */
    public get syncId() { return this._guideInfo.syncId; }
    /**高亮的uiId */
    public get showType() { return this._guideInfo.showType; }
    /**对话引导中是否为NPC */
    public get npc() { return this._guideInfo.npc; }


    public isValid() { return this._isValid; }
    public setIsValid(isValid: boolean) {
        this._isValid = isValid;
    }

    public setGuideConfig(guideInfo: IGuideAction) {
        this._guideInfo = guideInfo;
        this._isValid = true;
    }
}