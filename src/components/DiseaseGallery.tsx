import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bug, Search, ChevronRight } from "lucide-react";
import { diseases, type Disease } from "@/data/diseases";

const severityStyles: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  medium: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  high: "bg-red-500/15 text-red-700 border-red-500/30",
};

interface DiseaseGalleryProps {
  trigger?: React.ReactNode;
  onAskAbout?: (diseaseName: string) => void;
}

const DiseaseGallery = ({ trigger, onAskAbout }: DiseaseGalleryProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Disease | null>(null);

  const filtered = diseases.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.hindiName.includes(search) ||
    d.crops.some(c => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-primary/20 shadow-sm">
            <Bug className="w-4 h-4 text-primary" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50 max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            Plant Disease Library
          </DialogTitle>
        </DialogHeader>

        {!selected ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by disease, crop, or Hindi name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="max-h-[55vh]">
              <div className="space-y-2">
                {filtered.map(disease => (
                  <div
                    key={disease.name}
                    className="border border-border/50 rounded-lg p-3 hover:bg-muted/30 transition-colors cursor-pointer flex items-center gap-3"
                    onClick={() => setSelected(disease)}
                  >
                    <span className="text-2xl">{disease.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{disease.name}</h4>
                        <Badge variant="outline" className={`text-[10px] ${severityStyles[disease.severity]}`}>{disease.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{disease.hindiName} • {disease.crops.join(", ")}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">No diseases found for "{search}"</p>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="text-xs">← Back</Button>

              <div className="flex items-center gap-3">
                <span className="text-4xl">{selected.emoji}</span>
                <div>
                  <h3 className="font-bold text-lg">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground">{selected.hindiName}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {selected.crops.map(c => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}
                    <Badge variant="outline" className={`text-[10px] ${severityStyles[selected.severity]}`}>{selected.severity} severity</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "🔍 Symptoms", text: selected.symptoms },
                  { label: "🦠 Cause", text: selected.cause },
                  { label: "💊 Treatment", text: selected.treatment },
                  { label: "🛡️ Prevention", text: selected.prevention },
                ].map(item => (
                  <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">{item.label}</h4>
                    <p className="text-sm">{item.text}</p>
                  </div>
                ))}
              </div>

              {onAskAbout && (
                <Button
                  className="w-full"
                  onClick={() => onAskAbout(selected.name)}
                >
                  Ask {selected.name} question to Amanai 🌿
                </Button>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DiseaseGallery;
