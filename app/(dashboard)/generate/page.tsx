"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Image as ImageIcon, Plus, RotateCcw, Sparkles, Trash2, Video } from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";

interface GenerationItem {
  id: string;
  type: "Image" | "Video";
  status: "success" | "error" | "processing";
  message?: string;
  url?: string;
  elapsedSeconds?: number;
}

const SAMPLE_SUGGESTIONS = [
  "A lighthouse on a cliff at golden hour, waves crashing, cinematic wide shot",
  "Vintage polaroid photo of an old diner on Route 66, neon sign glowing at twilight",
  "A cozy cabin interior in winter, fireplace glow, snow outside the window",
  "Macro shot of a dew drop on a spider web, morning sunlight, bokeh background",
];

export default function GeneratePage() {
  const { accessToken } = useAuth();
  const [activeCategory, setActiveCategory] = useState<"All" | "Images" | "Videos">("All");
  const [mediaType, setMediaType] = useState<"Image" | "Video">("Image");
  const [promptText, setPromptText] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [outputCount, setOutputCount] = useState("1 Image");
  const [isGenerating, setIsGenerating] = useState(false);

  // Real generations state (starts empty, no mock data)
  const [generations, setGenerations] = useState<GenerationItem[]>([]);

  // Timer tick effect for processing generations
  useEffect(() => {
    const hasProcessing = generations.some((g) => g.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      setGenerations((prev) =>
        prev.map((item) =>
          item.status === "processing"
            ? { ...item, elapsedSeconds: (item.elapsedSeconds || 0) + 1 }
            : item
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [generations]);

  const handleRemove = (id: string) => {
    setGenerations((prev) => prev.filter((item) => item.id !== id));
  };

  const handleGenerate = async () => {
    if (!promptText.trim() || isGenerating) return;

    setIsGenerating(true);
    const newGenId = `gen-${Date.now()}`;

    try {
      setGenerations((prev) => [
        {
          id: newGenId,
          type: mediaType,
          status: "processing",
          message: `Making ${mediaType.toLowerCase()}`,
          elapsedSeconds: 0,
        },
        ...prev,
      ]);
    } catch {
      setGenerations((prev) => [
        {
          id: newGenId,
          type: mediaType,
          status: "error",
          message: "Generation request failed. Please check your backend connection.",
        },
        ...prev,
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center px-4 py-3 sm:py-5 overflow-hidden select-none bg-white">
      {/* Top Section: Category Filter Tabs */}
      <div className="flex items-center justify-center gap-1 flex-shrink-0 mb-2">
        {(["All", "Images", "Videos"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === cat
                ? "bg-black text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Middle Content Area (Hero or Generations List) */}
      <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center min-h-0 py-1 overflow-y-auto">
        {generations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-h-full overflow-y-auto pr-1">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className={`border rounded-2xl p-5 flex flex-col items-center justify-center text-center min-h-[160px] transition-all ${
                  gen.status === "error"
                    ? "bg-red-50/50 border-red-200/80"
                    : gen.status === "processing"
                    ? "bg-zinc-100/70 border-zinc-200/80"
                    : "bg-white border-zinc-200"
                }`}
              >
                {gen.status === "error" ? (
                  <>
                    <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-2">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-700 mb-3 max-w-xs leading-relaxed">
                      {gen.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerate()}
                        className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-zinc-500" />
                        <span>Edit & retry</span>
                      </button>
                      <button
                        onClick={() => handleRemove(gen.id)}
                        className="p-1 bg-white border border-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors shadow-2xs cursor-pointer"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : gen.status === "processing" ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-xs font-bold text-zinc-700 mb-0.5">
                      Making {gen.type.toLowerCase()}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 font-medium">
                      0:
                      {((gen.elapsedSeconds || 0) % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-700">{gen.message}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center text-center my-auto py-1">
            {/* Top Sparkle Badge */}
            <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 mb-2 shadow-2xs flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>

            {/* Header Title */}
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">
              What do you want to make?
            </h2>

            {/* Subtitle */}
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-4">
              Describe it below and press Generate. Every image and video you make is saved here.
            </p>

            {/* 2x2 Suggestion Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              {SAMPLE_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setPromptText(suggestion)}
                  className="p-2.5 sm:p-3 bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-xl text-[11px] leading-relaxed text-zinc-700 font-medium text-left transition-all hover:shadow-2xs cursor-pointer hover:bg-zinc-50/50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Search & Generation Input Card (Non-overlapping Flex item) */}
      <div className="w-full max-w-2xl flex-shrink-0 bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-[20px] p-3 mt-2 z-20">
        {/* Top Controls: Media Type Tabs */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="bg-zinc-100/90 p-0.5 rounded-lg inline-flex items-center">
            <button
              type="button"
              onClick={() => setMediaType("Image")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mediaType === "Image"
                  ? "bg-white text-zinc-900 shadow-2xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType("Video")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mediaType === "Video"
                  ? "bg-white text-zinc-900 shadow-2xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
          </div>
        </div>

        {/* Input Row: Upload Box + Text Input */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <button
            type="button"
            className="w-10 h-10 flex-shrink-0 rounded-xl border border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-50/70 hover:bg-zinc-100 flex flex-col items-center justify-center text-zinc-400 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mb-0.5" />
            <span className="text-[8px] font-semibold text-zinc-500">
              + {mediaType === "Video" ? "Video" : "Image"}
            </span>
          </button>

          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder={`Describe the ${mediaType.toLowerCase()} you want...`}
            className="w-full text-xs text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-none py-1"
          />
        </div>

        {/* Bottom Options Row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-2">
            {/* Aspect Ratio Selector */}
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="bg-zinc-100/90 hover:bg-zinc-200/70 border border-zinc-200/40 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-700 focus:outline-none cursor-pointer"
            >
              <option value="16:9">📺 16:9</option>
              <option value="9:16">📱 9:16</option>
              <option value="1:1">⬛ 1:1</option>
              <option value="4:3">🖼️ 4:3</option>
            </select>

            {/* Output Count Selector */}
            <select
              value={outputCount}
              onChange={(e) => setOutputCount(e.target.value)}
              className="bg-zinc-100/90 hover:bg-zinc-200/70 border border-zinc-200/40 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-700 focus:outline-none cursor-pointer"
            >
              <option value="1 Image">🖼️ 1 Image</option>
              <option value="2 Images">🖼️ 2 Images</option>
              <option value="4 Images">🖼️ 4 Images</option>
            </select>
          </div>

          <div className="flex items-center ml-auto">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !promptText.trim()}
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Generate</span>
              <Sparkles className="w-3.5 h-3.5 text-blue-100" />
              <span>3</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
