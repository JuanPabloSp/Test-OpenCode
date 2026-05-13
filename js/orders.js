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

export { Orders };
