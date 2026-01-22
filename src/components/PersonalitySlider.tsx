import { Slider } from "@/components/ui/slider";
import { ToneLevel, PERSONALITY_LABELS } from "@/hooks/usePersonalitySettings";

interface PersonalitySliderProps {
  settingKey: keyof typeof PERSONALITY_LABELS;
  value: ToneLevel;
  onChange: (value: ToneLevel) => void;
}

const PersonalitySlider = ({ settingKey, value, onChange }: PersonalitySliderProps) => {
  const label = PERSONALITY_LABELS[settingKey];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <span>{label.emoji}</span>
          <span>{label.name}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {value <= 2 ? label.low : value >= 4 ? label.high : "Balanced"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-16 text-right">{label.low}</span>
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0] as ToneLevel)}
          min={1}
          max={5}
          step={1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-16">{label.high}</span>
      </div>
    </div>
  );
};

export default PersonalitySlider;
