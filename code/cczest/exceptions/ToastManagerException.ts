import { decorator } from "../decorator/Decorator";
import { Exception } from "./Exception";

const {zestClass} = decorator;

@zestClass("ToastManagerException")
export class ToastManagerException extends Exception {
    constructor(message: string) {
        super(`ToastManager未知错误，Toast视图 “${message}” 对象池不存在！`);
    }

    public handle(): boolean {
        throw new Error(this.toString());
    }
}