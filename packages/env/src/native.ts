import { createEnv } from "@t3-oss/env-core";
import * as v from "valibot";

export const env = createEnv({
  client: {
    EXPO_PUBLIC_SERVER_URL: v.pipe(v.string(), v.url()),
  },
  clientPrefix: "EXPO_PUBLIC_",
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
});
