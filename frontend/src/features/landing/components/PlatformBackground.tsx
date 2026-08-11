import React, { useRef, useEffect } from "react";

export function PlatformBackground({ children }: { children: React.ReactNode }) {
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
      v: Math.random() * 0.2 + 0.05,
      o: Math.random() * 0.25 + 0.08,
    });

    const init = () => {
      ps = [];
      const count = Math.floor((canvas.width * canvas.height) / 12000);
      for (let i = 0; i < count; i++) ps.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 40;
          p.v = Math.random() * 0.2 + 0.05;
          p.o = Math.random() * 0.25 + 0.08;
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
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden">
      <style>{`
        .platform-accent-lines{position:fixed;inset:0;pointer-events:none;opacity:.5;z-index:0}
        .platform-hline,.platform-vline{position:absolute;background:#27272a;will-change:transform,opacity}
        .platform-hline{left:0;right:0;height:1px;transform:scaleX(0);transform-origin:50% 50%;animation:drawX .8s cubic-bezier(.22,.61,.36,1) forwards}
        .platform-vline{top:0;bottom:0;width:1px;transform:scaleY(0);transform-origin:50% 0%;animation:drawY .9s cubic-bezier(.22,.61,.36,1) forwards}
        .platform-hline:nth-child(1){top:18%;animation-delay:.12s}
        .platform-hline:nth-child(2){top:50%;animation-delay:.22s}
        .platform-hline:nth-child(3){top:82%;animation-delay:.32s}
        .platform-vline:nth-child(4){left:22%;animation-delay:.42s}
        .platform-vline:nth-child(5){left:50%;animation-delay:.54s}
        .platform-vline:nth-child(6){left:78%;animation-delay:.66s}
        @keyframes drawX{0%{transform:scaleX(0);opacity:0}60%{opacity:.8}100%{transform:scaleX(1);opacity:.5}}
        @keyframes drawY{0%{transform:scaleY(0);opacity:0}60%{opacity:.8}100%{transform:scaleY(1);opacity:.5}}
      `}</style>

      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.04),transparent_60%)] z-0" />

      {/* Accent lines */}
      <div className="platform-accent-lines">
        <div className="platform-hline" />
        <div className="platform-hline" />
        <div className="platform-hline" />
        <div className="platform-vline" />
        <div className="platform-vline" />
        <div className="platform-vline" />
      </div>

      {/* Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full opacity-40 mix-blend-screen pointer-events-none z-0"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
