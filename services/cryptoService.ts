
const ALGO = 'AES-GCM';
const KEY_ALGO = 'PBKDF2';
const HASH = 'SHA-256';
const ITERATIONS = 100000;

async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const masterKey = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: KEY_ALGO },
        false,
        ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
        {
            name: KEY_ALGO,
            salt: salt,
            iterations: ITERATIONS,
            hash: HASH
        },
        masterKey,
        { name: ALGO, length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

export async function encrypt(data: string, password: string): Promise<string> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getKey(password, salt);

    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: ALGO,
            iv: iv
        },
        key,
        new TextEncoder().encode(data)
    );
    
    const bufferToB64 = (buffer: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));

    return `${bufferToB64(salt)}:${bufferToB64(iv)}:${bufferToB64(encryptedData)}`;
}

export async function decrypt(encryptedString: string, password: string): Promise<string> {
    const b64ToBuffer = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted string format.');
    }

    const salt = b64ToBuffer(parts[0]);
    const iv = b64ToBuffer(parts[1]);
    const encryptedData = b64ToBuffer(parts[2]);

    const key = await getKey(password, salt);

    const decryptedData = await window.crypto.subtle.decrypt(
        {
            name: ALGO,
            iv: iv
        },
        key,
        encryptedData
    );

    return new TextDecoder().decode(decryptedData);
}
