"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Camera, MapPin, Sprout, Waves } from "lucide-react";

// Dynamically import JoyMap without SSR to prevent any Leaflet window issues
const JoyMap = dynamic(() => import("../../components/JoyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-80px)] bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
      <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      <p className="font-mono text-sm">Initializing Live Joy Radar Map...</p>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-zinc-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-20 border-b-2 border-zinc-800 bg-zinc-900/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between shrink-0 z-50">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-yellow-300 bg-clip-text text-transparent">
                TouchGrass
              </span>
              <span className="text-zinc-500 font-mono text-xs">RADAR</span>
            </h1>
          </div>
        </Link>

        {/* Navigation Tabs - Explicit Touch Grass Button Included */}
        <nav className="flex items-center gap-2">
          <Link
            href="/?tab=touch-grass"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 border-2 border-zinc-700 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Touch Grass</span>
          </Link>

          <Link
            href="/?tab=snap"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 border-2 border-zinc-700 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Camera className="w-4 h-4 text-yellow-400" />
            <span className="hidden sm:inline">Snap Moment</span>
          </Link>

          <Link
            href="/map"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-black bg-emerald-400 text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-black" />
            <span>Live Joy Map</span>
          </Link>

          <Link
            href="/live"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 border-2 border-zinc-700 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Waves className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Live Screen</span>
          </Link>
        </nav>
      </header>

      {/* Main Map Container */}
      <main className="flex-1 w-full relative">
        <JoyMap />

        {/* Floating Quick Action: Touch Grass Button */}
        <div className="absolute bottom-6 left-6 z-[600]">
          <Link
            href="/?tab=touch-grass"
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-300 hover:to-green-300 text-black font-black text-xs sm:text-sm uppercase tracking-wide rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <Sprout className="w-4 h-4 stroke-[2.5]" />
            <span>Complete Touch Grass Task</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
