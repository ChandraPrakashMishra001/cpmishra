import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BookOpen, Save, Trash2, Calendar, MapPin, Leaf, ChevronDown, Stethoscope } from "lucide-react";
import { useFieldLog, FieldLog } from "@/hooks/useFieldLog";
import { Message } from "@/components/ChatInterface";
import { format } from "date-fns";

interface FieldLogDialogProps {
  messages: Message[];
  companionName: string;
  trigger?: React.ReactNode;
}

const severityColor: Record<string, string> = {
  healthy: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  mild: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  moderate: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  severe: "bg-red-500/15 text-red-700 border-red-500/30",
};

const FieldLogDialog = ({ messages, companionName, trigger }: FieldLogDialogProps) => {
  const { logs, loading, saveLog, deleteLog } = useFieldLog();
  const [tab, setTab] = useState<"history" | "save">("history");
  const [title, setTitle] = useState("");
  const [cropName, setCropName] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState("");
  const [viewingLog, setViewingLog] = useState<FieldLog | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) return;
    const lastBotMsg = [...messages].reverse().find(m => !m.isUser);
    const success = await saveLog(title, messages, cropName, lastBotMsg?.content?.slice(0, 300), location, severity || undefined);
    if (success) {
      setTitle("");
      setCropName("");
      setLocation("");
      setSeverity("");
      setTab("history");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-primary/20 shadow-sm">
            <BookOpen className="w-4 h-4 text-primary" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50 max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Field History
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
          <button
            onClick={() => { setTab("history"); setViewingLog(null); }}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${tab === "history" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            📋 Past Logs ({logs.length})
          </button>
          <button
            onClick={() => { setTab("save"); setViewingLog(null); }}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${tab === "save" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            💾 Save Current
          </button>
        </div>

        <ScrollArea className="max-h-[55vh]">
          {tab === "save" && (
            <div className="space-y-3 p-1">
              <Input placeholder="Log title (e.g., 'Tomato leaf curl diagnosis')" value={title} onChange={e => setTitle(e.target.value)} />
              <Input placeholder="Crop name (optional)" value={cropName} onChange={e => setCropName(e.target.value)} />
              <Input placeholder="Location / Field name (optional)" value={location} onChange={e => setLocation(e.target.value)} />
              <div className="flex gap-2 flex-wrap">
                {["healthy", "mild", "moderate", "severe"].map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverity(severity === s ? "" : s)}
                    className={`px-3 py-1 rounded-full text-xs border capitalize transition-colors ${severity === s ? severityColor[s] : "border-border/50 text-muted-foreground hover:border-primary/30"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Button onClick={handleSave} disabled={!title.trim() || messages.length < 2} className="w-full">
                <Save className="w-4 h-4 mr-2" /> Save to Field History
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Saves the current conversation ({messages.length} messages)
              </p>
            </div>
          )}

          {tab === "history" && !viewingLog && (
            <div className="space-y-2 p-1">
              {loading && <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>}
              {!loading && logs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No saved logs yet</p>
                  <p className="text-xs mt-1">Save a diagnosis to start tracking your field history</p>
                </div>
              )}
              {logs.map(log => {
                const open = expandedId === log.id;
                const lastBot = (log.messages as unknown as Message[])?.slice().reverse().find(m => !m.isUser);
                return (
                  <Collapsible key={log.id} open={open} onOpenChange={(v) => setExpandedId(v ? log.id : null)}>
                    <div className="border border-border/50 rounded-lg hover:bg-muted/30 transition-colors">
                      <CollapsibleTrigger asChild>
                        <button className="w-full text-left p-3 flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                              <h4 className="font-medium text-sm truncate">{log.title}</h4>
                            </div>
                            <div className="flex items-center gap-2 mt-1 ml-5 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(log.created_at), "MMM d, yyyy")}</span>
                              {log.crop_name && <span className="flex items-center gap-1"><Leaf className="w-3 h-3" />{log.crop_name}</span>}
                              {log.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{log.location}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {log.severity && <Badge variant="outline" className={`text-[10px] ${severityColor[log.severity] || ""}`}>{log.severity}</Badge>}
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={e => { e.stopPropagation(); deleteLog(log.id); }}
                              onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); deleteLog(log.id); } }}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-destructive/20 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </span>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-3 pb-3 ml-5 space-y-2 border-t border-border/30 pt-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-muted-foreground">Crop:</span> <span className="font-medium">{log.crop_name || "—"}</span></div>
                            <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{log.location || "—"}</span></div>
                            <div><span className="text-muted-foreground">Severity:</span> <span className="font-medium capitalize">{log.severity || "—"}</span></div>
                            <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{format(new Date(log.created_at), "MMM d, yyyy h:mm a")}</span></div>
                          </div>
                          {(log.diagnosis_summary || lastBot?.content) && (
                            <div className="text-xs bg-muted/40 rounded-md p-2">
                              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                <Stethoscope className="w-3 h-3" /> Diagnosis
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{log.diagnosis_summary || lastBot?.content?.slice(0, 400)}</p>
                            </div>
                          )}
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setViewingLog(log)}>
                            View full conversation →
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}

          {tab === "history" && viewingLog && (
            <div className="space-y-3 p-1">
              <Button variant="ghost" size="sm" onClick={() => setViewingLog(null)} className="text-xs">
                ← Back to logs
              </Button>
              <h3 className="font-semibold">{viewingLog.title}</h3>
              <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                <span>{format(new Date(viewingLog.created_at), "MMM d, yyyy h:mm a")}</span>
                {viewingLog.crop_name && <span>🌱 {viewingLog.crop_name}</span>}
                {viewingLog.location && <span>📍 {viewingLog.location}</span>}
                {viewingLog.severity && <Badge variant="outline" className={`text-[10px] ${severityColor[viewingLog.severity] || ""}`}>{viewingLog.severity}</Badge>}
              </div>
              <div className="space-y-2 mt-2">
                {(viewingLog.messages as unknown as Message[]).map((msg, i) => (
                  <div key={i} className={`text-sm p-2 rounded-lg ${msg.isUser ? "bg-primary/10 ml-4" : "bg-muted/50 mr-4"}`}>
                    <span className="text-[10px] font-medium text-muted-foreground">{msg.isUser ? "You" : companionName}</span>
                    <p className="mt-0.5 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FieldLogDialog;
