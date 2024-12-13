import { decorator } from "../decorator/Decorator";
import { GetClassException } from "./GetClassException";

const {zestClass} = decorator;

@zestClass("GetModelClassException")
export class GetModelClassException extends GetClassException {
    constructor(message: string, classRef: Function) {
        super(`不存在 “${message}” 模型！`, classRef);
    }
}