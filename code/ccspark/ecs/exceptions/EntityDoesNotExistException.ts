import { Exception } from "../../exceptions/Exception";

export class EntityDoesNotExistException extends Exception {
    constructor(message: string) {
        super(message + "\nThe Entity does not exist.");
    }
}