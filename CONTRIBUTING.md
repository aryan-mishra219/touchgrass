# 🎃 Contributing to TouchGrass: Joy Radar
> **MLH Hacktoberfest Open-Source Guide**

Thank you for your interest in contributing to **TouchGrass: Joy Radar**! Whether you want to add local culture quests from your city or create a new AI persona, this project makes open-source contributions fun and beginner-friendly.

---

## 🌟 How You Can Contribute (No Complex Code Required!)

### 1. Add A Localized Quest (`frontend/src/data/quests.json`)
Help users discover offline joy in your hometown, university campus, or local neighborhood!

Append a new object to the array in `frontend/src/data/quests.json`:
```json
{
  "id": "delhi-chai-tapri",
  "title": "Tapri Wali Chai",
  "description": "Snap a glass of steaming ginger chai from your favorite roadside stall",
  "category": "food",
  "emoji": "☕"
}
```

**Fields:**
- `id`: Unique kebab-case string identifier (e.g. `mumbai-vada-pav`, `boston-common-duck`).
- `title`: Snappy quest title (2-4 words).
- `description`: 1-sentence prompt for the user.
- `category`: One of `"nature"`, `"food"`, `"people"`, or `"any"`.
- `emoji`: A single descriptive emoji.

---

### 2. Add A Narrator Persona (`frontend/src/data/personas.json`)
Add a distinct voice, accent, or comedic personality to narrate moments!

Append a new object to the array in `frontend/src/data/personas.json`:
```json
{
  "id": "anime-shonen-protagonist",
  "name": "Shonen Protagonist",
  "emoji": "⚔️",
  "voice_id": "VR6AewLTigWG4xSOukaG",
  "style": "Over-the-top anime hero screaming with fiery passion about the power of friendship and nature, treating this small moment like unlocking an ultimate final form!"
}
```

**Fields:**
- `id`: Unique kebab-case string identifier.
- `name`: Display name shown on the Polaroid card.
- `emoji`: Character emoji.
- `voice_id`: An ElevenLabs voice ID (use a shared library ID or standard default).
- `style`: Concrete prompting instruction for how Groq LLM should format the script and tone.

---

## 🚀 Step-by-Step Pull Request Workflow

1. **Fork the Repository**:
   Click the **Fork** button at the top-right of the GitHub repository.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/TouchGrass.git
   cd TouchGrass
   ```
3. **Create a branch**:
   ```bash
   git checkout -b quest/tapri-chai
   ```
4. **Make your changes**:
   Edit `frontend/src/data/quests.json` or `frontend/src/data/personas.json`.
5. **Verify locally**:
   ```bash
   cd frontend
   npm run build
   ```
6. **Commit & Push**:
   ```bash
   git commit -am "feat: add Tapri Wali Chai quest for Hacktoberfest"
   git push origin quest/tapri-chai
   ```
7. **Open a Pull Request**:
   - Title: `feat(quests): Add Tapri Wali Chai quest`
   - Include the tag `#hacktoberfest-accepted` in your description.

---

## 💡 Code of Conduct
Be kind, welcoming, and celebrate each other's offline joy! 🌱
