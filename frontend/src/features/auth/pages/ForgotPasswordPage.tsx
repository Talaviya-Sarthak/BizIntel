import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
    <Card className="card-animate w-full max-w-sm border-zinc-800 bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60 shadow-2xl p-6">
      <CardHeader className="p-0 mb-5 space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight text-white">Reset password</CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          {submitted
            ? "Check your inbox for reset instructions"
            : "Enter your email to receive a password reset link"}
        </CardDescription>
      </CardHeader>

      {submitted ? (
        <CardContent className="p-0 flex flex-col items-center text-center py-2 gap-4">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-100 border border-zinc-700">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-xs text-zinc-300">
              We sent a password reset link to <br />
              <span className="font-semibold text-zinc-100 text-sm">{email}</span>
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="w-full h-9.5 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-50 text-xs hover:bg-zinc-900 transition-colors"
          >
            Resend Email
          </Button>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="p-0 flex flex-col gap-4">
            <Input
              id="forgot-email"
              type="email"
              label="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              icon={<Mail className="h-4 w-4 text-zinc-500" />}
            />

            <Button type="submit" className="w-full h-9.5 mt-1 rounded-lg bg-zinc-50 text-zinc-900 hover:bg-zinc-200 text-xs font-medium transition-colors">
              Send Reset Link
            </Button>
          </CardContent>
        </form>
      )}

      <CardFooter className="p-0 mt-5 pt-0 flex items-center justify-center text-xs text-zinc-400">
        <button
          type="button"
          onClick={onNavigateSignIn}
          className="inline-flex items-center text-zinc-300 hover:text-zinc-100 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Sign in
        </button>
      </CardFooter>
    </Card>
  );
}
