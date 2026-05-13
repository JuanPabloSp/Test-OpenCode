import { Cart } from './cart.js';
import { Fav } from './favorites.js';
import { showToast } from './toast.js';

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
    grid.innerHTML = products.map(p => `
        <article class="product-card fade-in" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-category="${p.category}" data-image="${p.image}" data-alt="${p.alt}">
            <div class="product-image">
                <img src="${p.image}" alt="${p.alt}" loading="lazy">
                <button class="fav-btn ${Fav.has(p.id) ? 'active' : ''}" data-id="${p.id}" aria-label="Favorito">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
            </div>
            <div class="product-info">
                <span class="product-category">${p.category}</span>
                <h3>${p.name}</h3>
                <p class="product-price">$${p.price.toFixed(2)}/kg</p>
                <div class="qty-selector">
                    <button class="qty-sel-down" type="button">−</button>
                    <input type="number" class="qty-sel-input" value="1" min="1" max="99" readonly>
                    <button class="qty-sel-up" type="button">+</button>
                </div>
                <button class="btn-add">Añadir</button>
            </div>
        </article>
    `).join('');
    observeCards();
    setupAddButtons();
}

async function loadProducts() {
    try {
        const res = await fetch('data/products.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        allProducts = await res.json();
        renderProducts(getFilteredProducts());
        setTimeout(() => document.getElementById('loader')?.classList.add('hidden'), 300);
    } catch (err) {
        console.error('Error al cargar productos:', err);
        document.getElementById('loader')?.classList.add('hidden');
        const grid = document.getElementById('productsGrid');
        if (grid) grid.innerHTML = '<p class="no-results">Error al cargar productos</p>';
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
            showToast(`${name} añadido (${qty} kg)`);
        });
    });
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            Fav.toggle(id);
            showToast(Fav.has(id) ? 'Añadido a favoritos' : 'Eliminado de favoritos');
        });
    });
}

export { loadProducts, getFilteredProducts, renderProducts, getProductById };
