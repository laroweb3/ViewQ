import { PDFDocument } from 'pdf-lib';
import * as sha3Module from 'js-sha3';

const sha3_256 = (
  sha3Module.sha3_256 || 
  (sha3Module as any).default?.sha3_256 || 
  (sha3Module as any).default
);

// Metadata markers for image/generic steganography
const MARKER_START = ' [VIBEDESK_QUANTUM_START]';
const MARKER_END = '[VIBEDESK_QUANTUM_END]';

/**
 * Encodes a string to Uint8Array
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Decodes a Uint8Array to string
 */
function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Helper: Find subarray in Uint8Array
 */
function findSubarray(arr: Uint8Array, sub: Uint8Array): number {
  if (sub.length === 0 || arr.length < sub.length) return -1;
  for (let i = 0; i <= arr.length - sub.length; i++) {
    let match = true;
    for (let j = 0; j < sub.length; j++) {
      if (arr[i + j] !== sub[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

/**
 * Injects Stellar transaction and IonQ job metadata into a file.
 * Handles PDF using pdf-lib, and images/others using EOF steganography.
 */
export async function injectMetadata(
  fileBytes: Uint8Array,
  fileName: string,
  stellarTx: string,
  ionqJobId: string,
  originalHash: string
): Promise<{ modifiedBytes: Uint8Array; format: 'pdf' | 'steg' }> {
  const lowercaseName = fileName.toLowerCase();
  
  if (lowercaseName.endsWith('.pdf')) {
    try {
      // 1. Load PDF from buffer
      const pdfDoc = await PDFDocument.load(fileBytes);
      
      // 2. Set document metadata dictionaries (custom keys and standards)
      pdfDoc.setTitle("Evidencia Digital Asegurada - viewQ");
      pdfDoc.setSubject(`StellarTX:${stellarTx}`);
      pdfDoc.setKeywords([`IonQ:${ionqJobId}`, "viewQ", "PQC-Protected", `OriginalHash:${originalHash}`]);
      
      // Also write custom metadata dictionary keys if supported by standard reader tools
      const pdfBytes = await pdfDoc.save();
      return { modifiedBytes: pdfBytes, format: 'pdf' };
    } catch (e) {
      console.error("pdf-lib injection failed, falling back to steg", e);
      // Fallback to steganography if PDF is encrypted or malformed
    }
  }

  // Steganography injection for images and other files
  // We append the metadata block at the very end of the file.
  const metadataString = `${MARKER_START}stellarTx:${stellarTx}|ionqJobId:${ionqJobId}|originalHash:${originalHash}${MARKER_END}`;
  const metadataBytes = stringToBytes(metadataString);
  
  const modifiedBytes = new Uint8Array(fileBytes.length + metadataBytes.length);
  modifiedBytes.set(fileBytes, 0);
  modifiedBytes.set(metadataBytes, fileBytes.length);
  
  return { modifiedBytes, format: 'steg' };
}

export interface ExtractedMetadata {
  stellarTx: string | null;
  ionqJobId: string | null;
  originalHash: string | null;
  format: 'pdf' | 'steg' | 'none';
  originalFileBytes: Uint8Array;
}

/**
 * Extracts injected metadata and retrieves the original file bytes
 */
export async function extractMetadata(fileBytes: Uint8Array): Promise<ExtractedMetadata> {
  // Try steganography extraction first
  const startMarkerBytes = stringToBytes(MARKER_START);
  const endMarkerBytes = stringToBytes(MARKER_END);
  
  const startIndex = findSubarray(fileBytes, startMarkerBytes);
  const endIndex = findSubarray(fileBytes, endMarkerBytes);
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    try {
      const metaSegment = fileBytes.slice(startIndex + startMarkerBytes.length, endIndex);
      const metaString = bytesToString(metaSegment);
      
      // Parse pipes: stellarTx:XXX|ionqJobId:YYY|originalHash:ZZZ
      const parts = metaString.split('|');
      let stellarTx: string | null = null;
      let ionqJobId: string | null = null;
      let originalHash: string | null = null;
      
      parts.forEach(part => {
        const [key, value] = part.split(':');
        if (key === 'stellarTx') stellarTx = value || null;
        if (key === 'ionqJobId') ionqJobId = value || null;
        if (key === 'originalHash') originalHash = value || null;
      });
      
      // Clean bytes (exclude the appended metadata segment)
      const originalFileBytes = fileBytes.slice(0, startIndex);
      
      return {
        stellarTx,
        ionqJobId,
        originalHash,
        format: 'steg',
        originalFileBytes
      };
    } catch (e) {
      console.error("Failed to parse steg metadata", e);
    }
  }

  // Try PDF metadata extraction
  try {
    const pdfDoc = await PDFDocument.load(fileBytes);
    const subject = pdfDoc.getSubject() || '';
    const keywordsStr = pdfDoc.getKeywords() || '';
    const keywords = keywordsStr.split(' ');
    
    let stellarTx: string | null = null;
    let ionqJobId: string | null = null;
    let originalHash: string | null = null;

    if (subject.startsWith('StellarTX:')) {
      stellarTx = subject.replace('StellarTX:', '');
    }

    keywords.forEach(keyword => {
      if (keyword.startsWith('IonQ:')) {
        ionqJobId = keyword.replace('IonQ:', '');
      } else if (keyword.startsWith('OriginalHash:')) {
        originalHash = keyword.replace('OriginalHash:', '');
      }
    });

    if (stellarTx || ionqJobId || originalHash) {
      return {
        stellarTx,
        ionqJobId,
        originalHash,
        format: 'pdf',
        originalFileBytes: fileBytes
      };
    }
  } catch (e) {
    // Not a valid PDF or failed to parse
  }

  return {
    stellarTx: null,
    ionqJobId: null,
    originalHash: null,
    format: 'none',
    originalFileBytes: fileBytes
  };
}
