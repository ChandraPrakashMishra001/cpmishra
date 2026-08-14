import { auth, defineMcp } from "@lovable.dev/mcp-js";
import askAmanaiTool from "./tools/ask-amanai";
import diagnoseCropTool from "./tools/diagnose-crop";
import searchDiseaseLibraryTool from "./tools/search-disease-library";
import listFieldLogsTool from "./tools/list-field-logs";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "amania-bloomsense",
  title: "Amania bloomsense",
  version: "0.1.0",
  instructions:
    "Tools for Amanai, the BloomSense master botanist. Use `ask_amanai` for any agronomy or general question, `diagnose_crop` for a structured crop diagnosis, `search_disease_library` to look up Indian crop diseases with treatments, and `list_field_logs` to read the signed-in farmer's saved field history.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [askAmanaiTool, diagnoseCropTool, searchDiseaseLibraryTool, listFieldLogsTool],
});
