import { useState, useCallback, useEffect } from "react";

export type AIModel = "auto" | "gemini35-flash" | "gemini31-pro";

export interface ModelInfo {
  id: AIModel;
  label: string;
  description: string;
  apiModel: string;
}

export const AI_MODELS: ModelInfo[] = [
  { id: "auto", label: "Auto", description: "Smart routing per query", apiModel: "auto" },
  { id: "gemini35-flash", label: "G3.5 Flash", description: "Fast everyday responses", apiModel: "google/gemini-3.5-flash" },
  { id: "gemini31-pro", label: "G3.1 Pro", description: "Deep reasoning", apiModel: "google/gemini-3.1-pro-preview" },
];

export const useModelSelection = () => {
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    const saved = localStorage.getItem("amanai-model");
    if (saved && AI_MODELS.some(m => m.id === saved)) return saved as AIModel;
    return "auto";
  });

  // Migrate any old model IDs to valid ones
  useEffect(() => {
    if (!AI_MODELS.some(m => m.id === selectedModel)) {
      setSelectedModel("auto");
      localStorage.setItem("amanai-model", "auto");
    }
  }, [selectedModel]);

  const changeModel = useCallback((model: AIModel) => {
    setSelectedModel(model);
    localStorage.setItem("amanai-model", model);
  }, []);

  const getModelInfo = useCallback(() => {
    return AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];
  }, [selectedModel]);

  return { selectedModel, changeModel, getModelInfo, models: AI_MODELS };
};
