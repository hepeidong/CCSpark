import { CCString, Component, Enum, error, log, Node, Sprite, SpriteFrame, UITransform, _decorator, __private } from "cc";
import { cck_bitLblImage_type } from "../lib.cck";
import { SAFE_CALLBACK } from "../Define";
import { utils } from "../utils";
import { LabelRemove } from "./LabelRemove";
import { Vec3 } from "cc";
import { math } from "cc";


const _vec3Temp = new Vec3();
const _rectTemp = new math.Rect();

const defaultFonSize: number = 30;

enum HorizontalAlign {
    LEFT,
    CENTRE,
    RIGHT
}
enum VerticalAlign {
    TOP,
    CENTRE,
    BOTTOM
}
enum Overflow {
    NONE,
    RESIZE_HEIGHT
}

let HAlignType = Enum(HorizontalAlign);
let VAlignType = Enum(VerticalAlign);
let OverflowType = Enum(Overflow);

const {ccclass, property, menu, executeInEditMode} = _decorator;

@ccclass('FontChar')
class FontChar {
    @property(CCString)
    private _char: string = '';
    @property({
        type: CCString,
        displayName: '字符内容'
    })
    set char(val: string) {
        this._char = val;
        SAFE_CALLBACK(this.charCallback);
    }
    get char(): string { return this._char; }

    @property({
        displayName: '包括中文'
    })
    public existChinese: boolean = false;

    @property({
        step: 1
    })
    private _cnFontW: number = 0;
    @property({
        visible(this: FontChar) {
            return this.existChinese;
        }
    })
    set cnFontW(val: number) {
        this._cnFontW = val;
        SAFE_CALLBACK(this.callback);
    }
    get cnFontW(): number { return this._cnFontW; }

    private callback: Function;
    private charCallback: Function;
    constructor() {}

    setCallback(callback: Function) {
        this.callback = callback;
    }

    setCharCallback(callback: Function) {
        this.charCallback = callback;
    }
}

@ccclass("BitmapLabel")
@executeInEditMode
@menu('游戏通用组件/ui/BitmapLabel(简单图片位图字体)')
export  class BitmapLabel extends Component {

    @property
    private _fontImage: SpriteFrame = null;
    @property({
        type: SpriteFrame,
        tooltip: '位图字体纹理'
    })
    set fontImage(val: SpriteFrame) {
        this._fontImage = val;
        if (utils.isNull(val)) {
            this._labelNode.removeAllChildren();
            this._texture = null;
            error('缺少位图字体纹理!');
        }
        else {
            this.initTexture();
            this.showLabel();
        }
    }
    get fontImage(): SpriteFrame { return this._fontImage; }

    @property({
        type: FontChar,
        tooltip: '位图字体显示的字符,必须严格对照图片的内容'
    })
    private fontChar: FontChar = null;

    @property
    private _label: string = '';
    @property({
        tooltip: '文本内容'
    })
    set string(val: string) {
        this._label = val;
        this.showLabel();
    }
    get string(): string { return this._label; }

    @property
    private _hAlign: HorizontalAlign = HorizontalAlign.CENTRE;
    @property({
        type: HAlignType,
        tooltip:''
    })
    set horizontalAlign(val: HorizontalAlign) {
        this._hAlign = val;
    }
    get horizontalAlign(): HorizontalAlign { return this._hAlign; }

    @property
    private _vAlign: VerticalAlign = VerticalAlign.CENTRE;
    @property({
        type: VAlignType,
        tooltip: ''
    })
    set verticalAlign(val: VerticalAlign) {
        this._vAlign = val;
    }
    get verticalAlign(): VerticalAlign { return this._vAlign; }

    @property
    private _overflow: Overflow = OverflowType.NONE;
    @property({
        type: OverflowType,
        tooltip: '字体排版方式'
    })
    set overflow(val: Overflow) {
        this._overflow = val;
    }
    get overflow(): Overflow { return this._overflow; }

    @property
    private _fontSize: number = defaultFonSize;
    @property({
        tooltip: '字体大小'
    })
    set fontSize(val: number) {
        this._fontSize = val;
        this.init();
        this.showLabel();
    }
    get fontSize(): number { return this._fontSize; }

    @property
    private _lineHeight: number = 30;
    @property({
        tooltip: '行高,位图标签节点的高'
    })
    set lineHeight(val: number) {
        if (val < this.fontSize) {
            val = this.fontSize;
        }
        this._lineHeight = val;
        this.node.getComponent(UITransform).height = this.lineHeight;
    }
    get lineHeight(): number { return this._lineHeight; }

    @property
    private _spacing: number = 0;
    @property({
        displayName: '字母间隔'
    })
    set spacing(val: number) {
        this._spacing = val;
        this.showLabel();
    }
    get spacing(): number { return this._spacing; }

    @property
    private _spacingCN: number = 0;
    @property({
        displayName: '中文间隔'
    })
    set spacingCN(val: number) {
        this._spacingCN = val;
        this.showLabel();
    }
    get spacingCN(): number { return this._spacingCN; }

    private fontW: number = 0;      //位图字体纹理宽度
    private fontH: number = 0;   //位图字体纹理高度
    private _texture: __private._cocos_asset_assets_texture_base__TextureBase;
    private _labelNode: Node;
    private _charSplit: string = '';
    private _cnCharSplit: string = '';
    private _spCharSplit: string = '';
    private _stringSplit: string[] = [];//存储普通字符,特殊字符,中文字符的split
    private _charLen: number = 0;       //单个字符的长度
    private _spCharLen: number = 0;     //单个特殊字符的长度
    private _maxCNCharLen: number = 0;  //中文字符占用的总长度
    private _maxCharLen: number = 0;    //普通字符占用的总长度
    private _maxSPCharLen: number = 0;  //特殊字符占用的总长度
    private _charIndex: number = 0;
    private _cnCharIndex: number = 0;
    private _spCharIndex: number = 0;
    private _currLabel: string = '';

    onLoad () {
        if (!this._labelNode) {
            this._labelNode = new Node('label');
            this._labelNode.getComponent(UITransform).width = 10;
            this._labelNode.getComponent(UITransform).height = 10;
            this._labelNode.addComponent(LabelRemove);
            utils.EngineUtil.lockNodeInEditor(this._labelNode);
            this.node.addChild(this._labelNode);
        }
        if (!this.fontChar) {
            this.fontChar = new FontChar();
        }
        this.fontChar.setCallback(() => {
            this.showLabel();
        });
        this.fontChar.setCharCallback(() => {
            this.init();
        });
        
        this.initTexture();
    }

    start () {

    }

    private init() {
        this.initSplit();
        let w: number = this.fontW - this._cnCharSplit.length * this.fontChar.cnFontW;
        //存储普通字符占用的总长度
        this._maxCharLen = w;
        this._charLen = w / this._charSplit.length + this._spCharSplit.length;
        this._spCharLen = this._charLen / 2;
        //存储特殊字符占用的总长度
        this._maxSPCharLen = this._spCharLen * this._spCharSplit.length;
        let offect: number = 0;
        if (this._spCharSplit.length > 0) {
            for (let e of this._spCharSplit) {
                if (e === '.' || e === ':' || e === ',' || e === ';' || e === '%') {
                    offect += this._spCharLen;
                }
            }
            w = w - offect;
            //存储普通字符占用的总长度
            this._maxCharLen = w;
            this._charLen = w / this._charSplit.length;
        }
        //存储中文字符占用的总长度
        this._maxCNCharLen = this.fontW - this._maxCharLen - this._maxSPCharLen;
    }

    private initTexture() {
        if (this.fontImage) {
            this._texture = this.fontImage.texture;
            this.fontW = this._texture.width;
            this.fontH = this._texture.height;
        }
        if (this._texture) {
            this.init();
            this.showLabel();
        }
    }

    private initSplit() {
        let index: number = 0;
        for (let e of this.fontChar.char) {
            if (utils.StringUtil.isChinese(e)) {
                if (this._cnCharSplit.indexOf(e) === -1) {
                    this._cnCharSplit += e;
                }
                this._cnCharIndex = this.getPosIndex(index, this._cnCharIndex, this._charIndex, this._spCharIndex);
            }
            else if (!this.isSpChar(e)) {
                if (this._charSplit.indexOf(e) === -1) {
                    this._charSplit += e;
                }
                this._charIndex = this.getPosIndex(index, this._charIndex, this._cnCharIndex, this._spCharIndex);
            }
            else {
                if (this._spCharSplit.indexOf(e)) {
                    this._spCharSplit += e;
                }
                this._spCharIndex = this.getPosIndex(index, this._spCharIndex, this._charIndex, this._cnCharIndex);
            }
            index++;
        }
        this._stringSplit[this._charIndex - 1] = this._charSplit;
        this._stringSplit[this._cnCharIndex - 1] = this._cnCharSplit;
        this._stringSplit[this._spCharIndex - 1] = this._spCharSplit;
    }

    /**计算字符位置索引 */
    private getPosIndex(index: number, currIndex: number, charIndex1: number, charIndex2: number) {
        if (currIndex > 0) {
            return currIndex;
        }
        if (index === 0) {
            return 1;
        }
        else {
            if (charIndex1 === 2 || charIndex2 === 2) {
                return 3;
            }
            else {
                return 2;
            }
        }
    }

    //剪切图片
    private cutImage(str: string) {
        if (!this._texture) return;

        let imageList: cck_bitLblImage_type[] = [];
        for (let i: number = 0; i < str.length; ++i) {
            let e = str[i];
            let newSF: SpriteFrame = new SpriteFrame();
            newSF.texture = this._texture;
            if (utils.StringUtil.isChinese(e)) {
                let cnIndex: number = this._cnCharSplit.indexOf(e);//中文字符索引
                _rectTemp. x =  this.getCharX(this._cnCharSplit, this._charSplit, this._spCharSplit, this._maxCharLen, this._maxSPCharLen, this.fontChar.cnFontW, cnIndex);
                cnIndex++;
                _rectTemp.y = 0;
                _rectTemp.width = this.fontChar.cnFontW;
                _rectTemp.height = this.fontH;
                newSF.rect = _rectTemp;
                imageList.push({spacing: this.spacingCN, sf: newSF});
            }
            else if (!this.isSpChar(e) && !utils.StringUtil.isChinese(e)) {
                let index: number = this._charSplit.indexOf(e);
                _rectTemp. x = this.getCharX(this._charSplit, this._cnCharSplit, this._spCharSplit, this._maxCNCharLen, this._maxSPCharLen, this._charLen, index);
              
                //处理1的特殊情况的矩形区域
                if (e === '1') {
                    let off: number = this._charLen * index * 0.1;
                    // x = x - off;
                }
                _rectTemp.y = 0;
                _rectTemp.width = this._charLen;
                _rectTemp.height = this.fontH;
                newSF.rect = _rectTemp;
                imageList.push({spacing: this.spacing, sf: newSF});
            }
            else {
                let spIndex: number = this._spCharSplit.indexOf(e);
                _rectTemp. x = this.getCharX(this._spCharSplit, this._charSplit, this._cnCharSplit, this._maxCharLen, this._maxCNCharLen, this._spCharLen, spIndex);
                _rectTemp.y = 0;
                _rectTemp.width = this._spCharLen;
                _rectTemp.height = this.fontH;
                newSF.rect = _rectTemp;
                imageList.push({spacing: this.spacing + this._spCharLen, sf: newSF});
            }
        }
        return imageList;
    }
    //计算对应的字体位于纹理中的x轴位置
    private getCharX(currSplit: string, split1: string, split2: string, maxLen1: number, maxLen2: number, charLen: number, charIndex: number) {
        //判断当前类型字符串在什么位置,例如: 012345获得损失粉丝  和   获得损失粉丝012345  这两种情况 判断哪种字符类型在前或者在后
        let index: number = this._stringSplit.indexOf(currSplit);
        if (index === 0) {
            return charLen * charIndex;
        }
        else if (index === 1) {
            //判断除了当前字符类型之外,其他两种类型的字符的位置情况
            let k: number = this._stringSplit.indexOf(split1);
            let n: number = this._stringSplit.indexOf(split2);
            let len: number = 0;
            len = k === 0 ? maxLen1 : len;
            len = n === 0 ? maxLen2 : len;
            return len + charLen * charIndex;
        }
        else if (index === 2) {
            return maxLen1 + maxLen2 + charLen * charIndex;
        }
    }

    private setFontSize(i: number) {
        const ui = this._labelNode.children[i].getComponent(UITransform);
        let h0: number = ui.height;
        ui.height = this.fontSize;
        ui.width = ui.width * ui.height / h0;
    }

    private showLabel() {
        let imageList: cck_bitLblImage_type[] = this.cutImage(this.string);
        this.removeChild();
        this._currLabel = this.string;
        const nodeUI = this.node.getComponent(UITransform);
        for (let i: number = 0; i < imageList.length; ++i) {
            if (!this._labelNode.children[i]) {
                let newNode: Node = new Node(this.string[i]);
                newNode.addComponent(Sprite);
                newNode.getComponent(UITransform).anchorX = 0;
                this._labelNode.addChild(newNode);
            }
            const ui = this._labelNode.children[i].getComponent(UITransform);
            ui.width = imageList[i].sf.rect.width;
            ui.height = this.fontH;
            this._labelNode.children[i].getComponent(Sprite).spriteFrame = imageList[i].sf;
            this.setFontSize(i);
            if (this.overflow === OverflowType.RESIZE_HEIGHT && ui.width * (i + 1) > nodeUI.width) {
                //一行能排列的字体数
                let fontCount: number = Math.floor(nodeUI.width / ui.width);
                let yScale: number = Math.ceil(this._labelNode.children.length / fontCount);
                // 计算子节点y轴的坐标
                _vec3Temp.y = -this.lineHeight * yScale / 2;
                //计算处于该行上的第几个字体,算出来的是数组下标,以0开头
                let index: number = i - Math.floor((i) / fontCount) * fontCount;
                _vec3Temp.x = this.getChildX(index, imageList[index].spacing);
                this._labelNode.children[i].position = _vec3Temp;
            }
            else {
                _vec3Temp.x = this.getChildX(i, imageList[i].spacing);
                _vec3Temp.y = this._labelNode.children[i].position.y;
                this._labelNode.children[i].position = _vec3Temp;
            }
        }
        
        //改变父节点宽度;
        const labelUI = this._labelNode.getComponent(UITransform);
        labelUI.width = this.getParentWidth();
        //改变父节点高度
        labelUI.height = this.getParentHeight();
        this.setLabelX();
        if (this.overflow === OverflowType.NONE) {
            nodeUI.width = labelUI.width;
            nodeUI.height = this.lineHeight;
        }
        else {
            nodeUI.height = labelUI.height;
        }
    }

    private getChildX(index: number, spacing: number) {
        if (index > 0) {
            const ui = this._labelNode.children[index].getComponent(UITransform);
            return spacing + this._labelNode.children[index - 1].position.x + ui.width;
        }
        else return 0;
    }

    private setLabelX() {
        const labelUI = this._labelNode.getComponent(UITransform);
        if (this.horizontalAlign === HorizontalAlign.CENTRE) {
            labelUI.anchorX = 0.5;
            let x: number = -(labelUI.width / 2);
            _vec3Temp.x = (x === -Infinity || x === 0) ? 0 : x;
            _vec3Temp.y = this._labelNode.position.y;
            this._labelNode.position = _vec3Temp;
        }
        else if (this.horizontalAlign === HorizontalAlign.LEFT) {
            labelUI.anchorX = 0;
            
        }
        else if (this.horizontalAlign === HorizontalAlign.RIGHT) {

        }
    }

    private removeChild() {
        if (this._labelNode.children.length > this.string.length) {
            if (this._labelNode.children.length - this.string.length === 1) {
                if (this._currLabel[this._currLabel.length - 1] !== this.string[this.string.length - 1]) {
                    this._labelNode.children[this._currLabel.length - 1].destroy();
                }
                else if (this._currLabel[0] !== this.string[0]) {
                    this._labelNode.children[0].destroy();
                }
                else {
                    let charIdx: number = 0;
                    for (let i: number = 0; i < this._currLabel.length; ++i) {
                        for (let e of this.string) {
                            if (e === this._currLabel[i]) {
                                charIdx = i;
                                break;
                            }
                        }
                    }
                    this._labelNode.children[charIdx].destroy();
                }
            }
            else {
                if (this._currLabel[0] !== this.string[0]) {
                    this._labelNode.removeAllChildren();
                }
                else {
                    let childrenLen: number = this._labelNode.children.length;
                    let index: number = this.string.length;
                    let removeChildren: Node[] = [];
                    for (let i: number = index; i < childrenLen; ++i) {
                        let child: Node = this._labelNode.children[i];
                        removeChildren.push(child);
                    }
                    for (let e of removeChildren) {
                        e.destroy();
                    }
                }
            }
        }
        else if (this._currLabel[0] !== this.string[0]) {
            this._labelNode.removeAllChildren();
        }
    }

    private getParentWidth() {
        if (this._labelNode.children.length === 0) {
            return 0;
        }
        const index = this._labelNode.children.length - 1;
        if (!this._labelNode.children[index]) {
            log('没有子节点');
            return 0;
        }
        const ui = this._labelNode.children[index].getComponent(UITransform);
        return this._labelNode.children[index] && this._labelNode.children[index].position.x + ui.width;
    }

    private getParentHeight() {
        if (this._labelNode.children.length === 0) {
            return 0;
        }
        if (this.overflow === OverflowType.RESIZE_HEIGHT) {
            const nodeUI = this.node.getComponent(UITransform);
            const ui = this._labelNode.children[0].getComponent(UITransform);
            let fontCount: number = Math.floor(nodeUI.width / ui.width);
            let yScale: number = Math.ceil(this._labelNode.children.length / fontCount);
            return yScale * this.lineHeight;
        }
        else {
            const ui = this._labelNode.children[0].getComponent(UITransform);
            return this._labelNode.children[0] && ui.height;
        }
    }

    private isSpChar(e: string) {
        if (e === '.' || e === ':' || e === ',' || e === ';') {
            return true;
        }
        return false;
    }

    // update (dt) {}
}
