import { SealingManifest } from '../types';

export interface ViewQHeader {
  originalFilename: string;
  extension: string;
  stellarTx: string;
  ionqJobId: string;
  iv: string; // Hex AES-GCM IV
  sha3Hash: string; // Original SHA3-256 hash
  manifest: SealingManifest; // The complete manifest
}

/**
 * Packs encrypted bytes of a file and its header metadata into a single .viewQ binary payload.
 * Structure:
 * [Magic bytes: "VIEWQ\0"] (6 bytes)
 * [Header Length: 4 bytes uint32, little-endian] (4 bytes)
 * [JSON Header String as UTF-8 bytes]
 * [AES-GCM Encrypted File Bytes]
 */
export function packViewQ(
  encryptedBytes: Uint8Array,
  header: ViewQHeader
): Uint8Array {
  const magic = new TextEncoder().encode("VIEWQ\0");
  const headerJson = JSON.stringify(header);
  const headerBytes = new TextEncoder().encode(headerJson);
  
  const headerLength = headerBytes.length;
  const lengthBytes = new Uint8Array(4);
  const view = new DataView(lengthBytes.buffer);
  view.setUint32(0, headerLength, true);
  
  const totalLength = magic.length + lengthBytes.length + headerBytes.length + encryptedBytes.length;
  const packed = new Uint8Array(totalLength);
  
  let offset = 0;
  packed.set(magic, offset);
  offset += magic.length;
  packed.set(lengthBytes, offset);
  offset += lengthBytes.length;
  packed.set(headerBytes, offset);
  offset += headerBytes.length;
  packed.set(encryptedBytes, offset);
  
  return packed;
}

/**
 * Unpacks a .viewQ binary payload into its header metadata and encrypted file bytes.
 */
export function unpackViewQ(bytes: Uint8Array): { header: ViewQHeader; encryptedBytes: Uint8Array } | null {
  try {
    const magic = "VIEWQ\0";
    const magicBytes = new TextEncoder().encode(magic);
    
    // Check minimum length
    if (bytes.length < magicBytes.length + 4) return null;
    
    // Check magic bytes match
    for (let i = 0; i < magicBytes.length; i++) {
      if (bytes[i] !== magicBytes[i]) return null;
    }
    
    let offset = magicBytes.length;
    const lengthBytes = bytes.slice(offset, offset + 4);
    const view = new DataView(lengthBytes.buffer);
    const headerLength = view.getUint32(0, true);
    offset += 4;
    
    if (bytes.length < offset + headerLength) return null;
    const headerBytes = bytes.slice(offset, offset + headerLength);
    offset += headerLength;
    
    const headerJson = new TextDecoder().decode(headerBytes);
    const header = JSON.parse(headerJson) as ViewQHeader;
    
    const encryptedBytes = bytes.slice(offset);
    
    return { header, encryptedBytes };
  } catch (e) {
    console.error("Failed to unpack viewQ file:", e);
    return null;
  }
}

/**
 * Decrypts the encrypted file bytes from a .viewQ file using the parameters in its header.
 * Returns the decrypted plaintext (which could be text or a base64 Data URL).
 */
export async function decryptViewQPayload(
  encryptedBytes: Uint8Array,
  header: ViewQHeader
): Promise<string> {
  const sharedSecret = header.manifest.cryptographicKeys.sharedSecretSs;
  
  // Convert hex sharedSecret to bytes
  const cleanHex = sharedSecret.startsWith('0x') ? sharedSecret.slice(2) : sharedSecret;
  const sanitized = cleanHex.trim().replace(/[^0-9a-fA-F]/g, '');
  const keyBytes = new Uint8Array(sanitized.length / 2);
  for (let i = 0; i < keyBytes.length; i++) {
    keyBytes[i] = parseInt(sanitized.slice(i * 2, i * 2 + 2), 16);
  }
  
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  // Convert hex IV to bytes
  const ivHex = header.iv;
  const ivBytes = new Uint8Array(ivHex.length / 2);
  for (let i = 0; i < ivBytes.length; i++) {
    ivBytes[i] = parseInt(ivHex.substring(i * 2, i * 2 + 2), 16);
  }
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    cryptoKey,
    encryptedBytes
  );
  
  const ext = (header.extension || '').toLowerCase().trim();
  const textExtensions = new Set(['.txt', '.csv', '.json', '.md', '.html', '.htm', '.js', '.ts', '.tsx', '.css']);
  
  if (textExtensions.has(ext)) {
    return new TextDecoder().decode(decryptedBuffer);
  } else {
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    
    // Convert binary decryptedBuffer to base64 Data URL
    const bytes = new Uint8Array(decryptedBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    return `data:${mimeType};base64,${base64}`;
  }
}
