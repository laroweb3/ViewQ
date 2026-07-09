export type QPUTarget = 'ionq.simulator' | 'ionq.qpu.aria-1' | 'ionq.qpu.forte-1';

export interface AppSettings {
  ionqApiToken: string;
  target: QPUTarget;
  apiProxyBaseUrl: string;
  stellarSourceSecret: string;
  stellarNetwork: 'testnet' | 'public';
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'SUCCESS' | 'ERROR' | 'SYSTEM';
  message: string;
}

export interface StellarNotarization {
  txHash: string;
  ledger: number;
  network: 'testnet' | 'public';
  timestamp: string;
  memo: string;
}

export interface SealingManifest {
  version: string;
  timestamp: string;
  algorithm: {
    kem: string; // "NIST ML-KEM-768 (Kyber)"
    symmetric: string; // "AES-256-GCM"
    hash: string; // "SHA3-256"
  };
  parameters: {
    k: number; // 3 for ML-KEM-768
    q: number; // 3329
    eta1: number; // 2
  };
  quantumSource: {
    provider: string; // "IonQ"
    target: string;
    jobId: string;
    isSimulated: boolean;
    quantumSeed: string; // Hex seed derived from Qubit measurement
  };
  cryptographicKeys: {
    encapsulationKeyEk: string; // public key
    decapsulationKeyDk: string; // private key (usually kept secret, but stored here for demo/re-decapsulation)
    ciphertextCt: string; // Kyber ciphertext
    sharedSecretSs: string; // shared secret
  };
  payload: {
    originalFilename?: string;
    sha3Hash: string;
    iv: string; // AES IV hex
    encryptedData: string; // hex or base64 encrypted data
  };
  stellarNotarization?: StellarNotarization;
}

export interface VaultRecord {
  id: string;
  title: string;
  timestamp: string;
  manifest: SealingManifest;
  notes?: string;
  stellarNotarization?: StellarNotarization;
  armoredFileBase64?: string; // Appended or injected metadata file in base64
}

export interface EphemeralShare {
  token: string;
  filename: string;
  encryptedData: string;
  iv: string;
  aesKeyHex: string;
  createdAt: string;
  consumed: boolean;
  consumedBy?: {
    userAgent: string;
    resolution: string;
    language: string;
    timezone: string;
    ip: string;
    city?: string;
    country?: string;
    timestamp: string;
    stellarTxHash?: string;
  };
}


