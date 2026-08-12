import React, { useState } from "react";
import { AuthShell } from "../components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

interface ForgotPasswordPageProps {
  onNavigateSignIn?: () => void;
}

export default function ForgotPasswordPage({ onNavigateSignIn }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle={
        submitted
          ? "Check your inbox for reset instructions"
          : "Enter your email to receive a password reset link"
      }
      footer={
        <button
          type="button"
          onClick={onNavigateSignIn}
          className="inline-flex items-center text-white hover:text-lime transition-colors font-bold uppercase tracking-wider text-xs"
        >
          <ArrowLeft className="h-4 w-4 mr-2 stroke-[2.5]" />
          Back to Sign in
        </button>
      }
    >
      {submitted ? (
        <div className="grid gap-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-14 w-14 border-2 border-lime bg-lime/10 flex items-center justify-center text-lime rounded-md">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-sm font-bold uppercase tracking-wider text-white">
              We sent a password reset link to <br />
              <span className="text-lime">{email}</span>
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="w-full"
          >
            Resend Email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Input
              id="forgot-email"
              type="email"
              required
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="h-4 w-4 text-muted pointer-events-none" />}
            />
          </div>

          <Button type="submit" className="w-full mt-2">
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
