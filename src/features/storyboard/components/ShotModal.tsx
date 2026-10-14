"use client";

import { useState } from "react";
import { X, Loader2, Clapperboard } from "lucide-react";
import { ShotCreateRequest, ShotResponse, ShotUpdateRequest } from "../types/storyboard";

interface ShotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShotCreateRequest | ShotUpdateRequest) => Promise<void>;
  initialData?: ShotResponse | null;
  mode: "create" | "edit";
  sceneHeading?: string;
}

export function ShotModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  sceneHeading,
}: ShotModalProps) {
  const [description, setDescription] = useState(initialData?.description || "");
  const [action, setAction] = useState(initialData?.action || "");
  const [cameraFraming, setCameraFraming] = useState(
    initialData?.camera_framing || "Medium Shot"
  );
  const [cameraMovement, setCameraMovement] = useState(
    initialData?.camera_movement || "Static"
  );
  const [cameraAngle, setCameraAngle] = useState(
    initialData?.camera_angle || "Eye Level"
  );
  const [composition, setComposition] = useState(
    initialData?.composition || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Visual description is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        description: description.trim(),
        action: action.trim() || null,
        camera_framing: cameraFraming || null,
        camera_movement: cameraMovement || null,
        camera_angle: cameraAngle || null,
        composition: composition.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save shot";
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
            <Clapperboard className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {mode === "create" ? "Add Visual Shot" : `Edit Shot #${initialData?.shot_number || ""}`}
              </h3>
              {sceneHeading && (
                <p className="text-[11px] text-zinc-500 font-mono truncate max-w-xs">
                  {sceneHeading}
                </p>
              )}
            </div>
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
              Visual Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What we see in the frame..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Character / Object Action
            </label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Specific motion or event in this shot..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Framing
              </label>
              <select
                value={cameraFraming}
                onChange={(e) => setCameraFraming(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="Wide Shot">Wide Shot</option>
                <option value="Extreme Wide">Extreme Wide</option>
                <option value="Medium Shot">Medium Shot</option>
                <option value="Close-Up">Close-Up</option>
                <option value="Extreme Close-Up">Extreme Close-Up</option>
                <option value="Over-The-Shoulder">Over-The-Shoulder</option>
                <option value="Point of View">Point of View</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Movement
              </label>
              <select
                value={cameraMovement}
                onChange={(e) => setCameraMovement(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="Static">Static</option>
                <option value="Pan">Pan</option>
                <option value="Tilt">Tilt</option>
                <option value="Tracking">Tracking</option>
                <option value="Dolly In">Dolly In</option>
                <option value="Dolly Out">Dolly Out</option>
                <option value="Crane Down">Crane Down</option>
                <option value="Handheld">Handheld</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Angle
              </label>
              <select
                value={cameraAngle}
                onChange={(e) => setCameraAngle(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="Eye Level">Eye Level</option>
                <option value="Low Angle">Low Angle</option>
                <option value="High Angle">High Angle</option>
                <option value="Dutch Angle">Dutch Angle</option>
                <option value="Birds Eye">Birds Eye</option>
                <option value="Worms Eye">Worms Eye</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Composition & Lighting Guide
            </label>
            <input
              type="text"
              value={composition}
              onChange={(e) => setComposition(e.target.value)}
              placeholder="e.g. Neon rim light, rule of thirds, subject in right third..."
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
              <span>{mode === "create" ? "Add Shot" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
