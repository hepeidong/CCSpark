import { _decorator, Node, EventTouch, Vec2, Vec3, UITransform, Component, Enum } from 'cc';
import { EventHandler } from 'cc';
import { utils } from '../utils';
import { Direction, tools } from '../tools';
const { ccclass, property, menu } = _decorator;

const _originRockingBarVec3Temp = new Vec3();
const _startVec2Temp = new Vec2();
const _vec2Temp_1 = new Vec2();
const _vec2Temp_2 = new Vec2();
const _vec2XYAxis = new Vec3();
const _vec3WPosTemp = new Vec3();


@ccclass('RockingBar')
@menu("游戏通用组件/虚拟摇杆/RockingBar(摇杆)")
export class RockingBar extends Component {

    @property(Node)
    private rockingBg: Node = null;
    
    @property(Node)
    private rockingBar: Node = null;

    @property({
        tooltip: "摇杆旋转弧度",
        readonly: true
    })
    ragian: number = 0;

    @property({
        tooltip: "摇杆旋转角度",
        readonly: true
    })
    angle: number = 0;

    @property({
        type : Enum(Direction.Type),
        tooltip: "摇杆方位",
        readonly: true
    })
    direction: Direction.Type = Direction.Type.None;

    @property(EventHandler)
    private backToOriginEvent: EventHandler[] = [];

    @property(EventHandler)
    private moveEvent: EventHandler[] = [];


    
    private _radius: number;
    private _parentUITransform: UITransform;
    start() {
        this._parentUITransform = this.node.getComponent(UITransform);
        this._radius = this.rockingBg.getComponent(UITransform).width / 2;
        _originRockingBarVec3Temp.set(this.rockingBar.position.x, this.rockingBar.position.y);
        _vec3WPosTemp.set(this.rockingBar.worldPosition.x, this.rockingBar.worldPosition.y, this.rockingBar.worldPosition.z);
        
    }

    private backToOrigin() {
        //摇杆棒的原本的初始位置是（0,0,0）
        this.rockingBar.position = _originRockingBarVec3Temp;
        EventHandler.emitEvents(this.backToOriginEvent, this);
    }

    public onTouchStart() {
        _startVec2Temp.set(this.rockingBar.worldPosition.x, this.rockingBar.worldPosition.y);
    }

    public onTouchMove(event: EventTouch) {
        event.touch.getUILocation(_vec2Temp_1);
        event.touch.getUIPreviousLocation(_vec2Temp_2);
        _vec3WPosTemp.set(_vec2Temp_1.x, _vec2Temp_1.y);
        const newPos = this._parentUITransform.convertToNodeSpaceAR(_vec3WPosTemp);
        const angle = utils.MathUtil.Vector2D.rotationAngle(newPos);
        if (this.getMoveLength() < this._radius) {
            this.rockingBar.worldPosition = _vec3WPosTemp;
        }
        else {
            this.setRockingPosition(newPos);
        }
        this.ragian = this.getRadian(newPos);
        this.angle = angle;
        this.direction = tools.Direction.getDirection(angle);
        EventHandler.emitEvents(this.moveEvent, this);
    }

    public onTouchEnd() {
        this.backToOrigin();
    }

    public onTouchCancel() {
        this.backToOrigin();
    }

    private getRadian(pos: Vec3) {
        const tanValue = utils.MathUtil.Vector2D.getTanValue(pos);
        if (tanValue !== -1) {
            return Math.atan(tanValue);
        }
        return pos.y > 0 ? (Math.PI / 2) : (3*Math.PI / 2);
    }

    private getMoveLength() {
        _vec2Temp_2.subtract(_startVec2Temp);
        return _vec2Temp_2.length();
    }

    /**
     * 设置摇杆位置
     * @param pos 手指触摸点坐标
     */
    private setRockingPosition(pos: Vec3) {
        const coord = this.getCoord(pos);
        _vec2XYAxis.set(coord.x, coord.y);
        this.rockingBar.position = _vec2XYAxis;
    }

    private getCoord(a: Vec3) {
        const x = a.x * this._radius / Math.sqrt(a.x * a.x + a.y * a.y);
        const y = a.y * this._radius / Math.sqrt(a.x * a.x + a.y * a.y);
        return {x, y};
    }

    update(deltaTime: number) {
        
    }
}