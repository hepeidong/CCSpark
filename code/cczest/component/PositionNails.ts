import { _decorator, Component, Node, Vec2, UITransform, Vec3, view, Enum } from 'cc';
const { ccclass, property, menu } = _decorator;

type PositionNailsPos = {
    worldPosX: number;
    worldPosY: number;
}

enum HorizontalPositionType {
    LEFT_HALF,
    RIGHT_HALF
}

enum VerticalPositionType {
    FIRST_HALF,
    LOWER_HALF
}

enum PositionModel {
    CUSTOM,
    AUTO
}

type TargetPosition = {
    horizontal: HorizontalPositionType,
    vertical: VerticalPositionType
}

enum PositionStyle {
    DIAGONAL,
    VERTICAL,
    HORIZONTAL
}

const WORLD_POS: Vec3 = new Vec3();

@ccclass('PositionNails')
@menu('游戏通用组件/自动寻找区域设置位置组件/PositionNails')
export class PositionNails extends Component {

    @property({
        type: Enum(PositionStyle),
        tooltip: "指定位置的风格，DIAGONAL 以对角线四个角设置位置，VERTICAL 在垂直方向上寻找空间来设置位置，会把屏幕划分为上半区和下半区，HORIZONTAL 在水平方向上寻找空间来设置位置，会把屏幕划分为左半区和右半区"
    })
    private positionStyle: PositionStyle = PositionStyle.DIAGONAL;

    @property({
        type: Enum(PositionModel),
        tooltip: "指定设置位置时确定设置区域的方式，AUTO自动计算位置区域，CUSTOM自定义位置区域"
    })
    private positionModel: PositionModel = PositionModel.AUTO;

    @property({
        type: Enum(HorizontalPositionType),
        visible(this: PositionNails) {
            return this.positionModel === PositionModel.CUSTOM;
        },
        tooltip: "指定在水平方向设置位置的区域，LEFT_HALF 显示在左半区， RIGHT_HALF 显示在右半区"
    })
    private horizontalPositionType: HorizontalPositionType = HorizontalPositionType.LEFT_HALF;

    @property({
        type: Enum(VerticalPositionType),
        visible(this: PositionNails) {
            return this.positionModel === PositionModel.CUSTOM;
        },
        tooltip: "指定在垂直方向设置位置的区域，FIRST_HALF 显示在上半区，LOWER_HALF 显示在下半区"
    })
    private verticalPositionType: VerticalPositionType = VerticalPositionType.FIRST_HALF;

    start() {
        
    }

    /**
     * 自动设置UI的位置
     * @param target 根据此目标节点，设置组件所在的UI节点的位置
     */
    public setPosition(target: Node): void;
    /**
     * 自动设置UI的位置
     * @param worldPos 根据此世界坐标，设置组件所在的UI节点的位置
     */
    public setPosition(worldPos: Vec3): void;
    public setPosition(): void {
        const arg = arguments[0];
        const viewSize = view.getVisibleSize();
        const thisUITf = this.node.getComponent(UITransform);
        if (arg instanceof Node) {
            const targetUITf = arg.getComponent(UITransform);
            const worldPos = arg.worldPosition;
            const paddingTop = viewSize.height - worldPos.y - targetUITf.height / 2;
            const paddingDown = worldPos.y - targetUITf.height / 2;
            const paddingLeft = worldPos.x - targetUITf.width / 2;
            const paddingRight = viewSize.width - worldPos.x - targetUITf.width / 2;
            this.setNodePosition(
                paddingTop,
                paddingDown,
                paddingLeft,
                paddingRight,
                worldPos,
                thisUITf,
                targetUITf.width,
                targetUITf.height
            );
        }
        else if (arg instanceof Vec3) {
            const worldPos = arg;
            const paddingTop = viewSize.height - worldPos.y;
            const paddingDown = worldPos.y;
            const paddingLeft = worldPos.x;
            const paddingRight = viewSize.width - worldPos.x;
            this.setNodePosition(
                paddingTop,
                paddingDown,
                paddingLeft,
                paddingRight,
                worldPos,
                thisUITf,
                0,
                0
            );
        } 
    }

    private getPositionType(worldPos: Vec3): TargetPosition {
        const viewSize = view.getVisibleSize();
        let horizontal: HorizontalPositionType;
        let vertical: VerticalPositionType;
        if (this.positionModel === PositionModel.AUTO) {
            if (worldPos.y > viewSize.height / 2) {
                vertical = VerticalPositionType.FIRST_HALF;
            }
            else  {
                 vertical = VerticalPositionType.LOWER_HALF;
            }
            if (worldPos.x > viewSize.width / 2) {
                horizontal = HorizontalPositionType.RIGHT_HALF;
            }
            else {
                horizontal = HorizontalPositionType.LEFT_HALF;
            }
        }
        else if (this.positionModel === PositionModel.CUSTOM) {
            horizontal = this.horizontalPositionType;
            vertical = this.verticalPositionType;
        }

        return {horizontal, vertical};
    }

    private setNodePosition(
        paddingTop: number, 
        paddingDown: number,
        paddingLeft: number, 
        paddingRight: number,
        worldPos: Readonly<Vec3>, 
        thisUITf: UITransform,
        targetWidth: number,
        targetHeight: number
    ) {
        const result = this.getPositionNailsPos(
            paddingTop,
            paddingDown,
            paddingLeft,
            paddingRight,
            worldPos,
            thisUITf,
            targetWidth,
            targetHeight
        );
        WORLD_POS.set(result.worldPosX, result.worldPosY);
        this.node.worldPosition = WORLD_POS;
    }

    private getPositionNailsPos(
        paddingTop: number, 
        paddingDown: number,
        paddingLeft: number, 
        paddingRight: number, 
        worldPos: Readonly<Vec3>, 
        thisUITf: UITransform,
        targetWidth: number,
        targetHeight: number
    ): PositionNailsPos {

        if (this.positionStyle === PositionStyle.DIAGONAL) {
            return this.calculationDiagonalPos(
                paddingTop,
                paddingDown,
                paddingLeft,
                paddingRight,
                worldPos,
                thisUITf,
                targetWidth,
                targetHeight
            );
            
        }
        else if (this.positionStyle === PositionStyle.VERTICAL) {
            return this.calculationVerticalPos(
                paddingTop,
                paddingDown,
                paddingLeft,
                paddingRight,
                worldPos,
                thisUITf,
                targetHeight
            );
        }
        else if (this.positionStyle === PositionStyle.HORIZONTAL) {
            return this.calculationHorizontalPos(
                paddingTop,
                paddingDown,
                paddingLeft,
                paddingRight,
                worldPos,
                thisUITf,
                targetWidth
            );
        }
    }

    /**计算对角线放置的情况下的坐标位置 */
    private calculationDiagonalPos(
        paddingTop: number, 
        paddingDown: number,
        paddingLeft: number, 
        paddingRight: number, 
        worldPos: Readonly<Vec3>, 
        thisUITf: UITransform,
        targetWidth: number,
        targetHeight: number
    ) {
        const positionType = this.getPositionType(worldPos);
        let worldPosX = worldPos.x;
        let worldPosY = worldPos.y;
        if (positionType.horizontal == HorizontalPositionType.LEFT_HALF) {
            if (paddingLeft < thisUITf.width) {
                worldPosX = worldPos.x + targetWidth / 2 + thisUITf.width / 2;
            }
            else {
                worldPosX = worldPos.x - targetWidth / 2 - thisUITf.width / 2;
            }
        }
        else if (positionType.horizontal == HorizontalPositionType.RIGHT_HALF) {
            if (paddingRight < thisUITf.width) {
                worldPosX = worldPos.x - targetWidth / 2 - thisUITf.width / 2;
            }
            else {
                worldPosX = worldPos.x + targetWidth / 2 + thisUITf.width / 2;
            }
        }
        if (positionType.vertical == VerticalPositionType.FIRST_HALF) {
            if (paddingTop < thisUITf.height) {
                worldPosY = worldPos.y - targetHeight / 2 - thisUITf.height / 2;
            }
            else {
                worldPosY = worldPos.y + targetHeight / 2 + thisUITf.height / 2;
            }
        }
        else if (positionType.vertical == VerticalPositionType.LOWER_HALF) {
            if (paddingDown < thisUITf.height) {
                worldPosY = worldPos.y + targetHeight / 2 + thisUITf.height / 2;
            }
            else {
                worldPosY = worldPos.y - targetHeight / 2 - thisUITf.height / 2;
            }
        }
        return {worldPosX, worldPosY};
    }

    /**计算垂直放置的情况下的坐标位置 */
    private calculationVerticalPos(
        paddingTop: number, 
        paddingDown: number,
        paddingLeft: number, 
        paddingRight: number, 
        worldPos: Readonly<Vec3>, 
        thisUITf: UITransform,
        targetHeight: number
    ) {
        const positionType = this.getPositionType(worldPos);
        let worldPosX = worldPos.x;
        let worldPosY = worldPos.y;
        if (positionType.horizontal == HorizontalPositionType.LEFT_HALF) {
            if (paddingLeft < thisUITf.width / 2) {
                worldPosX = worldPos.x + thisUITf.width / 2 - paddingLeft;
            }
        }
        else if (positionType.horizontal == HorizontalPositionType.RIGHT_HALF) {
            if (paddingRight < thisUITf.width / 2) {
                worldPosX = worldPos.x - thisUITf.width / 2 + paddingRight;
            }
        }
        if (positionType.vertical == VerticalPositionType.FIRST_HALF) {
            if (paddingTop < thisUITf.height) {
                worldPosY = worldPos.y - targetHeight / 2 - thisUITf.height / 2;
            }
            else {
                worldPosY = worldPos.y + targetHeight / 2 + thisUITf.height / 2;
            }
        }
        else if (positionType.vertical == VerticalPositionType.LOWER_HALF) {
            if (paddingDown < thisUITf.height) {
                worldPosY = worldPos.y + targetHeight / 2 + thisUITf.height / 2;
            }
            else {
                worldPosY = worldPos.y - targetHeight / 2 - thisUITf.height / 2;
            }
        }
        return {worldPosX, worldPosY};
    }

    private calculationHorizontalPos(
        paddingTop: number, 
        paddingDown: number,
        paddingLeft: number, 
        paddingRight: number, 
        worldPos: Readonly<Vec3>, 
        thisUITf: UITransform,
        targetWidth: number
    ) {
        const positionType = this.getPositionType(worldPos);
        let worldPosX = worldPos.x;
        let worldPosY = worldPos.y;
        if (positionType.horizontal === HorizontalPositionType.LEFT_HALF) {
            if (paddingLeft < thisUITf.width) {
                worldPosX = worldPos.x + targetWidth / 2 + thisUITf.width / 2;
            }
            else {
                worldPosX = worldPos.x - targetWidth / 2 - thisUITf.width / 2;
            }
        }
        else if (positionType.horizontal === HorizontalPositionType.RIGHT_HALF) {
            if (paddingRight < thisUITf.width) {
                worldPosX = worldPos.x - targetWidth / 2 - thisUITf.width / 2;
            }
            else {
                worldPosX = worldPos.x + targetWidth / 2 + thisUITf.width / 2;
            }
        }
        if (positionType.vertical === VerticalPositionType.FIRST_HALF) {
            if (paddingTop < thisUITf.height / 2) {
                worldPosY = worldPos.y - thisUITf.height / 2 + paddingTop;
            }
        }
        else if (positionType.vertical === VerticalPositionType.LOWER_HALF) {
            if (paddingDown < thisUITf.height / 2) {
                worldPosY = worldPos.y + thisUITf.height / 2 - paddingDown;
            }
        }
        return {worldPosX, worldPosY};
    }

    update(deltaTime: number) {
        
    }
}

