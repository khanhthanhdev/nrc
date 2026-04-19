import { describe, expect, it } from "vitest";
import * as v from "valibot";

import { createTeamInputSchema } from "./team";

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
