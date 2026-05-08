import { describe, expect, it } from "vitest";

import {
  decryptMachineSecret,
  encryptMachineSecret,
  generateMachineSecret,
  getMachineSecretPrefix,
  hashMachineSecret,
  MACHINE_SECRET_PREFIX_LENGTH,
} from "./secrets.js";

describe("sync machine secrets", () => {
  it("keeps generated secret prefix and hash behavior stable", async () => {
    const secret = generateMachineSecret();

    expect(secret).toMatch(/^nrc_[a-f0-9]{64}$/);
    expect(getMachineSecretPrefix(secret)).toBe(secret.slice(0, MACHINE_SECRET_PREFIX_LENGTH));
    await expect(hashMachineSecret(secret)).resolves.toMatch(/^[a-f0-9]{64}$/);
  });

  it("encrypts and decrypts machine secrets for admin copy", async () => {
    const secret = generateMachineSecret();
    const encrypted = await encryptMachineSecret(secret);

    expect(encrypted.machineSecretCiphertext).not.toContain(secret);
    expect(encrypted.machineSecretIv).toHaveLength(16);
    await expect(decryptMachineSecret(encrypted)).resolves.toBe(secret);
  });

  it("treats missing encrypted columns as non-copyable", async () => {
    await expect(decryptMachineSecret(null)).resolves.toBeNull();
    await expect(
      decryptMachineSecret({ machineSecretCiphertext: "", machineSecretIv: "" }),
    ).resolves.toBeNull();
  });
});
