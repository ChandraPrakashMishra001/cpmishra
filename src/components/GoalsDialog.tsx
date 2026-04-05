import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Goal, Milestone, useGoals } from "@/hooks/useGoals";
import { Target, Plus, Trash2, Trophy, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { toast } from "sonner";

const categoryEmojis: Record<Goal["category"], string> = {
  health: "💪",
  career: "💼",
  learning: "📚",
  relationships: "💕",
  personal: "🌟",
  financial: "💰",
  creative: "🎨",
};

const categoryColors: Record<Goal["category"], string> = {
  health: "bg-green-500/20 text-green-400 border-green-500/30",
  career: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  learning: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  relationships: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  personal: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  financial: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  creative: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export interface GoalsDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const GoalsDialog = ({ trigger, open, onOpenChange }: GoalsDialogProps) => {
  const { goals, addGoal, deleteGoal, addMilestone, toggleMilestone, updateProgress } = useGoals();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState("");
  
  // New goal form state
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "personal" as Goal["category"],
  });

  const handleAddGoal = () => {
    if (!newGoal.title.trim()) {
      toast.error("Please enter a goal title~");
      return;
    }
    
    addGoal({
      title: newGoal.title.trim(),
      description: newGoal.description.trim() || undefined,
      category: newGoal.category,
    });
    
    setNewGoal({ title: "", description: "", category: "personal" });
    setIsAddingGoal(false);
    toast.success("Goal added! Let's crush it together! 💪");
  };

  const handleAddMilestone = (goalId: string) => {
    if (!newMilestone.trim()) return;
    addMilestone(goalId, newMilestone.trim());
    setNewMilestone("");
    toast.success("Milestone added! One step closer~ ✨");
  };

  const handleDeleteGoal = (goalId: string, title: string) => {
    deleteGoal(goalId);
    toast.success(`Removed "${title}"`);
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="text-lia-pink hover:bg-lia-pink/20">
            <Target className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col bg-card/95 backdrop-blur-xl border-lia-pink/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Target className="w-5 h-5 text-lia-pink" />
            Your Goals
            <span className="text-sm text-muted-foreground font-normal">
              ({activeGoals.length} active)
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Add Goal Form */}
          {isAddingGoal ? (
            <div className="p-4 rounded-lg bg-background/50 border border-lia-pink/20 space-y-3">
              <Input
                placeholder="What's your goal? ✨"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                className="bg-background/50 border-lia-pink/30"
                maxLength={100}
              />
              <Textarea
                placeholder="Why is this important to you? (optional)"
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                className="bg-background/50 border-lia-pink/30 min-h-[60px]"
                maxLength={500}
              />
              <Select
                value={newGoal.category}
                onValueChange={(v) => setNewGoal(prev => ({ ...prev, category: v as Goal["category"] }))}
              >
                <SelectTrigger className="bg-background/50 border-lia-pink/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryEmojis).map(([cat, emoji]) => (
                    <SelectItem key={cat} value={cat}>
                      {emoji} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={handleAddGoal} className="flex-1 bg-lia-pink hover:bg-lia-pink/80">
                  Add Goal
                </Button>
                <Button variant="ghost" onClick={() => setIsAddingGoal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAddingGoal(true)}
              variant="outline"
              className="w-full border-dashed border-lia-pink/40 text-lia-pink hover:bg-lia-pink/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Goal
            </Button>
          )}

          {/* Active Goals */}
          {activeGoals.length === 0 && !isAddingGoal && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-lia-pink/50" />
              <p>No goals yet~</p>
              <p className="text-sm">Let's set some together! 💖</p>
            </div>
          )}

          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              isExpanded={expandedGoal === goal.id}
              onToggleExpand={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
              onDelete={() => handleDeleteGoal(goal.id, goal.title)}
              onAddMilestone={() => handleAddMilestone(goal.id)}
              onToggleMilestone={(mId) => toggleMilestone(goal.id, mId)}
              onUpdateProgress={(p) => updateProgress(goal.id, p)}
              newMilestone={expandedGoal === goal.id ? newMilestone : ""}
              setNewMilestone={setNewMilestone}
            />
          ))}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Completed ({completedGoals.length})
              </h3>
              {completedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-3 rounded-lg bg-background/30 border border-border/30 mb-2 opacity-70"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>{categoryEmojis[goal.category]}</span>
                      <span className="line-through text-muted-foreground">{goal.title}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteGoal(goal.id, goal.title)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface GoalCardProps {
  goal: Goal;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onAddMilestone: () => void;
  onToggleMilestone: (milestoneId: string) => void;
  onUpdateProgress: (progress: number) => void;
  newMilestone: string;
  setNewMilestone: (value: string) => void;
}

const GoalCard = ({
  goal,
  isExpanded,
  onToggleExpand,
  onDelete,
  onAddMilestone,
  onToggleMilestone,
  onUpdateProgress,
  newMilestone,
  setNewMilestone,
}: GoalCardProps) => {
  return (
    <div className={`rounded-lg border ${categoryColors[goal.category]} overflow-hidden transition-all`}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{categoryEmojis[goal.category]}</span>
              <h4 className="font-medium text-foreground truncate">{goal.title}</h4>
            </div>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleExpand}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
          {/* Manual progress update */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Update:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={goal.progress}
              onChange={(e) => onUpdateProgress(parseInt(e.target.value))}
              className="flex-1 h-2 accent-lia-pink"
            />
          </div>

          {/* Milestones */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Milestones:</span>
            {goal.milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center gap-2">
                <Checkbox
                  checked={milestone.completed}
                  onCheckedChange={() => onToggleMilestone(milestone.id)}
                  className="border-lia-pink/50 data-[state=checked]:bg-lia-pink"
                />
                <span className={`text-sm ${milestone.completed ? "line-through text-muted-foreground" : ""}`}>
                  {milestone.title}
                </span>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add milestone..."
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAddMilestone()}
                className="text-sm h-8 bg-background/50 border-lia-pink/30"
                maxLength={100}
              />
              <Button size="sm" variant="ghost" onClick={onAddMilestone} className="h-8">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsDialog;
