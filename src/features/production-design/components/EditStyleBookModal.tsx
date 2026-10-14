import { useState, useEffect } from "react";
import { X, Check, Loader2, Compass, Palette, Sun, Camera, Layers } from "lucide-react";
import { StyleBookContent } from "@/src/features/production-design/types/stylebook";

interface EditStyleBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: StyleBookContent | null;
  onSave: (data: StyleBookContent) => Promise<void>;
}

export function EditStyleBookModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}: EditStyleBookModalProps) {
  const [editState, setEditState] = useState<StyleBookContent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setEditState(JSON.parse(JSON.stringify(initialData)));
      } else {
        setEditState({
          aesthetic: { preset: "", description: "" },
          composition_and_framing: { aspect_ratio: "", composition_rules: [], framing: "", composition: "", shot_scale: "", camera_angle: "" },
          color_palette: { colors: ["#000000", "#ffffff"], description: "" },
          lighting: { style: "", intensity: "", description: "" },
          camera: { lens: "", movement: "", depth_of_field: "", description: "" },
          texture: { style: "", description: "" },
          mood: ""
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen || !editState) return null;

  const handleUpdate = (section: keyof StyleBookContent, field: string, value: any) => {
    if (section === 'mood') {
        setEditState({ ...editState, mood: value });
    } else {
        setEditState({
            ...editState,
            [section]: {
                ...(editState[section] as any),
                [field]: value
            }
        });
    }
  };

  const handleUpdateColor = (index: number, value: string) => {
    if (!editState.color_palette) return;
    const newColors = [...(editState.color_palette.colors || [])];
    newColors[index] = value;
    setEditState({
      ...editState,
      color_palette: {
        ...editState.color_palette,
        colors: newColors
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(editState);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              {initialData ? "Edit Style Book" : "Add Style Book Manually"}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Configure production design parameters
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="stylebook-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aesthetic Preset Card */}
              <div className="p-5 bg-zinc-50/70 border border-zinc-200/70 rounded-2xl space-y-3 md:col-span-2">
                <div className="flex items-center gap-2 font-bold text-xs text-zinc-900 mb-1">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Visual Aesthetic & Direction</span>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Preset</label>
                  <input
                    type="text"
                    value={editState.aesthetic?.preset || ''}
                    onChange={(e) => handleUpdate('aesthetic', 'preset', e.target.value)}
                    className="w-full bg-white border border-zinc-200 text-sm font-bold text-blue-950 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Description</label>
                  <textarea
                    value={editState.aesthetic?.description || ''}
                    onChange={(e) => handleUpdate('aesthetic', 'description', e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Mood</label>
                  <input
                    type="text"
                    value={editState.mood || ''}
                    onChange={(e) => handleUpdate('mood', 'mood', e.target.value)}
                    className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Color Palette Card */}
              <div className="p-5 bg-zinc-50/70 border border-zinc-200/70 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                  <Palette className="w-4 h-4 text-blue-600" />
                  <span>Color Palette</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(editState.color_palette?.colors || ["#000000", "#ffffff"]).map((hex: string, i: number) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <label className="relative cursor-pointer group">
                        <input
                          type="color"
                          value={hex}
                          onChange={(e) => handleUpdateColor(i, e.target.value)}
                          className="absolute opacity-0 w-0 h-0"
                        />
                        <div
                          className="w-10 h-10 rounded-xl border-2 border-zinc-200/50 shadow-2xs group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: hex }}
                        />
                      </label>
                      <input
                        type="text"
                        value={hex}
                        onChange={(e) => handleUpdateColor(i, e.target.value)}
                        className="w-16 text-[10px] font-mono text-center text-zinc-600 uppercase bg-transparent border-b border-transparent focus:border-zinc-300 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Palette Description</label>
                  <textarea
                    value={editState.color_palette?.description || ''}
                    onChange={(e) => handleUpdate('color_palette', 'description', e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Lighting Atmosphere Card */}
              <div className="p-5 bg-zinc-50/70 border border-zinc-200/70 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                  <Sun className="w-4 h-4 text-blue-600" />
                  <span>Lighting & Atmosphere</span>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Style</label>
                  <input
                    type="text"
                    value={editState.lighting?.style || ''}
                    onChange={(e) => handleUpdate('lighting', 'style', e.target.value)}
                    className="w-full bg-white border border-zinc-200 text-xs font-bold text-zinc-800 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Intensity</label>
                    <input
                      type="text"
                      value={editState.lighting?.intensity || ''}
                      onChange={(e) => handleUpdate('lighting', 'intensity', e.target.value)}
                      className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Description</label>
                  <textarea
                    value={editState.lighting?.description || ''}
                    onChange={(e) => handleUpdate('lighting', 'description', e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Camera Cinematography Card */}
              <div className="p-5 bg-zinc-50/70 border border-zinc-200/70 rounded-2xl space-y-3 md:col-span-2">
                <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Camera & Lens Specifications</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Lens Type</label>
                    <input
                      type="text"
                      value={editState.camera?.lens || ''}
                      onChange={(e) => handleUpdate('camera', 'lens', e.target.value)}
                      className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Movement</label>
                    <input
                      type="text"
                      value={editState.camera?.movement || ''}
                      onChange={(e) => handleUpdate('camera', 'movement', e.target.value)}
                      className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Depth of Field</label>
                    <input
                      type="text"
                      value={editState.camera?.depth_of_field || ''}
                      onChange={(e) => handleUpdate('camera', 'depth_of_field', e.target.value)}
                      className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Description</label>
                  <textarea
                    value={editState.camera?.description || ''}
                    onChange={(e) => handleUpdate('camera', 'description', e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Composition & Texture Card */}
              <div className="p-5 bg-zinc-50/70 border border-zinc-200/70 rounded-2xl space-y-3 md:col-span-2">
                <div className="flex items-center gap-2 font-bold text-xs text-zinc-900 mb-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Composition, Framing & Texture</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Aspect Ratio</label>
                      <input
                        type="text"
                        value={editState.composition_and_framing?.aspect_ratio || ''}
                        onChange={(e) => handleUpdate('composition_and_framing', 'aspect_ratio', e.target.value)}
                        className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Composition Rules</label>
                      <input
                        type="text"
                        value={editState.composition_and_framing?.composition_rules?.join(', ') || ''}
                        onChange={(e) => handleUpdate('composition_and_framing', 'composition_rules', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="Rule of thirds, Golden ratio, etc."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Framing</label>
                      <input
                        type="text"
                        value={editState.composition_and_framing?.framing || ''}
                        onChange={(e) => handleUpdate('composition_and_framing', 'framing', e.target.value)}
                        className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Shot Scale</label>
                      <input
                        type="text"
                        value={editState.composition_and_framing?.shot_scale || ''}
                        onChange={(e) => handleUpdate('composition_and_framing', 'shot_scale', e.target.value)}
                        className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Camera Angle</label>
                      <input
                        type="text"
                        value={editState.composition_and_framing?.camera_angle || ''}
                        onChange={(e) => handleUpdate('composition_and_framing', 'camera_angle', e.target.value)}
                        className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Composition Description</label>
                      <input
                        type="text"
                        value={editState.composition_and_framing?.composition || ''}
                        onChange={(e) => handleUpdate('composition_and_framing', 'composition', e.target.value)}
                        className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Texture / Grain Style</label>
                      <input
                        type="text"
                        value={editState.texture?.style || ''}
                        onChange={(e) => handleUpdate('texture', 'style', e.target.value)}
                        className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Texture Description</label>
                      <textarea
                        value={editState.texture?.description || ''}
                        onChange={(e) => handleUpdate('texture', 'description', e.target.value)}
                        rows={4}
                        className="w-full bg-white border border-zinc-200 text-xs text-zinc-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="stylebook-form"
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Save Style Book</span>
          </button>
        </div>
      </div>
    </div>
  );
}
