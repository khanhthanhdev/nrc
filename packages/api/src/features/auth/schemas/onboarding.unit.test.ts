import { describe, expect, it } from "vitest";
import * as v from "valibot";

import { VIETNAM_34_CITIES } from "../contracts/vietnam-cities";
import { completeOnboardingInputSchema } from "./onboarding";

const validInput = {
  address: "123 Nguyen Trai",
  city: VIETNAM_34_CITIES[0],
  dateOfBirth: "2001-09-20",
  organizationOrSchool: "NRC University",
  phone: "0909000000",
};

describe("completeOnboardingInputSchema", () => {
  it("accepts valid onboarding input", () => {
    const result = v.safeParse(completeOnboardingInputSchema, validInput);
    expect(result.success).toBe(true);
  });

  it("rejects city values outside the canonical 34-city list", () => {
    const result = v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      city: "Tỉnh Không Tồn Tại",
    });
    expect(result.success).toBe(false);
  });

  it("rejects date format outside YYYY-MM-DD", () => {
    const result = v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      dateOfBirth: "20-09-2001",
    });
    expect(result.success).toBe(false);
  });

  it("rejects required string fields that are blank after trim", () => {
    const result = v.safeParse(completeOnboardingInputSchema, {
      ...validInput,
      address: "   ",
      organizationOrSchool: "   ",
      phone: "   ",
    });
    expect(result.success).toBe(false);
  });
});
