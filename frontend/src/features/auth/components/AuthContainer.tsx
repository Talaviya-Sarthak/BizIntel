import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthBackground from "./AuthBackground";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import { AnimatedState } from "../../../components/motion";
import { TrendingUp, Database, Sparkles, ShieldCheck } from "lucide-react";

export type AuthMode = "login" | "signup" | "forgot-password";

interface AuthContainerProps {
  initialMode?: AuthMode;
}

export default function AuthContainer({ initialMode = "login" }: AuthContainerProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/signup") {
      setMode("signup");
    } else if (location.pathname === "/forgot-password") {
      setMode("forgot-password");
    } else if (location.pathname === "/signin") {
      setMode("login");
    } else {
      setMode(initialMode);
    }
  }, [location.pathname, initialMode]);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    if (newMode === "login") {
      navigate("/signin");
    } else if (newMode === "signup") {
      navigate("/signup");
    } else if (newMode === "forgot-password") {
      navigate("/forgot-password");
    }
  };

  return (
    <AuthBackground activeTab={mode} onTabChange={handleModeChange}>
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-zinc-900/80 backdrop-blur-xl shadow-2xl overflow-hidden my-auto">
        {/* Left Side Brand Showcase Panel */}
        <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-8 overflow-hidden bg-zinc-950 border-r border-zinc-800/80">
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0">
            <img
              src="/brand/bizintel_cinematic_hero.jpg"
              alt="BizIntel Enterprise Intelligence"
              className="size-full object-cover object-center opacity-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/40 pointer-events-none" />
          </div>

          {/* Top Pill / Badge */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-zinc-300 backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
              BizIntel Enterprise
            </div>
          </div>

          {/* Middle Content */}
          <div className="relative z-10 my-auto py-6">
            <h2 className="text-2xl font-bold tracking-tight text-white font-display uppercase">
              AI-Powered Enterprise Intelligence
            </h2>
            <p className="mt-2 text-xs text-zinc-300 leading-relaxed font-normal">
              Unified strategy backtesting, DataMart SQL analytics, and retail AI decision support in a single governed workspace.
            </p>

            {/* 3 Capabilities Bullet Points */}
            <div className="mt-6 flex flex-col gap-2.5 text-xs text-zinc-200">
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="size-3.5" />
                </div>
                <span className="font-medium text-[11px]">Deterministic Strategy Backtesting</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Database className="size-3.5" />
                </div>
                <span className="font-medium text-[11px]">Real-Time DataMart SQL Analytics</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-[#d2f831]/10 text-[#d2f831] border border-[#d2f831]/20">
                  <Sparkles className="size-3.5" />
                </div>
                <span className="font-medium text-[11px]">Autonomous Retail AI Copilot</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>JWT &amp; AES-256 Encrypted</span>
            </div>
            <span className="text-zinc-500">v2.4</span>
          </div>
        </div>

        {/* Right Side Form Panel */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-8 bg-zinc-900/40">
          <AnimatedState stateKey={mode} transitionType="fade-slide" duration={0.22} className="w-full max-w-sm mx-auto">
            {mode === "login" && (
              <LoginPage
                onNavigateSignUp={() => handleModeChange("signup")}
                onNavigateForgotPassword={() => handleModeChange("forgot-password")}
              />
            )}
            {mode === "signup" && (
              <SignUpPage onNavigateSignIn={() => handleModeChange("login")} />
            )}
            {mode === "forgot-password" && (
              <ForgotPasswordPage onNavigateSignIn={() => handleModeChange("login")} />
            )}
          </AnimatedState>
        </div>
      </div>
    </AuthBackground>
  );
}
