import { describe, expect, it } from "vitest";

import {
  generateMachineSecret,
  getMachineSecretPrefix,
  hashMachineSecret,
  encryptMachineSecret,
  decryptMachineSecret,
  MACHINE_SECRET_PREFIX_LENGTH,
} from "./secrets.js";

describe("generateMachineSecret", () => {
  it("returns a string matching nrc_ followed by 64 hex chars", () => {
    const secret = generateMachineSecret();
    expect(secret).toMatch(/^nrc_[a-f0-9]{64}$/);
  });

  it("generates unique secrets", () => {
    const secrets = new Set(Array.from({ length: 100 }, () => generateMachineSecret()));
    expect(secrets.size).toBe(100);
  });

  it("has correct total length", () => {
    const secret = generateMachineSecret();
    // "nrc_" = 4 chars + 64 hex chars = 68
    expect(secret).toHaveLength(68);
  });
});

describe("getMachineSecretPrefix", () => {
  it("returns the first MACHINE_SECRET_PREFIX_LENGTH characters", () => {
    const secret = generateMachineSecret();
    const prefix = getMachineSecretPrefix(secret);
    expect(prefix).toBe(secret.slice(0, MACHINE_SECRET_PREFIX_LENGTH));
    expect(prefix).toHaveLength(MACHINE_SECRET_PREFIX_LENGTH);
  });

  it("starts with nrc_", () => {
    const secret = generateMachineSecret();
    const prefix = getMachineSecretPrefix(secret);
    expect(prefix).toMatch(/^nrc_/);
  });
});

describe("hashMachineSecret", () => {
  it("returns a 64-character hex string", async () => {
    const secret = generateMachineSecret();
    const hash = await hashMachineSecret(secret);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns the same hash for the same secret", async () => {
    const secret = generateMachineSecret();
    const hash1 = await hashMachineSecret(secret);
    const hash2 = await hashMachineSecret(secret);
    expect(hash1).toBe(hash2);
  });

  it("returns different hashes for different secrets", async () => {
    const secret1 = generateMachineSecret();
    const secret2 = generateMachineSecret();
    const hash1 = await hashMachineSecret(secret1);
    const hash2 = await hashMachineSecret(secret2);
    expect(hash1).not.toBe(hash2);
  });
});

describe("encryptMachineSecret / decryptMachineSecret", () => {
  it("roundtrips a machine secret", async () => {
    const secret = generateMachineSecret();
    const encrypted = await encryptMachineSecret(secret);
    const decrypted = await decryptMachineSecret(encrypted);
    expect(decrypted).toBe(secret);
  });

  it("ciphertext does not contain the original secret", async () => {
    const secret = generateMachineSecret();
    const encrypted = await encryptMachineSecret(secret);
    expect(encrypted.machineSecretCiphertext).not.toContain(secret);
  });

  it("iv is 16 characters (base64 of 12 bytes)", async () => {
    const secret = generateMachineSecret();
    const encrypted = await encryptMachineSecret(secret);
    expect(encrypted.machineSecretIv).toHaveLength(16);
  });

  it("produces different ciphertext for same secret (randomized IV)", async () => {
    const secret = generateMachineSecret();
    const encrypted1 = await encryptMachineSecret(secret);
    const encrypted2 = await encryptMachineSecret(secret);
    expect(encrypted1.machineSecretCiphertext).not.toBe(encrypted2.machineSecretCiphertext);
    expect(encrypted1.machineSecretIv).not.toBe(encrypted2.machineSecretIv);
  });

  it("returns null for null input", async () => {
    expect(await decryptMachineSecret(null)).toBeNull();
  });

  it("returns null for undefined input", async () => {
    expect(await decryptMachineSecret(undefined)).toBeNull();
  });

  it("returns null for empty ciphertext", async () => {
    expect(await decryptMachineSecret({ machineSecretCiphertext: "", machineSecretIv: "" })).toBeNull();
  });

  it("returns null for empty iv", async () => {
    const secret = generateMachineSecret();
    const encrypted = await encryptMachineSecret(secret);
    expect(await decryptMachineSecret({ machineSecretCiphertext: encrypted.machineSecretCiphertext, machineSecretIv: "" })).toBeNull();
  });

  it("returns null for empty ciphertext with valid iv", async () => {
    const secret = generateMachineSecret();
    const encrypted = await encryptMachineSecret(secret);
    expect(await decryptMachineSecret({ machineSecretCiphertext: "", machineSecretIv: encrypted.machineSecretIv })).toBeNull();
  });
});
