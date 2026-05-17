import { describe, expect, it } from "vitest";

import { escapeHtml, sanitizePayload, sanitizeValue } from "./sanitize";

describe("escapeHtml", () => {
  it("should escape ampersand", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("should escape less-than", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
  });

  it("should escape greater-than", () => {
    expect(escapeHtml("> test")).toBe("&gt; test");
  });

  it("should escape double quotes", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("should escape single quotes", () => {
    expect(escapeHtml("'hello'")).toBe("&#x27;hello&#x27;");
  });

  it("should escape forward slashes", () => {
    expect(escapeHtml("path/to/file")).toBe("path&#x2F;to&#x2F;file");
  });

  it("should escape multiple entities", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;"
    );
  });

  it("should handle empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("should handle string with no special characters", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

describe("sanitizeValue", () => {
  it("should trim and escape strings", () => {
    expect(sanitizeValue("  <b>test</b>  ")).toBe("&lt;b&gt;test&lt;&#x2F;b&gt;");
  });

  it("should preserve numbers", () => {
    expect(sanitizeValue(42)).toBe(42);
  });

  it("should preserve booleans", () => {
    expect(sanitizeValue(true)).toBe(true);
    expect(sanitizeValue(false)).toBe(false);
  });

  it("should preserve null", () => {
    expect(sanitizeValue(null)).toBe(null);
  });

  it("should preserve undefined", () => {
    expect(sanitizeValue(undefined)).toBe(undefined);
  });

  it("should sanitize strings in arrays", () => {
    const input = ["<script>", "normal", "&amp;"];
    const expected = ["&lt;script&gt;", "normal", "&amp;amp;"];
    expect(sanitizeValue(input)).toEqual(expected);
  });

  it("should sanitize nested objects", () => {
    const input = {
      name: "<b>test</b>",
      age: 25,
    };
    const expected = {
      name: "&lt;b&gt;test&lt;&#x2F;b&gt;",
      age: 25,
    };
    expect(sanitizeValue(input)).toEqual(expected);
  });

  it("should handle mixed arrays", () => {
    const input = ["<script>", 42, true, null];
    const expected = ["&lt;script&gt;", 42, true, null];
    expect(sanitizeValue(input)).toEqual(expected);
  });
});

describe("sanitizePayload", () => {
  it("should sanitize all string values in an object", () => {
    const input = {
      teamName: '<img src=x onerror=alert(1)>',
      description: "Normal text",
      count: 5,
    };
    const result = sanitizePayload(input);

    expect(result.teamName).toBe(
      "&lt;img src=x onerror=alert(1)&gt;"
    );
    expect(result.description).toBe("Normal text");
    expect(result.count).toBe(5);
  });

  it("should handle nested objects", () => {
    const input = {
      user: {
        name: '<script>alert("xss")</script>',
        bio: "Safe bio",
      },
    };
    const result = sanitizePayload(input);
    const user = result.user as Record<string, unknown>;

    expect(user.name).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;"
    );
    expect(user.bio).toBe("Safe bio");
  });

  it("should handle arrays of objects", () => {
    const input = {
      items: [
        { name: "<b>Item 1</b>" },
        { name: "Item 2" },
      ],
    };
    const result = sanitizePayload(input);
    const items = result.items as Array<Record<string, unknown>>;

    expect(items[0]!.name).toBe("&lt;b&gt;Item 1&lt;&#x2F;b&gt;");
    expect(items[1]!.name).toBe("Item 2");
  });

  it("should handle empty object", () => {
    expect(sanitizePayload({})).toEqual({});
  });

  it("should handle object with all non-string values", () => {
    const input = {
      count: 42,
      active: true,
      data: null,
    };
    expect(sanitizePayload(input)).toEqual(input);
  });

  it("should prevent XSS in various formats", () => {
    const maliciousPayloads = [
      { field: '<script>alert("xss")</script>' },
      { field: 'javascript:alert(1)' },
      { field: '<img src=x onerror=alert(1)>' },
      { field: '"><script>alert(1)</script>' },
      { field: "';alert(1)//" },
    ];

    for (const payload of maliciousPayloads) {
      const result = sanitizePayload(payload);
      // Verify that HTML tags are escaped (prevents XSS)
      expect(result.field).not.toContain("<script>");
      expect(result.field).not.toContain("</script>");
      expect(result.field).not.toContain("<img");
      // Verify that dangerous schemes are blocked
      expect(result.field).not.toContain("javascript:alert(1)");
    }
  });
});
