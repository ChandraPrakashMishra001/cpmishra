import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { diseases } from "@/data/diseases";

export default defineTool({
  name: "search_disease_library",
  title: "Search disease library",
  description:
    "Search the BloomSense plant disease library by disease name, Hindi name or crop, and return symptoms, cause, treatment and prevention.",
  inputSchema: {
    query: z
      .string()
      .trim()
      .optional()
      .describe("Disease name, Hindi name or crop to search for. Omit to list the whole library."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated.");
    const q = (query ?? "").toLowerCase();
    const results = diseases.filter(
      (d) =>
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.hindiName.includes(query ?? "") ||
        d.crops.some((c) => c.toLowerCase().includes(q)),
    );

    if (results.length === 0) {
      return { content: [{ type: "text", text: `No disease in the library matches "${query}".` }] };
    }

    const text = results
      .map(
        (d) =>
          `## ${d.name} (${d.hindiName})\nSeverity: ${d.severity}\nCrops: ${d.crops.join(", ")}\nSymptoms: ${d.symptoms}\nCause: ${d.cause}\nTreatment: ${d.treatment}\nPrevention: ${d.prevention}`,
      )
      .join("\n\n");

    return { content: [{ type: "text", text }], structuredContent: { count: results.length, diseases: results } };
  },
});
