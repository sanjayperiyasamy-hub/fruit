import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, X, Search, Leaf, Truck, Store, Package,
  CheckCircle, Clock, ChevronRight, Plus, Minus, Trash2,
  LogIn, LogOut, User, BarChart2, ShoppingBag, Star,
  AlertCircle, Edit2, RefreshCw, MapPin, Navigation
} from 'lucide-react';

const API = '/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n).toFixed(0)}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('token');
  return fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return data;
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, addToast };
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle size={18} className="toast-icon-success" />}
          {t.type === 'error' && <AlertCircle size={18} className="toast-icon-error" />}
          {t.type === 'info' && <Star size={18} className="toast-icon-info" />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ onClose, onSuccess, addToast }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', full_name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const data = await apiFetch(`/auth/${tab}`, { method: 'POST', body: form });
      localStorage.setItem('token', data.token);
      onSuccess(data.user);
      addToast(`Welcome, ${data.user.full_name || data.user.username}! 👋`, 'success');
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🌿 {tab === 'login' ? 'Welcome Back' : 'Join FreshRoots'}</h2>
          <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setErr(''); }}>Sign In</button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setErr(''); }}>Create Account</button>
          </div>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tab === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" name="full_name" placeholder="Jane Smith" value={form.full_name} onChange={handle} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" name="username" placeholder="your_username" value={form.username} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handle} required />
            </div>
            {tab === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Phone (optional)</label>
                  <input className="form-input" name="phone" placeholder="555-1234" value={form.phone} onChange={handle} />
                </div>
                <div className="form-group">
                  <label className="form-label">Default Delivery Address (optional)</label>
                  <input className="form-input" name="address" placeholder="123 Main St, City, State" value={form.address} onChange={handle} />
                </div>
              </>
            )}
            {err && <p className="form-error" style={{ display:'flex',alignItems:'center',gap:4 }}><AlertCircle size={14} />{err}</p>}
            {tab === 'login' && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Demo: <strong>admin</strong> / admin123 &nbsp;·&nbsp; <strong>john</strong> / john123
              </p>
            )}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner" /> : (tab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart, animDelay }) {
  const [qty, setQty] = useState(1);
  const isLow = product.stock > 0 && product.stock <= 5;
  const isOut = product.stock <= 0;

  return (
    <div className="product-card" style={{ animationDelay: `${animDelay}ms` }}>
      <div className="product-image-wrap">
        <img src={product.image_url} alt={product.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600'; }} />
        <span className="product-category-badge">{product.category}</span>
        {isLow && <span className="low-stock-badge">Only {product.stock} left!</span>}
      </div>
      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        <div style={{ marginTop: 'auto' }}>
          <div className="product-footer">
            <div>
              <div className="product-price">{fmt(product.price)}<span>/ {product.unit}</span></div>
              <div className="product-stock">{isOut ? 'Out of stock' : `${product.stock} ${product.unit} available`}</div>
            </div>
          </div>
          {isOut ? (
            <div className="out-of-stock" style={{ marginTop: '0.75rem' }}>Out of Stock</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', gap: '0.5rem' }}>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={12} /></button>
                <span className="qty-value">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(Math.min(product.stock, qty + 1))}><Plus size={12} /></button>
              </div>
              <button className="add-to-cart-btn" onClick={() => { onAddToCart(product, qty); setQty(1); }}>
                <ShoppingCart size={13} /> Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cart Sidebar ─────────────────────────────────────────────────────────────
function CartSidebar({ cart, onClose, onUpdate, onRemove, onCheckout, user }) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-sidebar">
        <div className="cart-header">
          <h2 className="cart-title"><ShoppingCart size={20} color="var(--primary-light)" /> Your Cart</h2>
          <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🥦</div>
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Your cart is empty</p>
            <p style={{ fontSize: '0.85rem' }}>Add some fresh produce to get started!</p>
          </div>
        ) : (
          <>
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <img className="cart-item-img" src={item.image_url} alt={item.name} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=100'; }} />
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">{fmt(item.price * item.qty)}</div>
                    <div className="cart-item-actions">
                      <button className="qty-btn" onClick={() => onUpdate(item.id, item.qty - 1)}><Minus size={11} /></button>
                      <span className="qty-value" style={{ fontSize: '0.8rem' }}>{item.qty}</span>
                      <button className="qty-btn" onClick={() => onUpdate(item.id, item.qty + 1)}><Plus size={11} /></button>
                      <button className="btn btn-ghost" style={{ padding: '0.25rem', color: 'var(--danger)' }} onClick={() => onRemove(item.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-summary-line"><span>{cart.reduce((s,i)=>s+i.qty,0)} items</span><span>{fmt(subtotal)}</span></div>
              <div className="cart-summary-line"><span>Delivery fee (if applicable)</span><span>₹50</span></div>
              <div className="cart-total-line"><span>Estimated Total</span><span>{fmt(subtotal + 50)}</span></div>
              <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(234,179,8,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(234,179,8,0.25)', fontSize: '0.78rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} /> Delivery within 30 km radius only
              </div>
              {user ? (
                <button className="btn btn-primary btn-full btn-lg" onClick={onCheckout}>
                  <Package size={18} /> Proceed to Checkout
                </button>
              ) : (
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Please sign in to checkout
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────
function CheckoutModal({ cart, user, onClose, onSuccess, addToast }) {
  const [type, setType] = useState('delivery');
  const [address, setAddress] = useState(user?.address || '');
  const [slot, setSlot] = useState('9:00 AM – 12:00 PM');
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryDistance, setDeliveryDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = type === 'delivery' ? 50 : 0;
  const total = subtotal + deliveryFee;
  const distNum = parseFloat(deliveryDistance) || 0;
  const distExceeded = type === 'delivery' && distNum > 30;
  const distMissing = type === 'delivery' && (distNum <= 0);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      if (distExceeded) { setErr('Delivery limited to 30 km radius only.'); setLoading(false); return; }
      if (distMissing && type === 'delivery') { setErr('Please enter your delivery distance.'); setLoading(false); return; }
      const items = cart.map((i) => ({ product_id: i.id, quantity: i.qty }));
      await apiFetch('/orders', {
        method: 'POST',
        body: { type, items, delivery_address: type === 'delivery' ? address : undefined, delivery_slot: type === 'delivery' ? slot : undefined, pickup_time: type === 'pickup' ? pickupTime : undefined, delivery_distance: type === 'delivery' ? distNum : 0, notes },
      });
      setDone(true);
      addToast('Order placed successfully! 🎉', 'success');
      setTimeout(() => { onSuccess(); onClose(); }, 2500);
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-body">
          <div className="success-animation">
            <div className="success-icon">🎉</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>Order Placed!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your fresh produce is being prepared. Track your order in the "My Orders" tab.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🛒 Checkout</h2>
          <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {/* Order Type */}
            <div className="form-group">
              <label className="form-label">Fulfillment Method</label>
              <div className="radio-cards">
                <label className="radio-card">
                  <input type="radio" name="type" value="delivery" checked={type === 'delivery'} onChange={() => setType('delivery')} />
                  <div className="radio-card-content">
                    <div className="radio-card-icon">🚚</div>
                    <div className="radio-card-label">Home Delivery</div>
                    <div className="radio-card-desc">+₹50 fee · Within 30km</div>
                  </div>
                </label>
                <label className="radio-card">
                  <input type="radio" name="type" value="pickup" checked={type === 'pickup'} onChange={() => setType('pickup')} />
                  <div className="radio-card-content">
                    <div className="radio-card-icon">🏪</div>
                    <div className="radio-card-label">In-Store Pickup</div>
                    <div className="radio-card-desc">Free</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Delivery Fields */}
            {type === 'delivery' && (
              <>
                <div className="form-group">
                  <label className="form-label">Delivery Address</label>
                  <input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City, PIN" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Distance from our Farm Hub (km)</label>
                  <input className="form-input" type="number" min="1" max="30" step="0.5" value={deliveryDistance} onChange={(e) => setDeliveryDistance(e.target.value)} placeholder="e.g. 12" required />
                  {distExceeded && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.8rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={14} /> ⚠️ Sorry! We deliver only within a 30 km radius from our farm hub.
                    </div>
                  )}
                  {!distExceeded && distNum > 0 && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34,197,94,0.3)', fontSize: '0.8rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle size={14} /> ✅ {distNum} km — You are within our delivery zone!
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Delivery Slot</label>
                  <select className="form-select" value={slot} onChange={(e) => setSlot(e.target.value)}>
                    <option>9:00 AM – 12:00 PM</option>
                    <option>12:00 PM – 3:00 PM</option>
                    <option>3:00 PM – 6:00 PM</option>
                    <option>6:00 PM – 9:00 PM</option>
                  </select>
                </div>
              </>
            )}

            {/* Pickup Fields */}
            {type === 'pickup' && (
              <div className="form-group">
                <label className="form-label">Preferred Pickup Time</label>
                <input className="form-input" type="datetime-local" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} required min={new Date().toISOString().slice(0, 16)} />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  📍 FreshRoots Market, 100 Farmer Market Hub, Sector 14
                </p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Order Notes (optional)</label>
              <input className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requests?" />
            </div>

            {/* Order Summary */}
            <div className="checkout-summary">
              {cart.map((i) => (
                <div className="checkout-summary-row" key={i.id}>
                  <span>{i.name} × {i.qty}</span>
                  <span>{fmt(i.price * i.qty)}</span>
                </div>
              ))}
              {type === 'delivery' && (
                <div className="checkout-summary-row"><span>Delivery Fee ({distNum > 0 ? `${distNum} km` : '—'})</span><span>₹50</span></div>
              )}
              <div className="checkout-summary-row total"><span>Total</span><span>{fmt(total)}</span></div>
            </div>

            {err && <p className="form-error" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={14} />{err}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || distExceeded}>
              {loading ? <span className="spinner" /> : <><CheckCircle size={16} /> Place Order ({fmt(total)})</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Order Status Tracker ─────────────────────────────────────────────────────
const DELIVERY_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Your order has been received and is awaiting confirmation.' },
  { key: 'preparing', label: 'Being Prepared', desc: 'Our team is carefully packing your fresh produce.' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Your order is on the way!' },
  { key: 'completed', label: 'Delivered', desc: 'Enjoy your fresh produce! 🥦' },
];
const PICKUP_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Your order has been received.' },
  { key: 'preparing', label: 'Being Prepared', desc: 'Our team is carefully packing your order.' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', desc: 'Your order is ready at the store!' },
  { key: 'completed', label: 'Picked Up', desc: 'Thank you! Enjoy your fresh produce! 🌿' },
];

function OrderStatusTracker({ order }) {
  const steps = order.type === 'delivery' ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIdx = order.status === 'cancelled' ? -1 : steps.findIndex(s => s.key === order.status);

  if (order.status === 'cancelled') {
    return <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--danger)' }}>❌ This order was cancelled.</div>;
  }

  return (
    <div className="order-stepper">
      {steps.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isActive = i === currentIdx;
        return (
          <div key={step.key} className="order-step">
            <div className={`step-dot ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}>
              {isCompleted ? <CheckCircle size={14} /> : isActive ? <Clock size={12} /> : i + 1}
            </div>
            <div className="step-content">
              <div className={`step-label ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}>{step.label}</div>
              {isActive && <div className="step-desc">{step.desc}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, isAdmin, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const adminStatuses = ['pending', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled'];

  return (
    <div className="order-card">
      <div className="order-card-header" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        <div>
          <div className="order-id">Order #{order.id}</div>
          <div className="order-meta">
            {fmtDate(order.created_at)} · {order.type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
            {isAdmin && order.full_name && ` · ${order.full_name}`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`status-badge status-${order.status}`}>{order.status.replace(/_/g, ' ')}</span>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {expanded && (
        <div className="order-card-body">
          <div className="order-items-summary">
            {(order.items || []).map((item) => (
              <span key={item.id} className="order-item-chip">
                {item.name} × {item.quantity} {item.unit}
              </span>
            ))}
          </div>

          {order.type === 'delivery' && order.delivery_address && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              <Truck size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {order.delivery_address} · Slot: {order.delivery_slot}
              {order.delivery_distance > 0 && <span style={{ marginLeft: 8, padding: '2px 8px', background: 'rgba(34,197,94,0.12)', borderRadius: '999px', fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}><Navigation size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />{order.delivery_distance} km</span>}
            </p>
          )}
          {order.type === 'pickup' && order.pickup_time && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              <Store size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Pickup at: {fmtDate(order.pickup_time)}
            </p>
          )}

          {!isAdmin && <OrderStatusTracker order={order} />}

          {isAdmin && (
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Update Status:</p>
              <div className="admin-actions">
                {adminStatuses.map((s) => (
                  <button
                    key={s}
                    className={`btn btn-sm ${order.status === s ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => onStatusChange(order.id, s)}
                    disabled={order.status === s}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="order-card-footer">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {(order.items || []).reduce((s, i) => s + i.quantity, 0)} items
        </span>
        <span className="order-total">{fmt(order.total_price)}</span>
      </div>
    </div>
  );
}

// ─── Admin Product Form Modal ──────────────────────────────────────────────────
function ProductFormModal({ product, onClose, onSaved, addToast }) {
  const isEdit = !!product;
  const [form, setForm] = useState(product || { name: '', category: 'Vegetables', price: '', unit: 'kg', stock: '', image_url: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const categories = ['Vegetables', 'Fruits', 'Herbs', 'Organic', 'Dairy', 'Other'];

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const body = { ...form, price: parseFloat(form.price), stock: parseFloat(form.stock) };
      if (isEdit) {
        await apiFetch(`/products/${product.id}`, { method: 'PUT', body });
        addToast('Product updated successfully!', 'success');
      } else {
        await apiFetch('/products', { method: 'POST', body });
        addToast('Product added to catalog!', 'success');
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '✏️ Edit Product' : '➕ Add Product'}</h2>
          <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Product Name</label>
                <input className="form-input" name="name" value={form.name} onChange={handle} placeholder="e.g. Organic Cherry Tomatoes" required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" name="category" value={form.category} onChange={handle}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit (per/)</label>
                <input className="form-input" name="unit" value={form.unit} onChange={handle} placeholder="kg, bunch, piece..." required />
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input className="form-input" name="price" type="number" min="0" step="1" value={form.price} onChange={handle} placeholder="0" required />
              </div>
              <div className="form-group">
                <label className="form-label">Stock</label>
                <input className="form-input" name="stock" type="number" min="0" step="0.5" value={form.stock} onChange={handle} placeholder="0" required />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Image URL (Unsplash recommended)</label>
                <input className="form-input" name="image_url" value={form.image_url} onChange={handle} placeholder="https://images.unsplash.com/..." />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description</label>
                <input className="form-input" name="description" value={form.description} onChange={handle} placeholder="Brief product description..." />
              </div>
            </div>
            {err && <p className="form-error"><AlertCircle size={14} style={{ verticalAlign: 'middle' }} /> {err}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : (isEdit ? 'Save Changes' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPanel({ addToast }) {
  const [adminTab, setAdminTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [o, p, s] = await Promise.all([
        apiFetch('/orders'), apiFetch('/products'), apiFetch('/admin/stats')
      ]);
      setOrders(o); setProducts(p); setStats(s);
    } catch (e) {
      addToast(e.message, 'error');
    } finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await apiFetch(`/orders/${orderId}/status`, { method: 'PUT', body: { status } });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
      addToast(`Order #${orderId} marked as "${status.replace(/_/g, ' ')}"`, 'success');
    } catch (e) { addToast(e.message, 'error'); }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      setProducts(products.filter(p => p.id !== id));
      addToast(`"${name}" removed from catalog.`, 'info');
    } catch (e) { addToast(e.message, 'error'); }
  };

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="admin-grid">
          {[
            { icon: <ShoppingBag size={20} />, val: stats.totalOrders, label: 'Total Orders' },
            { icon: <Clock size={20} />, val: stats.pendingOrders, label: 'Pending Orders' },
            { icon: <Leaf size={20} />, val: stats.totalProducts, label: 'Products Listed' },
            { icon: <BarChart2 size={20} />, val: fmt(stats.totalRevenue), label: 'Revenue (Completed)' },
          ].map((s, i) => (
            <div className="stat-card" key={i} style={{ animationDelay: `${i * 80}ms` }}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="admin-tabs">
          <button className={`admin-tab ${adminTab === 'orders' ? 'active' : ''}`} onClick={() => setAdminTab('orders')}>Orders ({orders.length})</button>
          <button className={`admin-tab ${adminTab === 'products' ? 'active' : ''}`} onClick={() => setAdminTab('products')}>Products ({products.length})</button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={loadData}><RefreshCw size={14} /> Refresh</button>
          {adminTab === 'products' && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditProduct(null); setShowProductForm(true); }}>
              <Plus size={14} /> Add Product
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Loading data...</p></div>
      ) : adminTab === 'orders' ? (
        orders.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📦</div><h3>No orders yet</h3><p>Orders will appear here once customers start shopping.</p></div>
        ) : (
          <div className="orders-list">
            {orders.map(o => <OrderCard key={o.id} order={o} isAdmin onStatusChange={handleStatusChange} />)}
          </div>
        )
      ) : (
        products.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🌱</div><h3>No products yet</h3><p>Add your first product to the catalog.</p></div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={p.image_url} alt={p.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=100'; }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID #{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="order-item-chip">{p.category}</span></td>
                    <td style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{fmt(p.price)}<span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>/{p.unit}</span></td>
                    <td>
                      <span style={{ color: p.stock <= 5 ? 'var(--warning)' : p.stock <= 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditProduct(p); setShowProductForm(true); }}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteProduct(p.id, p.name)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {showProductForm && (
        <ProductFormModal
          product={editProduct}
          onClose={() => setShowProductForm(false)}
          onSaved={loadData}
          addToast={addToast}
        />
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('shop'); // shop | orders | admin
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { toasts, addToast } = useToast();

  const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Herbs', 'Organic'];
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Load products
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'All') params.set('category', category);
      const data = await apiFetch(`/products?${params}`);
      setProducts(data);
    } catch (e) {
      addToast('Failed to load products', 'error');
    } finally { setLoadingProducts(false); }
  }, [search, category, addToast]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Load orders when tab switches
  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const data = await apiFetch('/orders');
      setOrders(data);
    } catch (e) {
      addToast('Failed to load orders', 'error');
    } finally { setLoadingOrders(false); }
  }, [user, addToast]);

  useEffect(() => {
    if (view === 'orders' || view === 'admin') loadOrders();
  }, [view, loadOrders]);

  // Auth
  const handleAuthSuccess = (u) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setView('shop');
    setOrders([]);
    addToast('Signed out successfully.', 'info');
  };

  // Cart operations
  const addToCart = (product, qty) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        addToast(`Updated ${product.name} quantity.`, 'info');
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      }
      addToast(`${product.name} added to cart! 🛒`, 'success');
      return [...prev, { ...product, qty }];
    });
  };

  const updateCartItem = (id, qty) => {
    if (qty <= 0) removeCartItem(id);
    else setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const removeCartItem = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleCheckoutSuccess = () => {
    setCart([]);
    setCartOpen(false);
    loadProducts();
  };

  const handleViewChange = (v) => {
    if ((v === 'orders' || v === 'admin') && !user) {
      setAuthOpen(true);
      addToast('Please sign in to continue.', 'info');
      return;
    }
    setView(v);
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <Leaf size={24} />
          <span>FreshRoots</span>
        </div>
        <div className="navbar-tabs">
          <button className={`nav-tab ${view === 'shop' ? 'active' : ''}`} onClick={() => setView('shop')}>
            <ShoppingBag size={16} /><span>Shop</span>
          </button>
          {user && (
            <button className={`nav-tab ${view === 'orders' ? 'active' : ''}`} onClick={() => handleViewChange('orders')}>
              <Package size={16} /><span>My Orders</span>
            </button>
          )}
          {user?.role === 'admin' && (
            <button className={`nav-tab ${view === 'admin' ? 'active' : ''}`} onClick={() => handleViewChange('admin')}>
              <BarChart2 size={16} /><span>Admin</span>
            </button>
          )}
        </div>
        <div className="navbar-actions">
          <button className="cart-btn" onClick={() => setCartOpen(true)} id="cart-toggle-btn">
            <ShoppingCart size={18} />
            <span style={{ display: cartCount ? 'inline' : 'none' }} id="cart-count">{cartCount} items</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <User size={14} />
                <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name || user.username}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setAuthOpen(true)} id="signin-btn">
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Shop View */}
      {view === 'shop' && (
        <>
          <section className="hero">
            <div className="hero-bg" />
            <div className="hero-badge"><Leaf size={12} /> 100% Fresh · Farm to Door · Within 30km</div>
            <h1>Fresh Produce,<br /><span className="gradient-text">Delivered to You</span></h1>
            <p>Shop farm-fresh vegetables, fruits, herbs, and organic goods from your local market. Free pickup or ₹50 door delivery within 30 km radius.</p>
            <div className="search-bar-wrapper">
              <Search size={18} className="search-icon" />
              <input
                id="search-input"
                className="search-input"
                placeholder="Search vegetables, fruits, herbs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-chips">
              {CATEGORIES.map(c => (
                <button key={c} className={`filter-chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)} id={`filter-${c.toLowerCase()}`}>
                  {c}
                </button>
              ))}
            </div>
          </section>

          <main className="main-container">
            <div className="section-header">
              <h2 className="section-title">
                {category === 'All' ? 'All Produce' : category}
              </h2>
              <span className="results-count">{loadingProducts ? '…' : `${products.length} items`}</span>
            </div>
            {loadingProducts ? (
              <div className="loading-state"><div className="spinner" /><p>Loading fresh produce...</p></div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No products found</h3>
                <p>Try a different search term or category filter.</p>
                <button className="btn btn-outline" onClick={() => { setSearch(''); setCategory('All'); }}>Clear Filters</button>
              </div>
            ) : (
              <div className="product-grid">
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} onAddToCart={addToCart} animDelay={i * 60} />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* My Orders View */}
      {view === 'orders' && user && (
        <main className="main-container" style={{ paddingTop: '2rem' }}>
          <div className="section-header">
            <h2 className="section-title">My Orders</h2>
            <button className="btn btn-outline btn-sm" onClick={loadOrders}><RefreshCw size={14} /> Refresh</button>
          </div>
          {loadingOrders ? (
            <div className="loading-state"><div className="spinner" /><p>Loading your orders...</p></div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No orders yet</h3>
              <p>Start shopping and your orders will appear here.</p>
              <button className="btn btn-primary" onClick={() => setView('shop')}><ShoppingBag size={16} /> Browse Products</button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(o => <OrderCard key={o.id} order={o} isAdmin={false} />)}
            </div>
          )}
        </main>
      )}

      {/* Admin View */}
      {view === 'admin' && user?.role === 'admin' && (
        <main className="main-container" style={{ paddingTop: '2rem' }}>
          <div className="section-header" style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-title">🌿 Admin Dashboard</h2>
          </div>
          <AdminPanel addToast={addToast} />
        </main>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <CartSidebar
          cart={cart}
          user={user}
          onClose={() => setCartOpen(false)}
          onUpdate={updateCartItem}
          onRemove={removeCartItem}
          onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
        />
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          user={user}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleCheckoutSuccess}
          addToast={addToast}
        />
      )}

      {/* Auth Modal */}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSuccess={handleAuthSuccess}
          addToast={addToast}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
