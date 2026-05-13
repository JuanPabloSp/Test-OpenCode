import { Cart } from './cart.js';
import { Auth } from './auth.js';
import { Orders } from './orders.js';
import { Fav } from './favorites.js';
import { showToast } from './toast.js';
import { loadProducts, getFilteredProducts, renderProducts } from './products.js';
import { toggleCart, toggleAuth, toggleOrders, openProductModal, closeProductModal, toggleTheme, updateAuthUI } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    Cart.init();
    Cart.render();
    Fav.init();
    updateAuthUI();

    if (localStorage.getItem('fruteria_theme') === 'dark') {
        document.body.classList.add('dark');
    }

    await loadProducts();

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
