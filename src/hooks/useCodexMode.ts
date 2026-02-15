import { useState, useEffect } from "react";

export const useCodexMode = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("codex-mode");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("codex-mode", String(isEnabled));
  }, [isEnabled]);

  const toggle = () => setIsEnabled((prev) => !prev);

  return { isEnabled, toggle };
};
