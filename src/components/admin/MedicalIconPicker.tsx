import { useState } from "react";
import {
  Heart, HeartPulse, Activity, Stethoscope, Thermometer, Pill, Syringe,
  Baby, Brain, Bone, Eye, Ear, Hand, Footprints, Droplets, Droplet,
  FlaskConical, FlaskRound, Microscope, TestTube, TestTubes, Dna,
  Scan, ScanLine, Shield, ShieldCheck, ShieldPlus,
  Cross, Plus, Ambulance, Hospital, CircleDot,
  Sparkles, Zap, Flame, Wind, Waves, Sun, Moon,
  Leaf, Apple, Salad, Milk, Wheat, Beef, Fish, Egg, Cherry, Grape, Citrus,
  PersonStanding, User, Users, UserCheck,
  Clock, Calendar, Timer, Hourglass,
  FileText, ClipboardList, ClipboardCheck, BookOpen,
  TrendingUp, BarChart3, PieChart, LineChart,
  CheckCircle, AlertCircle, Info, HelpCircle,
  Ribbon, Bike, Dumbbell, Medal,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface IconEntry {
  name: string;
  icon: LucideIcon;
  tags: string[];
}

const MEDICAL_ICONS: IconEntry[] = [
  { name: "Heart", icon: Heart, tags: ["cardio", "heart", "love"] },
  { name: "HeartPulse", icon: HeartPulse, tags: ["cardio", "pulse", "ecg"] },
  { name: "Activity", icon: Activity, tags: ["ecg", "monitor", "pulse"] },
  { name: "Stethoscope", icon: Stethoscope, tags: ["doctor", "checkup"] },
  { name: "Thermometer", icon: Thermometer, tags: ["fever", "temperature"] },
  { name: "Pill", icon: Pill, tags: ["medicine", "drug", "pharmacy"] },
  { name: "Syringe", icon: Syringe, tags: ["injection", "vaccine", "blood"] },
  { name: "Baby", icon: Baby, tags: ["child", "pediatric", "infant"] },
  { name: "Brain", icon: Brain, tags: ["neuro", "mind", "cognitive"] },
  { name: "Bone", icon: Bone, tags: ["ortho", "skeleton", "joint"] },
  { name: "Eye", icon: Eye, tags: ["vision", "ophthal", "sight"] },
  { name: "Ear", icon: Ear, tags: ["ent", "hearing", "audio"] },
  { name: "Hand", icon: Hand, tags: ["derma", "skin", "touch"] },
  { name: "Footprints", icon: Footprints, tags: ["podiatry", "walk"] },
  { name: "Droplets", icon: Droplets, tags: ["blood", "sample", "fluid"] },
  { name: "Droplet", icon: Droplet, tags: ["blood", "serum", "urine"] },
  { name: "FlaskConical", icon: FlaskConical, tags: ["lab", "chemistry", "test"] },
  { name: "FlaskRound", icon: FlaskRound, tags: ["lab", "chemistry"] },
  { name: "Microscope", icon: Microscope, tags: ["lab", "pathology", "research"] },
  { name: "TestTube", icon: TestTube, tags: ["lab", "sample", "test"] },
  { name: "TestTubes", icon: TestTubes, tags: ["lab", "samples", "tests"] },
  { name: "Dna", icon: Dna, tags: ["genetics", "genome", "hereditary"] },
  { name: "Scan", icon: Scan, tags: ["radiology", "imaging", "xray"] },
  { name: "ScanLine", icon: ScanLine, tags: ["scan", "imaging", "mri"] },
  { name: "Shield", icon: Shield, tags: ["immunity", "protection"] },
  { name: "ShieldCheck", icon: ShieldCheck, tags: ["immunity", "verified", "safe"] },
  { name: "ShieldPlus", icon: ShieldPlus, tags: ["immunity", "health", "plus"] },
  { name: "Cross", icon: Cross, tags: ["medical", "hospital", "emergency"] },
  { name: "Plus", icon: Plus, tags: ["medical", "add", "positive"] },
  { name: "Ambulance", icon: Ambulance, tags: ["emergency", "vehicle"] },
  { name: "Hospital", icon: Hospital, tags: ["clinic", "hospital", "building"] },
  { name: "CircleDot", icon: CircleDot, tags: ["target", "focus", "cell"] },
  { name: "Sparkles", icon: Sparkles, tags: ["wellness", "clean", "health"] },
  { name: "Zap", icon: Zap, tags: ["energy", "electro", "nerve"] },
  { name: "Flame", icon: Flame, tags: ["metabolism", "calorie", "burn"] },
  { name: "Wind", icon: Wind, tags: ["respiratory", "lung", "breath"] },
  { name: "Waves", icon: Waves, tags: ["ultrasound", "sono", "wave"] },
  { name: "Sun", icon: Sun, tags: ["vitamin d", "light", "skin"] },
  { name: "Moon", icon: Moon, tags: ["sleep", "hormone", "night"] },
  { name: "Leaf", icon: Leaf, tags: ["natural", "herbal", "organic"] },
  { name: "Apple", icon: Apple, tags: ["nutrition", "diet", "food"] },
  { name: "Salad", icon: Salad, tags: ["nutrition", "diet", "healthy"] },
  { name: "Milk", icon: Milk, tags: ["calcium", "dairy", "bone"] },
  { name: "Wheat", icon: Wheat, tags: ["allergy", "gluten", "celiac"] },
  { name: "Beef", icon: Beef, tags: ["protein", "iron", "meat"] },
  { name: "Fish", icon: Fish, tags: ["omega", "fatty acid", "protein"] },
  { name: "Egg", icon: Egg, tags: ["protein", "allergy", "fertility"] },
  { name: "Cherry", icon: Cherry, tags: ["antioxidant", "fruit"] },
  { name: "Grape", icon: Grape, tags: ["antioxidant", "fruit"] },
  { name: "Citrus", icon: Citrus, tags: ["vitamin c", "immunity"] },
  { name: "PersonStanding", icon: PersonStanding, tags: ["body", "posture", "full"] },
  { name: "User", icon: User, tags: ["patient", "person", "profile"] },
  { name: "Users", icon: Users, tags: ["family", "group", "patients"] },
  { name: "UserCheck", icon: UserCheck, tags: ["verified", "patient", "check"] },
  { name: "Clock", icon: Clock, tags: ["time", "turnaround", "wait"] },
  { name: "Calendar", icon: Calendar, tags: ["schedule", "appointment", "date"] },
  { name: "Timer", icon: Timer, tags: ["quick", "fast", "urgent"] },
  { name: "Hourglass", icon: Hourglass, tags: ["wait", "time", "process"] },
  { name: "FileText", icon: FileText, tags: ["report", "document", "result"] },
  { name: "ClipboardList", icon: ClipboardList, tags: ["checklist", "report"] },
  { name: "ClipboardCheck", icon: ClipboardCheck, tags: ["verified", "done"] },
  { name: "BookOpen", icon: BookOpen, tags: ["guide", "info", "knowledge"] },
  { name: "TrendingUp", icon: TrendingUp, tags: ["growth", "improvement"] },
  { name: "BarChart3", icon: BarChart3, tags: ["stats", "data", "analysis"] },
  { name: "PieChart", icon: PieChart, tags: ["stats", "breakdown"] },
  { name: "LineChart", icon: LineChart, tags: ["trend", "history", "graph"] },
  { name: "CheckCircle", icon: CheckCircle, tags: ["done", "verified", "pass"] },
  { name: "AlertCircle", icon: AlertCircle, tags: ["warning", "alert", "urgent"] },
  { name: "Info", icon: Info, tags: ["information", "detail"] },
  { name: "HelpCircle", icon: HelpCircle, tags: ["help", "question", "faq"] },
  { name: "Ribbon", icon: Ribbon, tags: ["cancer", "awareness", "cause"] },
  { name: "Bike", icon: Bike, tags: ["fitness", "exercise", "cardio"] },
  { name: "Dumbbell", icon: Dumbbell, tags: ["fitness", "strength", "gym"] },
  { name: "Medal", icon: Medal, tags: ["achievement", "best", "top"] },
];

interface MedicalIconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

const MedicalIconPicker = ({ value, onChange }: MedicalIconPickerProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = MEDICAL_ICONS.filter((entry) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.tags.some((t) => t.includes(q))
    );
  });

  const selectedEntry = MEDICAL_ICONS.find((e) => e.name === value);
  const SelectedIcon = selectedEntry?.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 h-10">
          {SelectedIcon ? (
            <>
              <SelectedIcon className="h-5 w-5 text-primary" />
              <span className="text-sm">{value}</span>
            </>
          ) : value ? (
            <span className="text-lg">{value}</span>
          ) : (
            <span className="text-muted-foreground text-sm">Choose an icon…</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <Input
          placeholder="Search icons… (e.g. blood, heart, lab)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
          autoFocus
        />
        <ScrollArea className="h-56">
          <div className="grid grid-cols-6 gap-1">
            {filtered.map((entry) => {
              const Icon = entry.icon;
              return (
                <button
                  key={entry.name}
                  type="button"
                  title={entry.name}
                  onClick={() => { onChange(entry.name); setOpen(false); }}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-md hover:bg-accent transition-colors",
                    value === entry.name && "bg-primary/10 ring-1 ring-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">No icons found</p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default MedicalIconPicker;
