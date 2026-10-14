"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Clock, Download, Loader2, Lock, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { useProjects } from "@/src/features/projects/hooks/useProjects";
import { characterService } from "@/src/features/characters/services/characterService";
import { Character } from "@/src/features/characters/types/character";

export default function AssetsPage() {
  const { accessToken } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersLoading, setCharactersLoading] = useState<boolean>(false);

  // Set initial selected project when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Fetch characters for selected project from backend API
  useEffect(() => {
    let isMounted = true;
    if (!selectedProjectId || !accessToken) return;

    setCharactersLoading(true);
    characterService
      .getCharacters(selectedProjectId, accessToken)
      .then((res) => {
        if (!isMounted) return;
        setCharacters(res || []);
      })
      .catch(() => {
        if (isMounted) setCharacters([]);
      })
      .finally(() => {
        if (isMounted) setCharactersLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProjectId, accessToken]);

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-white select-none">
      {/* Left Sub-sidebar: ARCHIVES */}
      <div className="w-full md:w-[220px] bg-zinc-50/60 border-r border-zinc-200/80 p-4 flex flex-col justify-between flex-shrink-0 h-full overflow-y-auto">
        <div>
          <div className="flex items-center justify-between px-2 mb-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <span>ARCHIVES</span>
            <Clock className="w-3.5 h-3.5" />
          </div>

          {projectsLoading ? (
            <div className="p-4 flex items-center justify-center text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-1">
              {projects.map((proj) => {
                const isActive = selectedProjectId === proj.id;
                const formattedDate = new Date(proj.created_at).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                );

                return (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-50/80 border border-blue-200/80 text-blue-900 shadow-2xs"
                        : "hover:bg-zinc-100 text-zinc-700 border border-transparent"
                    }`}
                  >
                    <h4 className="text-xs font-bold leading-tight mb-0.5 truncate">
                      {proj.title}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-normal">
                      {formattedDate}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-[11px] text-zinc-400 text-center">
              No projects created yet.
            </div>
          )}
        </div>

        {/* Bottom Current Plan Box */}
        <div className="pt-4 border-t border-zinc-200/60 mt-auto">
          <div className="bg-white border border-zinc-200/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                CURRENT PLAN
              </span>
              <span className="text-xs font-bold text-zinc-800">Free</span>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
              FREE
            </span>
          </div>
        </div>
      </div>

      {/* Right Main Panel */}
      <div className="flex-1 bg-white p-6 sm:p-8 lg:p-10 h-full overflow-y-auto">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
              ARCHIVE SUITE
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight truncate">
              {activeProject ? activeProject.title : "Select a Project"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="h-8 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-400 flex items-center gap-1.5 cursor-not-allowed">
              <Download className="w-3.5 h-3.5" />
              <span>Export Visuals</span>
            </button>

            <button className="h-8 px-3.5 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Upgrade to Pro</span>
            </button>
          </div>
        </div>

        {/* CAST & CHARACTERS Section */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-6">
            <Users className="w-4 h-4" />
            <span>CAST & CHARACTERS</span>
          </div>

          {charactersLoading ? (
            <div className="flex items-center justify-center p-12 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : characters.length > 0 ? (
            /* Character Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="bg-white border border-zinc-200/80 rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="grid grid-cols-3 gap-1 mb-3 rounded-xl overflow-hidden bg-zinc-900 h-28 relative">
                    {((char.reference_images && char.reference_images.length > 0
                      ? char.reference_images
                      : ["/images/auth-bg.jpg", "/images/auth-bg.jpg", "/images/auth-bg.jpg"]
                    ) as string[]).map((img: string, i: number) => (
                      <div key={i} className="relative h-full w-full">
                        <Image
                          src={img}
                          alt={char.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 33vw, 20vw"
                        />
                      </div>
                    ))}
                  </div>

                  <h4 className="text-xs font-bold text-zinc-900 group-hover:text-blue-600 transition-colors px-1 truncate">
                    {char.name}
                  </h4>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-xl p-10 border border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-400 mb-3 shadow-2xs">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 mb-1">
                No Character Sheets Found
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                Character sheets generated during pre-production or scripting will automatically appear in this archive.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
