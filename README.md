<p align="center">
  <img src="assets/kavya_happy.png" width="180" alt="Kavya AI">
</p>

<h1 align="center">🎀 Kavya AI Assistant</h1>

<p align="center">
  <b>Your Personal AI Girlfriend with a 3D Avatar, Sweet Voice & Full PC Control</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/LLM-Llama_3.3_70B-green?logo=meta&logoColor=white" alt="LLM">
  <img src="https://img.shields.io/badge/TTS-Edge_Neural-purple?logo=microsoft&logoColor=white" alt="TTS">
  <img src="https://img.shields.io/badge/Voice-SwaraNeural_🎀-ff69b4" alt="Voice">
  <img src="https://img.shields.io/badge/Cost-100%25_FREE-brightgreen" alt="Free">
</p>

---

## ✨ What is Kavya?

Kavya is a **fully free, locally-running AI assistant** with a personality of a 22-year-old Indian girl who talks in Hinglish. She features:

- 🧠 **Llama 3.3 70B** brain via Groq (free API, no credit card)
- 🎀 **Sweet neural female voice** (Microsoft Edge TTS — `hi-IN-SwaraNeural`)
- 🎭 **3D VRM Avatar** with lip sync and 14 emotions
- 🖥️ **Full PC Control** — opens apps, types, clicks, controls volume, and more
- 📚 **Self-Learning Memory** — remembers facts you teach her
- ⏰ **Proactive Routines** — reminds you about meals, checks on you when idle
- 🎤 **Wake Word** — just say "Kavya" to activate (like Alexa!)

---

## 🎬 Features

### 🗣️ Voice Interaction
- **Wake word activation** — say "Kavya" to start talking
- **Continuous listening** — stays active for 45 seconds after each command
- **Edge TTS Neural voice** — sweet, natural Indian girl voice
- **Real-time lip sync** — 3D avatar moves lips while speaking

### 🖥️ PC Control (30+ Commands)
| Category | Commands |
|----------|----------|
| **Apps** | Open, Close, Focus any application |
| **Web** | YouTube search, Google search, Open URLs |
| **Mouse** | Move, Click, Double-click, Right-click, Drag, Scroll |
| **Keyboard** | Type text, Key press, Hotkeys (Ctrl+C, Alt+Tab, etc.) |
| **System** | Volume, Brightness, Screenshot, Lock, Shutdown, Restart |
| **Media** | Play/Pause, Next Track, Previous Track |
| **Files** | Open folders, Create files, Navigate filesystem |

### 🧠 Intelligence
- **14 Emotions** — Happy, Romantic, Jealous, Caring, Angry, Blush, and more
- **Self-Learning** — automatically learns conversation patterns
- **Persistent Memory** — teach her facts via the Memory Bank UI
- **Context-Aware** — remembers conversation history
- **Screen Reading** — can read your screen via OCR

### ⏰ Proactive Features
- 🍳 **9 AM** — Breakfast reminder
- 🍛 **1 PM** — Lunch reminder
- ☕ **5 PM** — Tea time reminder
- 🍽️ **8 PM** — Dinner reminder
- 💤 **2hr idle** — "Are you okay?" check-in

---

## 📁 Project Structure

```
Kavya_AI_Assistant/
├── app.py                  # 🧠 Flask backend — LLM, TTS, chat API, screen OCR
├── script.js               # 🎤 Frontend — voice recognition, audio, 3D avatar
├── style.css               # 🎨 UI styling — glassmorphism, animations
├── index.html              # 📄 Main HTML page
├── pc_control.py           # 🖥️ PC control engine — 30+ system commands
├── knowledge_se.json       # 📚 Software engineering knowledge base
├── memory.json             # 💾 Persistent memory (facts you teach)
├── assets/
│   ├── kavya.vrm           # 🎭 3D VRM avatar model
│   ├── kavya_happy.png     # 😊 Happy expression
│   ├── kavya_angry.png     # 😠 Angry expression
│   ├── kavya_sad.png       # 😢 Sad expression
│   ├── kavya_blush.png     # 😳 Blush expression
│   ├── kavya_idle.png      # 😌 Idle expression
│   └── avatar.png          # 🖼️ Avatar fallback image
├── .gitignore              # 🚫 Ignores audio/, history, cache
├── set_key.py              # 🔑 API key setup helper
├── patch_app.py            # 🔧 App patcher utility
├── test_all.py             # ✅ Integration tests
├── test_pc.py              # ✅ PC control tests
├── test_human.py           # ✅ Human-likeness tests
├── test_selflearn.py       # ✅ Self-learning tests
└── test_tiktok.py          # ✅ TTS tests
```

---

## 🚀 Quick Setup

### 1. Clone the repo
```bash
git clone https://github.com/gaurishankarbajpai/Kavya_AI_Assistant.git
cd Kavya_AI_Assistant
```

### 2. Install dependencies
```bash
pip install flask flask-cors groq edge-tts pillow pyautogui psutil pyperclip pygetwindow
```

### 3. Get your FREE Groq API Key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free, no credit card needed)
3. Create an API key

### 4. Set API Key
**Option A — Environment Variable (Recommended):**
```bash
# Windows CMD
set GROQ_API_KEY=gsk_your_key_here

# Windows PowerShell
$env:GROQ_API_KEY="gsk_your_key_here"

# Linux/Mac
export GROQ_API_KEY=gsk_your_key_here
```

**Option B — Direct in code:**
Edit `app.py` line 32 and replace `YOUR_GROQ_API_KEY_HERE` with your key.

### 5. Run
```bash
python app.py
```

### 6. Open in browser
```
http://localhost:5000
```

Click the **mic button** 🎤 and say **"Kavya"** to start talking!

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Python, Flask |
| **LLM** | Llama 3.3 70B via Groq (free) |
| **TTS** | Microsoft Edge TTS Neural (`hi-IN-SwaraNeural`) |
| **3D Avatar** | Three.js + VRM (Pixiv) |
| **Voice Input** | Web Speech API (browser) |
| **PC Control** | PyAutoGUI, psutil, subprocess |
| **OCR** | Windows WinRT OCR |
| **Frontend** | Vanilla JS, CSS3 (glassmorphism) |

---

## 🎤 Voice Commands Examples

| You Say | Kavya Does |
|---------|------------|
| "Kavya, Chrome kholo" | Opens Google Chrome |
| "Kavya, YouTube pe Arijit Singh laga do" | Searches & plays on YouTube |
| "Kavya, volume badhao" | Increases system volume |
| "Kavya, screenshot lo" | Takes a screenshot |
| "Kavya, kya time hua hai?" | Tells you the current time |
| "Kavya, mera naam kya hai?" | Answers from memory |
| "Kavya, notepad band karo" | Closes Notepad |
| "Kavya, Alt+Tab dabao" | Switches windows |

---

## 🧩 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send message, get AI response |
| `/api/tts` | POST | Generate speech audio |
| `/api/memory` | GET | Get all saved memories |
| `/api/teach` | POST | Teach a new fact |
| `/api/auto-learn` | POST | Auto-learn from conversation |
| `/api/screen` | GET | OCR — read screen text |

---

## ⚙️ Configuration

Edit these constants in `app.py`:

```python
CHAT_MODEL = "llama-3.3-70b-versatile"    # Main chat model
FAST_MODEL = "llama-3.1-8b-instant"       # Background tasks
EDGE_TTS_VOICE = "hi-IN-SwaraNeural"      # TTS voice
EDGE_TTS_RATE  = "+15%"                   # Speech speed
EDGE_TTS_PITCH = "+8Hz"                   # Voice pitch
```

---

## 📋 Requirements

- **OS:** Windows 10/11 (PC control features require Windows)
- **Python:** 3.10+
- **Browser:** Chrome/Edge (for Web Speech API)
- **Mic:** Required for voice interaction
- **Internet:** Required for Groq API and Edge TTS

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Submit pull requests

---

## 📜 License

This project is open source and free to use.

---

<p align="center">
  Made with ❤️ by <b>Gauri Shankar Bajpai</b>
</p>
