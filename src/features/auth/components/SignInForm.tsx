"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

function SignInContent() {
  const searchParams = useSearchParams();
  const registeredSuccess = searchParams.get("registered") === "true";

  const { loginUser, error } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (!email.trim()) {
      setClientError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setClientError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setClientError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await loginUser({
        email: email.trim(),
        password,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = clientError || error;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-[34px] font-extrabold text-zinc-900 tracking-tight leading-tight">
          Welcome Back.
        </h2>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-zinc-500 font-normal">
          Sign in to access your cinematic workspace.
        </p>
      </div>

      {/* Success Alert if newly registered */}
      {registeredSuccess && !displayError && (
        <div
          role="status"
          className="mb-5 sm:mb-6 p-3 sm:p-3.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-medium text-emerald-700 animate-fadeIn"
        >
          Account created successfully! Please sign in with your credentials.
        </div>
      )}

      {/* Error Alert */}
      {displayError && (
        <div
          role="alert"
          className="mb-5 sm:mb-6 p-3 sm:p-3.5 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-600 animate-fadeIn"
        >
          {displayError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5"
          >
            STUDIO EMAIL ADDRESS
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@studio.com"
              className="w-full h-12 pl-10 pr-4 bg-white border border-zinc-200 rounded-md text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5"
          >
            PASSWORD
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 pl-10 pr-10 bg-white border border-zinc-200 rounded-md text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none p-1.5"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider rounded-md transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>SIGNING IN...</span>
            </>
          ) : (
            <span>SIGN IN TO STUDIO</span>
          )}
        </button>
      </form>

      {/* Footer Navigation Link */}
      <div className="mt-6 sm:mt-8 text-center text-xs text-zinc-500 font-normal">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider ml-1"
        >
          CREATE ACCOUNT
        </Link>
      </div>
    </div>
  );
}

export function SignInForm() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
