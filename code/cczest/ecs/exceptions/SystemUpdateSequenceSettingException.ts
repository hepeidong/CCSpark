import { Exception } from "../../exceptions/Exception";

export class SystemUpdateSequenceSettingException extends Exception {
    constructor(message: string) {
        super(message + " 'updatebefore' and 'updateafter' cannot be set together");
    }
}