import { IGuideManager } from "../lib.zest";
import { Group } from "./GroupEnum";
import { EventType } from "./GuideEnum";
import { GuideManager } from "./GuideManager";



export class guide {
    public static get manager(): IGuideManager {
        return GuideManager.instance;
    }

    public static get group() { return Group; }
}

export namespace guide {
    export enum Event {
        /**开始引导 */
        GUIDE_START = EventType.GUIDE_START,
        /**每一步引导完成 */
        GUIDE_COMPLETE = EventType.GUIDE_COMPLETE,
        /**引导结束 */
        GUIDE_OVER = EventType.GUIDE_OVER
    }
}