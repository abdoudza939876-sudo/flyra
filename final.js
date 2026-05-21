// ================================================================
// FLYRA // ALGERIAN FASHION PLATFORM v1.0
// Complete Frontend Logic — final.js
// ================================================================

(function() {
  'use strict';

  // ================================================================
  // i18n — MULTI-LANGUAGE SUPPORT (EN / FR / AR)
  // ================================================================
  const TRANSLATIONS = {
    en: {
      welcome:'WELCOME', tagline:'Fashion Desktop', products:'Products', cart:'Cart',
      orders:'Orders', collections:'COLLECTIONS', browse:'Browse categories',
      allItems:'ALL ITEMS', stylist:'AI_STYLIST', stylistWelcome:"Hello. I'm your AI stylist powered by Claude. Ask me about outfits, trends, sizes, or any product.",
      stylistPlaceholder:'Ask your stylist...', send:'SEND', outfit:'OUTFIT_BUILDER',
      buildLook:'Build your look', selectItem:'Select item...', total:'TOTAL', clear:'CLEAR',
      addToCart:'ADD TO CART', addToOutfit:'Add to Outfit', viewDetail:'View Detail',
      wishlist:'Add to Wishlist', checkout:'CHECKOUT', shippingInfo:'Shipping Information',
      firstName:'First Name *', lastName:'Last Name *', paymentMethod:'Payment Method',
      cod:'Cash on Delivery (COD)', codDesc:'Pay when you receive your order',
      recommended:'RECOMMENDED', orderConfirmed:'Order Confirmed!', continueShopping:'CONTINUE SHOPPING',
      notifications:'NOTIFICATIONS', settings:'SETTINGS', soldOut:'SOLD OUT', limited:'LIMITED',
      inStock:'in stock', lowStock:'Low stock', outOfStock:'Out of stock', notify:'NOTIFY ME',
      dropLaunch:'UPCOMING DROP', launchIn:'Launches in',
      searchPlaceholder:'Search products...', couponApplied:'Coupon Applied',
    },
    fr: {
      welcome:'BIENVENUE', tagline:'Mode Desktop', products:'Produits', cart:'Panier',
      orders:'Commandes', collections:'COLLECTIONS', browse:'Parcourir les catégories',
      allItems:'TOUS LES ARTICLES', stylist:'STYLISTE IA', stylistWelcome:'Bonjour. Je suis votre styliste IA. Demandez-moi des conseils sur les tenues, tendances ou tailles.',
      stylistPlaceholder:'Demandez à votre styliste...', send:'ENVOYER', outfit:'CRÉATEUR DE LOOK',
      buildLook:'Créez votre look', selectItem:'Choisir un article...', total:'TOTAL', clear:'VIDER',
      addToCart:'AJOUTER AU PANIER', addToOutfit:'Ajouter au look', viewDetail:'Voir détail',
      wishlist:'Ajouter aux favoris', checkout:'COMMANDE', shippingInfo:'Informations de livraison',
      firstName:'Prénom *', lastName:'Nom *', paymentMethod:'Mode de paiement',
      cod:'Paiement à la livraison', codDesc:'Payez à la réception de votre commande',
      recommended:'RECOMMANDÉ', orderConfirmed:'Commande confirmée!', continueShopping:'CONTINUER',
      notifications:'NOTIFICATIONS', settings:'PARAMÈTRES', soldOut:'ÉPUISÉ', limited:'LIMITÉ',
      inStock:'en stock', lowStock:'Stock faible', outOfStock:'Rupture de stock', notify:'NOTIFIER',
      dropLaunch:'PROCHAINE SORTIE', launchIn:'Lance dans',
      searchPlaceholder:'Rechercher...', couponApplied:'Coupon Appliqué',
    },
    ar: {
      welcome:'مرحباً', tagline:'متجر الأزياء', products:'المنتجات', cart:'السلة',
      orders:'الطلبات', collections:'المجموعات', browse:'تصفح الفئات',
      allItems:'كل المنتجات', stylist:'المصمم الذكي', stylistWelcome:'مرحباً. أنا مصممك الذكي. اسألني عن الأزياء والمقاسات وأي منتج.',
      stylistPlaceholder:'اسأل مصممك...', send:'إرسال', outfit:'منشئ الإطلالة',
      buildLook:'ابنِ إطلالتك', selectItem:'اختر منتجاً...', total:'الإجمالي', clear:'مسح',
      addToCart:'أضف للسلة', addToOutfit:'أضف للإطلالة', viewDetail:'عرض التفاصيل',
      wishlist:'أضف للمفضلة', checkout:'إتمام الطلب', shippingInfo:'معلومات الشحن',
      firstName:'الاسم *', lastName:'اللقب *', paymentMethod:'طريقة الدفع',
      cod:'الدفع عند الاستلام', codDesc:'ادفع عند وصول طلبك',
      recommended:'موصى به', orderConfirmed:'تم تأكيد الطلب!', continueShopping:'متابعة التسوق',
      notifications:'الإشعارات', settings:'الإعدادات', soldOut:'نفذ المخزون', limited:'محدود',
      inStock:'متوفر', lowStock:'مخزون منخفض', outOfStock:'غير متوفر', notify:'تنبيهني',
      dropLaunch:'إطلاق قادم', launchIn:'يُطلق خلال',
      searchPlaceholder:'بحث عن منتجات...', couponApplied:'تم تطبيق الكود',
    }
  };

  let currentLang = localStorage.getItem('flyra_lang') || 'en';
  let currentCurrency = localStorage.getItem('flyra_currency') || 'DZD';
  const DZD_TO_USD = 134.5;

  // ================================================================
  // DATA LAYER — KEYS
  // ================================================================
  const ADMIN_PASSWORD_KEY = 'flyra_admin_pw';
  const PRODUCTS_KEY = 'flyra_products_v1';
  const CART_KEY = 'flyra_cart_v1';
  const ORDERS_KEY = 'flyra_orders_v1';
  const DROPS_KEY = 'flyra_drops';
  const API_KEY_STORE = 'flyra_api_key';

  // ================================================================
  // DATA — STATE
  // ================================================================
  let products = [];
  let cart = [];
  let orders = [];
  let drops = [];
  let outfit = { top:null, bottom:null, shoes:null, accessory:null };
  let contextProduct = null;
  let currentCollection = 'all';
  let isAdminLoggedIn = false;
  let editingProductId = null;
  let selectedPaymentMethod = 'cod';
  let uploadedImageBase64 = '';
  let searchQuery = '';
  let activeTagFilter = '';
  let activeStatusFilter = '';
  let searchDebounceTimer = null;
  let aiConversationHistory = [];
  let notifiedDrops = [];
  let wishlist = [];
  let isPlaying = false;
  let musicProgress = 35;
  let musicInterval = null;
  let currentTheme = 'neural';
  let particlesEnabled = true;
  let activeWindow = null;
  let dragOffset = {x:0, y:0};
  let undoTimeout = null;
  let undoCallback = null;
  let touchActiveWin = null;
  let touchSwipeStartX = 0;
  let stepIdx = 0;

  // ================================================================
  // DEFAULT PRODUCTS
  // ================================================================
  const DEFAULT_PRODUCTS = [
    { id:1, name:'HERITAGE GANDOURA', desc:'Hand-embroidered traditional Algerian Gandoura. Pure linen from Tlemcen workshops.', price:28000, oldPrice:35000, icon:'👳', tag:'HERITAGE', collection:'heritage', sizes:['S','M','L','XL','XXL'], image:'', stock:8, status:'active' },
    { id:2, name:'PHANTOM STREET HOODIE', desc:'Oversized silhouette. Heavy-weight 420gsm French terry. Phantom collection.', price:18000, oldPrice:24000, icon:'🧥', tag:'NEW', collection:'street', sizes:['S','M','L','XL'], image:'', stock:15, status:'active' },
    { id:3, name:'OLD MONEY BLAZER', desc:'Italian wool blend. Structured shoulders. The Algiers executive look.', price:45000, oldPrice:55000, icon:'🧥', tag:'PREMIUM', collection:'oldmoney', sizes:['S','M','L','XL'], image:'', stock:5, status:'active' },
    { id:4, name:'SKY RUNNER SNEAKERS', desc:'Algerian-designed upper. Memory foam insole. Street-to-stadium versatility.', price:22000, oldPrice:28000, icon:'👟', tag:'NEW', collection:'sport', sizes:['38','40','42','44','46'], image:'', stock:20, status:'active' },
    { id:5, name:'DJELLABA MODERNE', desc:'Contemporary cut meets traditional silhouette. Breathable cotton blend.', price:24000, oldPrice:30000, icon:'👳', tag:'HERITAGE', collection:'heritage', sizes:['S','M','L','XL','XXL'], image:'', stock:10, status:'active' },
    { id:6, name:'SILENT SHORTS', desc:'Technical woven fabric. Hidden zip pockets. Sport meets street.', price:8500, oldPrice:null, icon:'🩳', tag:'SALE', collection:'sport', sizes:['S','M','L','XL'], image:'', stock:25, status:'active' },
    { id:7, name:'AMBER TEE', desc:'Premium 200gsm cotton. Embroidered FLYRA crest. The essential base layer.', price:6500, oldPrice:null, icon:'👕', tag:null, collection:'street', sizes:['XS','S','M','L','XL','XXL'], image:'', stock:40, status:'active' },
    { id:8, name:'SPORT TECH JOGGERS', desc:'Track-inspired cut. Tapered leg. Reflective FLYRA taping.', price:12000, oldPrice:16000, icon:'👖', tag:'NEW', collection:'sport', sizes:['S','M','L','XL'], image:'', stock:18, status:'active' },
    { id:9, name:'ALGIERS CAP', desc:'Structured six-panel. Embroidered skyline of Algiers. Adjustable strap.', price:4500, oldPrice:null, icon:'🧢', tag:null, collection:'street', sizes:['M/L','L/XL'], image:'', stock:30, status:'active' },
    { id:10, name:'BROCADE VEST', desc:'Traditional Algerian brocade fabric. Gold-thread patterns. Heritage luxury.', price:35000, oldPrice:42000, icon:'🦺', tag:'LIMITED', collection:'heritage', sizes:['S','M','L','XL'], image:'', stock:4, status:'limited' },
  ];

  // ================================================================
  // UTILITIES
  // ================================================================
  function t(key) {
    return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || TRANSLATIONS.en[key] || key;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatPrice(price) {
    if (currentCurrency === 'DZD') return price.toLocaleString() + ' DZD';
    return '$' + (price / DZD_TO_USD).toFixed(2);
  }

  // ================================================================
  // PERSISTENCE
  // ================================================================
  function loadProducts() {
    try { const s = localStorage.getItem(PRODUCTS_KEY); if (s) return JSON.parse(s); } catch(e) {}
    const prods = DEFAULT_PRODUCTS.map(p => ({...p}));
    saveProducts(prods);
    return prods;
  }
  function saveProducts(p) { products = p; localStorage.setItem(PRODUCTS_KEY, JSON.stringify(p)); }
  function loadCart() { try { const s = localStorage.getItem(CART_KEY); return s ? JSON.parse(s) : []; } catch(e) { return []; } }
  function saveCart(c) { cart = c; localStorage.setItem(CART_KEY, JSON.stringify(c)); }
  function loadOrders() { try { const s = localStorage.getItem(ORDERS_KEY); return s ? JSON.parse(s) : []; } catch(e) { return []; } }
  function saveOrders(o) { orders = o; localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }
  function loadDrops() { try { const s = localStorage.getItem(DROPS_KEY); return s ? JSON.parse(s) : []; } catch(e) { return []; } }
  function saveDrops(d) { drops = d; localStorage.setItem(DROPS_KEY, JSON.stringify(d)); }
  function saveWishlist() { localStorage.setItem('flyra_wishlist', JSON.stringify(wishlist)); }
  function loadWishlist() { try { return JSON.parse(localStorage.getItem('flyra_wishlist') || '[]'); } catch(e) { return []; } }
  function loadNotifiedDrops() { try { return JSON.parse(localStorage.getItem('flyra_notified_drops') || '[]'); } catch(e) { return []; } }
  function saveNotifiedDrops() { localStorage.setItem('flyra_notified_drops', JSON.stringify(notifiedDrops)); }

  // ================================================================
  // CLOCK
  // ================================================================
  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false});
    const el = document.getElementById('clock');
    if (el) el.textContent = timeStr;
    const sbTime = document.getElementById('sb-time');
    if (sbTime) sbTime.textContent = timeStr;
    const sbDate = document.getElementById('sb-date');
    if (sbDate) sbDate.textContent = now.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    const dateStr = document.getElementById('date-str');
    if (dateStr) dateStr.textContent = now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  }

  // ================================================================
  // LANGUAGE
  // ================================================================
  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('flyra_lang', lang);
    const isRTL = lang === 'ar';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    const langIndicator = document.getElementById('lang-indicator');
    if (langIndicator) langIndicator.textContent = lang.toUpperCase();
    document.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.textContent.toLowerCase() === lang);
    });
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    renderProducts(currentCollection);
    showToast('Language', lang === 'ar' ? 'تم تغيير اللغة' : lang === 'fr' ? 'Langue changée' : 'Language changed');
  }

  // ================================================================
  // PRODUCTS
  // ================================================================
  function updateCollectionCounts() {
    const colls = ['spring','neural','phantom','void','orbital','glitch'];
    const allCount = document.getElementById('count-all');
    if (allCount) allCount.textContent = products.filter(p => p.status !== 'drop').length;
    colls.forEach(c => {
      const el = document.getElementById('count-' + c);
      if (el) el.textContent = products.filter(p => p.collection === c && p.status !== 'drop').length;
    });
  }

  function renderFilteredProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    let filtered = (currentCollection === 'all' ? products : products.filter(p => p.collection === currentCollection))
      .filter(p => p.status !== 'drop');

    if (searchQuery) filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchQuery) ||
      p.desc.toLowerCase().includes(searchQuery) ||
      p.collection.toLowerCase().includes(searchQuery)
    );
    if (activeTagFilter) filtered = filtered.filter(p => p.tag === activeTagFilter);
    if (activeStatusFilter) filtered = filtered.filter(p => p.status === activeStatusFilter);

    if (filtered.length === 0) {
      grid.innerHTML = `<p style="opacity:0.3;font-size:12px;text-align:center;padding:30px;grid-column:1/-1;">${currentLang === 'ar' ? 'لا توجد نتائج' : 'No results found'}</p>`;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const isSoldOut = p.status === 'soldout' || p.stock === 0;
      const isLimited = p.status === 'limited' || (p.stock > 0 && p.stock <= 5);
      const imgHtml = p.image ? `<img src="${p.image}" onerror="this.style.display='none'">` : '';
      const stockText = isSoldOut ? `<span class="stock-badge out">${t('outOfStock')}</span>`
        : isLimited ? `<span class="stock-badge low">⚠ ${p.stock} ${t('inStock')}</span>`
        : p.stock > 0 ? `<span class="stock-badge">${p.stock} ${t('inStock')}</span>` : '';
      const tagLabel = isSoldOut ? `<span class="product-tag soldout-tag">${t('soldOut')}</span>`
        : isLimited ? `<span class="product-tag limited-tag">${t('limited')}</span>`
        : p.tag ? `<span class="product-tag">${p.tag}</span>` : '';
      const oldPriceDisplay = p.oldPrice ? formatPrice(p.oldPrice) : null;

      return `
      <div class="product-card${isSoldOut ? ' sold-out' : ''}" data-id="${p.id}" oncontextmenu="window.MorpheusApp.showContext(event,${p.id})" onclick="window.MorpheusApp.openProductDetail(${p.id})">
        ${tagLabel}
        <div class="product-img">
          ${imgHtml}
          <span style="${p.image ? 'display:none' : 'display:flex'};font-size:2.5rem;align-items:center;justify-content:center;width:100%;height:100%;">${p.icon || '📦'}</span>
          <div class="product-img-hover"></div>
          ${isSoldOut ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;letter-spacing:0.1em;color:var(--red);border-radius:8px;">${t('soldOut')}</div>` : ''}
        </div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        ${stockText}
        <div class="product-price-row">
          <span class="product-price">${formatPrice(p.price)}</span>
          ${oldPriceDisplay ? `<span class="product-old-price">${oldPriceDisplay}</span>` : ''}
        </div>
        <div class="product-actions">
          <button class="product-btn" onclick="event.stopPropagation();window.MorpheusApp.addToOutfit(${p.id})">+ ${currentLang === 'ar' ? 'إطلالة' : 'Outfit'}</button>
          <button class="product-btn primary" onclick="event.stopPropagation();window.MorpheusApp.addToCart(${p.id})"${isSoldOut ? ' disabled' : ''}>${isSoldOut ? t('soldOut') : t('addToCart')}</button>
        </div>
        <div class="product-share-btns">
          <button class="share-btn ig" onclick="event.stopPropagation();window.MorpheusApp.shareProduct('instagram','${escapeHtml(p.name)}',${p.price})" title="Instagram">📷</button>
          <button class="share-btn tt" onclick="event.stopPropagation();window.MorpheusApp.shareProduct('tiktok','${escapeHtml(p.name)}',${p.price})" title="TikTok">♪</button>
          <button class="share-btn copy" onclick="event.stopPropagation();window.MorpheusApp.shareProduct('copy','${escapeHtml(p.name)}',${p.price})" title="Copy link">🔗</button>
        </div>
      </div>`;
    }).join('');

    attachCompareButtons();
  }

  function renderProducts(collection) {
    currentCollection = collection || currentCollection;
    const titleEl = document.getElementById('products-title');
    if (titleEl) titleEl.textContent = (currentCollection === 'all' ? 'ALL' : currentCollection.toUpperCase()) + ' // PRODUCTS';
    renderFilteredProducts();
  }

  function searchProducts(query) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      searchQuery = query.toLowerCase();
      renderFilteredProducts();
    }, 150);
  }

  function filterByTag(tag, btn) {
    activeTagFilter = tag;
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderFilteredProducts();
  }

  function filterByStatus(status, btn) {
    activeStatusFilter = status;
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderFilteredProducts();
  }

  function attachCompareButtons() {
    setTimeout(() => {
      document.querySelectorAll('.product-card').forEach(card => {
        const id = card.dataset.id;
        if (!id) return;
        card.removeEventListener('mouseenter', onCardEnter);
        card.addEventListener('mouseenter', onCardEnter);
      });
    }, 50);
  }

  function onCardEnter(e) {
    const card = e.currentTarget;
    const id = card.dataset.id;
    if (!id) return;
    let btn = card.querySelector('.compare-add-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'compare-add-btn';
      btn.textContent = '📊';
      btn.style.cssText = 'position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:6px;background:rgba(168,85,247,0.2);border:1px solid rgba(168,85,247,0.3);color:var(--purple);cursor:pointer;font-size:10px;opacity:0;transition:opacity 0.2s;display:flex;align-items:center;justify-content:center;z-index:10;';
      btn.onclick = (e) => { e.stopPropagation(); addToCompare(parseInt(id)); };
      card.appendChild(btn);
    }
    btn.style.opacity = '1';
  }

  // ================================================================
  // PRODUCT DETAIL
  // ================================================================
  function openProductDetail(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const win = document.getElementById('win-detail');
    const content = document.getElementById('detail-content');
    if (!win || !content) return;
    const isSoldOut = p.status === 'soldout' || p.stock === 0;
    const imgHtml = p.image ? `<img src="${p.image}" onerror="this.style.display='none'">` : `<span style="font-size:4rem">${p.icon || '📦'}</span>`;
    const sizePills = (p.sizes || ['M','L']).map(s => `<div class="size-pill" onclick="window.MorpheusApp.selectSize(this)">${s}</div>`).join('');

    content.innerHTML = `
      <div class="detail-img">${imgHtml}</div>
      ${p.tag ? `<span class="product-tag" style="position:relative;top:auto;left:auto;display:inline-block;margin-bottom:8px;">${p.tag}</span>` : ''}
      <div class="detail-name">${p.name}</div>
      <div class="detail-collection">${p.collection.toUpperCase()} COLLECTION</div>
      <div class="detail-desc">${p.desc}</div>
      <div class="detail-stock-info">${
        isSoldOut ? `<span style="color:var(--red);font-weight:700;">● ${t('outOfStock')}</span>`
        : p.stock <= 5 ? `<span style="color:var(--orange);">⚠ ${t('lowStock')}: ${p.stock} ${t('inStock')}</span>`
        : `<span style="color:var(--green);">● ${p.stock} ${t('inStock')}</span>`
      }</div>
      <div class="detail-price-row">
        <span class="detail-price">${formatPrice(p.price)}</span>
        ${p.oldPrice ? `<span class="detail-old-price">${formatPrice(p.oldPrice)}</span>` : ''}
      </div>
      <div class="detail-sizes">
        <div class="detail-sizes-label">${currentLang === 'ar' ? 'المقاسات المتاحة' : 'Available Sizes'}</div>
        <div class="size-pills" id="detail-sizes">${sizePills}</div>
      </div>
      <div class="detail-actions">
        <button class="detail-btn secondary" onclick="window.MorpheusApp.addToOutfit(${p.id})">+ ${t('addToOutfit').replace('Add to ','').toUpperCase()}</button>
        <button class="detail-btn primary" onclick="window.MorpheusApp.addToCartFromDetail(${p.id})"${isSoldOut ? ' disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>${isSoldOut ? t('soldOut') : t('addToCart')}</button>
      </div>`;
    win.style.display = 'block';
    bringToFront(win);
    const firstPill = win.querySelector('.size-pill');
    if (firstPill) firstPill.classList.add('selected');
  }

  function selectSize(el) {
    document.querySelectorAll('#detail-sizes .size-pill').forEach(p => p.classList.remove('selected'));
    if (el) el.classList.add('selected');
  }

  function addToCartFromDetail(id) {
    const p = products.find(x => x.id === id);
    if (!p || p.stock === 0) return;
    const selectedSize = document.querySelector('#detail-sizes .size-pill.selected');
    const size = selectedSize ? selectedSize.textContent : (p.sizes && p.sizes[0]) || 'M';
    const idx = products.findIndex(x => x.id === id);
    if (idx !== -1 && products[idx].stock > 0) {
      products[idx].stock--;
      if (products[idx].stock === 0) products[idx].status = 'soldout';
      saveProducts(products);
    }
    const cartId = Date.now();
    cart.push({...p, size, cartId});
    saveCart(cart);
    renderCart();
    showUndoToast(t('addToCart') + ' ✓', `${p.name} (${size})`, () => {
      const ci = cart.findIndex(c => c.cartId === cartId);
      if (ci !== -1) {
        const removed = cart.splice(ci, 1)[0];
        const pi = products.findIndex(x => x.id === removed.id);
        if (pi !== -1) { products[pi].stock++; if (products[pi].status === 'soldout') products[pi].status = 'active'; saveProducts(products); }
        saveCart(cart);
        renderCart();
      }
    });
    document.getElementById('win-detail').style.display = 'none';
  }

  // ================================================================
  // CART
  // ================================================================
  function addToCart(id) {
    const p = products.find(x => x.id === id);
    if (!p || p.stock === 0 || p.status === 'soldout') { showToast('⚠', t('outOfStock')); return; }
    const size = p.sizes && p.sizes.length > 0 ? p.sizes[0] : 'M';
    const idx = products.findIndex(x => x.id === id);
    if (idx !== -1 && products[idx].stock > 0) {
      products[idx].stock--;
      if (products[idx].stock === 0) products[idx].status = 'soldout';
      saveProducts(products);
    }
    const cartId = Date.now();
    cart.push({...p, size, cartId});
    saveCart(cart);
    renderCart();
    showUndoToast(t('addToCart') + ' ✓', `${p.name} (${size})`, () => {
      const cartIdx = cart.findIndex(c => c.cartId === cart[cart.length-1]?.cartId);
      if (cartIdx !== -1) {
        const removed = cart.splice(cartIdx, 1)[0];
        const pidx = products.findIndex(x => x.id === removed.id);
        if (pidx !== -1) { products[pidx].stock++; if (products[pidx].status === 'soldout') products[pidx].status = 'active'; saveProducts(products); }
        saveCart(cart);
        renderCart();
      }
    });
  }

  function renderCart() {
    const content = document.getElementById('cart-content');
    const badge = document.getElementById('cart-badge');
    if (badge) badge.textContent = cart.length;
    if (!content) return;
    if (cart.length === 0) {
      content.innerHTML = `<div class="cart-empty">${currentLang === 'ar' ? 'السلة فارغة' : currentLang === 'fr' ? 'Panier vide' : 'Cart is empty'}</div>`;
      return;
    }
    const subtotal = cart.reduce((s, i) => s + i.price, 0);
    const shipping = 800;
    const total = subtotal + shipping;
    content.innerHTML = `
      <div class="widget-label">${currentLang === 'ar' ? 'مختاراتك' : 'Your selection'} (${cart.length})</div>
      <div class="cart-items">
        ${cart.map((item, i) => {
          const imgHtml = item.image ? `<img src="${item.image}" onerror="this.style.display='none'">` : item.icon || '📦';
          return `<div class="cart-item">
            <div class="cart-item-img">${imgHtml}</div>
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-meta">${currentLang === 'ar' ? 'المقاس' : 'SIZE'}: ${item.size}</div>
            </div>
            <div class="cart-item-price">${item.price.toLocaleString()} DZD</div>
            <div class="cart-item-remove" onclick="window.MorpheusApp.removeFromCart(${i})">×</div>
          </div>`;
        }).join('')}
      </div>
      <div class="cart-summary">
        <div class="cart-row"><span>${currentLang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span><span>${subtotal.toLocaleString()} DZD</span></div>
        <div class="cart-row"><span>${currentLang === 'ar' ? 'الشحن' : 'Shipping'}</span><span>${shipping} DZD</span></div>
        <div class="cart-row total"><span>${t('total')}</span><span>${total.toLocaleString()} DZD</span></div>
      </div>
      <button class="cart-checkout" onclick="window.MorpheusApp.openCheckout()">${t('checkout')} →</button>`;
    updateWelcomeStats();
    renderStickyCartBar();
  }

  function removeFromCart(i) {
    const item = cart[i];
    if (!item) return;
    const pidx = products.findIndex(x => x.id === item.id);
    if (pidx !== -1) {
      products[pidx].stock++;
      if (products[pidx].status === 'soldout') products[pidx].status = 'active';
      saveProducts(products);
    }
    cart.splice(i, 1);
    saveCart(cart);
    renderCart();
    renderStickyCartBar();
  }

  // ================================================================
  // CHECKOUT
  // ================================================================
  function openCheckout() {
    if (cart.length === 0) { showToast('⚠', currentLang === 'ar' ? 'السلة فارغة' : 'Cart is empty'); return; }
    const win = document.getElementById('win-checkout');
    if (!win) return;
    setCheckoutStep(1);
    win.style.display = 'block';
    bringToFront(win);
    loadCheckoutDraft();
  }

  function setCheckoutStep(n) {
    [1,2,3].forEach(i => {
      const stepEl = document.getElementById(`checkout-step-${i}`);
      if (stepEl) stepEl.classList.toggle('active', i === n);
      const dot = document.getElementById(`step-dot-${i}`);
      if (dot) {
        dot.classList.remove('active','done');
        if (i < n) dot.classList.add('done');
        else if (i === n) dot.classList.add('active');
      }
    });
  }

  function checkoutStep2() {
    const fname = document.getElementById('co-fname')?.value?.trim();
    const phone = document.getElementById('co-phone')?.value?.trim();
    const wilaya = document.getElementById('co-wilaya')?.value;
    const address = document.getElementById('co-address')?.value?.trim();
    if (!fname || !phone || !wilaya || !address) { showToast('⚠', 'Please fill all required fields'); return; }
    setCheckoutStep(2);
    const subtotal = cart.reduce((s, i) => s + i.price, 0);
    const summaryEl = document.getElementById('co-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;opacity:0.6;">${currentLang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</div>
        ${cart.map(i => `<div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span>${i.name} (${i.size})</span><span>${i.price.toLocaleString()} DZD</span></div>`).join('')}
        <div style="display:flex;justify-content:space-between;margin-top:8px;font-weight:700;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;">
          <span>${t('total')}</span><span>${(subtotal+800).toLocaleString()} DZD</span>
        </div>`;
    }
  }

  function checkoutBack() { setCheckoutStep(1); }

  function selectPayment(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    const selectedEl = document.getElementById('pm-' + method);
    if (selectedEl) selectedEl.classList.add('selected');
    const cardFields = document.getElementById('card-fields');
    const baridimobFields = document.getElementById('baridimob-fields');
    if (cardFields) cardFields.style.display = method === 'card' ? 'block' : 'none';
    if (baridimobFields) baridimobFields.style.display = method === 'baridimob' ? 'block' : 'none';
  }

  async function placeOrder() {
    const fname = document.getElementById('co-fname')?.value?.trim();
    const lname = document.getElementById('co-lname')?.value?.trim();
    const phone = document.getElementById('co-phone')?.value?.trim();
    const wilaya = document.getElementById('co-wilaya')?.value;
    const address = document.getElementById('co-address')?.value?.trim();
    if (!fname || !phone || !wilaya) { showToast('⚠', 'Missing required fields'); return; }

    const subtotal = cart.reduce((s, i) => s + i.price, 0);
    const shipping = subtotal >= 25000 ? 0 : 600;
    const orderId = 'FLY' + Date.now().toString().slice(-6);
    const paymentMessages = {
      cod: currentLang === 'ar' ? 'سيتم الدفع عند الاستلام.' : currentLang === 'fr' ? 'Paiement à la livraison.' : 'Payment on delivery. Our team will contact you within 24h.',
      ccp: 'Please transfer to CCP: 0097 4999 9999 9999 99 — Reference: ' + orderId,
      baridimob: 'Transfer via BaridiMob to: 0097 4999 9999 9999 99 — Reference: ' + orderId,
    };
    const order = {
      id: orderId,
      customer: { name: fname + ' ' + lname, phone, email: document.getElementById('co-email')?.value, wilaya, address },
      items: [...cart],
      subtotal,
      shipping,
      total: subtotal + shipping,
      payment: selectedPaymentMethod,
      date: new Date().toISOString(),
      status: 'pending'
    };

    // Try backend first
    try {
      const res = await fetch(API_BASE + '/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session': localStorage.getItem('flyra_session') || 'web' },
        body: JSON.stringify({
          first_name: fname, last_name: lname, phone, wilaya, address,
          items: cart.map(i => ({id: i.id, name: i.name, price: i.price, size: i.size, qty: i.quantity})),
          subtotal, payment_method: selectedPaymentMethod
        }),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        order.tracking = data.tracking;
        order.backend_id = data.id;
      }
    } catch(e) { /* offline — use local */ }

    orders.unshift(order);
    saveOrders(orders);
    cart = [];
    saveCart(cart);
    renderCart();
    updateWelcomeStats();
    const orderNumEl = document.getElementById('co-order-num');
    if (orderNumEl) orderNumEl.textContent = 'Order #' + (order.tracking || orderId);
    const paymentInfoEl = document.getElementById('co-payment-info');
    if (paymentInfoEl) paymentInfoEl.textContent = paymentMessages[selectedPaymentMethod] || paymentMessages['cod'];
    setCheckoutStep(3);
    showToast('✅ ' + t('orderConfirmed'), '#' + (order.tracking || orderId));
    addNotification('ORDER PLACED', `#${order.tracking || orderId} — ${selectedPaymentMethod.toUpperCase()} — ${(subtotal+shipping).toLocaleString()} DZD`);
    renderAdminOrders();
    renderAdminDashboard();
    clearCheckoutDraft();
  }

  function closeCheckout() {
    const win = document.getElementById('win-checkout');
    if (win) win.style.display = 'none';
  }

  // ================================================================
  // CHECKOUT DRAFT
  // ================================================================
  const DRAFT_KEY = 'flyra_checkout_draft';
  function saveCheckoutDraft() {
    const draft = {
      fname: document.getElementById('co-fname')?.value || '',
      lname: document.getElementById('co-lname')?.value || '',
      phone: document.getElementById('co-phone')?.value || '',
      email: document.getElementById('co-email')?.value || '',
      wilaya: document.getElementById('co-wilaya')?.value || '',
      address: document.getElementById('co-address')?.value || '',
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }
  function loadCheckoutDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
      if (draft.fname && document.getElementById('co-fname')) document.getElementById('co-fname').value = draft.fname;
      if (draft.lname && document.getElementById('co-lname')) document.getElementById('co-lname').value = draft.lname;
      if (draft.phone && document.getElementById('co-phone')) document.getElementById('co-phone').value = draft.phone;
      if (draft.email && document.getElementById('co-email')) document.getElementById('co-email').value = draft.email;
      if (draft.wilaya && document.getElementById('co-wilaya')) document.getElementById('co-wilaya').value = draft.wilaya;
      if (draft.address && document.getElementById('co-address')) document.getElementById('co-address').value = draft.address;
    } catch(e) {}
  }
  function clearCheckoutDraft() { localStorage.removeItem(DRAFT_KEY); }

  // ================================================================
  // OUTFIT BUILDER
  // ================================================================
  function addToOutfit(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const slots = ['top','bottom','shoes','accessory'];
    for (let s of slots) {
      if (!outfit[s]) { outfit[s] = p; renderOutfit(); showToast(t('addToOutfit'), `${p.name} → ${s.toUpperCase()}`); return; }
    }
    showToast('Outfit Full', 'Remove an item first');
  }

  function renderOutfit() {
    document.querySelectorAll('.outfit-slot').forEach(slot => {
      const key = slot.dataset.slot;
      const item = outfit[key];
      const nameEl = slot.querySelector('.outfit-slot-name');
      const iconEl = slot.querySelector('.outfit-slot-icon');
      if (item) { if (nameEl) nameEl.textContent = item.name; if (iconEl) iconEl.textContent = item.icon || '📦'; slot.classList.add('filled'); }
      else { if (nameEl) nameEl.textContent = t('selectItem'); slot.classList.remove('filled'); }
    });
    const total = Object.values(outfit).filter(Boolean).reduce((s, p) => s + p.price, 0);
    const totalEl = document.getElementById('outfit-total');
    if (totalEl) totalEl.textContent = total.toLocaleString() + ' DZD';
  }

  function clearOutfit() {
    outfit = {top:null, bottom:null, shoes:null, accessory:null};
    renderOutfit();
    showToast(t('clear'), 'All slots reset');
  }

  function addOutfitToCart() {
    const items = Object.values(outfit).filter(Boolean);
    if (items.length === 0) { showToast('Empty', t('selectItem')); return; }
    items.forEach(p => {
      if (p.stock > 0) { cart.push({...p, size: p.sizes && p.sizes[0] || 'M', cartId: Date.now() + Math.random()}); }
    });
    saveCart(cart);
    renderCart();
    showToast(t('addToCart') + ' 🎉', `${items.length} items added`);
  }

  // ================================================================
  // WELCOME STATS
  // ================================================================
  function updateWelcomeStats() {
    const statProducts = document.getElementById('stat-products');
    if (statProducts) statProducts.textContent = products.filter(p => p.status !== 'drop').length;
    const cartTotal = cart.reduce((s, i) => s + i.price, 0);
    const statCart = document.getElementById('stat-cart');
    if (statCart) statCart.textContent = cartTotal > 0 ? cartTotal.toLocaleString() + ' DZD' : '0 DZD';
    const statOrders = document.getElementById('stat-orders');
    if (statOrders) statOrders.textContent = orders.length;
  }

  // ================================================================
  // DROPS
  // ================================================================
  function renderDrops() {
    const dropProducts = products.filter(p => p.status === 'drop' && p.dropDate);
    const content = document.getElementById('drops-content');
    if (!content) return;
    if (dropProducts.length === 0) {
      content.innerHTML = `<p style="font-size:11px;opacity:0.3;text-align:center;padding:30px;">${currentLang === 'ar' ? 'لا توجد إطلاقات قادمة' : 'No upcoming drops'}</p>`;
      return;
    }
    content.innerHTML = dropProducts.map(p => `
      <div class="drop-item">
        <div style="font-size:1.5rem;margin-bottom:8px;">${p.icon || '⚡'}</div>
        <div class="drop-item-name">${p.name}</div>
        <div class="drop-item-date">${new Date(p.dropDate).toLocaleString()}</div>
        <div class="drop-timer-big" id="timer-${p.id}">--:--:--</div>
        <button class="drop-notify-btn" id="notify-btn-${p.id}" onclick="window.MorpheusApp.notifyDrop(${p.id}, this)">${t('notify')}</button>
      </div>`).join('');
  }

  function updateDropTimers() {
    const dropProducts = products.filter(p => p.status === 'drop' && p.dropDate);
    dropProducts.forEach(p => {
      const el = document.getElementById('timer-' + p.id);
      if (!el) return;
      const diff = new Date(p.dropDate) - new Date();
      if (diff <= 0) {
        el.textContent = 'LIVE NOW!';
        el.style.color = 'var(--green)';
        const idx = products.findIndex(x => x.id === p.id);
        if (idx !== -1 && products[idx].status === 'drop') {
          products[idx].status = 'active';
          products[idx].tag = 'NEW';
          saveProducts(products);
          renderProducts(currentCollection);
          addNotification('DROP LAUNCHED 🔥', p.name + ' is now available!');
        }
      } else {
        const d = Math.floor(diff/86400000);
        const h = Math.floor((diff%86400000)/3600000);
        const m = Math.floor((diff%3600000)/60000);
        const s = Math.floor((diff%60000)/1000);
        el.textContent = d > 0 ? `${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      }
    });
  }

  function notifyDrop(productId, btn) {
    if (notifiedDrops.includes(productId)) return;
    notifiedDrops.push(productId);
    saveNotifiedDrops();
    btn.textContent = '✓ ' + (currentLang === 'ar' ? 'سيتم إشعارك' : 'Notified!');
    btn.classList.add('notified');
    showToast('Notify Me ✓', currentLang === 'ar' ? 'سنخبرك عند الإطلاق!' : 'We\'ll alert you when it drops!');
  }

  function scheduleDrop() {
    const productName = document.getElementById('drop-product')?.value?.trim();
    const dropDate = document.getElementById('drop-date-input')?.value;
    if (!productName || !dropDate) { showToast('⚠', 'Fill product name and date'); return; }
    const p = products.find(x => x.name.toLowerCase().includes(productName.toLowerCase()));
    if (!p) { showToast('⚠', 'Product not found: ' + productName); return; }
    const idx = products.findIndex(x => x.id === p.id);
    products[idx].status = 'drop';
    products[idx].dropDate = new Date(dropDate).toISOString();
    products[idx].tag = 'DROP';
    saveProducts(products);
    renderDrops();
    renderProducts(currentCollection);
    showToast('Drop Scheduled ⚡', p.name + ' → ' + new Date(dropDate).toLocaleString());
  }

  function cancelDrop(id) {
    const idx = products.findIndex(x => x.id === id);
    if (idx !== -1) { products[idx].status = 'active'; products[idx].dropDate = null; products[idx].tag = null; saveProducts(products); }
    renderAdminDrops();
    renderDrops();
    showToast('Drop Cancelled', '');
  }

  function renderAdminDrops() {
    const el = document.getElementById('admin-drops-list');
    if (!el) return;
    const dropProducts = products.filter(p => p.status === 'drop');
    if (dropProducts.length === 0) { el.innerHTML = '<p style="font-size:11px;opacity:0.3;text-align:center;padding:20px;">No upcoming drops.</p>'; return; }
    el.innerHTML = dropProducts.map(p => `
      <div class="order-row">
        <div class="order-id">${p.icon} ${p.name}</div>
        <div class="order-meta">Drop: ${new Date(p.dropDate).toLocaleString()}</div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button class="btn-del" onclick="window.MorpheusApp.cancelDrop(${p.id})">CANCEL DROP</button>
        </div>
      </div>`).join('');
  }

  // ================================================================
  // NOTIFICATIONS
  // ================================================================
  function addNotification(title, text) {
    const content = document.getElementById('notifications-content');
    if (!content) return;
    const list = content.querySelector('.notif-list') || content;
    const item = document.createElement('div');
    item.className = 'notif-item unread';
    item.innerHTML = `<div class="notif-title">${title}</div><div class="notif-text">${text}</div><div class="notif-time">Just now</div>`;
    list.prepend(item);
  }

  // ================================================================
  // AI STYLIST
  // ================================================================
  function getApiKey() {
    return localStorage.getItem(API_KEY_STORE) || document.getElementById('api-key-input')?.value?.trim() || '';
  }

  function saveServerUrl() {
    const url = document.getElementById('server-url-input')?.value?.trim();
    if (!url) {
      localStorage.removeItem('flyra_ai_server');
      showToast('Server Cleared', 'Using direct API key');
      return;
    }
    localStorage.setItem('flyra_ai_server', url);
    showToast('✓ Server Connected', url);
    updateAiProviderDisplay();
  }

  function updateAiProviderDisplay() {
    const serverUrl = localStorage.getItem('flyra_ai_server');
    const apiKey = getApiKey();
    const display = document.getElementById('ai-provider-display');
    const badge = document.getElementById('ai-mode-badge');
    if (serverUrl) {
      if (display) display.textContent = 'Server: ' + serverUrl.split('//')[1] || serverUrl;
      if (display) display.style.color = 'var(--green)';
      if (badge) { badge.textContent = '⟨ SERVER MODE'; badge.className = 'ai-status real'; }
    } else if (apiKey) {
      if (display) { display.textContent = 'Direct: Anthropic API'; display.style.color = 'var(--cyan)'; }
    } else {
      if (display) { display.textContent = 'Demo / Fallback'; display.style.color = ''; }
    }
    const urlInput = document.getElementById('server-url-input');
    if (urlInput && serverUrl) urlInput.value = serverUrl;
  }

  function saveApiKey() {
    const key = document.getElementById('api-key-input')?.value?.trim();
    if (!key) { showToast('⚠', 'Enter an API key'); return; }
    localStorage.setItem(API_KEY_STORE, key);
    const badge = document.getElementById('ai-mode-badge');
    if (badge) { badge.textContent = '✓ LIVE AI MODE'; badge.className = 'ai-status real'; }
    showToast('API Key Saved ✓', 'AI Stylist now uses real Claude AI');
    updateAiProviderDisplay();
  }

  async function callClaudeAPI(userMessage) {
    const productList = products.filter(p => p.status !== 'drop').slice(0, 12).map(p =>
      `- ${p.name} (${p.collection}, ${p.price.toLocaleString()} DZD, sizes: ${(p.sizes||[]).join('/')}, stock: ${p.stock}, status: ${p.status})`
    ).join('\n');

    const SERVER_URL = localStorage.getItem('flyra_ai_server') || '';
    if (SERVER_URL) {
      try {
        const res = await fetch(SERVER_URL + '/api/stylist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, lang: currentLang, history: aiConversationHistory.slice(-10), products: productList }),
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.reply) {
            aiConversationHistory.push({ role: 'user', content: userMessage });
            aiConversationHistory.push({ role: 'assistant', content: data.reply });
            return data.reply;
          }
        }
      } catch(e) {}
    }

    const apiKey = getApiKey();
    if (!apiKey || apiKey === 'server') return null;

    const systemPrompt = `You are an expert AI fashion stylist for FLYRA, the iconic Algerian fashion brand selling Old Money, Streetwear, and Heritage styles across all 58 wilayas.
You help customers choose outfits, recommend products, suggest sizes, and answer questions.
Be stylish, concise, and knowledgeable. Respond in the same language as the user (Arabic, French, or English).
Keep responses under 120 words and highly practical.

Current available products:
${productList}

When recommending products, use their exact names from the list above.
For sizing, use standard fit advice. Always consider Algerian context and local fashion trends.`;

    aiConversationHistory.push({ role: 'user', content: userMessage });

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: systemPrompt,
          messages: aiConversationHistory.slice(-6)
        })
      });
      if (!response.ok) return null;
      const data = await response.json();
      const reply = data.content[0].text;
      aiConversationHistory.push({ role: 'assistant', content: reply });
      return reply;
    } catch(e) { return null; }
  }

  async function autoConnectServer() {
    try {
      const res = await fetch('http://localhost:5001/api/config', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        localStorage.setItem('flyra_ai_server', 'http://localhost:5001');
        const badge = document.getElementById('ai-mode-badge');
        if (badge) { badge.textContent = '⟨ SERVER MODE'; badge.className = 'ai-status real'; }
        updateAiProviderDisplay();
      }
    } catch(e) {}
  }

  const stylistFallbacks = [
    "Based on your profile, I recommend the PHANTOM_SET: Phantom Jacket + Void Runners. It balances high-tech aesthetics with everyday comfort.",
    "Looking at your style, the NEURAL_LINE collection would be perfect — adaptive fabric that responds to your body temperature.",
    "For a bold look, try the ORBITAL_DROP collection. The NEBULA HOODIE pairs beautifully with GLITCH TROUSERS.",
    "The VOID RUNNERS are our top seller in Algeria. Perfect for both street style and evening looks.",
    "For your size recommendation: measure your chest and compare to our Size Guide. When in doubt, size up for a relaxed fit.",
  ];

  function addStylistMessage(text, isUser) {
    const messages = document.getElementById('stylist-messages');
    if (!messages) return;
    const div = document.createElement('div');
    div.className = 'msg ' + (isUser ? 'msg-user' : 'msg-ai');
    div.innerHTML = isUser
      ? `<div class="msg-text">${escapeHtml(text)}</div>`
      : `<div class="msg-text"><span class="stylist-label">AI_STYLIST v3</span>${text}</div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendToStylist() {
    const input = document.getElementById('stylist-input');
    const text = input?.value?.trim();
    if (!text) return;
    addStylistMessage(text, true);
    input.value = '';

    const messages = document.getElementById('stylist-messages');
    const typing = document.createElement('div');
    typing.className = 'msg-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    if (messages) { messages.appendChild(typing); messages.scrollTop = 99999; }

    const apiKey = getApiKey();
    let reply;
    if (apiKey || localStorage.getItem('flyra_ai_server')) {
      const badge = document.getElementById('ai-mode-badge');
      if (badge) badge.textContent = '⟳ THINKING...';
      reply = await callClaudeAPI(text);
      if (badge) { badge.textContent = '✓ LIVE AI MODE'; badge.className = 'ai-status real'; }
    }

    setTimeout(() => {
      if (typing.parentNode) typing.remove();
      if (!reply) reply = stylistFallbacks[Math.floor(Math.random() * stylistFallbacks.length)];
      addStylistMessage(reply, false);
    }, apiKey ? 0 : 1000 + Math.random() * 800);
  }

  // ================================================================
  // TOAST
  // ================================================================
  let toastTimeout;
  function showToast(title, text) {
    const titleEl = document.getElementById('toast-title');
    const textEl = document.getElementById('toast-text');
    const toast = document.getElementById('toast');
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    if (toast) { toast.classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500); }
  }

  function showUndoToast(title, text, onUndo) {
    undoCallback = onUndo;
    const toast = document.getElementById('toast');
    const titleEl = document.getElementById('toast-title');
    const textEl = document.getElementById('toast-text');
    if (titleEl) titleEl.textContent = title || 'Undo?';
    if (textEl) textEl.innerHTML = (text || '') + `<button class="toast-undo-btn" onclick="window.MorpheusApp.executeUndo()">↩ UNDO</button>`;
    if (toast) { toast.classList.add('show', 'undo'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => { toast.classList.remove('show','undo'); undoCallback = null; }, 5000); }
  }

  function executeUndo() {
    if (undoCallback) { undoCallback(); undoCallback = null; }
    const toast = document.getElementById('toast');
    if (toast) toast.classList.remove('show','undo');
    clearTimeout(toastTimeout);
    showToast('Undone ✓', '');
  }

  // ================================================================
  // ADMIN
  // ================================================================
  function openAdminLogin() {
    if (isAdminLoggedIn) { openAdminPanel(); return; }
    const win = document.getElementById('win-login');
    if (win) { win.style.display = 'block'; bringToFront(win); }
    const pwEl = document.getElementById('admin-password');
    if (pwEl) pwEl.value = '';
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.style.display = 'none';
  }

  function attemptLogin() {
    const pw = document.getElementById('admin-password')?.value;
    if (pw === (localStorage.getItem(ADMIN_PASSWORD_KEY) || 'admin123')) {
      isAdminLoggedIn = true;
      const win = document.getElementById('win-login');
      if (win) win.style.display = 'none';
      showToast('Admin ✓', 'Welcome to Admin Panel');
      openAdminPanel();
    } else {
      const errEl = document.getElementById('login-error');
      if (errEl) errEl.style.display = 'block';
      const pwEl = document.getElementById('admin-password');
      if (pwEl) pwEl.value = '';
    }
  }

  function openAdminPanel() {
    const win = document.getElementById('win-admin');
    if (win) { win.style.display = 'block'; bringToFront(win); }
    renderAdminDashboard();
    renderAdminProducts();
    renderAdminOrders();
    renderAdminDrops();
  }

  function switchAdminTab(tab, el) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');
    const panel = document.getElementById('panel-' + tab);
    if (panel) panel.classList.add('active');
    if (tab === 'add' && !editingProductId) cancelEdit();
  }

  function renderAdminDashboard() {
    const productsEl = document.getElementById('adm-products');
    const ordersEl = document.getElementById('adm-orders');
    const revenueEl = document.getElementById('adm-revenue');
    if (productsEl) productsEl.textContent = products.length;
    if (ordersEl) ordersEl.textContent = orders.length;
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    if (revenueEl) revenueEl.textContent = revenue.toLocaleString() + ' DZD';
    const recentEl = document.getElementById('admin-recent-orders');
    if (recentEl) {
      if (orders.length === 0) { recentEl.innerHTML = '<p style="font-size:11px;opacity:0.3;text-align:center;padding:20px;">No orders yet</p>'; return; }
      recentEl.innerHTML = orders.slice(0,3).map(o => `
        <div class="order-row">
          <div class="order-id">#${o.id} <span class="order-status status-${o.status}">${o.status.toUpperCase()}</span></div>
          <div class="order-meta">${o.customer?.name || ''} — ${o.customer?.phone || ''} — ${o.customer?.wilaya || ''}</div>
          <div class="order-items">${(o.items||[]).map(i=>i.name).join(', ')}</div>
          <div class="order-total">${(o.total||0).toLocaleString()} DZD — <span style="opacity:0.5;">${(o.payment||'').toUpperCase()}</span></div>
        </div>`).join('');
    }
    renderAnalyticsChart();
    renderRevenueChart();
    renderCustomerMetrics();
  }

  function renderAdminProducts() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;
    if (products.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;opacity:0.3;">No products. Use "+ ADD" tab.</td></tr>'; return; }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td>${p.image ? `<img class="prod-thumb" src="${p.image}" onerror="this.style.display='none'">` : `<span class="prod-icon">${p.icon || '📦'}</span>`}</td>
        <td><strong>${p.name}</strong></td>
        <td>${p.price.toLocaleString()} DZD</td>
        <td style="${p.stock === 0 ? 'color:var(--red)' : p.stock <= 5 ? 'color:var(--orange)' : 'color:var(--green)'}">${p.stock}</td>
        <td><span class="order-status ${p.status === 'soldout' ? 'status-confirmed' : p.status === 'drop' ? 'status-pending' : 'status-delivered'}" style="${p.status === 'soldout' ? 'background:rgba(255,59,48,0.15);color:var(--red)' : ''}">${p.status.toUpperCase()}</span></td>
        <td>
          <div class="admin-actions">
            <button class="btn-edit" onclick="window.MorpheusApp.editProduct(${p.id})">EDIT</button>
            <button class="btn-del" onclick="window.MorpheusApp.deleteProduct(${p.id})">DEL</button>
          </div>
        </td>
      </tr>`).join('');
  }

  function renderAdminOrders() {
    const el = document.getElementById('admin-orders-list');
    if (!el) return;
    if (orders.length === 0) { el.innerHTML = '<p style="font-size:11px;opacity:0.3;text-align:center;padding:20px;">No orders yet.</p>'; return; }
    el.innerHTML = orders.map(o => `
      <div class="order-row">
        <div class="order-id">#${o.id} <span class="order-status status-${o.status}">${o.status.toUpperCase()}</span></div>
        <div class="order-meta">${o.customer?.name || ''} | ${o.customer?.phone || ''} | ${o.customer?.wilaya || ''} | ${new Date(o.date).toLocaleString()}</div>
        <div class="order-items">${(o.items||[]).map(i=>`${i.name} (${i.size})`).join(', ')}</div>
        <div class="order-total">${(o.total||0).toLocaleString()} DZD — ${(o.payment||'').toUpperCase()}</div>
      </div>`).join('');
  }

  function cancelEdit() {
    editingProductId = null;
    ['f-name','f-price','f-old-price','f-tag','f-desc','f-icon','f-image','f-stock','f-drop-date'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const collEl = document.getElementById('f-collection');
    if (collEl) collEl.value = 'spring';
    const statusEl = document.getElementById('f-status');
    if (statusEl) statusEl.value = 'active';
    document.querySelectorAll('.sz-cb').forEach(cb => { cb.checked = cb.value === 'M' || cb.value === 'L'; });
    const modeLabel = document.getElementById('form-mode-label');
    if (modeLabel) modeLabel.textContent = 'New Product';
    const preview = document.getElementById('image-preview');
    if (preview) preview.innerHTML = '';
    uploadedImageBase64 = '';
  }

  function editProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    editingProductId = id;
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(pan => pan.classList.remove('active'));
    const tabs = document.querySelectorAll('.admin-tab');
    if (tabs[2]) tabs[2].classList.add('active');
    const addPanel = document.getElementById('panel-add');
    if (addPanel) addPanel.classList.add('active');
    const modeLabel = document.getElementById('form-mode-label');
    if (modeLabel) modeLabel.textContent = 'Edit: ' + p.name;
    const idEl = document.getElementById('edit-product-id');
    if (idEl) idEl.value = p.id;
    const nameEl = document.getElementById('f-name');
    if (nameEl) nameEl.value = p.name;
    const priceEl = document.getElementById('f-price');
    if (priceEl) priceEl.value = p.price;
    const oldPriceEl = document.getElementById('f-old-price');
    if (oldPriceEl) oldPriceEl.value = p.oldPrice || '';
    const tagEl = document.getElementById('f-tag');
    if (tagEl) tagEl.value = p.tag || '';
    const descEl = document.getElementById('f-desc');
    if (descEl) descEl.value = p.desc;
    const iconEl = document.getElementById('f-icon');
    if (iconEl) iconEl.value = p.icon || '';
    const imageEl = document.getElementById('f-image');
    if (imageEl) imageEl.value = p.image || '';
    const stockEl = document.getElementById('f-stock');
    if (stockEl) stockEl.value = p.stock || 0;
    const collEl = document.getElementById('f-collection');
    if (collEl) collEl.value = p.collection;
    const statusEl = document.getElementById('f-status');
    if (statusEl) statusEl.value = p.status || 'active';
    const dropDateEl = document.getElementById('f-drop-date');
    if (dropDateEl && p.dropDate) dropDateEl.value = new Date(p.dropDate).toISOString().slice(0,16);
    document.querySelectorAll('.sz-cb').forEach(cb => { cb.checked = (p.sizes || []).includes(cb.value); });
  }

  function saveProduct() {
    const name = document.getElementById('f-name')?.value?.trim();
    const price = parseFloat(document.getElementById('f-price')?.value);
    const desc = document.getElementById('f-desc')?.value?.trim();
    const stock = parseInt(document.getElementById('f-stock')?.value) || 0;
    if (!name || !price || !desc) { showToast('⚠', 'Name, price, and description are required'); return; }
    const sizes = Array.from(document.querySelectorAll('.sz-cb:checked')).map(cb => cb.value);
    const oldPriceVal = parseFloat(document.getElementById('f-old-price')?.value);
    const dropDateVal = document.getElementById('f-drop-date')?.value;
    const status = document.getElementById('f-status')?.value;
    const imageUrl = uploadedImageBase64 || document.getElementById('f-image')?.value?.trim() || '';

    const productData = {
      name: name.toUpperCase(), price, oldPrice: isNaN(oldPriceVal) ? null : oldPriceVal,
      tag: document.getElementById('f-tag')?.value?.trim().toUpperCase() || null,
      desc, icon: document.getElementById('f-icon')?.value?.trim() || '📦',
      image: imageUrl, collection: document.getElementById('f-collection')?.value,
      sizes, stock, status, dropDate: dropDateVal ? new Date(dropDateVal).toISOString() : null
    };

    if (editingProductId) {
      const idx = products.findIndex(p => p.id === editingProductId);
      if (idx !== -1) products[idx] = {...products[idx], ...productData};
      showToast('Updated ✓', productData.name);
    } else {
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      products.push({id: newId, ...productData});
      showToast('Added ✓', productData.name);
    }
    saveProducts(products);
    renderProducts(currentCollection);
    updateCollectionCounts();
    updateWelcomeStats();
    renderAdminProducts();
    renderAdminDashboard();
    renderDrops();
    cancelEdit();
    uploadedImageBase64 = '';
  }

  function deleteProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p || !confirm(`Delete "${p.name}"?`)) return;
    products = products.filter(x => x.id !== id);
    saveProducts(products);
    renderProducts(currentCollection);
    updateCollectionCounts();
    updateWelcomeStats();
    renderAdminProducts();
    renderAdminDashboard();
    showToast('Deleted', p.name);
  }

  function changePassword() {
    const oldPw = document.getElementById('s-old-pw')?.value;
    const newPw = document.getElementById('s-new-pw')?.value;
    if (oldPw !== (localStorage.getItem(ADMIN_PASSWORD_KEY) || 'admin123')) { showToast('⚠', 'Wrong current password'); return; }
    if (!newPw || newPw.length < 4) { showToast('⚠', 'Min 4 characters required'); return; }
    localStorage.setItem(ADMIN_PASSWORD_KEY, newPw);
    const oldEl = document.getElementById('s-old-pw');
    const newEl = document.getElementById('s-new-pw');
    if (oldEl) oldEl.value = '';
    if (newEl) newEl.value = '';
    showToast('Password Changed ✓', '');
  }

  function clearAllProducts() {
    if (!confirm('Delete ALL products?')) return;
    products = [];
    saveProducts(products);
    renderProducts('all');
    updateCollectionCounts();
    updateWelcomeStats();
    renderAdminProducts();
    showToast('All Products Deleted', '');
  }

  function clearAllData() {
    if (!confirm('Clear ALL data?')) return;
    [PRODUCTS_KEY, CART_KEY, ORDERS_KEY, DROPS_KEY, API_KEY_STORE].forEach(k => localStorage.removeItem(k));
    location.reload();
  }

  // ================================================================
  // CSV
  // ================================================================
  function downloadCSV(filename, header, rows) {
    const csv = [header.join(','), ...rows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportProductsCSV() {
    const header = ['ID','Name','Price (DZD)','Old Price','Stock','Status','Collection','Tag','Description','Sizes','Icon'];
    const rows = products.map(p => [p.id, p.name, p.price, p.oldPrice||'', p.stock, p.status, p.collection, p.tag||'', p.desc, (p.sizes||[]).join('/'), p.icon||'']);
    downloadCSV('flyra-products.csv', header, rows);
    showToast('Exported ✓', `${products.length} products → CSV`);
  }

  function exportOrdersCSV() {
    const header = ['Order ID','Date','Customer','Phone','Wilaya','Items','Subtotal','Shipping','Total','Payment','Status'];
    const rows = orders.map(o => [
      o.id, new Date(o.date).toLocaleString(), o.customer?.name||'', o.customer?.phone||'', o.customer?.wilaya||'',
      (o.items||[]).map(i=>i.name).join(' / '), o.subtotal||0, o.shipping||0, o.total||0, o.payment||'', o.status||''
    ]);
    downloadCSV('flyra-orders.csv', header, rows);
    showToast('Exported ✓', `${orders.length} orders → CSV`);
  }

  function showExportModal() {
    showToast('📥 Export', 'Use Admin panel for CSV export/import');
  }

  function importProductsFromCSV(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const lines = e.target.result.split('\n').filter(l => l.trim());
        if (lines.length < 2) { showToast('⚠', 'CSV must have header + data rows'); return; }
        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.replace(/^"|"$/g,'').trim());
          if (vals.length < 4) continue;
          const p = {
            id: products.length > 0 ? Math.max(...products.map(x => x.id)) + 1 + i : i,
            name: vals[1] || 'Imported',
            price: parseInt(vals[2]) || 0,
            oldPrice: parseInt(vals[3]) || null,
            stock: parseInt(vals[4]) || 0,
            status: vals[5] || 'active',
            collection: vals[6] || 'spring',
            tag: vals[7] || null,
            desc: vals[8] || '',
            sizes: (vals[9] || 'M,L').split('/'),
            icon: vals[10] || '📦',
            image: '',
            dropDate: null
          };
          parsed.push(p);
        }
        products.push(...parsed);
        saveProducts(products);
        renderProducts(currentCollection);
        updateCollectionCounts();
        updateWelcomeStats();
        renderAdminProducts();
        showToast('Imported ✓', `${parsed.length} products from CSV`);
      } catch(err) { showToast('⚠ Import Error', err.message); }
    };
    reader.readAsText(file);
  }

  // ================================================================
  // WINDOW MANAGEMENT
  // ================================================================
  function bringToFront(win) {
    if (!win) return;
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');
  }

  function saveWindowPositions() {
    const positions = {};
    document.querySelectorAll('.window').forEach(win => {
      if (win.style.display !== 'none') {
        const id = win.id;
        const left = win.style.left, top = win.style.top, right = win.style.right, bottom = win.style.bottom;
        if (left || top) positions[id] = { left, top, right, bottom };
      }
    });
    localStorage.setItem('flyra_win_positions', JSON.stringify(positions));
  }

  function restoreWindowPositions() {
    try {
      const saved = JSON.parse(localStorage.getItem('flyra_win_positions') || '{}');
      Object.entries(saved).forEach(([id, pos]) => {
        const win = document.getElementById(id);
        if (win) {
          if (pos.left) win.style.left = pos.left;
          if (pos.top) win.style.top = pos.top;
          if (pos.right) win.style.right = pos.right;
          if (pos.bottom) win.style.bottom = pos.bottom;
          win.style.transform = 'none';
        }
      });
    } catch(e) {}
  }

  // ================================================================
  // SOCIAL SHARING
  // ================================================================
  function shareProduct(platform, name, price) {
    const text = `Check out ${name} — ${price.toLocaleString()} DZD on FLYRA 🔥`;
    if (platform === 'instagram') { navigator.clipboard.writeText(text + '\n' + window.location.href); showToast('📷 Instagram', 'Caption copied!'); }
    else if (platform === 'tiktok') { navigator.clipboard.writeText(text + '\n' + window.location.href); showToast('♪ TikTok', 'Caption copied!'); }
    else if (platform === 'copy') { navigator.clipboard.writeText(window.location.href); showToast('🔗 Link Copied!', name); }
  }

  // ================================================================
  // MUSIC
  // ================================================================
  const musicThemes = {
    neural: [{ title:'NEURAL_VIBES_2099', artist:'SYNTH_COLLECTIVE' }, { title:'CORTEX_DREAM', artist:'NEUROMANCER' }],
    phantom: [{ title:'PHANTOM_MODE', artist:'GRID_SYSTEM' }, { title:'SHADOW_PROTOCOL', artist:'GHOST_DATA' }],
    orbital: [{ title:'ORBITAL_DROP', artist:'NEON_LAB' }, { title:'SATURN_RING', artist:'COSMO_BEAT' }],
    void: [{ title:'VOID_PROTOCOL', artist:'CYBER_MIND' }, { title:'NULL_SPACE', artist:'DARK_MATTER' }],
  };

  function setMusicTheme(theme, btn) {
    currentTheme = theme;
    document.querySelectorAll('.music-theme-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    musicNext();
    showToast('Music Theme', theme.toUpperCase() + ' MODE');
  }

  function musicToggle() {
    isPlaying = !isPlaying;
    const playBtn = document.getElementById('music-play-btn');
    if (playBtn) playBtn.textContent = isPlaying ? '⏸' : '▶';
    document.querySelectorAll('.music-bar').forEach(bar => { bar.style.animationPlayState = isPlaying ? 'running' : 'paused'; });
    if (isPlaying) {
      musicInterval = setInterval(() => {
        musicProgress = (musicProgress + 0.5) % 100;
        const progressEl = document.getElementById('music-progress');
        if (progressEl) progressEl.style.width = musicProgress + '%';
        const mins = Math.floor((musicProgress / 100) * 3.47);
        const secs = Math.floor(((musicProgress / 100) * 3.47 % 1) * 60);
        const currentEl = document.getElementById('music-current');
        if (currentEl) currentEl.textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
      }, 500);
    } else clearInterval(musicInterval);
  }

  function musicNext() {
    const songs = musicThemes[currentTheme] || musicThemes.neural;
    const s = songs[Math.floor(Math.random() * songs.length)];
    const titleEl = document.querySelector('.music-title');
    const artistEl = document.querySelector('.music-artist');
    if (titleEl) titleEl.textContent = s.title;
    if (artistEl) artistEl.textContent = s.artist;
  }
  function musicPrev() { musicProgress = Math.max(0, musicProgress - 10); }

  // ================================================================
  // SIZE GUIDE
  // ================================================================
  function switchSizeTab(btn, table) {
    document.querySelectorAll('.size-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    ['tops','bottoms','shoes'].forEach(t => {
      const el = document.getElementById('size-table-' + t);
      if (el) el.style.display = t === table ? 'block' : 'none';
    });
  }

  // ================================================================
  // CURRENCY TOGGLE
  // ================================================================
  function toggleCurrency() {
    currentCurrency = currentCurrency === 'DZD' ? 'USD' : 'DZD';
    localStorage.setItem('flyra_currency', currentCurrency);
    const badge = document.querySelector('.currency-badge');
    if (badge) badge.textContent = currentCurrency;
    renderFilteredProducts();
    renderCart();
    showToast('Currency', currentCurrency === 'DZD' ? '🇩🇿 Algerian Dinar (DZD)' : '🇺🇸 US Dollar (USD)');
  }

  // ================================================================
  // WISHLIST
  // ================================================================
  function addToWishlist(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    if (wishlist.find(w => w.id === p.id)) {
      showToast('♡', p.name + (currentLang === 'ar' ? ' موجود بالفعل' : ' already in wishlist'));
      return;
    }
    wishlist.push({...p});
    saveWishlist();
    renderWishlist();
    showToast('♡ ' + t('wishlist'), p.name);
  }

  function removeFromWishlist(id) {
    wishlist = wishlist.filter(w => w.id !== id);
    saveWishlist();
    renderWishlist();
  }

  function moveWishlistToCart(id) {
    const item = wishlist.find(w => w.id === id);
    if (!item) return;
    addToCart(item.id);
    removeFromWishlist(id);
  }

  function renderWishlist() {
    const content = document.getElementById('wishlist-content');
    if (!content) return;
    if (wishlist.length === 0) {
      content.innerHTML = `<div style="text-align:center;padding:30px;opacity:0.3;font-size:12px;">${currentLang === 'ar' ? 'قائمة الرغبات فارغة' : 'No items saved yet.<br>Right-click any product to add.'}</div>`;
      return;
    }
    content.innerHTML = wishlist.map(p => `
      <div class="wishlist-item">
        <div class="wishlist-item-icon">${p.icon || '📦'}</div>
        <div class="wishlist-item-info">
          <div class="wishlist-item-name">${p.name}</div>
          <div class="wishlist-item-price">${formatPrice(p.price)}</div>
          <button class="wishlist-move-cart" onclick="window.MorpheusApp.moveWishlistToCart(${p.id})">${t('addToCart')}</button>
        </div>
        <div class="wishlist-item-remove" onclick="window.MorpheusApp.removeFromWishlist(${p.id})">✕</div>
      </div>`).join('');
  }

  // ================================================================
  // ORDER TRACKING
  // ================================================================
  function renderOrderTracking() {
    const content = document.getElementById('tracking-orders-list');
    if (!content) return;
    if (orders.length === 0) {
      content.innerHTML = `<p style="font-size:11px;opacity:0.3;text-align:center;padding:30px;">${currentLang === 'ar' ? 'لا توجد طلبات' : 'No orders yet'}</p>`;
      return;
    }
    content.innerHTML = orders.slice(0, 5).map(o => {
      const steps = [
        { name: currentLang === 'ar' ? 'تم تأكيد الطلب' : 'Order Confirmed', done: true, time: new Date(o.date).toLocaleString() },
        { name: currentLang === 'ar' ? 'جاري التحضير' : 'Processing', done: o.status !== 'pending', time: o.status !== 'pending' ? '—' : '' },
        { name: currentLang === 'ar' ? 'قيد الشحن' : 'Shipped', done: o.status === 'shipped' || o.status === 'delivered', time: '' },
        { name: currentLang === 'ar' ? 'تم التسليم' : 'Delivered', done: o.status === 'delivered', time: '' },
      ];
      const activeIdx = steps.reduce((a, s, i) => s.done ? i : a, 0);
      return `<div class="tracking-order">
        <div class="tracking-id">#${o.id} <span class="order-status status-${o.status}">${o.status.toUpperCase()}</span></div>
        <div style="font-size:10px;opacity:0.4;margin-bottom:8px;">${o.customer?.name || ''} — ${o.customer?.wilaya || ''}</div>
        <div class="tracking-timeline">${steps.map((step, i) => `
          <div class="tracking-step">
            <div class="tracking-dot ${step.done ? (i === activeIdx ? 'active' : 'done') : 'pending'}">${step.done ? '✓' : (i + 1)}</div>
            <div class="tracking-info">
              <div class="tracking-step-name" style="${step.done ? '' : 'opacity:0.3;'}">${step.name}</div>
              ${step.time ? `<div class="tracking-step-time">${step.time}</div>` : ''}
            </div>
          </div>`).join('')}
        </div>
        ${isAdminLoggedIn ? `<div style="display:flex;gap:6px;margin-top:8px;">
          <button class="btn-edit" onclick="window.MorpheusApp.updateOrderStatus('${o.id}','processing')" style="flex:1;">PROCESSING</button>
          <button class="btn-edit" onclick="window.MorpheusApp.updateOrderStatus('${o.id}','shipped')" style="flex:1;">SHIPPED</button>
          <button class="btn-edit" onclick="window.MorpheusApp.updateOrderStatus('${o.id}','delivered')" style="flex:1;">DELIVERED</button>
        </div>` : ''}
      </div>`;
    }).join('');
  }

  function updateOrderStatus(orderId, newStatus) {
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = newStatus;
      saveOrders(orders);
      renderOrderTracking();
      renderAdminOrders();
      renderAdminDashboard();
      showToast('Order Updated ✓', `#${orderId} → ${newStatus.toUpperCase()}`);
      addNotification('ORDER STATUS', `#${orderId} is now ${newStatus.toUpperCase()}`);
      automationAlert(`📦 Order #${orderId} marked as ${newStatus.toUpperCase()}`);
    }
  }

  // ================================================================
  // AUTOMATION
  // ================================================================
  function automationAlert(message) {
    const el = document.getElementById('automation-alert');
    if (el) { el.textContent = '⚙ AUTOMATION: ' + message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 4000); }
  }

  function checkLowStock() {
    products.forEach(p => {
      if (p.stock === 1) {
        automationAlert(`⚠ Low stock: ${p.name} — 1 unit left!`);
        addNotification('LOW STOCK ⚠', `${p.name} — Only 1 unit remaining`);
      }
      if (p.stock === 0 && p.status !== 'soldout' && p.status !== 'drop') {
        p.status = 'soldout';
        saveProducts(products);
        automationAlert(`🔴 SOLD OUT: ${p.name}`);
        addNotification('SOLD OUT', `${p.name} is now sold out`);
      }
    });
  }

  // ================================================================
  // ADMIN ANALYTICS
  // ================================================================
  function renderAnalyticsChart() {
    const panel = document.getElementById('panel-dashboard');
    if (!panel) return;
    let chartEl = document.getElementById('admin-chart');
    if (!chartEl) {
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="widget-label" style="margin-top:16px;">Sales (Last 7 Days)</div>
        <div style="display:flex;align-items:flex-end;gap:4px;height:60px;margin-top:8px;" id="admin-chart-bars"></div>
        <div style="display:flex;gap:4px;margin-top:4px;" id="admin-chart-labels"></div>`;
      panel.appendChild(div);
    }
    const bars = document.getElementById('admin-chart-bars');
    const labels = document.getElementById('admin-chart-labels');
    if (!bars || !labels) return;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const dayOrders = orders.filter(o => o.date && o.date.startsWith(dayStr));
      const revenue = dayOrders.reduce((s, o) => s + o.total, 0);
      days.push({ label: d.toLocaleDateString('en', {weekday:'short'}), revenue });
    }
    const maxRev = Math.max(...days.map(d => d.revenue), 1);
    bars.innerHTML = days.map(d => {
      const pct = Math.max((d.revenue / maxRev) * 100, 4);
      return `<div style="flex:1;background:linear-gradient(to top,var(--cyan),rgba(0,212,255,0.3));border-radius:2px 2px 0 0;height:${pct}%;" title="${d.revenue.toLocaleString()} DZD"></div>`;
    }).join('');
    labels.innerHTML = days.map(d => `<div style="flex:1;text-align:center;font-size:8px;opacity:0.4;">${d.label}</div>`).join('');
  }

  function renderRevenueChart() {
    const panel = document.getElementById('panel-dashboard');
    if (!panel) return;
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const dayOrders = orders.filter(o => o.date && o.date.startsWith(dayStr));
      const revenue = dayOrders.reduce((s, o) => s + o.total, 0);
      days.push({ label: d.toLocaleDateString('en', {month:'short',day:'numeric'}), revenue });
    }
    const totalRev = days.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = days.reduce((s, d) => s + 1, 0);
    const maxRev = Math.max(...days.map(d => d.revenue), 1);

    let existing = document.getElementById('revenue-chart-wrap');
    if (existing) existing.remove();
    const wrap = document.createElement('div');
    wrap.id = 'revenue-chart-wrap';
    wrap.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0;">
        <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:var(--green);">${totalRev.toLocaleString()}</div>
          <div style="font-size:9px;opacity:0.4;">30D Revenue (DZD)</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:var(--orange);">${orders.length}</div>
          <div style="font-size:9px;opacity:0.4;">30D Orders</div>
        </div>
      </div>
      <div class="widget-label">Revenue Trend (30 Days)</div>
      <div style="display:flex;align-items:flex-end;gap:2px;height:60px;">
        ${days.filter((_, i) => i % 5 === 0).map(d => {
          const pct = Math.max((d.revenue / maxRev) * 100, 2);
          return `<div style="flex:1;background:linear-gradient(to top,var(--cyan),rgba(0,212,255,0.3));border-radius:2px 2px 0 0;height:${pct}%;" title="${d.label}: ${d.revenue.toLocaleString()} DZD"></div>`;
        }).join('')}
      </div>`;
    panel.appendChild(wrap);
  }

  function renderCustomerMetrics() {
    const uniqueCustomers = [...new Set(orders.map(o => o.customer?.phone || o.customer?.email || ''))].filter(Boolean);
    const avgOrder = orders.length > 0 ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0;
    const topProducts = {};
    orders.forEach(o => (o.items||[]).forEach(i => { topProducts[i.name] = (topProducts[i.name] || 0) + 1; }));
    const topProduct = Object.entries(topProducts).sort((a, b) => b[1] - a[1])[0];

    let el = document.getElementById('customer-metrics');
    if (!el) {
      el = document.createElement('div');
      el.id = 'customer-metrics';
      const panel = document.getElementById('panel-dashboard');
      if (panel) panel.appendChild(el);
    }
    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;">
      <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:18px;font-weight:800;color:var(--yellow);">${uniqueCustomers.length}</div>
        <div style="font-size:9px;opacity:0.4;">Customers</div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:18px;font-weight:800;color:var(--pink);">${avgOrder.toLocaleString()}</div>
        <div style="font-size:9px;opacity:0.4;">Avg Order (DZD)</div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:18px;font-weight:800;color:var(--purple);">${topProduct ? topProduct[0].substring(0, 12) : 'N/A'}</div>
        <div style="font-size:9px;opacity:0.4;">Top Product</div>
      </div>
    </div>`;
  }

  // ================================================================
  // STICKY CART BAR
  // ================================================================
  function renderStickyCartBar() {
    if (cart.length === 0) {
      const bar = document.getElementById('sticky-cart-bar');
      if (bar) bar.remove();
      return;
    }
    let bar = document.getElementById('sticky-cart-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'sticky-cart-bar';
      bar.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(20,20,25,0.95);border:1px solid var(--border);border-radius:12px;padding:8px 18px;display:flex;align-items:center;gap:14px;z-index:9997;backdrop-filter:blur(20px);font-size:11px;box-shadow:0 10px 30px rgba(0,0,0,0.5);';
      document.body.appendChild(bar);
    }
    const total = cart.reduce((s, i) => s + i.price, 0) + 800;
    bar.innerHTML = `<span>🛒 ${cart.length} items</span><span style="font-weight:700;">${total.toLocaleString()} DZD</span><button onclick="window.MorpheusApp.openCheckout()" style="background:var(--accent);border:none;color:#000;padding:6px 14px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;">${t('checkout')}</button>`;
  }

  // ================================================================
  // COMPARE
  // ================================================================
  let compareList = [];
  function addToCompare(id) {
    if (compareList.length >= 4) { showToast('⚠', 'Compare max 4 items'); return; }
    if (compareList.includes(id)) { showToast('⚠', 'Already in compare'); return; }
    compareList.push(id);
    showToast('📊 Added to Compare', `${compareList.length}/4 items`);
  }
  function openCompare() {
    if (compareList.length < 2) { showToast('⚠', 'Add at least 2 products'); return; }
    showToast('📊 Compare', `${compareList.length} products — use Admin panel for full comparison view`);
  }

  // ================================================================
  // COMMAND PALETTE
  // ================================================================
  function focusWindow(name) {
    const win = document.getElementById('win-' + name);
    if (!win) return;
    win.style.display = 'block';
    win.classList.remove('minimized');
    bringToFront(win);
    if (name === 'tracking') setTimeout(renderOrderTracking, 50);
  }

  function closeCommandPalette() {
    const overlay = document.getElementById('command-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  const COMMANDS = [
    { id:'products', icon:'◇', label:'Products', shortcut:'P', action:() => focusWindow('products') },
    { id:'cart', icon:'🛒', label:'Cart', shortcut:'C', action:() => focusWindow('cart') },
    { id:'stylist', icon:'🤖', label:'AI Stylist', shortcut:'S', action:() => focusWindow('stylist') },
    { id:'drops', icon:'⚡', label:'Upcoming Drops', shortcut:'D', action:() => focusWindow('drops') },
    { id:'wishlist', icon:'♡', label:'Wishlist', shortcut:'W', action:() => focusWindow('wishlist') },
    { id:'outfit', icon:'👔', label:'Outfit Builder', shortcut:'O', action:() => focusWindow('outfit') },
    { id:'music', icon:'🎵', label:'Music Player', shortcut:'M', action:() => focusWindow('music') },
    { id:'notifications', icon:'🔔', label:'Notifications', shortcut:'N', action:() => focusWindow('notifications') },
    { id:'settings', icon:'⚙️', label:'Settings', shortcut:'', action:() => focusWindow('settings') },
    { id:'tracking', icon:'📦', label:'Order Tracking', shortcut:'T', action:() => focusWindow('tracking') },
    { id:'export', icon:'📥', label:'Export CSV (admin)', shortcut:'⌘E', action:() => { if(isAdminLoggedIn) showExportModal(); else showToast('⚠','Admin only'); } },
    { id:'currency', icon:'💱', label:'Toggle Currency', shortcut:'⌘R', action:toggleCurrency },
    { id:'lang', icon:'🌐', label:'Switch Language', shortcut:'⌘L', action:() => { const langs=['en','fr','ar']; setLang(langs[(langs.indexOf(currentLang)+1)%3]); } },
    { id:'compare', icon:'📊', label:'Compare Products', shortcut:'', action:openCompare },
  ];

  function renderCommandPalette() {
    const list = document.getElementById('cmd-list');
    const q = document.getElementById('cmd-search')?.value?.toLowerCase() || '';
    const filtered = q ? COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.id.includes(q)) : COMMANDS;
    if (list) {
      list.innerHTML = filtered.map(c => `
        <div class="command-item" data-cmd="${c.id}">
          <span class="icon">${c.icon}</span>
          <span class="cmd-label">${c.label}</span>
          ${c.shortcut ? `<span class="cmd-shortcut">${c.shortcut}</span>` : ''}
        </div>`).join('');
    }
  }

  function openCommandPalette() {
    let overlay = document.getElementById('command-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'command-overlay';
      overlay.className = 'command-overlay';
      overlay.innerHTML = `<div class="command-palette"><input class="command-search" id="cmd-search" placeholder="Type a command..." autofocus><div class="command-list" id="cmd-list"></div></div>`;
      overlay.addEventListener('click', e => { if (e.target === overlay) closeCommandPalette(); });
      document.body.appendChild(overlay);
      document.getElementById('cmd-search').addEventListener('input', renderCommandPalette);
      document.getElementById('cmd-list').addEventListener('click', e => {
        const item = e.target.closest('.command-item');
        if (item) { const cmd = COMMANDS.find(c => c.id === item.dataset.cmd); if(cmd) { closeCommandPalette(); cmd.action(); } }
      });
      document.getElementById('cmd-search').addEventListener('keydown', e => {
        if (e.key === 'Escape') closeCommandPalette();
        else if (e.key === 'Enter') {
          const first = document.querySelector('.command-item');
          if (first) { const cmd = COMMANDS.find(c => c.id === first.dataset.cmd); if(cmd) { closeCommandPalette(); cmd.action(); } }
        }
      });
    }
    overlay.classList.add('open');
    renderCommandPalette();
    setTimeout(() => document.getElementById('cmd-search')?.focus(), 100);
  }

  // ================================================================
  // PARTICLES
  // ================================================================
  function initParticles() {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.width = (2 + Math.random() * 3) + 'px';
      p.style.height = p.style.width;
      const colors = ['#d4d4d4','#aaaaaa','#888888','#bbbbbb','#999999'];
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDuration = (15 + Math.random() * 15) + 's';
      p.style.animationDelay = Math.random() * 20 + 's';
      desktop.appendChild(p);
    }
  }

  function toggleParticles(toggleEl) {
    if (toggleEl) toggleEl.classList.toggle('active');
    particlesEnabled = !particlesEnabled;
    document.querySelectorAll('.particle').forEach(p => { p.style.display = particlesEnabled ? 'block' : 'none'; });
  }

  // ================================================================
  // CONTEXT MENU
  // ================================================================
  function showContext(e, productId) {
    e.preventDefault();
    contextProduct = products.find(p => p.id === productId);
    const menu = document.getElementById('context-menu');
    if (menu) {
      menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
      menu.style.top = Math.min(e.clientY, window.innerHeight - 200) + 'px';
      menu.classList.add('show');
    }
  }

  function hideContext() {
    const menu = document.getElementById('context-menu');
    if (menu) menu.classList.remove('show');
  }

  function addToCartFromContext() { if (contextProduct) addToCart(contextProduct.id); hideContext(); }
  function addToOutfitFromContext() { if (contextProduct) addToOutfit(contextProduct.id); hideContext(); }
  function openDetailFromContext() { if (contextProduct) openProductDetail(contextProduct.id); hideContext(); }
  function addToWishlistFromContext() { if (!contextProduct) return; if (wishlist.find(w => w.id === contextProduct.id)) { showToast('♡', contextProduct.name + (currentLang === 'ar' ? ' موجود بالفعل' : ' already in wishlist')); hideContext(); return; } wishlist.push({...contextProduct}); saveWishlist(); renderWishlist(); showToast('♡ ' + t('wishlist'), contextProduct.name); hideContext(); }
  function shareProductFromContext() { if (contextProduct) shareProduct('copy', contextProduct.name, contextProduct.price); hideContext(); }

  // ================================================================
  // COUPON
  // ================================================================
  function loadCoupon() {
    const input = document.getElementById('coupon-input');
    if (input) {
      input.addEventListener('keypress', e => {
        if (e.key === 'Enter') applyCoupon();
      });
    }
  }

  function applyCoupon() {
    const input = document.getElementById('coupon-input');
    const code = input?.value?.trim().toUpperCase();
    if (!code) return;
    const coupons = { 'FLYRA10': 10, 'NEURAL20': 20, 'VIP50': 50 };
    if (coupons[code]) {
      showToast(t('couponApplied') + ' ✓', `${coupons[code]}% discount applied!`);
      if (input) input.value = '';
    } else {
      showToast('⚠', 'Invalid coupon code');
    }
  }

  // ================================================================
  // LOYALTY POINTS
  // ================================================================
  function loadLoyalty() {
    if (!localStorage.getItem('flyra_loyalty')) {
      localStorage.setItem('flyra_loyalty', JSON.stringify({ points: 0, tier: 'Bronze', totalSpent: 0 }));
    }
  }

  function renderLoyalty() {
    try {
      const l = JSON.parse(localStorage.getItem('flyra_loyalty') || '{}');
      const pointsEl = document.getElementById('loyalty-points');
      const tierEl = document.getElementById('loyalty-tier');
      if (pointsEl) pointsEl.textContent = l.points || 0;
      if (tierEl) tierEl.textContent = l.tier || 'Bronze';
    } catch(e) {}
  }

  // ================================================================
  // ONBOARDING
  // ================================================================
  const TOUR_KEY = 'flyra_tour_done';
  function runOnboardingTour() {
    if (localStorage.getItem(TOUR_KEY)) return;
    const tour = document.createElement('div');
    tour.id = 'tour-overlay';
    tour.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99997;display:flex;align-items:center;justify-content:center;';
    tour.innerHTML = `<div style="width:380px;background:rgba(15,15,20,0.98);border:1px solid var(--border);border-radius:14px;padding:28px;text-align:center;">
      <div style="font-size:3rem;margin-bottom:12px;">🚀</div>
      <h2 style="font-size:16px;font-weight:800;margin-bottom:8px;">Welcome to FLYRA v1.0</h2>
      <p style="font-size:12px;opacity:0.5;line-height:1.6;margin-bottom:16px;">Your futuristic fashion desktop. Shop Algerian fashion from 2099.</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:10px;text-align:left;font-size:11px;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;"><span style="font-size:16px;">⌘K</span><span>Open command palette</span></div>
        <div style="display:flex;align-items:center;gap:10px;text-align:left;font-size:11px;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;"><span style="font-size:16px;">⚡</span><span>Set drop alerts for new releases</span></div>
        <div style="display:flex;align-items:center;gap:10px;text-align:left;font-size:11px;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;"><span style="font-size:16px;">⭐</span><span>Earn loyalty points on every order</span></div>
        <div style="display:flex;align-items:center;gap:10px;text-align:left;font-size:11px;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;"><span style="font-size:16px;">🤖</span><span>Get AI styling advice</span></div>
      </div>
      <button id="tour-skip" style="background:var(--cyan);border:none;color:#000;padding:12px 24px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;">START SHOPPING →</button>
    </div>`;
    document.body.appendChild(tour);
    document.getElementById('tour-skip').addEventListener('click', () => {
      localStorage.setItem(TOUR_KEY, '1');
      tour.style.opacity = '0';
      setTimeout(() => tour.remove(), 400);
    });
  }

  // ================================================================
  // BUNDLES (placeholder)
  // ================================================================
  function renderBundles() {
    const content = document.getElementById('bundles-content');
    if (!content) return;
    content.innerHTML = `<p style="font-size:11px;opacity:0.3;text-align:center;padding:30px;">Bundle deals coming soon. Check back later!</p>`;
  }

  // ================================================================
  // SIZE QUIZ (placeholder)
  // ================================================================
  function renderSizeQuiz() {
    const content = document.getElementById('sizequiz-content');
    if (!content) return;
    content.innerHTML = `<p style="font-size:11px;opacity:0.3;text-align:center;padding:30px;">Size quiz coming in the next update!</p>`;
  }

  // ================================================================
  // RECENTLY VIEWED (placeholder)
  // ================================================================
  function renderRecentlyViewed() {
    const content = document.getElementById('recent-content');
    if (!content) return;
    content.innerHTML = `<p style="font-size:11px;opacity:0.3;text-align:center;padding:30px;">Browse products to see recently viewed items.</p>`;
  }

  // ================================================================
  // COMPARE BAR (placeholder)
  // ================================================================
  function renderCompareBar() {
    // Placeholder
  }

  // ================================================================
  // DRAG & DROP IMAGE UPLOAD
  // ================================================================
  function initDropZone() {
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      handleImageUpload(e.dataTransfer.files);
    });
  }

  function handleImageUpload(files) {
    if (!files || files.length === 0) return;
    const preview = document.getElementById('image-preview');
    if (preview) preview.innerHTML = '';
    Array.from(files).forEach((file, i) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        if (preview) preview.appendChild(img);
        if (i === 0) {
          uploadedImageBase64 = e.target.result;
          const fImage = document.getElementById('f-image');
          if (fImage) fImage.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
    showToast('Image Uploaded ✓', `${files.length} image(s) ready`);
  }

  // ================================================================
  // SERVICE WORKER
  // ================================================================
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      const swCode = `self.addEventListener('install', e => self.skipWaiting()); self.addEventListener('activate', e => e.waitUntil(clients.claim())); self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => new Response('Offline'))));`;
      const blob = new Blob([swCode], {type: 'application/javascript'});
      const swUrl = URL.createObjectURL(blob);
      navigator.serviceWorker.register(swUrl).catch(() => {});
    }
  }

  // ================================================================
  // KEYBOARD SHORTCUTS
  // ================================================================
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      const tag = e.target.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openCommandPalette(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') { e.preventDefault(); if(isAdminLoggedIn) showExportModal(); else showToast('⚠','Admin only'); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') { e.preventDefault(); toggleCurrency(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') { e.preventDefault(); const langs=['en','fr','ar']; setLang(langs[(langs.indexOf(currentLang)+1)%3]); return; }

      if (isInput) return;

      if (e.key === 'Escape') { hideContext(); closeCommandPalette(); }
      if (e.key === 'p' || e.key === 'P') focusWindow('products');
      if (e.key === 'c' || e.key === 'C') focusWindow('cart');
      if (e.key === 's' || e.key === 'S') focusWindow('stylist');
      if (e.key === 'd' || e.key === 'D') focusWindow('drops');
      if (e.key === 'w' || e.key === 'W') focusWindow('wishlist');
      if (e.key === 'o' || e.key === 'O') focusWindow('outfit');
      if (e.key === 'm' || e.key === 'M') focusWindow('music');
      if (e.key === 'n' || e.key === 'N') focusWindow('notifications');
      if (e.key === 't' || e.key === 'T') focusWindow('tracking');
    });
  }

  // ================================================================
  // TOUCH GESTURES
  // ================================================================
  function setupTouchGestures() {
    document.addEventListener('touchstart', e => {
      touchSwipeStartX = e.touches[0].clientX;
    }, {passive: true});

    document.addEventListener('touchend', e => {
      const swipeDist = e.changedTouches[0].clientX - touchSwipeStartX;
      if (swipeDist > 50 && e.target.closest('.window')) {
        const win = e.target.closest('.window');
        if (win && win.id !== 'win-welcome') { win.style.display = 'none'; }
      }
    }, {passive: true});

    document.querySelectorAll('.window-titlebar').forEach(bar => {
      bar.addEventListener('touchstart', e => {
        if (e.target.closest('.window-controls')) return;
        const touch = e.touches[0];
        touchActiveWin = bar.closest('.window');
        if (touchActiveWin) {
          touchActiveWin.classList.add('dragging');
          dragOffset.x = touch.clientX - touchActiveWin.offsetLeft;
          dragOffset.y = touch.clientY - touchActiveWin.offsetTop;
          bringToFront(touchActiveWin);
        }
      }, {passive: true});
    });

    document.addEventListener('touchmove', e => {
      if (!touchActiveWin) return;
      const touch = e.touches[0];
      touchActiveWin.style.left = (touch.clientX - dragOffset.x) + 'px';
      touchActiveWin.style.top = (touch.clientY - dragOffset.y) + 'px';
      touchActiveWin.style.right = 'auto';
      touchActiveWin.style.bottom = 'auto';
      touchActiveWin.style.transform = 'none';
    }, {passive: true});

    document.addEventListener('touchend', () => {
      if (touchActiveWin) { touchActiveWin.classList.remove('dragging'); touchActiveWin = null; }
    });
  }

  // ================================================================
  // MOUSE DRAG FOR WINDOWS
  // ================================================================
  function setupWindowDrag() {
    document.querySelectorAll('.window-titlebar').forEach(bar => {
      bar.addEventListener('mousedown', e => {
        if (e.target.closest('.window-controls')) return;
        activeWindow = bar.closest('.window');
        if (!activeWindow) return;
        activeWindow.classList.add('dragging');
        dragOffset.x = e.clientX - activeWindow.offsetLeft;
        dragOffset.y = e.clientY - activeWindow.offsetTop;
        bringToFront(activeWindow);
      });
    });

    document.addEventListener('mousemove', e => {
      if (!activeWindow || activeWindow.classList.contains('minimized')) return;
      activeWindow.style.left = (e.clientX - dragOffset.x) + 'px';
      activeWindow.style.top = (e.clientY - dragOffset.y) + 'px';
      activeWindow.style.right = 'auto';
      activeWindow.style.bottom = 'auto';
      activeWindow.style.transform = 'none';
    });

    document.addEventListener('mouseup', () => {
      if (activeWindow) { activeWindow.classList.remove('dragging'); setTimeout(saveWindowPositions, 50); activeWindow = null; }
    });

    document.querySelectorAll('.window').forEach(win => { win.addEventListener('mousedown', () => bringToFront(win)); });

    document.querySelectorAll('.wc-close').forEach(btn => btn.addEventListener('click', e => { e.target.closest('.window').style.display = 'none'; }));
    document.querySelectorAll('.wc-min').forEach(btn => btn.addEventListener('click', e => { e.target.closest('.window').classList.toggle('minimized'); }));
    document.querySelectorAll('.wc-max').forEach(btn => btn.addEventListener('click', e => { e.target.closest('.window').classList.toggle('maximized'); }));
  }

  // ================================================================
  // DOCK
  // ================================================================
  function setupDock() {
    document.querySelectorAll('.dock-item[data-win]').forEach(item => {
      item.addEventListener('click', () => {
        const winId = 'win-' + item.dataset.win;
        const win = document.getElementById(winId);
        if (!win) return;
        win.style.display = 'block';
        win.classList.remove('minimized');
        bringToFront(win);
        if (item.dataset.win === 'tracking') setTimeout(renderOrderTracking, 50);
      });
    });
  }

  // ================================================================
  // COLLECTIONS CLICK
  // ================================================================
  function setupCollections() {
    document.querySelectorAll('.explorer-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.explorer-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        renderProducts(item.dataset.collection);
      });
    });
  }

  // ================================================================
  // AI STYLIST EVENTS
  // ================================================================
  function setupStylistEvents() {
    document.getElementById('stylist-send')?.addEventListener('click', sendToStylist);
    document.getElementById('stylist-input')?.addEventListener('keypress', e => { if (e.key === 'Enter') sendToStylist(); });
  }

  // ================================================================
  // CHECKOUT DRAFT AUTO-SAVE
  // ================================================================
  function setupCheckoutDraft() {
    ['co-fname','co-lname','co-phone','co-email','co-wilaya','co-address'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', saveCheckoutDraft);
    });
    document.getElementById('admin-password')?.addEventListener('keypress', e => { if (e.key === 'Enter') attemptLogin(); });
  }

  // ================================================================
  // MOBILE INIT
  // ================================================================
  function applyMobileLayout() {
    if (window.innerWidth > 768) return;
    ['bundles','sizequiz','loyalty','recent'].forEach(w => {
      const el = document.getElementById('win-' + w);
      if (el) { el.style.width = '97vw'; el.style.left = '1.5vw'; el.style.maxHeight = '70vh'; }
    });
    ['win-cart','win-outfit','win-size','win-settings','win-collections'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.bottom = '90px'; el.style.top = 'auto'; }
    });
  }

  // ================================================================
  // LOADING SCREEN
  // ================================================================
  const loadingSteps = [
    { text:'INITIALIZING SYSTEM...', pct:10 },
    { text:'LOADING MODULES...', pct:25 },
    { text:'CONNECTING DATABASE...', pct:40 },
    { text:'SYNCHRONIZING DATA...', pct:60 },
    { text:'CALIBRATING AI STYLIST...', pct:78 },
    { text:'RENDERING INTERFACE...', pct:92 },
    { text:'SYSTEM READY', pct:100 },
  ];

  function advanceLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingProgress = document.getElementById('loading-progress');
    const loadingText = document.getElementById('loading-text');
    if (!loadingScreen) return;

    if (stepIdx >= loadingSteps.length) {
      setTimeout(() => loadingScreen.classList.add('hidden'), 100);
      return;
    }
    const step = loadingSteps[stepIdx];
    if (loadingText) loadingText.textContent = step.text;
    if (loadingProgress) loadingProgress.style.width = step.pct + '%';
    stepIdx++;
    if (step.pct < 100) {
      setTimeout(advanceLoading, 300 + Math.random() * 200);
    } else {
      setTimeout(() => loadingScreen.classList.add('hidden'), 200);
    }
  }

  // ================================================================
  // INIT
  // ================================================================
  const API_BASE = '/api';

  async function loadFromAPI() {
    try {
      const res = await fetch(API_BASE + '/products', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          products = data.map(p => ({...p, sizes: typeof p.sizes === 'string' ? p.sizes.split('/') : (p.sizes||[])}));
          saveProducts(products);
          return true;
        }
      }
    } catch(e) { /* use localStorage */ }
    return false;
  }

  async function syncWithBackend() {
    try {
      const [prods, cartRes, ordersRes] = await Promise.all([
        fetch(API_BASE + '/products').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(API_BASE + '/cart', { headers: {'X-Session': localStorage.getItem('flyra_session')||'web'} }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(API_BASE + '/orders').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      if (prods && prods.length > 0) {
        products = prods.map(p => ({...p, sizes: typeof p.sizes === 'string' ? p.sizes.split('/') : (p.sizes||[])}));
        saveProducts(products);
      }
      if (ordersRes && ordersRes.length > 0) {
        orders = ordersRes;
        saveOrders(orders);
      }
    } catch(e) { /* offline mode */ }
  }

  async function init() {
    // Try API first, fall back to localStorage
    await loadFromAPI();

    // Load remaining from localStorage
    cart = loadCart();
    orders = loadOrders();
    drops = loadDrops();
    wishlist = loadWishlist();
    notifiedDrops = loadNotifiedDrops();

    // Clock
    updateClock();
    setInterval(updateClock, 1000);

    // Restore state
    restoreWindowPositions();
    renderProducts('all');
    updateCollectionCounts();
    renderCart();
    renderOutfit();
    updateWelcomeStats();
    renderDrops();
    updateDropTimers();
    renderWishlist();
    renderOrderTracking();
    renderLoyalty();
    renderBundles();
    renderSizeQuiz();
    renderRecentlyViewed();
    renderCompareBar();
    updateAiProviderDisplay();

    // Apply currency badge
    const currencyBadge = document.querySelector('.currency-badge');
    if (currencyBadge) currencyBadge.textContent = currentCurrency;

    // Apply language
    setLang(currentLang);
    const browserLang = navigator.language.slice(0, 2);
    if (!localStorage.getItem('flyra_lang') && ['ar','fr'].includes(browserLang)) {
      setLang(browserLang);
    }

    // Setup systems
    initParticles();
    setupWindowDrag();
    setupDock();
    setupCollections();
    setupStylistEvents();
    setupCheckoutDraft();
    setupKeyboardShortcuts();
    setupTouchGestures();
    initDropZone();
    registerServiceWorker();
    loadCoupon();
    loadLoyalty();
    checkLowStock();
    setInterval(checkLowStock, 30000);
    setInterval(updateDropTimers, 1000);

    // Start loading
    advanceLoading();

    // Auto-connect AI server
    autoConnectServer();
    if (localStorage.getItem('flyra_ai_server')) updateAiProviderDisplay();

    // Post-load events
    setTimeout(() => {
      showToast('FLYRA v1.0 ✓', '⌘K for commands · EN/FR/AR · AI Stylist · Drops');
      renderStickyCartBar();
    }, 1200);

    setTimeout(() => {
      addNotification('STOCK ALERT ⚠', 'ZERO GLOVES — only 3 units remaining');
      automationAlert('⚠ Low stock detected: ZERO GLOVES (3 units)');
    }, 5500);

    setTimeout(runOnboardingTour, 4000);

    window.addEventListener('resize', () => { setTimeout(applyMobileLayout, 100); });
    setTimeout(applyMobileLayout, 200);
  }

  // Expose public API
  window.MorpheusApp = {
    // Products
    addToCart,
    addToOutfit,
    openProductDetail,
    selectSize,
    addToCartFromDetail,
    showContext,
    hideContext,
    addToCartFromContext,
    addToOutfitFromContext,
    openDetailFromContext,
    addToWishlistFromContext,
    shareProductFromContext,
    shareProduct,
    removeFromCart,
    // Cart & Checkout
    openCheckout,
    setCheckoutStep,
    checkoutStep2,
    checkoutBack,
    selectPayment,
    placeOrder,
    closeCheckout,
    // Outfit
    clearOutfit,
    addOutfitToCart,
    // Admin
    openAdminLogin,
    attemptLogin,
    openAdminPanel,
    switchAdminTab,
    renderAdminDashboard,
    renderAdminProducts,
    renderAdminOrders,
    renderAdminDrops,
    editProduct,
    deleteProduct,
    saveProduct,
    cancelEdit,
    changePassword,
    clearAllProducts,
    clearAllData,
    // Drops
    notifyDrop,
    scheduleDrop,
    cancelDrop,
    // AI Stylist
    sendToStylist,
    saveApiKey,
    saveServerUrl,
    // Utils
    showToast,
    showUndoToast,
    executeUndo,
    toggleCurrency,
    toggleParticles,
    addToWishlist,
    removeFromWishlist,
    moveWishlistToCart,
    renderWishlist,
    updateOrderStatus,
    // Compare
    addToCompare,
    openCompare,
    // Locale
    setLang,
    t,
    applyCoupon,
  };

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();