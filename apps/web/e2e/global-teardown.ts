import type { FullConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.test" });

const resolveDatabaseName = (databaseUrl: string): string => {
  try {
    const parsed = new URL(databaseUrl);
    return parsed.pathname.replace(/^\/+/, "");
  } catch {
    return "";
  }
};

const assertSafeDatabase = (): string => {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const databaseName = resolveDatabaseName(databaseUrl);

  if (!/(test|e2e)/i.test(databaseName)) {
    throw new Error(
      `Refusing to cleanup unsafe DATABASE_URL (${databaseName || "unknown"}). ` +
        "Use a dedicated test database name containing 'test' or 'e2e'.",
    );
  }

  return databaseName;
};

const resetDatabaseViaApi = async (): Promise<void> => {
  const databaseName = assertSafeDatabase();
  const apiUrl = process.env.PLAYWRIGHT_API_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const response = await fetch(`${apiUrl}/api/test/data/reset-database`, {
    method: "POST",
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Failed to reset E2E database '${databaseName}' via ${apiUrl}. ` +
        `Received ${response.status}: ${responseText}`,
    );
  }
};

const globalTeardown = async (_config: FullConfig): Promise<void> => {
  await resetDatabaseViaApi();
};

export default globalTeardown;
