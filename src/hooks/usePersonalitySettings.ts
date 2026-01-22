import { useState, useEffect } from "react";

export type ToneLevel = 1 | 2 | 3 | 4 | 5;

export interface PersonalitySettings {
  playfulness: ToneLevel; // 1 = serious, 5 = very playful
  affection: ToneLevel; // 1 = friendly, 5 = very affectionate
  formality: ToneLevel; // 1 = casual, 5 = formal
  enthusiasm: ToneLevel; // 1 = calm, 5 = very enthusiastic
  humor: ToneLevel; // 1 = serious, 5 = very humorous
}

const DEFAULT_SETTINGS: PersonalitySettings = {
  playfulness: 4,
  affection: 4,
  formality: 2,
  enthusiasm: 4,
  humor: 4,
};

export const PERSONALITY_LABELS = {
  playfulness: {
    name: "Playfulness",
    low: "Serious",
    high: "Playful",
    emoji: "🎭",
  },
  affection: {
    name: "Affection",
    low: "Friendly",
    high: "Affectionate",
    emoji: "💕",
  },
  formality: {
    name: "Formality",
    low: "Casual",
    high: "Formal",
    emoji: "🎩",
  },
  enthusiasm: {
    name: "Enthusiasm",
    low: "Calm",
    high: "Energetic",
    emoji: "✨",
  },
  humor: {
    name: "Humor",
    low: "Serious",
    high: "Humorous",
    emoji: "😄",
  },
};

export const usePersonalitySettings = () => {
  const [settings, setSettings] = useState<PersonalitySettings>(() => {
    const saved = localStorage.getItem("personality-settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("personality-settings", JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof PersonalitySettings, value: ToneLevel) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  // Generate a personality summary for the AI
  const getPersonalitySummary = (): string => {
    const traits: string[] = [];

    if (settings.playfulness >= 4) traits.push("playful and teasing");
    else if (settings.playfulness <= 2) traits.push("serious and thoughtful");

    if (settings.affection >= 4) traits.push("very affectionate and caring");
    else if (settings.affection <= 2) traits.push("friendly but reserved");

    if (settings.formality >= 4) traits.push("polite and formal");
    else if (settings.formality <= 2) traits.push("casual and relaxed");

    if (settings.enthusiasm >= 4) traits.push("enthusiastic and energetic");
    else if (settings.enthusiasm <= 2) traits.push("calm and composed");

    if (settings.humor >= 4) traits.push("witty with lots of humor");
    else if (settings.humor <= 2) traits.push("straightforward without much joking");

    return traits.length > 0 ? traits.join(", ") : "balanced and adaptable";
  };

  return {
    settings,
    updateSetting,
    resetSettings,
    getPersonalitySummary,
  };
};
