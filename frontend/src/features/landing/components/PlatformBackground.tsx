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
      {/* Single Clean Enterprise Background Grid Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-70"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.65) 75%, rgba(0,0,0,0.3) 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.65) 75%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* Vignette Lighting */}
      <div className="fixed inset-0 pointer-events-none [background:radial-gradient(85%_65%_at_50%_40%,rgba(255,255,255,0.03),transparent_70%)] z-0" />

      {/* Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full opacity-35 mix-blend-screen pointer-events-none z-0"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}


