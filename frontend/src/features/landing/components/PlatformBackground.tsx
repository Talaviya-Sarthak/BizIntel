import React from "react";

export function PlatformBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden neo-grid-bg">
      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none bg-radial-gradient [background:radial-gradient(80%_60%_at_50%_30%,rgba(198,255,0,0.02),transparent_60%)] z-0" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
