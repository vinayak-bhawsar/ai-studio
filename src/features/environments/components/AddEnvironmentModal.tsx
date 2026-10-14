"use client";

import { useState } from "react";
import { X, MapPin, Loader2, Sparkles } from "lucide-react";

interface AddEnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    environment_type: string;
    time_of_day: string;
    description: string;
    architecture: string;
    lighting: string;
    materials: string;
    atmosphere: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddEnvironmentModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AddEnvironmentModalProps) {
  const [name, setName] = useState("");
  const [environmentType, setEnvironmentType] = useState("Interior");
  const [timeOfDay, setTimeOfDay] = useState("Daylight");
  const [description, setDescription] = useState("");
  const [architecture, setArchitecture] = useState("");
  const [lighting, setLighting] = useState("");
  const [materials, setMaterials] = useState("");
  const [atmosphere, setAtmosphere] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Location name is required.");
      return;
    }
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        environment_type: environmentType.trim() || "Interior",
        time_of_day: timeOfDay.trim() || "Daylight",
        description: description.trim(),
        architecture: architecture.trim(),
        lighting: lighting.trim(),
        materials: materials.trim(),
        atmosphere: atmosphere.trim(),
      });
      // Reset form
      setName("");
      setEnvironmentType("Interior");
      setTimeOfDay("Daylight");
      setDescription("");
      setArchitecture("");
      setLighting("");
      setMaterials("");
      setAtmosphere("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to add environment location.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/60">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                Manually Add Environment
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Define environmental architecture, lighting, materials, and atmosphere for Nano Banana 2.1 casting.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Location / Set Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cyberpunk Alleyway"
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600 shadow-2xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Environment Type
              </label>
              <select
                value={environmentType}
                onChange={(e) => setEnvironmentType(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
              >
                <option value="Interior">Interior</option>
                <option value="Exterior">Exterior</option>
                <option value="Studio Set">Studio Set</option>
                <option value="Natural Landscape">Natural Landscape</option>
                <option value="Urban Setting">Urban Setting</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Time of Day / Atmosphere
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
              >
                <option value="Daylight">Daylight</option>
                <option value="Golden Hour">Golden Hour</option>
                <option value="Sunset">Sunset</option>
                <option value="Night">Night</option>
                <option value="Neon Dawn">Neon Dawn</option>
                <option value="Overcast">Overcast</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Short Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. A neon-drenched alleyway with wet asphalt reflective reflections"
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Architecture & Structure
              </label>
              <textarea
                rows={2}
                value={architecture}
                onChange={(e) => setArchitecture(e.target.value)}
                placeholder="e.g. High-density futuristic skyscrapers, exposed pipes, steel fire escapes..."
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600 shadow-2xs resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Lighting & Color
              </label>
              <textarea
                rows={2}
                value={lighting}
                onChange={(e) => setLighting(e.target.value)}
                placeholder="e.g. Cyan and magenta neon signs casting vivid reflections on puddles..."
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600 shadow-2xs resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Materials & Textures
              </label>
              <textarea
                rows={2}
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="e.g. Wet asphalt, rusted corrugated metal, glass panels..."
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600 shadow-2xs resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Mood & Atmosphere
              </label>
              <textarea
                rows={2}
                value={atmosphere}
                onChange={(e) => setAtmosphere(e.target.value)}
                placeholder="e.g. Tense, mysterious, foggy night ambience..."
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600 shadow-2xs resize-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Add Environment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
