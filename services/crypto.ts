/**
 * CRYPTOGRAPHIC CORE
 * Handles Zero-Knowledge encryption. The server only ever sees encrypted blobs.
 */

// Derive a key from the user's master password
export const deriveKey = async (password: string, salt: string = 'voidvault-salt-v1'): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
  
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  };
  
  // Encrypt object -> string
  export const encryptData = async (data: any, key: CryptoKey): Promise<string> => {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = enc.encode(JSON.stringify(data));
  
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );
  
    // Combine IV and ciphertext for storage
    const buffer = new Uint8Array(iv.byteLength + encryptedContent.byteLength);
    buffer.set(iv, 0);
    buffer.set(new Uint8Array(encryptedContent), iv.byteLength);
  
    return btoa(String.fromCharCode(...buffer));
  };
  
  // Decrypt string -> object
  export const decryptData = async (ciphertext: string, key: CryptoKey): Promise<any> => {
    try {
      const binaryString = atob(ciphertext);
      const buffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        buffer[i] = binaryString.charCodeAt(i);
      }
  
      const iv = buffer.slice(0, 12);
      const data = buffer.slice(12);
  
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
      );
  
      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decryptedContent));
    } catch (e) {
      console.error("Decryption failed", e);
      throw new Error("Invalid Key or Corrupted Data");
    }
  };