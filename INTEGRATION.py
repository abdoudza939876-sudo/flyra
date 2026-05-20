#!/usr/bin/env python3
"""
INTEGRATION GUIDE — How to connect final.html to ai.py
"""

print("""
╔══════════════════════════════════════════════════════════════════╗
║         MORPHEUS AI STYLIST — Integration Guide             ║
╚══════════════════════════════════════════════════════════════════╝

═════════════════════════════════════════════
STEP 1: Start the AI Server
═════════════════════════════════════════════

  cd /Users/snow/Documents/untitled\\ folder/untitled\\ folder/aaa.html
  python ai.py

  You'll see:
    Local: http://localhost:5001
    Standalone: http://localhost:5001/standalone


═════════════════════════════════════════════
STEP 2: Three ways to use it
═════════════════════════════════════════════

METHOD A — Standalone Chat (best for testing)
─────────────────────────────────────────────
Open in browser: http://localhost:5001/standalone

METHOD B — Use your own API keys (no server needed)
─────────────────────────────────────────────
Set environment variables and run ai.py:

  export ANTHROPIC_API_KEY=sk-ant-...
  python ai.py

METHOD C — Use local Ollama (free, offline)
─────────────────────────────────────────────
Install Ollama, then:
  ollama pull llama3.2
  export AI_PROVIDER=ollama
  python ai.py

METHOD D — Connect final.html to the server
─────────────────────────────────────────────
Modify these 2 functions in final.html:

1. Find: function getApiKey()
   Replace with:
   function getApiKey() {
     return 'server'; // Use server proxy
   }

2. Find: async function callClaudeAPI(userMessage)
   Replace with the server proxy version below.


═════════════════════════════════════════════
STEP 3: Quick patch for final.html
═════════════════════════════════════════════

Replace the callClaudeAPI function with:

  const SERVER_URL = 'http://localhost:5001';

  async function callClaudeAPI(userMessage) {
    try {
      const lang = currentLang || 'en';
      const res = await fetch(SERVER_URL + '/api/stylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          lang: lang,
          history: aiConversationHistory,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.reply) {
        aiConversationHistory.push({ role: 'user', content: userMessage });
        aiConversationHistory.push({ role: 'assistant', content: data.reply });
        return data.reply;
      }
      return null;
    } catch(e) {
      return null;
    }
  }

═════════════════════════════════════════════
STEP 4: Start & test
═════════════════════════════════════════════

  1. Terminal 1:
     cd .../aaa.html
     python ai.py

  2. Open final.html in browser:
     file:///.../aaa.html/final.html

  3. The AI Stylist window will now use your server.
     In DEMO MODE it uses fallback responses.
     With Ollama/Anthropic key it gives real AI answers.

═════════════════════════════════════════════
ENVIRONMENT VARIABLES
═════════════════════════════════════════════

  AI_PROVIDER=anthropic        # 'ollama', 'anthropic', 'openai'
  ANTHROPIC_API_KEY=sk-ant-... # Anthropic Claude API key
  OPENAI_API_KEY=sk-proj-...   # OpenAI API key
  OLLAMA_MODEL=llama3.2       # Ollama model name
  OLLAMA_URL=http://localhost:11434
  PORT=5001                    # Server port

═════════════════════════════════════════════
API ENDPOINTS
═════════════════════════════════════════════

  POST /api/stylist
    { "message": "...", "lang": "en", "history": [] }
    → { "reply": "...", "model": "...", "provider": "..." }

  POST /api/recommend
    { "style": "...", "budget": "...", "occasion": "...", "lang": "en" }
    → { "reply": "..." }

  POST /api/size-guide
    { "height": "...", "weight": "...", "fit_preference": "...", "lang": "en" }
    → { "reply": "..." }

  GET  /api/products → full product catalog

  GET  /api/config → server status & capabilities


═════════════════════════════════════════════
DEPLOY TO RAILWAY / RENDER / HEROKU
═════════════════════════════════════════════

  Railway:   git push railway main
  Render:    git push render main
  Vercel:    Not supported (Flask not Vercel-native — use serverless)

  After deploying, update final.html:
    const SERVER_URL = 'https://your-app.railway.app';

═════════════════════════════════════════════
TROUBLESHOOTING
═════════════════════════════════════════════

  Q: Server starts but AI returns errors
  A: Set your API key:
       export ANTHROPIC_API_KEY=sk-ant-...

  Q: Ollama not connecting
  A: Make sure Ollama is running:
       ollama serve
       ollama pull llama3.2

  Q: CORS errors in final.html
  A: The server handles CORS headers automatically.
     If using a deployed URL, update the SERVER_URL.
""")