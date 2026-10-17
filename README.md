# 🌱 TouchGrass: Real-World Joy Radar

<div align="center">

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-touchgrass--tan.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://touchgrass-tan.vercel.app)
[![Live Backend](https://img.shields.io/badge/⚡%20Live%20API-FastAPI%20on%20Render-009688?style=for-the-badge&logo=fastapi)](https://touchgrass-r4w7.onrender.com/docs)
[![GitHub](https://img.shields.io/badge/💻%20GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/aryan-mishra219/touchgrass)

<br/>

### **Step away from the screen. Touch real grass. Get narrated live by AI.**

*An AI-powered offline wellness game, hardware-grade anti-cheat vision engine, and real-time community joy radar.*

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20App%20Router-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20(Python)-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Groq](https://img.shields.io/badge/Vision%20LPU-Groq%20Cloud-f55036?style=flat-square&logo=groq)](https://groq.com/)
[![ElevenLabs](https://img.shields.io/badge/Voice%20%2B%20SFX-ElevenLabs-orange?style=flat-square&logo=elevenlabs)](https://elevenlabs.io/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20Realtime-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

[🚀 Try Live Demo](https://touchgrass-tan.vercel.app) • [📖 Technical Docs & API](./TECHNICAL_DOCS.md) • [💻 Local Setup](#-quick-start--local-setup) • [🤝 Contributing](./CONTRIBUTING.md)

</div>

---

## 🌟 Quick Links for Judges

- 🌐 **Live Web Application:** [https://touchgrass-tan.vercel.app](https://touchgrass-tan.vercel.app)
- 🗺️ **Live Community Map:** [https://touchgrass-tan.vercel.app/map](https://touchgrass-tan.vercel.app/map)
- 🌊 **Live Hackathon Projector Screen:** [https://touchgrass-tan.vercel.app/live](https://touchgrass-tan.vercel.app/live)
- 🔌 **Live Backend OpenAPI / Swagger:** [https://touchgrass-r4w7.onrender.com/docs](https://touchgrass-r4w7.onrender.com/docs)
- 📐 **Full Technical Architecture & Schema:** [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md)

---

## 💡 Inspiration

During hackathons and long engineering sprints, we noticed a shared, unhealthy pattern: **we get trapped in the digital loop.** 12 to 14 continuous hours staring into VS Code, debugging terminals, and doomscrolling social feeds between builds. We tell ourselves we’ll take a break, but generic wellness apps feel like boring chore trackers or glorified spreadsheets.

Even worse, existing wellness apps suffer from a fatal flaw: **everyone cheats.** People upload stock photos, Google image search results, or take a picture of their computer monitor wallpaper just to maintain their "daily streak."

We wanted to build something fundamentally different: **TouchGrass**.
A fast, high-dopamine experience that actually pulls you out of your chair for 60 seconds, inspects your real-world proof using high-speed vision AI, roasts monitor cheaters in character, and generates cinematic, dual-layered generative audio (personalized voice commentary + matching environmental soundscapes) to celebrate genuine moments of offline joy.

---

## 🌿 What It Does

TouchGrass transforms taking a break into an instant, engaging offline adventure:

### 1. Dual Participation Modes
- **🌿 Touch Grass Mode:** The AI generates an achievable, spontaneous 60-second physical quest using your immediate physical surroundings (*e.g., "Find rough tree bark and touch it", "Spot a hot cup of chai or coffee", "Look up at open clouds"*). If a task isn't possible, re-roll with one click.
- **📷 Snap a Moment Mode:** For spontaneous offline moments you find on your own. The AI analyzes the emotional vibe, categorizes it (Nature, Food, Social, Small Wins), generates a poetic Polaroid caption, and pins it to the community map without checking against arbitrary task rules.

### 2. Groq Vision Anti-Cheat Engine (LPU Speed)
- Powered by high-speed vision inference on **Groq Cloud** (`llama-3.2-11b-vision-preview` / `llama-3.2-90b-vision-preview`).
- Detects physical depth, natural lighting, and monitor artifacts:
  - **Screen Cheater Detected (4K Catch):** If someone takes a picture of a laptop screen or desktop monitor, Groq detects pixel moiré patterns and bezel reflections. The system tags the photo with an anti-cheat stamp and triggers a hilarious, customized roast in the selected persona's voice!
  - **Legitimate Offline Joy:** Verified, tagged, and celebrated with confetti and rewards.

### 3. Dual-Layered Generative Audio (ElevenLabs)
- **High-Fidelity AI Commentary:** Powered by ElevenLabs Flash TTS with ultra-low latency.
  - **Lead Host:** **Sarang - Funny, Optimistic, and Inviting** — delivering warm, authentic commentary that makes you smile.
  - **Selectable Personas:** IPL Cricket Commentator, Sir David Attenborough, Cozy Bestie, and Sarcastic Drama Queen.
- **Generative Environmental SFX:** Synced 4-second spatial sound effects generated via the **ElevenLabs Sound Generation API** (e.g., sizzling street chai, rustling garden leaves, ambient birdsong, or stadium whistles).

### 4. Interactive Live Joy Radar Map (`/map`)
- Dark-mode **Leaflet.js** map plotting authentic offline moments submitted from around the world.
- Interactive category-coded vector pins with Polaroid drawers, GPS coordinates, and voice replay.
- One-click persistent floating action to jump straight into completing quests from anywhere on the map.

### 5. Big-Screen Projector & Room Mood Engine (`/live`)
- Built specifically for hackathons, classrooms, and conferences to project onto large venue screens.
- **Audience QR Code:** Anyone in the venue can scan the screen with their phone camera to instantly contribute without downloading an app.
- **Real-Time Postgres WebSockets:** Subscribes to Supabase Realtime to pop new moments onto the projector with live celebratory audio.
- **Live Room Analytics & Mood of the Day:** Calculates upload percentages across Nature, Food, Social, and Small Wins, dynamically identifying the dominant collective state of mind.
- **"Summarize Room Mood" Finale:** One click prompts the AI to synthesize all venue uploads into a cohesive collective mood story read aloud by the AI host.

---

## 🛠️ How We Built It

We built TouchGrass as a full-stack, real-time distributed application:

```
┌─────────────────────────────────────────────────────────────┐
│                       TouchGrass Web                        │
│   Next.js 16 (Turbopack) • React 19 • Tailwind CSS • Leaflet │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
       Base64 Photo & Task              Realtime WebSockets
               ▼                               ▼
┌──────────────────────────────┐    ┌─────────────────────────┐
│     FastAPI Python Core      │    │    Supabase Postgres    │
│  (Render / Port 8000 Async)  │◄───┤ (Realtime CDC Streams)  │
└──────┬───────────────┬───────┘    └─────────────────────────┘
       │               │
  Vision LPU       Audio Engines
       ▼               ▼
┌──────────────┐ ┌────────────────────────────────────────────┐
│  Groq Cloud  │ │                 ElevenLabs                 │
│ Llama Vision │ │  • Flash v2.5 TTS (Character Commentary)   │
│  Anti-Cheat  │ │  • Generative Sound FX (Ambient SFX)       │
└──────────────┘ └────────────────────────────────────────────┘
```

- **Frontend:** **Next.js 16** with Turbopack, React 19, and Tailwind CSS. Client-side canvas image downsampling (800px max) ensures lightning-fast mobile uploads even on weak conference Wi-Fi.
- **Backend API:** **FastAPI** running on Python 3.11 with asynchronous pipelines for non-blocking AI inference.
- **Vision & Anti-Cheat:** **Groq Cloud LPU** running `llama-3.2-11b-vision-preview` to inspect images for physical authenticity, moiré, and bezels in under 800ms.
- **Audio Pipeline:** **ElevenLabs** Flash v2.5 for speech synthesis and ElevenLabs Sound Generation API for contextual 4-second audio soundscapes.
- **Database & Sync:** **Supabase PostgreSQL** with row-level security and Realtime change data capture (`supabase_realtime`) streaming live uploads to all connected clients and projector screens.

---

## 🧗 Challenges We Ran Into

1. **Eliminating Dual-Audio Browser Race Conditions:**
   - *Problem:* Playing character voice commentary and environmental SFX simultaneously often caused browser audio context locks, especially on mobile Safari and Chrome autoplay policies.
   - *Solution:* We built a client-side sequential audio queue (`AudioContext` / HTML5 Audio) that smoothly balances both tracks—fading in environmental soundscapes before the character voice begins.

2. **Vision False-Positives in "Snap a Moment" Mode:**
   - *Problem:* Users snapping candid offline moments (like their lunch or a pet) were occasionally flagged if the system mistakenly evaluated them against an unrelated active quest.
   - *Solution:* We decoupled the processing pipelines: Touch Grass mode strictly evaluates task fulfillment and screen anti-cheat, while Snap a Moment mode evaluates purely for authentic physical joy, sensory description, and screen moiré detection without quest restrictions.

3. **Leaflet Map SSR Hydration in Next.js 16:**
   - *Problem:* Leaflet references `window` during module evaluation, which immediately breaks Server-Side Rendering (SSR) in modern Next.js App Router.
   - *Solution:* We implemented dynamic client-side imports with strict SSR disabling (`dynamic(() => import('./LeafletMap'), { ssr: false })`) combined with a custom skeleton loader for seamless hydration.

4. **Projector Stage Sequential Announcer:**
   - *Problem:* When multiple people upload photos simultaneously at a hackathon, overlapping audio playback turned the venue projector into chaos.
   - *Solution:* We implemented an in-memory client-side queue on `/live` that stages incoming moments, displays their cards immediately, and plays their narrations sequentially without overlaps.

---

## 🏆 Accomplishments That We're Proud Of

- **Sub-2-Second End-to-End Pipeline:** Users can snap a photo, run high-resolution vision inference on Groq, synthesize dual audio streams on ElevenLabs, and broadcast the pin onto the worldwide map in under two seconds.
- **Genuine Anti-Cheat Accuracy:** Successfully differentiating between real outdoor leaves and a photo taken of a 4K MacBook monitor displaying leaves.
- **Interactive Venue Projector:** Creating a dedicated screen that hackathon organizers can leave running on the main stage to turn the entire audience into active participants via QR code.
- **Delightful Persona Personalities:** The commentary genuinely makes people laugh out loud when they test it—especially when caught trying to cheat!

---

## 📚 What We Learned

- **LPU Acceleration with Groq:** We learned how dramatically Groq's inference speed changes the user experience; near-instantaneous vision analysis allows wellness interactions to feel like a snappy mobile camera app rather than a slow AI batch job.
- **Layered Generative Audio Design:** Audio is 50% of the emotional immersion. Combining character speech with contextually generated sound effects elevates an app from a utility to an experience.
- **Postgres CDC in Practice:** Leveraging Supabase's PostgreSQL publication stream eliminates the need for maintaining separate WebSocket microservices while keeping client state synchronized across devices.

---

## 🔮 What's Next for TouchGrass

- [ ] **Community Quest Packs:** Allow users and universities to create localized quest packs (e.g., "MIT Campus Quests", "Central Park Scavenger").
- [ ] **PWA & Offline Notification Streaks:** Gentle morning notifications encouraging users to take a 5-minute walk before opening their laptop.
- [ ] **Bluetooth Proximity Quests:** Multi-player offline challenges where two developers must physically meet in the same park or coffee shop to complete a co-op quest.
- [ ] **Smart Wearables Integration:** Apple Watch and Wear OS companions to trigger 60-second quests directly from your wrist.

---

## 📖 Technical Architecture & Reference

For engineers and evaluators looking for comprehensive architectural diagrams, API route schemas, database migration SQL, and index designs:

👉 **Read the complete [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md)**

---

## 💻 Quick Start & Local Setup

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- Free API keys from [Groq Cloud](https://console.groq.com/), [ElevenLabs](https://elevenlabs.io/), and [Supabase](https://supabase.com/)

### 1. Clone & Database Setup
```bash
git clone https://github.com/aryan-mishra219/touchgrass.git
cd touchgrass
```
Execute [supabase_schema.sql](./supabase_schema.sql) in your Supabase SQL Editor to set up the table and enable Realtime replication.

### 2. Run Backend
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate  |  macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```
Create `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
```
Start server:
```bash
python -m uvicorn main:app --reload --port 8000
```

### 3. Run Frontend
```bash
cd ../frontend
npm install
```
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```
Start development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 📄 License & Team

Distributed under the **MIT License**. See [LICENSE](./LICENSE) for details.

<div align="center">

**Touch Grass. Stay Human. Reconnect with Joy.**  
Crafted with ❤️ for the Hackathon.

</div>
