import { describe, expect, it } from "vitest";
import * as v from "valibot";

import {
  addRegistrationCommentInputSchema,
  createRegistrationInputSchema,
  getEventRegistrationFormInputSchema,
  getRegistrationInputSchema,
  getTeamEventRegistrationStatusInputSchema,
  listAdminRegistrationsByEventInputSchema,
  listPublicEventsInputSchema,
  listRegistrationReviewActionsInputSchema,
  listTeamRegistrationsInputSchema,
  reviewRegistrationInputSchema,
  submitRegistrationInputSchema,
  updateRegistrationRevisionInputSchema,
  withdrawRegistrationInputSchema,
} from "./registration.js";

describe("createRegistrationInputSchema", () => {
  it("accepts valid input", () => {
    expect(
      v.safeParse(createRegistrationInputSchema, {
        eventId: "event-1",
        payload: { teamSize: 5 },
        teamId: "team-1",
      }).success,
    ).toBe(true);
  });

  it("sanitizes form payload strings", () => {
    const result = v.parse(createRegistrationInputSchema, {
      eventId: "event-1",
      payload: {
        website: "javascript:alert(1)",
        teamName: "<script>alert(1)</script>",
      },
      teamId: "team-1",
    });

    expect(result.payload.teamName).toBe("&lt;script&gt;alert(1)&lt;&#x2F;script&gt;");
    expect(result.payload.website).toBe("[BLOCKED: DANGEROUS_SCHEME]");
  });

  it("rejects blank eventId", () => {
    expect(
      v.safeParse(createRegistrationInputSchema, {
        eventId: "   ",
        payload: { teamSize: 5 },
        teamId: "team-1",
      }).success,
    ).toBe(false);
  });

  it("rejects blank teamId", () => {
    expect(
      v.safeParse(createRegistrationInputSchema, {
        eventId: "event-1",
        payload: { teamSize: 5 },
        teamId: "   ",
      }).success,
    ).toBe(false);
  });

  it("rejects array payload", () => {
    expect(
      v.safeParse(createRegistrationInputSchema, {
        eventId: "event-1",
        payload: [],
        teamId: "team-1",
      }).success,
    ).toBe(false);
  });

  it("rejects null payload", () => {
    expect(
      v.safeParse(createRegistrationInputSchema, {
        eventId: "event-1",
        payload: null,
        teamId: "team-1",
      }).success,
    ).toBe(false);
  });

  it("rejects primitive payload", () => {
    expect(
      v.safeParse(createRegistrationInputSchema, {
        eventId: "event-1",
        payload: "string",
        teamId: "team-1",
      }).success,
    ).toBe(false);
  });
});

describe("getRegistrationInputSchema", () => {
  it("accepts valid registrationId", () => {
    expect(v.safeParse(getRegistrationInputSchema, {
      registrationId: "reg-1",
    }).success).toBe(true);
  });

  it("trims registrationId", () => {
    const result = v.parse(getRegistrationInputSchema, {
      registrationId: "  reg-1  ",
    });
    expect(result.registrationId).toBe("reg-1");
  });

  it("rejects blank registrationId", () => {
    expect(v.safeParse(getRegistrationInputSchema, {
      registrationId: "   ",
    }).success).toBe(false);
  });
});

describe("listTeamRegistrationsInputSchema", () => {
  it("accepts valid teamId", () => {
    expect(v.safeParse(listTeamRegistrationsInputSchema, {
      teamId: "team-1",
    }).success).toBe(true);
  });

  it("rejects blank teamId", () => {
    expect(v.safeParse(listTeamRegistrationsInputSchema, {
      teamId: "   ",
    }).success).toBe(false);
  });
});

describe("submitRegistrationInputSchema", () => {
  it("accepts valid registrationId", () => {
    expect(v.safeParse(submitRegistrationInputSchema, {
      registrationId: "reg-1",
    }).success).toBe(true);
  });

  it("rejects blank registrationId", () => {
    expect(v.safeParse(submitRegistrationInputSchema, {
      registrationId: "   ",
    }).success).toBe(false);
  });
});

describe("updateRegistrationRevisionInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(updateRegistrationRevisionInputSchema, {
      expectedRevisionNumber: 1,
      payload: { teamSize: 6 },
      registrationId: "reg-1",
    }).success).toBe(true);
  });

  it("rejects array payload", () => {
    expect(v.safeParse(updateRegistrationRevisionInputSchema, {
      expectedRevisionNumber: 1,
      payload: [],
      registrationId: "reg-1",
    }).success).toBe(false);
  });

  it("rejects blank registrationId", () => {
    expect(v.safeParse(updateRegistrationRevisionInputSchema, {
      expectedRevisionNumber: 1,
      payload: { key: "value" },
      registrationId: "   ",
    }).success).toBe(false);
  });

  it("rejects stale or invalid revision version", () => {
    expect(v.safeParse(updateRegistrationRevisionInputSchema, {
      expectedRevisionNumber: -1,
      payload: { key: "value" },
      registrationId: "reg-1",
    }).success).toBe(false);
  });
});

describe("withdrawRegistrationInputSchema", () => {
  it("accepts valid registrationId", () => {
    expect(v.safeParse(withdrawRegistrationInputSchema, {
      registrationId: "reg-1",
    }).success).toBe(true);
  });

  it("rejects blank registrationId", () => {
    expect(v.safeParse(withdrawRegistrationInputSchema, {
      registrationId: "   ",
    }).success).toBe(false);
  });
});

describe("listRegistrationReviewActionsInputSchema", () => {
  it("accepts valid registrationId", () => {
    expect(v.safeParse(listRegistrationReviewActionsInputSchema, {
      registrationId: "reg-1",
    }).success).toBe(true);
  });

  it("rejects blank registrationId", () => {
    expect(v.safeParse(listRegistrationReviewActionsInputSchema, {
      registrationId: "   ",
    }).success).toBe(false);
  });
});

describe("listAdminRegistrationsByEventInputSchema", () => {
  it("accepts valid eventId", () => {
    expect(v.safeParse(listAdminRegistrationsByEventInputSchema, {
      eventId: "event-1",
    }).success).toBe(true);
  });

  it("accepts eventId with status filter", () => {
    expect(v.safeParse(listAdminRegistrationsByEventInputSchema, {
      eventId: "event-1",
      status: "submitted",
    }).success).toBe(true);
  });

  it("accepts all valid statuses", () => {
    const statuses = ["draft", "submitted", "under_review", "needs_revision", "approved", "denied", "withdrawn"];
    for (const status of statuses) {
      expect(v.safeParse(listAdminRegistrationsByEventInputSchema, {
        eventId: "event-1",
        status,
      }).success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    expect(v.safeParse(listAdminRegistrationsByEventInputSchema, {
      eventId: "event-1",
      status: "pending",
    }).success).toBe(false);
  });

  it("defaults status to undefined", () => {
    const result = v.parse(listAdminRegistrationsByEventInputSchema, {
      eventId: "event-1",
    });
    expect(result.status).toBeUndefined();
  });
});

describe("reviewRegistrationInputSchema", () => {
  it("accepts approve action", () => {
    expect(v.safeParse(reviewRegistrationInputSchema, {
      action: "approve",
      registrationId: "reg-1",
    }).success).toBe(true);
  });

  it("accepts deny action with comment", () => {
    expect(v.safeParse(reviewRegistrationInputSchema, {
      action: "deny",
      comment: "Missing information",
      registrationId: "reg-1",
    }).success).toBe(true);
  });

  it("accepts request_changes action", () => {
    expect(v.safeParse(reviewRegistrationInputSchema, {
      action: "request_changes",
      comment: "Please update team size",
      registrationId: "reg-1",
    }).success).toBe(true);
  });

  it("rejects invalid action", () => {
    expect(v.safeParse(reviewRegistrationInputSchema, {
      action: "reject",
      registrationId: "reg-1",
    }).success).toBe(false);
  });

  it("rejects comment exceeding 4000 chars", () => {
    expect(v.safeParse(reviewRegistrationInputSchema, {
      action: "approve",
      comment: "a".repeat(4001),
      registrationId: "reg-1",
    }).success).toBe(false);
  });

  it("rejects blank registrationId", () => {
    expect(v.safeParse(reviewRegistrationInputSchema, {
      action: "approve",
      registrationId: "   ",
    }).success).toBe(false);
  });
});

describe("addRegistrationCommentInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(addRegistrationCommentInputSchema, {
      comment: "Looks good, approved!",
      registrationId: "reg-1",
    }).success).toBe(true);
  });

  it("accepts input with isVisibleToTeam", () => {
    expect(v.safeParse(addRegistrationCommentInputSchema, {
      comment: "Internal note",
      isVisibleToTeam: false,
      registrationId: "reg-1",
    }).success).toBe(true);
  });

  it("defaults isVisibleToTeam to true", () => {
    const result = v.parse(addRegistrationCommentInputSchema, {
      comment: "Test comment",
      registrationId: "reg-1",
    });
    expect(result.isVisibleToTeam).toBe(true);
  });

  it("rejects blank comment", () => {
    expect(v.safeParse(addRegistrationCommentInputSchema, {
      comment: "   ",
      registrationId: "reg-1",
    }).success).toBe(false);
  });

  it("rejects comment exceeding 4000 chars", () => {
    expect(v.safeParse(addRegistrationCommentInputSchema, {
      comment: "a".repeat(4001),
      registrationId: "reg-1",
    }).success).toBe(false);
  });
});

describe("getEventRegistrationFormInputSchema", () => {
  it("accepts valid eventId", () => {
    expect(v.safeParse(getEventRegistrationFormInputSchema, {
      eventId: "event-1",
    }).success).toBe(true);
  });

  it("rejects blank eventId", () => {
    expect(v.safeParse(getEventRegistrationFormInputSchema, {
      eventId: "   ",
    }).success).toBe(false);
  });
});

describe("getTeamEventRegistrationStatusInputSchema", () => {
  it("accepts valid input", () => {
    expect(v.safeParse(getTeamEventRegistrationStatusInputSchema, {
      eventId: "event-1",
      teamId: "team-1",
    }).success).toBe(true);
  });

  it("rejects blank eventId", () => {
    expect(v.safeParse(getTeamEventRegistrationStatusInputSchema, {
      eventId: "   ",
      teamId: "team-1",
    }).success).toBe(false);
  });

  it("rejects blank teamId", () => {
    expect(v.safeParse(getTeamEventRegistrationStatusInputSchema, {
      eventId: "event-1",
      teamId: "   ",
    }).success).toBe(false);
  });
});

describe("listPublicEventsInputSchema", () => {
  it("accepts undefined input with defaults", () => {
    const result = v.parse(listPublicEventsInputSchema, undefined);
    expect(result.limit).toBe(20);
    expect(result.page).toBe(1);
  });

  it("accepts empty object with defaults", () => {
    const result = v.parse(listPublicEventsInputSchema, {});
    expect(result.limit).toBe(20);
    expect(result.page).toBe(1);
  });

  it("accepts all optional fields", () => {
    const result = v.parse(listPublicEventsInputSchema, {
      limit: 10,
      page: 2,
      season: "2026",
      status: "registration_open",
    });
    expect(result.limit).toBe(10);
    expect(result.page).toBe(2);
    expect(result.season).toBe("2026");
    expect(result.status).toBe("registration_open");
  });

  it("rejects limit over 100", () => {
    expect(v.safeParse(listPublicEventsInputSchema, { limit: 101 }).success).toBe(false);
  });

  it("rejects limit less than 1", () => {
    expect(v.safeParse(listPublicEventsInputSchema, { limit: 0 }).success).toBe(false);
  });

  it("rejects page less than 1", () => {
    expect(v.safeParse(listPublicEventsInputSchema, { page: 0 }).success).toBe(false);
  });

  it("rejects invalid season format", () => {
    expect(v.safeParse(listPublicEventsInputSchema, { season: "26" }).success).toBe(false);
  });

  it("rejects invalid status", () => {
    expect(v.safeParse(listPublicEventsInputSchema, { status: "draft" }).success).toBe(false);
  });

  it("accepts all valid public statuses", () => {
    const statuses = ["published", "registration_open", "registration_closed", "active", "completed", "archived"];
    for (const status of statuses) {
      expect(v.safeParse(listPublicEventsInputSchema, { status }).success).toBe(true);
    }
  });
});
