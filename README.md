# Frutería Fresh 🍊

Proyecto demo de una tienda online de frutas, construida con **HTML + CSS + JavaScript puro** (sin frameworks, sin build tools).

Generado y desarrollado completamente a través de **OpenCode** utilizando **modelos de IA chinos** (opencode/big-pickle) como parte de una prueba de capacidades de asistentes de código automatizados.

## Funcionalidades

- Catálogo de 59 frutas en 7 categorías
- Carrito de compras con persistencia (localStorage)
- Cupones de descuento: `FRUTA10` (10%), `FRESH20` (20%)
- Autenticación simulada (registro/login local)
- Historial de órdenes
- Lista de favoritos / wishlist
- Modo oscuro / claro
- Filtros por categoría + búsqueda
- Modal de detalle de producto
- Vista rápida (hover sobre imagen)
- Selector de cantidad por producto
- Badges de descuento y stock bajo/agotado
- Botón flotante "volver arriba"
- Sonidos (Web Audio API)
- Atajos de teclado (Esc, `/`, Ctrl+K)
- Vista optimizada para impresión
- Offline parcial (Service Worker)
- Compatir en redes sociales (Web Share API + fallback)
- PWA instalable (manifest.json)
- Notificaciones toast
- Suscripción a newsletter

## Cómo usar

### Opción 1 — Abrir directo (file://)
Abre `index.html` en tu navegador.  
Funciona sin servidor gracias a que los datos están embebidos en el HTML como JSON.

### Opción 2 — Servidor local
```bash
python -m http.server 8000
# o
perl server.pl
```
Luego abre `http://localhost:8000`.

> El Service Worker y la API Web Share requieren servidor HTTP.

## Stack

| Capa | Tecnología |
|------|-----------|
| HTML | Semántico, meta tags SEO / PWA / iOS |
| CSS | Variables, flexbox, grid, media queries, `@media print` |
| JS | Vanilla ES6, DOM API, localStorage, Web Audio API |
| Assets | 0 dependencias, 0 librerías externas |

## Estructura

```
test/
├── index.html        # HTML principal + JSON embebido
├── script.js         # Todo el JavaScript (monolítico)
├── sw.js             # Service Worker
├── manifest.json     # PWA manifest
├── server.pl         # Servidor HTTP Perl opcional
├── css/
│   └── styles.css
├── js/               # Módulos ES6 (referencia, no se cargan)
├── data/
│   └── products.json # Datos extraídos (referencia)
└── README.md
```

## Autor

Generado con [OpenCode](https://opencode.ai) usando modelos de IA chinos (serie big-pickle).  2026.
