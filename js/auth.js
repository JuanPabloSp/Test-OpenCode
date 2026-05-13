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

export { Auth };
