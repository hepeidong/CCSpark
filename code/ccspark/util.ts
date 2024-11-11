import { Node } from "cc";
import { UIPriority } from "./component/UIPriority";

export function setPriority(target: Node, priority: number) {
    let uiPriority = target.getComponent(UIPriority);
    if (!uiPriority) {
        uiPriority = target.addComponent(UIPriority);
    }
    uiPriority.setPriority(priority);
}

export function getPriority(target: Node) {
    let uiPriority = target.getComponent(UIPriority);
    if (!uiPriority) {
        uiPriority = target.addComponent(UIPriority);
    }
    return uiPriority.getPriority();
}