import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../../../components/ui/Logo";

interface AuthBackgroundProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: "login" | "signup" | "forgot-password") => void;
}

export default function AuthBackground({ children }: AuthBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    type P = { x: number; y: number; v: number; o: number };
    let ps: P[] = [];
    let raf = 0;

    const make = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      v: Math.random() * 0.25 + 0.05,
      o: Math.random() * 0.35 + 0.15,
    });

    const init = () => {
      ps = [];
      const count = Math.floor((canvas.width * canvas.height) / 9000);
      for (let i = 0; i < count; i++) ps.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 40;
          p.v = Math.random() * 0.25 + 0.05;
          p.o = Math.random() * 0.35 + 0.15;
        }
        ctx.fillStyle = `rgba(250,250,250,${p.o})`;
        ctx.fillRect(p.x, p.y, 0.7, 2.2);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="fixed inset-0 bg-zinc-950 text-zinc-50 overflow-hidden h-screen w-screen flex flex-col">
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.04),transparent_60%)]" />

      {/* Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-40 mix-blend-screen pointer-events-none"
      />

      {/* Header */}
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4 z-20">
        <Link to="/" className="flex items-center transition-opacity hover:opacity-90">
          <Logo size="sm" />
        </Link>
      </header>

      {/* Main Content Centered */}
      <div className="flex-1 w-full flex items-center justify-center px-4 pt-14 pb-4 relative z-10 overflow-y-auto">
        {children}
      </div>
    </section>
  );
}
