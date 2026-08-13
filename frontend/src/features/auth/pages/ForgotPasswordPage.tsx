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
import { Label } from "@/components/ui/label";
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
    <Card className="card-animate w-full max-w-sm border-zinc-800 bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60 shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold text-white">Reset password</CardTitle>
        <CardDescription className="text-zinc-400">
          {submitted
            ? "Check your inbox for reset instructions"
            : "Enter your email to receive a password reset link"}
        </CardDescription>
      </CardHeader>

      {submitted ? (
        <CardContent className="grid gap-5 text-center py-4">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-100 border border-zinc-700">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm text-zinc-300">
              We sent a password reset link to <br />
              <span className="font-semibold text-zinc-100">{email}</span>
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="w-full h-10 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-50 hover:bg-zinc-900/80 transition-colors"
          >
            Resend Email
          </Button>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="forgot-email" className="text-zinc-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-10 rounded-lg bg-zinc-50 text-zinc-900 hover:bg-zinc-200 font-medium transition-colors">
              Send Reset Link
            </Button>
          </CardContent>
        </form>
      )}

      <CardFooter className="flex items-center justify-center text-sm text-zinc-400">
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
