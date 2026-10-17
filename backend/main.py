import os
import json
import base64
import random
import requests
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq
from supabase import create_client, Client

env_file = Path(__file__).parent / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()

app = FastAPI(title="TouchGrass: Joy Radar Backend")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_SUPABASE_URL = "https://fkagbunnmkejdvhazovg.supabase.co"

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", "")))

# Initialize Supabase client
supabase_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    global supabase_client
    if supabase_client is not None:
        return supabase_client
    
    # Reload environment in case .env was updated
    if env_file.exists():
        load_dotenv(dotenv_path=env_file, override=True)
    else:
        load_dotenv(override=True)

    url = (
        os.getenv("SUPABASE_URL") 
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL") 
        or DEFAULT_SUPABASE_URL
    )
    key = (
        os.getenv("SUPABASE_SERVICE_KEY") 
        or os.getenv("SUPABASE_KEY") 
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY") 
        or os.getenv("SUPABASE_ANON_KEY") 
        or ""
    )
    
    if url and key:
        try:
            supabase_client = create_client(url, key)
            print("[Supabase] Successfully initialized Supabase client!")
            return supabase_client
        except Exception as e:
            print(f"[Supabase Warning] Failed to initialize Supabase client: {e}")
    return None


# Try initializing on module load
get_supabase_client()



# In-memory moments fallback cache (useful if Supabase is not yet connected)
IN_MEMORY_MOMENTS: List[Dict[str, Any]] = [
    {
        "id": "demo-moment-1",
        "created_at": "2026-10-17T09:00:00Z",
        "caption": "Golden Sunlight on Gulmohar Leaf",
        "narration": "Behold! The fragile chlorophyll marvel dancing gently in the northern breeze. Quite extraordinary.",
        "image_url": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80",
        "joy_category": "nature",
        "persona_name": "Sir David (Nature Doc)",
        "is_cheat": False,
        "cheat_reason": None,
        "latitude": 28.6139,
        "longitude": 77.2090,
        "speech_audio_url": None,
        "sfx_audio_url": None,
    },
    {
        "id": "demo-moment-2",
        "created_at": "2026-10-17T09:05:00Z",
        "caption": "Steaming Kulhad Masala Chai",
        "narration": "Kya baat hai! Last ball pe boundary jaisa swaad, full energy double century moment!",
        "image_url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80",
        "joy_category": "food",
        "persona_name": "IPL Hinglish Commentator",
        "is_cheat": False,
        "cheat_reason": None,
        "latitude": 28.6280,
        "longitude": 77.2180,
        "speech_audio_url": None,
        "sfx_audio_url": None,
    },
    {
        "id": "demo-moment-3",
        "created_at": "2026-10-17T09:10:00Z",
        "caption": "Office Doggo Afternoon Nap",
        "narration": "Look at this peaceful bundle of fur finding complete bliss on the grass rug. Pure unconditional validation.",
        "image_url": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80",
        "joy_category": "people",
        "persona_name": "Warm Joy Radar",
        "is_cheat": False,
        "cheat_reason": None,
        "latitude": 28.6010,
        "longitude": 77.2250,
        "speech_audio_url": None,
        "sfx_audio_url": None,
    }
]

class MomentRequest(BaseModel):
    image_base64: str
    quest_title: str
    quest_category: str
    persona_name: str
    persona_style: str
    voice_id: str
    latitude: Optional[float] = 28.6139
    longitude: Optional[float] = 77.2090
    mode: Optional[str] = "touch-grass" # "snap" | "touch-grass"

class SaveMomentRequest(BaseModel):
    caption: str
    narration: str
    image_url: str
    joy_category: str
    persona_name: str
    is_cheat: bool
    cheat_reason: Optional[str] = None
    latitude: float = 28.6139
    longitude: float = 77.2090
    speech_audio_url: Optional[str] = None
    sfx_audio_url: Optional[str] = None

def generate_speech(narration: str, voice_id: str) -> Optional[str]:
    """Generates speech using ElevenLabs TTS API with automatic fallback for library voices."""
    eleven_key = os.getenv("ELEVENLABS_API_KEY", ELEVENLABS_API_KEY)
    if not eleven_key or not voice_id:
        return None

    # Try requested voice first, then fallback to built-in account voices if shared voice requires paid tier
    voices_to_try = [voice_id]
    fallback_voices = ["bIHbv24MWmeRgasZH58o", "JBFqnCBsd6RMkjVDRZzb", "cjVigY5qzO86Huf0OWal"]
    for f in fallback_voices:
        if f not in voices_to_try:
            voices_to_try.append(f)

    for vid in voices_to_try:
        try:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_22050_32"
            headers = {
                "xi-api-key": eleven_key,
                "Content-Type": "application/json"
            }
            payload = {
                "text": narration,
                "model_id": "eleven_flash_v2_5",
                "voice_settings": {
                    "stability": 0.55,
                    "similarity_boost": 0.75,
                    "style": 0.45
                }
            }
            response = requests.post(url, json=payload, headers=headers, timeout=20)
            if response.status_code == 200:
                audio_b64 = base64.b64encode(response.content).decode("utf-8")
                return f"data:audio/mpeg;base64,{audio_b64}"
            else:
                print(f"[ElevenLabs TTS Notice] Voice {vid} returned {response.status_code}, trying fallback voice...")
        except Exception as e:
            print(f"[ElevenLabs TTS Exception on {vid}]: {e}")

    return None

def generate_sfx(sfx_prompt: str) -> Optional[str]:
    """Generates sound effects using ElevenLabs Sound Generation API."""
    eleven_key = os.getenv("ELEVENLABS_API_KEY", ELEVENLABS_API_KEY)
    if not eleven_key or not sfx_prompt:
        return None
    try:
        url = "https://api.elevenlabs.io/v1/sound-generation"
        headers = {
            "xi-api-key": eleven_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": sfx_prompt,
            "duration_seconds": 3.0,
            "prompt_influence": 0.4
        }
        response = requests.post(url, json=payload, headers=headers, timeout=20)
        if response.status_code == 200:
            audio_b64 = base64.b64encode(response.content).decode("utf-8")
            return f"data:audio/mpeg;base64,{audio_b64}"
        else:
            print(f"[ElevenLabs SFX Error] Status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"[ElevenLabs SFX Exception]: {e}")
        return None

@app.get("/")
def health_check():
    client = get_supabase_client()
    return {
        "status": "online",
        "app": "TouchGrass: Joy Radar Backend",
        "groq_configured": bool(os.getenv("GROQ_API_KEY", GROQ_API_KEY)),
        "elevenlabs_configured": bool(os.getenv("ELEVENLABS_API_KEY", ELEVENLABS_API_KEY)),
        "supabase_configured": bool(client is not None),
    }

@app.get("/api/moments")
def get_moments():
    """Returns all moments from Supabase or memory fallback."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("joy_moments").select("*").order("created_at", desc=True).limit(100).execute()
            if res.data is not None:
                return res.data
        except Exception as e:
            print(f"[Supabase Fetch Error]: {e}")
    
    return IN_MEMORY_MOMENTS


@app.post("/api/save-moment")
def save_moment(req: SaveMomentRequest):
    """Saves a joy moment to Supabase or in-memory fallback."""
    item = {
        "caption": req.caption,
        "narration": req.narration,
        "image_url": req.image_url,
        "joy_category": req.joy_category,
        "persona_name": req.persona_name,
        "is_cheat": req.is_cheat,
        "cheat_reason": req.cheat_reason,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "speech_audio_url": req.speech_audio_url,
        "sfx_audio_url": req.sfx_audio_url,
    }

    moment_id = None
    saved_to_supabase = False

    client = get_supabase_client()
    if client:
        try:
            res = client.table("joy_moments").insert(item).execute()
            if res.data and len(res.data) > 0:
                moment_id = res.data[0].get("id")
                saved_to_supabase = True
                print(f"[Supabase] Saved moment via API: {moment_id}")
        except Exception as e:
            print(f"[Supabase Insert Error]: {e}")

    # Also keep in memory
    item["id"] = moment_id or f"mem-{len(IN_MEMORY_MOMENTS)+1}"
    item["created_at"] = "now"
    IN_MEMORY_MOMENTS.insert(0, item)

    return {
        "success": True,
        "savedToSupabase": saved_to_supabase,
        "id": item["id"]
    }

@app.get("/api/generate-task")
@app.post("/api/generate-task")
def generate_random_task():
    """Generates an easy, spontaneous offline 'Touch Grass' task using Groq AI."""
    groq_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY)
    
    fallback_tasks = [
        {"title": "Touch Real Green Grass", "description": "Step outside, find real lawn or park grass, and physically touch it with your bare hand or shoe.", "category": "nature", "icon": "Sprout"},
        {"title": "Find a Smooth Stone or Pebble", "description": "Look at the ground and find a small stone, pebble, or brick surface and touch it.", "category": "nature", "icon": "Layers"},
        {"title": "Spot Something Bright Yellow", "description": "Find an everyday object, leaf, or flower around you that is bright yellow.", "category": "small-wins", "icon": "Sun"},
        {"title": "Touch Tree Bark", "description": "Walk up to a real tree and feel the rough texture of its bark with your hand.", "category": "nature", "icon": "Trees"},
        {"title": "Snap a Real Shadow", "description": "Look down at the floor or pavement and snap the shadow cast by sunlight or a window.", "category": "small-wins", "icon": "Sun"},
        {"title": "Touch Fresh Water", "description": "Turn on a tap or find a drop of water, dew, or a puddle and snap your hand touching it.", "category": "nature", "icon": "Waves"},
        {"title": "Spot a Houseplant or Leaf", "description": "Find any leafy plant in your room, balcony, or hallway and touch its green leaf.", "category": "nature", "icon": "Leaf"},
        {"title": "Look Up At The Open Sky", "description": "Step outside or to a window, tilt your head back, and snap the open sky and clouds.", "category": "nature", "icon": "Cloud"},
        {"title": "Find a Steaming Cup", "description": "Snap a warm cup of chai, coffee, or tea in your mug or at a street stall.", "category": "food", "icon": "Coffee"},
        {"title": "Physical Paper Book", "description": "Find a real paper book or handwritten notebook (not a screen) and snap its open pages.", "category": "small-wins", "icon": "Book"},
        {"title": "Touch an Authentic Wooden Surface", "description": "Find an authentic wooden door, bench, or table and touch the physical grain.", "category": "small-wins", "icon": "Layers"},
        {"title": "Spot an Animal or Bird", "description": "Find any real bird in the sky, stray dog, cat, or pigeon outside and snap it.", "category": "nature", "icon": "Heart"}
    ]

    if not groq_key:
        return random.choice(fallback_tasks)

    try:
        client = Groq(api_key=groq_key)
        prompt = """Generate ONE ultra-simple, fun, creative physical offline task for our "Touch Grass" wellness game.
Rules:
1. It must be doable in under 60 seconds using common physical objects anyone can find easily in their immediate indoor or outdoor surroundings (e.g., touching a real plant, finding something blue or yellow, touching rough brick or wood, looking at sky clouds, finding a cup of water, stepping on grass, touching shoes).
2. It must NEVER require expensive equipment, travelling, or screens.
3. Keep the description clear, encouraging, and easy to complete right now.

Return strictly JSON matching:
{
  "title": "Short catchy title (max 5 words)",
  "description": "Clear 1-sentence instruction on what to touch or find right now.",
  "category": "nature",
  "icon": "Sprout"
}"""
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.95,
            max_tokens=200
        )
        task_data = json.loads(completion.choices[0].message.content)
        if "title" in task_data and "description" in task_data:
            return task_data
    except Exception as e:
        print(f"[Generate AI Task Exception]: {e}")

    return random.choice(fallback_tasks)

@app.post("/api/process-moment")
def process_moment(req: MomentRequest):
    groq_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY)
    if not groq_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured in backend/.env. Please add it to enable Vision analysis."
        )

    # Format image as Data URI if not already formatted
    image_url = req.image_base64
    if not image_url.startswith("data:"):
        image_url = f"data:image/jpeg;base64,{image_url}"

    client = Groq(api_key=groq_key)

    is_free_roam = (
        (getattr(req, "mode", None) and str(req.mode).lower() == "snap")
        or req.quest_category == "any"
        or "snap" in req.quest_title.lower()
        or "free roam" in req.quest_title.lower()
    )

    if is_free_roam:
        mode_instruction = f"""CURRENT MODE: SNAP A MOMENT (Spontaneous Real-World Snapshot)
The user is freely snapping ANY spontaneous moment from their life (food, drinks, street scenes, friends, pets, sky, coffee, plants, architecture, everyday objects).
CRITICAL RULES FOR SNAP MODE:
1. NO TASK VERIFICATION: There is NO assigned task! Do NOT check this photo against any task, mission, or requirement to touch grass. Any real-world photo is 100% valid.
2. NO CHEATING ERRORS: "isCheat" MUST BE STRICTLY FALSE. "cheatReason" MUST BE null. Do NOT flag this as cheated, wrong item, or fake under any circumstances.
3. Content & Atmosphere Analysis: Visually examine what is actually in the photo (the objects, colors, atmosphere, lighting, mood, scene).
4. Snappy Polaroid Title: Dynamically decide a fitting, witty, or poetic caption (maximum 8 words).
5. Engaging Commentary: Deliver an entertaining 2-to-3 sentence commentary in the character of "{req.persona_name}" following "{req.persona_style}", reacting directly to what they photographed!
6. Mood Categorization: Determine the most accurate joyCategory: "nature", "food", "people", or "small-wins"."""
    else:
        mode_instruction = f"""CURRENT MODE: TOUCH THE GRASS CHALLENGE
Assigned Task: "{req.quest_title}"
Task Description: "{req.quest_category}"

1. Task & Anti-Cheat Verification:
   - Carefully check if the user actually performed this task in the physical real world.
   - Flag isCheat = true if:
     a) The image is a photo of a computer, laptop, monitor, or phone screen displaying a photo.
     b) The photo completely fails to show the requested task.
   - If isCheat = true: Witty, savage roast! Mercilessly call them out for faking the challenge with a screen or wrong item. Urge them in funny, firm terms to get off their chair, put their shoes on, and actually go touch real grass and do the task!
2. If genuinely completed (isCheat = false):
   - Shower them with warm, inspiring appreciation and uplifting praise in the voice of "{req.persona_name}"!
   - Celebrate them for breaking the digital trap, breathing fresh air, and completing the offline mission.
   - Reference specific physical details seen in their photo (the texture, sunlight, colors, angle)."""

    system_prompt = f"""You are the core AI Vision & Anti-Cheat engine for "TouchGrass: Joy Radar", a real-world wellness app that pushes digital screen addicts outside to touch real grass and discover offline joy.

{mode_instruction}

Narrator Persona: "{req.persona_name}"
Narrator Personality & Style: "{req.persona_style}"

Output Fields in strict JSON format:
- "isCheat": boolean (true if screen/fake in Touch Grass mode, false if genuine real-world physical photo or Snap mode)
- "cheatReason": string or null (If isCheat is true, a witty 1-liner roast explaining how they got caught in 4K. If false, null)
- "caption": string (A punchy, snappy Polaroid title matching the photo, maximum 8 words)
- "narration": string (A 2-to-3 sentence script in the voice of "{req.persona_name}". If isCheat is true, roast them and urge them to do it for real. If isCheat is false, praise and appreciate them with good lines!)
- "joyCategory": string (One of: "nature", "food", "people", "small-wins", or "cheater")
- "sfxPrompt": string (A 4-8 word English descriptive prompt for an authentic sound effect matching the photo. If isCheat is true, use: "loud game show fail buzzer and sad trombone")

Return ONLY valid JSON matching this schema:
{{
  "isCheat": false,
  "cheatReason": null,
  "caption": "A Beautiful Real World Moment",
  "narration": "Look at that! You stepped outside and captured this genuine real-world moment...",
  "joyCategory": "nature",
  "sfxPrompt": "birds chirping softly in sunny green garden"
}}"""

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": system_prompt
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": image_url
                    }
                }
            ]
        }
    ]

    vision_data = None
    models_to_try = [
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "llama-3.2-11b-vision-preview"
    ]

    last_error = None
    for model_name in models_to_try:
        try:
            print(f"[Groq Vision] Attempting model: {model_name}")
            completion = client.chat.completions.create(
                model=model_name,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=600
            )
            raw_content = completion.choices[0].message.content
            vision_data = json.loads(raw_content)
            print(f"[Groq Vision] Success with {model_name}")
            break
        except Exception as e:
            print(f"[Groq Vision] Model {model_name} failed: {e}")
            last_error = e

    if not vision_data:
        raise HTTPException(
            status_code=500,
            detail=f"Groq Vision analysis failed on all models. Details: {str(last_error)}"
        )

    # In Snap mode, never flag cheating or cheating errors
    if is_free_roam:
        is_cheat = False
        cheat_reason = None
        raw_cat = str(vision_data.get("joyCategory", "small-wins")).lower()
        joy_category = "small-wins" if raw_cat == "cheater" else raw_cat
    else:
        is_cheat = bool(vision_data.get("isCheat", False))
        cheat_reason = vision_data.get("cheatReason") if is_cheat else None
        joy_category = "cheater" if is_cheat else vision_data.get("joyCategory", "small-wins")

    caption = vision_data.get("caption", "Joy Captured")
    narration = vision_data.get("narration", "A wonderful moment of offline joy.")
    sfx_prompt = vision_data.get("sfxPrompt", "loud game show fail buzzer and sad horn" if is_cheat else "gentle ambient nature breeze")

    # Step B: ElevenLabs TTS + Sound Effects
    speech_audio_url = generate_speech(narration, req.voice_id)
    sfx_audio_url = generate_sfx(sfx_prompt)

    # Step C: Save to Supabase
    lat = req.latitude if req.latitude is not None else 28.6139
    lng = req.longitude if req.longitude is not None else 77.2090
    saved_to_supabase = False
    moment_id = None

    moment_row = {
        "caption": caption,
        "narration": narration,
        "image_url": image_url,
        "joy_category": joy_category,
        "persona_name": req.persona_name,
        "is_cheat": is_cheat,
        "cheat_reason": cheat_reason,
        "latitude": lat,
        "longitude": lng,
        "speech_audio_url": speech_audio_url,
        "sfx_audio_url": sfx_audio_url,
    }

    client = get_supabase_client()
    if client:
        try:
            res = client.table("joy_moments").insert(moment_row).execute()
            if res.data and len(res.data) > 0:
                moment_id = res.data[0].get("id")
                saved_to_supabase = True
                print(f"[Supabase] Moment saved automatically to joy_moments table: {moment_id}")
        except Exception as e:
            print(f"[Supabase Auto-Save Error]: {e}")

    # Also keep in in-memory list
    moment_row["id"] = moment_id or f"mem-{len(IN_MEMORY_MOMENTS)+1}"
    moment_row["created_at"] = "now"
    IN_MEMORY_MOMENTS.insert(0, moment_row)

    return {
        "isCheat": is_cheat,
        "cheatReason": cheat_reason,
        "caption": caption,
        "narration": narration,
        "joyCategory": joy_category,
        "sfxPrompt": sfx_prompt,
        "speechAudioUrl": speech_audio_url,
        "sfxAudioUrl": sfx_audio_url,
        "savedToSupabase": saved_to_supabase,
        "momentId": moment_id or moment_row["id"],
        "latitude": lat,
        "longitude": lng,
    }

@app.get("/api/room-summary")
@app.post("/api/room-summary")
def get_room_summary():
    """Summarizes the collective mood of the room from recent moments using Groq LLM + ElevenLabs TTS."""
    groq_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY)

    # 1. Fetch recent moments (from Supabase or in-memory)
    recent_moments = []
    client = get_supabase_client()
    if client:
        try:
            res = client.table("joy_moments").select("*").order("created_at", desc=True).limit(20).execute()
            if res.data:
                recent_moments = res.data
        except Exception as e:
            print(f"[Supabase Fetch in Room Summary]: {e}")

    if not recent_moments:
        recent_moments = IN_MEMORY_MOMENTS[:20]

    # Handle empty state
    if not recent_moments:
        return {
            "headline": "Awaiting Room Pioneers",
            "summaryText": "The room is currently serene and offline. Be the first adventurer to step outside, snap a leaf or a chai, and ignite the joy wave!",
            "moodStats": "100% Potential Joy, 0% Cheaters",
            "vibeScore": 88,
            "speechAudioUrl": None
        }

    # Format moments for the prompt
    moments_lines = []
    for m in recent_moments:
        moments_lines.append(
            f"- Category: {m.get('joy_category', 'general')}, Caption: '{m.get('caption', '')}', "
            f"Cheater: {m.get('is_cheat')}, Narrator: {m.get('persona_name', 'Radar')}"
        )
    moments_text = "\n".join(moments_lines)

    summary_text = "This room is radiating pure wholesome vibes with an unstoppable wave of offline joy!"
    headline = "Peak Offline Euphoria"
    mood_stats = "65% Chai & Coffee, 25% Real Grass Touched, 10% Caught In 4K"
    vibe_score = 96

    if groq_key:
        prompt = f"""You are the Grand AI Master of Ceremonies analyzing a live room radar of real-world offline moments snapped by the audience.

Here are the most recent moments captured in the room:
{moments_text}

Task:
Produce a witty, hilarious, yet deeply celebratory summary of the room's collective mood.
Return ONLY valid JSON matching this schema:
{{
  "headline": "A punchy 3-to-6 word bold headline (e.g. 'Peak Chai-Fueled Nirvana')",
  "summaryText": "A witty, dramatic 3-sentence summary of what this room is feeling, mentioning specific trends from the moments. If any cheaters were caught in 4K, give them a playful roast. End on a high-energy celebratory note!",
  "moodStats": "A fun percentage breakdown like '70% Chai & Snacks, 20% Nature Wonders, 10% Desperate for a Nap'",
  "vibeScore": 95
}}"""
        client = Groq(api_key=groq_key)
        for model_choice in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
            try:
                completion = client.chat.completions.create(
                    model=model_choice,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.7,
                    max_tokens=500
                )
                data = json.loads(completion.choices[0].message.content)
                summary_text = data.get("summaryText", summary_text)
                headline = data.get("headline", headline)
                mood_stats = data.get("moodStats", mood_stats)
                vibe_score = data.get("vibeScore", vibe_score)
                break
            except Exception as e:
                print(f"[Groq Room Summary with {model_choice}]: {e}")

    # Generate ElevenLabs speech narration for the finale (Sir David Attenborough voice)
    speech_audio_url = generate_speech(summary_text, voice_id="pNInz6obpgDQGcFmaJgB")

    return {
        "headline": headline,
        "summaryText": summary_text,
        "moodStats": mood_stats,
        "vibeScore": vibe_score,
        "speechAudioUrl": speech_audio_url
    }

DEMO_SEEDS = [
    {
        "caption": "Steaming Kulhad Chai at 2 AM",
        "narration": "Kya baat hai! Last ball pe boundary jaisa swaad! Midnight hackathon fuel in a clay cup, full energy double century moment!",
        "image_url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80",
        "joy_category": "food",
        "persona_name": "IPL Hinglish Commentator",
        "is_cheat": False,
        "cheat_reason": None,
        "latitude": 28.6280,
        "longitude": 77.2180,
        "speech_audio_url": None,
        "sfx_audio_url": None,
    },
    {
        "caption": "Golden Pup Spotted in Lodhi Garden",
        "narration": "Look at this magnificent golden explorer bounding across the lush lawn. Pure, unadulterated happiness radiating through the trees.",
        "image_url": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80",
        "joy_category": "nature",
        "persona_name": "Sir David (Nature Doc)",
        "is_cheat": False,
        "cheat_reason": None,
        "latitude": 28.5933,
        "longitude": 77.2197,
        "speech_audio_url": None,
        "sfx_audio_url": None,
    },
    {
        "caption": "Touching Real Dew-Covered Grass",
        "narration": "Notice the cellular perfection of these morning water droplets. You stepped away from your glowing terminal and touched real photosynthesis.",
        "image_url": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80",
        "joy_category": "nature",
        "persona_name": "Sir David (Nature Doc)",
        "is_cheat": False,
        "cheat_reason": None,
        "latitude": 28.6139,
        "longitude": 77.2090,
        "speech_audio_url": None,
        "sfx_audio_url": None,
    },
    {
        "caption": "Squad High-Five After Git Merge",
        "narration": "That wholesome triumphant moment when the merge conflicts vanish and everyone smiles! You are officially slaying this sprint.",
        "image_url": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80",
        "joy_category": "people",
        "persona_name": "Warm Joy Radar",
        "is_cheat": False,
        "cheat_reason": None,
        "latitude": 28.6315,
        "longitude": 77.2167,
        "speech_audio_url": None,
        "sfx_audio_url": None,
    },
    {
        "caption": "Crispy Street Samosas Fuel",
        "narration": "Look at that golden triangular mastery of carbohydrates and spices. Who needs sleep when you have fried joy?",
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
        "joy_category": "food",
        "persona_name": "Savage Roast Master",
        "is_cheat": False,
        "cheat_reason": None,
        "latitude": 28.6358,
        "longitude": 77.2245,
        "speech_audio_url": None,
        "sfx_audio_url": None,
    },
    {
        "caption": "Caught in 4K: macOS Grass Wallpaper",
        "narration": "Arre bhai bhai bhai! Third umpire ne review kiya aur caught behind ho gaye! MacBook ke retina screen ki reflection aur bezel saaf dikh rahi hai. Real grass touch karo bro!",
        "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
        "joy_category": "cheater",
        "persona_name": "IPL Hinglish Commentator",
        "is_cheat": True,
        "cheat_reason": "Caught red-handed with retina display bezel reflections! Nice pixel grid bro, go touch real grass!",
        "latitude": 28.6190,
        "longitude": 77.2100,
        "speech_audio_url": None,
        "sfx_audio_url": None,
    }
]

@app.post("/api/seed-demo")
@app.get("/api/seed-demo")
def seed_demo_moments():
    """Seeds 6 diverse, pre-crafted hackathon moments into Supabase and in-memory list."""
    inserted = []
    client = get_supabase_client()
    for item in DEMO_SEEDS:
        copy_item = dict(item)
        if client:
            try:
                res = client.table("joy_moments").insert(copy_item).execute()
                if res.data and len(res.data) > 0:
                    inserted.append(res.data[0])
            except Exception as e:
                print(f"[Supabase Seed Warning]: {e}")

        # In-memory fallback
        copy_item["id"] = f"seed-{len(IN_MEMORY_MOMENTS) + 1}"
        copy_item["created_at"] = "now"
        IN_MEMORY_MOMENTS.insert(0, copy_item)
        if not client:
            inserted.append(copy_item)

    return {
        "success": True,
        "message": f"Successfully seeded {len(DEMO_SEEDS)} demo moments!",
        "count": len(DEMO_SEEDS),
        "moments": inserted or DEMO_SEEDS
    }


