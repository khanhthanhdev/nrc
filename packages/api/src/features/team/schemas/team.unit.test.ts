import { describe, expect, it } from "vitest";
import * as v from "valibot";

import { createTeamInputSchema, getPublicTeamInputSchema } from "./team";

const validInput = {
  cityOrProvince: "Da Nang",
  description: "Rookie robotics team",
  name: "NRC Alpha",
  schoolOrOrganization: "NRC School",
  termsAccepted: true as const,
};

describe("createTeamInputSchema", () => {
  it("accepts valid team creation input", () => {
    const result = v.safeParse(createTeamInputSchema, validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with optional fields omitted", () => {
    const result = v.safeParse(createTeamInputSchema, {
      name: "NRC Alpha",
      termsAccepted: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects team creation when termsAccepted is false", () => {
    const result = v.safeParse(createTeamInputSchema, {
      ...validInput,
      termsAccepted: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects names shorter than 2 characters", () => {
    const result = v.safeParse(createTeamInputSchema, {
      ...validInput,
      name: "A",
    });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only fields after trim", () => {
    const result = v.safeParse(createTeamInputSchema, {
      ...validInput,
      cityOrProvince: "   ",
      name: "   ",
      schoolOrOrganization: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects descriptions longer than 2000 characters", () => {
    const result = v.safeParse(createTeamInputSchema, {
      ...validInput,
      description: "A".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("getPublicTeamInputSchema", () => {
  it("accepts a five-digit team number", () => {
    const result = v.safeParse(getPublicTeamInputSchema, {
      teamNumber: "02323",
    });

    expect(result.success).toBe(true);
  });

  it("rejects team numbers that contain non-digit characters", () => {
    const result = v.safeParse(getPublicTeamInputSchema, {
      teamNumber: "12A45",
    });

    expect(result.success).toBe(false);
  });

  it("rejects team numbers that are not exactly five digits", () => {
    const tooShort = v.safeParse(getPublicTeamInputSchema, {
      teamNumber: "1234",
    });
    const tooLong = v.safeParse(getPublicTeamInputSchema, {
      teamNumber: "123456",
    });

    expect(tooShort.success).toBe(false);
    expect(tooLong.success).toBe(false);
  });
});
