"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { 
  Sparkles, 
  Camera, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Dices, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  Flame, 
  Compass,
  MapPin,
  ArrowRight,
  ExternalLink,
  X,
  Upload,
  RefreshCw,
  SwitchCamera,
  Sprout,
  Leaf,
  Coffee,
  Users,
  Award,
  Heart,
  Sun,
  Cloud,
  Layers,
  Eye,
  Waves,
  ShieldAlert,
  Zap
} from "lucide-react";
import questsData from "../data/quests.json";
import personasData from "../data/personas.json";
import { getApiBaseUrl } from "../lib/api";

// Custom Crisp GitHub SVG Logo
const Github = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState("touch-grass"); // "touch-grass" | "snap"
  const [aiTask, setAiTask] = useState({
    title: "Touch Real Green Grass",
    description: "Step outside, find real lawn or park grass, and physically touch it with your bare hand or shoe.",
    category: "nature",
  });
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  const [submittedQuest, setSubmittedQuest] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(personasData[0]);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [userCoords, setUserCoords] = useState({ latitude: 28.6139, longitude: 77.2090 });
  const [hasRealGps, setHasRealGps] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [showHacktoberfestModal, setShowHacktoberfestModal] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const speechAudioRef = useRef(null);
  const sfxAudioRef = useRef(null);

  // Sync activeTab with URL parameter if provided (e.g. ?tab=touch-grass)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "snap" || tabParam === "touch-grass") {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Professional Category Icon Helper
  const getCategoryIcon = (category) => {
    switch ((category || "").toLowerCase()) {
      case "nature":
        return <Leaf className="w-8 h-8 text-emerald-400" />;
      case "food":
        return <Coffee className="w-8 h-8 text-orange-400" />;
      case "people":
        return <Users className="w-8 h-8 text-purple-400" />;
      case "small-wins":
        return <Award className="w-8 h-8 text-yellow-400" />;
      default:
        return <Sprout className="w-8 h-8 text-emerald-400" />;
    }
  };

  // Professional Persona Icon Helper
  const getPersonaIcon = (id) => {
    switch (id) {
      case "sarang-optimistic":
        return <Sprout className="w-6 h-6 text-emerald-400" />;
      case "ipl-hinglish":
        return <Zap className="w-6 h-6 text-yellow-400" />;
      case "attenborough":
        return <Compass className="w-6 h-6 text-sky-400" />;
      case "cozy-bestie":
        return <Heart className="w-6 h-6 text-pink-400" />;
      default:
        return <Sparkles className="w-6 h-6 text-yellow-400" />;
    }
  };

  // Fetch easy, spontaneous task generated live by Groq AI
  const fetchAiTask = async () => {
    setIsGeneratingTask(true);
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/generate-task`, {
        method: "GET",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.title && data.description) {
        setAiTask(data);
      }
    } catch (err) {
      console.warn("Could not fetch AI task from backend, using randomized fallback:", err);
      const fallbacks = [
        { title: "Touch Real Green Grass", description: "Step outside, find real lawn or park grass, and physically touch it with your bare hand or shoe.", category: "nature" },
        { title: "Find a Smooth Stone or Pebble", description: "Look at the ground and find a small stone, pebble, or brick surface and touch it.", category: "nature" },
        { title: "Spot Something Bright Yellow", description: "Find an everyday object, leaf, or flower around you that is bright yellow.", category: "small-wins" },
        { title: "Touch Tree Bark", description: "Walk up to a real tree and feel the rough texture of its bark with your hand.", category: "nature" },
        { title: "Snap a Real Shadow", description: "Look down at the floor or pavement and snap the shadow cast by sunlight or a window.", category: "small-wins" },
        { title: "Touch Fresh Water", description: "Turn on a tap or find a drop of water, dew, or a puddle and snap your hand touching it.", category: "nature" },
        { title: "Spot a Houseplant or Leaf", description: "Find any leafy plant in your room, balcony, or hallway and touch its green leaf.", category: "nature" },
        { title: "Look Up At The Open Sky", description: "Step outside or to a window, tilt your head back, and snap the open sky and clouds.", category: "nature" },
        { title: "Find a Steaming Cup", description: "Snap a warm cup of chai, coffee, or tea in your mug or at a street stall.", category: "food" },
        { title: "Physical Paper Book", description: "Find a real paper book or handwritten notebook (not a screen) and snap its open pages.", category: "small-wins" },
        { title: "Touch an Authentic Wooden Surface", description: "Find an authentic wooden door, bench, or table and touch the physical grain.", category: "small-wins" },
        { title: "Spot an Animal or Bird", description: "Find any real bird in the sky, stray dog, cat, or pigeon outside and snap it.", category: "nature" }
      ];
      const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      setAiTask(pick);
    } finally {
      setIsGeneratingTask(false);
    }
  };

  // Fetch a live AI task on initial mount
  useEffect(() => {
    fetchAiTask();
  }, []);

  // Request or refresh high-accuracy GPS coordinates
  const refreshLocation = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setHasRealGps(true);
          setGpsLoading(false);
        },
        (err) => {
          console.log("Geolocation lookup notice:", err.message);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  // Attempt to capture real GPS coordinates on mount
  useEffect(() => {
    refreshLocation();
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const loadingMessages = activeTab === "snap"
    ? [
        "Analyzing real-world lighting, shadows, and physical textures...",
        "Evaluating mood and image atmosphere with Groq Vision...",
        `Channeling ${selectedPersona.name} for spontaneous commentary...`,
        "Synthesizing voice narration and custom sound effects...",
        "Pinning your moment to the global joy map...",
      ]
    : [
        `Verifying offline task "${aiTask?.title || 'Touch Grass'}"...`,
        "Checking for computer screens, laptop bezels, and monitor glare...",
        `Channeling ${selectedPersona.name} for anti-cheat verification...`,
        "Synthesizing voice narration and custom sound effects...",
        "Pinning your verified achievement to the live radar...",
      ];

  // Cycle loading messages smoothly
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Audio Playback Controller
  const playDualAudio = (speechUrl, sfxUrl, fallbackText) => {
    if (speechAudioRef.current) {
      speechAudioRef.current.pause();
      speechAudioRef.current = null;
    }
    if (sfxAudioRef.current) {
      sfxAudioRef.current.pause();
      sfxAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsPlayingAudio(true);

    // Play SFX (ambient / background level: 35%)
    if (sfxUrl) {
      try {
        const sfx = new Audio(sfxUrl);
        sfx.volume = 0.35;
        sfxAudioRef.current = sfx;
        sfx.play().catch((err) => console.log("SFX autoplay blocked/failed:", err));
      } catch (err) {
        console.warn("Error initializing SFX:", err);
      }
    }

    // Play Speech (full volume: 100%) or fallback to Web Speech API
    if (speechUrl) {
      try {
        const speech = new Audio(speechUrl);
        speech.volume = 1.0;
        speechAudioRef.current = speech;
        speech.onended = () => setIsPlayingAudio(false);
        speech.onerror = () => setIsPlayingAudio(false);
        speech.play().catch((err) => {
          console.log("Speech autoplay blocked/failed:", err);
          setIsPlayingAudio(false);
        });
      } catch (err) {
        console.warn("Error initializing Speech:", err);
        setIsPlayingAudio(false);
      }
    } else if (fallbackText && typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(fallbackText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  };

  // Client-side image compression: max 800px, JPEG 0.7
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 800;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Camera Controllers
  const startCamera = async (facing = cameraFacing) => {
    setShowCameraModal(true);
    setCameraLoading(true);
    setCameraError(null);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment. Please use file upload.");
      }

      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraLoading(false);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. Please allow camera access in your browser or use File Upload."
          : `Unable to open camera: ${err.message}`
      );
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
    setCameraError(null);
  };

  const flipCamera = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const captureCameraPhoto = async () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, width, height);

      const capturedBase64 = canvas.toDataURL("image/jpeg", 0.75);

      // Cleanly shutdown camera stream and close viewfinder
      stopCamera();

      // Submit moment for verification, TTS audio, and map drop
      await processMomentSubmission(capturedBase64);
    } catch (err) {
      console.error("Camera capture error:", err);
      setError("Failed to capture photo frame from camera viewfinder. Please try again.");
    }
  };

  // Shared processing engine for both live camera snaps and file uploads
  const processMomentSubmission = async (base64Image) => {
    setError(null);
    setResult(null);
    setLoading(true);
    setImagePreview(base64Image);

    // Pick quest definition based on the active tab mode
    const currentQuest = activeTab === "snap"
      ? {
          title: "Snap A Moment",
          category: "any",
          icon: "Sparkles",
          description: "Spontaneous offline moment. AI will analyze tone and content and pin to radar."
        }
      : (aiTask || {
          title: "Touch Real Green Grass",
          category: "nature",
          icon: "Sprout",
          description: "Step outside, find real lawn or park grass, and physically touch it."
        });

    setSubmittedQuest(currentQuest);

    // Use live GPS coordinates; if default coordinates, slightly jitter so subsequent demo pins disperse
    let lat = userCoords.latitude;
    let lng = userCoords.longitude;
    if (!hasRealGps) {
      lat += (Math.random() - 0.5) * 0.02;
      lng += (Math.random() - 0.5) * 0.02;
    }

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/process-moment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: base64Image,
          quest_title: currentQuest.title,
          quest_category: currentQuest.category,
          persona_name: selectedPersona.name,
          persona_style: selectedPersona.style,
          voice_id: selectedPersona.voice_id,
          latitude: lat,
          longitude: lng,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned ${response.status}: Failed to process moment.`);
      }

      const data = await response.json();
      setResult(data);

      // Cache newly uploaded moment into localStorage so JoyMap displays it with 100% certainty
      try {
        const momentToCache = {
          id: data.momentId || `local-${Date.now()}`,
          caption: data.caption,
          narration: data.narration,
          image_url: base64Image,
          joy_category: data.joyCategory,
          persona_name: selectedPersona.name,
          is_cheat: data.isCheat,
          cheat_reason: data.cheatReason,
          latitude: lat,
          longitude: lng,
          speech_audio_url: data.speechAudioUrl,
          sfx_audio_url: data.sfxAudioUrl,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem("touchgrass_latest_moment", JSON.stringify(momentToCache));
      } catch (cacheErr) {
        console.warn("Could not cache moment in localStorage:", cacheErr);
      }

      // Trigger confetti if verified real offline joy
      if (!data.isCheat) {
        confetti({
          particleCount: 110,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#22c55e", "#10b981", "#fbbf24", "#38bdf8", "#f43f5e"],
        });
      }

      // Play narrator voice and ambient sound effect
      playDualAudio(data.speechAudioUrl, data.sfxAudioUrl, data.narration);
    } catch (err) {
      console.error("Processing error:", err);
      setError(err.message || "Failed to connect to backend. Is FastAPI running on port 8000?");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      await processMomentSubmission(compressedBase64);
    } catch (err) {
      console.error("File compression error:", err);
      setError("Failed to load and compress image file. Please try another image.");
    }
  };

  const resetAll = () => {
    stopCamera();
    setImagePreview(null);
    setResult(null);
    setError(null);
    setSubmittedQuest(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (speechAudioRef.current) speechAudioRef.current.pause();
    if (sfxAudioRef.current) sfxAudioRef.current.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-zinc-100 flex flex-col items-center selection:bg-emerald-500 selection:text-black">
      {/* Top Header Navigation */}
      <header className="w-full h-20 border-b-2 border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-yellow-300 bg-clip-text text-transparent">
                TouchGrass
              </span>
              <span className="text-zinc-500 font-mono text-xs hidden sm:inline">JOY RADAR</span>
            </h1>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("touch-grass");
              resetAll();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-all ${
              activeTab === "touch-grass"
                ? "bg-emerald-400 text-black"
                : "bg-zinc-800 text-zinc-300 hover:text-white"
            }`}
          >
            <Sprout className="w-4 h-4 text-emerald-950" />
            <span className="hidden sm:inline">Touch Grass</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("snap");
              resetAll();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-all ${
              activeTab === "snap"
                ? "bg-yellow-400 text-black"
                : "bg-zinc-800 text-zinc-300 hover:text-white"
            }`}
          >
            <Camera className="w-4 h-4 text-yellow-950" />
            <span className="hidden sm:inline">Snap Moment</span>
          </button>

          <Link
            href="/map"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Live Joy Map</span>
          </Link>

          <Link
            href="/live"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <Waves className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Live Screen</span>
          </Link>

          <button
            onClick={() => setShowHacktoberfestModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold bg-orange-950/80 hover:bg-orange-900 text-orange-400 border border-orange-500/50 rounded-xl transition-all cursor-pointer"
          >
            <Github className="w-4 h-4 text-orange-400" />
            <span className="hidden md:inline">Open Source</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <div className="w-full max-w-2xl flex flex-col items-center px-4 py-8 sm:py-10">
        {/* Subheader Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-widest shadow-sm">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          Dual Mode • AI Vision Anti-Cheat + Realtime Map
        </div>

        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white text-center">
          Touch Grass. Find Joy. <span className="text-emerald-400">Get Narrated Live.</span>
        </h2>
        <p className="mt-2 text-zinc-400 font-medium text-xs sm:text-sm text-center max-w-md">
          {activeTab === "touch-grass"
            ? "Complete random AI-generated tasks in your physical surroundings, avoid screens, and get validated or roasted."
            : "Snap anything spontaneous in your day — AI senses the tone, crafts custom commentary, and drops it on the world map."}
        </p>

        {/* Dual Mode Tab Switcher */}
        <div className="w-full grid grid-cols-2 p-1.5 bg-zinc-900/90 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] gap-2 mt-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("touch-grass");
              resetAll();
            }}
            className={`py-3.5 px-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wide flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "touch-grass"
                ? "bg-gradient-to-r from-emerald-400 to-green-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] scale-[1.01]"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-black/10 flex items-center justify-center shrink-0">
              <Sprout className="w-4 h-4 text-emerald-950" />
            </div>
            <div className="text-center sm:text-left leading-tight">
              <div>Touch The Grass</div>
              <div className="text-[10px] font-mono normal-case tracking-normal opacity-85 font-bold hidden sm:block">
                AI Surrounding Task & Anti-Cheat
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("snap");
              resetAll();
            }}
            className={`py-3.5 px-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wide flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "snap"
                ? "bg-gradient-to-r from-yellow-400 to-amber-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] scale-[1.01]"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-black/10 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4 text-yellow-950" />
            </div>
            <div className="text-center sm:text-left leading-tight">
              <div>Snap A Moment</div>
              <div className="text-[10px] font-mono normal-case tracking-normal opacity-85 font-bold hidden sm:block">
                Free Roam Spontaneous Radar
              </div>
            </div>
          </button>
        </div>

        {/* MAIN INTERFACE: Mode-Specific Step 1, Persona Picker, & Camera Upload */}
        {!result && !loading && (
          <div className="w-full space-y-6 mt-6">
            {/* Step 1: Mode Dependent */}
            {activeTab === "touch-grass" ? (
              /* TAB 1: TOUCH THE GRASS (AI TASK) */
              <section className="bg-zinc-900/90 border-2 border-zinc-800 rounded-2xl p-5 shadow-xl brutal-shadow space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    <Compass className="w-4 h-4" />
                    Step 1 • AI-Generated Physical Task
                  </div>
                  <button
                    type="button"
                    onClick={fetchAiTask}
                    disabled={isGeneratingTask}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-zinc-950 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isGeneratingTask ? "animate-spin" : ""}`} />
                    <span>{isGeneratingTask ? "Generating..." : "Regenerate Task"}</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-zinc-950 to-zinc-950 border-2 border-emerald-500/50 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-950 rounded-2xl border-2 border-emerald-500/40 shrink-0 shadow-sm flex items-center justify-center">
                      {getCategoryIcon(aiTask?.category)}
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        Generated By Groq AI • Easy Surrounding Task
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                        {aiTask?.title || "Touch Real Green Grass"}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
                        {aiTask?.description || "Step outside, find real lawn or park grass, and physically touch it with your bare hand or shoe."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-yellow-400 font-medium text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    Anti-Cheat Active: Don't snap a computer monitor or phone screen!
                  </span>
                  <button
                    type="button"
                    onClick={fetchAiTask}
                    disabled={isGeneratingTask}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline font-mono text-[11px] cursor-pointer"
                  >
                    Can't do this task? Click to regenerate
                  </button>
                </div>
              </section>
            ) : (
              /* TAB 2: SNAP A MOMENT (FREE ROAM) */
              <section className="bg-zinc-900/90 border-2 border-zinc-800 rounded-2xl p-5 shadow-xl brutal-shadow space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-yellow-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    Step 1 • Snap A Moment (Free Roam)
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-yellow-950/80 text-yellow-300 border border-yellow-500/40 rounded-full font-bold uppercase">
                    No Strict Rules
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-950/40 via-zinc-950 to-zinc-950 border-2 border-yellow-500/40 shadow-inner flex flex-col sm:flex-row items-start gap-4">
                  <div className="p-3.5 bg-yellow-950/80 rounded-2xl border-2 border-yellow-500/50 text-yellow-400 shrink-0 flex items-center justify-center shadow-sm">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-mono text-[10px] uppercase font-bold tracking-wider mb-1">
                      <Radio className="w-3 h-3 text-yellow-400 animate-pulse" />
                      AI Dynamic Commentary & Tone
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Snap Anything Random In Your Day
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
                      Snap anything spontaneous in your surroundings — street life, coffee steam, stray animals, weird signs, or unique architecture. AI will inspect the photo, sense the mood, craft a custom caption, and drop your pin on the live world map.
                    </p>
                  </div>
                </div>

                {/* Quick Idea Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase font-bold">Ideas:</span>
                  {[
                    { label: "Warm Beverage", icon: Coffee },
                    { label: "Balcony Plant", icon: Leaf },
                    { label: "Sunlight & Shadows", icon: Sun },
                    { label: "Open Sky", icon: Cloud },
                    { label: "Wood & Textures", icon: Layers },
                    { label: "Stray Creature", icon: Eye }
                  ].map((item) => {
                    const ChipIcon = item.icon;
                    return (
                      <span key={item.label} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium">
                        <ChipIcon className="w-3 h-3 text-emerald-400" />
                        <span>{item.label}</span>
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Step 2: Persona Selector */}
            <section className="bg-zinc-900/90 border-2 border-zinc-800 rounded-2xl p-5 shadow-xl brutal-shadow">
              <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-yellow-400 font-bold">
                <Flame className="w-4 h-4" />
                Step 2 • Pick Your Live Narrator (Default: Sarang)
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {personasData.map((persona) => {
                  const isSelected = selectedPersona.id === persona.id;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => setSelectedPersona(persona)}
                      className={`p-3 rounded-xl border-2 transition-all text-center flex flex-col items-center cursor-pointer ${
                        isSelected
                          ? "bg-yellow-950/50 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.25)] text-white"
                          : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-300"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-1.5">
                        {getPersonaIcon(persona.id)}
                      </div>
                      <span className="font-bold text-xs leading-tight line-clamp-1">
                        {persona.name}
                      </span>
                      {persona.title && (
                        <span className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                          {persona.title}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 space-y-1">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold font-mono uppercase text-[10px]">
                    Active Narrator: {selectedPersona.name}
                  </span>
                </div>
                <p className="italic text-zinc-400 text-[11px] leading-relaxed">
                  "{selectedPersona.style}"
                </p>
              </div>
            </section>

            {/* Step 3: Camera Capture & Upload Selection */}
            <section className="bg-zinc-900/90 border-2 border-zinc-800 rounded-2xl p-5 shadow-xl brutal-shadow space-y-4">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Step 3 • Capture or Upload Joy
                </div>

                {/* GPS Status Indicator */}
                <button
                  type="button"
                  onClick={refreshLocation}
                  disabled={gpsLoading}
                  title="Click to refresh live GPS location"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-zinc-950 hover:bg-zinc-800 text-emerald-400 border border-zinc-700 rounded-lg transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${gpsLoading ? "animate-spin" : ""}`} />
                  <span>
                    {hasRealGps ? "Live GPS Active" : "Default Coords"}
                  </span>
                </button>
              </div>

              {/* Coordinates Pill */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 font-mono">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Lat: <strong className="text-zinc-200">{userCoords.latitude.toFixed(4)}°</strong>, Lng: <strong className="text-zinc-200">{userCoords.longitude.toFixed(4)}°</strong>
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Auto-Pins To Map
                </span>
              </div>

              {/* Dual Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Option 1: Live In-Browser Camera */}
                <button
                  type="button"
                  onClick={() => startCamera("environment")}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-zinc-950 font-black text-sm uppercase tracking-wide flex flex-col items-center justify-center gap-1.5 border-3 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 stroke-[2.5] group-hover:rotate-12 transition-transform" />
                    <span>Open Live Camera</span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-950 lowercase tracking-normal">
                    in-browser live viewfinder
                  </span>
                </button>

                {/* Option 2: Upload Photo / File */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-black text-sm uppercase tracking-wide flex flex-col items-center justify-center gap-1.5 border-3 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 stroke-[2.5] text-yellow-400 group-hover:-translate-y-0.5 transition-transform" />
                    <span>Upload Photo</span>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-400 lowercase tracking-normal">
                    from gallery or disk
                  </span>
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="photo-file-input"
              />

              <p className="text-[11px] text-zinc-500 text-center font-mono">
                Snaps are authenticated by Groq Vision & dropped live on the Interactive Joy Map
              </p>
            </section>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="w-full max-w-md bg-zinc-900 border-2 border-zinc-700 rounded-2xl p-8 text-center space-y-5 shadow-2xl brutal-shadow my-8 animate-in fade-in duration-300">
            {imagePreview && (
              <div className="w-36 h-36 mx-auto rounded-xl overflow-hidden border-2 border-zinc-700 relative shadow-inner">
                <img
                  src={imagePreview}
                  alt="Analyzing Moment"
                  className="w-full h-full object-cover filter brightness-90 animate-pulse"
                />
                <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay" />
              </div>
            )}

            <div className="flex justify-center">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
              </div>
            </div>

            <div>
              <p className="font-bold text-base text-zinc-100">
                {loadingMessages[loadingStep]}
              </p>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Groq Vision Anti-Cheat • ElevenLabs Engine • Supabase Radar
              </p>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="w-full bg-red-950/80 border-2 border-red-500 rounded-2xl p-5 mb-6 text-red-200 text-sm flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-300">Processing Error</p>
              <p className="text-xs text-red-200/90 mt-1">{error}</p>
              <button
                onClick={resetAll}
                className="mt-3 px-3 py-1 bg-red-900/60 hover:bg-red-900 border border-red-600 rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* RESULT: TALKING POLAROID CARD */}
        {result && (
          <div className="w-full flex flex-col items-center space-y-5 my-4 animate-in zoom-in-95 duration-400">
            {/* The Physical Polaroid Frame */}
            <div
              className={`relative w-full max-w-sm sm:max-w-md bg-[#fdfbf7] text-zinc-900 rounded-md p-4 sm:p-5 border-4 border-zinc-900 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 ${
                result.isCheat ? "rotate-1" : "-rotate-1 hover:rotate-0"
              }`}
            >
              {/* Photo Area */}
              <div className="relative w-full aspect-square bg-zinc-950 rounded-sm overflow-hidden border-2 border-zinc-800/60 shadow-inner">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt={result.caption}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* ANTI-CHEAT STAMP */}
                {result.isCheat ? (
                  <div className="absolute inset-0 flex items-center justify-center p-3 bg-red-950/60 backdrop-blur-[2px]">
                    <div className="transform -rotate-12 bg-red-600 text-white font-black text-center text-xs sm:text-sm uppercase tracking-widest px-4 py-2 border-4 border-white shadow-[0_0_25px_rgba(220,38,38,0.95)] animate-bounce">
                      <div className="flex items-center justify-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-white" />
                        <span>CAUGHT IN 4K: SCREEN DETECTED!</span>
                      </div>
                      <div className="text-[10px] font-mono tracking-normal normal-case mt-0.5 text-red-100 font-bold">
                        Go outside and touch real grass!
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute top-3 left-3 bg-emerald-500 text-black font-extrabold text-[10px] sm:text-xs uppercase px-2.5 py-1 rounded-sm border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    <span>
                      {submittedQuest?.category === "any"
                        ? "VERIFIED REAL SNAP"
                        : `VERIFIED: ${submittedQuest?.title || "TASK COMPLETED"}`}
                    </span>
                  </div>
                )}

                {/* Category Pill */}
                <div className="absolute bottom-3 right-3 bg-zinc-900/90 text-white font-mono text-[10px] uppercase px-2 py-0.5 rounded border border-zinc-700">
                  #{result.joyCategory}
                </div>
              </div>

              {/* Bottom White Area of Polaroid */}
              <div className="pt-4 pb-2 px-1">
                {/* Handwritten Style Caption */}
                <h2 className="font-polaroid text-3xl sm:text-4xl text-zinc-950 font-bold leading-tight tracking-tight text-center">
                  "{result.caption}"
                </h2>

                {/* Cheat Roast or Real Joy Praise Notice */}
                {result.isCheat && result.cheatReason ? (
                  <div className="mt-2.5 p-2.5 bg-red-100 border-2 border-red-500 rounded-lg text-red-900 font-bold text-xs sm:text-sm text-center shadow-sm flex items-center justify-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-600 shrink-0" />
                    <span>
                      <strong>{selectedPersona.name}'s Roast:</strong> "{result.cheatReason}"
                    </span>
                  </div>
                ) : (
                  <div className="mt-2.5 p-2 bg-emerald-50 border-2 border-emerald-500 rounded-lg text-emerald-900 font-bold text-xs text-center shadow-sm flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {submittedQuest?.category === "any"
                        ? "Authentic Real-World Moment Captured!"
                        : `Task Completed: ${submittedQuest?.title || "Real Grass Touched"}!`}
                    </span>
                  </div>
                )}

                {/* Script / Narration Box */}
                <div className="mt-4 p-3.5 bg-zinc-100 rounded-lg border-2 border-zinc-800 text-zinc-900 text-xs sm:text-sm leading-relaxed font-sans shadow-sm">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                    <span className="text-zinc-700">{getPersonaIcon(selectedPersona.icon || selectedPersona.id)}</span>
                    <span>{selectedPersona.name}</span>
                    {isPlayingAudio && (
                      <span className="ml-auto inline-flex items-center gap-1 text-emerald-700 font-mono text-[10px] animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Speaking...
                      </span>
                    )}
                  </div>
                  <p className="italic font-medium">"{result.narration}"</p>
                </div>

                {/* SFX Prompt Badge */}
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-500 font-mono px-1">
                  <span>SFX: "{result.sfxPrompt}"</span>
                  <span>
                    {result.speechAudioUrl ? "ElevenLabs AI Voice" : "Browser TTS Fallback"}
                  </span>
                </div>

                {/* Replay Audio Button */}
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() =>
                      playDualAudio(result.speechAudioUrl, result.sfxAudioUrl, result.narration)
                    }
                    className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Replay Voice + SFX</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Map Drop Callout */}
            <div className="w-full max-w-sm sm:max-w-md p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-zinc-900 to-emerald-950 border-3 border-black shadow-[6px_6px_0px_0px_#000] flex flex-col items-center gap-2.5 text-center">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Live Pin Dropped • Lat: {result.latitude.toFixed(4)}°, Lng: {result.longitude.toFixed(4)}°</span>
              </div>
              <Link
                href={`/map?lat=${result.latitude}&lng=${result.longitude}&id=${result.momentId || ''}`}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-300 hover:to-green-300 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-black" />
                <span>View Your Pin Live on Map</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>
            </div>

            {/* Actions: Pin to Live Map & Snap Another / Roll Next Task */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm sm:max-w-md">
              <Link
                href={`/map?lat=${result.latitude}&lng=${result.longitude}&id=${result.momentId || ''}`}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer text-center"
              >
                <MapPin className="w-4 h-4 text-black" />
                <span>Live Joy Map</span>
              </Link>

              <button
                onClick={() => {
                  resetAll();
                  if (activeTab === "touch-grass") {
                    fetchAiTask();
                  }
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                {activeTab === "touch-grass" ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>Roll Next Task</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Snap Another</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-zinc-500 font-mono flex flex-col items-center gap-2">
          <p>TouchGrass Hackathon MVP • Groq Vision + ElevenLabs + Supabase Realtime Map</p>
          <button
            onClick={() => setShowHacktoberfestModal(true)}
            className="text-[11px] text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer inline-flex items-center gap-1.5"
          >
            <Github className="w-3.5 h-3.5 text-orange-400" />
            <span>Want to contribute? Learn how to submit a Hacktoberfest PR</span>
          </button>
        </footer>
      </div>

      {/* MODAL: Hacktoberfest Open-Source Community Hook */}
      {showHacktoberfestModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative bg-zinc-900 border-4 border-black rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-[12px_12px_0px_0px_#000] text-zinc-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowHacktoberfestModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950 border border-orange-500/50 text-orange-400 font-mono text-xs font-bold uppercase mb-3">
              <Github className="w-3.5 h-3.5 text-orange-400" />
              <span>MLH Hacktoberfest Open-Source Hook</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              Extend TouchGrass With A Single PR!
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 mb-5 leading-relaxed">
              TouchGrass is architected for zero-friction open-source contributions. You can add localized quests for your campus/city or create a completely new AI voice persona in 2 minutes without writing complex code!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-5">
              {/* Box 1: Quests */}
              <div className="p-4 rounded-xl bg-zinc-950 border-2 border-zinc-800">
                <h4 className="font-bold text-xs font-mono uppercase text-emerald-400 mb-2 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Add A Quest (src/data/quests.json)</span>
                </h4>
                <pre className="text-[11px] font-mono bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-zinc-300 overflow-x-auto">
{`{
  "id": "delhi-monument",
  "title": "Heritage Spot",
  "description": "Snap India Gate or Qutub Minar",
  "category": "small-wins",
  "icon": "Landmark"
}`}
                </pre>
              </div>

              {/* Box 2: Personas */}
              <div className="p-4 rounded-xl bg-zinc-950 border-2 border-zinc-800">
                <h4 className="font-bold text-xs font-mono uppercase text-yellow-400 mb-2 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-yellow-400" />
                  <span>2. Add A Persona (src/data/personas.json)</span>
                </h4>
                <pre className="text-[11px] font-mono bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-zinc-300 overflow-x-auto">
{`{
  "id": "bollywood-dramaqueen",
  "name": "Bollywood Drama Queen",
  "icon": "Sparkles",
  "voice_id": "EXAVITQu4vr4xnSDxMaL",
  "style": "Overly dramatic Bollywood heroine..."
}`}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-zinc-950/70 border-2 border-zinc-800 rounded-xl text-xs text-left space-y-2">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>3-Step Hacktoberfest Contribution Workflow:</span>
              </p>
              <ol className="list-decimal list-inside text-zinc-400 space-y-1">
                <li>Fork the repository on GitHub.</li>
                <li>Add your quest or persona into <code className="text-yellow-400 font-mono">src/data/quests.json</code> or <code className="text-yellow-400 font-mono">src/data/personas.json</code>.</li>
                <li>Submit your Pull Request with the tag <code className="text-orange-400 font-mono">#hacktoberfest-accepted</code>!</li>
              </ol>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHacktoberfestModal(false)}
                className="px-6 py-2.5 rounded-xl bg-emerald-400 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_#000] cursor-pointer"
              >
                Got It, Let's Hack!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: In-Browser Live Camera Viewfinder */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="relative bg-zinc-900 border-4 border-black rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-[10px_10px_0px_0px_#000] text-zinc-100 flex flex-col items-center">
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-400">
                <Camera className="w-4 h-4" />
                <span>TouchGrass Live Camera</span>
              </div>
              <button
                onClick={stopCamera}
                className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Camera Viewport Frame */}
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-inner flex items-center justify-center">
              {cameraLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 text-zinc-400 gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                  <p className="font-mono text-xs">Requesting camera stream...</p>
                </div>
              )}

              {cameraError ? (
                <div className="p-4 text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto" />
                  <p className="text-xs text-zinc-300">{cameraError}</p>
                  <button
                    onClick={() => {
                      stopCamera();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 bg-emerald-400 text-black font-bold text-xs rounded-xl border border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-black" />
                    <span>Use File Upload Instead</span>
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder Target Framing Crosshairs */}
                  <div className="absolute inset-6 border-2 border-dashed border-emerald-400/40 rounded-xl pointer-events-none flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-emerald-400 rounded-full animate-ping opacity-60" />
                  </div>

                  {/* Mode / Facing badge */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-zinc-700 text-[10px] font-mono text-zinc-300">
                    {cameraFacing === "environment" ? "Rear Lens" : "Front Lens"}
                  </div>
                </>
              )}
            </div>

            {/* Controls Bar */}
            {!cameraError && (
              <div className="w-full mt-4 flex items-center justify-between px-2">
                {/* Switch / Flip Camera */}
                <button
                  type="button"
                  onClick={flipCamera}
                  title="Switch between front and back camera"
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <SwitchCamera className="w-4 h-4 text-yellow-400" />
                  <span className="hidden sm:inline">Flip</span>
                </button>

                {/* Big Shutter Button */}
                <button
                  type="button"
                  onClick={captureCameraPhoto}
                  disabled={cameraLoading}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 border-4 border-white shadow-[0_0_20px_rgba(239,68,68,0.7)] flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                  title="Take Snap"
                >
                  <div className="w-7 h-7 rounded-full bg-white shadow-inner" />
                </button>

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
