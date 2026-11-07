import "server-only";
import { GenerationRequestSchema, type GenerationPort } from "@sfa/contracts";

export const fixtureGeneration: GenerationPort = {
  async generate(input) {
    GenerationRequestSchema.parse(input);
    return { status: "unavailable", reason: "FIXTURE_ONLY_NO_GENERATION" };
  },
};
