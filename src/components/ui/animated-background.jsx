import React from "react";

export function AuroraBackground({ children, className = "" }) {
  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-[#0F1115] w-full ${className}`}
    >
      {/* Base Gradient Layer */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E293B]/50 via-[#0F172A]/40 to-[#111827]/60"></div>
        </div>

        {/* Steel Blue Wave */}
        <div
          className="absolute inset-0 opacity-50 animate-aurora1"
          style={{
            background:
              "radial-gradient(ellipse 900px 600px at 50% 20%, rgba(47,109,246,0.25) 0%, transparent 60%)",
          }}
        />

        {/* Cyan Accent Wave */}
        <div
          className="absolute inset-0 opacity-40 animate-aurora2"
          style={{
            background:
              "radial-gradient(ellipse 700px 400px at 80% 30%, rgba(76,201,240,0.2) 0%, transparent 60%)",
          }}
        />

        {/* Deep Indigo Wave */}
        <div
          className="absolute inset-0 opacity-30 animate-aurora3"
          style={{
            background:
              "radial-gradient(ellipse 800px 500px at 20% 60%, rgba(30,64,175,0.25) 0%, transparent 60%)",
          }}
        />

        {/* Depth Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}