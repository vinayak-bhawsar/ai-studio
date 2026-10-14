import React, { useState, useEffect } from "react";
import { 
  Palette, 
  Aperture,
  Plus,
  CheckCircle2,
  Wand2,
  ChevronDown,
  Monitor,
  Smartphone,
  RefreshCw,
  Grid3X3,
  CircleDashed,
  Target,
  SplitSquareHorizontal,
  Square,
  MessageSquareShare,
  SkipForward,
  ChevronRight
} from "lucide-react";
import Image from "next/image";
import { StyleBookContent } from "@/src/features/production-design/types/stylebook";
import { StyleBookShimmer } from "@/src/components/shared/StudioShimmers";

interface HyperdreamStyleBookProps {
  onGenerate: () => void;
  isGenerating: boolean;
  styleBook: StyleBookContent | null;
  onSendToChat: (data: Partial<StyleBookContent>) => void;
  isSendingToChat?: boolean;
  onSkip?: () => void;
  onProceed?: () => void;
  isSkipped?: boolean;
}

export function HyperdreamStyleBook({ 
  onGenerate, 
  isGenerating, 
  styleBook, 
  onSendToChat, 
  isSendingToChat,
  onSkip,
  onProceed,
  isSkipped
}: HyperdreamStyleBookProps) {
  const [selectedAesthetic, setSelectedAesthetic] = useState(styleBook?.aesthetic?.preset || "Cinematic");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(styleBook?.composition_and_framing?.aspect_ratio || "16:9");
  const [selectedComposition, setSelectedComposition] = useState<string[]>(styleBook?.composition_and_framing?.composition_rules || ["Rule of Thirds", "Negative Space"]);
  
  const [selectedPalette, setSelectedPalette] = useState(
    styleBook?.color_palette?.colors && styleBook.color_palette.colors.length > 0 ? "Custom" : "Cinematic Teal & Orange"
  );
  const [customColors, setCustomColors] = useState<string[]>(styleBook?.color_palette?.colors || []);

  useEffect(() => {
    if (styleBook) {
      if (styleBook.aesthetic?.preset) {
        setSelectedAesthetic(styleBook.aesthetic.preset);
        // Add to aesthetics array if it doesn't exist
        if (!aesthetics.find(a => a.id === styleBook.aesthetic.preset)) {
          aesthetics.unshift({
            id: styleBook.aesthetic.preset,
            image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400" // Fallback image
          });
        }
      }
      if (styleBook.composition_and_framing?.aspect_ratio) setSelectedAspectRatio(styleBook.composition_and_framing.aspect_ratio);
      if (styleBook.composition_and_framing?.composition_rules) setSelectedComposition(styleBook.composition_and_framing.composition_rules);
      if (styleBook.color_palette?.colors && styleBook.color_palette.colors.length > 0) {
        setCustomColors(styleBook.color_palette.colors);
        setSelectedPalette("Custom");
      }
    }
  }, [styleBook]);

  const toggleComposition = (rule: string) => {
    if (selectedComposition.includes(rule)) {
      setSelectedComposition(selectedComposition.filter(r => r !== rule));
    } else {
      setSelectedComposition([...selectedComposition, rule]);
    }
  };

  const aesthetics = [
    { id: "Cinematic", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400" },
    { id: "Anime", image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400" },
    { id: "Noir", image: "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&q=80&w=400" },
    { id: "Cyberpunk", image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=400" },
    { id: "Documentary", image: "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=400" },
    { id: "Vintage 80s", image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=400" },
    { id: "Watercolor", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=400" },
  ];

  const aspectRatios = [
    {
      id: "16:9",
      icon: Monitor,
      title: "16:9",
      description: "Widescreen — film, YouTube, TV"
    },
    {
      id: "9:16",
      icon: Smartphone,
      title: "9:16",
      description: "Vertical — Reels, TikTok, Shorts"
    }
  ];

  const compositionRules = [
    {
      id: "Auto-Aesthetic",
      icon: RefreshCw,
      title: "Auto-Aesthetic",
      description: "Let the AI pick framing to fit the look."
    },
    {
      id: "Rule of Thirds",
      icon: Grid3X3,
      title: "Rule of Thirds",
      description: "Subjects on the thirds grid lines."
    },
    {
      id: "Golden Ratio",
      icon: CircleDashed,
      title: "Golden Ratio",
      description: "Compose along a natural spiral."
    },
    {
      id: "Center Framing",
      icon: Target,
      title: "Center Framing",
      description: "Subject dead center for impact."
    },
    {
      id: "Symmetry",
      icon: SplitSquareHorizontal,
      title: "Symmetry",
      description: "Balanced, mirrored composition."
    },
    {
      id: "Negative Space",
      icon: Square,
      title: "Negative Space",
      description: "Lots of empty space around the subject."
    }
  ];

  const palettes = [
    { id: "Cinematic Teal & Orange", colors: ["#0B1D27", "#1E3B4D", "#295264", "#C76D29", "#E59F5C"] },
    { id: "Neon Cyberpunk", colors: ["#09090E", "#2A0A3A", "#7100B8", "#F20089", "#00F0FF"] },
    { id: "Muted Pastel", colors: ["#FDFBF7", "#F1EAE1", "#D6C7B3", "#A89B8C", "#7A6E60"] },
    { id: "Noir Monochromatic", colors: ["#000000", "#222222", "#555555", "#AAAAAA", "#FFFFFF"] },
  ];

  if (isGenerating) {
    return <StyleBookShimmer message="AI is analyzing your screenplay and composing style presets..." />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 sm:p-12 flex flex-col items-center bg-white dark:bg-zinc-950">
      <div className="max-w-4xl w-full space-y-12 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[28px] font-bold text-zinc-900 tracking-tight">Style Book</h1>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold text-zinc-500 bg-zinc-100 rounded-full border border-zinc-200">
                Optional Stage
              </span>
            </div>
            <p className="text-[15px] text-zinc-500 leading-relaxed">
              Define your film's look — aesthetic, framing, and color. Generate a complete book from your script, craft each part by hand, or skip directly to Storyboard.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {onSkip && (
                <button 
                  type="button"
                  onClick={onSkip}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
                  title="Skip Style Book and proceed directly to Storyboard"
                >
                  <SkipForward className="w-4 h-4 text-zinc-500" />
                  <span>Skip for Now</span>
                </button>
              )}

              <button 
                type="button"
                onClick={() => {
                  onSendToChat({
                    aesthetic: { preset: selectedAesthetic, description: "" },
                    composition_and_framing: { aspect_ratio: selectedAspectRatio, composition_rules: selectedComposition, framing: "", composition: "", shot_scale: "", camera_angle: "" },
                    color_palette: { colors: selectedPalette === "Custom" ? customColors : (palettes.find(p => p.id === selectedPalette)?.colors || []), description: "" }
                  });
                }}
                disabled={isSendingToChat}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSendingToChat ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquareShare className="w-4 h-4" />}
                <span>Send Choices to Chat</span>
              </button>

              {onProceed && (
                <button
                  type="button"
                  onClick={onProceed}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                >
                  <span>Proceed to Storyboard</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            {isSkipped && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Style Book is currently skipped. You can configure styles anytime.
              </span>
            )}
          </div>
        </div>

        {/* Aesthetic Section */}
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#F3F5FF] text-[#4F46E5] rounded-full mt-0.5">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Aesthetic</h2>
              <p className="text-sm text-zinc-500">The overall art direction — the look every shot inherits.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pl-11">
            {/* New Custom */}
            <button className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 hover:border-[#4F46E5] hover:bg-[#F3F5FF] flex flex-col items-center justify-center gap-2 transition-all group">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#4F46E5] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-zinc-600 group-hover:text-[#4F46E5]">New Custom</span>
            </button>

            {/* Aesthetic Cards */}
            {aesthetics.map((style) => {
              const isSelected = selectedAesthetic === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedAesthetic(style.id)}
                  className={`relative aspect-square rounded-2xl overflow-hidden group border-4 transition-all duration-200 ${
                    isSelected ? "border-[#4F46E5] shadow-lg scale-[1.02]" : "border-transparent hover:scale-[1.02]"
                  }`}
                >
                  <Image 
                    src={style.image} 
                    alt={style.id}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <span className="absolute bottom-3 left-3 text-white font-bold text-sm">{style.id}</span>
                  {isSelected && (
                    <div className="absolute bottom-2 right-2 bg-white rounded-full text-[#4F46E5]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Composition & Framing Section */}
        <div className="space-y-6 pt-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#F3F5FF] text-[#4F46E5] rounded-full mt-0.5">
              <Aperture className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Composition & Framing</h2>
              <p className="text-sm text-zinc-500">How every shot is framed — aspect ratio and composition rules.</p>
            </div>
          </div>

          <div className="space-y-8 pl-11">
            {/* Aspect Ratio */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Aspect Ratio</h3>
              <div className="flex flex-wrap gap-4">
                {aspectRatios.map((ratio) => {
                  const isSelected = selectedAspectRatio === ratio.id;
                  const Icon = ratio.icon;
                  return (
                    <button
                      key={ratio.id}
                      onClick={() => setSelectedAspectRatio(ratio.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left w-full sm:w-[300px] transition-all ${
                        isSelected 
                          ? "border-[#4F46E5] bg-[#F8F9FF]" 
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? "text-[#4F46E5]" : "text-zinc-400"}`}>
                        <Icon className="w-8 h-8 stroke-[1.5]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isSelected ? "text-[#4F46E5]" : "text-zinc-900"}`}>{ratio.title}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4F46E5]" />}
                        </div>
                        <p className={`text-xs mt-0.5 ${isSelected ? "text-[#4F46E5]/70" : "text-zinc-500"}`}>
                          {ratio.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Composition Rules */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Composition Rules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {compositionRules.map((rule) => {
                  const isSelected = selectedComposition.includes(rule.id);
                  const Icon = rule.icon;
                  return (
                    <button
                      key={rule.id}
                      onClick={() => toggleComposition(rule.id)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected 
                          ? "border-[#4F46E5] bg-[#F8F9FF]" 
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <div className={`mt-0.5 ${isSelected ? "text-[#4F46E5]" : "text-zinc-400"}`}>
                        <Icon className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <span className={`text-sm font-bold block ${isSelected ? "text-[#4F46E5]" : "text-zinc-900"}`}>
                          {rule.title}
                        </span>
                        <p className={`text-xs mt-1 leading-snug ${isSelected ? "text-[#4F46E5]/70" : "text-zinc-500"}`}>
                          {rule.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Color Palette Section */}
        <div className="space-y-6 pt-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#F3F5FF] text-[#4F46E5] rounded-full mt-0.5">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Color Palette</h2>
              <p className="text-sm text-zinc-500">The dominant colors of your film.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-11">
            {customColors.length > 0 && (
              <button
                onClick={() => setSelectedPalette("Custom")}
                className={`flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPalette === "Custom" 
                    ? "border-[#4F46E5] bg-[#F8F9FF]" 
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${selectedPalette === "Custom" ? "text-[#4F46E5]" : "text-zinc-900"}`}>
                    Generated / Custom
                  </span>
                  {selectedPalette === "Custom" && <CheckCircle2 className="w-4 h-4 text-[#4F46E5]" />}
                </div>
                <div className="flex h-12 w-full rounded-lg overflow-hidden border border-zinc-200">
                  {customColors.map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c }} />)}
                </div>
              </button>
            )}
            {palettes.map((p) => {
              const isSelected = selectedPalette === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPalette(p.id)}
                  className={`flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected 
                      ? "border-[#4F46E5] bg-[#F8F9FF]" 
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isSelected ? "text-[#4F46E5]" : "text-zinc-900"}`}>
                      {p.id}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4F46E5]" />}
                  </div>
                  <div className="flex h-12 w-full rounded-lg overflow-hidden border border-zinc-200">
                    {p.colors.map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c }} />)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Area */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {isSkipped
              ? "Style Book skipped. Your screenplay, characters, and environments are preserved."
              : "Style Book is optional. Choose a style to apply to scenes or skip directly to Storyboard."}
          </div>
          <div className="flex items-center gap-3">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
              >
                <SkipForward className="w-4 h-4 text-zinc-500" />
                <span>Skip for Now</span>
              </button>
            )}
            {onProceed && (
              <button
                type="button"
                onClick={onProceed}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              >
                <span>Proceed to Storyboard</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
