import { Encode, EncryptAlgorithm } from "./EncryptAlgorithm";

export class AESCTR extends EncryptAlgorithm<CryptoKey> {
    constructor(secretkey: CryptoKey) {
        super(secretkey);
        this.iv = this.generateIv(16);
    }

    public async encrypt(data: string): Promise<Encode> {
        const buffer = this.stringToArrayBuffer(data);
        const enbuffer = await crypto.subtle.encrypt(
            { name: "AES-CTR", counter: this.iv, length: 64 },
            this.secretkey,
            buffer
        );
        return this.arrayBufferToEncode(enbuffer);
    }

    public async decrypt(encode: Encode): Promise<string> {
        const decode = await crypto.subtle.decrypt(
            { name: "AES-CTR", counter: this.iv, length: 64 }, 
            this.secretkey, 
            this.encodeToUint8Array(encode)
        );
        return this.arrayBufferToString(decode);
    }
}