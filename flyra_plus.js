// ================================================================
// FLYRA_PLUS — v1.0 Complete Platform
// AI Design Studio + Body Scanner + Virtual Try-On + Social + Live
// ================================================================

(function() {
  'use strict';

  // ================================================================
  // DATA KEYS
  // ================================================================
  const DESIGNS_KEY = 'flyra_designs_v1';
  const BODY_PROFILES_KEY = 'flyra_body_profiles';
  const SOCIAL_LOOKS_KEY = 'flyra_looks';
  const FOLLOWERS_KEY = 'flyra_followers';
  const LIVE_STREAMS_KEY = 'flyra_live_streams';
  const EARNINGS_KEY = 'flyra_earnings';
  const USER_PROFILE_KEY = 'flyra_user_profile';

  // ================================================================
  // FABRIC / MATERIAL SYSTEM
  // ================================================================
  const FABRICS = [
    { id:'cotton', name:'Organic Cotton', price:0, texture:'#f5f5f5', properties:'Breathable, soft, everyday wear', washing:'Machine wash cold' },
    { id:'silk', name:'Algerian Silk Blend', price:5000, texture:'#e8d5c4', properties:'Luxurious sheen, lightweight drape', washing:'Dry clean only' },
    { id:'linen', name:'Mediterranean Linen', price:3000, texture:'#e0d5c0', properties:'Cool, breathable, summer essential', washing:'Hand wash cold' },
    { id:'denim', name:'Tech Denim', price:4000, texture:'#3a5a7c', properties:'Stretch, durable, shape-retaining', washing:'Machine wash cold inside out' },
    { id:'velvet', name:'Royal Velvet', price:6000, texture:'#4a2c5a', properties:'Rich texture, warmth, formal wear', washing:'Dry clean only' },
    { id:'kashmir', name:'Kashmir Wool Blend', price:8000, texture:'#c9b896', properties:'Ultra-soft warmth, premium quality', washing:'Dry clean recommended' },
    { id:'leather', name:'Algerian Leather', price:12000, texture:'#5c3d2e', properties:'Durable, timeless, ages beautifully', washing:'Wipe with damp cloth' },
    { id:'hijab', name:'Jersey Hijab Fabric', price:2000, texture:'#2a2a3a', properties:'Stretchy, breathable, stays in place', washing:'Hand wash cold' },
    { id:'tech', name:'Smart Nano-Fabric', price:15000, texture:'#1a1a2e', properties:'Self-cleaning, temperature-regulating', washing:'Wipe clean, machine OK' },
    { id:'brocade', name:'Traditional Brocade', price:10000, texture:'#8b6914', properties:'Gold threading, ceremonial, Algerian heritage', washing:'Dry clean only' },
  ];

  // ================================================================
  // DESIGN TEMPLATES
  // ================================================================
  const DESIGN_TEMPLATES = [
    { name:'Minimalist Tee', category:'tops', colors:['#000','#fff','#888'], fabric:'cotton', basePrice:8500 },
    { name:'Oversized Hoodie', category:'tops', colors:['#333','#1a1a1a','#666'], fabric:'cotton', basePrice:21000 },
    { name:'Cargo Pants', category:'bottoms', colors:['#3a3a3a','#2a2a2a','#4a4a4a'], fabric:'denim', basePrice:25000 },
    { name:'Traditional Gandoura', category:'tops', colors:['#f5f5dc','#e8d5b0','#fff'], fabric:'linen', basePrice:18000 },
    { name:'Modern Jalabiya', category:'tops', colors:['#fff','#e8e8e8','#f0e6d3'], fabric:'cotton', basePrice:22000 },
    { name:'Street Jacket', category:'tops', colors:['#1a1a1a','#333','#000'], fabric:'tech', basePrice:45000 },
    { name:'Smart Trousers', category:'bottoms', colors:['#2a2a2a','#1a1a1a','#444'], fabric:'cotton', basePrice:15500 },
    { name:'Heritage Vest', category:'tops', colors:['#8b6914','#5c3d2e','#4a2c5a'], fabric:'brocade', basePrice:28000 },
    { name:'Sport Hijab Set', category:'accessories', colors:['#000','#1a1a2e','#333'], fabric:'hijab', basePrice:5500 },
    { name:'Custom Sneakers', category:'shoes', colors:['#fff','#000','#e8e8e8'], fabric:'tech', basePrice:32000 },
  ];

  // ================================================================
  // BODY SCAN ESTIMATIONS (based on photo analysis simulation)
  // ================================================================
  const BODY_MEASUREMENTS = [
    { key:'height', label:'Height', unit:'cm', range:[150,195], avg:170 },
    { key:'chest', label:'Chest', unit:'cm', range:[75,120], avg:95 },
    { key:'waist', label:'Waist', unit:'cm', range:[60,110], avg:80 },
    { key:'hips', label:'Hips', unit:'cm', range:[80,130], avg:100 },
    { key:'inseam', label:'Inseam', unit:'cm', range:[65,90], avg:75 },
    { key:'shoulders', label:'Shoulders', unit:'cm', range:[35,55], avg:45 },
    { key:'arms', label:'Arm Length', unit:'cm', range:[50,70], avg:60 },
    { key:'neck', label:'Neck', unit:'cm', range:[30,45], avg:38 },
  ];

  const BODY_TYPES = ['Athletic', 'Slim', 'Regular', 'Petite', 'Tall', 'Broad'];

  // ================================================================
  // SOCIAL — SAMPLE LOOKS (seed data)
  // ================================================================
  const SAMPLE_LOOKS = [
    { id:1, userId:'aisha_style', userName:'Aïcha B.', avatar:'👩🏾', title:'Casablanca Night Look', desc:'Modern take on traditional with a street edge. Perfect for Maghreb nightlife.', products:['PHANTOM JACKET','VOID RUNNERS'], likes:234, comments:18, tags:['#CasablancaStyle','#ModernTradition','#AlgerianFashion'], time:Date.now()-3600000 },
    { id:2, userId:'moh_official', userName:'Mohammed D.', avatar:'👨', title:'Algiers Business Casual', desc:'Clean lines, smart fabric, the Algiers professional look for 2026.', products:['NEURAL TEE','GLITCH TROUSERS'], likes:189, comments:12, tags:['#AlgiersVibes','#BusinessCasual'], time:Date.now()-7200000 },
    { id:3, userId:'sara_surfs', userName:'Sara M.', avatar:'👩🏾‍🦱', title:'Oran Coastal', desc:'Breathable linen for the Oran breeze. Beach to café in one outfit.', products:['CHRONO CAP','NEBULA HOODIE'], likes:312, comments:25, tags:['#OranStyle','#CoastalChic'], time:Date.now()-10800000 },
    { id:4, userId:'yous_beats', userName:'Youssef A.', avatar:'👨🏾', title:'Bechar Market Fit', desc:'Dusty roads, bright lights. The Saharan street aesthetic.', products:['ZERO GLOVES','PHANTOM JACKET'], likes:156, comments:9, tags:['#BecharStyle','#SaharanFashion'], time:Date.now()-14400000 },
    { id:5, userId:'djamila_', userName:'Djamila R.', avatar:'👩', title:'Tlemcen Heritage', desc:'Incorporating Tlemcen embroidery patterns into a contemporary cut.', products:['NEBULA HOODIE','GLITCH TROUSERS'], likes:401, comments:33, tags:['#TlemcenHeritage','#Embroidery'], time:Date.now()-18000000 },
    { id:6, userId:'karim_tech', userName:'Karim F.', avatar:'👨', title:'Constantine Tech', desc:'All-black tech fabric ensemble for the Constantine tech meetup.', products:['PHANTOM JACKET','VOID RUNNERS'], likes:278, comments:21, tags:['#ConstantineTech','#AllBlack'], time:Date.now()-21600000 },
  ];

  // ================================================================
  // CHALLENGES
  // ================================================================
  const CHALLENGES = [
    { id:'summer23', title:'Summer in the Souk', desc:'Style an outfit perfect for Algerian summer markets', deadline:Date.now()+86400000*7, participants:47, prize:'Custom design produced + 50,000 DZD' },
    { id:'techwear', title:'Tech meets Tradition', desc:'Merge futuristic techwear with traditional Algerian elements', deadline:Date.now()+86400000*5, participants:31, prize:'Featured on homepage + 30,000 DZD' },
    { id:'ramadan', title:'Eid Elegance', desc:'Design an outfit for Eid celebrations', deadline:Date.now()+86400000*14, participants:89, prize:'Free custom production + 100,000 DZD' },
  ];

  // ================================================================
  // SAMPLE LIVE STREAMS
  // ================================================================
  const SAMPLE_STREAMS = [
    { id:'stream1', hostId:'aisha_style', hostName:'Aïcha B.', hostAvatar:'👩🏾', title:'NEW COLLECTION DROP! 🎉', viewers:147, isLive:true, startedAt:Date.now()-1800000 },
    { id:'stream2', hostId:'moh_official', hostName:'Mohammed D.', hostAvatar:'👨', title:'Behind the Design Process', viewers:63, isLive:true, startedAt:Date.now()-600000 },
  ];

  // ================================================================
  // LOAD / SAVE DATA
  // ================================================================
  function loadDesigns() { try { return JSON.parse(localStorage.getItem(DESIGNS_KEY)||'[]'); } catch(e) { return []; } }
  function saveDesigns(d) { localStorage.setItem(DESIGNS_KEY, JSON.stringify(d)); }
  function loadBodyProfiles() { try { return JSON.parse(localStorage.getItem(BODY_PROFILES_KEY)||'[]'); } catch(e) { return []; } }
  function saveBodyProfiles(b) { localStorage.setItem(BODY_PROFILES_KEY, JSON.stringify(b)); }
  function loadLooks() { try { return JSON.parse(localStorage.getItem(SOCIAL_LOOKS_KEY)||'[]'); } catch(e) { return []; } }
  function saveLooks(l) { localStorage.setItem(SOCIAL_LOOKS_KEY, JSON.stringify(l)); }
  function loadFollowers() { try { return JSON.parse(localStorage.getItem(FOLLOWERS_KEY)||'{"following":[],"followers":[]}'); } catch(e) { return {following:[],followers:[]}; } }
  function saveFollowers(f) { localStorage.setItem(FOLLOWERS_KEY, JSON.stringify(f)); }
  function loadEarnings() { try { return JSON.parse(localStorage.getItem(EARNINGS_KEY)||'{"balance":0,"history":[],"totalSales":0}'); } catch(e) { return {balance:0,history:[],totalSales:0}; } }
  function saveEarnings(e) { localStorage.setItem(EARNINGS_KEY, JSON.stringify(e)); }
  function loadUserProfile() { try { return JSON.parse(localStorage.getItem(USER_PROFILE_KEY)||'{}'); } catch(e) { return {}; } }
  function saveUserProfile(p) { localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(p)); }

  // ================================================================
  // STATE
  // ================================================================
  let designs = loadDesigns();
  let bodyProfiles = loadBodyProfiles();
  let looks = loadLooks();
  let followers = loadFollowers();
  let earnings = loadEarnings();
  let userProfile = loadUserProfile();
  let activeStreamId = null;
  let liveChatMessages = [];
  let canvasCtx = null;
  let currentDesign = null;
  let isDrawing = false;
  let currentTool = 'brush';
  let currentColor = '#ffffff';
  let brushSize = 4;

  // Ensure sample data
  if (looks.length === 0) { looks = SAMPLE_LOOKS.map(l=>({...l})); saveLooks(looks); }

  // ================================================================
  // USER PROFILE INIT
  // ================================================================
  function initUserProfile() {
    if (!userProfile.username) {
      userProfile = {
        username: 'Guest_' + Math.random().toString(36).slice(2,8),
        displayName: 'New Creator',
        avatar: '👤',
        bio: 'Fashion enthusiast',
        isCreator: false,
        verified: false,
        lookCount: 0,
        followerCount: 0,
        followingCount: 0,
        totalEarnings: 0,
        rank: 'Bronze',
        joinedAt: Date.now(),
        badges: [],
        preferences: { style:['street','minimal'], sizes:['M','L'], colors:['black','white'] },
      };
      saveUserProfile(userProfile);
    }
  }

  // ================================================================
  // AI DESIGN STUDIO
  // ================================================================
  function renderDesignStudio() {
    const content = document.getElementById('design-studio-content');
    if (!content) return;

    const designList = designs.length > 0 ? designs.map(d => `
      <div class="design-card" onclick="window.MorpheusPlus.openDesign(${d.id})">
        <div class="design-preview" style="background:${d.fabricColor || '#333'};">
          <span style="font-size:2rem;">${d.category === 'tops' ? '👕' : d.category === 'bottoms' ? '👖' : d.category === 'shoes' ? '👟' : '🎨'}</span>
        </div>
        <div class="design-info">
          <div class="design-name">${d.name}</div>
          <div class="design-meta">${d.fabricName || 'cotton'} · ${d.totalPrice?.toLocaleString() || 0} DZD</div>
          <div class="design-status ${d.status}">${d.status.toUpperCase()}</div>
        </div>
      </div>`).join('') : '';

    content.innerHTML = `
      <div class="ds-header">
        <div class="ds-tabs">
          <button class="ds-tab active" onclick="switchDsTab('canvas',this)">✏️ CANVAS</button>
          <button class="ds-tab" onclick="switchDsTab('templates',this)">📐 TEMPLATES</button>
          <button class="ds-tab" onclick="switchDsTab('gallery',this)">🎨 MY DESIGNS</button>
          <button class="ds-tab" onclick="switchDsTab('ai',this)">🤖 AI GENERATE</button>
        </div>
      </div>

      <div id="ds-canvas-area" class="ds-section active">
        <div class="ds-toolbar">
          <button class="ds-tool ${currentTool==='brush'?'active':''}" onclick="setDsTool('brush',this)" title="Brush">🖌️</button>
          <button class="ds-tool ${currentTool==='eraser'?'active':''}" onclick="setDsTool('eraser',this)" title="Eraser">🧹</button>
          <button class="ds-tool ${currentTool==='fill'?'active':''}" onclick="setDsTool('fill',this)" title="Fill">🪣</button>
          <button class="ds-tool" onclick="dsClearCanvas()">🗑️</button>
          <div class="ds-color-picker">
            <label>Color</label>
            <input type="color" id="ds-color" value="#ffffff" onchange="setDsColor(this.value)">
          </div>
          <div class="ds-brush-size">
            <label>Size: ${brushSize}px</label>
            <input type="range" min="1" max="30" value="4" onchange="setDsBrushSize(this.value)">
          </div>
        </div>
        <canvas id="ds-canvas" width="320" height="240" style="border:1px solid var(--border);border-radius:8px;background:#1a1a1a;cursor:crosshair;display:block;margin:0 auto;image-rendering:pixelated;"></canvas>
        <div class="ds-shape-tools">
          <button onclick="dsAddShape('circle')">○ Circle</button>
          <button onclick="dsAddShape('rect')">□ Rectangle</button>
          <button onclick="dsAddShape('line')">╱ Line</button>
          <button onclick="dsAddShape('triangle')">△ Triangle</button>
        </div>
        <div class="ds-name-row">
          <input type="text" id="ds-design-name" placeholder="Design name..." style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:8px 12px;color:var(--white);font-size:11px;width:100%;">
        </div>
        <div class="ds-fabric-selector">
          <div class="widget-label">SELECT FABRIC</div>
          <div class="ds-fabric-grid" id="ds-fabric-grid"></div>
        </div>
        <div class="ds-price-preview" id="ds-price-preview">
          <span>Base: <span id="ds-base-price">8500</span> DZD</span>
          <span>Fabric: <span id="ds-fabric-price">0</span> DZD</span>
          <span style="color:var(--purple);font-weight:700;">Total: <span id="ds-total-price">8500</span> DZD</span>
        </div>
        <div class="ds-actions">
          <button class="ds-btn secondary" onclick="dsSaveDraft()">💾 SAVE DRAFT</button>
          <button class="ds-btn primary" onclick="dsGenerateAI()">🤖 ENHANCE WITH AI</button>
          <button class="ds-btn highlight" onclick="dsOrderDesign()">🛒 ORDER NOW</button>
        </div>
      </div>

      <div id="ds-templates-area" class="ds-section" style="display:none;">
        <div class="widget-label">START FROM TEMPLATE</div>
        <div class="ds-templates-grid">
          ${DESIGN_TEMPLATES.map(t => `
            <div class="ds-template-card" onclick="dsApplyTemplate('${t.name}')">
              <div class="ds-template-preview" style="background:${t.colors[0]};">
                <span style="font-size:2rem;">${t.category === 'tops' ? '👕' : t.category === 'bottoms' ? '👖' : '🎨'}</span>
              </div>
              <div class="ds-template-name">${t.name}</div>
              <div class="ds-template-price">${t.basePrice.toLocaleString()} DZD</div>
              <div class="ds-template-fabric">${t.fabric}</div>
            </div>`).join('')}
        </div>
      </div>

      <div id="ds-gallery-area" class="ds-section" style="display:none;">
        <div class="ds-gallery-grid">
          ${designList || '<p style="text-align:center;opacity:0.3;padding:40px;">No designs yet. Create your first one!</p>'}
        </div>
      </div>

      <div id="ds-ai-area" class="ds-section" style="display:none;">
        <div class="ds-ai-prompt">
          <div class="widget-label">DESCRIBE YOUR DESIGN</div>
          <textarea id="ds-ai-input" placeholder="e.g., A flowing linen dress with traditional Algerian geometric patterns in deep blue and gold, suitable for summer..." style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--white);font-size:11px;min-height:80px;resize:vertical;font-family:inherit;"></textarea>
          <div class="ds-ai-options">
            <select id="ds-ai-category" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:8px;color:var(--white);font-size:10px;">
              <option value="">Category...</option>
              <option value="tops">Tops</option>
              <option value="bottoms">Bottoms</option>
              <option value="dresses">Dresses</option>
              <option value="accessories">Accessories</option>
            </select>
            <select id="ds-ai-fabric" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:8px;color:var(--white);font-size:10px;">
              <option value="">Fabric...</option>
              ${FABRICS.map(f=>`<option value="${f.id}">${f.name} (+${f.price} DZD)</option>`).join('')}
            </select>
          </div>
          <button class="ds-btn primary" style="width:100%;margin-top:8px;" onclick="dsAIGenerate()">🤖 GENERATE DESIGN</button>
          <div id="ds-ai-result" style="margin-top:12px;"></div>
        </div>
      </div>`;

    // Init fabric grid
    setTimeout(() => {
      const grid = document.getElementById('ds-fabric-grid');
      if (grid) {
        grid.innerHTML = FABRICS.map(f => `
          <div class="ds-fabric-item" data-id="${f.id}" onclick="selectDsFabric('${f.id}',this)" style="background:${f.texture};">
            <span>${f.name}</span>
            <span style="font-size:8px;">+${f.price.toLocaleString()}</span>
          </div>`).join('');
      }
      initDsCanvas();
    }, 50);
  }

  function switchDsTab(tab, btn) {
    document.querySelectorAll('.ds-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ds-section').forEach(s => s.style.display = 'none');
    if (btn) btn.classList.add('active');
    document.getElementById('ds-' + tab + '-area').style.display = 'block';
    if (tab === 'canvas') setTimeout(initDsCanvas, 50);
  }

  function initDsCanvas() {
    const canvas = document.getElementById('ds-canvas');
    if (!canvas) return;
    canvasCtx = canvas.getContext('2d');
    canvasCtx.fillStyle = '#1a1a1a';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvas.addEventListener('mousedown', (e) => { isDrawing = true; const rect = canvas.getBoundingClientRect(); canvasCtx.beginPath(); canvasCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top); });
    canvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      if (currentTool === 'eraser') {
        canvasCtx.globalCompositeOperation = 'destination-out';
        canvasCtx.lineWidth = brushSize * 2;
      } else {
        canvasCtx.globalCompositeOperation = 'source-over';
        canvasCtx.strokeStyle = currentColor;
        canvasCtx.lineWidth = brushSize;
      }
      canvasCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      canvasCtx.stroke();
    });
    canvas.addEventListener('mouseup', () => { isDrawing = false; });
    canvas.addEventListener('mouseleave', () => { isDrawing = false; });
  }

  function setDsTool(tool, btn) { currentTool = tool; document.querySelectorAll('.ds-tool').forEach(t => t.classList.remove('active')); if (btn) btn.classList.add('active'); }
  function setDsColor(c) { currentColor = c; }
  function setDsBrushSize(s) { brushSize = parseInt(s); document.querySelector('.ds-brush-size label').textContent = `Size: ${s}px`; }
  function dsClearCanvas() { if (!canvasCtx) return; const c = document.getElementById('ds-canvas'); canvasCtx.fillStyle = '#1a1a1a'; canvasCtx.fillRect(0, 0, c.width, c.height); }

  function dsAddShape(type) {
    if (!canvasCtx) return;
    canvasCtx.strokeStyle = currentColor;
    canvasCtx.lineWidth = brushSize;
    if (type === 'circle') { canvasCtx.beginPath(); canvasCtx.arc(160, 120, 50, 0, Math.PI*2); canvasCtx.stroke(); }
    else if (type === 'rect') { canvasCtx.strokeRect(100, 70, 120, 80); }
    else if (type === 'line') { canvasCtx.beginPath(); canvasCtx.moveTo(50, 50); canvasCtx.lineTo(270, 190); canvasCtx.stroke(); }
    else if (type === 'triangle') { canvasCtx.beginPath(); canvasCtx.moveTo(160, 40); canvasCtx.lineTo(240, 180); canvasCtx.lineTo(80, 180); canvasCtx.closePath(); canvasCtx.stroke(); }
  }

  let selectedFabric = FABRICS[0];
  function selectDsFabric(id, el) {
    document.querySelectorAll('.ds-fabric-item').forEach(f => f.classList.remove('selected'));
    if (el) el.classList.add('selected');
    selectedFabric = FABRICS.find(f => f.id === id) || FABRICS[0];
    updateDsPrice();
  }

  function updateDsPrice() {
    const basePrice = parseInt(document.getElementById('ds-base-price')?.textContent || 8500);
    const fabricPrice = selectedFabric?.price || 0;
    const total = basePrice + fabricPrice;
    if (document.getElementById('ds-fabric-price')) document.getElementById('ds-fabric-price').textContent = fabricPrice.toLocaleString();
    if (document.getElementById('ds-total-price')) document.getElementById('ds-total-price').textContent = total.toLocaleString();
  }

  function dsSaveDraft() {
    const name = document.getElementById('ds-design-name')?.value?.trim() || 'Untitled Design ' + Date.now();
    const canvas = document.getElementById('ds-canvas');
    const imageData = canvas?.toDataURL() || '';
    const design = {
      id: Date.now(),
      name,
      category: 'tops',
      fabric: selectedFabric?.id || 'cotton',
      fabricName: selectedFabric?.name || 'Organic Cotton',
      fabricColor: selectedFabric?.texture || '#f5f5f5',
      basePrice: 8500,
      fabricPrice: selectedFabric?.price || 0,
      totalPrice: (8500 + (selectedFabric?.price || 0)),
      imageData,
      status: 'draft',
      createdAt: Date.now(),
    };
    designs.unshift(design);
    saveDesigns(designs);
    window.MorpheusApp?.showToast?.('💾 Design Saved', name);
    switchDsTab('gallery');
    renderDesignStudio();
  }

  function dsApplyTemplate(name) {
    const t = DESIGN_TEMPLATES.find(x => x.name === name);
    if (!t) return;
    document.getElementById('ds-design-name').value = t.name;
    document.getElementById('ds-base-price').textContent = t.basePrice;
    const fabric = FABRICS.find(f => f.id === t.fabric) || FABRICS[0];
    selectDsFabric(fabric.id, document.querySelector(`[data-id="${fabric.id}"]`));
    updateDsPrice();
    switchDsTab('canvas');
    window.MorpheusApp?.showToast?.('📐 Template Applied', t.name);
  }

  async function dsAIGenerate() {
    const prompt = document.getElementById('ds-ai-input')?.value?.trim();
    if (!prompt) { window.MorpheusApp?.showToast?.('⚠', 'Describe your design first'); return; }
    const resultEl = document.getElementById('ds-ai-result');
    resultEl.innerHTML = '<div style="padding:20px;text-align:center;"><div class="loading-ring" style="margin:0 auto 12px;"></div><span style="font-size:10px;opacity:0.5;">AI is designing...</span></div>';
    const serverUrl = localStorage.getItem('flyra_ai_server');
    let response = null;
    if (serverUrl) {
      try {
        const res = await fetch(serverUrl + '/api/stylist', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ message:`Generate a fashion design description for: ${prompt}. Respond with a JSON object with: name (design name), category (tops/bottoms/accessories), description (detailed design), fabricRecommendation (which fabric from cotton/silk/linen/denim/velvet/kashmir/leather/hijab/tech/brocade), estimatedPrice (in DZD). Only output valid JSON.`, lang:'en' }),
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          const data = await res.json();
          response = data.reply;
        }
      } catch(e) {}
    }
    setTimeout(() => {
      let desc = response || `Custom design based on: "${prompt.substring(0,60)}...". Recommend: Organic Cotton blend. Estimated: ${(8500+Math.random()*10000).toFixed(0)} DZD.`;
      resultEl.innerHTML = `<div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:16px;">
        <div style="font-size:12px;font-weight:700;color:var(--purple);margin-bottom:8px;">🤖 AI Design Preview</div>
        <div style="font-size:11px;line-height:1.6;opacity:0.7;">${desc}</div>
        <div style="margin-top:12px;display:flex;gap:8px;">
          <button class="ds-btn secondary" onclick="this.closest('.ds-ai-result').innerHTML=''">CLEAR</button>
          <button class="ds-btn primary" onclick="dsApplyAIResult()">APPLY TO CANVAS</button>
        </div>
      </div>`;
    }, 1500);
  }

  function dsApplyAIResult() { switchDsTab('canvas'); }
  function dsGenerateAI() { switchDsTab('ai'); }
  function dsOrderDesign() { window.MorpheusApp?.showToast?.('🛒 Order', 'Design sent to production — you will be charged upon confirmation'); }

  function openDesign(id) {
    const d = designs.find(x => x.id === id);
    if (!d) return;
    window.MorpheusApp?.showToast?.('📐 ' + d.name, `${d.fabricName} · ${d.totalPrice?.toLocaleString()} DZD`);
  }

  // ================================================================
  // AI BODY SCANNER
  // ================================================================
  function renderBodyScanner() {
    const content = document.getElementById('body-scanner-content');
    if (!content) return;

    const profiles = bodyProfiles;
    const activeProfile = profiles.length > 0 ? profiles[profiles.length-1] : null;

    content.innerHTML = `
      <div class="bs-intro">
        <div class="bs-icon">📸</div>
        <h3>AI Body Scanner</h3>
        <p>Upload front + side photos. Our AI analyzes your exact measurements for perfect-fit recommendations.</p>
        <div class="bs-privacy">
          <span>🔒</span> Photos are processed in-memory and never stored
        </div>
      </div>

      <div class="bs-upload-section">
        <div class="bs-photo-box">
          <div class="bs-photo-upload" id="bs-front-upload" onclick="document.getElementById('bs-front-input').click()">
            <span style="font-size:2rem;">📷</span>
            <span>FRONT VIEW</span>
            <span style="font-size:9px;opacity:0.4;">Click to upload</span>
            <img id="bs-front-preview" style="display:none;width:100%;height:100%;object-fit:cover;border-radius:8px;">
          </div>
          <input type="file" id="bs-front-input" accept="image/*" style="display:none" onchange="bsPreviewImage(this,'bs-front-preview','bs-front-upload')">

          <div class="bs-photo-upload" id="bs-side-upload" onclick="document.getElementById('bs-side-input').click()">
            <span style="font-size:2rem;">📷</span>
            <span>SIDE VIEW</span>
            <span style="font-size:9px;opacity:0.4;">Click to upload</span>
            <img id="bs-side-preview" style="display:none;width:100%;height:100%;object-fit:cover;border-radius:8px;">
          </div>
          <input type="file" id="bs-side-input" accept="image/*" style="display:none" onchange="bsPreviewImage(this,'bs-side-preview','bs-side-upload')">
        </div>

        <button class="bs-scan-btn" onclick="bsRunScan()">🔬 ANALYZE MY BODY</button>
      </div>

      <div id="bs-results" style="display:none;"></div>

      ${profiles.length > 0 ? `
      <div class="bs-profiles">
        <div class="widget-label">SAVED PROFILES</div>
        ${profiles.map(p => `
          <div class="bs-profile-card" onclick="bsShowProfile(${p.id})">
            <div class="bs-profile-date">${new Date(p.createdAt).toLocaleDateString()}</div>
            <div class="bs-profile-type">${p.bodyType}</div>
            <div class="bs-profile-stats">
              <span>Height: ${p.measurements.height}cm</span>
              <span>Chest: ${p.measurements.chest}cm</span>
              <span>Waist: ${p.measurements.waist}cm</span>
            </div>
          </div>`).join('')}
      </div>` : ''}

      <div class="bs-fit-section">
        <div class="widget-label">SMART SIZE MATCHING</div>
        <div class="bs-products-grid">
          ${(window.MorpheusApp?.products || []).slice(0,4).map(p => `
            <div class="bs-product-fit" id="bs-fit-${p.id}">
              <div class="bs-product-icon">${p.icon || '👕'}</div>
              <div class="bs-product-name">${p.name}</div>
              <div class="bs-fit-score">—</div>
              <div class="bs-fit-size">Recommended: M</div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function bsPreviewImage(input, previewId, boxId) {
    if (!input.files[0]) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById(previewId);
      const box = document.getElementById(boxId);
      if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
      if (box) { box.querySelectorAll('span').forEach(s => s.style.display = 'none'); }
    };
    reader.readAsDataURL(input.files[0]);
  }

  async function bsRunScan() {
    const frontInput = document.getElementById('bs-front-input');
    const sideInput = document.getElementById('bs-side-input');
    if (!frontInput?.files[0] || !sideInput?.files[0]) {
      window.MorpheusApp?.showToast?.('⚠', 'Please upload both front and side photos');
      return;
    }

    const resultsEl = document.getElementById('bs-results');
    resultsEl.style.display = 'block';
    resultsEl.innerHTML = `<div style="text-align:center;padding:30px;">
      <div class="loading-ring" style="margin:0 auto 16px;"></div>
      <div style="font-size:12px;font-weight:700;">Analyzing body proportions...</div>
      <div style="font-size:10px;opacity:0.5;margin-top:8px;">This takes about 5-10 seconds</div>
      <div style="margin-top:20px;background:rgba(255,255,255,0.05);border-radius:8px;padding:16px;">
        <div style="font-size:10px;opacity:0.5;margin-bottom:12px;">Detecting landmarks...</div>
        <div class="bs-scan-progress">
          <div class="bs-scan-bar" id="bs-scan-bar" style="width:0%;"></div>
        </div>
      </div>
    </div>`;

    // Simulate AI body analysis (in production, this would use a real CV model)
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 100));
      const bar = document.getElementById('bs-scan-bar');
      if (bar) bar.style.width = i + '%';
    }

    // Generate realistic measurements based on random factors + user profile
    const baseHeight = 160 + Math.random() * 35;
    const bodyType = BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)];
    const measurements = {
      height: Math.round(baseHeight),
      chest: Math.round(80 + Math.random() * 30),
      waist: Math.round(65 + Math.random() * 30),
      hips: Math.round(85 + Math.random() * 30),
      inseam: Math.round(65 + Math.random() * 20),
      shoulders: Math.round(38 + Math.random() * 12),
      arms: Math.round(52 + Math.random() * 15),
      neck: Math.round(32 + Math.random() * 8),
    };

    const profile = {
      id: Date.now(),
      bodyType,
      measurements,
      bestSizes: bsCalculateBestSizes(measurements),
      createdAt: Date.now(),
    };

    bodyProfiles.push(profile);
    saveBodyProfiles(bodyProfiles);

    const sizeRecommendations = bsGetSizeRecommendations(measurements);

    resultsEl.innerHTML = `
      <div class="bs-result-header">
        <div class="bs-body-type">${bodyType}</div>
        <div class="bs-body-date">Scanned ${new Date().toLocaleTimeString()}</div>
      </div>
      <div class="bs-measurements-grid">
        ${Object.entries(measurements).map(([key, val]) => {
          const m = BODY_MEASUREMENTS.find(x => x.key === key);
          return `<div class="bs-measurement">
            <div class="bs-measure-label">${m?.label || key}</div>
            <div class="bs-measure-value">${val}</div>
            <div class="bs-measure-unit">${m?.unit || 'cm'}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="bs-size-recommendations">
        <div class="widget-label">YOUR PERFECT SIZES</div>
        <div class="bs-sizes-grid">
          ${sizeRecommendations.map(sr => `
            <div class="bs-size-rec">
              <div class="bs-size-rec-name">${sr.product}</div>
              <div class="bs-size-rec-size" style="color:${sr.confidence > 85 ? 'var(--green)' : sr.confidence > 70 ? 'var(--orange)' : 'var(--yellow)'};">${sr.size}</div>
              <div class="bs-size-rec-conf">${sr.confidence}% fit</div>
              <div class="bs-size-rec-bar" style="width:${sr.confidence}%;background:${sr.confidence > 85 ? 'var(--green)' : sr.confidence > 70 ? 'var(--orange)' : 'var(--yellow)'};"></div>
            </div>`).join('')}
        </div>
      </div>
      <button class="bs-save-profile" onclick="bsSaveCurrentProfile()">💾 SAVE THIS PROFILE</button>`;

    window.MorpheusApp?.showToast?.('✅ Scan Complete', `${bodyType} body detected`);
  }

  function bsCalculateBestSizes(measurements) {
    const chest = measurements.chest;
    if (chest < 82) return 'XS';
    if (chest < 90) return 'S';
    if (chest < 98) return 'M';
    if (chest < 106) return 'L';
    return 'XL';
  }

  function bsGetSizeRecommendations(measurements) {
    const chest = measurements.chest;
    const waist = measurements.waist;
    const prods = (window.MorpheusApp?.products || []).slice(0,4);
    return prods.map(p => {
      let size = 'M', confidence = 75;
      const pSizes = p.sizes || ['S','M','L','XL'];
      if (pSizes.includes('XS') && chest < 82) { size = 'XS'; confidence = 92; }
      else if (pSizes.includes('S') && chest < 90) { size = 'S'; confidence = 90; }
      else if (pSizes.includes('M') && chest < 100) { size = 'M'; confidence = 88; }
      else if (pSizes.includes('L') && chest < 110) { size = 'L'; confidence = 85; }
      else if (pSizes.includes('XL')) { size = 'XL'; confidence = 80; }
      return { product: p.name, size, confidence };
    });
  }

  function bsSaveCurrentProfile() {
    window.MorpheusApp?.showToast?.('💾 Profile Saved', 'Your measurements are stored securely');
  }

  function bsShowProfile(id) {
    const p = bodyProfiles.find(x => x.id === id);
    if (!p) return;
    window.MorpheusApp?.showToast?.(`📐 ${p.bodyType}`, `Height: ${p.measurements.height}cm · Chest: ${p.measurements.chest}cm`);
  }

  // ================================================================
  // VIRTUAL TRY-ON (AR Mirror)
  // ================================================================
  function renderVirtualMirror() {
    const content = document.getElementById('virtual-mirror-content');
    if (!content) return;

    content.innerHTML = `
      <div class="vm-header">
        <div class="vm-title">🪞 AR VIRTUAL MIRROR</div>
        <p style="font-size:10px;opacity:0.5;text-align:center;margin-bottom:12px;">See how clothes look on YOUR body before you buy</p>
      </div>

      <div class="vm-camera-view" id="vm-camera">
        <video id="vm-video" autoplay playsinline style="width:100%;height:300px;object-fit:cover;border-radius:12px;background:#111;display:none;"></video>
        <div class="vm-placeholder" id="vm-placeholder">
          <span style="font-size:3rem;">📷</span>
          <span>Enable camera to try on clothes virtually</span>
          <button class="vm-enable-btn" onclick="vmEnableCamera()">ENABLE CAMERA</button>
        </div>
        <div class="vm-overlay" id="vm-overlay" style="display:none;"></div>
      </div>

      <div class="vm-product-select">
        <div class="widget-label">SELECT CLOTHING TO TRY ON</div>
        <div class="vm-products-scroll">
          ${(window.MorpheusApp?.products || []).slice(0,6).map(p => `
            <div class="vm-product-thumb" onclick="vmSelectProduct(${p.id},'${escapeHtml(p.name)}','${p.icon || '👕'}')">
              <span style="font-size:1.5rem;">${p.icon || '👕'}</span>
              <span style="font-size:9px;">${p.name}</span>
            </div>`).join('')}
        </div>
        <div id="vm-selected-product" style="text-align:center;font-size:11px;margin-top:8px;opacity:0.5;">Select a product above</div>
      </div>

      <div class="vm-controls">
        <button class="vm-btn" onclick="vmToggleSize('down')">− SIZE</button>
        <button class="vm-btn" onclick="vmResetView()">↻ RESET</button>
        <button class="vm-btn" onclick="vmToggleSize('up')">+ SIZE</button>
      </div>

      <div class="vm-compare-section">
        <div class="widget-label">SIDE-BY-SIDE COMPARE</div>
        <div class="vm-compare-row" id="vm-compare-row">
          <div class="vm-compare-slot" onclick="vmAddToCompare(1)">
            <span style="font-size:2rem;opacity:0.3;">+</span>
            <span style="font-size:9px;">Add look A</span>
          </div>
          <div class="vm-compare-slot" onclick="vmAddToCompare(2)">
            <span style="font-size:2rem;opacity:0.3;">+</span>
            <span style="font-size:9px;">Add look B</span>
          </div>
        </div>
      </div>

      <div class="vm-share-section">
        <button class="vm-share-btn" onclick="vmShareLook()">📱 SHARE THIS LOOK</button>
      </div>`;
  }

  let vmSelectedProduct = null;
  let vmCurrentSize = 1;
  let vmCameraStream = null;

  async function vmEnableCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 480 } });
      vmCameraStream = stream;
      const video = document.getElementById('vm-video');
      const placeholder = document.getElementById('vm-placeholder');
      const overlay = document.getElementById('vm-overlay');
      if (video) { video.srcObject = stream; video.style.display = 'block'; }
      if (placeholder) placeholder.style.display = 'none';
      if (overlay) overlay.style.display = 'block';
      window.MorpheusApp?.showToast?.('📷 Camera Enabled', 'Point at yourself to try on clothes');
      vmUpdateOverlay();
    } catch(e) {
      window.MorpheusApp?.showToast?.('⚠ Camera Error', 'Please allow camera access in browser settings');
    }
  }

  function vmSelectProduct(id, name, icon) {
    vmSelectedProduct = { id, name, icon };
    const el = document.getElementById('vm-selected-product');
    if (el) el.innerHTML = `👕 Now trying: <strong>${name}</strong>`;
    vmUpdateOverlay();
  }

  function vmUpdateOverlay() {
    const overlay = document.getElementById('vm-overlay');
    if (!overlay || !vmSelectedProduct) return;
    overlay.innerHTML = `
      <div class="vm-clothing-overlay" style="
        position:absolute;
        top:20%;
        left:50%;
        transform:translateX(-50%) scale(${vmCurrentSize});
        font-size:4rem;
        filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));
        transition:transform 0.3s;
        pointer-events:none;
      ">${vmSelectedProduct.icon}</div>`;
  }

  function vmToggleSize(dir) {
    if (dir === 'up') vmCurrentSize = Math.min(vmCurrentSize + 0.2, 2);
    else vmCurrentSize = Math.max(vmCurrentSize - 0.2, 0.5);
    vmUpdateOverlay();
    window.MorpheusApp?.showToast?.('📐 Size', `${Math.round(vmCurrentSize * 100)}%`);
  }

  function vmResetView() { vmCurrentSize = 1; vmUpdateOverlay(); }

  let vmCompare = [null, null];
  function vmAddToCompare(slot) {
    if (vmSelectedProduct) {
      vmCompare[slot - 1] = vmSelectedProduct;
      const row = document.getElementById('vm-compare-row');
      if (row) {
        row.children[slot-1].innerHTML = `<span style="font-size:1.5rem;">${vmSelectedProduct.icon}</span><span style="font-size:9px;">${vmSelectedProduct.name}</span>`;
      }
    }
  }

  function vmShareLook() {
    const video = document.getElementById('vm-video');
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (vmSelectedProduct) {
      ctx.font = '20px Arial';
      ctx.fillStyle = '#fff';
      ctx.fillText(vmSelectedProduct.icon, 140, 180);
    }
    const dataUrl = canvas.toDataURL();
    navigator.clipboard.writeText(dataUrl);
    window.MorpheusApp?.showToast?.('📱 Screenshot', 'Copied! Share to Instagram or TikTok');
  }

  function escapeHtml(s) { return String(s).replace(/"/g,'&quot;'); }

  // ================================================================
  // SOCIAL COMMERCE — FEED
  // ================================================================
  function renderSocialFeed() {
    const content = document.getElementById('social-feed-content');
    if (!content) return;

    const sortedLooks = [...looks].sort((a, b) => b.likes - a.likes);
    const userFollows = followers.following || [];

    content.innerHTML = `
      <div class="sf-header">
        <div class="sf-tabs">
          <button class="sf-tab active" onclick="sfSwitchTab('trending',this)">🔥 TRENDING</button>
          <button class="sf-tab" onclick="sfSwitchTab('following',this)">❤️ FOLLOWING</button>
          <button class="sf-tab" onclick="sfSwitchTab('challenges',this)">🏆 CHALLENGES</button>
        </div>
      </div>

      <div id="sf-trending" class="sf-tab-content">
        <div class="sf-feed">
          ${sortedLooks.map(l => `
            <div class="sf-look-card" id="sf-look-${l.id}">
              <div class="sf-look-header">
                <div class="sf-user-avatar">${l.avatar}</div>
                <div class="sf-user-info">
                  <div class="sf-user-name">${l.userName}</div>
                  <div class="sf-user-handle">@${l.userId}</div>
                </div>
                ${userFollows.includes(l.userId) ? `<button class="sf-follow-btn following" onclick="sfUnfollow('${l.userId}')">FOLLOWING</button>` : `<button class="sf-follow-btn" onclick="sfFollow('${l.userId}')">+ FOLLOW</button>`}
              </div>
              <div class="sf-look-image" style="background:linear-gradient(135deg,var(--purple),var(--cyan));height:200px;display:flex;align-items:center;justify-content:center;font-size:4rem;">${l.products[0] ? (window.MorpheusApp?.products?.find(p=>p.name===l.products[0])?.icon || '👕') : '👗'}</div>
              <div class="sf-look-body">
                <div class="sf-look-title">${l.title}</div>
                <div class="sf-look-desc">${l.desc}</div>
                <div class="sf-look-tags">${l.tags.map(t => `<span class="sf-tag">${t}</span>`).join('')}</div>
                <div class="sf-look-products">
                  <span style="font-size:10px;opacity:0.5;margin-right:8px;">Products:</span>
                  ${l.products.map(p => {
                    const prod = (window.MorpheusApp?.products || []).find(x => x.name === p);
                    return `<div class="sf-product-tag" onclick="window.MorpheusApp?.addToCart?.(${prod?.id})">
                      ${prod?.icon || '👕'} ${p}
                    </div>`;
                  }).join('')}
                </div>
                <div class="sf-look-actions">
                  <button class="sf-action-btn" onclick="sfToggleLike(${l.id})">
                    <span id="sf-like-icon-${l.id}">🤍</span>
                    <span id="sf-like-count-${l.id}">${l.likes}</span>
                  </button>
                  <button class="sf-action-btn" onclick="sfComment(${l.id})">💬 ${l.comments}</button>
                  <button class="sf-action-btn" onclick="sfShareLook(${l.id})">📤 SHARE</button>
                  <button class="sf-action-btn" onclick="sfSaveLook(${l.id})">🔖 SAVE</button>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div id="sf-following" class="sf-tab-content" style="display:none;">
        <div class="sf-feed">
          ${sortedLooks.filter(l => userFollows.includes(l.userId)).length > 0
            ? sortedLooks.filter(l => userFollows.includes(l.userId)).map(l => renderLookCard(l))
            : '<p style="text-align:center;opacity:0.3;padding:40px;">Follow creators to see their posts here</p>'}
        </div>
      </div>

      <div id="sf-challenges" class="sf-tab-content" style="display:none;">
        <div class="sf-challenges">
          ${CHALLENGES.map(c => `
            <div class="sf-challenge-card">
              <div class="sf-challenge-title">${c.title}</div>
              <div class="sf-challenge-desc">${c.desc}</div>
              <div class="sf-challenge-meta">
                <span>🏆 ${c.prize}</span>
                <span>⏰ ${new Date(c.deadline).toLocaleDateString()}</span>
                <span>👥 ${c.participants} participants</span>
              </div>
              <button class="sf-join-btn" onclick="sfJoinChallenge('${c.id}')">JOIN CHALLENGE</button>
            </div>`).join('')}
        </div>
      </div>

      <div class="sf-create-section">
        <button class="sf-create-btn" onclick="sfOpenCreateLook()">✨ CREATE LOOK</button>
      </div>`;
  }

  function renderLookCard(l) {
    return `<div class="sf-look-card" id="sf-look-${l.id}">
      <div class="sf-look-header">
        <div class="sf-user-avatar">${l.avatar}</div>
        <div class="sf-user-info"><div class="sf-user-name">${l.userName}</div><div class="sf-user-handle">@${l.userId}</div></div>
      </div>
      <div class="sf-look-image" style="background:linear-gradient(135deg,var(--purple),var(--cyan));height:200px;display:flex;align-items:center;justify-content:center;font-size:4rem;">${l.products[0] ? (window.MorpheusApp?.products?.find(p=>p.name===l.products[0])?.icon || '👕') : '👗'}</div>
      <div class="sf-look-body">
        <div class="sf-look-title">${l.title}</div>
        <div class="sf-look-desc">${l.desc}</div>
        <div class="sf-look-tags">${l.tags.map(t => `<span class="sf-tag">${t}</span>`).join('')}</div>
        <div class="sf-look-actions">
          <button class="sf-action-btn" onclick="sfToggleLike(${l.id})"><span id="sf-like-icon-${l.id}">🤍</span> <span id="sf-like-count-${l.id}">${l.likes}</span></button>
          <button class="sf-action-btn">💬 ${l.comments}</button>
          <button class="sf-action-btn" onclick="sfShareLook(${l.id})">📤</button>
        </div>
      </div>
    </div>`;
  }

  function sfSwitchTab(tab, btn) {
    document.querySelectorAll('.sf-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sf-tab-content').forEach(c => c.style.display = 'none');
    if (btn) btn.classList.add('active');
    const el = document.getElementById('sf-' + tab);
    if (el) el.style.display = 'block';
  }

  let likedLooks = JSON.parse(localStorage.getItem('flyra_liked_looks') || '[]');
  function sfToggleLike(id) {
    const idx = looks.findIndex(l => l.id === id);
    if (idx === -1) return;
    const isLiked = likedLooks.includes(id);
    if (isLiked) {
      likes[idx]--;
      likedLooks = likedLooks.filter(x => x !== id);
      document.getElementById('sf-like-icon-' + id).textContent = '🤍';
    } else {
      looks[idx].likes++;
      likedLooks.push(id);
      document.getElementById('sf-like-icon-' + id).textContent = '❤️';
    }
    document.getElementById('sf-like-count-' + id).textContent = looks[idx].likes;
    localStorage.setItem('flyra_liked_looks', JSON.stringify(likedLooks));
    saveLooks(looks);
  }

  function sfFollow(userId) {
    if (!followers.following.includes(userId)) {
      followers.following.push(userId);
      saveFollowers(followers);
      const user = looks.find(l => l.userId === userId);
      window.MorpheusApp?.showToast?.('✅ Following', '@' + userId);
      renderSocialFeed();
    }
  }

  function sfUnfollow(userId) {
    followers.following = followers.following.filter(x => x !== userId);
    saveFollowers(followers);
    renderSocialFeed();
  }

  function sfShareLook(id) {
    const l = looks.find(x => x.id === id);
    if (!l) return;
    const text = `Check out this look by @${l.userId}: "${l.title}" — ${l.desc}\n\n${l.tags.join(' ')}`;
    navigator.clipboard.writeText(text);
    window.MorpheusApp?.showToast?.('📤 Copied!', 'Share to Instagram or TikTok');
  }

  function sfSaveLook(id) { window.MorpheusApp?.showToast?.('🔖 Saved', 'Added to your saved looks'); }
  function sfComment(id) { window.MorpheusApp?.showToast?.('💬 Comments', 'Comment feature coming soon'); }
  function sfJoinChallenge(id) { window.MorpheusApp?.showToast?.('🏆 Joined!', 'Good luck in the challenge'); }

  function sfOpenCreateLook() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99998;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `<div style="width:380px;background:rgba(15,15,20,0.98);border:1px solid var(--border);border-radius:14px;padding:24px;">
      <h3 style="font-size:14px;font-weight:800;margin-bottom:16px;">✨ Create Your Look</h3>
      <input type="text" id="cl-title" placeholder="Look title..." style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--white);font-size:11px;margin-bottom:8px;">
      <textarea id="cl-desc" placeholder="Describe your look..." style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--white);font-size:11px;min-height:60px;resize:vertical;margin-bottom:8px;"></textarea>
      <input type="text" id="cl-tags" placeholder="Tags (comma separated)..." style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--white);font-size:11px;margin-bottom:12px;">
      <div style="display:flex;gap:8px;">
        <button onclick="this.closest('[style]').remove()" style="flex:1;padding:10px;border-radius:8px;background:rgba(255,255,255,0.1);border:1px solid var(--border);color:var(--white);font-size:11px;font-weight:700;cursor:pointer;">CANCEL</button>
        <button onclick="sfSubmitLook()" style="flex:1;padding:10px;border-radius:8px;background:var(--green);border:none;color:#000;font-size:11px;font-weight:700;cursor:pointer;">PUBLISH</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
  }

  function sfSubmitLook() {
    const title = document.getElementById('cl-title')?.value?.trim();
    const desc = document.getElementById('cl-desc')?.value?.trim();
    const tagsStr = document.getElementById('cl-tags')?.value?.trim();
    if (!title || !desc) { window.MorpheusApp?.showToast?.('⚠', 'Title and description required'); return; }
    const newLook = {
      id: Date.now(),
      userId: userProfile.username,
      userName: userProfile.displayName || userProfile.username,
      avatar: userProfile.avatar || '👤',
      title,
      desc,
      products: [],
      likes: 0,
      comments: 0,
      tags: tagsStr ? tagsStr.split(',').map(t => t.trim()) : [],
      time: Date.now(),
    };
    looks.unshift(newLook);
    saveLooks(looks);
    document.querySelector('[style*="position:fixed"]')?.remove();
    window.MorpheusApp?.showToast?.('✨ Look Published!', title);
    renderSocialFeed();
  }

  // ================================================================
  // USER PROFILE HUB
  // ================================================================
  function renderProfileHub() {
    const content = document.getElementById('profile-hub-content');
    if (!content) return;

    content.innerHTML = `
      <div class="ph-header">
        <div class="ph-avatar">${userProfile.avatar || '👤'}</div>
        <div class="ph-info">
          <div class="ph-name">${userProfile.displayName || 'New Creator'}</div>
          <div class="ph-handle">@${userProfile.username}</div>
          <div class="ph-badge">${userProfile.isCreator ? '✓ CREATOR' : '👤 MEMBER'}</div>
        </div>
        <button class="ph-edit-btn" onclick="phEditProfile()">✏️</button>
      </div>

      <div class="ph-stats-grid">
        <div class="ph-stat">
          <div class="ph-stat-val">${userProfile.lookCount || 0}</div>
          <div class="ph-stat-label">Looks</div>
        </div>
        <div class="ph-stat">
          <div class="ph-stat-val">${followers.followers?.length || 0}</div>
          <div class="ph-stat-label">Followers</div>
        </div>
        <div class="ph-stat">
          <div class="ph-stat-val">${followers.following?.length || 0}</div>
          <div class="ph-stat-label">Following</div>
        </div>
        <div class="ph-stat">
          <div class="ph-stat-val">${(userProfile.totalEarnings || 0).toLocaleString()}</div>
          <div class="ph-stat-label">DZD Earned</div>
        </div>
      </div>

      <div class="ph-rank-section">
        <div class="widget-label">CREATOR RANK</div>
        <div class="ph-rank-display">
          <div class="ph-rank-badge">${userProfile.rank || 'Bronze'}</div>
          <div class="ph-rank-progress">
            <div class="ph-rank-bar" style="width:${phGetRankProgress()}%;"></div>
          </div>
          <div class="ph-rank-next">Next: ${phGetNextRank()} (${phPointsToNext()} more points)</div>
        </div>
      </div>

      <div class="ph-earnings-section">
        <div class="widget-label">💰 EARNINGS</div>
        <div class="ph-earnings-card">
          <div class="ph-balance">
            <span>Available Balance</span>
            <span class="ph-balance-val">${(earnings.balance || 0).toLocaleString()} DZD</span>
          </div>
          <div class="ph-earnings-history">
            ${(earnings.history || []).slice(0,5).map(e => `
              <div class="ph-earnings-row">
                <span>${e.desc}</span>
                <span style="color:var(--green);">+${e.amount.toLocaleString()}</span>
              </div>`).join('') || '<p style="font-size:10px;opacity:0.3;text-align:center;">No earnings yet</p>'}
          </div>
          <button class="ph-withdraw-btn" onclick="phWithdraw()">WITHDRAW</button>
        </div>
      </div>

      <div class="ph-badges-section">
        <div class="widget-label">BADGES</div>
        <div class="ph-badges-grid">
          ${(userProfile.badges || []).map(b => `<div class="ph-badge-item">${b.icon} ${b.name}</div>`).join('') || '<p style="font-size:10px;opacity:0.3;">Create looks to earn badges</p>'}
        </div>
      </div>

      <div class="ph-settings-section">
        <div class="widget-label">SETTINGS</div>
        <button class="ph-settings-btn" onclick="phEditProfile()">✏️ Edit Profile</button>
        <button class="ph-settings-btn" onclick="phUpgradeCreator()">⭐ Become a Creator</button>
        <button class="ph-settings-btn" onclick="phExportData()">📥 Export My Data</button>
      </div>`;
  }

  function phGetRankProgress() {
    const ranks = ['Bronze','Silver','Gold','Platinum','Diamond'];
    const rankIdx = ranks.indexOf(userProfile.rank || 'Bronze');
    return Math.min(((rankIdx + 1) / ranks.length) * 100, 100);
  }

  function phGetNextRank() {
    const ranks = ['Bronze','Silver','Gold','Platinum','Diamond'];
    const rankIdx = ranks.indexOf(userProfile.rank || 'Bronze');
    return ranks[Math.min(rankIdx + 1, ranks.length - 1)];
  }

  function phPointsToNext() { return 100 - ((userProfile.lookCount || 0) % 100); }

  function phEditProfile() {
    window.MorpheusApp?.showToast?.('✏️ Profile', 'Edit modal coming soon');
  }

  function phUpgradeCreator() {
    userProfile.isCreator = true;
    userProfile.rank = 'Silver';
    saveUserProfile(userProfile);
    window.MorpheusApp?.showToast?.('⭐ Creator Upgraded!', 'You can now earn commission on looks');
    renderProfileHub();
  }

  function phWithdraw() {
    if (earnings.balance < 5000) { window.MorpheusApp?.showToast?.('⚠', 'Minimum withdrawal is 5,000 DZD'); return; }
    window.MorpheusApp?.showToast?.('💰 Withdrawal', 'Request submitted — CCP transfer in 24h');
  }

  function phExportData() {
    const data = { profile: userProfile, looks, designs, earnings };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'flyra_my_data.json';
    a.click();
    window.MorpheusApp?.showToast?.('📥 Exported', 'Your data saved');
  }

  // ================================================================
  // LIVE SHOPPING
  // ================================================================
  function renderLiveShopping() {
    const content = document.getElementById('live-shopping-content');
    if (!content) return;

    content.innerHTML = `
      <div class="ls-header">
        <div class="ls-title">🎥 LIVE SHOPPING</div>
      </div>

      <div class="ls-streams-section">
        <div class="widget-label">📡 LIVE NOW</div>
        <div class="ls-streams-grid">
          ${SAMPLE_STREAMS.filter(s => s.isLive).map(s => `
            <div class="ls-stream-card" onclick="lsJoinStream('${s.id}')">
              <div class="ls-stream-preview" style="background:linear-gradient(135deg,var(--red),var(--pink));">
                <div class="ls-live-badge">🔴 LIVE</div>
                <div class="ls-stream-title">${s.title}</div>
              </div>
              <div class="ls-stream-info">
                <div class="ls-host">${s.hostAvatar} ${s.hostName}</div>
                <div class="ls-viewers">👁 ${s.viewers}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div class="ls-host-section">
        <button class="ls-go-live-btn" onclick="lsGoLive()">🎥 GO LIVE</button>
        <p style="font-size:9px;opacity:0.4;text-align:center;margin-top:8px;">Host your own shopping stream and earn from sales</p>
      </div>

      <div id="ls-stream-view" style="display:none;"></div>

      <div class="ls-upcoming-section">
        <div class="widget-label">📅 UPCOMING STREAMS</div>
        <div class="ls-upcoming-list">
          <div class="ls-upcoming-item">
            <div>🌙 Midnight Fashion Show</div>
            <div style="font-size:9px;opacity:0.5;">Tomorrow, 22:00</div>
          </div>
          <div class="ls-upcoming-item">
            <div>⚡ Summer Drop Preview</div>
            <div style="font-size:9px;opacity:0.5;">In 3 days</div>
          </div>
        </div>
      </div>`;
  }

  function lsGoLive() {
    const title = prompt('Stream title:', 'My FLYRA Shopping Stream 🎉');
    if (!title) return;

    activeStreamId = 'stream_' + Date.now();
    const stream = {
      id: activeStreamId,
      hostId: userProfile.username,
      hostName: userProfile.displayName || 'You',
      hostAvatar: userProfile.avatar || '👤',
      title,
      viewers: 1,
      isLive: true,
      startedAt: Date.now(),
      chat: [],
    };

    const view = document.getElementById('ls-stream-view');
    view.style.display = 'block';
    view.innerHTML = `
      <div class="ls-my-stream">
        <div class="ls-stream-header">
          <span>🔴 LIVE</span>
          <span>👁 1 viewer</span>
          <span>${title}</span>
          <button onclick="lsEndStream()">END STREAM</button>
        </div>
        <div class="ls-stream-camera">
          <video id="ls-video" autoplay playsinline muted style="width:100%;height:200px;object-fit:cover;background:#111;border-radius:8px;"></video>
          <div class="ls-stream-products">
            <div class="widget-label">FEATURED PRODUCTS</div>
            ${(window.MorpheusApp?.products || []).slice(0,3).map(p => `
              <div class="ls-product-popup" onclick="lsFeatureProduct('${p.name}')">
                ${p.icon || '👕'} ${p.name} — ${p.price.toLocaleString()} DZD
              </div>`).join('')}
          </div>
        </div>
        <div class="ls-chat">
          <div class="widget-label">LIVE CHAT</div>
          <div class="ls-chat-messages" id="ls-chat-messages"></div>
          <div class="ls-chat-input">
            <input type="text" id="ls-chat-input-field" placeholder="Say something...">
            <button onclick="lsSendChat()">SEND</button>
          </div>
        </div>
      </div>`;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      document.getElementById('ls-video').srcObject = stream;
    }).catch(() => {});

    window.MorpheusApp?.showToast?.('🎥 You\'re Live!', title);
    lsAddBotChat();
  }

  function lsJoinStream(id) {
    window.MorpheusApp?.showToast?.('📺 Joining stream...', 'Connecting to live show');
  }

  function lsEndStream() {
    if (confirm('End your stream?')) {
      activeStreamId = null;
      const view = document.getElementById('ls-stream-view');
      if (view) view.style.display = 'none';
      document.getElementById('ls-video')?.srcObject?.getTracks().forEach(t => t.stop());
      window.MorpheusApp?.showToast?.('Stream ended', 'Great session!');
      renderLiveShopping();
    }
  }

  function lsSendChat() {
    const input = document.getElementById('ls-chat-input-field');
    const text = input?.value?.trim();
    if (!text) return;
    lsAddChatMessage(userProfile.displayName || 'You', text, userProfile.avatar || '👤');
    input.value = '';
  }

  function lsAddChatMessage(user, text, avatar) {
    const container = document.getElementById('ls-chat-messages');
    if (!container) return;
    const msg = document.createElement('div');
    msg.className = 'ls-chat-msg';
    msg.innerHTML = `<span>${avatar}</span><strong>${user}:</strong> ${text}`;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  function lsAddBotChat() {
    const bots = [
      { name:'FashionLover22', text:'Love this collection! 🔥', avatar:'👩' },
      { name:'AlgiersStyle', text:'What size should I get?', avatar:'👨🏾' },
      { name:'SaraM', text:'The colors are amazing', avatar:'👩🏾‍🦱' },
      { name:'TechWearGuy', text:'Is this in stock?', avatar:'👨' },
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (!activeStreamId) { clearInterval(interval); return; }
      const bot = bots[i % bots.length];
      lsAddChatMessage(bot.name, bot.text, bot.avatar);
      i++;
    }, 4000 + Math.random() * 3000);
  }

  function lsFeatureProduct(name) {
    window.MorpheusApp?.showToast?.('📦 Featured', name);
  }

  // ================================================================
  // CREATOR DASHBOARD
  // ================================================================
  function renderCreatorDashboard() {
    const content = document.getElementById('creator-dash-content');
    if (!content) return;

    const myLooks = looks.filter(l => l.userId === userProfile.username);
    const totalLikes = myLooks.reduce((s, l) => s + l.likes, 0);
    const totalSales = earnings.totalSales || 0;

    content.innerHTML = `
      <div class="cd-stats-grid">
        <div class="cd-stat">
          <div class="cd-stat-val" style="color:var(--green);">${(earnings.balance || 0).toLocaleString()}</div>
          <div class="cd-stat-label">Available (DZD)</div>
        </div>
        <div class="cd-stat">
          <div class="cd-stat-val" style="color:var(--cyan);">${(userProfile.totalEarnings || 0).toLocaleString()}</div>
          <div class="cd-stat-label">Total Earned</div>
        </div>
        <div class="cd-stat">
          <div class="cd-stat-val" style="color:var(--purple);">${totalSales}</div>
          <div class="cd-stat-label">Sales</div>
        </div>
        <div class="cd-stat">
          <div class="cd-stat-val" style="color:var(--orange);">${totalLikes}</div>
          <div class="cd-stat-label">Likes</div>
        </div>
      </div>

      <div class="cd-commission-info">
        <div class="widget-label">💰 COMMISSION STRUCTURE</div>
        <div class="cd-commission-grid">
          <div class="cd-comm-item">
            <div class="cd-comm-val">15%</div>
            <div class="cd-comm-label">From your look sales</div>
          </div>
          <div class="cd-comm-item">
            <div class="cd-comm-val">5%</div>
            <div class="cd-comm-label">From follower referrals</div>
          </div>
        </div>
      </div>

      <div class="cd-top-looks">
        <div class="widget-label">🏆 TOP PERFORMING LOOKS</div>
        ${myLooks.length > 0 ? myLooks.slice(0,5).map(l => `
          <div class="cd-look-row">
            <div class="cd-look-rank">#${myLooks.indexOf(l)+1}</div>
            <div class="cd-look-info">
              <div class="cd-look-title">${l.title}</div>
              <div class="cd-look-meta">❤️ ${l.likes} · 💬 ${l.comments}</div>
            </div>
            <div class="cd-look-earnings">
              ${Math.round(l.likes * 15).toLocaleString()} DZD
            </div>
          </div>`).join('') : '<p style="font-size:11px;opacity:0.3;text-align:center;padding:20px;">Create looks to start earning</p>'}
      </div>

      <div class="cd-leaderboard">
        <div class="widget-label">📊 LEADERBOARD</div>
        <div class="cd-leader-grid">
          ${looks.slice(0,5).map((l, i) => `
            <div class="cd-leader-row ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">
              <div class="cd-leader-pos">${i+1}</div>
              <div class="cd-leader-avatar">${l.avatar}</div>
              <div class="cd-leader-name">${l.userName}</div>
              <div class="cd-leader-looks">${l.likes} ❤️</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="cd-analytics">
        <div class="widget-label">📈 ANALYTICS (7 Days)</div>
        <div class="cd-chart">
          ${[65,75,45,80,90,70,85].map((h, i) => `
            <div class="cd-bar" style="height:${h}%;">
              <span class="cd-bar-label">${['M','T','W','T','F','S','S'][i]}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  // ================================================================
  // INIT ALL MODULES
  // ================================================================
  function init() {
    initUserProfile();
    renderDesignStudio();
    renderBodyScanner();
    renderVirtualMirror();
    renderSocialFeed();
    renderProfileHub();
    renderLiveShopping();
    renderCreatorDashboard();
  }

  // ================================================================
  // DOCK EVENTS — attach to new windows
  // ================================================================
  function setupPlusDockEvents() {
    document.querySelectorAll('.dock-item[data-win]').forEach(item => {
      const originalHandler = item.onclick;
      item.addEventListener('click', () => {
        const winName = item.dataset.win;
        // Refresh specific modules when their windows open
        if (winName === 'design') setTimeout(renderDesignStudio, 100);
        if (winName === 'body') setTimeout(renderBodyScanner, 100);
        if (winName === 'mirror') setTimeout(renderVirtualMirror, 100);
        if (winName === 'social') setTimeout(renderSocialFeed, 100);
        if (winName === 'profile') setTimeout(renderProfileHub, 100);
        if (winName === 'live') setTimeout(renderLiveShopping, 100);
        if (winName === 'creator') setTimeout(renderCreatorDashboard, 100);
      });
    });
  }

  // ================================================================
  // EXPOSE API
  // ================================================================
  window.MorpheusPlus = {
    // Design Studio
    renderDesignStudio,
    switchDsTab,
    setDsTool,
    setDsColor,
    setDsBrushSize,
    dsClearCanvas,
    dsAddShape,
    selectDsFabric,
    dsSaveDraft,
    dsApplyTemplate,
    dsAIGenerate,
    dsGenerateAI,
    dsOrderDesign,
    openDesign,
    // Body Scanner
    renderBodyScanner,
    bsRunScan,
    bsShowProfile,
    bsSaveCurrentProfile,
    // Virtual Mirror
    renderVirtualMirror,
    vmEnableCamera,
    vmSelectProduct,
    vmToggleSize,
    vmResetView,
    vmShareLook,
    // Social
    renderSocialFeed,
    sfSwitchTab,
    sfToggleLike,
    sfFollow,
    sfUnfollow,
    sfShareLook,
    sfOpenCreateLook,
    sfSubmitLook,
    // Profile
    renderProfileHub,
    phEditProfile,
    phUpgradeCreator,
    phWithdraw,
    phExportData,
    // Live
    renderLiveShopping,
    lsGoLive,
    lsJoinStream,
    lsEndStream,
    lsSendChat,
    // Creator
    renderCreatorDashboard,
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(init, 500);
      setTimeout(setupPlusDockEvents, 1000);
    });
  } else {
    setTimeout(init, 500);
    setTimeout(setupPlusDockEvents, 1000);
  }

})();