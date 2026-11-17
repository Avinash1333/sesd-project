# 🎨 ART!ST'S MERCHANDISE — Handcrafted Art Gallery & Marketplace

> An artisan e-commerce web application connecting collectors with master craftsmen across six traditional disciplines, backed by **MongoDB & Mongoose** and styled with an artisan gallery dark theme.

---

## 🌟 Key Features

- **🗄️ Full MongoDB Database Architecture**:
  - Powered by **Mongoose ODM** with structured schemas for `User`, `Product`, `Cart`, `Order`, and `Review`.
  - Auto-seeding with 24 handcrafted artworks across 6 heritage disciplines.
  - Automatic atomic stock deduction on checkout.
  - Persistent user cart, orders history, customer appraisals, and personal wishlist.

- **💎 Luxury Artisan Dark Design System**:
  - Obsidian dark canvas (`#0e0d0a`) accented with warm terracotta (`#e06d3b`) and radiant amber gold (`#e8a83a`).
  - High-end typography: *Playfair Display* serif headlines + *Plus Jakarta Sans* body text.
  - Frosted glassmorphism sticky navigation with real-time cart & wishlist counter badges.
  - Live search bar with instant autocomplete dropdown previewing artwork thumbnails, discipline, artist, and price.

- **🖼️ Curated Art Disciplines**:
  1. **Pencil Arts**: Chiaroscuro portraits, botanical studies, architectural drafts.
  2. **Wood Art**: Reclaimed teak wall panels, fluid driftwood sculptures, inlaid walnut keepsake chests.
  3. **Origami**: Hand-folded celestial mobiles, 100 peace cranes canvases, modular polyhedrons.
  4. **Thread Arts**: Spun silk string mandalas, gradient aurora radial hoops, computational portraits.
  5. **Pottery & Ceramics**: Wheel-thrown celadon crackle vessels, wabi-sabi tea sets, copper luster raku.
  6. **Glass Art**: Cathedral leaded stained glass, free-blown Murano crystal vases, dichroic prism tiles.

- **✨ Interactive Collector Experience**:
  - **Quick View & Details Modal**: High-res multi-angle gallery thumbnails, artisan bio & studio location card, framing and medium specifications, verified reviews list, appraisal submission form, and quantity picker.
  - **Wishlist**: Real-time heart toggle with micro-animations and dedicated saved collection view.
  - **Smart Cart**:
    - Free Insured Shipping progress bar (qualify on orders over ₹2,000).
    - Promo Code engine (`ART10` for 10% off, `FIRSTART` for ₹500 off).
    - Real-time quantity steppers and instant subtotal recalculation.
  - **Insured Checkout & Order Tracking**:
    - Delivery destination form with pincode and phone verification.
    - Payment methods: Cash on Delivery (COD), UPI / QR Code, Credit/Debit Card.
    - Real-time visual tracking timeline: `Order Placed` ➔ `Artisan Workshop` ➔ `Insured Transit` ➔ `Delivered`.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** running locally on default port `27017` (e.g. `mongodb://127.0.0.1:27017/artmart`) or a remote MongoDB Atlas URI in `.env`.

### 2. Environment Configuration
Create or inspect the `.env` file in the project root:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/artmart
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed the Database
Seed the 24 curated artworks and sample reviews into MongoDB:
```bash
npm run seed
```

### 5. Start the Server
```bash
npm start
```

Open your browser at:
```
http://localhost:3000
```

---

## 📡 REST API Documentation

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new collector (`name`, `phone`, `password`, `email`) |
| `POST` | `/api/auth/login` | Sign in with phone & password, returns session token |
| `GET` | `/api/auth/me` | Fetch current authenticated user profile & wishlist count |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Retrieve artworks (supports `?category=`, `?sort=`, `?search=`, `?featured=`) |
| `GET` | `/api/products/featured` | Retrieve featured homepage masterworks |
| `GET` | `/api/products/search?q=...` | Instant search for navbar autocomplete |
| `GET` | `/api/products/:id` | Artwork details, related pieces, and reviews by ID or slug |
| `GET` | `/api/categories` | Categories list with live artwork inventory counts |
| `GET` | `/api/stats` | Global platform metrics |

### Reviews & Appraisals
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products/:id/reviews` | List all verified appraisals for an artwork |
| `POST` | `/api/products/:id/reviews` | Submit a rating (1-5) and appraisal comment *(Auth required)* |

### Wishlist
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/wishlist` | Retrieve user's saved wishlist artworks *(Auth required)* |
| `POST` | `/api/wishlist/toggle/:productId` | Toggle artwork in/out of wishlist *(Auth required)* |

### Cart
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cart` | View cart with calculated subtotal, shipping fee, and items *(Auth required)* |
| `POST` | `/api/cart/add` | Add artwork with quantity `{ productId, qty }` *(Auth required)* |
| `PUT` | `/api/cart/update` | Update quantity `{ productId, qty }` *(Auth required)* |
| `DELETE` | `/api/cart/remove/:productId` | Remove item from cart *(Auth required)* |
| `DELETE` | `/api/cart/clear` | Clear all items from cart *(Auth required)* |

### Orders & Checkout
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/orders/checkout` | Process order, validate stock, apply promo, clear cart *(Auth required)* |
| `GET` | `/api/orders` | Retrieve user's order history sorted by newest first *(Auth required)* |
| `GET` | `/api/orders/:id` | Fetch single order details and tracking timeline *(Auth required)* |

---

## 📂 Project Directory Structure

```
artmart/
├── .env                  # Environment variables (PORT, MONGODB_URI)
├── package.json          # Node dependencies & scripts
├── server.js             # Express API server with MongoDB connection
├── seed.js               # Database seeder (24 artworks + reviews)
├── models/               # Mongoose Data Models
│   ├── User.js           # User schema & credentials
│   ├── Product.js        # Artworks schema & metadata
│   ├── Cart.js           # Shopping cart schema
│   ├── Order.js          # Order & tracking schema
│   └── Review.js         # Collector appraisal reviews
├── public/               # Frontend Assets
│   ├── index.html        # HTML5 shell
│   ├── css/
│   │   └── style.css     # Master artisan design system
│   └── js/
│       └── app.js        # SPA hash router & client API layer
└── README.md             # Project documentation
```
