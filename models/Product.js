const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  customId: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['pencil', 'wood', 'origami', 'thread', 'pottery', 'glass', 'canvas'],
    index: true 
  },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  stock: { type: Number, required: true, default: 5 },
  image: { type: String, required: true },
  gallery: [{ type: String }],
  desc: { type: String, required: true },
  artist: {
    name: { type: String, default: 'Artisan Master' },
    bio: { type: String, default: 'Crafted with passion in traditional atelier studio.' },
    location: { type: String, default: 'Jaipur, India' },
    avatar: { type: String }
  },
  dimensions: { type: String, default: 'Standard Art Size' },
  medium: { type: String, default: 'Mixed Media Handcrafted' },
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 18 },
  featured: { type: Boolean, default: false },
  badge: { type: String },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
