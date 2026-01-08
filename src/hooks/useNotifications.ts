import { useState, useCallback, useEffect } from "react";
import { Goal } from "./useGoals";

const NOTIFICATIONS_KEY = "lia-notifications-settings";

interface NotificationSettings {
  enabled: boolean;
  goalReminders: boolean;
  motivationalMessages: boolean;
  reminderTime: string; // HH:mm format
}

const defaultSettings: NotificationSettings = {
  enabled: false,
  goalReminders: true,
  motivationalMessages: true,
  reminderTime: "09:00",
};

const motivationalMessages = [
  "Hey! Just checking in 💖 How are you doing today?",
  "Remember, small steps lead to big achievements! Keep going! ✨",
  "You've got this! I believe in you! 🌸",
  "Time for a quick break? Don't forget to take care of yourself! 💕",
  "Every day is a new opportunity to grow! 🌱",
  "Just wanted to remind you how amazing you are! 💖",
  "Keep pushing forward! You're making progress even when you can't see it! ⭐",
  "Hey friend! Hope you're having a wonderful day! 🌟",
];

export const useNotifications = () => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(settings));
  }, [settings]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") {
      console.log("Notifications not supported");
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === "granted") {
      setSettings(prev => ({ ...prev, enabled: true }));
      // Show a test notification
      showNotification("Notifications Enabled! 🎉", "Lia will now send you reminders and motivational messages!");
      return true;
    }
    return false;
  }, []);

  const showNotification = useCallback((title: string, body: string, tag?: string) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: "/lia-icon-192.png",
      badge: "/lia-icon-192.png",
      tag: tag || `lia-${Date.now()}`,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }, []);

  const sendGoalReminder = useCallback((goal: Goal) => {
    if (!settings.enabled || !settings.goalReminders) return;
    
    const messages = [
      `Don't forget about "${goal.title}"! You're at ${goal.progress}% 💪`,
      `Time to work on "${goal.title}"! Every step counts! ✨`,
      `"${goal.title}" is waiting for you! You've got this! 🌸`,
      `Quick reminder: "${goal.title}" - ${100 - goal.progress}% to go! 🎯`,
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    showNotification(`Lia - Goal Reminder 🎯`, message, `goal-${goal.id}`);
  }, [settings.enabled, settings.goalReminders, showNotification]);

  const sendMotivationalMessage = useCallback(() => {
    if (!settings.enabled || !settings.motivationalMessages) return;
    
    const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    showNotification(`Lia says... 💖`, message, "motivational");
  }, [settings.enabled, settings.motivationalMessages, showNotification]);

  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const scheduleReminders = useCallback((goals: Goal[]) => {
    if (!settings.enabled || !settings.goalReminders || goals.length === 0) return;

    // Send a random goal reminder
    const activeGoals = goals.filter(g => !g.completed);
    if (activeGoals.length > 0) {
      const randomGoal = activeGoals[Math.floor(Math.random() * activeGoals.length)];
      sendGoalReminder(randomGoal);
    }
  }, [settings.enabled, settings.goalReminders, sendGoalReminder]);

  return {
    settings,
    permission,
    isSupported: typeof Notification !== "undefined",
    requestPermission,
    showNotification,
    sendGoalReminder,
    sendMotivationalMessage,
    updateSettings,
    scheduleReminders,
  };
};
