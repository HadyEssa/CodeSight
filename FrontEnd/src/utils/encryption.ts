import CryptoJS from 'crypto-js';

/**
 * API Key Encryption Utility
 * 
 * Uses AES-256 encryption to securely store API keys in localStorage
 * 
 * Why encryption is necessary:
 * - localStorage is vulnerable to XSS attacks
 * - Browser extensions can read localStorage
 * - Anyone with physical access can view localStorage
 * 
 * This adds a layer of protection by encrypting the API key before storage
 */

// Generate a device-specific encryption key
// In production, this should be more sophisticated (derived from user auth, etc.)
const getEncryptionKey = (): string => {
    // Use a combination of factors to create a unique key per browser/device
    const userAgent = navigator.userAgent;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Combine and hash to create encryption key
    const rawKey = `${userAgent}-${screenResolution}-${timezone}-CodeSight-v1`;

    // Use SHA-256 to create a consistent key
    return CryptoJS.SHA256(rawKey).toString();
};

/**
 * Encrypt a string (API key) using AES-256
 */
export function encryptApiKey(apiKey: string): string {
    if (!apiKey) return '';

    try {
        const encryptionKey = getEncryptionKey();
        const encrypted = CryptoJS.AES.encrypt(apiKey, encryptionKey).toString();
        return encrypted;
    } catch (error) {
        console.error('[Encryption] Failed to encrypt API key:', error);
        return apiKey; // Fallback to plain text if encryption fails
    }
}

/**
 * Decrypt an encrypted API key
 */
export function decryptApiKey(encryptedKey: string): string {
    if (!encryptedKey) return '';

    try {
        const encryptionKey = getEncryptionKey();
        const decrypted = CryptoJS.AES.decrypt(encryptedKey, encryptionKey);
        const apiKey = decrypted.toString(CryptoJS.enc.Utf8);

        if (!apiKey) {
            console.error('[Encryption] Decryption resulted in empty string');
            return encryptedKey; // Return encrypted if decryption fails
        }

        return apiKey;
    } catch (error) {
        console.error('[Encryption] Failed to decrypt API key:', error);
        return encryptedKey; // Return encrypted text if decryption fails
    }
}

/**
 * Check if a string appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
    if (!value) return false;

    // AES encrypted strings from crypto-js have a specific format
    // They contain base64 characters and are typically longer
    return value.length > 50 && /^[A-Za-z0-9+/=]+$/.test(value);
}
