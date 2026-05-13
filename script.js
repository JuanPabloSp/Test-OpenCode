const COUPONS = {
    FRUTA10: { discount: 0.10, msg: '10% de descuento aplicado' },
    FRESH20: { discount: 0.20, msg: '20% de descuento aplicado' }
};

const DISCOUNTS = {
    1: 15, 3: 20, 7: 10, 12: 25, 18: 10, 22: 15, 25: 20, 31: 15,
    40: 20, 45: 20, 50: 10, 56: 15, 59: 10
};

const LOW_STOCK_IDS = [7, 18, 24, 34, 39, 55, 58];
const OUT_OF_STOCK_IDS = [22];

function getStockLabel(id) {
    if (OUT_OF_STOCK_IDS.includes(id)) return { text: 'Agotado', cls: 'out' };
    if (LOW_STOCK_IDS.includes(id)) return { text: 'Poco stock', cls: 'low' };
    return null;
}

function playSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'cart') {
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        } else if (type === 'fav') {
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        }
    } catch (e) {}
}

function showToast(msg, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' toast-error' : '');
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

const Auth = {
    key: 'fruteria_user',
    getUser() {
        try {
            return JSON.parse(localStorage.getItem(this.key));
        } catch {
            return null;
        }
    },
    login(email) {
        const users = this._getUsers();
        const user = users.find(u => u.email === email);
        if (!user) return { ok: false, msg: 'Usuario no encontrado' };
        localStorage.setItem(this.key, JSON.stringify({ name: user.name, email: user.email }));
        return { ok: true };
    },
    register(name, email) {
        const users = this._getUsers();
        if (users.find(u => u.email === email)) {
            return { ok: false, msg: 'El email ya está registrado' };
        }
        users.push({ name, email });
        localStorage.setItem('fruteria_users', JSON.stringify(users));
        localStorage.setItem(this.key, JSON.stringify({ name, email }));
        return { ok: true };
    },
    logout() {
        localStorage.removeItem(this.key);
    },
    _getUsers() {
        try {
            return JSON.parse(localStorage.getItem('fruteria_users')) || [];
        } catch {
            return [];
        }
    }
};

const Orders = {
    key: 'fruteria_orders',
    getAll() {
        try {
            return JSON.parse(localStorage.getItem(this.key)) || [];
        } catch {
            return [];
        }
    },
    save(items, total, user, coupon) {
        const orders = this.getAll();
        orders.unshift({
            id: Date.now(),
            date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price, subtotal: i.price * i.qty })),
            total,
            user: user.name,
            coupon: coupon ? { code: coupon.code, discount: coupon.discount } : null
        });
        localStorage.setItem(this.key, JSON.stringify(orders));
    },
    render() {
        const body = document.getElementById('ordersBody');
        const orders = this.getAll();
        if (!orders.length) {
            body.innerHTML = '<p class="orders-empty">No tienes pedidos aún</p>';
            return;
        }
        body.innerHTML = orders.map(o => `
            <div class="order-card">
                <div class="order-card-header">
                    <span>${o.date}</span>
                    <span class="order-status">Entregado</span>
                </div>
                ${o.items.map(i => `
                    <div class="order-card-item">
                        <span>${i.name} × ${i.qty} kg</span>
                        <span>$${i.subtotal.toFixed(2)}</span>
                    </div>
                `).join('')}
                ${o.coupon ? `<div class="order-card-item" style="color:var(--color-primary)">Cupón: ${o.coupon.code} (-${(o.coupon.discount * 100).toFixed(0)}%)</div>` : ''}
                <div class="order-card-total">
                    <span>Total</span>
                    <span>$${o.total.toFixed(2)}</span>
                </div>
            </div>
        `).join('');
    }
};

const Fav = {
    key: 'fruteria_favs',
    items: [],
    init() {
        try {
            this.items = JSON.parse(localStorage.getItem(this.key)) || [];
        } catch { this.items = []; }
    },
    save() {
        localStorage.setItem(this.key, JSON.stringify(this.items));
    },
    toggle(id) {
        const idx = this.items.indexOf(id);
        if (idx > -1) this.items.splice(idx, 1);
        else this.items.push(id);
        this.save();
        this.updateUI();
    },
    has(id) {
        return this.items.includes(id);
    },
    updateUI() {
        document.querySelectorAll('.fav-btn').forEach(btn => {
            const id = parseInt(btn.closest('.product-card').dataset.id);
            btn.classList.toggle('active', this.has(id));
        });
    }
};

const Cart = {
    items: [],
    key: 'fruteria_cart',
    coupon: null,
    init() {
        this.load();
    },
    load() {
        try {
            const raw = localStorage.getItem(this.key);
            if (raw) {
                const data = JSON.parse(raw);
                this.items = data.items || [];
                this.coupon = data.coupon || null;
            } else {
                this.items = [];
                this.coupon = null;
            }
        } catch {
            this.items = [];
            this.coupon = null;
        }
    },
    save() {
        localStorage.setItem(this.key, JSON.stringify({ items: this.items, coupon: this.coupon }));
    },
    add(id, name, price, img, qty = 1) {
        const existing = this.items.find(i => i.id === id);
        if (existing) {
            existing.qty += qty;
        } else {
            this.items.push({ id, name, price: parseFloat(price), img, qty });
        }
        this.save();
        this.render();
    },
    remove(id) {
        this.items = this.items.filter(i => i.id !== id);
        this.save();
        this.render();
    },
    updateQty(id, delta) {
        const item = this.items.find(i => i.id === id);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) {
            this.remove(id);
            return;
        }
        this.save();
        this.render();
    },
    getSubtotal() {
        return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    },
    getDiscount() {
        if (!this.coupon) return 0;
        return this.getSubtotal() * this.coupon.discount;
    },
    getTotal() {
        return this.getSubtotal() - this.getDiscount();
    },
    getCount() {
        return this.items.reduce((sum, i) => sum + i.qty, 0);
    },
    clear() {
        this.items = [];
        this.coupon = null;
        this.save();
        this.render();
    },
    applyCoupon(code) {
        const coupon = COUPONS[code.toUpperCase()];
        if (!coupon) return false;
        this.coupon = { code: code.toUpperCase(), discount: coupon.discount, msg: coupon.msg };
        this.save();
        this.render();
        return true;
    },
    clearCoupon() {
        this.coupon = null;
        this.save();
        this.render();
    },
    render() {
        const container = document.getElementById('cartItems');
        const totalEl = document.getElementById('totalPrice');
        const badge = document.getElementById('cartBadge');
        const footer = document.getElementById('cartFooter');
        const couponMsg = document.getElementById('couponMsg');
        const couponInput = document.getElementById('couponInput');
        if (!container) return;
        const count = this.getCount();
        if (badge.textContent !== String(count)) {
            badge.textContent = count;
            badge.classList.remove('pop');
            void badge.offsetWidth;
            badge.classList.add('pop');
        } else {
            badge.textContent = count;
        }
        if (count === 0) {
            container.innerHTML = '<p class="cart-empty">Tu carrito está vacío</p>';
            totalEl.textContent = '$0.00';
            if (couponMsg) couponMsg.textContent = '';
            if (couponInput) couponInput.value = '';
            footer.style.display = 'block';
            return;
        }
        container.innerHTML = this.items.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img class="cart-item-img" src="${item.img}" alt="${item.name}" loading="lazy">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" data-id="${item.id}" data-delta="-1">−</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">&times;</button>
            </div>
        `).join('');
        const subtotal = this.getSubtotal();
        const discount = this.getDiscount();
        if (this.coupon && couponMsg) {
            couponMsg.textContent = `${this.coupon.msg} (-$${discount.toFixed(2)})`;
            couponMsg.className = 'ok';
            if (couponInput) couponInput.value = this.coupon.code;
        } else if (couponMsg) {
            couponMsg.textContent = '';
            couponMsg.className = '';
        }
        totalEl.textContent = `$${this.getTotal().toFixed(2)}`;
        container.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.updateQty(btn.dataset.id, parseInt(btn.dataset.delta));
            });
        });
        container.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                this.remove(btn.dataset.id);
            });
        });
    }
};

let allProducts = [];
function getProductById(id) {
    return allProducts.find(x => x.id === id);
}
function getFilteredProducts() {
    const category = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const sortBy = document.getElementById('sortSelect').value;
    let filtered = allProducts.filter(p => {
        if (category !== 'all' && category !== 'favoritos' && p.category !== category) return false;
        if (category === 'favoritos' && !Fav.has(p.id)) return false;
        if (searchTerm && !p.name.toLowerCase().includes(searchTerm)) return false;
        return true;
    });
    switch (sortBy) {
        case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
        case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
        case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return filtered;
}
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!products.length) {
        grid.innerHTML = '<p class="no-results">No se encontraron productos</p>';
        return;
    }
    grid.innerHTML = products.map(p => {
        const discount = DISCOUNTS[p.id];
        const oldPrice = discount ? p.price / (1 - discount / 100) : null;
        const stock = getStockLabel(p.id);
        return `
        <article class="product-card fade-in" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-category="${p.category}" data-image="${p.image}" data-alt="${p.alt}">
            <div class="product-image">
                <img src="${p.image}" alt="${p.alt}" loading="lazy">
                ${discount ? `<span class="discount-badge">-${discount}%</span>` : ''}
                <div class="quick-view-overlay">
                    <button class="quick-view-btn">Vista rápida</button>
                </div>
                <button class="fav-btn ${Fav.has(p.id) ? 'active' : ''}" data-id="${p.id}" aria-label="Favorito">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
            </div>
            <div class="product-info">
                <span class="product-category">${p.category}</span>
                <h3>${p.name}</h3>
                <p class="product-price">
                    ${oldPrice ? `<span class="old">$${oldPrice.toFixed(2)}</span>` : ''}
                    $${p.price.toFixed(2)}/kg
                </p>
                ${stock ? `<span class="stock-indicator ${stock.cls}">${stock.text}</span>` : ''}
                <div class="qty-selector">
                    <button class="qty-sel-down" type="button">−</button>
                    <input type="number" class="qty-sel-input" value="1" min="1" max="99" readonly>
                    <button class="qty-sel-up" type="button">+</button>
                </div>
                <button class="btn-add">Añadir</button>
            </div>
        </article>`;
    }).join('');
    observeCards();
    setupAddButtons();
}
function loadProducts() {
    try {
        const el = document.getElementById('productsData');
        allProducts = JSON.parse(el.textContent);
        renderProducts(getFilteredProducts());
        setTimeout(() => document.getElementById('loader')?.classList.add('hidden'), 300);
    } catch (err) {
        console.error('Error al cargar productos:', err);
        document.getElementById('loader')?.classList.add('hidden');
    }
}
function observeCards() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}
function setupAddButtons() {
    document.querySelectorAll('.qty-sel-down').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.nextElementSibling;
            let val = parseInt(input.value) || 1;
            if (val > 1) input.value = val - 1;
        });
    });
    document.querySelectorAll('.qty-sel-up').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.previousElementSibling;
            let val = parseInt(input.value) || 1;
            if (val < 99) input.value = val + 1;
        });
    });
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const card = this.closest('.product-card');
            const id = parseInt(card.dataset.id);
            const name = card.dataset.name;
            const price = parseFloat(card.dataset.price);
            const img = card.dataset.image;
            const qty = parseInt(card.querySelector('.qty-sel-input').value) || 1;
            Cart.add(id, name, price, img, qty);
            playSound('cart');
            showToast(`${name} añadido (${qty} kg)`);
        });
    });
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            Fav.toggle(id);
            playSound('fav');
            showToast(Fav.has(id) ? 'Añadido a favoritos' : 'Eliminado de favoritos');
        });
    });
}

function toggleCart(open) {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    const isOpen = sidebar.classList.contains('active');
    if (open === undefined) open = !isOpen;
    sidebar.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
}
function toggleAuth(open) {
    const modal = document.getElementById('authModal');
    const overlay = document.getElementById('authOverlay');
    const isOpen = modal.classList.contains('active');
    if (open === undefined) open = !isOpen;
    modal.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
}
function toggleOrders(open) {
    const modal = document.getElementById('ordersModal');
    const overlay = document.getElementById('ordersOverlay');
    const isOpen = modal.classList.contains('active');
    if (open === undefined) open = !isOpen;
    modal.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) Orders.render();
}
function openProductModal(id) {
    const p = getProductById(id);
    if (!p) return;
    const modal = document.getElementById('productModal');
    const overlay = document.getElementById('productModalOverlay');
    const content = document.getElementById('productModalContent');
    content.innerHTML = `
        <img src="${p.image}" alt="${p.alt}" loading="lazy">
        <span class="product-category">${p.category}</span>
        <h2>${p.name}</h2>
        <p class="product-price">$${p.price.toFixed(2)}/kg</p>
        <p style="color:var(--color-text-light);margin-bottom:1rem;font-size:0.9rem;">
            Fruta fresca de la mejor calidad. Directo del campo a tu mesa.
        </p>
        <div class="qty-selector">
            <button class="qty-sel-down" type="button">−</button>
            <input type="number" class="qty-sel-input" value="1" min="1" max="99" readonly>
            <button class="qty-sel-up" type="button">+</button>
        </div>
        <button class="btn-add" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image}">Añadir al carrito</button>
        <button class="share-btn" data-name="${p.name}" data-url="${window.location.href.split('?')[0].split('#')[0]}">Compartir</button>
    `;
    modal.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    content.querySelector('.qty-sel-down').addEventListener('click', function () {
        const input = this.nextElementSibling;
        let val = parseInt(input.value) || 1;
        if (val > 1) input.value = val - 1;
    });
    content.querySelector('.qty-sel-up').addEventListener('click', function () {
        const input = this.previousElementSibling;
        let val = parseInt(input.value) || 1;
        if (val < 99) input.value = val + 1;
    });
    content.querySelector('.btn-add').addEventListener('click', function () {
        const qty = parseInt(content.querySelector('.qty-sel-input').value) || 1;
        Cart.add(parseInt(this.dataset.id), this.dataset.name, parseFloat(this.dataset.price), this.dataset.image, qty);
        playSound('cart');
        showToast(`${this.dataset.name} añadido (${qty} kg)`);
        closeProductModal();
    });
    content.querySelector('.share-btn').addEventListener('click', function () {
        const name = this.dataset.name;
        const url = this.dataset.url;
        const text = `🍊 ${name} - Frutería Fresh`;
        if (navigator.share) {
            navigator.share({ title: name, text, url }).catch(() => {});
        } else {
            const w = window.open('', '_blank', 'width=400,height=500');
            w.document.write(`
                <html><head><title>Compartir</title>
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <style>body{font-family:sans-serif;padding:2rem;text-align:center}
                a{display:block;margin:1rem 0;padding:1rem;border-radius:12px;text-decoration:none;font-weight:600;color:#fff}
                .wa{background:#25D366}.fb{background:#1877F2}.tw{background:#1DA1F2}.cp{background:#666}
                input{width:100%;padding:0.75rem;border:2px solid #ddd;border-radius:8px;margin-top:1rem;font-size:0.9rem}
                </style></head><body>
                <h3>Compartir ${name}</h3>
                <a class="wa" href="https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}" target="_blank">WhatsApp</a>
                <a class="fb" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}" target="_blank">Facebook</a>
                <a class="tw" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}" target="_blank">Twitter</a>
                <input type="text" value="${url}" readonly onclick="this.select()" style="text-align:center">
                <p style="color:#888;font-size:0.8rem;margin-top:1rem">Copiar enlace</p>
                </body></html>
            `);
        }
    });
}
function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('productModalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}
function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('fruteria_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}
function updateAuthUI() {
    const user = Auth.getUser();
    const btn = document.getElementById('authBtn');
    const ordersBtn = document.getElementById('ordersBtn');
    if (user) {
        btn.textContent = user.name;
        btn.classList.add('logged');
        if (ordersBtn) ordersBtn.classList.add('visible');
    } else {
        btn.textContent = 'Iniciar Sesión';
        btn.classList.remove('logged');
        if (ordersBtn) ordersBtn.classList.remove('visible');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    Cart.init();
    Cart.render();
    Fav.init();
    updateAuthUI();
    if (localStorage.getItem('fruteria_theme') === 'dark') {
        document.body.classList.add('dark');
    }
    loadProducts();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    document.getElementById('productsGrid').addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (!card) return;
        if (e.target.closest('.btn-add, .fav-btn, .qty-sel-down, .qty-sel-up, .qty-sel-input')) return;
        openProductModal(parseInt(card.dataset.id));
    });
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                document.getElementById('navLinks')?.classList.remove('active');
            }
        });
    });
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('active');
    });
    document.getElementById('searchInput').addEventListener('input', () => {
        renderProducts(getFilteredProducts());
    });
    document.getElementById('sortSelect').addEventListener('change', () => {
        renderProducts(getFilteredProducts());
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            renderProducts(getFilteredProducts());
        });
    });
    document.getElementById('cartBtn').addEventListener('click', () => toggleCart(true));
    document.getElementById('cartClose').addEventListener('click', () => toggleCart(false));
    document.getElementById('cartOverlay').addEventListener('click', () => toggleCart(false));
    document.getElementById('clearCartBtn').addEventListener('click', () => {
        if (Cart.getCount() > 0 && confirm('¿Vaciar carrito?')) {
            Cart.clear();
            toggleCart(false);
        }
    });
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (Cart.getCount() === 0) return;
        const user = Auth.getUser();
        if (!user) {
            toggleCart(false);
            toggleAuth(true);
            return;
        }
        Orders.save(Cart.items, Cart.getTotal(), user, Cart.coupon);
        Cart.clear();
        toggleCart(false);
        showToast('✓ Pedido realizado con éxito');
    });
    document.getElementById('authBtn').addEventListener('click', () => {
        const user = Auth.getUser();
        if (user) {
            if (confirm(`Cerrar sesión de ${user.name}?`)) {
                Auth.logout();
                updateAuthUI();
            }
        } else {
            toggleAuth(true);
        }
    });
    document.getElementById('couponApplyBtn').addEventListener('click', () => {
        const input = document.getElementById('couponInput');
        const msg = document.getElementById('couponMsg');
        if (!input.value.trim()) return;
        if (Cart.applyCoupon(input.value.trim())) {
            msg.textContent = 'Descuento aplicado';
            msg.className = 'ok';
        } else {
            msg.textContent = 'Código inválido';
            msg.className = 'error';
        }
    });
    document.getElementById('ordersClose').addEventListener('click', () => toggleOrders(false));
    document.getElementById('ordersOverlay').addEventListener('click', () => toggleOrders(false));
    document.getElementById('ordersBtn').addEventListener('click', () => toggleOrders(true));
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);

    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 400);
    });
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (document.getElementById('cartSidebar').classList.contains('active')) toggleCart(false);
            if (document.getElementById('authModal').classList.contains('active')) toggleAuth(false);
            if (document.getElementById('ordersModal').classList.contains('active')) toggleOrders(false);
            if (document.getElementById('productModal').classList.contains('active')) closeProductModal();
        }
        if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    });

    document.getElementById('productModalClose').addEventListener('click', closeProductModal);
    document.getElementById('productModalOverlay').addEventListener('click', closeProductModal);
    document.getElementById('authClose').addEventListener('click', () => toggleAuth(false));
    document.getElementById('authOverlay').addEventListener('click', () => toggleAuth(false));
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
        });
    });
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const result = Auth.login(email);
        if (result.ok) {
            updateAuthUI();
            toggleAuth(false);
            e.target.reset();
        } else {
            alert(result.msg);
        }
    });
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const result = Auth.register(name, email);
        if (result.ok) {
            updateAuthUI();
            toggleAuth(false);
            e.target.reset();
        } else {
            alert(result.msg);
        }
    });
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('.btn-primary');
            const original = btn.textContent;
            btn.textContent = '✓ Enviado';
            btn.style.background = '#8bc34a';
            setTimeout(() => {
                btn.textContent = original;
                btn.style.background = '';
            }, 2000);
            contactForm.reset();
        });
    }
    const newsForm = document.getElementById('newsletterForm');
    if (newsForm) {
        newsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail').value;
            const subs = JSON.parse(localStorage.getItem('fruteria_newsletter') || '[]');
            if (subs.includes(email)) {
                document.getElementById('newsletterMsg').textContent = 'Ya estás suscrito';
                return;
            }
            subs.push(email);
            localStorage.setItem('fruteria_newsletter', JSON.stringify(subs));
            document.getElementById('newsletterMsg').textContent = '¡Suscripción exitosa!';
            newsForm.reset();
        });
    }
});

