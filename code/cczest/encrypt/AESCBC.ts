import { decorator } from "../decorator";
import { AES } from "./AES";
import { Encode } from "./EncryptAlgorithm";

const {zestClass} = decorator;

@zestClass("AESCBC")
export class AESCBC extends AES {
    constructor() {
        super();
        this.iv = this.generateIv(16);
    }

    public async encrypt(data: string): Promise<Encode> {
        const buffer = this.stringToArrayBuffer(data);
        const enbuffer = await crypto.subtle.encrypt(
            { name: "AES-CBC", iv: this.iv },
            this.secretkey,
            buffer
        );
        return this.arrayBufferToEncode(enbuffer);
    }

    public async decrypt(encode: Encode): Promise<string> {
        const decode = await crypto.subtle.decrypt(
            { name: "AES-CBC", iv: this.iv }, 
            this.secretkey, 
            this.encodeToUint8Array(encode)
        );
        return this.arrayBufferToString(decode);
    }
}