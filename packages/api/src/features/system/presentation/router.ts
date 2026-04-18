import { publicProcedure } from "../../../shared/procedure.js";

export const systemRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
};
