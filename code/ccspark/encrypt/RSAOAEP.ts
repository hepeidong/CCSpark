import { Encode, EncryptAlgorithm } from "./EncryptAlgorithm";

export class RSAOAEP extends EncryptAlgorithm<CryptoKeyPair> {
    constructor(secretkey: CryptoKeyPair) {
        super(secretkey);
    }

    public async encrypt(data: string): Promise<Encode> {
        const buffer = this.stringToArrayBuffer(data);
        const enbuffer = await crypto.subtle.encrypt(
            {
                name: "RSA-OAEP",
            },
            this.secretkey.publicKey,
            buffer
        );
        return this.arrayBufferToEncode(enbuffer);
    }

    public async decrypt(encode: Encode): Promise<string> {
        const decode = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            this.secretkey.privateKey,
            this.encodeToUint8Array(encode)
        );
          return this.arrayBufferToString(decode);
    }
}