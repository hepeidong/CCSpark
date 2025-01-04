import { js } from "cc";
import { IRedDotAction } from "zest";
import { getRedDotActionClassNames } from "../decorator/Decorator";
import { CCRedDotAction } from "./CCRedDotAction";
import { RedDotManager } from "./RedDotManager";
export * from "./component/RedDotView";

export class redDot {
    /**初始化红点行为 */
    public static initRedDotAction() {
        const names = getRedDotActionClassNames();
        for (const name of names) {
            const classRef = js.getClassByName(name) as {new (id: string): IRedDotAction};
            RedDotManager.instance.addRedDotAction(classRef, name);
        }
    }

    /**
     * 设置红点的树形关系，存储结构是树，处于最外层的红点是根节点，往下的红点是子节点，以此类推
     * @param parentId 父亲红点id
     * @param childId 儿子红点id
     */
    public static setRedDot(parentId: string, childId: string) {
        RedDotManager.instance.setRedDot(parentId, childId);
    }

    /**
     * 设置指定id的红点的显示状态
     * @param redDotId 红点ID
     */
    public static setStatus(redDotId: string) {
        RedDotManager.instance.update(redDotId);
    }
}

export namespace redDot {
    export abstract class RedDotAction extends CCRedDotAction {
        public abstract updateStatus(): void;
    }
}