"use client";

import React from "react";
import { Sparkles, Loader2, Users, MapPin, Palette, Layers, Video, FileText } from "lucide-react";

/**
 * Screenplay Document Shimmer Skeleton
 */
export function ScreenplayShimmer({ message = "AI is writing and formatting your cinematic screenplay..." }: { message?: string }) {
  return (
    <div className="w-full h-full overflow-y-auto p-6 sm:p-12 bg-white dark:bg-zinc-950 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8 pb-16">
        {/* Status Indicator */}
        <div className="flex items-center justify-between p-4 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-100">Screenplay in Progress</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  Generating
                </span>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">{message}</p>
            </div>
          </div>
        </div>

        {/* Paper Document Preview Skeleton */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 font-mono">
          {/* Title & Metadata */}
          <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="h-8 w-64 rounded-xl shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-40 rounded-lg shimmer-wave bg-zinc-100 dark:bg-zinc-800/80" />
            <div className="h-3 w-48 rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
          </div>

          {/* Scene 1 Heading */}
          <div className="space-y-4">
            <div className="h-6 w-72 rounded-lg shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
            {/* Action Lines */}
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
              <div className="h-3.5 w-[92%] rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
              <div className="h-3.5 w-[85%] rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
            </div>
          </div>

          {/* Dialogue Block */}
          <div className="max-w-md mx-auto space-y-2 text-center py-2">
            <div className="h-4 w-32 mx-auto rounded-md shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-28 mx-auto rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
            <div className="h-3.5 w-full rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
            <div className="h-3.5 w-[80%] mx-auto rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
          </div>

          {/* Scene 2 Heading */}
          <div className="space-y-4 pt-4">
            <div className="h-6 w-80 rounded-lg shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-2">
              <div className="h-3.5 w-[95%] rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
              <div className="h-3.5 w-[88%] rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
            </div>
          </div>

          {/* Dialogue Block 2 */}
          <div className="max-w-md mx-auto space-y-2 text-center py-2">
            <div className="h-4 w-36 mx-auto rounded-md shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3.5 w-[90%] mx-auto rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Character Casting Shimmer Skeleton
 */
export function CharacterCastingShimmer({ loadingMessage = "Preparing character cards from screenplay..." }: { loadingMessage?: string }) {
  return (
    <div className="w-full space-y-6">
      {/* Studio Header Control Skeleton */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-sm">
            <Users className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Character Casting Studio
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>AI Generating</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {loadingMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 4 Character Card Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs flex flex-col"
          >
            {/* Portrait Image Skeleton */}
            <div className="aspect-[3/4] w-full relative shimmer-wave bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-600">
                <Users className="w-8 h-8 opacity-40 animate-pulse" />
                <span className="text-[10px] font-medium opacity-60">Extracting Roster...</span>
              </div>
            </div>

            {/* Card Content Skeleton */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                {/* Name & Tag */}
                <div className="flex items-center justify-between">
                  <div className="h-5 w-28 rounded-lg shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-14 rounded-full shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
                </div>
                {/* Description lines */}
                <div className="h-3 w-full rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
                <div className="h-3 w-[75%] rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
              </div>

              {/* Trait badges */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="h-4 w-14 rounded-full shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
                <div className="h-4 w-16 rounded-full shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Environment Casting Shimmer Skeleton
 */
export function EnvironmentCastingShimmer({ loadingMessage = "Preparing environment cards from screenplay..." }: { loadingMessage?: string }) {
  return (
    <div className="w-full space-y-6">
      {/* Studio Header Control Skeleton */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-sm">
            <MapPin className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Environment Casting Studio
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>AI Generating</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {loadingMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 4 Environment Card Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs flex flex-col"
          >
            {/* 16:9 Landscape Image Skeleton */}
            <div className="aspect-[16/9] w-full relative shimmer-wave bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-600">
                <MapPin className="w-8 h-8 opacity-40 animate-pulse" />
                <span className="text-[10px] font-medium opacity-60">Extracting Location...</span>
              </div>
            </div>

            {/* Card Content Skeleton */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-36 rounded-lg shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-16 rounded-full shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
                </div>
                <div className="h-3 w-full rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
                <div className="h-3 w-[80%] rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="h-4 w-16 rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
                <div className="h-4 w-20 rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/70" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Style Book Shimmer Skeleton
 */
export function StyleBookShimmer({ message = "AI is defining your film's aesthetic, framing, and color palette..." }: { message?: string }) {
  return (
    <div className="flex-1 overflow-y-auto p-8 sm:p-12 flex flex-col items-center bg-white dark:bg-zinc-950">
      <div className="max-w-4xl w-full space-y-10 pb-20">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[28px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Style Book</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 rounded-full border border-indigo-200 dark:border-indigo-800">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Generating Visual Aesthetic</span>
              </span>
            </div>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Section 1: Aesthetic Presets Shimmer */}
        <div className="space-y-4">
          <div className="h-5 w-40 rounded-lg shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="aspect-[4/3] rounded-xl shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-24 rounded-md shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-full rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Aspect Ratio & Framing Shimmer */}
        <div className="space-y-4">
          <div className="h-5 w-48 rounded-lg shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="h-10 w-16 rounded-lg shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3.5 w-16 rounded-md shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Color Palette Shimmer */}
        <div className="space-y-4">
          <div className="h-5 w-36 rounded-lg shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="h-4 w-32 rounded-md shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((c) => (
                    <div key={c} className="w-10 h-10 rounded-xl shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Storyboard Sequences Shimmer Skeleton
 */
export function StoryboardShimmer({ message = "Translating screenplay into visual scenes and shot prompts..." }: { message?: string }) {
  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 py-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-sm">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Storyboard Studio
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>AI Generating Scenes</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {message}
            </p>
          </div>
        </div>
      </div>

      {/* Scene 1 Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-zinc-100/80 dark:bg-zinc-900 rounded-xl">
          <div className="h-5 w-48 rounded-lg shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-20 rounded-md shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((shot) => (
            <div key={shot} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs flex flex-col">
              <div className="aspect-[16/9] w-full shimmer-wave bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center">
                <Layers className="w-7 h-7 text-zinc-300 dark:text-zinc-600 animate-pulse" />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 rounded-md shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-16 rounded-full shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
                </div>
                <div className="h-3 w-full rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
                <div className="h-3 w-[70%] rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scene 2 Skeleton */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between p-3 bg-zinc-100/80 dark:bg-zinc-900 rounded-xl">
          <div className="h-5 w-52 rounded-lg shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-20 rounded-md shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[4, 5, 6].map((shot) => (
            <div key={shot} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs flex flex-col">
              <div className="aspect-[16/9] w-full shimmer-wave bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center">
                <Layers className="w-7 h-7 text-zinc-300 dark:text-zinc-600 animate-pulse" />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 rounded-md shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-16 rounded-full shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
                </div>
                <div className="h-3 w-full rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Production Studio (Shots) Shimmer Skeleton
 */
export function ProductionStudioShimmer({ message = "Connecting to Production Studio and preparing timeline shots..." }: { message?: string }) {
  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 py-4">
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-sm">
            <Video className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Production Studio
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Initializing Studio</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {message}
            </p>
          </div>
        </div>
      </div>

      {/* Production Viewport & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Shots Strip Skeleton (3 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4">
          <div className="h-5 w-32 rounded-lg shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="p-3 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl flex items-center gap-3 bg-zinc-50/60 dark:bg-zinc-900/40">
                <div className="w-16 h-12 rounded-xl shimmer-wave bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-24 rounded-md shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-32 rounded-md shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Main Stage Viewport Skeleton (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="aspect-[16/9] w-full rounded-3xl shimmer-wave bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-600">
              <Video className="w-10 h-10 animate-pulse" />
              <span className="text-xs font-semibold">Configuring Camera & Rendering Viewport...</span>
            </div>
          </div>

          {/* Prompt & Camera Controls Skeleton */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="h-4 w-36 rounded-md shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-14 w-full rounded-2xl shimmer-wave bg-zinc-100 dark:bg-zinc-800/60" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-8 w-40 rounded-xl shimmer-wave bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-9 w-28 rounded-xl shimmer-wave bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
