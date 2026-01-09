import { useState, useEffect } from "react";

type Theme = "day" | "night";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("lia-theme");
    return (saved as Theme) || "day";
  });

  useEffect(() => {
    localStorage.setItem("lia-theme", theme);
    
    // Apply theme class to document
    if (theme === "night") {
      document.documentElement.classList.add("dark-sky");
    } else {
      document.documentElement.classList.remove("dark-sky");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "day" ? "night" : "day"));
  };

  return { theme, toggleTheme, isNight: theme === "night" };
};
