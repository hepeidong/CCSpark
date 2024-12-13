import { Color, Label, Node, Sprite, UIOpacity, UITransform } from "cc";
import { GuideManager } from "./GuideManager";
import { setPriority } from "../util";
import { Layers } from "cc";
import { RichText } from "cc";

export function createSprite(name: string) {
    const newNode: Node = new Node(name);
    newNode.layer = Layers.Enum.UI_2D;
    newNode.addComponent(Sprite);
    return newNode;
}

export function createText(name: string) {
    let node: Node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.addComponent(RichText).string = "";
    // const ui = node.getComponent(UITransform);
    node.addComponent(UITransform);
    // ui.width = 100;
    // ui.height = 40;
    // node.getComponent(RichText);
    // label.cacheMode = Label.CacheMode.NONE;
    // label.overflow = Label.Overflow.SHRINK;
    // label.color = Color.BLACK;
    return node;
}

export function createTip(name: string) {
    let tip: Node = new Node(name);
    tip.layer = Layers.Enum.UI_2D;
    tip.addComponent(Label).string = '点击任意继续';
    tip.getComponent(Label).cacheMode = Label.CacheMode.BITMAP;
    let uiOpacity = tip.getComponent(UIOpacity);
    if (!uiOpacity) {
        uiOpacity = tip.addComponent(UIOpacity);
    }
    uiOpacity.opacity = 150;
    return tip;
}

/**恢复目标父节点 */
export function restoreParent(target: Node, zIndex: number, parent: Node) {
    GuideManager.instance.removeToParent(target, parent);
    setPriority(target, zIndex);
}

/**获取下一步引导 */
export function getNextGuideId() {
    let guideId: string;
    const syncGuideId = GuideManager.instance.guideId;
    if (GuideManager.instance.guideGroup.has(syncGuideId)) {
        guideId = GuideManager.instance.guideGroup.get(syncGuideId).syncId;
    }
    else {
        const keyItertor = GuideManager.instance.guideGroup.keys();
        if (!GuideManager.instance.isGuideLaunched) {
            for (const key of keyItertor) {
                //取第一个引导动作的引导id
                guideId = GuideManager.instance.guideGroup.get(key).guideId;
                break;
            }
        }
        else {
            for (const key of keyItertor) {
                //取第一个引导动作的下一步引导id
                guideId = GuideManager.instance.guideGroup.get(key).syncId;
                break;
            }
        }
    }
    return guideId;
}

export function addGuideElement(uiId: string, target: Node) {
    const guideId: string = getNextGuideId();
    if (guideId.length > 0) {
        let guideAction = GuideManager.instance.guideGroup.get(guideId);
        if (guideAction && guideAction.getData().uiId === uiId) {
            GuideManager.instance.addGuideView(uiId, target, guideAction.getData().showType);
        }
    }
}

export function curText(str: string, tempStrArr: string[]) {
    let charArr = str.replace(/<.+?\/?>/g, '').split('');
    tempStrArr.push(str);
    
    for (let i = charArr.length; i > 1; i--) {
        let curStr = tempStrArr[charArr.length - i];
        let lastIdx = curStr.lastIndexOf(charArr[i - 1]);
        let prevStr = curStr.slice(0, lastIdx);
        let nextStr = curStr.slice(lastIdx + 1, curStr.length);
        tempStrArr.push(prevStr + nextStr);
    }
}