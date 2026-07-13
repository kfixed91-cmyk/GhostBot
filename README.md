# 👻 GhostBot

<div align="center">

**A Premium, Ultra-Complete WhatsApp Multi-Device Bot**

*Inspired by elite bot aesthetics — built with clean, modular, production-ready code.*

</div>

---

## 📋 Features

### 🤖 AI
- `.ai` — Chat with AI (Gemini/OpenAI)
- `.gpt` — OpenAI ChatGPT
- `.gemini` — Google Gemini AI
- `.imgai` — AI Image Generation (DALL-E)
- `.codeai` — AI Coding Assistant
- `.translateai` — AI-Powered Translation
- `.explain` — AI Topic Explanation
- `.summarize` — AI Text Summarization

### 📥 Downloader
- `.play` — Search & download music
- `.ytmp3` — YouTube to MP3
- `.ytmp4` — YouTube to MP4
- `.tiktok` — TikTok video downloader
- `.ig` — Instagram downloader
- `.facebook` — Facebook video downloader
- `.twitter` — Twitter/X video downloader
- `.mediafire` — MediaFire downloader

### 👥 Group Management
- `.tagall` / `.hidetag` — Tag all members
- `.kick` / `.add` — Remove/Add members
- `.promote` / `.demote` — Manage admins
- `.mute` / `.unmute` — Group mute control
- `.setname` / `.setdesc` — Group settings
- `.revoke` — Reset invite link
- `.linkgc` — Get group link
- `.admins` — List admins
- `.ginfo` — Group information
- `.antilink` / `.antispam` / `.antidelete` / `.antibadword` / `.antibot` — Protection systems
- `.welcome` / `.goodbye` — Welcome/goodbye messages

### 🎬 Media
- `.sticker` — Create sticker from image/video
- `.take` — Change sticker metadata
- `.toimg` — Sticker to image
- `.tomp3` — Video to audio
- `.tovn` — Audio to voice note
- `.tourl` — Upload media to URL
- `.removebg` — Remove image background
- `.hd` — Enhance image quality
- `.ocr` — Read text from image
- `.qr` — Generate QR code
- `.readqr` — Read QR code from image

### 🛠️ Tools
- `.tts` — Text to Speech
- `.trt` — Translate text
- `.weather` — Weather info
- `.define` — Dictionary
- `.time` — World time
- `.calc` — Calculator
- `.shorturl` — URL shortener
- `.whois` — Domain WHOIS

### 🎮 Fun
- `.menu` / `.allmenu` — Command menus
- `.ping` — Bot speed check
- `.alive` — Bot status
- `.owner` — Owner info
- `.repo` — Repository info
- `.joke` / `.quote` / `.fact` — Entertainment
- `.ship` — Love compatibility
- `.compliment` / `.insult` — Fun messages
- `.truth` / `.dare` — Game prompts

### 💎 Economy
- `.profile` — User profile
- `.balance` — Check balance
- `.daily` — Daily reward
- `.work` — Work for money
- `.deposit` / `.withdraw` — Bank system
- `.transfer` — Send money

### 👑 Owner
- `.mode` — Public/Private mode
- `.restart` / `.shutdown` — Bot control
- `.block` / `.unblock` — User management
- `.broadcast` — Mass messaging
- `.setppbot` — Bot profile picture
- `.setprefix` — Change prefix
- `.join` / `.leave` — Group join/leave
- `.clearsession` — Clear session
- `.eval` — Code evaluation
- `.addprem` / `.delprem` / `.listprem` — Premium management

---

## 🚀 Installation

### Prerequisites
- **Node.js** v18 or higher
- **npm** (comes with Node.js)
- A **WhatsApp account** (secondary phone recommended)

### Local Setup

```bash
# 1. Clone or download the repository
cd DEMON-BOT-V7

# 2. Install dependencies
npm install

# 3. Configure the bot
# Edit config.js — add your phone number, API keys, etc.

# 4. Start the bot
npm start
```

### Replit Setup

1. Create a new Node.js Repl on [Replit](https://replit.com)
2. Upload all project files
3. In the Replit shell, run:
   ```bash
   npm install
   npm start
   ```
4. Scan the QR code or use pairing code when prompted
5. Keep the Repl alive using [UptimeRobot](https://uptimerobot.com) or similar

---

## 🔗 Connection Methods

### QR Code (Default)
1. Start the bot: `npm start`
2. Choose option `1` (QR Code)
3. Open WhatsApp on your phone → Linked Devices → Link a Device
4. Scan the QR code shown in terminal

### Pairing Code
1. Start the bot: `npm start`
2. Choose option `2` (Pairing Code)
3. Enter your phone number with country code (e.g. `50912345678`)
4. Enter the pairing code shown in your WhatsApp

---

## ⚙️ Configuration

Edit `config.js` to customize:

```js
module.exports = {
  BOT_NAME: "DEMON BOT V7",       // Bot display name
  OWNER_NAME: "King Fixed",       // Your name
  OWNER_NUMBER: ["509XXXXXXXXX"], // Your WhatsApp number(s)
  PREFIX: ".",                    // Command prefix
  MODE: "public",                 // "public" or "private"
  // ... and many more options!
};
```

### API Keys (Optional but Recommended)

| Feature | Key | Get It From |
|---------|-----|-------------|
| AI Chat | `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| AI Chat (alt) | `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| Remove BG | `REMOVEBG_API_KEY` | https://remove.bg/api |
| Weather | `OPENWEATHER_API_KEY` | https://openweathermap.org/api |
| OCR | `OCR_API_KEY` | https://ocr.space/ocrapi |

---

## 📁 Project Structure

```
DEMON-BOT-V7/
├── main.js              # Entry point — bot initialization
├── config.js            # All configurable settings
├── settings.js          # Message style & templates
├── package.json         # Dependencies & scripts
├── session/             # WhatsApp auth session (auto-generated)
└── src/
    ├── handler/         # Message & command processing
    │   ├── message.js
    │   ├── commandHandler.js
    │   ├── groupHandler.js
    │   └── events.js
    ├── commands/        # All command files (by category)
    │   ├── ai/
    │   ├── downloader/
    │   ├── group/
    │   ├── media/
    │   ├── fun/
    │   ├── tools/
    │   ├── owner/
    │   └── economy/
    ├── lib/             # Utility libraries
    │   ├── aiProvider.js
    │   ├── database.js
    │   ├── fetcher.js
    │   ├── menuBuilder.js
    │   ├── premium.js
    │   ├── sendMessage.js
    │   ├── sticker.js
    │   ├── uploader.js
    │   └── utils.js
    ├── database/        # JSON data storage (auto-generated)
    └── assets/          # Bot assets
```

---

## 🔧 Adding Commands

Create a new file in the appropriate command category:

```js
// src/commands/fun/mynewcmd.js
module.exports = {
  name: "mynewcmd",
  aliases: ["mnc"],
  category: "fun",
  description: "My new custom command",
  usage: ".mynewcmd <arg>",
  async execute({ sock, m, args, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    await reply(sock, m, "Hello from my new command!");
  },
};
```

The command will be auto-loaded on next restart.

---

## ⚠️ Important Notes

- **Use a secondary WhatsApp number** — WhatsApp may ban numbers used for bots
- **Keep API keys private** — Never share your `config.js` with API keys
- **Respect WhatsApp's Terms of Service**
- **This bot is for educational purposes** — Use at your own risk
- The bot may disconnect occasionally; it will auto-reconnect

---

## 📜 License

MIT License — Free to use, modify, and distribute.

---

<div align="center">

**Made with 🔥 by King Fixed**

*Powered by GhostBot*

</div>
