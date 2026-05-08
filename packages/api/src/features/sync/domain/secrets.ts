import { sha256Hex } from "./hash.js";

export const MACHINE_SECRET_PREFIX_LENGTH = 16;

export const generateMachineSecret = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `nrc_${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
};

export const getMachineSecretPrefix = (secret: string): string =>
  secret.slice(0, MACHINE_SECRET_PREFIX_LENGTH);

export const hashMachineSecret = (secret: string): Promise<string> => sha256Hex(secret);

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const bytesToBase64 = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes));

const base64ToBytes = (value: string): Uint8Array<ArrayBuffer> => {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return bytes;
};

const getEncryptionKey = async (): Promise<CryptoKey> => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required to encrypt sync client secrets.");
  }

  const digest = await crypto.subtle.digest(
    "SHA-256",
    textEncoder.encode(`nrc-sync-client-secret:${secret}`),
  );

  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["decrypt", "encrypt"]);
};

export interface EncryptedMachineSecret {
  machineSecretCiphertext: string;
  machineSecretIv: string;
}

export const encryptMachineSecret = async (secret: string): Promise<EncryptedMachineSecret> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { iv, name: "AES-GCM" },
    await getEncryptionKey(),
    textEncoder.encode(secret),
  );

  return {
    machineSecretCiphertext: bytesToBase64(new Uint8Array(encrypted)),
    machineSecretIv: bytesToBase64(iv),
  };
};

export const decryptMachineSecret = async (
  encrypted: EncryptedMachineSecret | null | undefined,
): Promise<string | null> => {
  if (!encrypted?.machineSecretCiphertext || !encrypted.machineSecretIv) {
    return null;
  }

  const decrypted = await crypto.subtle.decrypt(
    { iv: base64ToBytes(encrypted.machineSecretIv), name: "AES-GCM" },
    await getEncryptionKey(),
    base64ToBytes(encrypted.machineSecretCiphertext),
  );

  return textDecoder.decode(decrypted);
};
