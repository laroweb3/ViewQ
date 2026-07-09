import * as sha3Module from 'js-sha3';
import { SealingManifest } from '../types';

const sha3_256 = (
  sha3Module.sha3_256 || 
  (sha3Module as any).default?.sha3_256 || 
  (sha3Module as any).default
);

// Kyber ML-KEM-768 Constants
const KYBER_Q = 3329;
const KYBER_N = 256;
const KYBER_K = 3; // Dimension for ML-KEM-768
const KYBER_ETA1 = 2; // Noise parameter for Kyber-768

// Helper: Convert hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const sanitized = cleanHex.trim().replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(sanitized.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(sanitized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Helper: Convert Uint8Array to hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Seedable PRNG (Mulberry32) for deterministic, reproducible generation from quantum entropy
export function createPRNG(seedHex: string): () => number {
  // Hash the seed first to ensure high distribution
  const hashedSeed = sha3_256(seedHex);
  const hashBytes = hexToBytes(hashedSeed);
  // Take 4 bytes to make a 32-bit seed integer
  let seed = (hashBytes[0] << 24) | (hashBytes[1] << 16) | (hashBytes[2] << 8) | hashBytes[3];
  
  return () => {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Polynomial Ring R_q arithmetic: Z_3329[X] / (X^256 + 1)
export type Poly = number[]; // length 256

export function polyZero(): Poly {
  return new Array(KYBER_N).fill(0);
}

// Add two polynomials mod q
export function polyAdd(a: Poly, b: Poly): Poly {
  const result = polyZero();
  for (let i = 0; i < KYBER_N; i++) {
    result[i] = (a[i] + b[i]) % KYBER_Q;
    if (result[i] < 0) result[i] += KYBER_Q;
  }
  return result;
}

// Subtract two polynomials mod q
export function polySub(a: Poly, b: Poly): Poly {
  const result = polyZero();
  for (let i = 0; i < KYBER_N; i++) {
    result[i] = (a[i] - b[i]) % KYBER_Q;
    if (result[i] < 0) result[i] += KYBER_Q;
  }
  return result;
}

// Polynomial multiplication over ring mod X^256 + 1
export function polyMul(a: Poly, b: Poly): Poly {
  const result = new Array(2 * KYBER_N).fill(0);
  
  // Standard polynomial multiplication
  for (let i = 0; i < KYBER_N; i++) {
    for (let j = 0; j < KYBER_N; j++) {
      result[i + j] = (result[i + j] + a[i] * b[j]) % KYBER_Q;
    }
  }
  
  // Reduce modulo X^256 + 1 (i.e. X^256 = -1)
  const reduced = polyZero();
  for (let i = 0; i < KYBER_N; i++) {
    reduced[i] = (result[i] - result[i + KYBER_N]) % KYBER_Q;
    if (reduced[i] < 0) reduced[i] += KYBER_Q;
  }
  
  return reduced;
}

// Centered Binomial Distribution sampling (eta = 2)
// For Kyber, we sample eta coins a_i, b_i and compute sum(a_i) - sum(b_i)
export function sampleCBD(rand: () => number, eta: number): Poly {
  const poly = polyZero();
  for (let i = 0; i < KYBER_N; i++) {
    let a = 0;
    let b = 0;
    for (let j = 0; j < eta; j++) {
      if (rand() > 0.5) a++;
      if (rand() > 0.5) b++;
    }
    const coeff = (a - b) % KYBER_Q;
    poly[i] = coeff < 0 ? coeff + KYBER_Q : coeff;
  }
  return poly;
}

// Uniformly sampled polynomial modulo q
export function sampleUniform(rand: () => number): Poly {
  const poly = polyZero();
  for (let i = 0; i < KYBER_N; i++) {
    poly[i] = Math.floor(rand() * KYBER_Q);
  }
  return poly;
}

// Convert polynomial to a standard hex representation (compact serialization)
export function polyToHex(poly: Poly): string {
  const bytes = new Uint8Array(poly.length * 2);
  for (let i = 0; i < poly.length; i++) {
    const val = poly[i];
    bytes[i * 2] = val & 0xff;
    bytes[i * 2 + 1] = (val >> 8) & 0xff;
  }
  return bytesToHex(bytes);
}

// ML-KEM-768 Core Key Generation & Encapsulation Simulation
export interface KyberKeyPair {
  ek: string; // Public Encapsulation Key (comprises matrix A and vector t)
  dk: string; // Secret Decapsulation Key (comprises s)
  matrixA: Poly[][]; // 3x3
  vectorT: Poly[]; // 3
  secretS: Poly[]; // 3
}

export function generateMLKEMKeypair(quantumSeed: string): KyberKeyPair {
  const rand = createPRNG(quantumSeed);
  
  // 1. Generate Matrix A (3x3 polynomials uniformly sampled)
  const matrixA: Poly[][] = [];
  for (let i = 0; i < KYBER_K; i++) {
    matrixA[i] = [];
    for (let j = 0; j < KYBER_K; j++) {
      matrixA[i][j] = sampleUniform(rand);
    }
  }
  
  // 2. Generate secret vectors s (3 polynomials, CBD sampled) and noise e (3 polynomials, CBD sampled)
  const secretS: Poly[] = [];
  const errorE: Poly[] = [];
  for (let i = 0; i < KYBER_K; i++) {
    secretS[i] = sampleCBD(rand, KYBER_ETA1);
    errorE[i] = sampleCBD(rand, KYBER_ETA1);
  }
  
  // 3. Compute public vector t = A * s + e
  const vectorT: Poly[] = [];
  for (let i = 0; i < KYBER_K; i++) {
    let sum = polyZero();
    for (let j = 0; j < KYBER_K; j++) {
      const prod = polyMul(matrixA[i][j], secretS[j]);
      sum = polyAdd(sum, prod);
    }
    vectorT[i] = polyAdd(sum, errorE[i]);
  }
  
  // 4. Serialize public key (ek) and private key (dk)
  let ekStr = 'EK_MLKEM768_';
  // Include serialized vector t
  vectorT.forEach((poly, idx) => {
    ekStr += `t${idx}:${polyToHex(poly).slice(0, 32)}_`;
  });
  // Include seed of A
  ekStr += `seedA:${sha3_256(quantumSeed).slice(0, 16)}`;
  
  let dkStr = 'DK_MLKEM768_';
  secretS.forEach((poly, idx) => {
    dkStr += `s${idx}:${polyToHex(poly).slice(0, 32)}_`;
  });
  dkStr = dkStr.slice(0, -1);
  
  return {
    ek: ekStr,
    dk: dkStr,
    matrixA,
    vectorT,
    secretS,
  };
}

// Encapsulates a shared secret using the recipient's public encapsulation key (ek)
export interface KyberEncapsulationResult {
  ct: string; // Ciphertext
  ss: string; // 32-byte shared secret (hex)
}

export function encapsulateMLKEM(keypair: KyberKeyPair, seed: string): KyberEncapsulationResult {
  const rand = createPRNG(seed + '_encaps');
  
  // 1. Sample secret random r (3 polynomials, CBD sampled)
  const r: Poly[] = [];
  for (let i = 0; i < KYBER_K; i++) {
    r[i] = sampleCBD(rand, KYBER_ETA1);
  }
  
  // 2. Sample noise error e1 (3 polynomials, CBD) and e2 (1 polynomial, CBD)
  const e1: Poly[] = [];
  for (let i = 0; i < KYBER_K; i++) {
    e1[i] = sampleCBD(rand, KYBER_ETA1);
  }
  const e2 = sampleCBD(rand, KYBER_ETA1);
  
  // 3. Compute ciphertext vector u = A^T * r + e1
  const u: Poly[] = [];
  for (let i = 0; i < KYBER_K; i++) {
    let sum = polyZero();
    for (let j = 0; j < KYBER_K; j++) {
      // Note Matrix Transpose: A[j][i] instead of A[i][j]
      const prod = polyMul(keypair.matrixA[j][i], r[j]);
      sum = polyAdd(sum, prod);
    }
    u[i] = polyAdd(sum, e1[i]);
  }
  
  // 4. Compute helper scalar v = t^T * r + e2 + message (we encrypt a random 32-byte coins token as message)
  const messageCoin = sampleCBD(rand, 1); // 256-bit message representation
  let tTr = polyZero();
  for (let i = 0; i < KYBER_K; i++) {
    const prod = polyMul(keypair.vectorT[i], r[i]);
    tTr = polyAdd(tTr, prod);
  }
  const v = polyAdd(polyAdd(tTr, e2), messageCoin);
  
  // 5. Build Ciphertext (ct) serialization
  let ctStr = 'CT_MLKEM768_';
  u.forEach((poly, idx) => {
    ctStr += `u${idx}:${polyToHex(poly).slice(0, 24)}_`;
  });
  ctStr += `v:${polyToHex(v).slice(0, 32)}`;
  
  // 6. Generate Shared Secret (ss) as SHA3-256 of the random tokens
  const uHexMerged = u.map(polyToHex).join('').slice(0, 128);
  const vHex = polyToHex(v).slice(0, 64);
  const ss = sha3_256(`ML_KEM_768_SS_${uHexMerged}_${vHex}_${seed}`);
  
  return {
    ct: ctStr,
    ss: ss,
  };
}

// AES-256-GCM Authentic encryption of payload using Kyber-negotiated shared secret
export async function sealPayload(
  message: string,
  filename: string | undefined,
  quantumSeed: string,
  jobId: string,
  target: string,
  isSimulated: boolean
): Promise<SealingManifest> {
  // 1. Generate ML-KEM-768 Keys based on QRNG seed
  const keypair = generateMLKEMKeypair(quantumSeed);
  
  // 2. Encapsulate a shared secret
  const encapsulation = encapsulateMLKEM(keypair, quantumSeed);
  const sharedSecret = encapsulation.ss;
  
  // 3. Derive symmetric key from shared secret (represented as 32-byte hex)
  // We use Web Crypto API to import the raw sharedSecret bytes for AES-GCM
  const rawKeyBytes = hexToBytes(sharedSecret);
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    rawKeyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // 4. Encrypt the plaintext message
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const textEncoder = new TextEncoder();
  const plaintextBytes = textEncoder.encode(message);
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    cryptoKey,
    plaintextBytes
  );
  
  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const encryptedHex = bytesToHex(encryptedBytes);
  const ivHex = bytesToHex(iv);
  let hashInput: string | Uint8Array = message;
  if (message.startsWith('data:')) {
    try {
      const parts = message.split(',');
      const base64Str = parts[1];
      const byteCharacters = atob(base64Str);
      const originalBytes = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        originalBytes[i] = byteCharacters.charCodeAt(i);
      }
      hashInput = originalBytes;
    } catch (e) {
      console.error('Failed to parse data URI in sealPayload, using raw string', e);
    }
  }
  const sha3OfMsg = sha3_256(hashInput);
  
  // 5. Structure the complete Sealed Manifest
  const manifest: SealingManifest = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    algorithm: {
      kem: 'NIST ML-KEM-768 (Kyber)',
      symmetric: 'AES-256-GCM',
      hash: 'SHA3-256',
    },
    parameters: {
      k: KYBER_K,
      q: KYBER_Q,
      eta1: KYBER_ETA1,
    },
    quantumSource: {
      provider: 'IonQ QRNG Core v0.3',
      target: target,
      jobId: jobId,
      isSimulated: isSimulated,
      quantumSeed: quantumSeed,
    },
    cryptographicKeys: {
      encapsulationKeyEk: keypair.ek,
      decapsulationKeyDk: keypair.dk,
      ciphertextCt: encapsulation.ct,
      sharedSecretSs: sharedSecret,
    },
    payload: {
      originalFilename: filename,
      sha3Hash: sha3OfMsg,
      iv: ivHex,
      encryptedData: encryptedHex,
    },
  };
  
  return manifest;
}

// Decrypt helper for verifying/opening the sealed envelope in client-side logs (Demo audit)
export async function unsealPayload(manifest: SealingManifest): Promise<string> {
  try {
    const sharedSecret = manifest.cryptographicKeys.sharedSecretSs;
    const rawKeyBytes = hexToBytes(sharedSecret);
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      rawKeyBytes,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const ivBytes = hexToBytes(manifest.payload.iv);
    const encryptedBytes = hexToBytes(manifest.payload.encryptedData);
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
      },
      cryptoKey,
      encryptedBytes
    );
    
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Failed to decrypt sealed payload', error);
    throw new Error('Autenticación fallida o llave de descapsulado alterada. Integridad del NIST ML-KEM comprometida.');
  }
}
