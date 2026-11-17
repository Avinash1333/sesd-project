require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Review = require('./models/Review');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/artmart';

const products = [
  // ── PENCIL ARTS ──
  {
    customId: 'p1',
    name: 'Realistic Portrait Study',
    category: 'pencil',
    price: 1450,
    originalPrice: 1800,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Hyperrealistic graphite portrait rendered on 300gsm hot-pressed archival cotton paper. Over 60 hours of delicate shading and micro-texture work capture the raw emotion and timeless depth of the human gaze.',
    artist: {
      name: 'Elena Rostova',
      bio: 'Master portraitist trained in traditional chiaroscuro techniques at the Florence Classical Academy.',
      location: 'Florence, Italy',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '18" × 24" (Framed)',
    medium: 'Archival Graphite & Charcoal on Cotton Board',
    rating: 4.9,
    reviewsCount: 24,
    featured: true,
    badge: 'Masterpiece',
    tags: ['Graphite', 'Portrait', 'Archival', 'Monochrome']
  },
  {
    customId: 'p2',
    name: 'Botanical Flora & Fauna Suite',
    category: 'pencil',
    price: 950,
    originalPrice: 1250,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Set of 4 botanical pencil studies depicting wild fern fronds, eucalyptus pods, and highland moss. Drawn with field naturalist precision on tinted cream parchment.',
    artist: {
      name: 'David Sterling',
      bio: 'Botanical illustrator and conservationist documenting endangered highland flora.',
      location: 'Edinburgh, UK',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: 'Set of 4 (8" × 10" each)',
    medium: 'Faber-Castell 9000 Graphite on Cream Parchment',
    rating: 4.8,
    reviewsCount: 16,
    featured: false,
    badge: 'Set of 4',
    tags: ['Botanical', 'Naturalist', 'Pencil', 'Home Decor']
  },
  {
    customId: 'p3',
    name: 'Ethereal Abstract Monolith',
    category: 'pencil',
    price: 1850,
    originalPrice: 2200,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Monumental abstract study exploring tectonic weight, balance, and quiet solitude. Layered carbon powder wash and pressed graphite create velvet deep blacks and shimmering silvers.',
    artist: {
      name: 'Meera Nair',
      bio: 'Contemporary minimalist visual artist exploring stillness and stone architectures.',
      location: 'Kochi, India',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '22" × 30" (Museum Framed)',
    medium: 'Carbon Powder & 8B Graphite on Heavyweight Cold-Press',
    rating: 5.0,
    reviewsCount: 19,
    featured: true,
    badge: 'Rare Find',
    tags: ['Abstract', 'Minimalist', 'Original', 'Gallery Grade']
  },
  {
    customId: 'p4',
    name: 'Architectural Gothic Portal',
    category: 'pencil',
    price: 2100,
    originalPrice: 2500,
    stock: 2,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Intricate architectural study of a medieval cloister archway with vaulted ceilings and stone tracery. Precision perspective and dramatic atmospheric shadows.',
    artist: {
      name: 'Marco Bellini',
      bio: 'Architectural draftsman and historic preservationist focused on Venetian architecture.',
      location: 'Venice, Italy',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '16" × 20"',
    medium: 'Mechanical 0.3mm Graphite & Ink Wash',
    rating: 4.9,
    reviewsCount: 11,
    featured: false,
    badge: 'Limited',
    tags: ['Architecture', 'Gothic', 'Detailed']
  },

  // ── WOOD ART ──
  {
    customId: 'w1',
    name: 'Carved Heritage Teak Panel',
    category: 'wood',
    price: 3800,
    originalPrice: 4500,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Hand-carved solid salvaged Burma teak wall relief. Features intricate floral jaali fretwork and deep dimensional undercut relief, hand-buffed with organic beeswax.',
    artist: {
      name: 'Rajesh Sharma',
      bio: 'Third-generation woodcarver preserving royal Rajasthani architectural fretwork.',
      location: 'Jodhpur, India',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '24" × 36" × 2" Relief',
    medium: 'Century-old Reclaimed Teakwood & Natural Oils',
    rating: 4.9,
    reviewsCount: 31,
    featured: true,
    badge: 'Artisan Heritage',
    tags: ['Teak', 'Carving', 'Wall Panel', 'Handmade']
  },
  {
    customId: 'w2',
    name: 'Organic Driftwood Wave Sculpture',
    category: 'wood',
    price: 5400,
    originalPrice: 6200,
    stock: 2,
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Fluid dynamic free-form wave carved from fallen Nordic coastal juniper. Follows the organic grain twists and knots, sanded to a silk-smooth finish on a blackened iron mount.',
    artist: {
      name: 'Soren Lindqvist',
      bio: 'Scandinavian environmental sculptor creating timeless living forms from weathered timber.',
      location: 'Stockholm, Sweden',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '28" H × 14" W × 10" D',
    medium: 'Weathered Juniper & Satin Iron Base',
    rating: 5.0,
    reviewsCount: 14,
    featured: true,
    badge: 'One-of-a-kind',
    tags: ['Sculpture', 'Driftwood', 'Scandinavian', 'Organic']
  },
  {
    customId: 'w3',
    name: 'Inlaid Walnut Keepsake Chest',
    category: 'wood',
    price: 1250,
    originalPrice: 1600,
    stock: 9,
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Exquisite heirloom keepsake chest hand-crafted from seasoned Kashmiri walnut. Inlaid with polished brass filigree and pearl shell accents, lined with midnight emerald velvet.',
    artist: {
      name: 'Kabir Hussain',
      bio: 'Award-winning master of traditional walnut woodcraft and khatamband joinery.',
      location: 'Srinagar, Kashmir',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '10" L × 6" W × 4.5" H',
    medium: 'Walnut Wood, Brass Inlay, Silk Velvet',
    rating: 4.8,
    reviewsCount: 42,
    featured: false,
    badge: 'Popular Gift',
    tags: ['Keepsake', 'Walnut', 'Inlay', 'Box']
  },
  {
    customId: 'w4',
    name: 'Kinetic Geometric Totem',
    category: 'wood',
    price: 4200,
    originalPrice: 4800,
    stock: 4,
    image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Modular interlocking totem sculpture consisting of 7 hand-turned geometric segments in alternating cherry, maple, and wenge woods. Can be reconfigured to suit personal spatial aesthetics.',
    artist: {
      name: 'Tatsuya Mori',
      bio: 'Kyoto craftsman combining traditional sashimono joinery with modern kinetic design.',
      location: 'Kyoto, Japan',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '32" Height × 6" Diameter',
    medium: 'Solid Cherry, Sugar Maple & African Wenge',
    rating: 4.9,
    reviewsCount: 18,
    featured: false,
    badge: 'Kinetic Art',
    tags: ['Totem', 'Joinery', 'Hand-turned']
  },

  // ── ORIGAMI ──
  {
    customId: 'o1',
    name: 'Suspended Celestial Dragon',
    category: 'origami',
    price: 1950,
    originalPrice: 2400,
    stock: 4,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Complex single-sheet tessellated origami dragon suspended in balanced equilibrium. Folded from handmade Japanese kozo paper treated with microscopic mica dusting that shimmers in moving light.',
    artist: {
      name: 'Kenji Takahashi',
      bio: 'Origami master with 30 years experience folded for installations across Tokyo and Paris.',
      location: 'Nara, Japan',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '16" Wingspan × 20" Drop Mobile',
    medium: 'Handmade Kozo Washi Paper & Titanium Balance Wire',
    rating: 4.9,
    reviewsCount: 22,
    featured: true,
    badge: 'Staff Favorite',
    tags: ['Origami', 'Dragon', 'Washi', 'Kinetic']
  },
  {
    customId: 'o2',
    name: 'Flock of 100 Peace Cranes Canvas',
    category: 'origami',
    price: 2600,
    originalPrice: 3200,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Centennial senbazuru arrangement of 100 precision miniature paper cranes in an ombre spiral gradient on pure linen canvas. A symbol of longevity, tranquility, and good fortune.',
    artist: {
      name: 'Chiyo Tanaka',
      bio: 'Origami artist dedicated to the meditative tradition of folded paper blessing talismans.',
      location: 'Hiroshima, Japan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '20" × 20" Shadowbox Frame',
    medium: 'Chiyogami Paper, UV Glass & Belgian Linen',
    rating: 5.0,
    reviewsCount: 27,
    featured: false,
    badge: 'Symbol of Peace',
    tags: ['Cranes', 'Senbazuru', 'Shadowbox', 'Linen']
  },
  {
    customId: 'o3',
    name: 'Modular Polyhedron Sphere Set',
    category: 'origami',
    price: 1400,
    originalPrice: 1750,
    stock: 7,
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Trio of interlocking kusudama modular polyhedral paper sculptures. Each unit is formed by 30 identically folded modules locked together without a single drop of glue.',
    artist: {
      name: 'Sophie Durand',
      bio: 'Mathematical artist exploring origami tessellations and sacred geometric solids.',
      location: 'Lyon, France',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: 'Set of 3 (4", 6", 8" Diameters)',
    medium: 'French Canson Mi-Teintes 160gsm Art Paper',
    rating: 4.8,
    reviewsCount: 19,
    featured: false,
    badge: 'Set of 3',
    tags: ['Geometric', 'Kusudama', 'Modular', 'Paper Art']
  },
  {
    customId: 'o4',
    name: 'Luminescent Lotus Blossom',
    category: 'origami',
    price: 1800,
    originalPrice: 2200,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Multi-tiered folded paper lotus blossom mounted on turned teakwood with internal micro-filament warm lighting. Casts breathtaking floral geometric shadows across room walls.',
    artist: {
      name: 'Linh Nguyen',
      bio: 'Sculptor merging Southeast Asian papercraft with contemporary architectural lighting.',
      location: 'Hanoi, Vietnam',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '10" Diameter × 7" Height',
    medium: 'Mulberry Fiber Paper & USB Warm Luminary Base',
    rating: 4.9,
    reviewsCount: 15,
    featured: false,
    badge: 'Illuminated',
    tags: ['Lotus', 'Lantern', 'Ambient']
  },

  // ── THREAD ART ──
  {
    customId: 't1',
    name: 'Sacred Fibonacci String Mandala',
    category: 'thread',
    price: 2900,
    originalPrice: 3600,
    stock: 4,
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Geometric masterpiece created by interconnecting over 1,500 meters of iridescent silk threads across 480 hand-hammered solid brass pins. Reveals hypnotizing holographic depth as light plays across the threads.',
    artist: {
      name: 'Ananya Patel',
      bio: 'Pioneer of algorithmic string geometric art and meditative sacred geometry installations.',
      location: 'Ahmedabad, India',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '28" × 28" Solid Matte Black Frame',
    medium: 'Spun Silk Thread, 480 Brass Pins, Velvet Wood Board',
    rating: 5.0,
    reviewsCount: 38,
    featured: true,
    badge: 'Bestseller',
    tags: ['String Art', 'Mandala', 'Silk', 'Geometric']
  },
  {
    customId: 't2',
    name: 'Neon Metropolis Line Study',
    category: 'thread',
    price: 3400,
    originalPrice: 4000,
    stock: 2,
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Architectural nocturnal skyline depicted using high-tensile metallic copper, cobalt, and amber filaments on charcoal felt. Features 3-tier elevation layering giving realistic cityscape depth.',
    artist: {
      name: 'Lucas Silva',
      bio: 'Urban artist exploring the intersection of modern megalopolis geometry and textile craft.',
      location: 'São Paulo, Brazil',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '36" × 24" Deep Shadowbox',
    medium: 'High-tensile Metallic Thread on Acoustic Felt',
    rating: 4.8,
    reviewsCount: 15,
    featured: false,
    badge: 'Architectural',
    tags: ['Cityscape', 'Modern', 'Metallic', 'Thread']
  },
  {
    customId: 't3',
    name: 'Woven Aurora Radial Panel',
    category: 'thread',
    price: 2200,
    originalPrice: 2800,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Concentric gradient weave inspired by northern twilight skies. Blends 18 discrete shades of dyed Egyptian cotton floss hand-tensioned into mathematical parabolic curves.',
    artist: {
      name: 'Maya Lin',
      bio: 'Fiber artist celebrated for color-field gradients and precision string tensioning.',
      location: 'Taichung, Taiwan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '20" Round Walnut Ring',
    medium: 'Mercerized Egyptian Cotton Floss & Walnut Hoop',
    rating: 4.9,
    reviewsCount: 21,
    featured: false,
    badge: 'Gradient Art',
    tags: ['Aurora', 'Gradient', 'Radial']
  },
  {
    customId: 't4',
    name: 'Precision Web Silhouette Portrait',
    category: 'thread',
    price: 3900,
    originalPrice: 4600,
    stock: 2,
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Breathtaking computational string portrait created with a single continuous 3,000-meter unbroken black thread crisscrossing 200 perimeter anchor pins over 4,000 times.',
    artist: {
      name: 'Peter Vance',
      bio: 'Pioneering computational artist translating classical human form into mathematical thread lines.',
      location: 'Berlin, Germany',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '26" Round Aluminum Casing',
    medium: 'Continuous Poly-monofilament on White Composite',
    rating: 5.0,
    reviewsCount: 33,
    featured: true,
    badge: 'Continuous Thread',
    tags: ['Portrait', 'Computational', 'Modern Art']
  },

  // ── POTTERY & CERAMICS ──
  {
    customId: 'pt1',
    name: 'Wheel-Thrown Celadon Crackle Vase',
    category: 'pottery',
    price: 2400,
    originalPrice: 2900,
    stock: 6,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Gracefully thrown stoneware urn inspired by Song Dynasty porcelain. Finished in a soft jade celadon glaze with intricate natural iron crackle veining and an unglazed raw grog foot.',
    artist: {
      name: 'Sunita Rao',
      bio: 'Ceramicist living in Auroville exploring traditional wood-fired kilns and organic mineral glazes.',
      location: 'Auroville, India',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '12" Height × 7" Diameter',
    medium: 'Wood-fired White Stoneware & Iron Celadon Glaze',
    rating: 4.9,
    reviewsCount: 29,
    featured: true,
    badge: 'Artisan Favorite',
    tags: ['Celadon', 'Ceramics', 'Vase', 'Hand-thrown']
  },
  {
    customId: 'pt2',
    name: 'Wabi-Sabi Shino Tea Ensemble',
    category: 'pottery',
    price: 4100,
    originalPrice: 4900,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1576020799627-aeac76d580dc?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576020799627-aeac76d580dc?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Hand-sculpted 5-piece ceremonial tea ensemble: kyusu teapot, 4 chawan cups, and a glazed coaster. Coated in bubbly snow-white feldspathic shino glaze fired for 72 hours in an anagama kiln.',
    artist: {
      name: 'Kaito Sato',
      bio: 'Master potter of Shigaraki carrying on five centuries of wabi-sabi tea ware traditions.',
      location: 'Shigaraki, Japan',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '5-Piece Set (Teapot: 600ml, Cups: 120ml)',
    medium: 'Coarse Shigaraki Clay, Wood-ash Shino Glaze',
    rating: 5.0,
    reviewsCount: 17,
    featured: false,
    badge: '5-Piece Ensemble',
    tags: ['Tea Set', 'Wabi-Sabi', 'Ceramics', 'Anagama']
  },
  {
    customId: 'pt3',
    name: 'Copper Luster Raku Decorative Bowl',
    category: 'pottery',
    price: 1950,
    originalPrice: 2500,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Dramatic raku-fired centerpiece vessel pulled glowing orange from the kiln at 1,000°C and plunged into cedar shavings. Yields dazzling metallic rainbow flashes of copper, purple, and turquoise.',
    artist: {
      name: 'Camille Laurent',
      bio: 'French ceramic sculptor known for explosive reduction firing and textured volcanic slips.',
      location: 'Provence, France',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '14" Diameter × 5" Depth',
    medium: 'Raku Clay Body, Copper Carbonate Reduction',
    rating: 4.8,
    reviewsCount: 23,
    featured: false,
    badge: 'Raku Fired',
    tags: ['Raku', 'Centerpiece', 'Metallic', 'Glaze']
  },
  {
    customId: 'pt4',
    name: 'Ribbed Terracotta Planter & Saucer',
    category: 'pottery',
    price: 1350,
    originalPrice: 1700,
    stock: 9,
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Heavy earthenware planter hand-coiled with architectural vertical fluting and partial buttermilk dip glaze. Porous terracotta allows optimal root respiration and develops a rich natural patina over time.',
    artist: {
      name: 'Arjun Mehta',
      bio: 'Clay artisan blending brutalist architecture motifs with functional botanical pottery.',
      location: 'Kolkata, India',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '9" Height × 8.5" Diameter',
    medium: 'Red Terracotta & Satin White Glaze Dip',
    rating: 4.9,
    reviewsCount: 35,
    featured: false,
    badge: 'Popular',
    tags: ['Planter', 'Terracotta', 'Hand-coiled']
  },

  // ── GLASS ART ──
  {
    customId: 'g1',
    name: 'Cathedral Sunburst Stained Glass Panel',
    category: 'glass',
    price: 4800,
    originalPrice: 5600,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Monumental leaded glass window panel assembled with authentic hand-blown French antique glass, faceted crystal jewels, and hand-rolled kokomo art glass. Bathes any living space in radiant colored light.',
    artist: {
      name: 'Claire Beaumont',
      bio: 'Master glazier preserving medieval European stained glass restoration and contemporary leaded panels.',
      location: 'Strasbourg, France',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '22" × 32" in Solid Brass Frame',
    medium: 'Mouth-blown Antique Glass, Leaded Came & Copper Foil',
    rating: 5.0,
    reviewsCount: 41,
    featured: true,
    badge: 'Museum Quality',
    tags: ['Stained Glass', 'Cathedral', 'Window Panel', 'Leaded']
  },
  {
    customId: 'g2',
    name: 'Hand-Blown Aurora Vessel',
    category: 'glass',
    price: 3600,
    originalPrice: 4400,
    stock: 4,
    image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Fluid asymmetrical art glass vessel hand-blown in the furnaces of Murano. Features suspended ribbons of 24-karat gold leaf, lapis lazuli powder, and aquamarine swirls encased in pure optical crystal.',
    artist: {
      name: 'Matteo Rossi',
      bio: 'Maestro vetraio born into a prestigious glassblowing dynasty in Murano.',
      location: 'Murano, Venice',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '14" Height × 8" Width',
    medium: 'Free-blown Murano Crystal Glass & 24k Gold Flake',
    rating: 4.9,
    reviewsCount: 26,
    featured: true,
    badge: 'Murano Handblown',
    tags: ['Hand-blown', 'Murano', 'Glass Vessel', 'Gold Leaf']
  },
  {
    customId: 'g3',
    name: 'Fused Dichroic Art Glass Tile',
    category: 'glass',
    price: 2100,
    originalPrice: 2700,
    stock: 7,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Multi-layered kiln-cast art glass panel incorporating aerospace dichroic glass coatings that split light into opposite wavelengths. Shimmers from vibrant emerald to violet as you move around it.',
    artist: {
      name: 'Hannah Cole',
      bio: 'British glass artist exploring optical phenomena, refractive prisms, and modern kilnforming.',
      location: 'Bristol, UK',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '12" × 12" with Stand-off Wall Mounts',
    medium: 'Bullseye Fused Glass & Thin-film Dichroic Coatings',
    rating: 4.8,
    reviewsCount: 18,
    featured: false,
    badge: 'Dichroic Prism',
    tags: ['Fused Glass', 'Dichroic', 'Wall Tile', 'Prism']
  },
  {
    customId: 'g4',
    name: 'Molten Nebula Crystal Paperweight Orb',
    category: 'glass',
    price: 1650,
    originalPrice: 2000,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'
    ],
    desc: 'Solid heavyweight optical glass sphere containing an internal galaxy vortex. Trapped controlled air bubbles, silver reduction vapor, and swirling amber ribbons frozen in crystal.',
    artist: {
      name: "Niall O'Connor",
      bio: 'Irish glass artist specializing in paperweight flamework and solid crystal sculpture.',
      location: 'Waterford, Ireland',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
    },
    dimensions: '4.5" Sphere (Weight: 1.8 kg)',
    medium: 'Optical Borosilicate Crystal & Fine Silver Fume',
    rating: 4.9,
    reviewsCount: 37,
    featured: false,
    badge: 'Collector Edition',
    tags: ['Paperweight', 'Orb', 'Crystal', 'Nebula']
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing products and reseed with full metadata
    await Product.deleteMany({});
    console.log('Cleared old products.');

    const created = await Product.insertMany(products);
    console.log(`Successfully seeded ${created.length} artworks into MongoDB!`);

    // Add some sample verified reviews for products
    await Review.deleteMany({});
    const sampleReviews = [
      {
        product: created[0]._id,
        userName: 'Aarav Malhotra',
        rating: 5,
        comment: 'The depth of the graphite work in person is simply unbelievable. The framing is museum grade!'
      },
      {
        product: created[0]._id,
        userName: 'Priya Sundaram',
        rating: 5,
        comment: 'Arrived packaged in five layers of protective wrap. A true collector masterpiece for our living room.'
      },
      {
        product: created[4]._id,
        userName: 'Vikram Joshi',
        rating: 5,
        comment: 'The teak wood carving smells divine and the undercut floral relief has such striking shadow play.'
      },
      {
        product: created[8]._id,
        userName: 'Rhea Sen',
        rating: 5,
        comment: 'Kenji Takahashi’s dragon mobile moves with the slightest breeze. It is pure poetry in paper form.'
      },
      {
        product: created[12]._id,
        userName: 'Devendra K.',
        rating: 5,
        comment: '1,500 meters of spun silk! The mandala shimmers with golden tones under warm spotlights. Breathtaking.'
      },
      {
        product: created[16]._id,
        userName: 'Natasha Verma',
        rating: 5,
        comment: 'The crackle celadon glaze has that authentic ancient ceramic feel. Sunita Rao is a master artisan.'
      },
      {
        product: created[20]._id,
        userName: 'Michael Thorne',
        rating: 5,
        comment: 'When the morning sun hits this stained glass panel, the entire hallway fills with jewel-like amber and sapphire light.'
      }
    ];
    await Review.insertMany(sampleReviews);
    console.log(`Seeded ${sampleReviews.length} sample reviews.`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, products };
