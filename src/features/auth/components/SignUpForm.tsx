"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function SignUpForm() {
  const { registerUser, error } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    // Form Validation
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
      setClientError("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      setClientError("Password must be at least 8 characters long.");
      return;
    }

    if (!agreeTerms) {
      setClientError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({
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
          Get Started.
        </h2>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-zinc-500 font-normal">
          Create your creative identity to begin your production.
        </p>
      </div>

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
              autoComplete="new-password"
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

        {/* Terms Checkbox */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer flex-shrink-0"
          />
          <label htmlFor="terms" className="text-xs text-zinc-500 cursor-pointer leading-tight">
            I agree to the{" "}
            <Link
              href="/terms"
              className="font-semibold text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-semibold text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
            >
              Privacy Policy
            </Link>
          </label>
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
              <span>CREATING ACCOUNT...</span>
            </>
          ) : (
            <span>CREATE MASTER ACCOUNT</span>
          )}
        </button>
      </form>

      {/* Footer Navigation Link */}
      <div className="mt-6 sm:mt-8 text-center text-xs text-zinc-500 font-normal">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider ml-1"
        >
          SIGN IN
        </Link>
      </div>
    </div>
  );
}
