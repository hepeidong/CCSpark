import { Sprite } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { createSprite, createTip } from '../guide_utils';
import { UITransform } from 'cc';
import { Size } from 'cc';
import { EDITOR } from 'cc/env';
import { GuideManager } from '../GuideManager';
import { IGuideComponent, IImageAction } from 'zest';
import { UIOpacity } from 'cc';
import { Res } from '../../res/Res';
import { tween } from 'cc';
import { v3 } from 'cc';
import { ImageGuideType, TweenEasingType } from '../GuideEnum';
import { instantiate } from 'cc';
import { TweenEasing } from 'cc';
const { 
    ccclass, 
    property, 
    executeInEditMode, 
    disallowMultiple } = _decorator;


const _vec3Temp = v3();

@ccclass('GuideImage')
@executeInEditMode
@disallowMultiple
export class GuideImage extends Component implements IGuideComponent {

    @property({
        type: Sprite,
        displayName: '图片内容'
    })
    private image: Sprite = null;

    @property({
        type: Node,
        displayName: '提示点击'
    })
    private tip: Node = null;

    private _imageGuideType: string;
    private _imageMap: Map<string, Node>;
    onLoad () {
        this.node.getComponent(UITransform).setContentSize(new Size(2000, 2000));
        this.creatNode();
        
        if (!EDITOR) {
            this.init();
            this.node.on(Node.EventType.TOUCH_START, function() {}, this);
            this.node.on(Node.EventType.TOUCH_START, this.onClick, this);
        }
    }

    start() {
        
    }

    init() {
        this._imageMap = new Map();
    }

    private creatNode() {
        if (!this.image) {
            const node = createSprite('image');
            node.addComponent(UIOpacity);
            this.image = node.getComponent(Sprite);
            this.node.addChild(this.image.node);
        }

        if (!this.tip) {
            this.tip = createTip('tip');
            this.node.addChild(this.tip);
        }
    }

    onClick() {
        if (this._imageGuideType === ImageGuideType.FADE_IN) {
            GuideManager.instance.guideContinue();
        }
    }

    doGuideSkip(): void {
        this.node.active = false;
        GuideManager.instance.guideSkipAll();
    }

    public execGuide() {
        this.tip.active = false;
        const data = GuideManager.instance.guideAction.getData<IImageAction>();
        this._imageGuideType = data.imageGuideType;
        const position = data.position;
        const duration = data.duration;
        const imageId  = data.imageId;
        const easing   = data.easing;
        let easingObj: {easing: TweenEasing};
        if (TweenEasingType.indexOf(easing) > -1) {
            easingObj = {easing: easing};
        }
        if (this._imageGuideType === ImageGuideType.FADE_IN) {
            let image: Node;
            if (!this._imageMap.has(imageId)) {
                image = instantiate(this.image.node);
                this.node.addChild(image);
                this._imageMap.set(imageId, image);
            }
            else {
                image = this._imageMap.get(imageId);
            }
            this.loadImage(data, image).then((flag) => {
                if (flag) {
                    _vec3Temp.set(position.x, position.y);
                    image.position = _vec3Temp;
                    const uiOpactity = image.getComponent(UIOpacity);
                    uiOpactity.opacity = 0;
                    tween(uiOpactity).to(duration, {opacity: 255}, easingObj).start();
                }
            });
        }
        else if (this._imageGuideType === ImageGuideType.FADE_OUT) {
            const image = this._imageMap.get(imageId);
            const uiOpactity = image.getComponent(UIOpacity);
            tween(uiOpactity).to(duration, {opacity: 0}, easingObj).call(() => {
                this.node.addChild(image);
                this._imageMap.delete(imageId);
                image.destroy();
                this.node.active = false;
                GuideManager.instance.guideContinue();
            }).start();
        }
    }

    clear(): void {
        
    }

    private loadImage(data: IImageAction, image: Node) {
        const loader = Res.getLoader(GuideManager.instance.bundle);
        const source = data.source.replace(new RegExp(".png"), "").replace(new RegExp(".jpg"), "");
        return loader.setSpriteFrame(image, source);
    }

    update(deltaTime: number) {
        
    }
}


