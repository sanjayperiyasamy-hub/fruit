const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'fresh-produce-market-secret-2024';

app.use(cors());
app.use(express.json());

// ─── Auth Middleware ────────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  next();
}

// ─── AUTH ROUTES ────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { username, password, full_name, phone, address } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const hash = bcrypt.hashSync(password, 10);
  db.run(
    'INSERT INTO users (username, password, role, full_name, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
    [username, hash, 'customer', full_name || '', phone || '', address || ''],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already exists.' });
        return res.status(500).json({ error: err.message });
      }
      const token = jwt.sign({ id: this.lastID, username, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: { id: this.lastID, username, role: 'customer', full_name } });
    }
  );
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name, address: user.address }
    });
  });
});

// ─── PRODUCT ROUTES ─────────────────────────────────────────────────────────

// GET /api/products — Public with optional search and category filter
app.get('/api/products', (req, res) => {
  const { search, category } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY name ASC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/products/:id — Public
app.get('/api/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Product not found.' });
    res.json(row);
  });
});

// POST /api/products — Admin only
app.post('/api/products', authenticateToken, requireAdmin, (req, res) => {
  const { name, category, price, unit, stock, image_url, description } = req.body;
  if (!name || !category || price == null || !unit) {
    return res.status(400).json({ error: 'Name, category, price, and unit are required.' });
  }
  db.run(
    'INSERT INTO products (name, category, price, unit, stock, image_url, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, category, price, unit, stock || 0, image_url || '', description || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json(row);
      });
    }
  );
});

// PUT /api/products/:id — Admin only
app.put('/api/products/:id', authenticateToken, requireAdmin, (req, res) => {
  const { name, category, price, unit, stock, image_url, description } = req.body;
  db.run(
    `UPDATE products SET name=?, category=?, price=?, unit=?, stock=?, image_url=?, description=?
     WHERE id=?`,
    [name, category, price, unit, stock, image_url, description, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Product not found.' });
      db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json(row);
      });
    }
  );
});

// DELETE /api/products/:id — Admin only
app.delete('/api/products/:id', authenticateToken, requireAdmin, (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deleted successfully.' });
  });
});

// ─── ORDER ROUTES ────────────────────────────────────────────────────────────

// GET /api/orders — Admin gets all, customer gets their own
app.get('/api/orders', authenticateToken, (req, res) => {
  let query, params;

  if (req.user.role === 'admin') {
    query = `
      SELECT o.*, u.full_name, u.username
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `;
    params = [];
  } else {
    query = `
      SELECT o.*, u.full_name, u.username
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;
    params = [req.user.id];
  }

  db.all(query, params, (err, orders) => {
    if (err) return res.status(500).json({ error: err.message });

    if (orders.length === 0) return res.json([]);

    // Fetch items for each order
    const orderIds = orders.map(o => o.id);
    const placeholders = orderIds.map(() => '?').join(',');

    db.all(
      `SELECT oi.*, p.name, p.unit, p.image_url FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id IN (${placeholders})`,
      orderIds,
      (err2, items) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const ordersWithItems = orders.map(order => ({
          ...order,
          items: items.filter(item => item.order_id === order.id)
        }));
        res.json(ordersWithItems);
      }
    );
  });
});

// POST /api/orders — Authenticated customers create orders
app.post('/api/orders', authenticateToken, (req, res) => {
  const { type, items, delivery_address, delivery_slot, pickup_time, delivery_distance, notes } = req.body;

  if (!type || !items || items.length === 0) {
    return res.status(400).json({ error: 'Order type and at least one item are required.' });
  }
  if (type === 'delivery') {
    if (!delivery_address) {
      return res.status(400).json({ error: 'Delivery address is required for delivery orders.' });
    }
    const dist = parseFloat(delivery_distance) || 0;
    if (dist <= 0 || dist > 30) {
      return res.status(400).json({ error: 'Delivery is strictly restricted to a maximum 30 km radius from our farm hub.' });
    }
  }
  if (type === 'pickup' && !pickup_time) {
    return res.status(400).json({ error: 'Pickup time is required for pickup orders.' });
  }

  // Verify stock and compute prices
  const productIds = items.map(i => i.product_id);
  const placeholders = productIds.map(() => '?').join(',');

  db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, productIds, (err, products) => {
    if (err) return res.status(500).json({ error: err.message });

    const productMap = {};
    products.forEach(p => { productMap[p.id] = p; });

    let total = 0;
    for (const item of items) {
      const product = productMap[item.product_id];
      if (!product) return res.status(404).json({ error: `Product ID ${item.product_id} not found.` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${product.name}". Available: ${product.stock} ${product.unit}.` });
      }
      total += product.price * item.quantity;
    }

    // Add delivery fee of ₹50 if delivery
    const distNum = type === 'delivery' ? (parseFloat(delivery_distance) || 0) : 0;
    if (type === 'delivery') total += 50;
    total = Math.round(total * 100) / 100;

    const createdAt = new Date().toISOString();

    db.run(
      `INSERT INTO orders (user_id, type, status, total_price, created_at, delivery_address, delivery_slot, pickup_time, delivery_distance, notes)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, type, total, createdAt, delivery_address || null, delivery_slot || null, pickup_time || null, distNum, notes || null],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        const orderId = this.lastID;

        // Insert order items & decrement stock
        const insertItem = db.prepare(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
        );
        const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

        items.forEach(item => {
          const product = productMap[item.product_id];
          insertItem.run(orderId, item.product_id, item.quantity, product.price);
          updateStock.run(item.quantity, item.product_id);
        });

        insertItem.finalize();
        updateStock.finalize((err3) => {
          if (err3) return res.status(500).json({ error: err3.message });

          db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err4, order) => {
            if (err4) return res.status(500).json({ error: err4.message });
            res.status(201).json({ ...order, items });
          });
        });
      }
    );
  });
});

// PUT /api/orders/:id/status — Admin updates order status
app.put('/api/orders/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Order not found.' });
    res.json({ id: parseInt(req.params.id), status });
  });
});

// GET /api/admin/stats — Admin dashboard stats
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const stats = {};
  db.get('SELECT COUNT(*) as total FROM orders', (err, row) => {
    stats.totalOrders = row?.total || 0;
    db.get("SELECT COUNT(*) as total FROM orders WHERE status = 'pending'", (err2, row2) => {
      stats.pendingOrders = row2?.total || 0;
      db.get('SELECT COUNT(*) as total FROM products', (err3, row3) => {
        stats.totalProducts = row3?.total || 0;
        db.get('SELECT SUM(total_price) as total FROM orders WHERE status = "completed"', (err4, row4) => {
          stats.totalRevenue = Math.round((row4?.total || 0) * 100) / 100;
          res.json(stats);
        });
      });
    });
  });
});

// ─── STATIC FRONTEND SERVING ──────────────────────────────────────────────────
// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Anything that doesn't match an API route should serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌿 Agrivo API running at http://localhost:${PORT}`);
  console.log(`   API endpoints ready. Use Ctrl+C to stop.\n`);
});
