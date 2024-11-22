import { _decorator, Component, Node, Vec3, Enum, geometry, UITransform, Vec2, Size, EventHandler, Button } from 'cc';
const { ccclass, property, menu } = _decorator;

enum AreaType {
    CUSTOM,
    NODE
}

enum IntersectType {
    AABB,
    CUSTOM
}


@ccclass("Area")
class Area {
    @property({
        tooltip: "目标区域坐标原点，此坐标必须是世界坐标系下的坐标"
    })
    point: Vec3 = new Vec3();

    @property({
        tooltip: "目标区域宽"
    })
    w: number = 0;

    @property({
        tooltip: "目标区域高"
    })
    h: number = 0;
}

@ccclass('IntersectHelper')
@menu('游戏通用组件/拖拽放置功能套件/IntersectHelper(相交检测组件)')
export class IntersectHelper extends Component {

    @property({
        type: Enum(AreaType),
        tooltip: "指定目标区域的类型，CUSTOM 自定义类型，需要自己确定区域，NODE 节点类型，指定目标节点，自动根据节点确定区域"
    })
    private areaType: AreaType = AreaType.CUSTOM;

    @property({
        type: Node,
        tooltip: "指定需要判断是否与当前节点相交的目标节点",
        visible(this: IntersectHelper) {
            return this.areaType === AreaType.NODE;
        }
    })
    target: Node = null;

    @property({
        type: Area,
        tooltip: "指定需要判断是否与当前节点相交的目标区域",
        visible(this: IntersectHelper) {
            return this.areaType === AreaType.CUSTOM;
        }
    })
    area: Area = new Area();

    @property({
        type: Enum(IntersectType),
        tooltip: "指定相交类型，AABB 两个矩形区域的相交，CUSTOM 自定义当前节点以原点为中心的相交区域与目标区域的相交"
    })
    private intersectType: IntersectType = IntersectType.AABB;

    @property({
        tooltip: "自定义当前要与目标区域相交的区域大小",
        visible(this: IntersectHelper) {
            return this.intersectType === IntersectType.CUSTOM;
        }
    })
    private size: Size = new Size();

    @property({
        type: EventHandler,
        tooltip: "相交判定后执行的事件"
    })
    intersectEvents: EventHandler[] = [];

    private _isIntersect: boolean = false;
    private _originAABB: geometry.AABB;
    private _targetAABB: geometry.AABB;
    private _uiTransform: UITransform;
    private _originArea: {w: number, h: number};

    get isIntersect() { return this._isIntersect; }

    start() {
        
    }

    public setTarget(target: Node) {
        this.target = target;
    }

    public setArea(point: Vec3, w: number, h: number) {
        this.area.point.set(point.x, point.y, point.z);
        this.area.w = w;
        this.area.h = h;
    }

    /**
     * 判断是否相交，如果目标节点有Button组件，且为禁用状态，则此方法始终返回false
     * @returns 返回是否相交
     */
    public juageIntersect() {
        this.getIsIntersect();
        EventHandler.emitEvents(this.intersectEvents, this);
        return this._isIntersect;
    }

    public getIsIntersect() {
        const button = this.target.getComponent(Button);
        if (button) {
            if (button.interactable) {
                return this.checkIntersect();
            }
            else {
                return false;
            }
        }
        return this.checkIntersect();
    }

    public checkIntersect() {
        if (!this._originArea) {
            this._originArea = this.getWH();
        }
        if (!this._originAABB) {
            this._originAABB = geometry.AABB.create();
        }
        geometry.AABB.set(
            this._originAABB, 
            this.node.worldPosition.x, 
            this.node.worldPosition.y, 
            0, 
            this._originArea.w / 2, 
            this._originArea.h / 2,
            0);

        if (!this._targetAABB) {
            this._targetAABB = geometry.AABB.create();
        }
        if (this.areaType === AreaType.NODE) {
            const ui = this.target.getComponent(UITransform);
            this._targetAABB = geometry.AABB.set(
                this._targetAABB,
                this.target.worldPosition.x, 
                this.target.worldPosition.y, 
                0, 
                ui.width / 2, 
                ui.height / 2,
                0);
        }
        else if (this.areaType === AreaType.CUSTOM) {
            this._targetAABB = geometry.AABB.set(
                this._targetAABB,
                this.area.point.x, 
                this.area.point.y, 
                0, 
                this.area.w / 2, 
                this.area.h / 2,
                0);
        }
        this._isIntersect = geometry.intersect.aabbWithAABB(this._originAABB, this._targetAABB);
        return this._isIntersect;
    }

    private getWH() {
        if (this.intersectType === IntersectType.AABB) {
            if (!this._uiTransform) {
                this._uiTransform = this.node.getComponent(UITransform);
            }
            return {w: this._uiTransform.width / 2, h: this._uiTransform.height / 2};
        }
        else {
            return {w: this.size.width, h: this.size.height};
        }
    }

    update(deltaTime: number) {
        
    }
}

