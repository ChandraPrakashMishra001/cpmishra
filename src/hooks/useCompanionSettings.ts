import { useState, useEffect } from "react";

export interface CompanionSettings {
  name: string;
  avatarUrl: string | null;
}

const DEFAULT_SETTINGS: CompanionSettings = {
  name: "Amanai",
  avatarUrl: null, // null means use default
};

export const useCompanionSettings = () => {
  const [settings, setSettings] = useState<CompanionSettings>(() => {
    const saved = localStorage.getItem("companion-settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("companion-settings", JSON.stringify(settings));
  }, [settings]);

  const updateName = (name: string) => {
    setSettings((prev) => ({ ...prev, name: name.trim() || "Amanai" }));
  };

  const updateAvatar = (avatarUrl: string | null) => {
    setSettings((prev) => ({ ...prev, avatarUrl }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateName,
    updateAvatar,
    resetSettings,
  };
};
