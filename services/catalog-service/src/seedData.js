const Cake = require('./models/Cake');

const initialCakes = [
  {
    name: 'Belgian Truffle Fantasy',
    description: 'Rich 70% dark Belgian chocolate ganache layers topped with handcrafted truffles and cocoa dust.',
    category: 'Chocolate',
    price: 34.99,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    flavor: 'Dark Belgian Chocolate',
    weightKg: 1.2
  },
  {
    name: 'Wild Berry Vanilla Dream',
    description: 'Soft Madagascar vanilla sponge layered with fresh raspberry compote and whipped cream frosting.',
    category: 'Fruit',
    price: 29.99,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop&q=80',
    flavor: 'Wild Raspberry & Vanilla',
    weightKg: 1.0
  },
  {
    name: 'Classic Red Velvet Royale',
    description: 'Traditional cocoa velvet cake layers with silk smooth cream cheese frosting and edible gold leaf.',
    category: 'Red Velvet',
    price: 32.50,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=800&auto=format&fit=crop&q=80',
    flavor: 'Classic Red Velvet Cream Cheese',
    weightKg: 1.1
  },
  {
    name: 'New York Blueberry Cheesecake',
    description: 'Authentic baked cream cheese on a graham cracker crust with lush wild blueberry topping.',
    category: 'Cheesecake',
    price: 38.00,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
    flavor: 'Baked Cream Cheese & Blueberry',
    weightKg: 1.5
  },
  {
    name: 'Golden Mango Passion Delight',
    description: 'Light sponge layered with Alphonso mango pulp and passionfruit glaze for a tropical celebration.',
    category: 'Fruit',
    price: 31.99,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=800&auto=format&fit=crop&q=80',
    flavor: 'Alphonso Mango & Passionfruit',
    weightKg: 1.0
  },
  {
    name: 'Triple Chocolate Hazelnut Crunch',
    description: 'Layers of milk chocolate mousse, roasted hazelnut praline, and dark chocolate glaze.',
    category: 'Chocolate',
    price: 36.99,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&auto=format&fit=crop&q=80',
    flavor: 'Chocolate & Hazelnut Praline',
    weightKg: 1.3
  },
  {
    name: 'Dutch Dark Chocolate Opera',
    description: 'Classic French-style almond sponge soaked in coffee syrup with layers of dark chocolate ganache.',
    category: 'Chocolate',
    price: 39.99,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&auto=format&fit=crop&q=80',
    flavor: 'Dark Chocolate Coffee',
    weightKg: 1.2
  },
  {
    name: 'Strawberry Velvet Delight',
    description: 'Light vanilla bean sponge packed with freshly harvested strawberries and chantilly cream.',
    category: 'Fruit',
    price: 31.50,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=80',
    flavor: 'Fresh Strawberry Vanilla',
    weightKg: 1.0
  },
  {
    name: 'Madagascar Bean Custard Gateau',
    description: 'Pure Madagascar Bourbon vanilla cake layers with silky custard mousse and white chocolate curls.',
    category: 'Vanilla',
    price: 28.99,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&auto=format&fit=crop&q=80',
    flavor: 'Pure Bourbon Vanilla',
    weightKg: 1.0
  },
  {
    name: 'Salted Caramel Macadamia Bliss',
    description: 'Moist brown sugar cake drizzled with rich salted caramel sauce and toasted macadamia nuts.',
    category: 'Custom Special',
    price: 42.00,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    flavor: 'Salted Caramel & Macadamia',
    weightKg: 1.4
  },
  {
    name: 'Raspberry Lemon Chiffon',
    description: 'Zesty lemon chiffon cake infused with tangy raspberry reduction and Meyer lemon curd.',
    category: 'Fruit',
    price: 33.00,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=800&auto=format&fit=crop&q=80',
    flavor: 'Lemon & Raspberry',
    weightKg: 1.1
  },
  {
    name: 'Lotus Biscoff Cream Cheesecake',
    description: 'Creamy baked cheesecake with a spiced Lotus cookie crust and melted caramelized cookie butter glaze.',
    category: 'Cheesecake',
    price: 44.99,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=800&auto=format&fit=crop&q=80',
    flavor: 'Lotus Biscoff Cookie Butter',
    weightKg: 1.5
  },
  {
    name: 'Tiramisu Mascarpone Elegance',
    description: 'Traditional Italian espresso-soaked ladyfingers wrapped in whipped mascarpone cream and Dutch cocoa.',
    category: 'Custom Special',
    price: 37.50,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&auto=format&fit=crop&q=80',
    flavor: 'Espresso Mascarpone',
    weightKg: 1.2
  },
  {
    name: 'Red Velvet Raspberry Fusion',
    description: 'Crimson cocoa sponge layered with raspberry coulis and velvety cream cheese frosting.',
    category: 'Red Velvet',
    price: 35.00,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&auto=format&fit=crop&q=80',
    flavor: 'Red Velvet & Raspberry',
    weightKg: 1.1
  },
  {
    name: 'Double Pistachio Rosewater Crown',
    description: 'Delicate Iranian pistachio cake infused with subtle rosewater essence and crushed green pistachios.',
    category: 'Custom Special',
    price: 45.99,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=800&auto=format&fit=crop&q=80',
    flavor: 'Pistachio & Rosewater',
    weightKg: 1.3
  },
  {
    name: 'Swiss Dark Fudge Overload',
    description: 'Quadruple layered Swiss dark fudge cake finished with glossy chocolate mirror glaze.',
    category: 'Chocolate',
    price: 39.50,
    availability: true,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    flavor: 'Swiss Fudge Chocolate',
    weightKg: 1.4
  }
];

async function seedDatabase() {
  try {
    for (const cake of initialCakes) {
      await Cake.updateOne({ name: cake.name }, { $set: cake }, { upsert: true });
    }
    const totalCount = await Cake.countDocuments();
    console.log(`✅ Catalog database synced with ${totalCount} cake products in MongoDB Atlas!`);
  } catch (error) {
    console.error('⚠️ Error seeding catalog database:', error.message);
  }
}

module.exports = seedDatabase;
