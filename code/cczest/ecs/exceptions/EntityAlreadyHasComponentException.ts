import { Exception } from "../../exceptions/Exception";

export class EntityAlreadyHasComponentException extends Exception {
    constructor(message: string, index: number) {
        super(message + "\nThe Entity already has a component at (" + index + ").");
    }
}