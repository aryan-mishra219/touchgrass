"use client";

import { useEffect, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { 
  Volume2, 
  VolumeX, 
  X, 
  Compass, 
  Sparkles, 
  Radio, 
  CheckCircle2, 
  RefreshCw, 
  Navigation,
  Layers
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getApiBaseUrl } from "../lib/api";

const CATEGORY_COLORS = {
  nature: {
    bg: "#22c55e",
    border: "#15803d",
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
    label: "Nature"
  },
  food: {
    bg: "#f97316",
    border: "#c2410c",
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 11v11"/><path d="M5 2v10a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2"/><path d="M7 2v5"/><path d="M7 14v8"/></svg>`,
    label: "Food"
  },
  people: {
    bg: "#a855f7",
    border: "#7e22ce",
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    label: "People"
  },
  cheater: {
    bg: "#ef4444",
    border: "#b91c1c",
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    label: "Cheater"
  },
  "small-wins": {
    bg: "#eab308",
    border: "#a16207",
    svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    label: "Small Wins"
  },
};

export default function JoyMap() {
  const [moments, setMoments] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [targetCoords, setTargetCoords] = useState(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const speechAudioRef = useRef(null);
  const sfxAudioRef = useRef(null);
  const hasHandledUrlTargetRef = useRef(false);

  // 1. Fetch initial moments from Supabase, Backend, and local cache
  const fetchMoments = async () => {
    setLoading(true);
    let loaded = [];

    // Check localStorage first for any moment the user just snapped / uploaded
    if (typeof window !== "undefined") {
      try {
        const cachedStr = localStorage.getItem("touchgrass_latest_moment");
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached && cached.latitude && cached.longitude) {
            loaded.push(cached);
          }
        }
      } catch (e) {
        console.warn("Failed to read cached moment:", e);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("joy_moments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          const existingIds = new Set(loaded.map((m) => String(m.id)));
          data.forEach((item) => {
            if (!existingIds.has(String(item.id))) {
              loaded.push(item);
            }
          });
        }
      } catch (err) {
        console.warn("Supabase direct fetch failed, trying backend:", err);
      }
    }

    // Also fetch from backend to ensure in-memory moments are always merged
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/moments`);
      if (res.ok) {
        const backendMoments = await res.json();
        if (Array.isArray(backendMoments)) {
          const existingIds = new Set(loaded.map((m) => String(m.id)));
          backendMoments.forEach((item) => {
            if (!existingIds.has(String(item.id))) {
              loaded.push(item);
            }
          });
        }
      }
    } catch (err) {
      console.warn("Backend /api/moments fetch failed:", err);
    }

    setMoments(loaded);
    setLoading(false);
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const apiUrl = getApiBaseUrl();
      await fetch(`${apiUrl}/api/seed-demo`, { method: "POST" });
      await fetchMoments();
    } catch (err) {
      console.warn("Seed demo failed:", err);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchMoments();
  }, []);

  // 2. Realtime subscription via Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel("realtime-joy-moments")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "joy_moments" },
        (payload) => {
          console.log("[Supabase Realtime] New pin arrived:", payload.new);
          setMoments((prev) => {
            if (prev.some((m) => String(m.id) === String(payload.new.id))) return prev;
            return [payload.new, ...prev];
          });
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
  }, []);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Import leaflet dynamically
    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;

      // Default view: Delhi center or first moment coordinates
      const initialLat = moments[0]?.latitude || 28.6139;
      const initialLng = moments[0]?.longitude || 77.2090;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // High-performance OpenStreetMap with dark radar neo-brutalist theme (Free, Zero API key required!)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        className: "dark-radar-tiles",
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = { map, L };
    });

    return () => {
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Check URL query parameters for targeted moment navigation (e.g. from photo upload)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const latParam = params.get("lat");
    const lngParam = params.get("lng");
    const idParam = params.get("id");

    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (!isNaN(lat) && !isNaN(lng)) {
        setTargetCoords({ lat, lng, id: idParam });

        // Retrieve cached moment from localStorage if available
        let foundCached = null;
        try {
          const cachedStr = localStorage.getItem("touchgrass_latest_moment");
          if (cachedStr) {
            const cached = JSON.parse(cachedStr);
            if (
              cached &&
              ((idParam && String(cached.id) === String(idParam)) ||
                (Math.abs(Number(cached.latitude) - lat) < 0.005 &&
                  Math.abs(Number(cached.longitude) - lng) < 0.005))
            ) {
              foundCached = cached;
            }
          }
        } catch (e) {}

        const targetMoment = foundCached || {
          id: idParam || `user-pin-${Date.now()}`,
          caption: "Your Captured Joy Moment",
          narration: "Your joy pin is live on the global radar! Step outside and touch grass.",
          image_url:
            "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80",
          joy_category: "small-wins",
          persona_name: "Joy Radar",
          is_cheat: false,
          latitude: lat,
          longitude: lng,
          created_at: new Date().toISOString(),
        };

        // Guarantee that targetMoment is added to moments state so a pin is ALWAYS rendered
        setMoments((prev) => {
          if (
            prev.some(
              (m) =>
                (idParam && String(m.id) === String(idParam)) ||
                (Math.abs(Number(m.latitude) - lat) < 0.001 &&
                  Math.abs(Number(m.longitude) - lng) < 0.001)
            )
          ) {
            return prev;
          }
          return [targetMoment, ...prev];
        });
      }
    }
  }, []);

  // 4. Update Map Markers when moments or activeFilter changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { map, L } = mapInstanceRef.current;
    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = moments.filter((m) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "cheater") return m.is_cheat;
      return m.joy_category === activeFilter && !m.is_cheat;
    });

    filtered.forEach((moment) => {
      const catKey = moment.is_cheat ? "cheater" : (moment.joy_category || "small-wins");
      const catConfig = CATEGORY_COLORS[catKey] || CATEGORY_COLORS["small-wins"];

      const isTargeted = targetCoords && (
        (targetCoords.id && String(moment.id) === String(targetCoords.id)) ||
        (Math.abs(Number(moment.latitude) - targetCoords.lat) < 0.002 &&
         Math.abs(Number(moment.longitude) - targetCoords.lng) < 0.002)
      );

      // Custom Neo-Brutalist HTML Pin Marker
      const customIcon = L.divIcon({
        className: "custom-joy-pin",
        html: `
          <div style="
            position: relative;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isTargeted ? "50px" : "42px"};
            height: ${isTargeted ? "50px" : "42px"};
            background: ${catConfig.bg};
            border: ${isTargeted ? "4px solid #ffffff" : "3px solid #000000"};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: ${isTargeted ? "0 0 25px #22c55e, 4px 4px 0px 0px #000" : "3px 3px 0px 0px #000000"};
            transition: transform 0.2s ease;
          ">
            <div style="
              transform: rotate(45deg);
              display: flex;
              align-items: center;
              justify-content: center;
            ">${catConfig.svg}</div>
          </div>
        `,
        iconSize: isTargeted ? [50, 50] : [42, 42],
        iconAnchor: isTargeted ? [25, 50] : [21, 42],
        popupAnchor: [0, -42],
      });

      const marker = L.marker([moment.latitude, moment.longitude], { icon: customIcon });

      marker.on("click", () => {
        setSelectedMoment(moment);
        map.panTo([moment.latitude, moment.longitude], { animate: true });
        // Automatically play voice if available
        playDualAudio(moment.speech_audio_url, moment.sfx_audio_url, moment.narration);
      });

      markersLayerRef.current.addLayer(marker);
    });

    // Handle targeted navigation
    if (targetCoords) {
      map.flyTo([targetCoords.lat, targetCoords.lng], 16, {
        animate: true,
        duration: 1.2,
      });

      // Find matching moment to pop open drawer
      const matched = moments.find(
        (m) =>
          (targetCoords.id && String(m.id) === String(targetCoords.id)) ||
          (Math.abs(Number(m.latitude) - targetCoords.lat) < 0.002 &&
           Math.abs(Number(m.longitude) - targetCoords.lng) < 0.002)
      );

      if (matched && !hasHandledUrlTargetRef.current) {
        hasHandledUrlTargetRef.current = true;
        setSelectedMoment(matched);
        playDualAudio(matched.speech_audio_url, matched.sfx_audio_url, matched.narration);
      }
    } else if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map((m) => [m.latitude, m.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [moments, activeFilter, targetCoords]);

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

    if (sfxUrl) {
      try {
        const sfx = new Audio(sfxUrl);
        sfx.volume = 0.35;
        sfxAudioRef.current = sfx;
        sfx.play().catch(() => {});
      } catch (e) {}
    }

    if (speechUrl) {
      try {
        const speech = new Audio(speechUrl);
        speech.volume = 1.0;
        speechAudioRef.current = speech;
        speech.onended = () => setIsPlayingAudio(false);
        speech.onerror = () => setIsPlayingAudio(false);
        speech.play().catch(() => setIsPlayingAudio(false));
      } catch (e) {
        setIsPlayingAudio(false);
      }
    } else if (fallbackText && typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(fallbackText);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  };

  const closeDrawer = () => {
    setSelectedMoment(null);
    if (speechAudioRef.current) speechAudioRef.current.pause();
    if (sfxAudioRef.current) sfxAudioRef.current.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-zinc-950">
      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Status Badge */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/90 backdrop-blur-md border-2 border-black text-xs font-mono font-bold shadow-[3px_3px_0px_0px_#000]">
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
          <span className="text-zinc-200">
            {realtimeConnected ? "SUPABASE REALTIME LIVE" : "LIVE RADAR"}
          </span>
          <span className="text-emerald-400 ml-1">({moments.length} Pins)</span>
        </div>

        {/* Filter Pills */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/90 backdrop-blur-md border-2 border-black shadow-[3px_3px_0px_0px_#000] overflow-x-auto">
          {[
            { id: "all", label: "All Pins" },
            { id: "nature", label: "Nature" },
            { id: "food", label: "Food" },
            { id: "people", label: "People" },
            { id: "cheater", label: "Cheaters" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === tab.id
                  ? "bg-emerald-400 text-black border border-black shadow-[1px_1px_0px_0px_#000]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={fetchMoments}
            title="Refresh pins"
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            title="Seed Delhi hackathon demo moments"
            className="px-2 py-1 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-yellow-400 border border-zinc-700 rounded-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            {seeding ? "Seeding..." : "Seed Demo"}
          </button>
        </div>
      </div>

      {/* Full-Screen Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-[1]" />

      {/* TALKING POLAROID MODAL / DRAWER (Opens when a pin is clicked) */}
      {selectedMoment && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-[1000] animate-in slide-in-from-bottom-5 duration-300">
          <div className="relative bg-[#fdfbf7] text-zinc-900 rounded-xl p-4 sm:p-5 border-4 border-black shadow-[8px_8px_0px_0px_#000]">
            {/* Close Button */}
            <button
              onClick={closeDrawer}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] active:scale-90 transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Photo Thumbnail */}
            <div className="relative w-full aspect-square bg-zinc-900 rounded-md overflow-hidden border-2 border-zinc-800 shadow-inner">
              <img
                src={selectedMoment.image_url}
                alt={selectedMoment.caption}
                className="w-full h-full object-cover"
              />

              {/* Status Badge */}
              {selectedMoment.is_cheat ? (
                <div className="absolute inset-0 flex items-center justify-center p-2 bg-red-950/40">
                  <span className="transform -rotate-6 bg-red-600 text-white font-black text-xs uppercase tracking-widest px-3 py-1.5 border-2 border-white shadow-lg animate-bounce">
                    SCREEN DETECTED
                  </span>
                </div>
              ) : (
                <div className="absolute top-2 left-2 bg-emerald-500 text-black font-extrabold text-[10px] uppercase px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
                  VERIFIED OFFLINE
                </div>
              )}

              <div className="absolute bottom-2 right-2 bg-zinc-900/90 text-white font-mono text-[10px] uppercase px-2 py-0.5 rounded border border-zinc-700">
                #{selectedMoment.joy_category}
              </div>
            </div>

            {/* Polaroid Content */}
            <div className="pt-3 pb-1">
              <h3 className="font-polaroid text-2xl sm:text-3xl text-zinc-950 font-bold leading-tight text-center">
                "{selectedMoment.caption}"
              </h3>

              {selectedMoment.is_cheat && selectedMoment.cheat_reason && (
                <div className="mt-2 p-2 bg-red-100 border border-red-500 rounded text-red-900 font-bold text-xs text-center">
                  Notice: {selectedMoment.cheat_reason}
                </div>
              )}

              {/* Narration script */}
              <div className="mt-3 p-3 bg-zinc-100 rounded-lg border border-zinc-300 text-xs text-zinc-800 leading-relaxed font-sans shadow-inner">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-zinc-600 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-zinc-600" />
                    <span>{selectedMoment.persona_name}</span>
                  </span>
                  {isPlayingAudio && (
                    <span className="text-emerald-700 font-mono animate-pulse">
                      ● Speaking...
                    </span>
                  )}
                </div>
                <p className="italic font-medium">"{selectedMoment.narration}"</p>
              </div>

              {/* Audio Replay Button */}
              <button
                onClick={() =>
                  playDualAudio(
                    selectedMoment.speech_audio_url,
                    selectedMoment.sfx_audio_url,
                    selectedMoment.narration
                  )
                }
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Play Voice Commentary + SFX</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
