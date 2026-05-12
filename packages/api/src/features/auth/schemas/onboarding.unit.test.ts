import { describe, expect, it } from "vitest";
import * as v from "valibot";

import {
  completeOnboardingInputSchema,
} from "./onboarding.js";
import { VIETNAM_34_CITIES } from "../contracts/vietnam-cities.js";

describe("completeOnboardingInputSchema", () => {
  const validInput = {
    address: "225 Le Loi",
    city: VIETNAM_34_CITIES[0],
    dateOfBirth: "2001-09-20",
    organizationOrSchool: "NRC University",
    phone: "0909000000",
  };

  it("accepts valid input", () => {
    expect(v.safeParse(completeOnboardingInputSchema, validInput).success).toBe(true);
  });

  it("accepts first city in list", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      city: VIETNAM_34_CITIES[0],
    }).success).toBe(true);
  });

  it("accepts last city in list", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      city: VIETNAM_34_CITIES[33],
    }).success).toBe(true);
  });

  it("rejects city not in list", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      city: "Tỉnh Không Tồn Tại",
    }).success).toBe(false);
  });

  it("rejects date format DD-MM-YYYY", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      dateOfBirth: "20-09-2001",
    }).success).toBe(false);
  });

  it("rejects date format MM/DD/YYYY", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      dateOfBirth: "09/20/2001",
    }).success).toBe(false);
  });

  it("rejects date with only year", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      dateOfBirth: "2001",
    }).success).toBe(false);
  });

  it("trims string fields", () => {
    const result = v.parse(completeOnboardingInputSchema, {
      ...validInput,
      address: "  225 Le Loi  ",
      organizationOrSchool: "  NRC University  ",
      phone: "  0909000000  ",
    });
    expect(result.address).toBe("225 Le Loi");
    expect(result.organizationOrSchool).toBe("NRC University");
    expect(result.phone).toBe("0909000000");
  });

  it("rejects blank address after trim", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      address: "   ",
    }).success).toBe(false);
  });

  it("rejects blank organizationOrSchool after trim", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      organizationOrSchool: "   ",
    }).success).toBe(false);
  });

  it("rejects blank phone after trim", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      phone: "   ",
    }).success).toBe(false);
  });

  it("rejects address exceeding 255 chars", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      address: "A".repeat(256),
    }).success).toBe(false);
  });

  it("accepts address at 255 chars", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      address: "A".repeat(255),
    }).success).toBe(true);
  });

  it("rejects organizationOrSchool exceeding 255 chars", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      organizationOrSchool: "A".repeat(256),
    }).success).toBe(false);
  });

  it("rejects phone exceeding 30 chars", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      phone: "0".repeat(31),
    }).success).toBe(false);
  });

  it("accepts phone at 30 chars", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      phone: "0".repeat(30),
    }).success).toBe(true);
  });

  it("rejects missing fields", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {}).success).toBe(false);
    expect(v.safeParse(completeOnboardingInputSchema, { address: "test" }).success).toBe(false);
  });

  it("rejects empty string fields", () => {
    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      address: "",
    }).success).toBe(false);

    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      organizationOrSchool: "",
    }).success).toBe(false);

    expect(v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      phone: "",
    }).success).toBe(false);
  });
});
