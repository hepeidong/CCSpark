import { Exception } from "../../exceptions/Exception";

export class MatchingEntityException extends Exception {
    constructor(message: string) {
        super("Matching entity exception:\n" + `${message}`);
    }
}