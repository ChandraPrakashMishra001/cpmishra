import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bug, Search, ChevronRight } from "lucide-react";

interface Disease {
  name: string;
  hindiName: string;
  crops: string[];
  symptoms: string;
  cause: string;
  treatment: string;
  prevention: string;
  severity: "low" | "medium" | "high";
  emoji: string;
}

const diseases: Disease[] = [
  {
    name: "Late Blight",
    hindiName: "झुलसा रोग",
    crops: ["Tomato", "Potato"],
    symptoms: "Dark water-soaked lesions on leaves, white fungal growth underneath",
    cause: "Phytophthora infestans (fungus-like oomycete)",
    treatment: "Mancozeb (Dithane M-45) 2.5g/L or Metalaxyl + Mancozeb (Ridomil Gold) 2g/L",
    prevention: "Avoid overhead irrigation, ensure air circulation, use resistant varieties",
    severity: "high",
    emoji: "🍅"
  },
  {
    name: "Powdery Mildew",
    hindiName: "चूर्णिल आसिता",
    crops: ["Cucurbits", "Peas", "Grapes"],
    symptoms: "White powdery coating on leaf surfaces, curling and yellowing",
    cause: "Erysiphe spp. / Podosphaera spp. (fungus)",
    treatment: "Sulphur WP 3g/L or Karathane (Dinocap) 1ml/L. Organic: Neem oil 5ml/L",
    prevention: "Proper spacing, avoid excess nitrogen, grow resistant varieties",
    severity: "medium",
    emoji: "🥒"
  },
  {
    name: "Bacterial Leaf Blight",
    hindiName: "जीवाणु झुलसा",
    crops: ["Rice", "Cotton"],
    symptoms: "Water-soaked streaks along veins, turning yellow-white and drying",
    cause: "Xanthomonas oryzae pv. oryzae",
    treatment: "Streptocycline 1g + Copper oxychloride 25g per 10L. No effective chemical cure — manage early",
    prevention: "Use certified seed, balanced fertilization, avoid excess nitrogen",
    severity: "high",
    emoji: "🌾"
  },
  {
    name: "Fusarium Wilt",
    hindiName: "उकठा रोग",
    crops: ["Tomato", "Banana", "Chickpea"],
    symptoms: "Yellowing of lower leaves, wilting despite adequate water, brown vascular discoloration",
    cause: "Fusarium oxysporum (soil-borne fungus)",
    treatment: "Trichoderma viride 5g/kg seed treatment. Carbendazim (Bavistin) 1g/L soil drench",
    prevention: "Crop rotation (3–4 years), solarize soil, use resistant rootstocks",
    severity: "high",
    emoji: "🍌"
  },
  {
    name: "Aphid Infestation",
    hindiName: "माहू / चेंपा",
    crops: ["Mustard", "Wheat", "Vegetables"],
    symptoms: "Curled leaves, sticky honeydew, sooty mold, stunted growth",
    cause: "Lipaphis erysimi / Aphis gossypii (sucking pest)",
    treatment: "Neem oil 5ml/L or Imidacloprid (Confidor) 0.3ml/L. Release ladybird beetles as biocontrol",
    prevention: "Yellow sticky traps, intercropping with coriander, avoid excess nitrogen",
    severity: "medium",
    emoji: "🐛"
  },
  {
    name: "Downy Mildew",
    hindiName: "मृदुरोमिल आसिता",
    crops: ["Grapes", "Cucurbits", "Onion"],
    symptoms: "Yellow angular spots on upper leaf, purplish-grey fungal growth below",
    cause: "Peronospora spp. / Pseudoperonospora spp.",
    treatment: "Metalaxyl + Mancozeb (Ridomil Gold) 2g/L or Copper oxychloride 3g/L",
    prevention: "Avoid waterlogging, morning irrigation, prune for air flow",
    severity: "medium",
    emoji: "🍇"
  },
  {
    name: "Root Knot Nematode",
    hindiName: "जड़ गांठ सूत्रकृमि",
    crops: ["Tomato", "Brinjal", "Okra", "Carrot"],
    symptoms: "Stunting, wilting in heat, swollen galls/knots on roots",
    cause: "Meloidogyne incognita (nematode)",
    treatment: "Paecilomyces lilacinus or Carbofuran 1kg a.i./ha at transplanting. Neem cake 250kg/ha",
    prevention: "Marigold intercrop/rotation, solarization, resistant varieties",
    severity: "high",
    emoji: "🥕"
  },
  {
    name: "Leaf Curl Virus",
    hindiName: "पत्ती मोड़क विषाणु",
    crops: ["Tomato", "Chilli", "Cotton"],
    symptoms: "Upward curling, puckering, reduced leaf size, stunted plants",
    cause: "Begomovirus transmitted by whitefly (Bemisia tabaci)",
    treatment: "No cure. Remove infected plants. Control whitefly: Imidacloprid 0.3ml/L or neem oil",
    prevention: "Use virus-free seedlings, silver mulch to repel whitefly, resistant hybrids",
    severity: "high",
    emoji: "🌶️"
  },
];

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
