import { decorator } from "../decorator/Decorator";
import { GetClassException } from "./GetClassException";

const {zestClass} = decorator;

@zestClass("GetHttpMessageClassException")
export class GetHttpMessageClassException extends GetClassException {
    constructor(message: string, classRef: Function) {
        super(`不存在 “${message}” http消息！`, classRef);
    }
}