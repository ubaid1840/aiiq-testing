const Cryptr = require("cryptr");

const cryptr = new Cryptr(process.env.NEXT_PUBLIC_ENCRYPTION_KEY);

const EncryptCookie = (data) => {
    const encryptedString = cryptr.encrypt(data);
    return encryptedString
}

const DecryptCookie = (data) => {
    const decryptedString = cryptr.decrypt(data);
    return decryptedString
}

export {EncryptCookie, DecryptCookie}
