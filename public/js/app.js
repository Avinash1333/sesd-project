/* ═══════════════════════════════════════════════════════════════
   ARTIST'S MERCHANDISE — app.js
   Full SPA Router + MongoDB API Client + Master Gallery UI
═══════════════════════════════════════════════════════════════ */

const API = '/api';

// ─── Auth State Management ─────────────────────────────────────
const Auth = {
  get token()   { return localStorage.getItem('am_token'); },
  get name()    { return localStorage.getItem('am_name'); },
  get phone()   { return localStorage.getItem('am_phone'); },
  get userId()  { return localStorage.getItem('am_uid'); },
  isLoggedIn()  { return !!this.token; },
  login(token, name, phone, userId) {
    localStorage.setItem('am_token', token);
    localStorage.setItem('am_name', name);
    if (phone) localStorage.setItem('am_phone', phone);
    if (userId) localStorage.setItem('am_uid', userId);
  },
  logout() {
    localStorage.removeItem('am_token');
    localStorage.removeItem('am_name');
    localStorage.removeItem('am_phone');
    localStorage.removeItem('am_uid');
  }
};

// ─── Promo Codes & Wishlist Cache ─────────────────────────────
let appliedCoupon = null;
let userWishlist = new Set();

// ─── API Client ────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (Auth.isLoggedIn()) {
    headers['Authorization'] = `Bearer ${Auth.token}`;
  }
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'An error occurred while connecting to server');
  }
  return data;
}

// ─── Toast Notifications ───────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✦', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '✦'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ─── Live Badges (Cart & Wishlist) ──────────────────────────────
async function refreshBadges() {
  const cartBadge = document.getElementById('cart-badge');
  const wishBadge = document.getElementById('wishlist-badge');

  if (!Auth.isLoggedIn()) {
    if (cartBadge) { cartBadge.textContent = '0'; cartBadge.classList.add('hidden'); }
    if (wishBadge) { wishBadge.textContent = '0'; wishBadge.classList.add('hidden'); }
    userWishlist.clear();
    return;
  }

  try {
    const [cart, me, wishlist] = await Promise.all([
      apiFetch('/cart').catch(() => ({ count: 0 })),
      apiFetch('/auth/me').catch(() => ({})),
      apiFetch('/wishlist').catch(() => [])
    ]);

    const count = cart.count || 0;
    if (cartBadge) {
      cartBadge.textContent = count;
      cartBadge.classList.toggle('hidden', count === 0);
    }

    userWishlist = new Set((wishlist || []).map(p => p.id || p._id));
    const wishCount = userWishlist.size;
    if (wishBadge) {
      wishBadge.textContent = wishCount;
      wishBadge.classList.toggle('hidden', wishCount === 0);
    }
  } catch (e) {
    console.error('Badge refresh error:', e);
  }
}

// ─── Navigation Shell ──────────────────────────────────────────
function renderNavbar() {
  const loggedIn = Auth.isLoggedIn();
  const userName = Auth.name || 'Collector';
  const initial = userName.charAt(0).toUpperCase();

  return `
  <div class="announcement-bar">
    <span>🎨 <strong>Curated Artisan Store</strong> · All Artworks Handcrafted with Heritage Techniques</span>
    <span class="tag">Code: ART10 (10% OFF)</span>
    <span>Free Insured Delivery Over ₹2,000</span>
  </div>

  <nav class="navbar">
    <a href="#home" class="nav-brand">
      <div class="nav-logo-icon">A</div>
      <div class="nav-logo-title">
        <span class="main">ART!ST'S</span>
        <span class="sub">MERCHANDISE</span>
      </div>
    </a>

    <div class="nav-search-wrap">
      <div class="nav-search-box">
        <span class="nav-search-icon">🔍</span>
        <input type="text" id="search-input" class="nav-search-input" placeholder="Search masterworks, pencil, wood, pottery, artist…" autocomplete="off">
      </div>
      <div id="search-dropdown" class="search-results-dropdown"></div>
    </div>

    <div class="nav-actions">
      <a href="#all" class="nav-link-btn">Gallery</a>
      <a href="#home" class="nav-link-btn">Crafts</a>

      <a href="#wishlist" class="nav-badge-btn" title="Saved Artworks">
        <span>♡</span>
        <span id="wishlist-badge" class="nav-counter hidden">0</span>
      </a>

      <a href="#cart" class="nav-badge-btn" title="Shopping Cart">
        <span>🛒</span>
        <span id="cart-badge" class="nav-counter hidden">0</span>
      </a>

      ${loggedIn ? `
        <div class="nav-user-wrap">
          <div class="nav-user-pill">
            <div class="nav-user-avatar">${initial}</div>
            <span class="nav-user-name">${userName.split(' ')[0]}</span>
            <span style="font-size:10px;color:var(--text-muted)">▼</span>
          </div>
          <div class="nav-user-dropdown">
            <a href="#orders"><span>📦</span> My Orders</a>
            <a href="#wishlist"><span>♡</span> My Wishlist</a>
            <hr>
            <a href="#" id="logout-btn"><span>🚪</span> Sign Out</a>
          </div>
        </div>
      ` : `
        <a href="#auth" class="btn-primary" style="padding:8px 20px;font-size:13px;">Sign In</a>
      `}
    </div>
  </nav>`;
}

// ─── Router ────────────────────────────────────────────────────
const routes = {};
function registerRoute(hash, handler) { routes[hash] = handler; }

async function navigate(hash) {
  window.location.hash = hash;
}

window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', () => {
  renderPage();
});

function renderPage() {
  const hash = window.location.hash || '#home';
  const parts = hash.split('/');
  const route = parts[0];
  const param = parts[1];

  const app = document.getElementById('app');
  app.innerHTML = renderNavbar() + '<main id="page-content"></main>' + renderFooter();

  bindNavEvents();
  refreshBadges();

  const handler = routes[route] || routes['#home'];
  handler(param);
}

// ─── Bind Navigation & Search Events ───────────────────────────
function bindNavEvents() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
      showToast('Signed out successfully. See you soon!', 'info');
      navigate('#home');
    });
  }

  const searchInput = document.getElementById('search-input');
  const dropdown = document.getElementById('search-dropdown');
  if (searchInput && dropdown) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const q = e.target.value.trim();
      if (!q) { dropdown.classList.remove('open'); return; }
      debounceTimer = setTimeout(async () => {
        try {
          const results = await apiFetch(`/products/search?q=${encodeURIComponent(q)}`);
          renderSearchDropdown(results, dropdown);
        } catch (err) {}
      }, 250);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-search-wrap')) {
        dropdown.classList.remove('open');
      }
    });
  }
}

function renderSearchDropdown(results, dropdown) {
  if (!results || !results.length) {
    dropdown.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">No matching artworks found</div>`;
    dropdown.classList.add('open');
    return;
  }
  dropdown.innerHTML = results.slice(0, 6).map(p => `
    <div class="search-result-item" onclick="openProductQuickView('${p.id}'); document.getElementById('search-dropdown').classList.remove('open');">
      <img src="${p.image}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=100&q=80'">
      <div class="sri-info">
        <div class="sri-name">${p.name}</div>
        <div class="sri-meta">
          <span>${p.category.toUpperCase()}</span>
          <span>·</span>
          <span>${p.artist ? p.artist.name : 'Master Artisan'}</span>
        </div>
      </div>
      <div class="sri-price">₹${p.price.toLocaleString()}</div>
    </div>
  `).join('');
  dropdown.classList.add('open');
}

// ─── Footer ────────────────────────────────────────────────────
function renderFooter() {
  return `
  <footer>
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="nav-brand" style="margin-bottom:12px;">
          <div class="nav-logo-icon">A</div>
          <div class="nav-logo-title">
            <span class="main">ART!ST'S</span>
            <span class="sub">MERCHANDISE</span>
          </div>
        </div>
        <p>A global sanctuary connecting discerning art collectors directly with master craftsmen. Every single piece is handmade with patience, devotion, and centuries-old tradition.</p>
      </div>

      <div class="footer-col">
        <h5>Curated Crafts</h5>
        <ul>
          <li><a href="#pencil">Pencil Arts</a></li>
          <li><a href="#wood">Wood Sculptures</a></li>
          <li><a href="#origami">Origami Papers</a></li>
          <li><a href="#thread">Thread & String Art</a></li>
          <li><a href="#pottery">Ceramics & Pottery</a></li>
          <li><a href="#glass">Stained Glass Art</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h5>Collector Services</h5>
        <ul>
          <li><a href="#all">All Masterpieces</a></li>
          <li><a href="#orders">Track Insured Delivery</a></li>
          <li><a href="#wishlist">Saved Art Collection</a></li>
          <li><a href="#cart">View Cart</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h5>Authenticity Promise</h5>
        <ul>
          <li><a href="#home">100% Verified Artisans</a></li>
          <li><a href="#home">Museum-Grade Materials</a></li>
          <li><a href="#home">Custom Wood Crating</a></li>
          <li><a href="#home">Certificate of Authenticity</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <span>© 2026 <strong>ART!ST'S MERCHANDISE</strong>. Handcrafted with reverence for authentic creators.</span>
      <div style="display:flex;gap:18px;">
        <span>🔒 Secure MongoDB Cloud Encryption</span>
        <span>✈ Worldwide Insured Courier</span>
      </div>
    </div>
  </footer>`;
}

// ─── HOME PAGE ─────────────────────────────────────────────────
registerRoute('#home', async () => {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <!-- HERO SECTION -->
    <section class="hero">
      <div class="hero-badge">✦ Handcrafted by Master Artisans ✦</div>
      <h1>Where <em>craftsmanship</em> meets<br>the connoisseur</h1>
      <p>Discover extraordinary one-of-a-kind handmade creations spanning six historic disciplines. Each piece is an original investment in human creativity, skill, and heritage.</p>
      
      <div class="hero-ctas">
        <a href="#all" class="btn-primary">Explore All Artworks →</a>
        <a href="#categories-anchor" class="btn-secondary">Browse Disciplines</a>
      </div>

      <!-- PLATFORM STATS STRIP -->
      <div class="stats-strip" id="stats-strip">
        <div class="stat-item">
          <div class="stat-number">24+</div>
          <div class="stat-label">Curated Masterworks</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">6</div>
          <div class="stat-label">Heritage Crafts</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">14</div>
          <div class="stat-label">Master Artisans</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">100%</div>
          <div class="stat-label">Insured Delivery</div>
        </div>
      </div>
    </section>

    <!-- FEATURED ARTWORKS SECTION -->
    <section class="section">
      <div class="section-header">
        <div class="section-title-wrap">
          <h2>Featured Masterpieces</h2>
          <p>Handpicked creations exemplifying exceptional technical mastery and artistic vision</p>
        </div>
        <a href="#all" class="section-view-all">View All Masterworks →</a>
      </div>
      <div class="product-grid" id="featured-grid">
        ${[1, 2, 3, 4].map(() => renderSkeletonCard()).join('')}
      </div>
    </section>

    <!-- DISCIPLINES / CATEGORIES SECTION -->
    <section class="section" id="categories-anchor">
      <div class="section-header">
        <div class="section-title-wrap">
          <h2>Explore by Discipline</h2>
          <p>Immerse yourself in six traditional and contemporary art mediums</p>
        </div>
      </div>
      <div class="category-grid" id="category-grid">
        ${[1, 2, 3, 4, 5, 6].map(() => `<div class="skeleton" style="height:380px;border-radius:14px;"></div>`).join('')}
      </div>
    </section>

    <!-- ARTISAN VALUES BANNER -->
    <section class="section">
      <div style="background:var(--bg-card);border:1px solid var(--border-medium);border-radius:var(--radius-lg);padding:50px 40px;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;">
        <div>
          <span style="color:var(--accent-amber);font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">The Artisan Ethos</span>
          <h2 style="font-family:var(--font-serif);font-size:36px;margin:12px 0 18px;line-height:1.2;">Every piece carries the heartbeat of its creator</h2>
          <p style="color:var(--text-secondary);font-size:15px;line-height:1.7;margin-bottom:24px;">In a world of mass-produced plastic and automated assembly lines, our artists spend 40 to 120 hours on a single piece. Whether drawing thousands of micro-graphite strokes or spinning silk through hundreds of brass pins, you receive a genuine human soul in physical form.</p>
          <div style="display:flex;gap:20px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="color:var(--accent-gold);font-size:20px;">✓</span>
              <span style="font-size:14px;font-weight:600;">Signed Certificate of Provenance</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="color:var(--accent-gold);font-size:20px;">✓</span>
              <span style="font-size:14px;font-weight:600;">Direct Fair-Trade Artisan Royalties</span>
            </div>
          </div>
        </div>
        <div style="border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-lg);height:320px;">
          <img src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80" alt="Artisan at work" style="width:100%;height:100%;object-fit:cover;">
        </div>
      </div>
    </section>
  `;

  // Fetch live stats, featured products, and categories in parallel from MongoDB
  try {
    const [featured, categories, stats] = await Promise.all([
      apiFetch('/products/featured'),
      apiFetch('/categories'),
      apiFetch('/stats').catch(() => null)
    ]);

    // Update stats strip if available
    if (stats) {
      document.getElementById('stats-strip').innerHTML = `
        <div class="stat-item"><div class="stat-number">${stats.artworks}+</div><div class="stat-label">Curated Masterworks</div></div>
        <div class="stat-item"><div class="stat-number">${stats.crafts}</div><div class="stat-label">Heritage Crafts</div></div>
        <div class="stat-item"><div class="stat-number">${stats.artisans}</div><div class="stat-label">Master Artisans</div></div>
        <div class="stat-item"><div class="stat-number">${stats.ordersPlaced}+</div><div class="stat-label">Insured Deliveries</div></div>
      `;
    }

    // Render Featured Artworks
    const featGrid = document.getElementById('featured-grid');
    if (featGrid) {
      featGrid.innerHTML = featured.map(p => renderProductCard(p)).join('');
    }

    // Render Categories
    const catGrid = document.getElementById('category-grid');
    if (catGrid) {
      catGrid.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="navigate('#${cat.id}')">
          <div class="category-card-img">
            <img src="${cat.image}" alt="${cat.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80'">
            <div class="category-card-overlay"></div>
            <span class="category-card-badge">${cat.count}</span>
          </div>
          <div class="category-card-body">
            <div class="category-card-name">${cat.name}</div>
            <div class="category-card-tagline">${cat.tagline}</div>
            <div class="category-card-desc">${cat.description}</div>
            <div class="category-card-cta">Explore Collection →</div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Home load error:', err);
  }
});

// ─── ALL ARTWORKS GALLERY PAGE ─────────────────────────────────
registerRoute('#all', async () => {
  renderCatalogPage('all', 'Curated Art Collection', 'Browse all handcrafted original works across all disciplines');
});

// ─── INDIVIDUAL CATEGORY ROUTES ────────────────────────────────
const categoryMeta = {
  pencil: { title: 'Pencil Arts', desc: 'Chiaroscuro portraits and fine botanical studies in graphite' },
  wood: { title: 'Wood Art & Sculptures', desc: 'Hand-carved reclaimed teak reliefs and organic driftwood sculptures' },
  origami: { title: 'Origami Masterpieces', desc: 'Tessellated paper sculptures, peace crane canvases, and celestial mobiles' },
  thread: { title: 'Thread & String Art', desc: 'Complex string mandalas and computational portraits in spun silk' },
  pottery: { title: 'Pottery & Ceramics', desc: 'Wheel-thrown celadon crackle vessels, raku ware, and ceremonial sets' },
  glass: { title: 'Stained & Blown Glass', desc: 'Handmade cathedral leaded panels and free-blown Murano crystal vessels' }
};

['pencil', 'wood', 'origami', 'thread', 'pottery', 'glass'].forEach(catId => {
  registerRoute(`#${catId}`, () => {
    const meta = categoryMeta[catId] || { title: catId, desc: 'Handcrafted Artworks' };
    renderCatalogPage(catId, meta.title, meta.desc);
  });
});

async function renderCatalogPage(selectedCat, title, subtitle) {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div style="background:var(--bg-deep);border-bottom:1px solid var(--border-subtle);padding:50px 40px 30px;">
      <div style="max-width:1320px;margin:0 auto;">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:10px;">
          <a href="#home">Home</a> &nbsp;›&nbsp; <span style="color:var(--accent-gold);">${title}</span>
        </div>
        <h1 style="font-family:var(--font-serif);font-size:38px;color:var(--text-primary);margin-bottom:8px;">${title}</h1>
        <p style="color:var(--text-secondary);font-size:16px;">${subtitle}</p>
      </div>
    </div>

    <section class="section" style="padding-top:36px;">
      <!-- FILTER & SORT TOOLBAR -->
      <div class="filter-toolbar">
        <div class="filter-pills">
          <button class="filter-pill ${selectedCat === 'all' ? 'active' : ''}" onclick="navigate('#all')">All Disciplines</button>
          <button class="filter-pill ${selectedCat === 'pencil' ? 'active' : ''}" onclick="navigate('#pencil')">Pencil Arts</button>
          <button class="filter-pill ${selectedCat === 'wood' ? 'active' : ''}" onclick="navigate('#wood')">Wood Art</button>
          <button class="filter-pill ${selectedCat === 'origami' ? 'active' : ''}" onclick="navigate('#origami')">Origami</button>
          <button class="filter-pill ${selectedCat === 'thread' ? 'active' : ''}" onclick="navigate('#thread')">Thread Art</button>
          <button class="filter-pill ${selectedCat === 'pottery' ? 'active' : ''}" onclick="navigate('#pottery')">Pottery</button>
          <button class="filter-pill ${selectedCat === 'glass' ? 'active' : ''}" onclick="navigate('#glass')">Glass Art</button>
        </div>

        <div class="filter-controls">
          <label style="font-size:13px;color:var(--text-muted)">Sort by:</label>
          <select id="catalog-sort" class="sort-select" onchange="sortCatalogProducts('${selectedCat}')">
            <option value="featured">Featured Masterpieces</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Recently Created</option>
          </select>
        </div>
      </div>

      <!-- PRODUCT GRID CONTAINER -->
      <div class="product-grid" id="catalog-grid">
        ${[1, 2, 3, 4, 5, 6].map(() => renderSkeletonCard()).join('')}
      </div>
    </section>
  `;

  loadCatalogProducts(selectedCat, 'featured');
}

async function loadCatalogProducts(cat, sort) {
  const grid = document.getElementById('catalog-grid');
  try {
    const url = `/products?${cat !== 'all' ? `category=${cat}&` : ''}sort=${sort}`;
    const products = await apiFetch(url);

    if (!products.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">🎨</div>
          <h3>No artworks found in this collection</h3>
          <p>Please check back soon or explore other disciplines.</p>
          <a href="#all" class="btn-primary">Browse All Pieces</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = products.map(p => renderProductCard(p)).join('');
  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to load collection</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

function sortCatalogProducts(cat) {
  const sort = document.getElementById('catalog-sort').value;
  loadCatalogProducts(cat, sort);
}

// ─── PRODUCT CARD COMPONENT ────────────────────────────────────
function renderProductCard(p) {
  const isWishlisted = userWishlist.has(p.id) || userWishlist.has(p._id);
  const isLowStock = p.stock > 0 && p.stock <= 3;
  const isOutOfStock = p.stock === 0;

  return `
  <div class="product-card" id="card-${p.id}">
    <div class="product-img-wrap" onclick="openProductQuickView('${p.id}')">
      <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80'">
      
      ${p.badge ? `<span class="product-badge-tag">${p.badge}</span>` : ''}

      <button class="product-wishlist-btn ${isWishlisted ? 'active' : ''}" 
              onclick="event.stopPropagation(); toggleWishlist('${p.id}', this)" 
              title="${isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}">
        ${isWishlisted ? '♥' : '♡'}
      </button>

      <button class="product-quick-btn" onclick="event.stopPropagation(); openProductQuickView('${p.id}')">
        Quick View
      </button>
    </div>

    <div class="product-body">
      <div class="product-cat-row">
        <span class="product-category-label">${p.category}</span>
        <div class="product-rating">
          <span>★</span>
          <span>${p.rating || 4.9}</span>
          <span class="count">(${p.reviewsCount || 12})</span>
        </div>
      </div>

      <div class="product-name" onclick="openProductQuickView('${p.id}')">${p.name}</div>
      <div class="product-artist">By ${p.artist ? p.artist.name : 'Master Artisan'} (${p.artist ? p.artist.location : 'Jaipur, India'})</div>
      <div class="product-medium" title="${p.medium || ''}">${p.medium || p.dimensions}</div>

      <div class="product-footer">
        <div class="product-price-wrap">
          <div class="product-price">₹${p.price.toLocaleString()}</div>
          ${p.originalPrice ? `<div class="product-price-orig">₹${p.originalPrice.toLocaleString()}</div>` : ''}
        </div>

        <button class="btn-add-cart ${isOutOfStock ? 'disabled' : ''}"
                id="btn-cart-${p.id}"
                onclick="handleAddToCart('${p.id}', this)">
          ${isOutOfStock ? 'Sold Out' : '+ Cart'}
        </button>
      </div>
    </div>
  </div>`;
}

function renderSkeletonCard() {
  return `
    <div class="product-card">
      <div class="skeleton" style="height:260px;"></div>
      <div style="padding:18px;">
        <div class="skeleton" style="height:14px;width:30%;margin-bottom:10px;"></div>
        <div class="skeleton" style="height:20px;width:80%;margin-bottom:8px;"></div>
        <div class="skeleton" style="height:14px;width:50%;margin-bottom:16px;"></div>
        <div class="skeleton" style="height:36px;width:100%;border-radius:20px;"></div>
      </div>
    </div>
  `;
}

// ─── ADD TO CART ACTION ────────────────────────────────────────
async function handleAddToCart(productId, btn) {
  if (!Auth.isLoggedIn()) {
    showToast('Please sign in to add artworks to your collection cart', 'info');
    setTimeout(() => navigate('#auth'), 600);
    return;
  }

  const originalText = btn.innerHTML;
  btn.innerHTML = '…';
  btn.style.pointerEvents = 'none';

  try {
    const res = await apiFetch('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, qty: 1 })
    });
    btn.classList.add('added');
    btn.innerHTML = '✓ Added';
    showToast('Added to cart! Free insured shipping applies over ₹2,000.', 'success');
    refreshBadges();
    setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = originalText;
      btn.style.pointerEvents = 'auto';
    }, 2000);
  } catch (err) {
    btn.innerHTML = originalText;
    btn.style.pointerEvents = 'auto';
    showToast(err.message, 'error');
  }
}

// ─── WISHLIST TOGGLE ACTION ────────────────────────────────────
async function toggleWishlist(productId, btn) {
  if (!Auth.isLoggedIn()) {
    showToast('Please sign in to save pieces to your wishlist', 'info');
    setTimeout(() => navigate('#auth'), 600);
    return;
  }

  try {
    const res = await apiFetch(`/wishlist/toggle/${productId}`, { method: 'POST' });
    if (res.wishlisted) {
      userWishlist.add(productId);
      btn.classList.add('active');
      btn.innerHTML = '♥';
      btn.title = 'Remove from Wishlist';
      showToast('Saved to your private wishlist', 'success');
    } else {
      userWishlist.delete(productId);
      btn.classList.remove('active');
      btn.innerHTML = '♡';
      btn.title = 'Save to Wishlist';
      showToast('Removed from wishlist', 'info');
    }
    refreshBadges();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── PRODUCT QUICK VIEW & DETAILS MODAL ────────────────────────
async function openProductQuickView(productId) {
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-overlay open" id="quick-modal-overlay" onclick="closeModalOnOverlay(event)">
      <div class="modal-dialog">
        <button class="modal-close-btn" onclick="closeModal()">✕</button>
        <div style="padding:60px 40px;text-align:center;">
          <div class="skeleton" style="height:340px;border-radius:14px;"></div>
        </div>
      </div>
    </div>
  `;

  try {
    const p = await apiFetch(`/products/${productId}`);
    const isWishlisted = userWishlist.has(p.id) || userWishlist.has(p._id);
    const gallery = p.gallery && p.gallery.length ? p.gallery : [p.image];
    const discountPercent = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

    container.innerHTML = `
      <div class="modal-overlay open" id="quick-modal-overlay" onclick="closeModalOnOverlay(event)">
        <div class="modal-dialog">
          <button class="modal-close-btn" onclick="closeModal()">✕</button>
          
          <div class="quick-view-grid">
            <!-- Left: Gallery Media -->
            <div class="quick-view-media">
              <img id="qv-main-img" class="quick-view-main-img" src="${gallery[0]}" alt="${p.name}" onerror="this.src='${p.image}'">
              ${gallery.length > 1 ? `
                <div class="quick-view-thumbs">
                  ${gallery.map((img, i) => `
                    <img src="${img}" class="quick-view-thumb ${i === 0 ? 'active' : ''}" 
                         onclick="switchQvImage('${img}', this)" alt="Thumbnail ${i + 1}">
                  `).join('')}
                </div>
              ` : ''}

              <!-- Mini Artisan Profile -->
              <div class="artisan-card-mini">
                <img src="${p.artist ? p.artist.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" 
                     class="artisan-avatar-mini" alt="${p.artist ? p.artist.name : 'Artisan'}">
                <div>
                  <div class="artisan-name-mini">${p.artist ? p.artist.name : 'Master Artisan'}</div>
                  <div class="artisan-loc-mini">📍 ${p.artist ? p.artist.location : 'Studio Workshop'}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${p.artist ? p.artist.bio : 'Preserving centuries of heritage craft.'}</div>
                </div>
              </div>
            </div>

            <!-- Right: Details, Specs, Actions -->
            <div class="quick-view-info">
              <div class="quick-view-cat">${p.category} COLLECTION</div>
              <h2 class="quick-view-title">${p.name}</h2>

              <div class="product-rating" style="margin-bottom:14px;">
                <span>★</span>
                <span>${p.rating || 4.9}</span>
                <span class="count">(${p.reviewsCount || 12} Verified Collector Reviews)</span>
              </div>

              <div class="quick-view-price-row">
                <span class="quick-view-price">₹${p.price.toLocaleString()}</span>
                ${p.originalPrice ? `<span class="quick-view-orig">₹${p.originalPrice.toLocaleString()}</span>` : ''}
                ${discountPercent > 0 ? `<span class="quick-view-discount">${discountPercent}% OFF</span>` : ''}
              </div>

              <p class="quick-view-desc">${p.desc}</p>

              <!-- Specifications Table -->
              <div class="quick-view-specs">
                <div class="spec-row"><span class="spec-label">Medium & Materials</span><span class="spec-val">${p.medium || 'Handcrafted Mixed Media'}</span></div>
                <div class="spec-row"><span class="spec-label">Dimensions</span><span class="spec-val">${p.dimensions || 'Custom Art Size'}</span></div>
                <div class="spec-row"><span class="spec-label">Inventory Status</span><span class="spec-val" style="color:${p.stock <= 3 ? '#ff8c00' : '#78d197'}">${p.stock > 0 ? `${p.stock} Available in Studio` : 'Sold Out'}</span></div>
                <div class="spec-row"><span class="spec-label">Provenance</span><span class="spec-val">Signed Certificate of Authenticity Included</span></div>
                <div class="spec-row"><span class="spec-label">Shipping</span><span class="spec-val">Insured shockproof custom crating</span></div>
              </div>

              <!-- Quantity Stepper & Add to Cart -->
              <div class="quick-view-actions">
                <div class="qty-stepper">
                  <button class="qty-btn" onclick="stepQvQty(-1)">−</button>
                  <span id="qv-qty" class="qty-num">1</span>
                  <button class="qty-btn" onclick="stepQvQty(1, ${p.stock})">+</button>
                </div>

                <button class="btn-primary" style="flex:1;" id="qv-add-btn" 
                        onclick="addToCartFromQv('${p.id}', this)" ${p.stock === 0 ? 'disabled' : ''}>
                  ${p.stock === 0 ? 'Sold Out' : 'Add to Collection Cart'}
                </button>

                <button class="product-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                        style="position:static;width:44px;height:44px;"
                        onclick="toggleWishlist('${p.id}', this)">
                  ${isWishlisted ? '♥' : '♡'}
                </button>
              </div>

              <!-- Verified Reviews Section -->
              <div class="reviews-section">
                <h4>Collector Appraisals (${p.reviews ? p.reviews.length : 0})</h4>
                <div class="reviews-list">
                  ${p.reviews && p.reviews.length ? p.reviews.map(r => `
                    <div class="review-item">
                      <div class="review-header">
                        <span class="review-author">${r.userName}</span>
                        <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                      </div>
                      <div class="review-comment">"${r.comment}"</div>
                    </div>
                  `).join('') : `<div style="font-size:13px;color:var(--text-muted)">Be the first collector to appraise this masterpiece.</div>`}
                </div>

                ${Auth.isLoggedIn() ? `
                  <div class="review-form">
                    <h5 style="margin-bottom:8px;font-size:14px;">Leave an Appraisal</h5>
                    <div style="margin-bottom:8px;display:flex;align-items:center;gap:10px;">
                      <span style="font-size:13px;color:var(--text-muted)">Rating:</span>
                      <select id="review-rating-select" class="form-input" style="padding:4px 8px;font-size:12px;">
                        <option value="5">★★★★★ (5/5 Exceptional)</option>
                        <option value="4">★★★★☆ (4/5 Very Good)</option>
                        <option value="3">★★★☆☆ (3/5 Average)</option>
                      </select>
                    </div>
                    <textarea id="review-comment-input" rows="2" placeholder="Share your appraisal of the technique, finish, or presence..."></textarea>
                    <button class="btn-secondary" style="font-size:12px;padding:6px 16px;" onclick="submitProductReview('${p.id}')">Submit Appraisal</button>
                  </div>
                ` : `
                  <div style="font-size:12px;color:var(--text-muted);margin-top:10px;">
                    <a href="#auth" onclick="closeModal()" style="color:var(--accent-amber)">Sign in</a> to submit a verified appraisal.
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="modal-overlay open" onclick="closeModalOnOverlay(event)">
        <div class="modal-dialog" style="padding:40px;text-align:center;">
          <button class="modal-close-btn" onclick="closeModal()">✕</button>
          <h3>Failed to load artwork details</h3>
          <p style="color:var(--text-muted);margin-top:8px;">${err.message}</p>
        </div>
      </div>
    `;
  }
}

function switchQvImage(src, thumb) {
  document.getElementById('qv-main-img').src = src;
  document.querySelectorAll('.quick-view-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

function stepQvQty(delta, maxStock = 10) {
  const el = document.getElementById('qv-qty');
  let current = parseInt(el.textContent, 10) || 1;
  current = Math.max(1, Math.min(maxStock, current + delta));
  el.textContent = current;
}

async function addToCartFromQv(productId, btn) {
  if (!Auth.isLoggedIn()) {
    closeModal();
    showToast('Please sign in to add artworks to your collection cart', 'info');
    navigate('#auth');
    return;
  }

  const qty = parseInt(document.getElementById('qv-qty').textContent, 10) || 1;
  btn.textContent = 'Adding…';
  try {
    await apiFetch('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, qty })
    });
    btn.textContent = '✓ Added to Cart!';
    showToast(`Added ${qty} item(s) to cart`, 'success');
    refreshBadges();
    setTimeout(() => closeModal(), 800);
  } catch (err) {
    btn.textContent = 'Add to Collection Cart';
    showToast(err.message, 'error');
  }
}

async function submitProductReview(productId) {
  const rating = document.getElementById('review-rating-select').value;
  const comment = document.getElementById('review-comment-input').value.trim();
  if (!comment) {
    showToast('Please write a brief appraisal comment', 'error');
    return;
  }

  try {
    await apiFetch(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
    showToast('Appraisal submitted successfully! Thank you.', 'success');
    openProductQuickView(productId); // re-render modal with new review
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeModal() {
  const overlay = document.getElementById('quick-modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    setTimeout(() => { document.getElementById('modal-container').innerHTML = ''; }, 200);
  }
}

function closeModalOnOverlay(e) {
  if (e.target.id === 'quick-modal-overlay') {
    closeModal();
  }
}

// ─── SHOPPING CART PAGE ────────────────────────────────────────
registerRoute('#cart', async () => {
  const content = document.getElementById('page-content');
  if (!Auth.isLoggedIn()) {
    content.innerHTML = `
      <div class="auth-page">
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <h3>Your Collection Cart is Empty</h3>
          <p>Please sign in to view your preserved cart and proceed to checkout.</p>
          <a href="#auth" class="btn-primary">Sign In to Your Account</a>
        </div>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div style="background:var(--bg-deep);border-bottom:1px solid var(--border-subtle);padding:40px 40px 24px;">
      <div style="max-width:1200px;margin:0 auto;">
        <h1 style="font-family:var(--font-serif);font-size:36px;color:var(--text-primary);margin-bottom:6px;">Shopping Cart</h1>
        <p style="color:var(--text-secondary);font-size:15px;">Verify your handcrafted art pieces before insured packaging</p>
      </div>
    </div>

    <section class="section">
      <div class="cart-layout" id="cart-container">
        <div class="skeleton" style="height:350px;border-radius:14px;"></div>
        <div class="skeleton" style="height:350px;border-radius:14px;"></div>
      </div>
    </section>
  `;

  loadCartView();
});

async function loadCartView() {
  const container = document.getElementById('cart-container');
  try {
    const cart = await apiFetch('/cart');

    if (!cart.items || !cart.items.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Discover one-of-a-kind art pieces handcrafted by master artisans.</p>
          <a href="#all" class="btn-primary">Explore Masterpieces</a>
        </div>
      `;
      return;
    }

    // Calculate discount with applied coupon
    let discount = 0;
    if (appliedCoupon === 'ART10') {
      discount = Math.round(cart.subtotal * 0.10);
    } else if (appliedCoupon === 'FIRSTART' && cart.subtotal >= 2000) {
      discount = 500;
    }

    const freeShippingTarget = 2000;
    const isFreeShipping = (cart.subtotal - discount) >= freeShippingTarget;
    const shippingFee = isFreeShipping ? 0 : 150;
    const finalTotal = Math.max(0, cart.subtotal - discount + shippingFee);
    const progressPercent = Math.min(100, Math.round(((cart.subtotal - discount) / freeShippingTarget) * 100));

    container.innerHTML = `
      <!-- Left: Cart Items Card -->
      <div class="cart-items-card">
        <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px solid var(--border-subtle);margin-bottom:8px;">
          <span style="font-weight:700;font-size:16px;">Artworks (${cart.count} items)</span>
          <button style="font-size:12px;color:var(--text-muted);cursor:pointer;" onclick="clearFullCart()">Clear Cart</button>
        </div>

        ${cart.items.map(item => `
          <div class="cart-item-row" id="cart-row-${item.productId}">
            <img src="${item.product.image}" class="cart-item-img" alt="${item.product.name}" 
                 onclick="openProductQuickView('${item.productId}')" style="cursor:pointer;"
                 onerror="this.src='https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=200&q=80'">
            
            <div class="cart-item-details">
              <div class="cart-item-cat">${item.product.category}</div>
              <div class="cart-item-name" onclick="openProductQuickView('${item.productId}')" style="cursor:pointer;">${item.product.name}</div>
              <div style="font-size:12px;color:var(--text-muted);">By ${item.product.artist ? item.product.artist.name : 'Artisan'}</div>
              <div class="cart-item-price">₹${(item.product.price * item.qty).toLocaleString()}</div>
            </div>

            <div class="cart-item-actions">
              <div class="qty-stepper">
                <button class="qty-btn" onclick="updateCartItemQty('${item.productId}', ${item.qty - 1})">−</button>
                <span class="qty-num">${item.qty}</span>
                <button class="qty-btn" onclick="updateCartItemQty('${item.productId}', ${item.qty + 1})">+</button>
              </div>

              <button class="cart-remove-btn" onclick="removeCartItem('${item.productId}')" title="Remove Item">✕</button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Right: Summary Box -->
      <div class="cart-summary-box">
        <h3>Order Summary</h3>

        <!-- Free shipping progress -->
        <div class="shipping-progress-wrap">
          <div class="shipping-progress-text">
            ${isFreeShipping ? '🎉 You qualify for FREE Insured Express Shipping!' : `Add ₹${(freeShippingTarget - (cart.subtotal - discount)).toLocaleString()} more for FREE Insured Shipping!`}
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${progressPercent}%"></div>
          </div>
        </div>

        <!-- Coupon input -->
        <div class="coupon-form">
          <input type="text" id="coupon-code-input" class="coupon-input" placeholder="Promo code (e.g. ART10)" value="${appliedCoupon || ''}">
          <button class="btn-apply-coupon" onclick="applyPromoCode()">Apply</button>
        </div>
        ${appliedCoupon ? `<div style="font-size:12px;color:#78d197;">✓ Coupon "${appliedCoupon}" applied!</div>` : ''}

        <div style="display:flex;flex-direction:column;gap:10px;">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>₹${cart.subtotal.toLocaleString()}</span>
          </div>

          ${discount > 0 ? `
            <div class="summary-row" style="color:#78d197;">
              <span>Promo Discount (${appliedCoupon})</span>
              <span>− ₹${discount.toLocaleString()}</span>
            </div>
          ` : ''}

          <div class="summary-row">
            <span>Insured Art Courier</span>
            <span>${shippingFee === 0 ? '<strong style="color:#78d197">FREE</strong>' : '₹150'}</span>
          </div>

          <div class="summary-row total">
            <span>Total Payable</span>
            <span class="amount">₹${finalTotal.toLocaleString()}</span>
          </div>
        </div>

        <button class="btn-primary" style="width:100%;justify-content:center;margin-top:8px;" 
                onclick="openCheckoutModal(${finalTotal}, ${discount}, '${appliedCoupon || ''}')">
          Proceed to Checkout →
        </button>
        <div style="font-size:11px;color:var(--text-muted);text-align:center;">
          🔒 Secure 256-bit Encrypted Checkout · 100% Damage Protection
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>Failed to load cart</h3><p>${err.message}</p></div>`;
  }
}

async function updateCartItemQty(productId, newQty) {
  try {
    await apiFetch('/cart/update', {
      method: 'PUT',
      body: JSON.stringify({ productId, qty: newQty })
    });
    loadCartView();
    refreshBadges();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function removeCartItem(productId) {
  try {
    await apiFetch(`/cart/remove/${productId}`, { method: 'DELETE' });
    showToast('Item removed from cart', 'info');
    loadCartView();
    refreshBadges();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function clearFullCart() {
  if (!confirm('Are you sure you want to clear your cart?')) return;
  try {
    await apiFetch('/cart/clear', { method: 'DELETE' });
    showToast('Cart cleared', 'info');
    loadCartView();
    refreshBadges();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function applyPromoCode() {
  const code = (document.getElementById('coupon-code-input').value || '').trim().toUpperCase();
  if (code === 'ART10' || code === 'FIRSTART') {
    appliedCoupon = code;
    showToast(`Coupon ${code} applied successfully!`, 'success');
    loadCartView();
  } else if (!code) {
    appliedCoupon = null;
    loadCartView();
  } else {
    showToast('Invalid coupon code. Try "ART10" for 10% off', 'error');
  }
}

// ─── CHECKOUT MODAL ────────────────────────────────────────────
function openCheckoutModal(total, discount = 0, couponCode = '') {
  let selectedPayment = 'COD';
  const container = document.getElementById('modal-container');

  container.innerHTML = `
    <div class="modal-overlay open" id="checkout-modal-overlay">
      <div class="modal-dialog" style="max-width:620px;padding:36px;">
        <button class="modal-close-btn" onclick="closeCheckoutModal()">✕</button>

        <h3 style="font-family:var(--font-serif);font-size:26px;margin-bottom:6px;">Complete Your Acquisition</h3>
        <p style="color:var(--text-muted);font-size:14px;margin-bottom:24px;">Provide your insured delivery address & select a payment method</p>

        <form class="checkout-form" id="checkout-form" onsubmit="handlePlaceOrder(event, ${total}, '${couponCode}')">
          <div class="form-group">
            <label class="form-label">Full Name of Recipient</label>
            <input type="text" id="co-name" class="form-input" required placeholder="e.g. Aarav Sharma" value="${Auth.name || ''}">
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Contact Phone</label>
              <input type="tel" id="co-phone" class="form-input" required placeholder="10-digit mobile" maxlength="10" value="${Auth.phone || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Pincode</label>
              <input type="text" id="co-pincode" class="form-input" required placeholder="e.g. 560001" maxlength="6">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Delivery Street Address</label>
            <textarea id="co-street" class="form-input" rows="2" required placeholder="Apartment, building, street, landmark..."></textarea>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">City</label>
              <input type="text" id="co-city" class="form-input" required placeholder="e.g. Bangalore">
            </div>
            <div class="form-group">
              <label class="form-label">State</label>
              <input type="text" id="co-state" class="form-input" required placeholder="e.g. Karnataka">
            </div>
          </div>

          <!-- Payment Options -->
          <div style="margin-top:14px;">
            <label class="form-label">Payment Method</label>
            <div class="payment-methods-grid">
              <div class="payment-method-card selected" id="pm-cod" onclick="selectPaymentMethod('COD')">
                <div class="payment-method-icon">💵</div>
                <div class="payment-method-name">Cash on Delivery</div>
              </div>
              <div class="payment-method-card" id="pm-upi" onclick="selectPaymentMethod('UPI')">
                <div class="payment-method-icon">📱</div>
                <div class="payment-method-name">UPI / QR Code</div>
              </div>
              <div class="payment-method-card" id="pm-card" onclick="selectPaymentMethod('Card')">
                <div class="payment-method-icon">💳</div>
                <div class="payment-method-name">Credit / Debit Card</div>
              </div>
            </div>
          </div>

          <!-- Total Summary Pill -->
          <div style="background:var(--bg-surface);border:1px solid var(--border-medium);border-radius:var(--radius-sm);padding:14px 18px;display:flex;justify-content:space-between;align-items:center;margin:10px 0;">
            <span style="font-size:14px;color:var(--text-secondary)">Total Amount to Pay:</span>
            <strong style="font-family:var(--font-serif);font-size:22px;color:var(--accent-gold);">₹${total.toLocaleString()}</strong>
          </div>

          <button type="submit" class="btn-primary" id="btn-place-order" style="width:100%;justify-content:center;padding:14px;">
            Confirm & Place Insured Order →
          </button>
        </form>
      </div>
    </div>
  `;
}

function selectPaymentMethod(method) {
  document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById(`pm-${method.toLowerCase()}`);
  if (card) card.classList.add('selected');
}

function closeCheckoutModal() {
  const overlay = document.getElementById('checkout-modal-overlay');
  if (overlay) overlay.remove();
}

async function handlePlaceOrder(e, total, couponCode) {
  e.preventDefault();
  const btn = document.getElementById('btn-place-order');
  btn.textContent = 'Processing in MongoDB…';
  btn.disabled = true;

  const fullName = document.getElementById('co-name').value.trim();
  const phone = document.getElementById('co-phone').value.trim();
  const street = document.getElementById('co-street').value.trim();
  const city = document.getElementById('co-city').value.trim();
  const state = document.getElementById('co-state').value.trim();
  const pincode = document.getElementById('co-pincode').value.trim();

  const activePaymentCard = document.querySelector('.payment-method-card.selected');
  const paymentMethod = activePaymentCard ? activePaymentCard.id.replace('pm-', '').toUpperCase() : 'COD';

  try {
    const res = await apiFetch('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({
        address: { fullName, phone, street, city, state, pincode },
        paymentMethod,
        couponCode
      })
    });

    closeCheckoutModal();
    appliedCoupon = null;
    showToast(`🎉 Order #${res.orderNumber} confirmed! Stored in MongoDB.`, 'success');
    refreshBadges();
    navigate('#orders');
  } catch (err) {
    btn.textContent = 'Confirm & Place Insured Order →';
    btn.disabled = false;
    showToast(err.message, 'error');
  }
}

// ─── USER ORDERS & TRACKING PAGE ───────────────────────────────
registerRoute('#orders', async () => {
  const content = document.getElementById('page-content');
  if (!Auth.isLoggedIn()) {
    navigate('#auth');
    return;
  }

  content.innerHTML = `
    <div style="background:var(--bg-deep);border-bottom:1px solid var(--border-subtle);padding:40px 40px 24px;">
      <div style="max-width:900px;margin:0 auto;">
        <h1 style="font-family:var(--font-serif);font-size:36px;color:var(--text-primary);margin-bottom:6px;">My Acquisitions & Orders</h1>
        <p style="color:var(--text-secondary);font-size:15px;">Track your handcrafted art shipments and view digital certificates</p>
      </div>
    </div>

    <section class="section">
      <div class="orders-list" id="orders-container">
        <div class="skeleton" style="height:220px;border-radius:14px;"></div>
      </div>
    </section>
  `;

  loadOrdersView();
});

async function loadOrdersView() {
  const container = document.getElementById('orders-container');
  try {
    const orders = await apiFetch('/orders');

    if (!orders.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3>No Art Orders Found</h3>
          <p>You haven't acquired any artworks yet. Explore our curated collections.</p>
          <a href="#all" class="btn-primary">Browse Masterpieces</a>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <div class="order-num">Order #${order.orderNumber}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
              Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} · ${order.paymentMethod} (${order.paymentStatus})
            </div>
          </div>
          <span class="order-status-pill">${order.status}</span>
        </div>

        <!-- Visual Tracking Progress Bar -->
        <div class="tracking-timeline">
          <div class="timeline-step active">
            <div class="timeline-dot">✓</div>
            <span class="timeline-label">Order Placed</span>
          </div>
          <div class="timeline-step ${order.status !== 'Confirmed' ? 'active' : ''}">
            <div class="timeline-dot">🎨</div>
            <span class="timeline-label">Artisan Workshop</span>
          </div>
          <div class="timeline-step ${order.status === 'Shipped' || order.status === 'Delivered' ? 'active' : ''}">
            <div class="timeline-dot">✈</div>
            <span class="timeline-label">Insured Transit</span>
          </div>
          <div class="timeline-step ${order.status === 'Delivered' ? 'active' : ''}">
            <div class="timeline-dot">🏠</div>
            <span class="timeline-label">Delivered</span>
          </div>
        </div>

        <!-- Ordered Items List -->
        <div style="margin:20px 0;display:flex;flex-direction:column;gap:12px;">
          ${order.items.map(item => `
            <div style="display:flex;align-items:center;gap:14px;background:var(--bg-surface);padding:10px 14px;border-radius:var(--radius-sm);">
              <img src="${item.image}" alt="${item.name}" style="width:50px;height:50px;border-radius:var(--radius-xs);object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=100&q=80'">
              <div style="flex:1;">
                <div style="font-weight:600;font-size:14px;">${item.name}</div>
                <div style="font-size:12px;color:var(--text-muted);">Qty: ${item.qty} × ₹${item.price.toLocaleString()}</div>
              </div>
              <div style="font-family:var(--font-serif);font-weight:700;color:var(--accent-gold);">
                ₹${(item.price * item.qty).toLocaleString()}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Order Summary & Shipping Address -->
        <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border-subtle);padding-top:14px;font-size:13px;color:var(--text-secondary);flex-wrap:wrap;gap:12px;">
          <div>
            <strong>Insured Shipping Destination:</strong><br>
            ${order.address.fullName}, ${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}
          </div>
          <div style="text-align:right;">
            <span>Total Paid: </span>
            <strong style="font-family:var(--font-serif);font-size:18px;color:var(--accent-gold);margin-left:6px;">₹${order.total.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Failed to load orders</h3><p>${err.message}</p></div>`;
  }
}

// ─── USER WISHLIST PAGE ────────────────────────────────────────
registerRoute('#wishlist', async () => {
  const content = document.getElementById('page-content');
  if (!Auth.isLoggedIn()) {
    content.innerHTML = `
      <div class="auth-page">
        <div class="empty-state">
          <div class="empty-state-icon">♡</div>
          <h3>Your Wishlist is Empty</h3>
          <p>Please sign in to view and manage your saved masterpieces.</p>
          <a href="#auth" class="btn-primary">Sign In</a>
        </div>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div style="background:var(--bg-deep);border-bottom:1px solid var(--border-subtle);padding:40px 40px 24px;">
      <div style="max-width:1320px;margin:0 auto;">
        <h1 style="font-family:var(--font-serif);font-size:36px;color:var(--text-primary);margin-bottom:6px;">Saved Artworks</h1>
        <p style="color:var(--text-secondary);font-size:15px;">Your private curated gallery of pieces to acquire</p>
      </div>
    </div>

    <section class="section">
      <div class="product-grid" id="wishlist-grid">
        ${[1, 2, 3].map(() => renderSkeletonCard()).join('')}
      </div>
    </section>
  `;

  loadWishlistView();
});

async function loadWishlistView() {
  const grid = document.getElementById('wishlist-grid');
  try {
    const items = await apiFetch('/wishlist');
    if (!items.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">♡</div>
          <h3>No Artworks in Wishlist</h3>
          <p>Click the heart icon on any artwork to curate your personal collection.</p>
          <a href="#all" class="btn-primary">Browse Artworks</a>
        </div>
      `;
      return;
    }
    grid.innerHTML = items.map(p => renderProductCard(p)).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>Failed to load wishlist</h3><p>${err.message}</p></div>`;
  }
}

// ─── AUTHENTICATION PAGE ───────────────────────────────────────
registerRoute('#auth', () => {
  if (Auth.isLoggedIn()) {
    navigate('#home');
    return;
  }

  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Collector Access</h2>
          <p>Sign in to acquire artworks or create a collector profile</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab active" id="tab-login" onclick="switchAuthMode('login')">Sign In</button>
          <button class="auth-tab" id="tab-signup" onclick="switchAuthMode('signup')">Create Account</button>
        </div>

        <div id="auth-alert" class="auth-alert"></div>

        <!-- LOGIN FORM -->
        <form id="form-login" onsubmit="handleLoginSubmit(event)">
          <div class="form-group" style="margin-bottom:16px;">
            <label class="form-label">Registered Phone Number</label>
            <input type="tel" id="login-phone" class="form-input" required placeholder="10-digit mobile number" maxlength="10">
          </div>

          <div class="form-group" style="margin-bottom:24px;">
            <label class="form-label">Password</label>
            <input type="password" id="login-password" class="form-input" required placeholder="Your secret password">
          </div>

          <button type="submit" class="btn-primary" style="width:100%;justify-content:center;">
            Sign In to Account →
          </button>
        </form>

        <!-- SIGNUP FORM -->
        <form id="form-signup" style="display:none;" onsubmit="handleSignupSubmit(event)">
          <div class="form-group" style="margin-bottom:14px;">
            <label class="form-label">Full Name</label>
            <input type="text" id="signup-name" class="form-input" required placeholder="Your full name">
          </div>

          <div class="form-group" style="margin-bottom:14px;">
            <label class="form-label">Mobile Phone Number</label>
            <input type="tel" id="signup-phone" class="form-input" required placeholder="10-digit mobile number" maxlength="10">
          </div>

          <div class="form-group" style="margin-bottom:14px;">
            <label class="form-label">Email Address (Optional)</label>
            <input type="email" id="signup-email" class="form-input" placeholder="collector@artmart.com">
          </div>

          <div class="form-group" style="margin-bottom:24px;">
            <label class="form-label">Create Password</label>
            <input type="password" id="signup-password" class="form-input" required placeholder="At least 6 characters" minlength="6">
          </div>

          <button type="submit" class="btn-primary" style="width:100%;justify-content:center;">
            Create Collector Account →
          </button>
        </form>
      </div>
    </div>
  `;
});

function switchAuthMode(mode) {
  const loginForm = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  const loginTab = document.getElementById('tab-login');
  const signupTab = document.getElementById('tab-signup');
  const alert = document.getElementById('auth-alert');

  if (alert) { alert.className = 'auth-alert'; alert.textContent = ''; }

  if (mode === 'login') {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    loginTab.classList.remove('active');
    signupTab.classList.add('active');
  }
}

function showAuthAlert(msg, type = 'error') {
  const alert = document.getElementById('auth-alert');
  if (alert) {
    alert.className = `auth-alert ${type}`;
    alert.textContent = msg;
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('login-phone').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
    Auth.login(res.token, res.name, res.phone, res.userId);
    showToast(`Welcome back, ${res.name}!`, 'success');
    navigate('#home');
  } catch (err) {
    showAuthAlert(err.message, 'error');
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const phone = document.getElementById('signup-phone').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  try {
    const res = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, phone, email, password })
    });
    Auth.login(res.token, res.name, res.phone, res.userId);
    showToast(`Welcome to ART!ST'S MERCHANDISE, ${res.name}! 🎉`, 'success');
    navigate('#home');
  } catch (err) {
    showAuthAlert(err.message, 'error');
  }
}

// ─── Window Globals for Inline Handlers ────────────────────────
window.navigate = navigate;
window.handleAddToCart = handleAddToCart;
window.toggleWishlist = toggleWishlist;
window.openProductQuickView = openProductQuickView;
window.closeModal = closeModal;
window.closeModalOnOverlay = closeModalOnOverlay;
window.switchQvImage = switchQvImage;
window.stepQvQty = stepQvQty;
window.addToCartFromQv = addToCartFromQv;
window.submitProductReview = submitProductReview;
window.updateCartItemQty = updateCartItemQty;
window.removeCartItem = removeCartItem;
window.clearFullCart = clearFullCart;
window.applyPromoCode = applyPromoCode;
window.openCheckoutModal = openCheckoutModal;
window.selectPaymentMethod = selectPaymentMethod;
window.closeCheckoutModal = closeCheckoutModal;
window.handlePlaceOrder = handlePlaceOrder;
window.sortCatalogProducts = sortCatalogProducts;
window.switchAuthMode = switchAuthMode;
window.handleLoginSubmit = handleLoginSubmit;
window.handleSignupSubmit = handleSignupSubmit;
