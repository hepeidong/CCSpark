import { Debug } from "../Debugger";
import { GuideTarget } from "./component/GuideTarget";
import { Scope } from "./GuideEnum";
import { WidgetID } from "./WidgetID";
import { Node } from "cc";
import { setPriority } from "../util";
import { GuideAction } from "./GuideAction";
import { utils } from "../utils";

type panel_t = {
    target: Node;
    scope: Scope;
}

/**检索引导目标 */
 export class GuideSearch {                                                         
    private _guideGroup: Map<string, GuideAction>;    //引导配置文件数据
    private _guidePanels: Map<string, panel_t>;                //被引导的页面节点
    private _guideTargets: Map<string, GuideTarget>;       //引导目标
    private _lightTargets: Map<string, Node[]>;             //高亮的目标节点

    constructor() {
        this._guidePanels = new Map();
        this._guideTargets = new Map();
        this._lightTargets = new Map();
    }

    public isViewOpen(uiId: string): boolean { return this._guidePanels.has(uiId); }
    public getGuideTargets(): Map<string, GuideTarget> { return this._guideTargets; }
    public getLightTargets(): Map<string, Node[]> { return this._lightTargets; }

    public isParentPanel(uiId: string) {
        if (this.isViewOpen(uiId)) {
            const panel = this._guidePanels.get(uiId);
            return panel.scope === Scope.ENTIRE_PANEL;
        }
        return false;
    }

    public clear() {
        this._guidePanels.clear();
        this._guideTargets.clear();
        this._lightTargets.clear();
    }

    /**
     * 设置引导数据文件
     * @param file 
     */
    public setGuideGroup(group: Map<string, GuideAction>): void {
        this._guideGroup = group;
    }

    public addGuideView(uiId: string, target: Node, scope: Scope) {
        if (!this._guidePanels.has(uiId)) {
            this._guidePanels.set(uiId, {target, scope});
            this.searchGuideTarget(target);
        }
        else if (scope === Scope.PARTIAL_PANEL) {
            this.searchGuideTarget(target);
        }
    }

    public removeGuideView(uiId: string, scope: Scope) {
        if (scope === Scope.ENTIRE_PANEL) {
            this._guidePanels.delete(uiId);
        }
    }

    /**
     * 检索到所有高亮的节点
     * @param guideId 
     */
    public searchLightTarget(guideId: string) {
        let uiId: string = this._guideGroup.get(guideId).uiId;
        let panel = this._guidePanels.get(uiId);
        if (panel && panel.scope === Scope.ENTIRE_PANEL) {
            this.addLightTarget(guideId, this._guidePanels.get(uiId).target);
        }
        else {
            uiId = this._guideGroup.get(guideId).uiId;
            this.traversalChild(this._guidePanels.get(uiId).target, (target: Node) => {
                this.storageLightTarget(guideId, target);
            });
        }
    }

    public addGuideTarget(target: GuideTarget) {
        if (!target || !target.target) {
            return false;
        }
        if (target) {
            if (!this._guideTargets.has(target.targetId) && target.targetId.length > 0) {
                this._guideTargets.set(target.targetId, target);
            }
            return true;
        }
        else {
            this.error(this.addGuideTarget, `${target.target.name}节点不是引导节点`);
            debugger;
        }
    }

    public addLightTarget(guideId: string, target: Node) {
        if (!target) {
            this.error(this.addLightTarget, `传入的类型为${typeof target}的参数不是一个节点`);
            return false;
        }
        if (!this._lightTargets.has(guideId)) {
            this._lightTargets.set(guideId, [target]);
        }
        else {
            let nodes: Node[] = this._lightTargets.get(guideId);
            if (nodes.indexOf(target) === -1) {
                nodes.push(target);
                this._lightTargets.set(guideId, nodes);
            }
        }
        return true;
    }

    private searchGuideTarget(target: Node) {
        this.traversalChild(target, this.storageGuideTarget.bind(this));
    }

    private traversalChild(parent: Node, callback: (target: Node) => void) {
        for (let i: number = 0; i < parent.children.length; ++i) {
            const child = parent.children[i];
            //设置节点层级,以便引导完之后恢复节点原本的层级            
            const zIndex = i;
            setPriority(child, zIndex);
            callback && callback(child);
            this.traversalChild(child, callback);
        }
    }

    //存储引导目标
    private storageGuideTarget(target: Node) {
        let targetID: WidgetID = target.getComponent(WidgetID);
        if (!targetID) {
            return;
        }
        let guideTargets: GuideTarget;
        let flag: boolean = false;
        const keysItertor = this._guideGroup.keys();
        for (let key of keysItertor) {
            //检索并存储引导目标
            const guideAction = this._guideGroup.get(key);
            if (guideAction.targetId.indexOf(targetID.ID) > -1) {
                flag = true;
                if (!guideTargets) {
                    guideTargets = new GuideTarget();
                }
                guideTargets.target = target;
                guideTargets.guideIds.push(guideAction.guideId);
                guideTargets.init();
            }
        }
        if (flag) {
            this.addGuideTarget(guideTargets);
        }
    }

    private storageLightTarget(guideId: string, target: Node) {
        let targetID: WidgetID = target.getComponent(WidgetID);
        if (!targetID) {
            return;
        }
        for (let e of this._guideGroup.get(guideId).targetId) {
            if (e === targetID.ID) {
                this.addLightTarget(guideId, target);
                break;
            }
        }
    }

    private error(fn: Function, ...subst: any[]) {
        Debug.error(utils.StringUtil.format("[GuideSearch:%s]", fn.name), ...subst);
    }
}