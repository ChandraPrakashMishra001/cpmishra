import { useState, useCallback } from "react";

export type AIModel = "auto" | "gemini3-flash" | "gemini3-pro" | "gemini31-pro";

export interface ModelInfo {
  id: AIModel;
  label: string;
  description: string;
  apiModel: string;
}

export const AI_MODELS: ModelInfo[] = [
  { id: "auto", label: "Auto", description: "Best model for each query", apiModel: "auto" },
  { id: "gemini3-flash", label: "Flash 3", description: "Fast & balanced", apiModel: "google/gemini-3-flash-preview" },
  { id: "gemini3-pro", label: "Pro 3", description: "Image generation", apiModel: "google/gemini-3-pro-image-preview" },
  { id: "gemini31-pro", label: "Pro 3.1", description: "Latest reasoning", apiModel: "google/gemini-3.1-pro-preview" },
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
