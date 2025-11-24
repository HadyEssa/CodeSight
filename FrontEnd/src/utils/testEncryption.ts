// Test script to verify encryption/decryption works correctly
import { encryptApiKey, decryptApiKey } from './encryption';

// Test 1: Encrypt and decrypt
const testKey = 'AIzaSy_test_key_12345';
console.log('Original:', testKey);

const encrypted = encryptApiKey(testKey);
console.log('Encrypted:', encrypted);

const decrypted = decryptApiKey(encrypted);
console.log('Decrypted:', decrypted);

console.log('Match:', testKey === decrypted ? '✅ SUCCESS' : '❌ FAILED');

export { };
