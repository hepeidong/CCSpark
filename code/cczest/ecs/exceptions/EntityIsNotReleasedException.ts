import { Exception } from "../../exceptions/Exception";

export class EntityIsNotReleasedException extends Exception {
    constructor(message: string) {
        super(message + "\nThe Entity is not released yet!");
    }
}