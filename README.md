# 🔍 AI Search Revealer (Premium Edition)

![AI Search Revealer Icon](./public/icons/icon128.png)

**AI Search Revealer** is a high-performance, premium Chrome extension that uncovers the hidden search queries used by AI models before they answer your prompts. Gain deep insights into the "thought process" of your favorite LLMs.

---

## 🚀 Key Features

- **Multi-Platform Intelligence**: Unified, robust extraction for:
  - **ChatGPT** (SearchGPT & standard models)
  - **Claude** (Tool-use & completion parsing)
  - **Perplexity** (SSE message extraction)
  - **Gemini** (Advanced deep-array parsing of `batchexecute` responses)
- **Premium Glassmorphism UI**: A stunning, non-intrusive overlay with real-time "Live" status and platform-specific tagging.
- **Bubble Mode (UX)**: Minimize the UI into a small, pulsing bubble to keep your workspace clean.
- **One-Click Research Tools**:
  - 🔎 **Verify**: Instant Google Search for any query.
  - 📈 **Trends**: Check real-time demand on Google Trends.
  - 🧠 **Insights**: Deep-dive into AnswerThePublic research.
- **Proof of Value**: Real-time badge counter on the extension icon showing searches occurring behind the scenes.
- **Power Features**: Right-click context menus for "Verify with Google" and "Explain with ChatGPT."

---

## 🛠 Installation Guide

### 1. Build from Source
Ensure you have [Node.js](https://nodejs.org/) installed, then run:
```bash
# Install dependencies
npm install

# Build the production bundle
npm run build
```

### 2. Load into Chrome
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer Mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `dist` folder generated in your project directory.

---

## 🏗 Technical Stack

- **Core**: TypeScript (Strict Level 10)
- **Bundler**: Vite
- **Manifest**: Version 3 (Modern Standards)

---

## 🔒 Privacy & Local-First Philosophy

- **100% Local**: All network interception and parsing occur entirely within your browser. **No data ever leaves your computer.**
- **No Analytics**: We do not track you. No cookies, no tracking pixels, no telemetry.
- **Open Standards**: Fully compliant with Chrome Web Store safety guidelines.

[Review our Full Privacy Policy](./PRIVACY_POLICY.md)

---

### Developed with ❤️ by [MIMR Growth Lab](https://mimrgrowthlab.com)
© 2025 MIMR Growth Lab. All Rights Reserved.
