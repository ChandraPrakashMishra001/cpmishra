import { useState, useCallback, useEffect } from "react";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: "health" | "career" | "learning" | "relationships" | "personal" | "financial" | "creative";
  progress: number; // 0-100
  milestones: Milestone[];
  createdAt: Date;
  updatedAt: Date;
  targetDate?: Date;
  completed: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

const GOALS_STORAGE_KEY = "lia-goals";

const loadGoals = (): Goal[] => {
  try {
    const stored = localStorage.getItem(GOALS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((g: Goal) => ({
        ...g,
        createdAt: new Date(g.createdAt),
        updatedAt: new Date(g.updatedAt),
        targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
        milestones: g.milestones.map((m: Milestone) => ({
          ...m,
          completedAt: m.completedAt ? new Date(m.completedAt) : undefined,
        })),
      }));
    }
  } catch (e) {
    console.error("Failed to load goals:", e);
  }
  return [];
};

const saveGoals = (goals: Goal[]) => {
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch (e) {
    console.error("Failed to save goals:", e);
  }
};

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>(() => loadGoals());

  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  const addGoal = useCallback((goal: Omit<Goal, "id" | "createdAt" | "updatedAt" | "progress" | "completed" | "milestones">) => {
    const newGoal: Goal = {
      ...goal,
      id: `goal-${Date.now()}`,
      progress: 0,
      completed: false,
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Omit<Goal, "id" | "createdAt">>) => {
    setGoals(prev => prev.map(g => 
      g.id === id ? { ...g, ...updates, updatedAt: new Date() } : g
    ));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const addMilestone = useCallback((goalId: string, title: string) => {
    const milestone: Milestone = {
      id: `milestone-${Date.now()}`,
      title,
      completed: false,
    };
    setGoals(prev => prev.map(g => 
      g.id === goalId 
        ? { ...g, milestones: [...g.milestones, milestone], updatedAt: new Date() } 
        : g
    ));
    return milestone;
  }, []);

  const toggleMilestone = useCallback((goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      
      const updatedMilestones = g.milestones.map(m => 
        m.id === milestoneId 
          ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date() : undefined }
          : m
      );
      
      const completedCount = updatedMilestones.filter(m => m.completed).length;
      const progress = updatedMilestones.length > 0 
        ? Math.round((completedCount / updatedMilestones.length) * 100)
        : g.progress;
      
      return { 
        ...g, 
        milestones: updatedMilestones, 
        progress,
        completed: progress === 100,
        updatedAt: new Date() 
      };
    }));
  }, []);

  const updateProgress = useCallback((goalId: string, progress: number) => {
    setGoals(prev => prev.map(g => 
      g.id === goalId 
        ? { ...g, progress: Math.min(100, Math.max(0, progress)), completed: progress >= 100, updatedAt: new Date() } 
        : g
    ));
  }, []);

  const getActiveGoals = useCallback(() => {
    return goals.filter(g => !g.completed);
  }, [goals]);

  const getCompletedGoals = useCallback(() => {
    return goals.filter(g => g.completed);
  }, [goals]);

  const getGoalsSummary = useCallback(() => {
    const active = getActiveGoals();
    const completed = getCompletedGoals();
    return {
      totalGoals: goals.length,
      activeGoals: active.length,
      completedGoals: completed.length,
      activeGoalsList: active.map(g => `${g.title} (${g.progress}% complete)`).join(", "),
      categories: [...new Set(active.map(g => g.category))],
    };
  }, [goals, getActiveGoals, getCompletedGoals]);

  return {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    addMilestone,
    toggleMilestone,
    updateProgress,
    getActiveGoals,
    getCompletedGoals,
    getGoalsSummary,
  };
};
