import { assetManager, Component, Sprite, SpriteFrame, Texture2D, _decorator } from "cc";
import { ILoader } from "zest";
import { Assert } from "../exceptions/Assert";

const {ccclass} = _decorator;



@ccclass("AutoRelease")
export class AutoRelease extends Component {

    private _spriteFrame: SpriteFrame;
    private _currLoader: ILoader;


    public source(url: string, loader: ILoader) {
        return new Promise<boolean>((resolve, reject) => {
            if (url.indexOf('http://') > -1 || url.indexOf('https://') > -1) {
                assetManager.loadRemote<Texture2D>(url, (err, texture) => {
                    if (err) {
                        reject(`资源加载错误：${err}`);
                        return;
                    }
                    if (Assert.handle(Assert.Type.LoadRemoteTextureException, texture, url)) {
                        const spriteFrame = new SpriteFrame();
                        spriteFrame.texture = texture;
                        this.setSpriteFrame(spriteFrame, loader);
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                });
            }
            else {
                const spriteFrame = loader.get<SpriteFrame>(url, SpriteFrame);
                if (!spriteFrame) {
                    loader.load(url, SpriteFrame, (err, asset) => {
                        if (err) {
                            reject(`资源加载错误：${err}`);
                            return;
                        }
                        this.setSpriteFrame(asset as SpriteFrame, loader);
                        resolve(true);
                    });
                }
                else {
                    this.setSpriteFrame(spriteFrame, loader);
                    resolve(true);
                }
            }
        });
    }

    private setSpriteFrame(asset: SpriteFrame, loader: ILoader) {
        const sprite = this.node.getComponent(Sprite);
        if (Assert.handle(Assert.Type.GetComponentException, sprite instanceof Sprite, "Sprite")) {
            const oldAsset = sprite.spriteFrame;
            if (this._currLoader) {
                if (!this._currLoader.delete(oldAsset)) {
                    oldAsset.decRef();
                }
            }
            sprite.spriteFrame = null;
            sprite.spriteFrame = asset;
            this._spriteFrame = asset;
            this._currLoader = loader;
        }
    }

    onDestroy() {
        if (this._currLoader) {
            this._currLoader.delete(this._spriteFrame);
        }
    }

    // update () {
    //     
    // }
}
