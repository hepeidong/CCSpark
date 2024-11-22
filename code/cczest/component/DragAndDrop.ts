import { _decorator, Component, Node, EventTouch, Vec3, Enum, UITransform, EventHandler, Vec2 } from 'cc';
const { ccclass, property, menu } = _decorator;

enum DragDirection {
    HORIZONTAL,
    VERTICAL
}

enum HorizontalDestination {
    LEFT,
    RIGHT
}

enum VerticalDestination {
    TOP,
    DOWN
}


const _tempVec3 = new Vec3();
const _tempVec2 = new Vec2();
const _tempVec2_1 = new Vec2();
const _tempStartVec2 = new Vec2();

@ccclass('DragAndDrop')
@menu('游戏通用组件/拖拽放置功能套件/DragAndDrop(拖拽放置组件)')
export class DragAndDrop extends Component {

    @property({
        tooltip: "当前节点是否在滑动视图中"
    })
    private inScrollView: boolean = false;

    @property({
        type: Enum(DragDirection),
        tooltip: "指定拖拽的方向：HORIZONTAL 水平方向拖拽，VERTICAL 垂直方向拖拽"
    })
    private dragDirection: DragDirection = DragDirection.HORIZONTAL;

    @property({
        type: Enum(HorizontalDestination),
        tooltip: "指定拖拽的终点相对所拖拽的目标所在的方向",
        visible(this: DragAndDrop) {
            return this.dragDirection === DragDirection.HORIZONTAL;
        }
    })
    private horizontalDestination: HorizontalDestination = HorizontalDestination.LEFT;

    @property({
        type: Enum(VerticalDestination),
        tooltip: "指定拖拽的终点相对所拖拽的目标所在的方向",
        visible(this: DragAndDrop) {
            return this.dragDirection === DragDirection.VERTICAL;
        }
    })
    private verticalDestination: VerticalDestination = VerticalDestination.TOP;

    @property({
        tooltip: "拖拽的角度限制，只有大于等于这个角度，才会被拖动"
    })
    private angle: number = 45;

    //根据滑动视图源码可知，滑动大于7时，滑动视图会把它当前子节点正在执行的触摸事件强行发送TOUCH_CANCEL，
    //故此时应该为7的两倍，以防止节点的触摸事件被滑动视图拦截
    @property
    private _bufferSize: number = 14;
    @property({
        tooltip: "拖拽的缓冲区，需要拖拽的距离大于等于这个数值时，才会被拖动，注意：如果节点是在滑动视图中，必须大于等于14"
    })
    set bufferSize(val: number) {
        if (this.inScrollView && val < 14) {
            this._bufferSize = 14;
        }
        else {
            this._bufferSize = val;
        }
    }
    get bufferSize() { return this._bufferSize; }

    @property({
        type: EventHandler,
        tooltip: "发生移动拖拽时执行的事件"
    })
    private moveEvents: EventHandler[] = [];

    @property({
        type: EventHandler,
        tooltip: "结束移动拖拽时执行的事件"
    })
    private endEvents: EventHandler[] = [];

    private _preventTouchEvent: boolean = false;
    private _startDraging: boolean = false;
    private _canBeDragged: boolean = false;
    private _touchCanceldCount: number = 0;
    private _originVec: Vec3 = new Vec3();
    private _originWPos: Vec3 = new Vec3();
    private _wpos: Vec3 = new Vec3();

    get originWPos() { return this._originWPos; }
    get worldPosition() { return this._wpos; }

    start() {
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMoved, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnded, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCanceled, this);
    }

    private onTouchMoved(event: EventTouch) {
        if (!this._startDraging) {
            this._startDraging = true;
            this.cacheInitialVector();
        }
        else {
            if (!this._canBeDragged && !this._preventTouchEvent) {
                this.juageDrag(event);
            }
            if (this._canBeDragged && !this._preventTouchEvent) {
                this.setVec(event);
                EventHandler.emitEvents(this.moveEvents, this);
            }
        }
    }

    private onTouchEnded(event: EventTouch) {
        this.handleRelease(event);
    } 

    private onTouchCanceled(event: EventTouch) {
        if (this.inScrollView) {
            this._touchCanceldCount++;
            if (this._touchCanceldCount == 2) {
                this.handleRelease(event);
            }
            else {
                if (this._canBeDragged) {
                    this.handleRelease(event);
                }
            }
        }
        else {
            this.handleRelease(event);
        }
    }

    private cacheInitialVector() {
        this._originVec.set(this.node.position.x, this.node.position.y, this.node.position.z);
        this._originWPos.set(this.node.worldPosition.x, this.node.worldPosition.y, this.node.worldPosition.z);
        _tempVec3.set(this.node.position.x, this.node.position.y, this.node.position.z);
    }

    private handleRelease(event: EventTouch) {
        this.setLocalAxisAlignDelta(event);
        this._startDraging = false;
        this._touchCanceldCount = 0;
        if (!this._preventTouchEvent) {
            if (this._canBeDragged) {
                this._canBeDragged = false;
                EventHandler.emitEvents(this.endEvents, this);
            }
        }
        else {
            this._preventTouchEvent = false;
        }
    }
    
    /**判定是否能够被拖拽 */
    private juageDrag(event: EventTouch) {
        const destination = this.destination(event);
        if (this.dragDirection === DragDirection.HORIZONTAL && destination === this.horizontalDestination) {
            this.setVec(event);
            this.juageBufferSizeAndAngle(event, this.angleHorizontal(event));
        }
        else if (this.dragDirection === DragDirection.VERTICAL && destination === this.verticalDestination) {
            this.setVec(event);
            this.juageBufferSizeAndAngle(event, this.angleVertical(event));
        }
    }

    private juageBufferSizeAndAngle(event: EventTouch, angle: number) {
        const result = this.canBeDragged(event);
        if (result) {
            if (angle >= this.angle) {
                this._canBeDragged = true;
                this._preventTouchEvent = false;
            }
            else {
                this._preventTouchEvent = true;
            }
        }
    }

    private setVec(event: EventTouch) {
        _tempVec3.x += event.getDeltaX();
        _tempVec3.y += event.getDeltaY();
        this.setLocalAxisAlignDelta(event);
        this._wpos.set(_tempVec2.x, _tempVec2.y, this._wpos.z);
    }

    private setLocalAxisAlignDelta(event: EventTouch) {
        event.touch.getUILocation(_tempVec2);
        event.touch.getUIPreviousLocation(_tempVec2_1);
    }

    private destination(event: EventTouch) {
        if (this.dragDirection === DragDirection.HORIZONTAL) {
            if (event.getDeltaX() < 0) {
                return HorizontalDestination.LEFT;
            }
            else if (event.getDeltaX() > 0) {
                return HorizontalDestination.RIGHT;
            }
        }
        else if (this.dragDirection === DragDirection.VERTICAL) {
            if (event.getDeltaY() > 0) {
                return VerticalDestination.TOP;
            }
            else if (event.getDeltaY() < 0) {
                return VerticalDestination.DOWN;
            }
        }
        return undefined;
    }

    private angleHorizontal(event: EventTouch) {
        event.touch.getUIStartLocation(_tempStartVec2);
        const dY = _tempVec2.y - _tempStartVec2.y;
        const dX = _tempVec2.x - _tempStartVec2.x;

        const tanValue = Math.abs(dY) / Math.abs(dX);
        const arcTanValue = Math.atan(tanValue);
        return arcTanValue * 180 / Math.PI;
    }

    private angleVertical(event: EventTouch) {
        event.touch.getUIStartLocation(_tempStartVec2);
        const dY = _tempVec2.y - _tempStartVec2.y;
        const dX = _tempVec2.x - _tempStartVec2.x;

        const tanValue = Math.abs(dX) / Math.abs(dY);
        const arcTanValue = Math.atan(tanValue);
        return arcTanValue * 180 / Math.PI;
    }

    private moveLength(event: EventTouch) {
        _tempVec2.subtract(event.touch.getUIStartLocation(_tempVec2_1));
        return _tempVec2.length();
    }

    private canBeDragged(event: EventTouch) {
        const d = this.moveLength(event);
        //移动距离超过了缓冲大小，则视为可以被拖动
        if (d >= this.bufferSize) { 
            return true;
        }
        return false;
    }

    update(deltaTime: number) {
        
    }
}

