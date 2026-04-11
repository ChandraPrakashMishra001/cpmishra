import { useState, useCallback } from "react";

export type AIModel = "auto" | "flash" | "flash-lite" | "pro" | "gpt5-mini";

export interface ModelInfo {
  id: AIModel;
  label: string;
  description: string;
  apiModel: string;
}

export const AI_MODELS: ModelInfo[] = [
  { id: "auto", label: "Auto", description: "Best model for each query", apiModel: "auto" },
  { id: "flash", label: "Flash", description: "Fast & balanced", apiModel: "google/gemini-3-flash-preview" },
  { id: "flash-lite", label: "Lite", description: "Fastest, simple tasks", apiModel: "google/gemini-2.5-flash-lite" },
  { id: "pro", label: "Pro", description: "Complex reasoning", apiModel: "google/gemini-2.5-pro" },
  { id: "gpt5-mini", label: "GPT5", description: "Strong all-rounder", apiModel: "openai/gpt-5-mini" },
];

export const useModelSelection = () => {
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    const saved = localStorage.getItem("amanai-model");
    return (saved as AIModel) || "auto";
  });

  const changeModel = useCallback((model: AIModel) => {
    setSelectedModel(model);
    localStorage.setItem("amanai-model", model);
  }, []);

  const getModelInfo = useCallback(() => {
    return AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];
  }, [selectedModel]);

  return { selectedModel, changeModel, getModelInfo, models: AI_MODELS };
};
