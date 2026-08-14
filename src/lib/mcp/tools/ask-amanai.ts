import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { askAmanai } from "../ai";

export default defineTool({
  name: "ask_amanai",
  title: "Ask Amanai",
  description:
    "Ask Amanai, the BloomSense master botanist, any agronomy, crop, plant-health or general-knowledge question and get an expert answer.",
  inputSchema: {
    question: z.string().trim().min(1).describe("The question to ask Amanai."),
    deep_reasoning: z
      .boolean()
      .optional()
      .describe("Set true for complex analysis that needs the slower, deeper reasoning model."),
    language: z
      .enum(["en", "hi", "od"])
      .optional()
      .describe("Answer language: en (English), hi (Hindi), od (Odia). Defaults to English."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ question, deep_reasoning, language }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated.");
    const langExtra =
      language === "hi"
        ? "Respond entirely in Hindi (Devanagari); keep technical terms in English."
        : language === "od"
          ? "Respond entirely in Odia (ଓଡ଼ିଆ); keep technical terms in English."
          : undefined;
    try {
      const answer = await askAmanai(question, { deep: deep_reasoning === true, systemExtra: langExtra });
      return { content: [{ type: "text", text: answer }] };
    } catch (error) {
      throw new ToolError(error instanceof Error ? error.message : "Amanai could not answer that.");
    }
  },
});
