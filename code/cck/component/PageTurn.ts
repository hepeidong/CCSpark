import { Component, Enum, EventTouch, instantiate, Node, Prefab, tween, UITransform, v3, Vec2, _decorator } from "cc";
import { EventSystem } from "../event";
import { utils } from "../utils";
import { Vec3 } from "cc";

const _vec3Temp = new Vec3();

enum PageEvent {
    PAGE_INIT = 'page_init',
    PAGE_TURNING = 'page_turning'
}

enum PageType {
    VERTICAL,
    HORIZONTAL
}

const CACHE_PAGE_MAX = 3;

const page_t = Enum(PageType);

const {ccclass, property, menu, disallowMultiple} = _decorator;


@ccclass("PageTurn")
@disallowMultiple
@menu('游戏通用组件/ui/PageTurn(翻页组件)')
export  class PageTurn extends Component {

    @property({
        type: Prefab,
        tooltip: '页面模板预制体'
    })
    private page: Prefab = null;

    @property({
        type: Node,
        tooltip: '页面父节点, 控制所有页面移动'
    })
    private content: Node = null;

    @property({
        tooltip: '页面的总数'
    })
    private totalPage: number = 0;

    @property({
        type: page_t,
        tooltip: '页面布局方式：VERTICAL垂直；HORIZONTAL水平'
    })
    private pageType: PageType = PageType.HORIZONTAL;

    @property({
        type: Node,
        tooltip: '向左或者向上滚动按钮'
    })
    private toLeftMenu: Node = null;

    @property({
        type: Node,
        tooltip: '向右或者向下滚动按钮'
    })
    private toRightMenu: Node = null;
  


    private _pageNodes: Node[];     //页面节点列表
    private _pageIndex: number;         //页面的页码标签索引, 从0开始
    private _pageIndicator: number;     //页面滚动索引, 控制三张页面互相轮换显示内容, 从0开始
    private _clicked: boolean;
    private _startTouchPos: Vec2;        //开始触摸点
    private _moveDistance: number;          //滑动距离

    public static get PageEvent(): typeof PageEvent { return PageEvent; }

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this._pageNodes = [];
        this._pageIndex = 0;
        this._pageIndicator = 0;
        this._clicked = false;
        const contenUI = this.content.getComponent(UITransform);
        const nodeUI = this.node.getComponent(UITransform);
        contenUI.width = nodeUI.width;
        contenUI.height = nodeUI.height;
        this.content.position = v3(0, 0);

        this.register();
        this.instantiatePage();
    }

    start () {
        
    }

    register() {
        EventSystem.click(this.toLeftMenu, this, this.onLeftMenuClicked);
        EventSystem.click(this.toRightMenu, this, this.onRightMenuClicked);
        
        // this.content.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        // this.content.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        // this.content.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    public initPage() {
        if (this._pageIndex === this.totalPage) return;
        this.toRightMenu.active = this._pageIndex < this.totalPage - 1;
        this.toLeftMenu.active = this._pageIndex > 0;
        let pageIndex: number = this._pageIndex + 1 === this.totalPage ? this._pageIndex - 1 : this._pageIndex;
        for (let i: number = CACHE_PAGE_MAX - 1; i >= 0; --i) {
            let index: number = i + (pageIndex > 0 ? pageIndex - 1 : pageIndex);
            if (index >= this.totalPage) continue;
            EventSystem.event.emit(PageEvent.PAGE_INIT, {page: this._pageNodes[i], index: index});
        }
    }

    private onTouchStart(event: EventTouch) {
        this._startTouchPos = event.getLocation();
    }

    private onTouchMove(event: EventTouch) {   
        let loca: Vec2 = event.getLocation();
        this._moveDistance = utils.MathUtil.Vector2D.distance(v3(this._startTouchPos.x, this._startTouchPos.y), v3(loca.x, loca.y));
        if (this.pageType === PageType.HORIZONTAL) {
            
        }
    }

    private onTouchEnd(event: EventTouch) {

    }

    public setTotalPage(total: number) {
        this.totalPage = total;
    }

    private instantiatePage() {
        for (let i: number = 0; i < 3; ++i) {
            let newNode: Node = instantiate(this.page);
            this.content.addChild(newNode);
            _vec3Temp.x = newNode.position.x;
            _vec3Temp.y = 0;
            newNode.position = _vec3Temp;
            this.initPagePos(i, newNode);
            this._pageNodes.push(newNode);
        }
    }

    private initPagePos(index: number, page: Node) {
        const nodeUI = this.node.getComponent(UITransform);
        if (this.pageType === PageType.HORIZONTAL) {
            _vec3Temp.x = nodeUI.width * index;
            _vec3Temp.y = 0;
            page.position = _vec3Temp;
        }
        else if (this.pageType === PageType.VERTICAL) {
            _vec3Temp.x = 0;
            _vec3Temp.y = -nodeUI.height * index;
            page.position = _vec3Temp;
        }
    }

    private setToLefPagePos(page: Node) {
        const nodeUI = this.node.getComponent(UITransform);
        if (this.pageType === PageType.HORIZONTAL) {
            _vec3Temp.x = nodeUI.width * this._pageIndex + nodeUI.width;
            _vec3Temp.y = page.position.y;
            page.position = _vec3Temp;
        }
        else if (this.pageType === PageType.VERTICAL) {
            _vec3Temp.x = page.position.x;
            _vec3Temp.y = nodeUI.height * this._pageIndex - nodeUI.height;
            page.position = _vec3Temp;
        }
    }

    private setToRightPagePos(page: Node) {
        const nodeUI = this.node.getComponent(UITransform);
        if (this.pageType === PageType.HORIZONTAL) {
            _vec3Temp.x = nodeUI.width * this._pageIndex - nodeUI.width;
            _vec3Temp.y = page.position.y;
            page.position = _vec3Temp;
        }
        else if (this.pageType === PageType.VERTICAL) {
            _vec3Temp.x = page.position.x;
            _vec3Temp.y = nodeUI.height * this._pageIndex + nodeUI.height;
            page.position = _vec3Temp;
        }
    }

    private movePage() {
        const nodeUI = this.node.getComponent(UITransform);
        tween(this.content).to(0.3, {position: v3(-nodeUI.width * this._pageIndex, 0)}).call(() => this._clicked = false).start();
    }

    onLeftMenuClicked() {
        if (this._clicked) return;
        this._clicked = true;
        this._pageIndex--;
        this._pageIndicator--;
        this.toRightMenu.active = true;
        //当页面轮换指针指向第一张页面时, 页面需要轮换, 把最右边的页面移动到最左边, 以显示前面的页面
        if (this._pageIndicator === 0 && this._pageIndex > 0) {
            this._pageIndicator = 1;

            let temp: Node = this._pageNodes[2];
            this.setToRightPagePos(temp);

            //移动完位置之后, 交换页面节点列表的位置
            for (let i: number = 1; i >= 0; --i) {
                this._pageNodes[i + 1] = this._pageNodes[i];
            }
            this._pageNodes[0] = temp;

            //此时页面移动到了当前显示的页码 - 1的位置, 因为移动的页面, 用来显示屏幕外前面那张看不见的页面的内容
            EventSystem.event.emit(PageEvent.PAGE_TURNING, {page: temp, index: this._pageIndex - 1});
        }
        else if (this._pageIndicator === 0 && this._pageIndex === 0) {
            this.toLeftMenu.active = false;
        }
        this.movePage();
    }

    onRightMenuClicked() {
        if (this._clicked) return;
        this._clicked = true;
        this._pageIndex++;
        this._pageIndicator++;
        this.toLeftMenu.active = true;
        //当页面轮换指针指向第三张页面时, 页面需要轮换, 把最左边的页面移动到最右边, 以显示后面的页面
        if (this._pageIndicator === 2 && this._pageIndex < this.totalPage - 1) {
            this._pageIndicator = 1;
            let temp: Node = this._pageNodes[0];
            this.setToLefPagePos(temp);
            //移动完位置之后, 交换页面节点列表的位置
            for (let i: number = 1; i < 3; ++i) {
                this._pageNodes[i - 1] = this._pageNodes[i];
            }
            this._pageNodes[2] = temp;
            //此时页面移动到了当前显示的页码 + 1的位置, 因为移动的页面, 用来显示屏幕外后面那张看不见的页面的内容
            EventSystem.event.emit(PageEvent.PAGE_TURNING, {page: temp, index: this._pageIndex + 1});
        }
        else if (this._pageIndicator === 2 && this._pageIndex === this.totalPage - 1) {
            this.toRightMenu.active = false;
        }
        this.movePage();
    }

    // update (dt) {}
}
