require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Models
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Review = require('./models/Review');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/artmart';

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve static assets from public/ AND root directory for maximum compatibility
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use(express.static(__dirname));

// ─── Helpers ──────────────────────────────────────────────────
const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');
const generateToken = () => crypto.randomBytes(32).toString('hex');
const generateOrderNumber = () => 'AM-' + Math.floor(100000 + Math.random() * 900000);

// ─── Auth Middleware ───────────────────────────────────────────
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const user = await User.findOne({ token });
    if (!user) return res.status(401).json({ error: 'Session expired or invalid token' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Helper to find a product by customId (like 'p1') or Mongo _id
const findProductByIdOrCustomId = async (idOrCustomId) => {
  if (mongoose.Types.ObjectId.isValid(idOrCustomId)) {
    const byId = await Product.findById(idOrCustomId);
    if (byId) return byId;
  }
  return await Product.findOne({ customId: idOrCustomId });
};

// ─── AUTH ROUTES ──────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone number, and password are required' });
    }
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ phone: cleanPhone });
    if (existingUser) {
      return res.status(409).json({ error: 'This phone number is already registered. Please login.' });
    }

    const token = generateToken();
    const newUser = new User({
      name: name.trim(),
      phone: cleanPhone,
      email: email ? email.trim().toLowerCase() : undefined,
      passwordHash: hashPassword(password),
      token
    });

    await newUser.save();

    // Create empty cart for new user
    await Cart.create({ userId: newUser._id, items: [] });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: newUser.token,
      name: newUser.name,
      phone: newUser.phone,
      userId: newUser._id
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone number and password are required' });
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const user = await User.findOne({ phone: cleanPhone, passwordHash: hashPassword(password) });
    if (!user) {
      return res.status(401).json({ error: 'Incorrect phone number or password' });
    }

    // Refresh token on each login
    user.token = generateToken();
    await user.save();

    res.json({
      success: true,
      token: user.token,
      name: user.name,
      phone: user.phone,
      userId: user._id
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({
    userId: req.user._id,
    name: req.user.name,
    phone: req.user.phone,
    email: req.user.email,
    role: req.user.role,
    wishlistCount: req.user.wishlist ? req.user.wishlist.length : 0,
    createdAt: req.user.createdAt
  });
});

// ─── PRODUCTS ROUTES ──────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const { category, sort, featured, search, limit } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category.toLowerCase();
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { desc: regex },
        { category: regex },
        { 'artist.name': regex },
        { medium: regex },
        { tags: regex }
      ];
    }

    let query = Product.find(filter);

    if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else if (sort === 'rating') query = query.sort({ rating: -1 });
    else if (sort === 'newest') query = query.sort({ createdAt: -1 });
    else query = query.sort({ featured: -1, rating: -1, _id: 1 });

    if (limit) query = query.limit(parseInt(limit, 10));

    const products = await query.exec();
    // Map customId as id for backward compatibility
    const mapped = products.map(p => ({
      ...p.toObject(),
      id: p.customId || p._id.toString()
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Failed to retrieve artworks' });
  }
});

app.get('/api/products/featured', async (req, res) => {
  try {
    const featured = await Product.find({ featured: true }).limit(6);
    res.json(featured.map(p => ({ ...p.toObject(), id: p.customId || p._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

app.get('/api/products/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json([]);

    const regex = new RegExp(q.trim(), 'i');
    const results = await Product.find({
      $or: [
        { name: regex },
        { desc: regex },
        { category: regex },
        { 'artist.name': regex },
        { medium: regex },
        { tags: regex }
      ]
    }).limit(8);

    res.json(results.map(p => ({ ...p.toObject(), id: p.customId || p._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await findProductByIdOrCustomId(req.params.id);
    if (!product) return res.status(404).json({ error: 'Artwork not found' });

    // Fetch related items in same category
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(3);

    // Fetch reviews
    const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });

    res.json({
      ...product.toObject(),
      id: product.customId || product._id.toString(),
      related: related.map(r => ({ ...r.toObject(), id: r.customId || r._id.toString() })),
      reviews
    });
  } catch (err) {
    console.error('Product details error:', err);
    res.status(500).json({ error: 'Error loading artwork details' });
  }
});

// ─── REVIEWS ROUTES ───────────────────────────────────────────
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const product = await findProductByIdOrCustomId(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

app.post('/api/products/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ error: 'Rating and comment are required' });
    }

    const product = await findProductByIdOrCustomId(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const review = new Review({
      product: product._id,
      user: req.user._id,
      userName: req.user.name,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment.trim()
    });

    await review.save();

    // Recalculate product rating
    const allReviews = await Review.find({ product: product._id });
    const avgRating = (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1);
    product.rating = parseFloat(avgRating);
    product.reviewsCount = allReviews.length;
    await product.save();

    res.status(201).json({ success: true, review, rating: product.rating, reviewsCount: product.reviewsCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post review' });
  }
});

// ─── WISHLIST ROUTES ──────────────────────────────────────────
app.get('/api/wishlist', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    const items = (user.wishlist || []).map(p => ({
      ...p.toObject(),
      id: p.customId || p._id.toString()
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load wishlist' });
  }
});

app.post('/api/wishlist/toggle/:productId', authMiddleware, async (req, res) => {
  try {
    const product = await findProductByIdOrCustomId(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const user = await User.findById(req.user._id);
    const index = user.wishlist.indexOf(product._id);
    let wishlisted = false;

    if (index > -1) {
      user.wishlist.splice(index, 1);
      wishlisted = false;
    } else {
      user.wishlist.push(product._id);
      wishlisted = true;
    }

    await user.save();
    res.json({ success: true, wishlisted, count: user.wishlist.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

// ─── CART ROUTES ──────────────────────────────────────────────
app.get('/api/cart', authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Filter out deleted products if any
    const validItems = cart.items.filter(item => item.product != null);
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    const enriched = validItems.map(item => {
      const p = item.product;
      return {
        productId: p.customId || p._id.toString(),
        qty: item.qty,
        product: {
          ...p.toObject(),
          id: p.customId || p._id.toString()
        }
      };
    });

    const subtotal = enriched.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
    const count = enriched.reduce((sum, item) => sum + item.qty, 0);
    const shipping = subtotal >= 2000 || subtotal === 0 ? 0 : 150;
    const total = subtotal + shipping;

    res.json({
      items: enriched,
      subtotal,
      shipping,
      total,
      count
    });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.post('/api/cart/add', authMiddleware, async (req, res) => {
  try {
    const { productId, qty = 1 } = req.body;
    const product = await findProductByIdOrCustomId(productId);
    if (!product) return res.status(404).json({ error: 'Artwork not found' });

    if (product.stock < qty) {
      return res.status(400).json({ error: `Only ${product.stock} items available in stock` });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) cart = new Cart({ userId: req.user._id, items: [] });

    const existingIndex = cart.items.findIndex(i => i.product.toString() === product._id.toString());
    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].qty + Number(qty);
      if (newQty > product.stock) {
        return res.status(400).json({ error: `Cannot exceed available stock of ${product.stock}` });
      }
      cart.items[existingIndex].qty = newQty;
    } else {
      cart.items.push({ product: product._id, qty: Number(qty) });
    }

    cart.updatedAt = new Date();
    await cart.save();

    const totalCount = cart.items.reduce((s, i) => s + i.qty, 0);
    res.json({ success: true, message: 'Added to cart!', count: totalCount });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

app.put('/api/cart/update', authMiddleware, async (req, res) => {
  try {
    const { productId, qty } = req.body;
    const product = await findProductByIdOrCustomId(productId);
    if (!product) return res.status(404).json({ error: 'Artwork not found' });

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const index = cart.items.findIndex(i => i.product.toString() === product._id.toString());
    if (index > -1) {
      if (Number(qty) <= 0) {
        cart.items.splice(index, 1);
      } else {
        if (Number(qty) > product.stock) {
          return res.status(400).json({ error: `Only ${product.stock} pieces available` });
        }
        cart.items[index].qty = Number(qty);
      }
      cart.updatedAt = new Date();
      await cart.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

app.delete('/api/cart/remove/:productId', authMiddleware, async (req, res) => {
  try {
    const product = await findProductByIdOrCustomId(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = cart.items.filter(i => i.product.toString() !== product._id.toString());
      cart.updatedAt = new Date();
      await cart.save();
    }
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

app.delete('/api/cart/clear', authMiddleware, async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [], updatedAt: new Date() });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// ─── ORDERS ROUTES ────────────────────────────────────────────
app.post('/api/orders/checkout', authMiddleware, async (req, res) => {
  try {
    const { address, paymentMethod = 'COD', couponCode } = req.body;
    if (!address || !address.fullName || !address.street || !address.city || !address.pincode) {
      return res.status(400).json({ error: 'Complete delivery address is required' });
    }

    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.product');
    if (!cart || !cart.items.length) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    // Verify stock availability for all items
    for (const item of cart.items) {
      if (!item.product || item.product.stock < item.qty) {
        return res.status(400).json({
          error: `Item "${item.product ? item.product.name : 'Unknown'}" is out of stock or requested quantity exceeds inventory.`
        });
      }
    }

    // Prepare order items and deduct inventory
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const p = item.product;
      orderItems.push({
        product: p._id,
        customId: p.customId,
        name: p.name,
        price: p.price,
        qty: item.qty,
        image: p.image,
        category: p.category
      });
      subtotal += p.price * item.qty;

      // Deduct stock in MongoDB
      p.stock = Math.max(0, p.stock - item.qty);
      await p.save();
    }

    // Calculate discounts and shipping
    let discount = 0;
    if (couponCode) {
      const code = couponCode.trim().toUpperCase();
      if (code === 'ART10') {
        discount = Math.round(subtotal * 0.10); // 10% off
      } else if (code === 'FIRSTART' && subtotal >= 2000) {
        discount = 500; // ₹500 off on ₹2000+
      }
    }

    const shippingFee = (subtotal - discount) >= 2000 ? 0 : 150;
    const total = Math.max(0, subtotal - discount + shippingFee);

    const orderNumber = generateOrderNumber();
    const order = new Order({
      orderNumber,
      userId: req.user._id,
      items: orderItems,
      subtotal,
      discount,
      couponCode: couponCode ? couponCode.trim().toUpperCase() : undefined,
      shippingFee,
      total,
      address,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      status: 'Confirmed'
    });

    await order.save();

    // Clear cart in MongoDB
    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();

    res.status(201).json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      message: 'Order placed successfully! The artisan has been notified.'
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to process order. Please try again.' });
  }
});

app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

app.get('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    let order;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: req.params.id, userId: req.user._id });
    }
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// ─── PLATFORM STATS & CATEGORIES ──────────────────────────────
app.get('/api/categories', async (req, res) => {
  try {
    const counts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id] = c.count; });

    const categories = [
      {
        id: 'pencil',
        name: 'Pencil Arts',
        tagline: 'Hand-drawn heart & soul with graphite precision',
        description: 'From hyperrealistic chiaroscuro portraits to ethereal botanical studies.',
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=900&q=80',
        count: `${countMap['pencil'] || 4} pieces`
      },
      {
        id: 'wood',
        name: 'Wood Art',
        tagline: 'Grown by nature, shaped by timeless master hands',
        description: 'Reclaimed teak reliefs, fluid driftwood sculptures, and delicate marquetry boxes.',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80',
        count: `${countMap['wood'] || 4} pieces`
      },
      {
        id: 'origami',
        name: 'Origami',
        tagline: 'Sculpting mathematical poetry from pure paper',
        description: 'Intricate celestial mobiles, modular polyhedrons, and meditative crane tapestries.',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80',
        count: `${countMap['origami'] || 4} pieces`
      },
      {
        id: 'thread',
        name: 'Thread Arts',
        tagline: 'Dimensional art connected by unbroken spun silk',
        description: 'Algorithmic string mandalas, vibrant gradient hoops, and modern geometric skylines.',
        image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=900&q=80',
        count: `${countMap['thread'] || 4} pieces`
      },
      {
        id: 'pottery',
        name: 'Pottery & Ceramics',
        tagline: 'Beauty born from wheel-thrown earth and flame',
        description: 'High-fired celadon crackle vases, wabi-sabi tea sets, and copper luster raku.',
        image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80',
        count: `${countMap['pottery'] || 4} pieces`
      },
      {
        id: 'glass',
        name: 'Glass Art',
        tagline: 'Light transformed through crystal, flame & lead',
        description: 'Cathedral stained glass panels, free-blown Murano vases, and dichroic wall tiles.',
        image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80',
        count: `${countMap['glass'] || 4} pieces`
      }
    ];

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [totalProducts, totalOrders] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments()
    ]);
    res.json({
      artworks: totalProducts,
      artisans: 14,
      crafts: 6,
      ordersPlaced: totalOrders + 142
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

// ─── Frontend Catch-all ────────────────────────────────────────
app.get('*', (req, res) => {
  // Try public/index.html first, fallback to index.html in root
  const publicIndex = path.join(__dirname, 'public/index.html');
  res.sendFile(publicIndex);
});

// ─── Initialize Database & Start Server ────────────────────────
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB at:', MONGODB_URI);

    // Auto seed if empty
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('⚡ Product collection empty. Running automatic seed...');
      const { seedDatabase } = require('./seed');
      await seedDatabase();
    } else {
      console.log(`📦 Loaded ${count} artworks from MongoDB.`);
    }

    app.listen(PORT, () => {
      console.log(`🎨 ART!ST'S MERCHANDISE running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

startServer();
