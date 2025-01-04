import { setParentType } from "../decorator/Decorator";
import { IRedDotAction } from "zest";
import { RedDotManager } from "./RedDotManager";

export abstract class CCRedDotAction implements IRedDotAction {
    private _id: string;
    constructor(id: string) {
        this._id = id;
    }

    protected setStatus(status: boolean) {
        RedDotManager.instance.setRedDotStatus(this._id, status);
    }

    /**
     * 更新红点的状态：
     *               在这里实现红点状态的更新，每次刷新红点时，都会执行此函数，以更新红点状态。
     */
    public abstract updateStatus(): void;
}

setParentType("redDot", CCRedDotAction);