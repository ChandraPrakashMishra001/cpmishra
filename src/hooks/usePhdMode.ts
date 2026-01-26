import { useState, useEffect } from "react";

export const usePhdMode = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("phd-mode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("phd-mode", JSON.stringify(isEnabled));
  }, [isEnabled]);

  const toggle = () => setIsEnabled((prev) => !prev);

  return {
    isEnabled,
    setIsEnabled,
    toggle,
  };
};
