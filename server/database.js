const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'market.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Read schema file
    try {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute the schema SQL to create tables
      db.exec(schemaSql, (err) => {
        if (err) {
          console.error('Error executing schema DDL:', err.message);
          return;
        }
        console.log('Database tables successfully initialized.');
        
        // Seed users and products
        seedUsers();
        seedProducts();
        ensureSchemaMigrations();
      });
    } catch (err) {
      console.error('Failed to read schema.sql:', err.message);
    }
  });
}

function ensureSchemaMigrations() {
  db.all("PRAGMA table_info(orders)", (err, columns) => {
    if (err) return;
    const hasDistance = columns.some(c => c.name === 'delivery_distance');
    if (!hasDistance) {
      db.run("ALTER TABLE orders ADD COLUMN delivery_distance REAL DEFAULT 0", (err2) => {
        if (!err2) console.log("Added 'delivery_distance' column to orders table.");
      });
    }
  });
}

function seedUsers() {
  db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
    if (err) {
      console.error('Error checking users count:', err.message);
      return;
    }
    
    if (row.count === 0) {
      console.log('Seeding initial users...');
      
      const adminPasswordHash = bcrypt.hashSync('admin123', 10);
      const customerPasswordHash = bcrypt.hashSync('john123', 10);
      
      const insertUser = db.prepare(`
        INSERT INTO users (username, password, role, full_name, phone, address)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      // Seed admin
      insertUser.run('admin', adminPasswordHash, 'admin', 'Market Manager', '9876543210', '100 Farmer Market Hub, Sector 14');
      
      // Seed customer
      insertUser.run('john', customerPasswordHash, 'customer', 'John Doe', '9876501234', '42 Green Valley Apartments, 12km Marker');
      
      insertUser.finalize((err) => {
        if (err) {
          console.error('Error seeding users:', err.message);
        } else {
          console.log('Default users seeded successfully.');
        }
      });
    }
  });
}

function seedProducts() {
  // Clear or re-seed if products count is small so new expanded produce catalog is loaded
  db.get('SELECT COUNT(*) AS count FROM products', (err, row) => {
    if (err) {
      console.error('Error checking products count:', err.message);
      return;
    }
    
    // If table is empty or has old small count, re-populate catalog with INR prices
    if (row.count < 15) {
      console.log('Seeding expanded produce catalog with INR prices...');
      db.run('DELETE FROM products');
      
      const products = [
        // VEGETABLES
        {
          name: 'Crisp Romaine Lettuce',
          category: 'Vegetables',
          price: 60,
          unit: 'head',
          stock: 50,
          image_url: 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&q=80&w=600',
          description: 'Crunchy, farm-fresh romaine lettuce heads, perfect for fresh salads and wraps.'
        },
        {
          name: 'Fresh Farm Tomatoes',
          category: 'Vegetables',
          price: 40,
          unit: 'kg',
          stock: 120,
          image_url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600',
          description: 'Sweet, colorful, juicy organic tomatoes hand-picked directly from local vines.'
        },
        {
          name: 'Green Tender Broccoli',
          category: 'Vegetables',
          price: 80,
          unit: 'kg',
          stock: 40,
          image_url: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&q=80&w=600',
          description: 'Nutrient-rich, dense green broccoli florets fresh from local farms.'
        },
        {
          name: 'Farm Fresh Cauliflower',
          category: 'Vegetables',
          price: 45,
          unit: 'piece',
          stock: 35,
          image_url: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&q=80&w=600',
          description: 'Crisp white head of cauliflower, ideal for curries and roasted snacks.'
        },
        {
          name: 'Red Bell Peppers',
          category: 'Vegetables',
          price: 120,
          unit: 'kg',
          stock: 30,
          image_url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&q=80&w=600',
          description: 'Bright red, crunchy bell peppers packed with Vitamin C and sweetness.'
        },
        {
          name: 'Crunchy Cucumbers',
          category: 'Vegetables',
          price: 40,
          unit: 'kg',
          stock: 80,
          image_url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&q=80&w=600',
          description: 'Hydrating, cool garden cucumbers fresh from the field.'
        },
        {
          name: 'Baby Spinach',
          category: 'Vegetables',
          price: 30,
          unit: 'bunch',
          stock: 60,
          image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=600',
          description: 'Tender organic spinach leaves loaded with iron and minerals.'
        },
        {
          name: 'Sweet Orange Carrots',
          category: 'Vegetables',
          price: 50,
          unit: 'kg',
          stock: 90,
          image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=600',
          description: 'Sweet, juicy orange carrots fresh from local soil.'
        },
        {
          name: 'Farm Garlic Bulbs',
          category: 'Vegetables',
          price: 140,
          unit: 'kg',
          stock: 50,
          image_url: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&q=80&w=600',
          description: 'Robust, pungent white garlic bulbs to flavor your culinary creations.'
        },
        {
          name: 'Red Onions',
          category: 'Vegetables',
          price: 35,
          unit: 'kg',
          stock: 150,
          image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&q=80&w=600',
          description: 'Flavorful red onions, kitchen essential for daily cooking.'
        },
        {
          name: 'Sweet Potatoes',
          category: 'Vegetables',
          price: 50,
          unit: 'kg',
          stock: 45,
          image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600',
          description: 'Naturally sweet, energy-rich orange sweet potatoes.'
        },
        {
          name: 'Fresh Purple Eggplant',
          category: 'Vegetables',
          price: 40,
          unit: 'kg',
          stock: 40,
          image_url: 'https://images.unsplash.com/photo-1628773822503-930a8582b13b?auto=format&fit=crop&q=80&w=600',
          description: 'Glossy purple eggplants ideal for grilling, bharta, and stews.'
        },

        // FRUITS
        {
          name: 'Alphonso Mangoes',
          category: 'Fruits',
          price: 250,
          unit: 'kg',
          stock: 50,
          image_url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=600',
          description: 'King of fruits! Rich, aromatic, sun-ripened premium Alphonso mangoes.'
        },
        {
          name: 'Sweet Honeycrisp Apples',
          category: 'Fruits',
          price: 180,
          unit: 'kg',
          stock: 75,
          image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=600',
          description: 'Exceptionally crisp and naturally sweet apples for healthy snacking.'
        },
        {
          name: 'Ripe Cavendish Bananas',
          category: 'Fruits',
          price: 60,
          unit: 'dozen',
          stock: 100,
          image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=600',
          description: 'Naturally sweet, energy-boosting ripe bananas.'
        },
        {
          name: 'Organic Sweet Strawberries',
          category: 'Fruits',
          price: 150,
          unit: 'pack',
          stock: 40,
          image_url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=600',
          description: 'Juicy, deep-red organic strawberries from cool mountain farms.'
        },
        {
          name: 'Nagpur Juicing Oranges',
          category: 'Fruits',
          price: 100,
          unit: 'kg',
          stock: 85,
          image_url: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&q=80&w=600',
          description: 'Bursting with sweet citrus juice and Vitamin C.'
        },
        {
          name: 'Wild Blueberries',
          category: 'Fruits',
          price: 220,
          unit: 'pack',
          stock: 30,
          image_url: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&q=80&w=600',
          description: 'Antioxidant superfood, plump wild blueberries.'
        },
        {
          name: 'Sweet Green Grapes',
          category: 'Fruits',
          price: 90,
          unit: 'kg',
          stock: 60,
          image_url: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&q=80&w=600',
          description: 'Seedless, crisp, extra-sweet green grapes.'
        },
        {
          name: 'Golden Pineapple',
          category: 'Fruits',
          price: 80,
          unit: 'piece',
          stock: 25,
          image_url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&q=80&w=600',
          description: 'Tropical golden pineapple with rich aroma and sweetness.'
        },
        {
          name: 'Fresh Watermelon',
          category: 'Fruits',
          price: 70,
          unit: 'piece',
          stock: 35,
          image_url: 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fit=crop&q=80&w=600',
          description: 'Refreshing, ice-cool sweet red watermelon.'
        },
        {
          name: 'Green Kiwi Pack',
          category: 'Fruits',
          price: 160,
          unit: 'pack',
          stock: 35,
          image_url: 'https://images.unsplash.com/photo-1585059895524-72fd5965c4b8?auto=format&fit=crop&q=80&w=600',
          description: 'Tangy-sweet nutrient-dense green kiwis.'
        },

        // HERBS & ORGANIC
        {
          name: 'Fresh Italian Basil',
          category: 'Herbs',
          price: 30,
          unit: 'bunch',
          stock: 40,
          image_url: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?auto=format&fit=crop&q=80&w=600',
          description: 'Aromatic fresh basil leaves for pesto and Italian dishes.'
        },
        {
          name: 'Farm-Fresh Brown Eggs',
          category: 'Organic',
          price: 90,
          unit: 'dozen',
          stock: 45,
          image_url: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&q=80&w=600',
          description: 'Pasture-raised, organic brown eggs from free-range hens.'
        }
      ];
      
      const insertProduct = db.prepare(`
        INSERT INTO products (name, category, price, unit, stock, image_url, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      products.forEach((prod) => {
        insertProduct.run(prod.name, prod.category, prod.price, prod.unit, prod.stock, prod.image_url, prod.description);
      });
      
      insertProduct.finalize((err) => {
        if (err) {
          console.error('Error seeding products:', err.message);
        } else {
          console.log('Expanded produce catalog seeded successfully in Indian Rupees (₹).');
        }
      });
    }
  });
}

module.exports = db;
