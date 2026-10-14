import { Metadata } from "next";
import { AuthLayout } from "@/src/features/auth/components/AuthLayout";
import { SignInForm } from "@/src/features/auth/components/SignInForm";

export const metadata: Metadata = {
  title: "Sign In - AI Video Studio",
  description: "Sign in to access your cinematic workspace with AI Video Studio.",
};

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}
