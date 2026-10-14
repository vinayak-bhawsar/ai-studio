"use client";

import { useState } from "react";
import { X, Loader2, Film } from "lucide-react";
import { SceneCreateRequest, SceneResponse, SceneUpdateRequest } from "../types/storyboard";

interface SceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SceneCreateRequest | SceneUpdateRequest) => Promise<void>;
  initialData?: SceneResponse | null;
  mode: "create" | "edit";
}

export function SceneModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: SceneModalProps) {
  const [heading, setHeading] = useState(initialData?.heading || "");
  const [timeOfDay, setTimeOfDay] = useState(initialData?.time_of_day || "DAY");
  const [description, setDescription] = useState(initialData?.description || "");
  const [narrativePurpose, setNarrativePurpose] = useState(
    initialData?.narrative_purpose || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heading.trim()) {
      setError("Scene heading is required (e.g., EXT. RAIN-SLICKED ALLEYWAY - NIGHT)");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        heading: heading.trim(),
        time_of_day: timeOfDay.trim() || null,
        description: description.trim() || null,
        narrative_purpose: narrativePurpose.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save scene";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {mode === "create" ? "Add New Scene" : "Edit Scene"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Scene Heading *
            </label>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="e.g. EXT. CYBER ALLEYWAY - MIDNIGHT"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Time of Day
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="DAY">DAY</option>
                <option value="NIGHT">NIGHT</option>
                <option value="DUSK">DUSK</option>
                <option value="DAWN">DAWN</option>
                <option value="CONTINUOUS">CONTINUOUS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Atmospheric setting and general action for this scene..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Narrative Purpose
            </label>
            <input
              type="text"
              value={narrativePurpose}
              onChange={(e) => setNarrativePurpose(e.target.value)}
              placeholder="Why this scene matters to the overarching plot..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{mode === "create" ? "Add Scene" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
