import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

interface AuthBackgroundProps {
  children: React.ReactNode;
}

export default function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <section className="fixed inset-0 bg-black text-white overflow-hidden h-screen w-screen flex flex-col neo-grid-bg">
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient [background:radial-gradient(80%_60%_at_50%_30%,rgba(198,255,0,0.03),transparent_60%)]" />

      {/* Header */}
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4 border-b-2 border-white bg-black z-10">
        <Link to="/" className="flex items-center">
          <span className="text-sm font-black tracking-widest uppercase text-white hover:text-lime transition-colors">
            BizIntel
          </span>
        </Link>
        <Link to="/contact">
          <Button
            variant="outline"
            size="sm"
            className="border-2 border-white bg-black text-white hover:bg-ink-card"
          >
            <span className="mr-1.5 uppercase font-bold tracking-wider text-xs">Contact</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      {/* Main Content Centered */}
      <div className="flex-1 w-full grid place-items-center px-4 pt-20 pb-4 relative z-10 overflow-y-auto">
        {children}
      </div>
    </section>
  );
}
