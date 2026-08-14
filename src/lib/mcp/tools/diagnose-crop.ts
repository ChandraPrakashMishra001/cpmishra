import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { askAmanai } from "../ai";

export default defineTool({
  name: "diagnose_crop",
  title: "Diagnose crop",
  description:
    "Get a structured BloomSense diagnosis (identity, health, diagnosis, action, prevention, utility) for a crop from described symptoms.",
  inputSchema: {
    crop: z.string().trim().min(1).describe("Crop or plant name, e.g. 'tomato', 'paddy'."),
    symptoms: z.string().trim().min(1).describe("Observed symptoms, as detailed as possible."),
    location: z.string().trim().optional().describe("Region or district, for climate-aware advice."),
    growth_stage: z.string().trim().optional().describe("Crop growth stage, e.g. 'flowering', 'seedling'."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ crop, symptoms, location, growth_stage }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated.");
    const prompt = [
      `Crop: ${crop}`,
      `Symptoms: ${symptoms}`,
      location ? `Location: ${location}` : null,
      growth_stage ? `Growth stage: ${growth_stage}` : null,
      "Give the compact BloomSense diagnostic block, then two short lines of practical field notes.",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      const answer = await askAmanai(prompt, { deep: true });
      return { content: [{ type: "text", text: answer }] };
    } catch (error) {
      throw new ToolError(error instanceof Error ? error.message : "Diagnosis failed.");
    }
  },
});
