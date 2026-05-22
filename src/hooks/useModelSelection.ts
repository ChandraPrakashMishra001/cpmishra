import { useState, useCallback } from "react";

export type AIModel = "auto" | "gemini3-flash" | "gemini35-flash" | "gemini31-pro" | "gemini25-pro" | "gpt5";

export interface ModelInfo {
  id: AIModel;
  label: string;
  description: string;
  apiModel: string;
}

export const AI_MODELS: ModelInfo[] = [
  { id: "auto", label: "Auto", description: "Smart routing per query", apiModel: "auto" },
  { id: "gemini3-flash", label: "G3 Flash", description: "Fast & balanced", apiModel: "google/gemini-3-flash-preview" },
  { id: "gemini31-pro", label: "G3.1 Pro", description: "Deep reasoning (Gemini)", apiModel: "google/gemini-3.1-pro-preview" },
  { id: "gemini25-pro", label: "G2.5 Pro", description: "Big context multimodal", apiModel: "google/gemini-2.5-pro" },
  { id: "gpt5", label: "GPT-5", description: "Top-tier all-rounder", apiModel: "openai/gpt-5" },
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
