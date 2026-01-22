import { useState } from "react";
import { Brain, User, Heart, Target, Calendar, Sparkles, TrendingUp, Clock, MessageSquare, Download, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface MemoryViewerDialogProps {
  memory: {
    userName: string | null;
    totalMessages: number;
    dailyStreak: number;
    favoriteTopics: string[];
    importantFacts: Array<{ fact: string; category: string; timestamp: string }>;
    moodHistory: Array<{ mood: string; timestamp: string }>;
    milestones: Array<{ type: string; achieved: string; value?: number }>;
    preferences: Record<string, string>;
    sharedExperiences: string[];
    firstChatDate: string | null;
  };
  companionName: string;
  onClearMemory: () => void;
  trigger?: React.ReactNode;
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  stressed: "😰",
  excited: "🎉",
  neutral: "😐",
};

const CATEGORY_COLORS: Record<string, string> = {
  personal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  preference: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  life_event: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  relationship: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  goal: "bg-green-500/20 text-green-400 border-green-500/30",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  personal: <User className="w-3 h-3" />,
  preference: <Heart className="w-3 h-3" />,
  life_event: <Calendar className="w-3 h-3" />,
  relationship: <Heart className="w-3 h-3" />,
  goal: <Target className="w-3 h-3" />,
};

const MemoryViewerDialog = ({
  memory,
  companionName,
  onClearMemory,
  trigger,
}: MemoryViewerDialogProps) => {
  const [open, setOpen] = useState(false);

  // Calculate relationship stats
  const relationshipDays = memory.firstChatDate
    ? Math.floor((Date.now() - new Date(memory.firstChatDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Calculate mood distribution
  const moodCounts = memory.moodHistory.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalMoods = memory.moodHistory.length || 1;
  const moodPercentages = Object.entries(moodCounts).map(([mood, count]) => ({
    mood,
    percentage: Math.round((count / totalMoods) * 100),
  })).sort((a, b) => b.percentage - a.percentage);

  // Export memory as JSON
  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      companion: companionName,
      ...memory,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${companionName.toLowerCase()}-memories-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-primary/20 shadow-sm"
          >
            <Brain className="w-4 h-4 text-primary" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50 backdrop-blur-xl max-w-lg max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-gradient flex items-center gap-2">
            <Brain className="w-5 h-5" />
            {companionName}'s Memories
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="facts" className="text-xs">Facts</TabsTrigger>
            <TabsTrigger value="moods" className="text-xs">Moods</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              {/* Relationship Stats */}
              <div className="bg-gradient-to-br from-primary/10 to-lia-purple/10 rounded-lg p-4 border border-primary/20">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Our Journey Together
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{memory.totalMessages}</p>
                    <p className="text-xs text-muted-foreground">Messages</p>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{relationshipDays}</p>
                    <p className="text-xs text-muted-foreground">Days Together</p>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-500">{memory.dailyStreak} 🔥</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-500">{memory.milestones.length}</p>
                    <p className="text-xs text-muted-foreground">Milestones</p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {memory.userName && (
                <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    About You
                  </h3>
                  <p className="text-sm">
                    I know your name is <span className="text-primary font-medium">{memory.userName}</span>! 💕
                  </p>
                </div>
              )}

              {/* Favorite Topics */}
              {memory.favoriteTopics.length > 0 && (
                <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Topics We Love
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {memory.favoriteTopics.map((topic, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {memory.milestones.length > 0 && (
                <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Milestones Achieved
                  </h3>
                  <div className="space-y-2">
                    {memory.milestones.slice(-5).reverse().map((milestone, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">✨</span>
                        <span>
                          {milestone.type === "first_chat" && "Our first conversation!"}
                          {milestone.type === "shared_name" && "You shared your name with me"}
                          {milestone.type === "milestone_messages" && `Reached ${milestone.value} messages!`}
                          {milestone.type === "weekly_streak" && "7-day chat streak!"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shared Experiences */}
              {memory.sharedExperiences.length > 0 && (
                <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Our Shared Moments
                  </h3>
                  <ul className="space-y-1">
                    {memory.sharedExperiences.slice(-5).map((exp, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {exp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="facts" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              {memory.importantFacts.length > 0 ? (
                <div className="space-y-3">
                  {/* Group facts by category */}
                  {["personal", "preference", "life_event", "relationship", "goal"].map((category) => {
                    const categoryFacts = memory.importantFacts.filter((f) => f.category === category);
                    if (categoryFacts.length === 0) return null;

                    return (
                      <div key={category} className="bg-background/50 rounded-lg p-4 border border-border/30">
                        <h4 className="font-semibold text-sm mb-2 capitalize flex items-center gap-2">
                          {CATEGORY_ICONS[category]}
                          {category.replace("_", " ")}
                        </h4>
                        <div className="space-y-2">
                          {categoryFacts.slice(-5).map((fact, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Badge className={`text-xs ${CATEGORY_COLORS[category]}`}>
                                {new Date(fact.timestamp).toLocaleDateString()}
                              </Badge>
                              <span className="text-sm">{fact.fact}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No facts learned yet!</p>
                  <p className="text-sm mt-1">Tell me about yourself and I'll remember~ 💕</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="moods" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              {moodPercentages.length > 0 ? (
                <div className="space-y-4">
                  {/* Mood Distribution */}
                  <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Your Mood Patterns
                    </h3>
                    <div className="space-y-3">
                      {moodPercentages.map(({ mood, percentage }) => (
                        <div key={mood} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <span>{MOOD_EMOJIS[mood]}</span>
                              <span className="capitalize">{mood}</span>
                            </span>
                            <span className="text-muted-foreground">{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Mood History */}
                  <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Recent Moods
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {memory.moodHistory.slice(-15).reverse().map((entry, i) => (
                        <div
                          key={i}
                          className="text-lg"
                          title={`${entry.mood} - ${new Date(entry.timestamp).toLocaleString()}`}
                        >
                          {MOOD_EMOJIS[entry.mood]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No mood data yet!</p>
                  <p className="text-sm mt-1">Keep chatting and I'll learn your patterns~ 💕</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex-1 border-primary/30 hover:bg-primary/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClearMemory();
              setOpen(false);
            }}
            className="flex-1 border-destructive/30 hover:bg-destructive/10 text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemoryViewerDialog;
