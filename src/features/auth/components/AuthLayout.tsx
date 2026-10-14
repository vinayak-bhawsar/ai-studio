"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans text-zinc-900 selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* LEFT SIDE: Cinematic Promotional Panel */}
      <div className="relative w-full md:w-1/2 min-h-[220px] sm:min-h-[300px] md:h-screen md:sticky md:top-0 flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-16 overflow-hidden bg-zinc-950 text-white select-none">
        {/* Cinematic Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/auth-bg.jpg"
            alt="AI Video Studio Cinematic Background"
            fill
            priority
            className="object-cover object-center opacity-85 scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Dark Overlay Gradients for optimal text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-zinc-950/40 to-black/60" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/30 to-black/80" />
        </div>

        {/* TOP BRANDING */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center text-white transition-opacity hover:opacity-90"
          >
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1">
              AI MOVIES
              <span className="text-blue-500 font-extrabold text-xs sm:text-sm leading-none self-start mt-0.5">⁺</span>
            </span>
          </Link>
        </div>

        {/* MIDDLE HEADLINE & SUPPORTING TEXT */}
        <div className="relative z-10 my-6 sm:my-10 md:my-auto max-w-lg space-y-2.5 sm:space-y-4">
          <h1 className="text-2xl sm:text-4xl md:text-4xl lg:text-[52px] font-black uppercase tracking-tight text-white leading-[1.08] drop-shadow-md">
            MASTER THE
            <br />
            ART OF
            <br />
            AI CINEMA.
          </h1>
          <p className="text-zinc-300 text-xs sm:text-sm md:text-base font-normal leading-relaxed max-w-md">
            Join the world&apos;s most powerful AI-assisted cinematic production studio.
          </p>
        </div>

        {/* BOTTOM FOOTER (Desktop & Tablet) */}
        <div className="relative z-10 hidden md:flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400/90">
          <span>&copy; 2026 AI VIDEO STUDIO INC</span>
          <Link
            href="/privacy"
            className="hover:text-white transition-colors uppercase"
          >
            PRIVACY POLICY
          </Link>
          <Link
            href="/terms"
            className="hover:text-white transition-colors uppercase"
          >
            TERMS OF SERVICE
          </Link>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form Panel */}
      <div className="w-full md:w-1/2 min-h-[calc(100vh-220px)] md:min-h-screen flex flex-col justify-between items-center p-6 sm:p-10 md:p-12 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto my-auto py-4 sm:py-6">
          {children}
        </div>

        {/* BOTTOM FOOTER (Mobile Only) */}
        <div className="w-full max-w-[420px] mx-auto pt-6 border-t border-zinc-100 flex md:hidden flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span>&copy; 2026 AI VIDEO STUDIO</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-zinc-800 transition-colors">
              PRIVACY
            </Link>
            <Link href="/terms" className="hover:text-zinc-800 transition-colors">
              TERMS
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

