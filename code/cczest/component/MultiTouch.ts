import { Component, Enum, EventHandler, Node, Rect, size, Size, Sprite, tween, UITransform, v2, v3, Vec2, Vec3, _decorator } from "cc";
import { Debug } from "../Debugger";
import { SAFE_CALLBACK } from "../Define";
import { utils } from "../utils";

/**
 * author: 何沛东
 * date: 2020/9/28
 * description: 常用的功能组件，用于多点触摸对应多目标的绝大多数情况下功能的实现
 */
const { ccclass, property, menu } = _decorator;

enum SortType {
    /**按顺序排列 */
    PUT_IN_ORDER,
    /**寻找最近的位置放入 */
    PUT_IN_NEAEREST
}

let sortType = Enum(SortType);

@ccclass('TargetArea')
class TargetArea {
    constructor() { }

    @property({
        type: Node,
        displayName: '目标区域节点'
    })
    target: Node = null;

    @property({
        displayName: '凹槽个数'
    })
    grooveCount: number = 0;
}

@ccclass('OriginArea')
class OriginArea {
    constructor() { }

    @property({
        type: Node,
        displayName: '初始区域节点'
    })
    origin: Node = null;

    @property({
        displayName: '初始位置个数'
    })
    originCount: number = 0;
}

@ccclass('BallNode')
class BallNode {
    constructor() { }

    @property({
        type: Node,
        displayName: '触摸小球'
    })
    ball: Node = null;

    /**目标区域第几号凹槽，0表示没有放入目标区域 */
    public tarGrNum: number = 0;
    /**初始区域第几号凹槽，0表示已经移出初始区域 */
    public origGrNum: number = 0;
    /**小球是否已经移出初始位置 */
    public removed: boolean = false;
    /**小球移入目标位置 */
    public intersect: boolean = false;
}

@ccclass("MultiTouch")
@menu('游戏通用组件/ui/MultiTouch(多目标触摸相交判定)')
export  class MultiTouch extends Component {

    @property({
        type: TargetArea,
        displayName: '目标区域',
        visible(this: MultiTouch) {
            if (!this.targetArea) {
                this.targetArea = new TargetArea();
                this.targetArea.target = new Node('targetArea');
                this.targetArea.target.addChild(new Node('content'));
                this.targetArea.target.parent = this.node;
                Debug.log('构建了targetArea父节点');
                Debug.log('构建了content子节点');
            }
            else if (!this.targetArea.target) {
                this.targetArea.target = new Node('targetArea');
                this.targetArea.target.addChild(new Node('content'));
                this.targetArea.target.parent = this.node;
                Debug.log('构建了targetArea父节点');
                Debug.log('构建了content子节点');
            }
            return true;
        }
    })
    targetArea: TargetArea = null;

    @property({
        type: OriginArea,
        displayName: '初始区域',
        visible(this: MultiTouch) {
            if (!this.originArea) {
                this.originArea = new OriginArea();
                this.originArea.origin = new Node('originArea');
                this.originArea.origin.addChild(new Node('content'));
                this.originArea.origin.parent = this.node;
                Debug.log('构建了originArea父节点');
                Debug.log('构建了content子节点');
            }
            else if (!this.originArea.origin) {
                this.originArea.origin = new Node('originArea');
                this.originArea.origin.addChild(new Node('content'));
                this.originArea.origin.parent = this.node;
                Debug.log('构建了originArea父节点');
                Debug.log('构建了content子节点');
            }
            return true;
        }
    })
    originArea: OriginArea = null;

    @property({
        tooltip: '激活触摸事件'
    })
    activeTouch: boolean = true;

    @property({
        type: sortType,
        tooltip: `PUT_IN_ORDER：小球会按顺序排列放入
            PUT_IN_NEAEREST：小球会寻找最近的位置放入
        `
    })
    sortWay: SortType = sortType.PUT_IN_ORDER;

    @property(EventHandler)
    mouseEnterEvent: EventHandler = null;

    @property(EventHandler)
    mouseLeaveEvent: EventHandler = null;

    @property(EventHandler)
    touchStartEvent: EventHandler = null;

    @property(EventHandler)
    touchMoveEvent: EventHandler = null;

    @property(EventHandler)
    touchEndEvent: EventHandler = null;

    @property(EventHandler)
    touchCancelEvent: EventHandler = null;


    /**目标凹槽列表 */
    private targetGrooves: Node[] = [];

    /**触摸小球列表 */
    private ballList: BallNode[] = [];
    /**初始区域凹槽位置标记，0表示没有移走，1表示已经移到目标凹槽上 */
    private origGrFlags: number[] = [];
    /**目标区域凹槽位置标记，0表示没有小球放入，1表示有小球放入 */
    private tarGrFlags: number[] = [];
    private _oldPosition: Vec3;
    private _ballCount: number = 0;
    private _ballOriginList: Vec3[] = [];
    private _ballSizeList: Size[] = [];
    private _balltargetCall: Function;
        
 

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.initBall();
        this.initArray(this.origGrFlags, this.originArea.originCount);
        this.initArray(this.tarGrFlags, this.targetArea.grooveCount);
        this.initOrignList();
        this.registerEvent();
    }

    start() {

    }

    /**目标区域小球个数 */
    public get ballCount(): number { return this._ballCount; }
    public get ballTypes(): BallNode[] { return this.ballList; }
    public get tarGrooves(): Node[] { return this.targetGrooves; }
    public get tarArea(): Node { return this.targetArea.target; }

    /**
     * 小球是否移动到了目标区域里
     * @param ballIndex 小球列表索引
     */
    public inTargetArea(ballIndex: number): boolean {
        return this.ballList[ballIndex].intersect;
    }

    /**把小球恢复到原来的初始状态 */
    public recover() {
        let flag: boolean = false;
        let isInit: boolean = false;//是否需要初始化
        let wrongNums: number[] = [];
        for (let i: number = 0; i < this.ballList.length; ++i) {
            if (this.ballList[i].tarGrNum > 0 && this.ballList[i].origGrNum > 0) {
                debugger;
            }
            if (this.ballList[i].tarGrNum > 0) {
                isInit = true;
                if (this.origGrFlags[i] === 0) {
                    flag = true;
                }
            }
            if (flag) {
                //找出占用了其它小球位置的该小球编号
                wrongNums.push(i + 1);
                flag = false;
            }
        }
        for (let e of wrongNums) {
            let grooveIndex: number = this.tarGrFlags.indexOf(0);
            this.putDownTargetArea(e, grooveIndex + 1);
        }
        Debug.log('recover isInit', isInit);
        if (isInit) {
            this.putDownBallAllToOriginArea();
        }
    }
    /**
     * 移动到指定目标区域得回调
     */
     public ballTargetCall(callback: Function){
         //传值
        this._balltargetCall = callback;
     }

    /**
     * 移动到指定目标区域
     * @param origGrNums 初始位置上的小球编号，从1开始
     * @param tarGrNums 目标区域的位置，从1开始
     * @param durat 持续时间
     * @param recover 是否要把不在初始区域上的小球回到初始区域，初始值为true，如果传入false，当找不到初始区域相应编号的小球时，返回false，移动失败
     * @example moveToTarget([1, 2, 3], [1, 2, 3], 1);
     */
    public moveToTarget(origGrNums: number[], tarGrNums: number[], durat: number, recover: boolean = true): boolean {
        if (origGrNums.length !== tarGrNums.length) {
            return false;
        }
        if (tarGrNums.length > this.targetArea.grooveCount) {
            return false;
        }
        let origBalls: BallNode[] = [];

        let res = this.getOriginBalls(origGrNums, recover);
        if (res.flag) {
            origBalls = res.balls;
        }
        else {
            return false;
        }

        for (let i: number = 0; i < tarGrNums.length; ++i) {
            if (tarGrNums[i] > this.targetArea.grooveCount) {
                return false;
            }

            // Debug.log("origBalls[i].ball",origBalls[i].ball);
            if(!origBalls[i].ball.active){
                origBalls[i].ball.active = true;
            }
            const targetUI = this.targetArea.target.getComponent(UITransform);
            const parentUI = origBalls[i].ball.parent.getComponent(UITransform);
            const worldPos = targetUI.convertToWorldSpaceAR(v3(this.tarGrooves[tarGrNums[i] - 1].position.x, this.tarGrooves[tarGrNums[i] - 1].position.y));
            const position = parentUI.convertToNodeSpaceAR(worldPos);

            if (durat > 0) {
                tween(origBalls[i].ball).to(durat, { position: v3(position.x, position.y) })
                    .call(() => {
                        origBalls[i].removed = true;//设置小球为已经移出初始位置状态
                        let index: number = this.getIndexOf((e) => { return e.origGrNum === origGrNums[i]; });
                        this.putDownTargetArea(index + 1, tarGrNums[i]); 
                    })
                    .start();
            }
            else {
                origBalls[i].removed = true;//设置小球为已经移出初始位置状态
                let index: number = this.getIndexOf((e) => { return e.origGrNum === origGrNums[i]; });
                this.putDownTargetArea(index + 1, tarGrNums[i]);
            }
        }
        return true;
    }

    /**返回所有小球 */
    public getBalls() {
        let balls: Node[] = [];
        for (let e of this.ballList) {
            balls.push(e.ball);
        }
        return balls;
    }

    /**返回当前初始区域里的小球 */
    public getBallsInOriginArea(start: number = 1, end: number = this.ballList.length): Node[] {
        let balls: Node[] = [];
        for (let e of this.ballList) {
            if (e.origGrNum > 0 && e.origGrNum >= start && e.origGrNum <= end) {
                balls.push(e.ball);
            }
        }
        return balls;
    }

    /**返回目标区域的小球 */
    public getBallsInTargetArea(start: number = 1, end: number = this.ballList.length): Node[] {
        let balls: Node[] = [];
        for (let e of this.ballList) {
            if (e.tarGrNum > 0 && e.tarGrNum >= start && e.tarGrNum <= end) {
                balls[e.tarGrNum - 1] = e.ball;
            }
        }
        return balls;
    }

    /**把目标区域所有小球放入到初始区域 */
    public putDownBallAllToOriginArea() {
        for (let i = 0; i < this.ballList.length; ++i) {
            if (this.ballList[i].tarGrNum > 0) {
                let originIndex: number = this.origGrFlags.indexOf(1);
                this.putDownOriginArea(i + 1, originIndex + 1);
            }
        }
    }

    /**按编号返回初始区域里的小球 */
    private getOriginBalls(origGrNums: number[], recover: boolean): {balls: BallNode[]; flag: boolean} {
        let origBalls: BallNode[] = [];
        for (let e of origGrNums) {
            let indexs: number[] = [];
            let flag: boolean = false;
            const len = this.ballList.length;
            for (let i: number = 0; i < len; ++i) {
                if (e === this.ballList[i].origGrNum) {
                    origBalls.push(this.ballList[i]);
                    flag = true;
                    break;
                }
                else if (this.ballList[i].origGrNum === 0) {
                    indexs.push(i);
                }
            }
            if (!flag) {
                if (recover) {
                    //这些小球不在初始区域里，需要把它们先放入初始区域
                    for (let n: number = 0; n < indexs.length; ++n) {
                        let originIndex: number = this.origGrFlags.indexOf(1);
                        this.putDownOriginArea(indexs[n] + 1, originIndex + 1);
                    }
                }
                else {
                    if (this.origGrFlags[e - 1] === 1) {
                        return {balls: origBalls, flag: false};
                    }
                }
            }
        }
        return {balls: origBalls, flag: true};
    }

    /**返回某个编号下的小球索引 */
    private getIndexOf(callback: (e: BallNode) => boolean) {
        let index: number = -1;
        for (let e of this.ballList) {
            index++;
            if (callback(e)) {
                break;
            }
        }
        return index;
    }

    private convertParent(child: Node, parent: Node, position: Vec3) {
        if (!child) {
            return;
        }
        child.parent = parent;
        child.position = position;
        child.active =false;        
        SAFE_CALLBACK(this._balltargetCall());
    }

    private initBall() {
        let originContent: Node = this.originArea.origin.getChildByName('content');
        for (let i: number = 0; i < originContent.children.length; ++i) {
            this.ballList[i] = new BallNode();
            this.ballList[i].ball = originContent.children[i];
            this.ballList[i].origGrNum = i + 1;
            this.ballList[i].tarGrNum = 0;
            const ballUI = this.ballList[i].ball.getComponent(UITransform);
            this._ballSizeList[i] = size(ballUI.width, ballUI.height);
        }

        let targetContent: Node = this.targetArea.target.getChildByName('content');
        for (let i: number = 0; i < targetContent.children.length; ++i) {
            this.targetGrooves[i] = targetContent.children[i];
        }
    }

    private initArray(array: number[], len: number) {
        for (let i: number = 0; i < len; ++i) {
            array[i] = 0;
        }
    }

    private initOrignList() {
        for (let e of this.ballList) {
            this._ballOriginList.push(e.ball.position);
        }
    }

    private registerEvent() {
        for (let i: number = 0; i < this.ballList.length; ++i) {
            this.ballList[i].ball.on(Node.EventType.MOUSE_ENTER, () => this.onMouseEnter(i), this);
            this.ballList[i].ball.on(Node.EventType.MOUSE_LEAVE, () => this.onMouseLeave(i), this);
            this.ballList[i].ball.on(Node.EventType.TOUCH_START, (evt) => {
                let data = {
                    content: {
                        i: i,
                        x: evt.getLocationX(),
                        y: evt.getLocationY()
                    }
                };
                this.onTouchStart(data);
            }, this);
            this.ballList[i].ball.on(Node.EventType.TOUCH_MOVE, (evt) => {
                let data = {
                    content: {
                        i: i,
                        x: evt.getLocationX(),
                        y: evt.getLocationY()
                    }
                };
                this.onTouchMove(data);
            }, this);
            this.ballList[i].ball.on(Node.EventType.TOUCH_END, () => {
                let data = {
                    content: {
                        i: i
                    }
                };
                this.onTouchEnd(data);
            }, this);
            this.ballList[i].ball.on(Node.EventType.TOUCH_CANCEL, () => {
                let data = {
                    content: {
                        i: i
                    }
                };
                this.onTouchCancel(data);
            }, this);
        }
    }

    private getMinDisOfIndex(targetList: any[], ball: Node, parent: Node, callback: (index: number) => boolean): number {
        let min: {dis: number; index: number;} = {dis: 0, index: 0};
        for (let i: number = 0; i < targetList.length; ++i) {
            let position = utils.EngineUtil.convertPosition(ball, parent);
            let dis: number;
            if (targetList[i].position) {
                dis = utils.MathUtil.Vector2D.distance(v3(position.x, position.y), targetList[i].position);
            }
            else {
                dis = utils.MathUtil.Vector2D.distance(v3(position.x, position.y), targetList[i]);
            }
            min = {dis: dis, index: i};
            if (min.dis > dis && callback(i)) {
                min = {dis: dis, index: i};
                Debug.log('distance', min);
            }
        }
        return min.index;
    }

    /**
     * 放下小球
     * @param data 
     */
    private putDownBall(data: any) {
        if (this.ballList[data.content.i].intersect) {
            let grooveIndex: number;
            if (this.sortWay === SortType.PUT_IN_ORDER) {
                grooveIndex = this.tarGrFlags.indexOf(0);
            }
            else if (this.sortWay === SortType.PUT_IN_NEAEREST) {
                grooveIndex = this.getMinDisOfIndex(this.targetGrooves, this.ballList[data.content.i].ball, 
                    this.targetArea.target,
                    (index) => {
                    return this.tarGrFlags[index] === 0;
                });
            }
            this.putDownTargetArea(data.content.i + 1, grooveIndex + 1);
        }
        else {
            let originIndex: number;
            if (this.sortWay === SortType.PUT_IN_ORDER) {
                originIndex = this.origGrFlags.indexOf(1);
            }
            else if (this.sortWay === SortType.PUT_IN_NEAEREST) {
                originIndex = this.getMinDisOfIndex(this._ballOriginList, this.ballList[data.content.i].ball, 
                    this.originArea.origin,
                    (index) => {
                    return this.origGrFlags[index] === 1;
                });
            }
            this.putDownOriginArea(data.content.i + 1, originIndex + 1);
        }
    }

    /**
     * 小球放到目标区域里
     * @param ballNumber 小球号码，从1开始，数组操作需要减一
     * @param grooveNumber 目标区域凹槽位置编号，从1开始
     */
    private putDownTargetArea(ballNumber: number, grooveNumber: number) {
        if (grooveNumber > 0 && this.ballList[ballNumber - 1].tarGrNum === 0) {
            this.ballList[ballNumber - 1].tarGrNum = grooveNumber;
            this.tarGrFlags[grooveNumber - 1] = 1;
            this.origGrFlags[this.ballList[ballNumber - 1].origGrNum - 1] = 1;
            this.ballList[ballNumber - 1].origGrNum = 0;
            this._ballCount++;
            this.convertParent(this.ballList[ballNumber - 1].ball, this.targetArea.target, this.targetGrooves[grooveNumber - 1].position);
        }
        else {
            this.ballList[ballNumber - 1].ball.position = this._oldPosition;
        }
    }

    /**
     * 小球放到初始区域里
     * @param ballNumber 小球号码
     * @param originNumber 小球被移走的初始区域凹槽索引
     */
    private putDownOriginArea(ballNumber: number, originNumber: number) {
        let ballIndex = 0; //要放下的小球的位置索引
        if (this.ballList[ballNumber - 1].removed) {
            Debug.log('putDownOriginArea originNumber', originNumber);
            //底板凹槽有空出来的位置
            if (originNumber > 0) {
                ballIndex = originNumber - 1;
                //把这个位置数据赋值0，表示需要在这个凹槽位置放入一个小球
                this.origGrFlags[originNumber - 1] = 0;
                //把原来非空闲的凹槽，变成空闲状态，因为这个号码的小球可能要放入到别的空闲凹槽里
                if (this.ballList[ballNumber - 1].origGrNum > 0) {
                    this.origGrFlags[this.ballList[ballNumber - 1].origGrNum - 1] = 1;
                    this.ballList[ballNumber - 1].origGrNum = 0;
                }
                //这个凹槽放入的是几号小球
                this.ballList[ballNumber - 1].origGrNum = originNumber;
            }
            else {
                ballIndex = this.ballList[ballNumber - 1].origGrNum - 1;
            }

            //一颗小球回到初始区域里
            //当前小球在哪个凹槽上
            let index = this.ballList[ballNumber - 1].tarGrNum - 1;
            //这个小球是从目标区域凹槽下落到初始区域凹槽上的
            if (index > -1) {
                ballIndex = originNumber - 1;
                this.ballList[ballNumber - 1].tarGrNum = 0;
                this.tarGrFlags[index] = 0;
                this._ballCount--;
            }

            this.ballList[ballNumber - 1].origGrNum = ballIndex + 1;
            this.ballList[ballNumber - 1].removed = false;
        }
        else {
            ballIndex = this.ballList[ballNumber - 1].origGrNum - 1;
        }

        if (ballIndex === -1) {
            this.initBall();
        }
        else {
            Debug.log('putDownOriginArea ballIndex', ballIndex);
            this.convertParent(this.ballList[ballNumber - 1].ball, this.originArea.origin, this._ballOriginList[ballIndex]);
            this.ballList[ballNumber - 1].intersect = false;
        }
    }

    private removedJudge(ball: Node, index: number): boolean {
        const ballUI = ball.getComponent(UITransform);
        let x1: number = this._ballOriginList[index].x - ballUI.width / 2;
        let x2: number = this._ballOriginList[index].x + ballUI.width / 2;
        let y1: number = this._ballOriginList[index].y - ballUI.height / 2;
        let y2: number = this._ballOriginList[index].y + ballUI.height / 2;

        if (ball.position.x >= x1 && ball.position.x <= x2 && ball.position.y >= y1 && ball.position.y <= y2) {
            return false;
        }
        return true;
    }

    onMouseEnter(data: number) {
        if (this.mouseEnterEvent) {
            this.mouseEnterEvent.emit([data]);
        }
    }

    onMouseLeave(data: number) {
        if (this.mouseLeaveEvent) {
            this.mouseLeaveEvent.emit([data]);
        }
    }

    onTouchStart(data: any) {
        if (this.activeTouch) {
            const parentUI = this.ballList[data.content.i].ball.parent.getComponent(UITransform);
            this._oldPosition = v3(this.ballList[data.content.i].ball.position.x, this.ballList[data.content.i].ball.position.y);
            let pos: Vec3 = parentUI.convertToNodeSpaceAR(v3(data.content.x, data.content.y));
            this.ballList[data.content.i].ball.position = v3(pos.x, pos.y);
        }
        if (this.touchStartEvent) {
            this.touchStartEvent.emit([data.content.i]);
        }
    }

    onTouchMove(data: any) {
        if (this.activeTouch) {
            const ball = this.ballList[data.content.i].ball;
            const parentUI = ball.parent.getComponent(UITransform);
            ball.position = parentUI.convertToNodeSpaceAR(v3(data.content.x, data.content.y));
            this.ballList[data.content.i].intersect = utils.EngineUtil.inersectJudge(ball, this.targetArea.target);
            this.ballList[data.content.i].removed = this.removedJudge(ball, data.content.i);
        }
        if (this.touchMoveEvent) {
            this.touchMoveEvent.emit([data.content.i]);
        }
    }

    onTouchEnd(data: any) {
        if (this.activeTouch) {
            this.putDownBall(data);
        }
        if (this.touchEndEvent) {
            this.touchEndEvent.emit([data.content.i]);
        }
    }

    onTouchCancel(data: any) {
        if (this.activeTouch) {
            this.putDownBall(data);
        }
        if (this.touchCancelEvent) {
            this.touchCancelEvent.emit([data.content.i]);
        }
    }

    // update (dt) {}
}
