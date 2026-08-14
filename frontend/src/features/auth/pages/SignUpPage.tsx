import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toApiError } from "@/lib/api";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface SignUpPageProps {
  onNavigateSignIn?: () => void;
}

export default function SignUpPage({ onNavigateSignIn }: SignUpPageProps) {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }
    if (!agreeTerms) {
      setErrorMessage("Please agree to the Terms of Service.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const apiErr = toApiError(err);
      setErrorMessage(apiErr.message || "Failed to create account. Please check your information.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="card-animate w-full max-w-sm border-zinc-800 bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60 shadow-2xl">
      <CardHeader className="px-6 pt-6 pb-2 space-y-1">
        <CardTitle className="text-2xl font-semibold text-white">Create account</CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          Get started with your free account
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="px-6 py-2 flex flex-col gap-4">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="fullname" className="text-xs font-medium text-zinc-300">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none z-10" />
              <Input
                id="fullname"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="h-9.5 pl-9 text-xs bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="signup-email" className="text-xs font-medium text-zinc-300">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none z-10" />
              <Input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-9.5 pl-9 text-xs bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
              />
            </div>
          </div>

          {/* Side-by-side password inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="signup-password" className="text-xs font-medium text-zinc-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none z-10" />
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9.5 pl-8 pr-7 text-xs bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors z-10"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirm-password" className="text-xs font-medium text-zinc-300">
                Confirm
              </Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none z-10" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9.5 pl-8 pr-7 text-xs bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors z-10"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 py-1">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(!!checked)}
              className="h-4 w-4 border-zinc-700 data-[state=checked]:bg-zinc-50 data-[state=checked]:text-zinc-900"
            />
            <Label htmlFor="terms" className="text-zinc-400 text-xs leading-none cursor-pointer">
              I agree to the{" "}
              <a href="#" className="text-zinc-200 hover:underline font-medium">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-zinc-200 hover:underline font-medium">
                Privacy
              </a>
            </Label>
          </div>

          <Button type="submit" loading={submitting} className="w-full h-9.5 rounded-lg bg-zinc-50 text-zinc-900 hover:bg-zinc-200 text-xs font-semibold transition-colors mt-0.5">
            Create account
          </Button>

          <div className="relative my-2">
            <Separator className="bg-zinc-800" />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-zinc-900/90 px-2 text-[11px] uppercase tracking-widest text-zinc-500 font-medium">
              or
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-9.5 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-50 text-xs hover:bg-zinc-900/80 transition-colors"
            >
              <GithubIcon className="h-4 w-4 mr-2" />
              GitHub
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9.5 rounded-lg border-zinc-800 bg-zinc-950 text-zinc-50 text-xs hover:bg-zinc-900/80 transition-colors"
            >
              <GoogleIcon className="h-4 w-4 mr-2" />
              Google
            </Button>
          </div>
        </CardContent>
      </form>

      <CardFooter className="px-6 pt-4 pb-6 flex items-center justify-center text-xs text-zinc-400">
        Already have an account?
        <button
          type="button"
          onClick={onNavigateSignIn}
          className="ml-1.5 text-zinc-200 hover:underline font-medium"
        >
          Sign in
        </button>
      </CardFooter>
    </Card>
  );
}
