import { Texture2D } from "cc";
import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";

const {ccsclass} = decorator;

@ccsclass("LoadRemoteTextureException")
export class LoadRemoteTextureException extends Exception {
    private _texture: any;
    constructor(message: string, texture: any) {
        super(`${message} 并不是一张图片纹理资源！`);
        this._texture = texture;
    }

    public handle(): boolean {
        if (this._texture instanceof Texture2D) {
            return true;
        }
        throw new Error(this.toString());
    }
}