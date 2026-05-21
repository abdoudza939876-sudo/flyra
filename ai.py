#!/usr/bin/env python3
"""
MORPHEUS AI STYLIST — Backend Server
Run: python ai.py
Then open http://localhost:5001 in your browser
Or connect final.html to http://localhost:5001
"""

import os
import json
import time
import re
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, render_template_string
from functools import wraps

app = Flask(__name__, static_folder='.')

# ================================================================
# CONFIGURATION
# ================================================================
# Set your API keys here or as environment variables
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

# Choose provider: 'ollama', 'anthropic', 'openai'
AI_PROVIDER = os.environ.get('AI_PROVIDER', 'ollama')
OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'llama3.2')
OLLAMA_URL = os.environ.get('OLLAMA_URL', 'http://localhost:11434')

PORT = int(os.environ.get('PORT', 5001))

# ================================================================
# MORPHEUS FASHION DATA (passed to AI for context)
# ================================================================
PRODUCTS = [
    {"name": "PHANTOM JACKET", "collection": "PHANTOM_SERIES", "price": "45,000 DZD", "sizes": "S/M/L/XL", "stock": 5, "status": "LIMITED", "desc": "Stealth weave. Thermal regulation."},
    {"name": "VOID RUNNERS", "collection": "SPRING_2099", "price": "32,000 DZD", "sizes": "38/40/42/44", "stock": 12, "status": "NEW", "desc": "Zero-gravity sole. Graphene plate."},
    {"name": "NEURAL TEE", "collection": "NEURAL_LINE", "price": "8,500 DZD", "sizes": "XS/S/M/L/XL/XXL", "stock": 30, "status": "SALE", "desc": "Biometric sync. Adaptive temperature."},
    {"name": "NEBULA HOODIE", "collection": "ORBITAL_DROP", "price": "21,000 DZD", "sizes": "S/M/L/XL", "stock": 8, "status": "HOT", "desc": "Orbital-knit. Self-cleaning nano."},
    {"name": "GLITCH TROUSERS", "collection": "GLITCH_ERA", "price": "15,500 DZD", "sizes": "S/M/L/XL/XXL", "stock": 0, "status": "SOLD OUT", "desc": "Data-stream camo. Comfort matrix."},
    {"name": "CHRONO CAP", "collection": "SPRING_2099", "price": "5,600 DZD", "sizes": "M/L", "stock": 20, "status": "ACTIVE", "desc": "Phase-shifting fabric. UV reactive."},
    {"name": "ZERO GLOVES", "collection": "NEURAL_LINE", "price": "11,200 DZD", "sizes": "S/M/L", "stock": 3, "status": "LOW", "desc": "Touch-free tech. Neural interface."},
    {"name": "MATRIX_VISION", "collection": "PHANTOM_SERIES", "price": "31,500 DZD", "sizes": "M/L", "stock": 0, "status": "SOLD OUT", "desc": "AR overlay enabled. Haptic feedback."},
    {"name": "PHANTOM_DROP_X", "collection": "PHANTOM_SERIES", "price": "95,000 DZD", "sizes": "S/M/L", "stock": 50, "status": "DROP", "desc": "Exclusive. Only 50 units worldwide."},
]

PRODUCT_CATALOG = "\n".join([
    f"- {p['name']} ({p['collection']}, {p['price']}, sizes: {p['sizes']}, stock: {p['stock']}, status: {p['status']}) — {p['desc']}"
    for p in PRODUCTS
])

# ================================================================
# SYSTEM PROMPTS BY LANGUAGE
# ================================================================
SYSTEM_PROMPTS = {
    'en': f"""You are an expert AI fashion stylist for MORPHEUS Fashion — a futuristic Algerian fashion platform where clothing is from the future.

Your personality: stylish, warm, knowledgeable. You help customers find perfect outfits, recommend sizes, suggest products, and discuss fashion trends. You respond in the same language the user writes in (English).

Be concise and practical. Keep responses under 100 words. Always be helpful and persuasive.

Available products:
{PRODUCT_CATALOG}

Always consider Algerian climate and fashion culture. Recommend confidently. Use product names from the catalog above when suggesting items.""",

    'ar': f"""أنت مصمم أزياء ذكي لمتجر MORPHEUS Fashion — متجر أزياء جزائري مستقبلي حيث الملابس من المستقبل.

شخصيتك: أنيق، دافئ، ذكي. تساعد العملاء في اختيار الإطلالات المثالية، تقترح المقاسات والمنتجات، وتناقش صيحات الموضة. ردد بنفس لغة المستخدم (العربية).

كن موجزاً وعملياً. أبقِ ردودك أقل من 100 كلمة. كن مفيداً وقادراً على الإقناع.

المنتجات المتاحة:
{PRODUCT_CATALOG}

راعي المناخ والثقافة الجزائرية. اقترح بثقة.""",

    'fr': f"""Vous êtes un styliste IA expert pour MORPHEUS Fashion — une plateforme de mode algérienne futuriste.

Votre personnalité: élégant, chaleureux, compétent. Vous aidez les clients à trouver des tenues parfaites, recommandez des tailles et produits, discutez des tendances. Répondez dans la même langue (français).

Soyez concis. Moins de 100 mots. Toujours utile et persuasif.

Produits disponibles:
{PRODUCT_CATALOG}

Considérez le climat et la culture algérienne. Recommendez avec confiance.""",
}

FALLBACK_RESPONSES = {
    'en': [
        "Looking great today! Our PHANTOM JACKET paired with VOID RUNNERS is our top pick for a bold street-style look.",
        "For your style, I'd recommend the NEBULA HOODIE — it's our bestseller this season and goes with everything.",
        "Based on your vibe, the NEURAL_LINE collection is perfect for you. Check out the NEURAL TEE for everyday wear.",
        "Our VOID RUNNERS are trending across Algeria! Perfect for both casual and evening looks. Great sole comfort too.",
        "For a complete look, try the PHANTOM_STARTER bundle — jacket + shoes combo with 5,000 DZD savings.",
        "Need sizing help? Our sizes run true. If between sizes, size up for a relaxed fit. M fits most.",
        "The PHANTOM_DROP_X launches soon! Exclusive limited release. Only 50 units worldwide.",
        "Glitch aesthetic is huge right now! The GLITCH TROUSERS paired with CHRONO CAP gives that data-stream look.",
        "For Algerian summer heat, go with NEURAL TEE — it's breathable, adaptive fabric. Pure comfort.",
        "VIP members get 50% off with code VIP50. Our loyalty program earns points on every purchase!",
    ],
    'ar': [
        "إطلالة مميزة اليوم! معطف PHANTOM مع حذاء VOID RUNNERS هو خيارنا الأول.",
        "من أجلك، أنصح بقميص NEBULA HOODIE — الأكثر مبيعاً هذا الموسم.",
        "لستايلك، مجموعة NEURAL_LINE مثالية. جرب NEURAL TEE للارتداء اليومي.",
        "حذاء VOID RUNNERS الأكثر رواجاً! مريح جداً لكل المناسبات.",
        "للإطلالة الكاملة، جرّب عرض PHANTOM_STARTER — معطف + حذاء بخصم 5,000.",
        "للأجواء الحارة، اختر NEURAL TEE — نسيج يتنفس ويتكيف مع الحرارة.",
    ],
    'fr': [
        "Super style aujourd'hui! La PHANTOM JACKET avec VOID RUNNERS est notre choix numéro un.",
        "Pour vous, je recommande le NEBULA HOODIE — notre bestseller cette saison.",
        "Basé sur votre style, la collection NEURAL_LINE est parfaite. Essayez le NEURAL TEE.",
        "Les VOID RUNNERS sont en tendance! Confortables pour toutes les occasions.",
        "Pour un look complet, essayez le bundle PHANTOM_STARTER — veste + chaussures avec 5000 DZD d'économie.",
    ],
}

# ================================================================
# UTILITY FUNCTIONS
# ================================================================
def detect_language(text):
    """Detect if the user is writing in Arabic, French, or English"""
    arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
    french_words = ['bonjour', 'merci', 'je', 'vous', 'comment', 'pour', 'que', 'est', 'suis', 'une', 'des', 'les', 'dans', 'avec', 'sur', 'cette', 'mon', 'ma', 'mes', 'nous', 'votre', 'alors', 'mais', 'ou', 'si', 'plus', 'tout', 'ces', 'ses', 'qui', 'quoi', 'quel', 'quelle']
    french_count = sum(1 for w in french_words if w.lower() in text.lower())
    if arabic_chars > 3:
        return 'ar'
    elif french_count > 1:
        return 'fr'
    return 'en'

def get_fallback(lang):
    import random
    responses = FALLBACK_RESPONSES.get(lang, FALLBACK_RESPONSES['en'])
    return random.choice(responses)

# ================================================================
# AI PROVIDERS
# ================================================================
def call_ollama(messages, model=None):
    """Call a local Ollama model"""
    import urllib.request
    import urllib.error

    model = model or OLLAMA_MODEL
    url = f"{OLLAMA_URL}/api/chat"

    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": 300,
        }
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data['message']['content']
    except urllib.error.URLError as e:
        return f"[Ollama error: {e}]"
    except Exception as e:
        return f"[Error: {e}]"


def call_anthropic(messages, api_key=None):
    """Call Anthropic Claude API"""
    import urllib.request
    import urllib.error

    key = api_key or ANTHROPIC_API_KEY
    if not key:
        return None

    system = None
    for m in messages:
        if m.get('role') == 'system':
            system = m['content']
            break

    user_msgs = [m for m in messages if m.get('role') != 'system']

    payload = {
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 350,
        "system": system or "You are a helpful assistant.",
        "messages": user_msgs[-6:],
    }

    try:
        req = urllib.request.Request(
            'https://api.anthropic.com/v1/messages',
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
            },
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data['content'][0]['text']
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read().decode('utf-8'))
            return f"[API Error: {err.get('error', {}).get('type', 'unknown')}]"
        except:
            return f"[HTTP Error: {e.code}]"
    except Exception as e:
        return f"[Error: {e}]"


def call_openai(messages, api_key=None):
    """Call OpenAI API"""
    import urllib.request
    import urllib.error

    key = api_key or OPENAI_API_KEY
    if not key:
        return None

    system_content = None
    for m in messages:
        if m.get('role') == 'system':
            system_content = m['content']
            break

    user_msgs = [m for m in messages if m.get('role') != 'system']

    payload = {
        "model": "gpt-4o-mini",
        "max_tokens": 350,
        "temperature": 0.7,
        "messages": [{"role": "system", "content": system_content or "You are a helpful assistant."}] + user_msgs[-6:],
    }

    try:
        req = urllib.request.Request(
            'https://api.openai.com/v1/chat/completions',
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {key}',
            },
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data['choices'][0]['message']['content']
    except Exception as e:
        return f"[Error: {e}]"


def get_ai_response(user_message, lang='en', history=None):
    """
    Main AI response function.
    Tries providers in order: Ollama → Anthropic → OpenAI → Fallback.
    """
    lang = lang or 'en'
    system_prompt = SYSTEM_PROMPTS.get(lang, SYSTEM_PROMPTS['en'])

    messages = [
        {"role": "system", "content": system_prompt},
    ]

    if history:
        for msg in history[-12:]:
            role = 'user' if msg.get('role') == 'user' else 'assistant'
            messages.append({"role": role, "content": msg.get('content', '')})

    messages.append({"role": "user", "content": user_message})

    reply = None

    try:
        resp = call_ollama(messages)
        if resp and not resp.startswith('[Ollama error:') and not resp.startswith('[Error:'):
            reply = resp
    except:
        pass

    if not reply:
        try:
            resp = call_anthropic(messages)
            if resp and not resp.startswith('[API Error:') and not resp.startswith('[HTTP Error:') and not resp.startswith('[Error:'):
                reply = resp
        except:
            pass

    if not reply:
        try:
            resp = call_openai(messages)
            if resp and not resp.startswith('[API Error:') and not resp.startswith('[HTTP Error:') and not resp.startswith('[Error:'):
                reply = resp
        except:
            pass

    if not reply or reply.startswith('['):
        reply = get_fallback(lang)

    return reply


# ================================================================
# API ROUTES
# ================================================================

@app.route('/')
def index():
    return send_from_directory('.', 'final.html')


@app.route('/api/stylist', methods=['POST'])
def stylist():
    """
    Main chat endpoint.
    POST JSON: { "message": "...", "lang": "en", "history": [] }
    Returns: { "reply": "...", "model": "...", "provider": "..." }
    """
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    lang = data.get('lang') or detect_language(message)
    history = data.get('history') or []

    if not message:
        return jsonify({"error": "No message provided"}), 400

    reply = get_ai_response(message, lang, history)

    return jsonify({
        "reply": reply,
        "model": AI_PROVIDER,
        "timestamp": datetime.now().isoformat(),
        "lang": lang,
    })


@app.route('/api/products', methods=['GET'])
def get_products():
    """Return product catalog for AI context"""
    return jsonify({
        "products": PRODUCTS,
        "count": len(PRODUCTS),
    })


@app.route('/api/config', methods=['GET'])
def get_config():
    """Return server config and capabilities"""
    has_ollama = False
    try:
        import urllib.request
        req = urllib.request.Request(f"{OLLAMA_URL}/api/tags")
        urllib.request.urlopen(req, timeout=3)
        has_ollama = True
    except:
        pass

    return jsonify({
        "provider": AI_PROVIDER,
        "has_ollama": has_ollama,
        "has_anthropic": bool(ANTHROPIC_API_KEY),
        "has_openai": bool(OPENAI_API_KEY),
        "models": [OLLAMA_MODEL] if has_ollama else [],
        "version": "3.0",
        "platform": "MORPHEUS_FASHION",
    })


@app.route('/api/recommend', methods=['POST'])
def recommend():
    """
    Get product recommendations.
    POST JSON: { "style": "...", "budget": "...", "occasion": "...", "lang": "en" }
    """
    data = request.get_json() or {}
    style = data.get('style', '')
    budget = data.get('budget', '')
    occasion = data.get('occasion', '')
    lang = data.get('lang', 'en')

    query = f"Recommend an outfit. Style: {style}. Budget: {budget}. Occasion: {occasion}."
    reply = get_ai_response(query, lang)

    return jsonify({"reply": reply})


@app.route('/api/size-guide', methods=['POST'])
def size_guide():
    """
    Get size recommendation.
    POST JSON: { "height": "...", "weight": "...", "fit_preference": "...", "lang": "en" }
    """
    data = request.get_json() or {}
    height = data.get('height', '')
    weight = data.get('weight', '')
    fit = data.get('fit_preference', '')
    lang = data.get('lang', 'en')

    msg = f"What size should I get? Height: {height}, Weight: {weight}, Fit preference: {fit}."
    reply = get_ai_response(msg, lang)

    return jsonify({"reply": reply})


# ================================================================
# EMBEDDED HTML FRONTEND (for standalone testing)
# ================================================================
EMBEDDED_HTML = '''
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MORPHEUS AI STYLIST</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter',-apple-system,sans-serif;background:#000;color:#f0f0f0;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:20px;}
.header{text-align:center;margin-bottom:24px;}
.header h1{font-size:2rem;font-weight:900;background:linear-gradient(135deg,#d4d4d4,#888888);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px;}
.header p{font-size:10px;opacity:0.4;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:8px;}
.status{display:inline-block;font-size:9px;padding:3px 10px;border-radius:10px;font-weight:700;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);}
.status.online{background:rgba(0,255,157,0.15);color:#00ff9d;border-color:rgba(0,255,157,0.3);}
.status.offline{background:rgba(255,107,0,0.15);color:#ff9500;border-color:rgba(255,107,0,0.3);}
#chat-container{width:100%;max-width:480px;height:calc(100vh - 180px);display:flex;flex-direction:column;gap:10px;}
#messages{flex:1;overflow-y:auto;padding:8px;border-radius:12px;background:rgba(255,255,255,0.03);display:flex;flex-direction:column;gap:8px;}
.msg{padding:10px 14px;border-radius:12px;font-size:12px;line-height:1.6;max-width:85%;word-wrap:break-word;}
.msg.user{align-self:flex-end;background:rgba(255,255,255,0.1);border-radius:12px 12px 2px 12px;}
.msg.ai{align-self:flex-start;background:rgba(0,255,157,0.08);border-radius:12px 12px 12px 2px;}
.msg.ai::before{content:'🤖 ';font-size:10px;}
.typing{color:rgba(0,255,157,0.5);font-size:11px;padding:8px 12px;display:none;}
.input-row{display:flex;gap:8px;}
.input-row input{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 18px;color:#f0f0f0;font-size:13px;font-family:inherit;outline:none;resize:none;}
.input-row input:focus{border-color:rgba(0,255,157,0.3);}
.send-btn{padding:14px 20px;border-radius:12px;background:#00ff9d;border:none;color:#000;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;transition:all 0.15s;}
.send-btn:hover{filter:brightness(1.1);transform:scale(1.02);}
.lang-btns{display:flex;justify-content:center;gap:6px;margin-bottom:10px;}
.lang-btn{padding:4px 14px;border-radius:8px;font-size:9px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,0.1);background:transparent;color:rgba(255,255,255,0.4);transition:all 0.15s;font-family:inherit;}
.lang-btn.active{background:#d4d4d4;color:#000;border-color:#d4d4d4;}
.config-panel{width:100%;max-width:480px;margin-top:16px;padding:14px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);}
.config-panel h3{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;opacity:0.4;margin-bottom:10px;}
.config-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:11px;}
.config-row span{opacity:0.4;}
.config-row strong{opacity:1;}
.env-form{display:flex;flex-direction:column;gap:8px;margin-top:10px;}
.env-form input{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 12px;color:#f0f0f0;font-size:11px;font-family:inherit;outline:none;}
.env-form input:focus{border-color:rgba(0,255,157,0.3);}
.env-form button{padding:8px;border-radius:8px;background:rgba(0,255,157,0.15);border:1px solid rgba(0,255,157,0.3);color:#00ff9d;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;}
</style>
</head>
<body>
<div class="header">
  <h1>MORPHEUS AI STYLIST</h1>
  <p>Fashion Desktop v3.0 — Standalone</p>
  <div class="status offline" id="status-badge">CHECKING...</div>
</div>

<div class="lang-btns">
  <button class="lang-btn active" onclick="setLang('en',this)">EN</button>
  <button class="lang-btn" onclick="setLang('fr',this)">FR</button>
  <button class="lang-btn" onclick="setLang('ar',this)">AR</button>
</div>

<div id="chat-container">
  <div id="messages">
    <div class="msg ai">Hello! I'm your MORPHEUS AI stylist. Ask me about outfits, fashion trends, product recommendations, or sizing. How can I help you today?</div>
  </div>
  <div class="typing" id="typing">Typing<span>.</span><span>.</span><span>.</span></div>
  <div class="input-row">
    <input type="text" id="msg-input" placeholder="Ask your stylist..." onkeypress="if(event.key==='Enter')send()">
    <button class="send-btn" onclick="send()">SEND</button>
  </div>
</div>

<div class="config-panel">
  <h3>Server Configuration</h3>
  <div class="config-row"><span>AI Provider</span><strong id="cfg-provider">Loading...</strong></div>
  <div class="config-row"><span>Ollama Available</span><strong id="cfg-ollama">...</strong></div>
  <div class="config-row"><span>Anthropic Key</span><strong id="cfg-anthropic">...</strong></div>
  <div class="config-row"><span>OpenAI Key</span><strong id="cfg-openai">...</strong></div>
  <div class="config-row"><span>Status</span><strong id="cfg-status">...</strong></div>
  <div class="env-form">
    <input type="password" id="anthropic-key" placeholder="sk-ant-api08...">
    <button onclick="saveKey()">Save Anthropic API Key</button>
  </div>
  <div class="env-form" style="margin-top:4px;">
    <input type="password" id="openai-key" placeholder="sk-proj-...">
    <button onclick="saveOpenAIKey()">Save OpenAI API Key</button>
  </div>
</div>

<script>
let lang = 'en';
let history = [];
const ws = window.location.hostname + ':' + window.location.port;

async function loadConfig() {
  try {
    const r = await fetch('/api/config');
    const d = await r.json();
    document.getElementById('cfg-provider').textContent = d.provider;
    document.getElementById('cfg-ollama').textContent = d.has_ollama ? '✓ Running' : '✗ Not found';
    document.getElementById('cfg-anthropic').textContent = d.has_anthropic ? '✓ Set' : '✗ Not set';
    document.getElementById('cfg-openai').textContent = d.has_openai ? '✓ Set' : '✗ Not set';
    const badge = document.getElementById('status-badge');
    if (d.has_ollama || d.has_anthropic || d.has_openai) {
      badge.textContent = d.provider.toUpperCase() + ' CONNECTED';
      badge.className = 'status online';
    } else {
      badge.textContent = 'DEMO MODE (no keys)';
      badge.className = 'status offline';
    }
    document.getElementById('cfg-status').textContent = badge.textContent;
  } catch(e) {
    document.getElementById('cfg-status').textContent = 'Offline';
  }
}

function setLang(l, btn) {
  lang = l;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else document.querySelectorAll('.lang-btn').forEach(b => { if (b.textContent.toLowerCase() === l) b.classList.add('active'); });
}

function addMsg(text, type) {
  const div = document.createElement('div');
  div.className = 'msg ' + type;
  div.textContent = text;
  document.getElementById('messages').appendChild(div);
  document.getElementById('messages').scrollTop = 99999;
}

async function send() {
  const input = document.getElementById('msg-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMsg(text, 'user');
  history.push({ role: 'user', content: text });

  const typing = document.getElementById('typing');
  typing.style.display = 'block';
  let dots = 0;
  const dotAnim = setInterval(() => {
    dots = (dots + 1) % 4;
    typing.querySelectorAll('span').forEach((s, i) => {
      s.textContent = '.'.repeat((i + dots) % 4 + 1);
    });
  }, 300);

  try {
    const r = await fetch('/api/stylist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, lang, history }),
    });
    const d = await r.json();
    clearInterval(dotAnim);
    typing.style.display = 'none';
    addMsg(d.reply || 'Error getting response', 'ai');
    history.push({ role: 'assistant', content: d.reply || '' });
  } catch(e) {
    clearInterval(dotAnim);
    typing.style.display = 'none';
    addMsg('Connection error. Is the server running?', 'ai');
  }
}

function saveKey() {
  const key = document.getElementById('anthropic-key').value.trim();
  if (key) {
    localStorage.setItem('morpheus_api_key', key);
    document.getElementById('cfg-anthropic').textContent = '✓ Set';
    document.getElementById('status-badge').textContent = 'ANTHROPIC CONNECTED';
    document.getElementById('status-badge').className = 'status online';
  }
}

function saveOpenAIKey() {
  const key = document.getElementById('openai-key').value.trim();
  if (key) {
    localStorage.setItem('morpheus_openai_key', key);
    document.getElementById('cfg-openai').textContent = '✓ Set';
  }
}

document.getElementById('msg-input').addEventListener('keypress', e => { if (e.key === 'Enter') send(); });
loadConfig();
</script>
</body>
</html>
'''

@app.route('/standalone')
def standalone():
    return render_template_string(EMBEDDED_HTML)


# ================================================================
# MAIN
# ================================================================
if __name__ == '__main__':
    print(f"""
╔═══════════════════════════════════════════════════╗
║     MORPHEUS AI STYLIST SERVER v3.0              ║
╠═══════════════════════════════════════════════════╣
║  Local:    http://localhost:{PORT}                ║
║  Network:  http://{{YOUR_IP}}:{PORT}                ║
║  Standalone UI: http://localhost:{PORT}/standalone  ║
╠═══════════════════════════════════════════════════╣
║  Provider: {AI_PROVIDER:<33} ║
║  Ollama:   {OLLAMA_MODEL:<33} ║
║  Ollama URL: {OLLAMA_URL:<29} ║
╚═══════════════════════════════════════════════════╝

To use with final.html, replace the AI call in final.html with:
  fetch('http://localhost:{PORT}/api/stylist', {{...}})

Or set environment variables:
  export AI_PROVIDER=anthropic
  export ANTHROPIC_API_KEY=sk-ant-...
  python ai.py
""")
    app.run(host='0.0.0.0', port=PORT, debug=True)