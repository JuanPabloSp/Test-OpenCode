import { getProductById } from './products.js';
import { Cart } from './cart.js';
import { showToast } from './toast.js';
import { Auth } from './auth.js';
import { Orders } from './orders.js';

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
        showToast(`${this.dataset.name} añadido (${qty} kg)`);
        closeProductModal();
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

export { toggleCart, toggleAuth, toggleOrders, openProductModal, closeProductModal, toggleTheme, updateAuthUI };
