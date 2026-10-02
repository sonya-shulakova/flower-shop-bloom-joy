// Cart management
const CART_KEY = 'flowerShopCart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function getCurrentFilter() {
  const activeBtn = document.querySelector('.filter-btn.active');
  if (activeBtn && activeBtn.dataset.filter) {
    return activeBtn.dataset.filter;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('filter') || 'all';
}

function refreshProductGrid() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  const isCatalog = window.location.href.includes('catalog');
  const filter = getCurrentFilter();
  renderProducts('products-grid', isCatalog ? filter : 'all', isCatalog ? null : 8);
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: 1
    });
  }

  saveCart(cart);
  showToast(`${product.name} добавлен в корзину`);
  refreshProductGrid();
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  saveCart(cart);
  renderCart();
}

function changeQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }
  saveCart(cart);
  renderCart();
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Render products
function renderProducts(containerId, filter = 'all', limit = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let list = filter === 'all' 
    ? products 
    : products.filter(p => p.category === filter);

  if (limit) list = list.slice(0, limit);

  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#777;grid-column:1/-1">Товары не найдены</p>';
    return;
  }

  const cart = getCart();
  container.innerHTML = list.map(p => {
    const inCart = cart.find(i => i.id === p.id);
    const qty = inCart ? inCart.qty : 0;
    return `
    <article class="product-card" data-id="${p.id}">
      <div class="product-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="desc">${p.desc}</p>
        <div class="product-footer">
          <span class="price">${p.price.toLocaleString('ru-RU')} ₽</span>
          <div class="qty-actions">
            ${qty > 0 ? `<button class="qty-minus" onclick="changeQtyFromCard(${p.id}, -1)" title="Убрать">−</button>` : ''}
            ${qty > 0 ? `<span class="qty-badge">${qty}</span>` : ''}
            <button class="add-to-cart" onclick="addToCart(${p.id})" title="В корзину">+</button>
          </div>
        </div>
      </div>
    </article>
  `}).join('');
}

function changeQtyFromCard(productId, delta) {
  changeQty(productId, delta);
  refreshProductGrid();
}

// Cart page
function renderCart() {
  const container = document.getElementById('cart-items');
  const summary = document.getElementById('cart-summary');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <h2>Корзина пуста</h2>
        <p>Самое время выбрать прекрасный букет 🌸</p>
        <br>
        <a href="catalog.html" class="btn btn-primary">Перейти в каталог</a>
      </div>
    `;
    if (summary) summary.style.display = 'none';
    return;
  }

  if (summary) summary.style.display = 'block';

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <p class="price">${item.price.toLocaleString('ru-RU')} ₽</p>
        <div class="qty-controls">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <div style="text-align:right">
        <p style="font-weight:700;margin-bottom:0.5rem">${(item.price * item.qty).toLocaleString('ru-RU')} ₽</p>
        <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Удалить">✕</button>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = total.toLocaleString('ru-RU') + ' ₽';
}

// Filters
function setupFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      // Сохраняем фильтр в адресной строке
      const url = new URL(window.location.href);
      if (filter === 'all') {
        url.searchParams.delete('filter');
      } else {
        url.searchParams.set('filter', filter);
      }
      window.history.replaceState({}, '', url);

      renderProducts('products-grid', filter);
    });
  });
}

// Mobile menu
function setupMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.textContent = nav.classList.contains('open') ? '✕' : '☰';
    });
    // Close menu when clicking a link
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.textContent = '☰';
      });
    });
  }
}

// Contact form
function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Спасибо! Мы свяжемся с вами в ближайшее время 💐');
    form.reset();
  });
}

async function loadFooter() {
  const placeholder = document.getElementById('footer-placeholder');
  if (!placeholder) return;
  const res = await fetch('footer.html');
  placeholder.innerHTML = await res.text();
}
document.addEventListener('DOMContentLoaded', loadFooter);

// Init
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  setupMobileMenu();
  setupFilters();
  setupContactForm();

  // Page-specific
  if (document.getElementById('products-grid')) {
    const isCatalog = window.location.pathname.includes('catalog') || window.location.href.includes('catalog');
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter') || 'all';
    
    if (isCatalog) {
      // Activate correct filter button
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
      });
      renderProducts('products-grid', filter, null);
    } else {
      renderProducts('products-grid', 'all', 8);
    }
  }

  if (document.getElementById('cart-items')) {
    renderCart();
  }
});
