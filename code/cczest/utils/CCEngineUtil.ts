import { SAFE_CALLBACK } from "../Define";
import { director, Node, screen, Size, size, tween, UIOpacity, UITransform, v3, Vec2, Vec3 } from "cc";
import { Debug } from "../Debugger";
import { CCMathUtil } from "./CCMathUtil";
import { AdapterManager } from "../app/adapter_manager/AdapterManager";
import { Sprite } from "cc";

const vec3Temp_1 = new Vec3();
const vec3Temp_2 = new Vec3();

export  class CCEngineUtil {

    /**
     * 在编辑器内锁定隐藏节点
     * @param target 
     */
    public static lockNodeInEditor(target: Node): void {
        // Object["Flags"].DontSave          // 当前节点不会被保存到prefab文件里
        // Object["Flags"].LockedInEditor    // 当前节点及子节点在编辑器里不会被点击到
        // Object["Flags"].HideInHierarchy   // 当前节点及子节点在编辑器里不显示
        target["_objFlags"] |= (Object["Flags"].DontSave | Object["Flags"].LockedInEditor | Object["Flags"].HideInHierarchy);
    }

    /**
     * 在2D图形下，节点 node1 其坐标点是否在另一节点 node2 矩形内
     * @param node1 
     * @param node2 
     */
    public static inersectJudge(node1: Node, node2: Node): boolean {
        const ui = node2.getComponent(UITransform);
        let pos = this.convertPosition(node1, node2.parent);
        //计算node2的矩形区域
        let x1 = ui.width * ui.anchorX - node2.position.x;
        let y1 = ui.height * (1 - ui.anchorY) + node2.position.y;
        vec3Temp_1.set(x1, y1); //矩形的左上角
        let x2 = ui.width * (1 - ui.anchorX) + node2.position.x;
        let y2 = ui.height * ui.anchorY - node2.position.y;
        vec3Temp_2.set(x2, y2); //矩形的右下角
        //判断node1坐标点是否在矩形区域内
        return CCMathUtil.Vector2D.inRectangle(pos, vec3Temp_1, vec3Temp_2);
    }

    /**
     * 把当前节点坐标系转换为另一个节点坐标系
     * @param from 要转换的节点
     * @param newPrent 目标父节点
     * @returns 返回转换后的新的坐标位置
     */
    public static convertPosition(from: Node, newPrent: Node): Vec3 {
        const ui = newPrent.getComponent(UITransform);
        return ui.convertToNodeSpaceAR(from.worldPosition);
    }

    /**
     * 转换到微信小游戏坐标系，转换后的坐标是以右上角为原点
     * @param target 要转换的节点
     */
    public static convertToWechatSpace(target: Node): Vec2 {
        const canvas = director.getScene().getChildByName("Canvas");
        if (canvas) {
            let position: Vec3 = this.convertPosition(target, canvas);
            const { width, height } = screen.windowSize;
            let scale: number = AdapterManager.instance.rate;
            let x: number = Math.abs(width / 2 + position.x * scale);
            let y: number = Math.abs(position.y * scale - height / 2);
            return new Vec2(x, y);
        }
        else {
            Debug.error("场景‘" + director.getScene().name + "’没有Canvas画布节点");
        }
    }

    /**
     * 转换到微信下的宽高
     * @param target 
     */
    public static convertToWechatSize(target: Node): Size {
        let scale: number = AdapterManager.instance.rate;
        const ui = target.getComponent(UITransform);
        return size(ui.width * scale, ui.height * scale);
    }

    /**
     * 转换到微信小游戏坐标系
     * @param target 
     */
    public static convertToWechatSpaceAR(target: Node): Vec2 {
        let pos: Vec2 = this.convertToWechatSpace(target);
        let size: Size = this.convertToWechatSize(target);
        pos.x = pos.x - size.width / 2;
        pos.y = pos.y > 0 ? pos.y - size.height : pos.y - size.height / 2;
        return pos;
    }

    /**
     * 微信坐标转换为Cocos坐标
     * @param wxPosition 微信坐标位置
     */
    public static convertToCocosSpace(wxPosition: Vec2): Vec2 {
        const { width, height } = screen.windowSize;
        let scale: number = AdapterManager.instance.rate;
        let x: number = (wxPosition.x - width / 2) / scale;
        let y: number = (height / 2 + wxPosition.y) / scale;
        return new Vec2(x, y);
    }

    public static active(target: Node, state: boolean): void {
        if (target) {
            target.active = state;
        }
    }

    public static activeAllChild(target: Node, state: boolean): void {
        if (target) {
            const children = target.children;
            const len = children.length;
            for (let i: number = 0; i < len; ++i) {
                children[i].active = state;
            }
        }
    }


    /**
     * 将子节点从当前父节点移动到另一个父节点上, 这是一个具有移动速度的移动过程
     * @param child 需要移动的子节点
     * @param toParent 移动到的目标父节点
     * @param speed 移动速度, 即每秒移动多少个点, 例如500, 即每秒移动500个点
     * @param position 移动到目标父节点下的坐标位置, 默认为(0, 0)位置
     * @param start 开始回调
     * @param complate 结束回调
     */
    public static moveEffect(child: Node, toParent: Node, speed: number, position: Vec3 = v3(0, 0, 0), start?: (child: Node) => void, complate?: (child: Node) => void) {
        const ui = child.getComponent(UITransform);
        ui.setAnchorPoint(0.5, 0.5);
        let startX = child.position.x;
        let startY = child.position.y;
        let pos: Vec3 = this.convertPosition(child, toParent);
        let parent: Node = child.parent;
        child.parent = toParent;
        child.position.set(pos.x, pos.y);
        //通过距离和速度计算时间
        let distance: number = CCMathUtil.Vector2D.distance(v3(pos.x, pos.y), v3(0, 0));
        let time: number = distance / speed; 
        SAFE_CALLBACK(start, child);
        tween<Node>(child).to(time, {position: position}).call(() => {
            child.active = false;
            child.parent = parent;
            child.position.set(startX, startY);
            SAFE_CALLBACK(complate, child);
        }).start();
    }

    /**
     * 漂浮特效
     * @param target 
     * @param duration 
     * @param floatHeight 
     */
    public static floatEffet(target: Node, duration: number, floatHeight: number) {
        const comp = target.getComponent(UIOpacity);
        if (comp) {
            comp.opacity = 255;
            let oldPosition = target.position;
            const moveBy = tween(target).by(duration, {position: v3(0, floatHeight)});
            const fadeOut = tween(comp).to(0.5, {opacity: 0}).call(() => { target.position = oldPosition; });
            tween().sequence(moveBy, fadeOut).start();
        }
        else {
            Debug.error("节点‘" + target.name + "’没有挂载UIOpacity组件");
        }
    }

    /**
     * 设置Node层级
     * @param node 
     * @param layer 
     * @param recursion 是否包含子节点
     * @returns 
     */
    public static setNodeLayer(node: Node, layer: number, recursion: boolean): void {
        node.layer = layer;
        if (!recursion) {
            return;
        }
        node.walk(child => child.layer = layer);
    }

    /**
     * 置灰节点
     * @param node 
     * @param isGray true置灰
     * @param isHaveSelf 是否包含自己，默认false不包含
     */
    public static setNodeState(node: Node, isGray: boolean, isHaveSelf: boolean = false): void {
        let children = node.getComponentsInChildren(Sprite);
        if (isHaveSelf) {
            let selfSprite = node.getComponent(Sprite);
            if (selfSprite) {
                children.push(selfSprite);
            }
        }
        for (let i = 0; i < children.length; i++) {
            children[i].grayscale = isGray;
        }
    }

    private static getNodeNameList(node: Node, rootNode: Node, outArr: string[]) {
        if (node.parent && node.parent != rootNode) {
            this.getNodeNameList(node.parent, rootNode, outArr);
        }
        outArr.push(node.name);
    }

    /**
     * 获取节点路径url
     * @param rootNode 根节点，到此停止
     * @returns 
     */
    public static getNodeUrl(node: Node, rootNode: Node) {
        let outArr: string[] = [];
        this.getNodeNameList(node, rootNode, outArr);
        let url = outArr.join('/');
        return url;
    }
}
