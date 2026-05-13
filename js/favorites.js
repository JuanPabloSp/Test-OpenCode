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

export { Fav };
