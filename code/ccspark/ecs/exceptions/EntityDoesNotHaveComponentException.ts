import { Exception } from "../../exceptions/Exception";

export class EntityDoesNotHaveComponentException extends Exception {
    constructor(message: string, index: number) {
        super(message + "\nThe Entity does not have a component at index (" + index + ").");
    }
}