import { COUPONS } from './utils.js';
import { showToast } from './toast.js';

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
        badge.textContent = count;

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

export { Cart };
