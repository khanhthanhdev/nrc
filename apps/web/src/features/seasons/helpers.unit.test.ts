import { describe, expect, it } from "vitest";

import {
  buildSeasonDocumentUploadUrl,
  deriveSeasonHeroCtas,
  getSeasonDocumentUploadKey,
  getSeasonEventStatusMeta,
  getSeasonLifecycleMeta,
} from "./helpers";

describe("season helpers", () => {
  it("derives hero CTAs from manual-like documents first", () => {
    const ctas = deriveSeasonHeroCtas([
      {
        id: "document-qa",
        title: "Q&A Board",
        url: "https://example.com/qa",
      },
      {
        id: "document-manual",
        title: "Game Manual v1",
        url: "https://example.com/manual",
      },
      {
        id: "document-cad",
        title: "Field CAD",
        url: "https://example.com/cad",
      },
    ]);

    expect(ctas.primary?.id).toBe("document-manual");
    expect(ctas.secondary?.id).toBe("document-qa");
  });

  it("omits the secondary CTA when there is only one document", () => {
    const ctas = deriveSeasonHeroCtas([
      {
        id: "document-manual",
        title: "Competition Handbook",
        url: "https://example.com/manual",
      },
    ]);

    expect(ctas.primary?.id).toBe("document-manual");
    expect(ctas.secondary).toBeNull();
  });

  it("maps public event statuses to UI label keys", () => {
    expect(getSeasonEventStatusMeta("registration_open").labelKey).toBe(
      "season.status.registrationOpen",
    );
    expect(getSeasonEventStatusMeta("completed").labelKey).toBe("season.status.completed");
    expect(getSeasonEventStatusMeta("archived").labelKey).toBe("season.status.archived");
  });

  it("maps admin season lifecycle badges", () => {
    expect(getSeasonLifecycleMeta(true).labelKey).toBe("season.admin.lifecycle.active");
    expect(getSeasonLifecycleMeta(false).labelKey).toBe("season.admin.lifecycle.archived");
  });

  it("builds and parses managed upload document URLs", () => {
    const serverUrl = "https://api.example.com";
    const objectKey = "documents/season-2026/manual.pdf";
    const documentUrl = buildSeasonDocumentUploadUrl(objectKey, serverUrl);

    expect(documentUrl).toBe(
      "https://api.example.com/api/upload/document?key=documents%2Fseason-2026%2Fmanual.pdf",
    );
    expect(getSeasonDocumentUploadKey(documentUrl, serverUrl)).toBe(objectKey);
  });

  it("ignores non-managed season document URLs", () => {
    expect(
      getSeasonDocumentUploadKey("https://example.com/manual.pdf", "https://api.example.com"),
    ).toBeNull();
  });
});
