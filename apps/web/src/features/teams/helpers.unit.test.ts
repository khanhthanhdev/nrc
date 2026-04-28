import { describe, expect, it } from "vitest";

import { buildTeamImageUploadUrl, getTeamImageUploadKey, resolveTeamImageUrl } from "./helpers";

describe("team helpers", () => {
  it("builds and parses managed upload image URLs", () => {
    const serverUrl = "https://api.example.com";
    const objectKey = "images/team-02323/logo.png";
    const imageUrl = buildTeamImageUploadUrl(objectKey, serverUrl);

    expect(imageUrl).toBe(
      "https://api.example.com/api/upload/image?key=images%2Fteam-02323%2Flogo.png",
    );
    expect(getTeamImageUploadKey(imageUrl, serverUrl)).toBe(objectKey);
  });

  it("keeps external and existing managed image URLs unchanged for display", () => {
    const externalUrl = "https://cdn.example.com/team.png";
    const managedUrl = "https://api.example.com/api/upload/image?key=images%2Fteam.png";

    expect(resolveTeamImageUrl(externalUrl, "https://api.example.com")).toBe(externalUrl);
    expect(resolveTeamImageUrl(managedUrl, "https://api.example.com")).toBe(managedUrl);
  });

  it("turns uploaded object keys into image display URLs", () => {
    expect(resolveTeamImageUrl("images/team-02323/cover.jpg", "https://api.example.com")).toBe(
      "https://api.example.com/api/upload/image?key=images%2Fteam-02323%2Fcover.jpg",
    );
  });

  it("ignores non-managed image URLs when parsing keys", () => {
    expect(getTeamImageUploadKey("https://example.com/team.png", "https://api.example.com")).toBe(
      null,
    );
  });
});
