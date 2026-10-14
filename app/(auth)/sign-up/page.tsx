import { Metadata } from "next";
import { AuthLayout } from "@/src/features/auth/components/AuthLayout";
import { SignUpForm } from "@/src/features/auth/components/SignUpForm";

export const metadata: Metadata = {
  title: "Sign Up - AI Video Studio",
  description: "Create your creative identity to begin your production with AI Video Studio.",
};

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}
