"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { QRCodeSVG } from "qrcode.react";
import { 
  Sparkles, 
  Radio, 
  Volume2, 
  VolumeX, 
  QrCode, 
  X, 
  Play, 
  Flame, 
  PartyPopper, 
  RefreshCw,
  Camera,
  MapPin,
  Waves,
  Zap,
  Sprout,
  ShieldAlert,
  Volume1,
  ArrowLeft,
  Coffee,
  Leaf,
  Users,
  Award,
  BarChart3,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { getApiBaseUrl } from "../../lib/api";

const SIMULATED_MOMENTS_PRESETS = [
  {
    caption: "Steaming Kulhad Chai at 2 AM",
    narration: "A warm, rich clay cup of midnight hackathon fuel! Real physical steam, sensory focus, and boundless stamina.",
    image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80",
    joy_category: "food",
    persona_name: "Sarang",
    is_cheat: false,
    cheat_reason: null,
  },
  {
    caption: "Golden Pup Spotted in Lodhi Garden",
    narration: "A genuine four-legged friend bounding across open lawns! Pure physical joy under open tree canopies.",
    image_url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80",
    joy_category: "nature",
    persona_name: "Sir David (Nature Doc)",
    is_cheat: false,
    cheat_reason: null,
  },
  {
    caption: "Touching Real Dew-Covered Grass",
    narration: "Notice the cellular beauty of morning dew. You stepped away from the glowing screen and made direct contact with real nature.",
    image_url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80",
    joy_category: "nature",
    persona_name: "Sarang",
    is_cheat: false,
    cheat_reason: null,
  },
  {
    caption: "Squad High-Five After Git Merge",
    narration: "That authentic triumphant smile when merge conflicts vanish! True camaraderie in the real world.",
    image_url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80",
    joy_category: "people",
    persona_name: "Warm Joy Radar",
    is_cheat: false,
    cheat_reason: null,
  },
  {
    caption: "Caught on Screen: Monitor Wallpaper",
    narration: "Caught in high definition with laptop bezel reflections! Close the screen and step outside to touch real grass.",
    image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    joy_category: "cheater",
    persona_name: "Sarang",
    is_cheat: true,
    cheat_reason: "Caught red-handed with display bezel reflections! Close your monitor and touch real grass.",
  }
];

export default function LiveRoomRadar() {
  const [moments, setMoments] = useState([]);
  const [latestMoment, setLatestMoment] = useState(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrUrl, setQrUrl] = useState("http://localhost:3000");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [roomSummary, setRoomSummary] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Audio queue refs
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef(null);

  // Auto-detect browser origin for QR code
  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrUrl(window.location.origin);
    }
  }, []);

  // Unlock audio on initial interaction
  const unlockAudioContext = () => {
    if (audioUnlocked) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.001; // nearly silent chime
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(0);
      osc.stop(0.05);
    } catch {}
    setAudioUnlocked(true);
  };

  // Keyboard shortcut: Press 'S' to simulate incoming moment
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "s" || e.key === "S") {
        if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
        simulateIncomingMoment();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [audioUnlocked, soundEnabled]);

  // Get 12:00 AM midnight ISO timestamp for today (local time)
  const getTodayMidnightIso = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  };

  // Fetch initial moments for today
  const fetchInitialMoments = async () => {
    let loaded = [];
    const todayCutoff = getTodayMidnightIso();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from("joy_moments")
          .select("*")
          .gte("created_at", todayCutoff)
          .order("created_at", { ascending: false })
          .limit(40);
        if (data && data.length > 0) loaded = data;
      } catch (err) {
        console.warn("Supabase fetch failed in Live room:", err);
      }
    }

    if (loaded.length === 0) {
      try {
        const apiUrl = getApiBaseUrl();
        const res = await fetch(`${apiUrl}/api/moments`);
        if (res.ok) {
          const data = await res.json();
          loaded = data;
        }
      } catch (err) {
        console.warn("Backend /api/moments fallback failed:", err);
      }
    }

    setMoments(loaded);
    if (loaded.length > 0 && !latestMoment) {
      setLatestMoment(loaded[0]);
    }
  };

  useEffect(() => {
    fetchInitialMoments();
  }, []);

  // Audio Queue Processor
  const processAudioQueue = async () => {
    if (!soundEnabled || isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const item = audioQueueRef.current.shift();

    const playAudioFile = (url, vol = 1.0) => {
      return new Promise((resolve) => {
        if (!url) return resolve();
        try {
          const audio = new Audio(url);
          audio.volume = vol;
          currentAudioRef.current = audio;
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        } catch {
          resolve();
        }
      });
    };

    if (item.sfx_audio_url) {
      await playAudioFile(item.sfx_audio_url, 0.4);
    }

    if (item.speech_audio_url) {
      await playAudioFile(item.speech_audio_url, 1.0);
    } else if (item.narration && typeof window !== "undefined" && "speechSynthesis" in window) {
      await new Promise((resolve) => {
        const u = new SpeechSynthesisUtterance(item.narration);
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      });
    }

    setIsSpeaking(false);
    isPlayingRef.current = false;

    if (audioQueueRef.current.length > 0) {
      setTimeout(processAudioQueue, 500);
    }
  };

  const queueMomentAudio = (moment) => {
    audioQueueRef.current.push(moment);
    if (!isPlayingRef.current) {
      processAudioQueue();
    }
  };

  const simulateIncomingMoment = () => {
    unlockAudioContext();
    const randomPreset = SIMULATED_MOMENTS_PRESETS[Math.floor(Math.random() * SIMULATED_MOMENTS_PRESETS.length)];
    const mock = {
      ...randomPreset,
      id: `sim-${Date.now()}`,
      created_at: new Date().toISOString(),
      latitude: 28.6139 + (Math.random() - 0.5) * 0.03,
      longitude: 77.2090 + (Math.random() - 0.5) * 0.03,
    };

    setMoments((prev) => [mock, ...prev]);
    setLatestMoment(mock);

    confetti({
      particleCount: 160,
      spread: 100,
      origin: { y: 0.5 },
      colors: ["#22c55e", "#fbbf24", "#38bdf8", "#ec4899", "#a855f7"],
    });

    queueMomentAudio(mock);
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const apiUrl = getApiBaseUrl();
      await fetch(`${apiUrl}/api/seed-demo`, { method: "POST" });
      await fetchInitialMoments();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.warn("Seed demo failed:", err);
    } finally {
      setSeeding(false);
    }
  };

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel("live-room-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "joy_moments" },
        (payload) => {
          const newMoment = payload.new;
          setMoments((prev) => [newMoment, ...prev.filter((m) => m.id !== newMoment.id)]);
          setLatestMoment(newMoment);

          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
            colors: ["#22c55e", "#fbbf24", "#38bdf8", "#ec4899", "#a855f7"],
          });

          queueMomentAudio(newMoment);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  const handleSummarizeRoom = async () => {
    unlockAudioContext();
    setSummaryLoading(true);
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/room-summary`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to summarize room mood.");
      const data = await res.json();
      setRoomSummary(data);

      confetti({
        particleCount: 220,
        spread: 120,
        origin: { y: 0.4 },
        colors: ["#f59e0b", "#10b981", "#6366f1", "#ef4444", "#ec4899"],
      });

      if (soundEnabled) {
        if (data.speechAudioUrl) {
          const audio = new Audio(data.speechAudioUrl);
          audio.volume = 1.0;
          audio.play().catch(() => {});
        } else if (data.summaryText && typeof window !== "undefined" && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(data.summaryText);
          window.speechSynthesis.speak(u);
        }
      }
    } catch (err) {
      console.error("Room summary error:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  // --- ACCURATE REAL-TIME ANALYSIS OF RECENT UPLOADS & MOOD OF THE DAY ---
  const totalPhotos = moments.length;

  const categoryStats = {
    food: { count: 0, label: "Food & Beverage", icon: Coffee, barColor: "bg-orange-400", textColor: "text-orange-400" },
    nature: { count: 0, label: "Nature & Greenery", icon: Leaf, barColor: "bg-emerald-400", textColor: "text-emerald-400" },
    people: { count: 0, label: "Social & Connection", icon: Users, barColor: "bg-purple-400", textColor: "text-purple-400" },
    "small-wins": { count: 0, label: "Small Wins & Triumphs", icon: Award, barColor: "bg-yellow-400", textColor: "text-yellow-400" },
  };

  let cheaterPhotos = 0;

  moments.forEach((m) => {
    if (m.is_cheat) {
      cheaterPhotos++;
    } else {
      const cat = (m.joy_category || "").toLowerCase();
      if (categoryStats[cat]) {
        categoryStats[cat].count++;
      } else {
        categoryStats["small-wins"].count++;
      }
    }
  });

  // Calculate mathematically accurate percentages
  const getPercentage = (count) => {
    if (!totalPhotos || totalPhotos === 0) return 0;
    return Math.round((count / totalPhotos) * 100);
  };

  // Determine dominant mood of the day based on the highest percentage of uploads
  let dominantCategory = "nature";
  let highestCount = -1;

  Object.keys(categoryStats).forEach((key) => {
    if (categoryStats[key].count > highestCount) {
      highestCount = categoryStats[key].count;
      dominantCategory = key;
    }
  });

  const MOOD_PROFILES = {
    food: {
      mood: "Foodie & Nourished",
      tagline: "High culinary & beverage uploads today. The room's collective mood is focused on culinary comfort, warm cups, and shared meals.",
      badge: "Dominant Mood: Foodie Energy",
      accent: "text-orange-400",
      border: "border-orange-500/50",
      bg: "bg-orange-950/40",
      icon: Coffee,
    },
    nature: {
      mood: "Grounded & Outdoorsy",
      tagline: "High green grass, flora, and open sky uploads today. People are actively stepping outdoors and reconnecting with physical earth.",
      badge: "Dominant Mood: Nature Grounded",
      accent: "text-emerald-400",
      border: "border-emerald-500/50",
      bg: "bg-emerald-950/40",
      icon: Leaf,
    },
    people: {
      mood: "Social & Connected",
      tagline: "High team smiles and high-five uploads today. Group camaraderie and interpersonal joy are driving the room's energy.",
      badge: "Dominant Mood: Social Wave",
      accent: "text-purple-400",
      border: "border-purple-500/50",
      bg: "bg-purple-950/40",
      icon: Users,
    },
    "small-wins": {
      mood: "Mindful & Triumphant",
      tagline: "Everyday victories, textures, and mindful observations dominate the radar today. Celebrating small real-world triumphs.",
      badge: "Dominant Mood: Mindful Wins",
      accent: "text-yellow-400",
      border: "border-yellow-500/50",
      bg: "bg-yellow-950/40",
      icon: Award,
    },
  };

  const currentMood = MOOD_PROFILES[dominantCategory] || MOOD_PROFILES.nature;
  const MoodIcon = currentMood.icon;

  return (
    <div 
      onClick={unlockAudioContext}
      className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col overflow-x-hidden selection:bg-emerald-400 selection:text-black"
    >
      {/* Autoplay Unlocker Banner if Audio Context Not Armed */}
      {!audioUnlocked && (
        <div className="bg-yellow-400 text-black px-4 py-2 text-center text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-md animate-pulse sticky top-0 z-[60]">
          <Volume1 className="w-4 h-4" />
          <span>CLICK ANYWHERE ON SCREEN TO ARM ROOM AUDIO & LIVE COMMENTARY</span>
        </div>
      )}

      {/* Top Projector Bar */}
      <header className="h-20 border-b-2 border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {/* Back to Main Feed Button */}
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-2 border-black font-bold text-xs sm:text-sm shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer group"
            title="Go back to main feed"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Main Feed</span>
          </Link>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
              <Waves className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black tracking-wider text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-yellow-300 bg-clip-text text-transparent">
                  JOY WAVE
                </span>
                <span className="text-zinc-500 font-mono text-[10px] sm:text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hidden md:inline">
                  LIVE ROOM RADAR
                </span>
              </h1>
            </div>
          </Link>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border-2 border-black text-xs font-mono font-bold shadow-[2px_2px_0px_0px_#000]">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  realtimeConnected ? "bg-emerald-400" : "bg-yellow-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  realtimeConnected ? "bg-emerald-500" : "bg-yellow-500"
                }`}
              />
            </span>
            <span className="text-zinc-300">
              {realtimeConnected ? "REALTIME ACTIVE" : "RADAR READY"}
            </span>
            <span className="text-emerald-400">({moments.length})</span>
          </div>

          {/* Presenter Simulate Moment Button */}
          <button
            onClick={simulateIncomingMoment}
            title="Simulate incoming live moment (Keyboard: S)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_#000] active:scale-95 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden md:inline">Simulate (S)</span>
          </button>

          {/* Seed Demo Button */}
          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            title="Seed Delhi hackathon demo moments"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-yellow-400 font-bold text-xs border border-zinc-700 transition-all cursor-pointer active:scale-95"
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">{seeding ? "Seeding..." : "Seed Demo"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer ${
              soundEnabled
                ? "bg-emerald-400 text-black font-bold"
                : "bg-zinc-800 text-zinc-400"
            }`}
            title={soundEnabled ? "Audio commentary active" : "Audio commentary muted"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* QR Code Button */}
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">QR Code</span>
          </button>

          {/* Touch Grass & Map Nav Links */}
          <Link
            href="/?tab=touch-grass"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition-all cursor-pointer hidden md:flex"
            title="Complete Touch Grass Task"
          >
            <Sprout className="w-4 h-4" />
            <span>Touch Grass</span>
          </Link>

          <Link
            href="/map"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border-2 border-zinc-700 shadow-sm transition-all cursor-pointer"
            title="View Leaflet Map"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline text-xs font-bold">Joy Map</span>
          </Link>

          <Link
            href="/?tab=snap"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border-2 border-zinc-700 shadow-sm transition-all cursor-pointer"
            title="Snap a Moment"
          >
            <Camera className="w-4 h-4 text-yellow-400" />
            <span className="hidden sm:inline text-xs font-bold">Snap Moment</span>
          </Link>
        </div>
      </header>

      {/* Main Big-Screen Stage */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 flex flex-col gap-8">
        
        {/* TOP SECTION: Spotlight On Latest Moment */}
        <div className="w-full relative bg-zinc-900/90 border-3 border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-2xl brutal-shadow flex flex-col md:flex-row gap-6 items-center overflow-hidden">
          <div className="absolute top-3 left-4 flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Latest Spotter Drop
            {isSpeaking && (
              <span className="ml-2 text-yellow-400 animate-pulse font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 text-yellow-400" />
                Live Speech Narration Active...
              </span>
            )}
          </div>

          {latestMoment ? (
            <>
              {/* Photo Frame */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 shrink-0 rounded-2xl overflow-hidden border-4 border-black shadow-[6px_6px_0px_0px_#000] bg-zinc-950 mt-4 md:mt-0">
                <img
                  src={latestMoment.image_url}
                  alt={latestMoment.caption}
                  className="w-full h-full object-cover"
                />
                {latestMoment.is_cheat ? (
                  <div className="absolute inset-0 flex items-center justify-center p-2 bg-red-950/60">
                    <span className="transform -rotate-12 bg-red-600 text-white font-black text-xs uppercase px-3 py-1 border-2 border-white shadow-lg animate-bounce">
                      SCREEN DETECTED
                    </span>
                  </div>
                ) : (
                  <div className="absolute top-2 left-2 bg-emerald-500 text-black font-extrabold text-[10px] uppercase px-2 py-0.5 rounded border border-black shadow-[2px_2px_0px_0px_#000]">
                    VERIFIED JOY
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-zinc-900/90 text-white font-mono text-[10px] uppercase px-2 py-0.5 rounded border border-zinc-700">
                  #{latestMoment.joy_category}
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col justify-center text-center md:text-left">
                <h2 className="font-polaroid text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
                  "{latestMoment.caption}"
                </h2>

                {latestMoment.is_cheat && latestMoment.cheat_reason && (
                  <p className="mt-2 text-xs sm:text-sm font-bold text-red-400 bg-red-950/60 border border-red-500/50 rounded-lg p-2">
                    Notice: {latestMoment.cheat_reason}
                  </p>
                )}

                <div className="mt-4 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-300 text-sm leading-relaxed">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-yellow-400 mb-1">
                    Narrated by {latestMoment.persona_name}
                  </div>
                  <p className="italic">"{latestMoment.narration}"</p>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full py-16 text-center text-zinc-500 font-mono">
              Waiting for the first joy moment to land... (Or press S to simulate)
            </div>
          )}
        </div>

        {/* --- MOOD OF THE DAY & ACCURATE UPLOAD ANALYSIS DASHBOARD --- */}
        <section className="bg-zinc-900/90 border-3 border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl brutal-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                  Real-Time Upload Analysis & Daily Mood
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Calculated live across {totalPhotos} uploaded photos
                </p>
              </div>
            </div>

            {/* Total Photos Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-400">Total Analyzed:</span>
              <span className="text-emerald-400 font-bold">{totalPhotos} Photos</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Dominant Mood of the Day Card */}
            <div className={`p-6 rounded-2xl border-2 ${currentMood.border} ${currentMood.bg} flex flex-col justify-between shadow-lg relative overflow-hidden`}>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-xs font-mono font-bold uppercase tracking-wider mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{currentMood.badge}</span>
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <div className={`w-12 h-12 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center ${currentMood.accent}`}>
                    <MoodIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                      Mood Of The Day
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {currentMood.mood}
                    </h4>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 mt-4 leading-relaxed font-medium">
                  {currentMood.tagline}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Top Category: <strong className="text-white capitalize">{dominantCategory}</strong></span>
                <span className="text-emerald-400 font-bold">{getPercentage(categoryStats[dominantCategory]?.count || 0)}% of uploads</span>
              </div>
            </div>

            {/* Category Percentage Breakdown Bars */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-950/80 border-2 border-zinc-800 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-zinc-400">
                <span>Category Breakdown</span>
                <span>Accurate Distribution</span>
              </div>

              <div className="space-y-3.5">
                {Object.entries(categoryStats).map(([key, item]) => {
                  const ItemIcon = item.icon;
                  const pct = getPercentage(item.count);
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-zinc-200">
                          <ItemIcon className={`w-4 h-4 ${item.textColor}`} />
                          <span>{item.label}</span>
                        </div>
                        <div className="font-mono text-xs text-zinc-400">
                          <strong className="text-white">{item.count}</strong> / {totalPhotos} photos
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold">
                            {pct}%
                          </span>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 p-0.5">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ease-out ${item.barColor}`}
                          style={{ width: `${Math.max(pct, totalPhotos > 0 && item.count > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Anti-cheat summary line */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {totalPhotos > 0 ? Math.round(((totalPhotos - cheaterPhotos) / totalPhotos) * 100) : 100}% Authentic Physical Reality
                </span>
                {cheaterPhotos > 0 && (
                  <span className="text-red-400 font-bold">
                    {cheaterPhotos} Screen Fakes Caught ({getPercentage(cheaterPhotos)}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Live Floating Stream Grid of Recent Moments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Live Room Stream ({moments.length} Moments)
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={simulateIncomingMoment}
                className="px-2.5 py-1 text-xs font-mono bg-purple-950/80 hover:bg-purple-900 border border-purple-500 text-purple-300 rounded-lg transition-all cursor-pointer"
              >
                Simulate Drop (S)
              </button>
              <button
                onClick={fetchInitialMoments}
                className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {moments.map((moment) => (
              <div
                key={moment.id}
                onClick={() => {
                  setLatestMoment(moment);
                  queueMomentAudio(moment);
                }}
                className={`relative bg-[#fdfbf7] text-zinc-950 p-2.5 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer group ${
                  moment.is_cheat ? "rotate-1" : "-rotate-1"
                }`}
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
                  <img
                    src={moment.image_url}
                    alt={moment.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {moment.is_cheat && (
                    <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center p-1">
                      <span className="bg-red-600 text-white font-black text-[9px] uppercase px-1.5 py-0.5 rounded shadow">
                        SCREEN
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-zinc-900/90 text-white text-[9px] font-mono px-1 rounded">
                    #{moment.joy_category}
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <h4 className="font-polaroid text-base sm:text-lg font-bold leading-tight truncate">
                    "{moment.caption}"
                  </h4>
                  <p className="text-[10px] text-zinc-600 font-sans mt-0.5 truncate">
                    Narrator: {moment.persona_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM STICKY: The "Summarize Room Mood" AI Finale Button */}
        <div className="sticky bottom-6 mt-6 flex justify-center z-40">
          <button
            onClick={handleSummarizeRoom}
            disabled={summaryLoading}
            className="px-8 py-5 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400 text-black font-black text-base sm:text-lg tracking-wide uppercase flex items-center gap-3 border-3 border-black shadow-[8px_8px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 active:scale-98 transition-all cursor-pointer group disabled:opacity-75"
          >
            <PartyPopper className={`w-6 h-6 ${summaryLoading ? "animate-spin" : "group-hover:rotate-12 transition-transform"}`} />
            <span>
              {summaryLoading
                ? "Channeling Grand AI Finale..."
                : "Summarize Room Mood (AI Finale)"}
            </span>
          </button>
        </div>
      </main>

      {/* MODAL: Large QR Code with Presenter Override URL Input */}
      {showQrModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative bg-zinc-900 border-4 border-black rounded-3xl p-8 max-w-md w-full text-center shadow-[10px_10px_0px_0px_#000]">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-white mb-2">
              Scan With Your Phone
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Pick a quest, touch grass, and submit your moment to appear live on the big screen!
            </p>

            <div className="p-4 bg-white rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_#000] inline-block mb-4">
              <QRCodeSVG value={qrUrl} size={220} level="M" />
            </div>

            {/* Presenter URL Override Input */}
            <div className="mt-3 text-left">
              <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Presenter Target URL (Live Tunnel / LAN IP):
              </label>
              <input
                type="text"
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                placeholder="http://192.168.1.5:3000 or ngrok URL"
                className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border-2 border-zinc-700 rounded-xl text-yellow-300 focus:outline-none focus:border-emerald-400"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Editing this input updates the QR code SVG immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI Finale Room Mood Summary */}
      {roomSummary && (
        <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-lg flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="relative bg-[#fdfbf7] text-zinc-950 border-4 border-black rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-[12px_12px_0px_0px_#000] text-center">
            <button
              onClick={() => setRoomSummary(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-black font-mono font-black text-xs uppercase mb-3 border-2 border-black">
              <Sparkles className="w-3.5 h-3.5" />
              Grand AI Room Finale
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 mb-3">
              "{roomSummary.headline}"
            </h2>

            {/* Vibe Score Meter */}
            <div className="my-4 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-100 border-2 border-emerald-600 text-emerald-900 font-black text-sm">
              <span>Collective Room Vibe:</span>
              <span className="text-2xl text-emerald-700 font-mono">
                {roomSummary.vibeScore || 96}/100
              </span>
            </div>

            {/* Breakdown Pill */}
            {roomSummary.moodStats && (
              <div className="p-3 bg-zinc-100 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 my-3">
                Distribution: {roomSummary.moodStats}
              </div>
            )}

            {/* Summary Text */}
            <p className="text-base sm:text-lg text-zinc-800 leading-relaxed font-medium italic my-4 px-2">
              "{roomSummary.summaryText}"
            </p>

            {/* Voice commentary status */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (roomSummary.speechAudioUrl) {
                    new Audio(roomSummary.speechAudioUrl).play();
                  } else if (roomSummary.summaryText && "speechSynthesis" in window) {
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance(roomSummary.summaryText));
                  }
                }}
                className="py-3 px-6 rounded-xl bg-zinc-950 text-white font-bold text-sm flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Replay Grand Narration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
