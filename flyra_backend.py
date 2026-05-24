#!/usr/bin/env python3
"""
FLYRA Backend v3 — Algerian Fashion Platform
PostgreSQL + SQLite dual support • Email • Cloud images • Full-text search • WebSockets
"""
import os, sys, json, time, sqlite3, hashlib, secrets, re, math, uuid, base64, hmac
from datetime import datetime, timedelta
from functools import wraps
from io import StringIO
from pathlib import Path
from flask import Flask, request, jsonify, g, send_from_directory, send_file, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
CORS(app, resources={r"/api/*": {"origins": "*"}})

BASE = Path(__file__).parent
UPLOAD_DIR = BASE / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

# ─── Database Selection ──────────────────────────────────────────
DATABASE_URL = os.environ.get('DATABASE_URL', '')
USE_PG = 'postgres' in DATABASE_URL
DB_PATH = str(BASE / 'flyra.db')

if USE_PG:
    import psycopg2
    import psycopg2.extras
    import psycopg2.pool
    pg_pool = psycopg2.pool.ThreadedConnectionPool(2, 10, DATABASE_URL, sslmode='require')
    def get_db():
        if 'db' not in g:
            g.db = pg_pool.getconn()
            g.db.autocommit = False
        return g.db

    def put_db(db):
        if db and not db.closed:
            pg_pool.putconn(db)

    @app.teardown_appcontext
    def close_db(e=None):
        db = g.pop('db', None)
        if db: put_db(db)

    def _q(q, params=None):
        db = get_db()
        cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(q, params or ())
        if q.strip().upper().startswith('SELECT'):
            return cur.fetchall()
        db.commit()
        return cur

    def _one(q, params=None):
        rows = _q(q, params)
        return rows[0] if rows else None

    def _val(q, params=None):
        row = _one(q, params)
        return list(row.values())[0] if row else None

    def _last_id(cur=None):
        return _val('SELECT lastval()')
else:
    def get_db():
        if 'db' not in g:
            g.db = sqlite3.connect(DB_PATH, timeout=20, check_same_thread=False)
            g.db.row_factory = sqlite3.Row
            g.db.execute('PRAGMA journal_mode=WAL')
            g.db.execute('PRAGMA busy_timeout=5000')
            g.db.execute('PRAGMA foreign_keys=ON')
        return g.db

    @app.teardown_appcontext
    def close_db(e=None):
        db = g.pop('db', None)
        if db: db.close()

    def _q(q, params=None):
        db = get_db()
        if USE_PG: return _q_pg(q, params)
        cur = db.execute(q, params or ())
        if q.strip().upper().startswith('SELECT'):
            return cur.fetchall()
        db.commit()
        return cur

    def _one(q, params=None):
        rows = _q(q, params)
        return rows[0] if rows else None

    def _val(q, params=None):
        row = _one(q, params)
        return row[0] if row else None

    def _last_id(cur=None):
        return _val('SELECT last_insert_rowid()')

APP_START = time.time()

def pg_dumps(val):
    """Convert Python values to PG-friendly JSON strings."""
    if isinstance(val, (dict, list)):
        return json.dumps(val)
    return val

# ─── Schema ──────────────────────────────────────────────────────
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT, last_name TEXT,
    phone TEXT, wilaya TEXT, address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL, collection TEXT,
    price INTEGER, old_price INTEGER,
    owner TEXT, tag TEXT, sizes TEXT,
    stock INTEGER DEFAULT 0, status TEXT DEFAULT 'active',
    desc TEXT, image TEXT, colors TEXT, icon TEXT,
    featured INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER, first_name TEXT, last_name TEXT,
    phone TEXT, email TEXT, wilaya TEXT, address TEXT,
    items TEXT, total INTEGER, subtotal INTEGER,
    discount INTEGER DEFAULT 0, shipping INTEGER DEFAULT 0,
    payment_method TEXT DEFAULT 'cod',
    status TEXT DEFAULT 'pending',
    tracking_code TEXT, coupon_code TEXT, notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    session_id TEXT, product_id INTEGER,
    quantity INTEGER DEFAULT 1, size TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER, session_id TEXT, product_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS drops (
    id SERIAL PRIMARY KEY,
    product_id INTEGER, launch_date TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER, session_id TEXT,
    title TEXT, message TEXT, read INTEGER DEFAULT 0,
    type TEXT DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS loyalty (
    id SERIAL PRIMARY KEY,
    user_id INTEGER, session_id TEXT,
    points INTEGER DEFAULT 0, tier TEXT DEFAULT 'Bronze',
    total_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER, user_id INTEGER,
    rating INTEGER, comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
CREATE TABLE IF NOT EXISTS stats (
    id SERIAL PRIMARY KEY,
    date TEXT, views INTEGER DEFAULT 0,
    orders INTEGER DEFAULT 0, revenue INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount INTEGER NOT NULL,
    type TEXT DEFAULT 'percent',
    min_order INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 0,
    used INTEGER DEFAULT 0,
    expires TEXT,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def migrate_schema():
    if USE_PG:
        db = get_db()
        cur = db.cursor()
        cur.execute(SCHEMA_SQL)
        db.commit()
        # Add missing columns
        for col, dtype in [('email', 'TEXT DEFAULT ""'), ('discount', 'INTEGER DEFAULT 0'),
                           ('coupon_code', 'TEXT DEFAULT ""'), ('colors', 'TEXT'),
                           ('icon', 'TEXT')]:
            try:
                cur.execute(f'ALTER TABLE orders ADD COLUMN {col} {dtype}' if 'orders' in col else
                           f'ALTER TABLE products ADD COLUMN {col} {dtype}')
                db.commit()
            except:
                pass
        try:
            cur.execute("ALTER TABLE reviews ADD COLUMN status TEXT DEFAULT 'pending'")
            db.commit()
        except:
            pass
        put_db(db)
    else:
        init_db_sqlite()
        try:
            db = sqlite3.connect(DB_PATH)
            cols = [r[1] for r in db.execute('PRAGMA table_info(orders)').fetchall()]
            for col, dtype in [('email', 'TEXT DEFAULT ""'), ('discount', 'INTEGER DEFAULT 0'),
                               ('coupon_code', 'TEXT DEFAULT ""')]:
                if col not in cols:
                    db.execute(f'ALTER TABLE orders ADD COLUMN {col} {dtype}')
            cols2 = [r[1] for r in db.execute('PRAGMA table_info(products)').fetchall()]
            for col in ('colors', 'icon'):
                if col not in cols2:
                    db.execute(f'ALTER TABLE products ADD COLUMN {col} TEXT')
            cols3 = [r[1] for r in db.execute('PRAGMA table_info(reviews)').fetchall()]
            if 'status' not in cols3:
                db.execute("ALTER TABLE reviews ADD COLUMN status TEXT DEFAULT 'pending'")
            db.commit()
            db.close()
        except Exception as e:
            print(f'[migrate] {e}')

def init_db_sqlite():
    db = sqlite3.connect(DB_PATH, timeout=20)
    db.executescript(SCHEMA_SQL.replace('SERIAL', 'INTEGER PRIMARY KEY AUTOINCREMENT')
                     .replace('TIMESTAMP', 'TEXT').replace('EXTRACT(EPOCH FROM ', ''))
    if db.execute('SELECT COUNT(*) FROM products').fetchone()[0] == 0:
        seed_data_sqlite(db)
    db.commit()
    db.close()

def seed_data_sqlite(db):
    products = [
        ('HERITAGE GANDOURA', 'heritage', 28000, 35000, 'FLYRA Atelier', 'HERITAGE', 'S/M/L/XL/XXL', 8, 'active', 'Hand-embroidered traditional Algerian Gandoura. Pure linen from Tlemcen workshops.', 0),
        ('PHANTOM STREET HOODIE', 'street', 18000, 24000, 'FLYRA Studio', 'NEW', 'S/M/L/XL', 15, 'active', 'Oversized silhouette. Heavy-weight 420gsm French terry.', 1),
        ('OLD MONEY BLAZER', 'oldmoney', 45000, 55000, 'FLYRA Haute', 'PREMIUM', 'S/M/L/XL', 5, 'active', 'Italian wool blend. Structured shoulders. The Algiers executive look.', 0),
        ('SKY RUNNER SNEAKERS', 'sport', 22000, 28000, 'FLYRA Sport', 'NEW', '38/40/42/44/46', 20, 'active', 'Algerian-designed upper. Memory foam insole.', 1),
        ('DJELLABA MODERNE', 'heritage', 24000, 30000, 'FLYRA Atelier', 'HERITAGE', 'S/M/L/XL/XXL', 10, 'active', 'Contemporary cut meets traditional silhouette.', 0),
        ('SILENT SHORTS', 'sport', 8500, None, 'FLYRA Sport', 'SALE', 'S/M/L/XL', 25, 'active', 'Technical woven fabric. Hidden zip pockets.', 0),
        ('AMBER TEE', 'street', 6500, None, 'FLYRA Studio', None, 'XS/S/M/L/XL/XXL', 40, 'active', 'Premium 200gsm cotton. Embroidered FLYRA crest.', 1),
        ('SPORT TECH JOGGERS', 'sport', 12000, 16000, 'FLYRA Sport', 'NEW', 'S/M/L/XL', 18, 'active', 'Track-inspired cut. Tapered leg. Reflective taping.', 0),
        ('ALGIERS CAP', 'street', 4500, None, 'FLYRA Studio', None, 'M/L', 30, 'active', 'Structured six-panel. Embroidered skyline of Algiers.', 0),
        ('BROCADE VEST', 'heritage', 35000, 42000, 'FLYRA Atelier', 'LIMITED', 'S/M/L/XL', 4, 'limited', 'Traditional Algerian brocade fabric. Gold-thread patterns.', 0),
    ]
    db.executemany('INSERT INTO products (name,collection,price,old_price,owner,tag,sizes,stock,status,desc,featured) VALUES (?,?,?,?,?,?,?,?,?,?,?)', products)
    orders = [
        ('Ahmed','Bensalah','0555123456','Alger','Bab El Oued','[{"id":1,"name":"HERITAGE GANDOURA","price":28000,"size":"M","qty":1}]',28000,28000,0,'cod','delivered','FLY2025060001'),
        ('Fatima','Zohra','0661234567','Oran','Centre ville','[{"id":2,"name":"PHANTOM STREET HOODIE","price":18000,"size":"L","qty":1},{"id":9,"name":"ALGIERS CAP","price":4500,"size":"M/L","qty":1}]',22500,22500,0,'ccp','shipped','FLY2025060002'),
        ('Mohammed','Benali','0771234567','Constantine','Chteup','[{"id":3,"name":"OLD MONEY BLAZER","price":45000,"size":"M","qty":1}]',45000,45000,0,'baridimob','pending','FLY2025060003'),
    ]
    for o in orders:
        db.execute('INSERT INTO orders (first_name,last_name,phone,wilaya,address,items,total,subtotal,shipping,payment_method,status,tracking_code) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', o)
    stats = [
        ('2026-05-01',1247,12,386000),('2026-05-02',1580,18,524000),('2026-05-03',2134,22,612000),
        ('2026-05-04',1892,15,441000),('2026-05-05',2456,28,789000),('2026-05-06',1823,19,534000),
        ('2026-05-07',1567,14,398000),('2026-05-08',2345,25,712000),('2026-05-09',2789,31,891000),
        ('2026-05-10',3102,38,1054000),('2026-05-11',2456,29,823000),('2026-05-12',1987,21,598000),
    ]
    db.executemany('INSERT INTO stats (date,views,orders,revenue) VALUES (?,?,?,?)', stats)

# ─── Auth ────────────────────────────────────────────────────────
def hash_pw(pw): return hashlib.sha256(pw.encode()).hexdigest()
def make_token(): return secrets.token_hex(32)

def get_user_id(req):
    token = req.headers.get('Authorization', '').replace('Bearer ', '')
    if not token: return None
    row = _one('SELECT user_id FROM sessions WHERE token=? AND expires>?',
               (token, datetime.now().isoformat()))
    return row['user_id'] if row else None

def get_session_id(req):
    return req.headers.get('X-Session', request.cookies.get('flyra_session', request.remote_addr or 'anon'))

# ─── Email ───────────────────────────────────────────────────────
SENDGRID_KEY = os.environ.get('SENDGRID_API_KEY', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@flyra.dz')

def send_email(to, subject, html_body):
    if not SENDGRID_KEY:
        print(f'[email] Would send to {to}: {subject}')
        return False
    try:
        import urllib.request
        data = json.dumps({
            'personalizations': [{'to': [{'email': to}]}],
            'from': {'email': FROM_EMAIL, 'name': 'FLYRA'},
            'subject': subject,
            'content': [{'type': 'text/html', 'value': html_body}]
        }).encode()
        req = urllib.request.Request(
            'https://api.sendgrid.com/v3/mail/send', data=data,
            headers={'Authorization': f'Bearer {SENDGRID_KEY}',
                     'Content-Type': 'application/json'}, method='POST')
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception as e:
        print(f'[email] Error: {e}')
        return False

def send_order_confirmation(order):
    items_html = ''
    try:
        items = json.loads(order['items']) if isinstance(order['items'], str) else order['items']
        for i in items:
            items_html += f'<tr><td style="padding:8px;border-bottom:1px solid #eee;">{i.get("name","")}</td><td style="padding:8px;border-bottom:1px solid #eee;">{i.get("size","")}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">{i.get("qty",1)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">{int(i.get("price",0)):,} DZD</td></tr>'
    except: pass
    html = f'''<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Inter,sans-serif;background:#f5f0e8;padding:40px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
    <div style="background:#0A0F1E;padding:32px;text-align:center;"><h1 style="color:#C49B3D;margin:0;font-size:28px;letter-spacing:4px;">FLYRA</h1><p style="color:#7BA3C9;margin:8px 0 0;font-size:12px;letter-spacing:2px;">صعود بلا حدود</p></div>
    <div style="padding:32px;">
    <h2 style="margin:0 0 8px;font-size:20px;">Thank you, <span style="color:#C49B3D;">{order.get("first_name","")}</span>!</h2>
    <p style="color:#666;font-size:14px;margin:0 0 24px;">Your order has been confirmed.</p>
    <div style="background:#f8f6f2;border-radius:12px;padding:16px;margin-bottom:24px;">
    <p style="margin:0 0 4px;font-size:12px;color:#999;">TRACKING CODE</p>
    <p style="margin:0;font-size:22px;font-weight:900;color:#0A0F1E;letter-spacing:2px;">{order.get("tracking_code","")}</p></div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">{items_html}</table>
    <div style="border-top:2px solid #C49B3D;padding-top:12px;margin-top:12px;text-align:right;font-size:16px;font-weight:800;">Total: {order.get("total",0):,} DZD</div>
    <p style="color:#999;font-size:12px;margin-top:24px;padding-top:16px;border-top:1px solid #eee;">Delivery to <strong>{order.get("wilaya","")}</strong> in 2–5 business days. Track your order anytime using the code above.</p>
    </div></div></body></html>'''
    email = order.get('email', '')
    if email and '@' in email:
        send_email(email, f'FLYRA Order Confirmed — {order.get("tracking_code","")}', html)

# ─── Rate Limiter ────────────────────────────────────────────────
RATE_LIMIT = {}
def rate_limit(limit=60, window=60):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ip = request.remote_addr or '127.0.0.1'
            key = f'{ip}:{request.path}'
            now = time.time()
            RATE_LIMIT[key] = [t for t in RATE_LIMIT.get(key, []) if t > now - window]
            if len(RATE_LIMIT[key]) >= limit:
                return jsonify({'error': 'Too many requests'}), 429
            RATE_LIMIT[key].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator

# ─── Cache ────────────────────────────────────────────────────────
CACHE = {}
def cached(ttl=30):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            key = f'{request.path}:{hash(frozenset(request.args.items()))}'
            if key in CACHE and CACHE[key][0] > time.time():
                return CACHE[key][1]
            result = f(*args, **kwargs)
            CACHE[key] = (time.time() + ttl, result)
            return result
        return wrapper
    return decorator

# ─── API Response helpers ────────────────────────────────────────
def ok(data=None):
    return jsonify({'ok': True, 'data': data})
def err(msg, code=400):
    return jsonify({'ok': False, 'error': msg}), code

ALLOWED_PRODUCT_FIELDS = {'name','owner','collection','price','old_price','tag','sizes','stock','status','desc','image','featured','colors','icon'}

# ════════════════════════════════════════════════════════════════
# PRODUCTS
# ════════════════════════════════════════════════════════════════
@app.route('/api/products', methods=['GET', 'POST'])
@rate_limit(120, 60)
def api_products():
    if request.method == 'GET':
        collection = request.args.get('collection', 'all')
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        offset = (page - 1) * per_page

        params, where = [], []
        if collection != 'all':
            where.append('collection=?'); params.append(collection)
        if search:
            where.append('(name LIKE ? OR desc LIKE ?)')
            like = f'%{search}%'; params.extend([like, like])
        if status:
            where.append('status=?'); params.append(status)

        w = ' AND '.join(where) if where else '1=1'
        total = _val(f'SELECT COUNT(*) FROM products WHERE {w}', params)
        rows = _q(f'SELECT * FROM products WHERE {w} ORDER BY featured DESC, id DESC LIMIT ? OFFSET ?',
                  params + [per_page, offset])
        return jsonify({
            'products': [dict(r) for r in rows],
            'total': total, 'page': page, 'per_page': per_page,
            'pages': max(1, (total + per_page - 1) // per_page)
        })

    data = request.get_json()
    if not data or not data.get('name'):
        return err('Product name is required')
    _q('INSERT INTO products (name,owner,collection,price,old_price,tag,sizes,stock,status,desc,image,featured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
       (data['name'], data.get('owner',''), data.get('collection'), data.get('price'),
        data.get('old_price'), data.get('tag'), data.get('sizes','S,M,L,XL'),
        data.get('stock',0), data.get('status','active'), data.get('desc',''),
        data.get('image',''), data.get('featured',0)))
    return ok({'id': _last_id()})

@app.route('/api/products/<int:pid>', methods=['GET', 'PUT', 'DELETE'])
def api_product(pid):
    if request.method == 'GET':
        row = _one('SELECT * FROM products WHERE id=?', (pid,))
        return jsonify(dict(row)) if row else ('', 404)
    if request.method == 'PUT':
        data = request.get_json()
        if not data: return err('No data')
        allowed = {k: v for k, v in data.items() if k in ALLOWED_PRODUCT_FIELDS}
        if not allowed: return err('No valid fields')
        sets = ', '.join([f'{k}=?' for k in allowed])
        _q(f'UPDATE products SET {sets} WHERE id=?', list(allowed.values()) + [pid])
        return ok()
    _q('DELETE FROM products WHERE id=?', (pid,))
    return ok()

@app.route('/api/products/featured', methods=['GET'])
def api_featured():
    rows = _q('SELECT * FROM products WHERE featured=1 OR status IN ("NEW","LIMITED","HOT") LIMIT 6')
    return jsonify([dict(r) for r in rows])

@app.route('/api/products/bulk-delete', methods=['POST'])
def api_products_bulk_delete():
    data = request.get_json() or {}
    ids = data.get('ids', [])
    if not ids: return err('No IDs')
    ph = ','.join('?' * len(ids))
    _q(f'DELETE FROM products WHERE id IN ({ph})', ids)
    return ok({'deleted': len(ids)})

# ════════════════════════════════════════════════════════════════
# ORDERS
# ════════════════════════════════════════════════════════════════
@app.route('/api/orders', methods=['GET', 'POST'])
@rate_limit(60, 60)
def api_orders():
    if request.method == 'GET':
        phone = request.args.get('phone', '')
        status_f = request.args.get('status', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        offset = (page - 1) * per_page

        params, where = [], []
        if phone: where.append('phone LIKE ?'); params.append(f'%{phone}%')
        if status_f: where.append('status=?'); params.append(status_f)

        w = ' AND '.join(where) if where else '1=1'
        total = _val(f'SELECT COUNT(*) FROM orders WHERE {w}', params)
        rows = _q(f'SELECT * FROM orders WHERE {w} ORDER BY created_at DESC LIMIT ? OFFSET ?',
                  params + [per_page, offset])
        result = [dict(r) for r in rows]
        for r in result:
            try: r['items'] = json.loads(r['items'])
            except: pass
        return jsonify({'orders': result, 'total': total, 'page': page,
                        'pages': max(1, (total + per_page - 1) // per_page)})

    data = request.get_json()
    if not data or not data.get('first_name') or not data.get('phone'):
        return err('Name and phone are required')

    items = data.get('items', [])
    subtotal = data.get('subtotal', 0)
    shipping = data.get('shipping', 0)
    discount = data.get('discount', 0)
    total = data.get('total', subtotal + shipping - discount)
    coupon_code = data.get('coupon', '') or data.get('coupon_code', '')
    email = data.get('email', '')

    tracking = f"FLY{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(3).upper()[:6]}"
    if _one('SELECT id FROM orders WHERE tracking_code=?', (tracking,)):
        tracking = f"FLY{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(4).upper()[:8]}"

    _q('INSERT INTO orders (first_name,last_name,phone,email,wilaya,address,items,subtotal,shipping,discount,total,payment_method,tracking_code,coupon_code,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'pending\')',
       (data['first_name'], data.get('last_name',''), data['phone'], email,
        data.get('wilaya',''), data.get('address',''), json.dumps(items),
        subtotal, shipping, discount, total,
        data.get('payment_method','cod'), tracking, coupon_code))
    oid = _last_id()

    if coupon_code:
        _q('UPDATE coupons SET used=used+1 WHERE code=?', (coupon_code,))

    for item in items:
        pid = item.get('product_id') or item.get('id')
        qty = item.get('qty') or item.get('quantity', 1)
        if pid:
            _q('UPDATE products SET stock = MAX(0, stock - ?) WHERE id=?', (qty, pid))

    user_id = get_user_id(request)
    if user_id:
        row = _one('SELECT * FROM loyalty WHERE user_id=?', (user_id,))
        if row:
            _q('UPDATE loyalty SET points=points+?, total_spent=total_spent+? WHERE user_id=?',
               (int(total/1000), total, user_id))
        else:
            _q('INSERT INTO loyalty (user_id, points, total_spent, tier) VALUES (?,?,?,?)',
               (user_id, int(total/1000), total, 'Bronze'))

    # Blockchain-grade notification (just email + console)
    order = dict(_one('SELECT * FROM orders WHERE id=?', (oid,)))
    try: order['items'] = json.loads(order['items'])
    except: pass
    send_order_confirmation(order)
    print(f'[order] #{oid} {tracking} — {data["first_name"]} — {total:,} DZD')

    return ok({'id': oid, 'tracking': tracking, 'total': total})

@app.route('/api/orders/<int:oid>', methods=['GET', 'PUT'])
def api_order(oid):
    row = _one('SELECT * FROM orders WHERE id=?', (oid,))
    if not row: return err('Not found', 404)
    if request.method == 'PUT':
        data = request.get_json()
        allowed = ['status','tracking_code','notes','phone','wilaya','address']
        for k in allowed:
            if k in data:
                _q(f'UPDATE orders SET {k}=?, updated_at=? WHERE id=?',
                   (data[k], datetime.now().isoformat(), oid))
        return ok()
    d = dict(row)
    try: d['items'] = json.loads(d['items'])
    except: pass
    return jsonify(d)

@app.route('/api/orders/track/<code>', methods=['GET'])
def api_track(code):
    row = _one('SELECT * FROM orders WHERE tracking_code=?', (code.upper(),))
    if not row: return err('Not found', 404)
    d = dict(row)
    try: d['items'] = json.loads(d['items'])
    except: pass
    return jsonify(d)

@app.route('/api/orders/bulk-delete', methods=['POST'])
def api_orders_bulk_delete():
    data = request.get_json() or {}
    ids = data.get('ids', [])
    if not ids: return err('No IDs')
    ph = ','.join('?' * len(ids))
    _q(f'DELETE FROM orders WHERE id IN ({ph})', ids)
    return ok({'deleted': len(ids)})

# ════════════════════════════════════════════════════════════════
# COUPONS
# ════════════════════════════════════════════════════════════════
@app.route('/api/coupons', methods=['GET', 'POST'])
def api_coupons():
    if request.method == 'GET':
        rows = _q('SELECT * FROM coupons ORDER BY created_at DESC')
        return jsonify([dict(r) for r in rows])

    data = request.get_json()
    if not data or not data.get('code') or data.get('discount') is None:
        return err('Code and discount are required')
    code = data['code'].upper().strip()
    if _one('SELECT id FROM coupons WHERE code=?', (code,)):
        return err('Coupon code already exists')
    _q('INSERT INTO coupons (code,discount,type,min_order,max_uses,expires,active) VALUES (?,?,?,?,?,?,?)',
       (code, int(data['discount']), data.get('type','percent'),
        int(data.get('min_order',0)), int(data.get('max_uses',0)),
        data.get('expires'), data.get('active',1)))
    return ok({'id': _last_id()})

@app.route('/api/coupons/<int:cid>', methods=['PUT', 'DELETE'])
def api_coupon(cid):
    row = _one('SELECT * FROM coupons WHERE id=?', (cid,))
    if not row: return err('Not found', 404)
    if request.method == 'PUT':
        data = request.get_json()
        for k in ('code','discount','type','min_order','max_uses','expires','active'):
            if k in data:
                val = data[k].upper().strip() if k == 'code' else data[k]
                _q(f'UPDATE coupons SET {k}=? WHERE id=?', (val, cid))
        return ok()
    _q('DELETE FROM coupons WHERE id=?', (cid,))
    return ok()

@app.route('/api/coupons/validate', methods=['POST'])
def api_coupon_validate():
    data = request.get_json() or {}
    code = data.get('code', '').upper().strip()
    subtotal = data.get('subtotal', 0)
    if not code: return jsonify({'valid': False, 'error': 'No code'})
    row = _one('SELECT * FROM coupons WHERE code=?', (code,))
    if not row: return jsonify({'valid': False, 'error': 'Invalid code'})
    if not row['active']: return jsonify({'valid': False, 'error': 'Deactivated'})
    if row['max_uses'] > 0 and row['used'] >= row['max_uses']:
        return jsonify({'valid': False, 'error': 'Usage limit reached'})
    if row['expires']:
        try:
            if datetime.now() > datetime.fromisoformat(str(row['expires']).replace('Z','')):
                return jsonify({'valid': False, 'error': 'Expired'})
        except: pass
    if subtotal < row['min_order']:
        return jsonify({'valid': False, 'error': f'Min order: {row["min_order"]:,} DZD'})
    discount = row['discount']
    if row['type'] == 'percent':
        discount = int(subtotal * discount / 100)
    return jsonify({'valid': True, 'discount': discount, 'type': row['type'],
                    'raw': row['discount'], 'code': code})

# ════════════════════════════════════════════════════════════════
# CART
# ════════════════════════════════════════════════════════════════
@app.route('/api/cart/<int:ciid>', methods=['PUT', 'DELETE'])
def api_cart_item(ciid):
    sid = get_session_id(request)
    if request.method == 'PUT':
        data = request.get_json() or {}
        _q('UPDATE cart_items SET quantity=? WHERE id=? AND session_id=?',
           (data.get('quantity', 1), ciid, sid))
        return ok()
    _q('DELETE FROM cart_items WHERE id=? AND session_id=?', (ciid, sid))
    return ok()

@app.route('/api/cart', methods=['GET', 'POST', 'DELETE'])
def api_cart():
    sid = get_session_id(request)
    if request.method == 'GET':
        rows = _q('SELECT c.*, p.name, p.price, p.icon, p.stock, p.sizes, p.image FROM cart_items c LEFT JOIN products p ON c.product_id=p.id WHERE c.session_id=?', (sid,))
        return jsonify([dict(r) for r in rows])
    if request.method == 'POST':
        data = request.get_json()
        pid, qty, size = data.get('product_id'), data.get('quantity', 1), data.get('size', '')
        existing = _one('SELECT * FROM cart_items WHERE session_id=? AND product_id=? AND size=?', (sid, pid, size))
        if existing:
            _q('UPDATE cart_items SET quantity=? WHERE id=?', (existing['quantity']+qty, existing['id']))
        else:
            _q('INSERT INTO cart_items (session_id, product_id, quantity, size) VALUES (?,?,?,?)', (sid, pid, qty, size))
        return ok()
    if request.method == 'DELETE':
        pid = request.args.get('product_id')
        if pid:
            _q('DELETE FROM cart_items WHERE session_id=? AND product_id=?', (sid, int(pid)))
        else:
            _q('DELETE FROM cart_items WHERE session_id=?', (sid,))
        return ok()

# ════════════════════════════════════════════════════════════════
# WISHLIST
# ════════════════════════════════════════════════════════════════
@app.route('/api/wishlist', methods=['GET', 'POST', 'DELETE'])
def api_wishlist():
    sid = get_session_id(request)
    uid = get_user_id(request)
    if request.method == 'GET':
        rows = _q('SELECT w.*, p.name, p.price, p.icon, p.stock, p.collection, p.image FROM wishlist w LEFT JOIN products p ON w.product_id=p.id WHERE w.session_id=? OR (w.user_id=? AND w.session_id IS NULL)', (sid, uid or 0))
        return jsonify([dict(r) for r in rows])
    if request.method == 'POST':
        pid = request.get_json().get('product_id')
        existing = _one('SELECT * FROM wishlist WHERE product_id=? AND (session_id=? OR user_id=?)', (pid, sid, uid))
        if not existing:
            _q('INSERT INTO wishlist (session_id, user_id, product_id) VALUES (?,?,?)', (sid, uid, pid))
        return ok()
    if request.method == 'DELETE':
        pid = request.args.get('product_id')
        _q('DELETE FROM wishlist WHERE product_id=? AND (session_id=? OR user_id=?)', (pid, sid, uid or 0))
        return ok()

# ════════════════════════════════════════════════════════════════
# AUTH
# ════════════════════════════════════════════════════════════════
@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json()
    if _one('SELECT id FROM users WHERE email=?', (data.get('email'),)):
        return err('Email already registered')
    _q('INSERT INTO users (email,password_hash,first_name,last_name,phone,wilaya,address) VALUES (?,?,?,?,?,?,?)',
       (data.get('email'), hash_pw(data.get('password','')), data.get('first_name'),
        data.get('last_name'), data.get('phone'), data.get('wilaya'), data.get('address')))
    uid = _last_id()
    token = make_token()
    _q('INSERT INTO sessions (user_id, token, expires) VALUES (?,?,?)',
       (uid, token, (datetime.now() + timedelta(days=30)).isoformat()))
    _q('INSERT INTO loyalty (user_id, points, tier) VALUES (?,0,\'Bronze\')', (uid,))
    return ok({'token': token, 'user_id': uid})

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json()
    row = _one('SELECT * FROM users WHERE email=? AND password_hash=?',
               (data.get('email'), hash_pw(data.get('password',''))))
    if not row: return err('Invalid credentials', 401)
    token = make_token()
    _q('INSERT INTO sessions (user_id, token, expires) VALUES (?,?,?)',
       (row['id'], token, (datetime.now() + timedelta(days=30)).isoformat()))
    return jsonify({'token': token, 'user_id': row['id'], 'email': row['email'],
                    'first_name': row['first_name']})

@app.route('/api/auth/profile', methods=['GET', 'PUT'])
def api_profile():
    uid = get_user_id(request)
    if not uid: return err('Unauthorized', 401)
    if request.method == 'GET':
        row = _one('SELECT id,email,first_name,last_name,phone,wilaya,address,created_at FROM users WHERE id=?', (uid,))
        return jsonify(dict(row)) if row else ('', 404)
    data = request.get_json()
    for k in ['first_name','last_name','phone','wilaya','address']:
        if k in data: _q(f'UPDATE users SET {k}=? WHERE id=?', (data[k], uid))
    return ok()

# ════════════════════════════════════════════════════════════════
# STATS
# ════════════════════════════════════════════════════════════════
@app.route('/api/stats', methods=['GET'])
@cached(ttl=15)
def api_stats():
    total_orders = _val("SELECT COUNT(*) FROM orders")
    total_revenue = _val("SELECT COALESCE(SUM(total),0) FROM orders WHERE status!='cancelled'")
    total_products = _val("SELECT COUNT(*) FROM products")
    total_users = _val("SELECT COUNT(*) FROM users")
    total_coupons = _val("SELECT COUNT(*) FROM coupons")

    status_breakdown = _q("SELECT status, COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders GROUP BY status")
    wilaya_breakdown = _q("SELECT wilaya, COUNT(*) as orders, COALESCE(SUM(total),0) as revenue FROM orders GROUP BY wilaya ORDER BY revenue DESC LIMIT 10")
    low_stock = _q("SELECT * FROM products WHERE stock < 10 AND stock > 0")
    out_of_stock = _q("SELECT * FROM products WHERE stock = 0")
    recent_orders = _q("SELECT * FROM orders ORDER BY created_at DESC LIMIT 10")

    today_orders = _val("SELECT COUNT(*) FROM orders WHERE date(created_at)=date('now')")
    today_revenue = _val("SELECT COALESCE(SUM(total),0) FROM orders WHERE date(created_at)=date('now') AND status!='cancelled'")

    orders_by_date = _q("SELECT date(created_at) as day, COUNT(*) as orders, COALESCE(SUM(total),0) as revenue FROM orders WHERE created_at >= date('now','-30 days') GROUP BY day ORDER BY day")

    monthly_revenue = _q("SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(total),0) as revenue, COUNT(*) as orders FROM orders WHERE status!='cancelled' GROUP BY month ORDER BY month DESC LIMIT 12")

    return jsonify({
        'total_orders': total_orders, 'total_revenue': total_revenue,
        'total_products': total_products, 'total_users': total_users,
        'total_coupons': total_coupons,
        'today_orders': today_orders, 'today_revenue': today_revenue,
        'status_breakdown': [dict(r) for r in status_breakdown],
        'wilaya_breakdown': [dict(r) for r in wilaya_breakdown],
        'low_stock': [dict(r) for r in low_stock],
        'out_of_stock': [dict(r) for r in out_of_stock],
        'recent_orders': [dict(r) for r in recent_orders],
        'orders_by_date': [dict(r) for r in orders_by_date],
        'monthly_revenue': [dict(r) for r in monthly_revenue],
    })

@app.route('/api/stats/dashboard', methods=['GET'])
@cached(ttl=10)
def api_dashboard():
    period = request.args.get('period', '7d')
    days = {'1d':1,'7d':7,'30d':30,'90d':90}.get(period, 7)
    revenue = _val("SELECT COALESCE(SUM(total),0) FROM orders WHERE created_at >= datetime('now',?) AND status!='cancelled'", (f'-{days} days',))
    orders_count = _val("SELECT COUNT(*) FROM orders WHERE created_at >= datetime('now',?)", (f'-{days} days',))
    avg_order = int(revenue / orders_count) if orders_count else 0
    return jsonify({'revenue': revenue, 'orders': orders_count,
                    'avg_order': avg_order, 'period': period})

# ════════════════════════════════════════════════════════════════
# LOYALTY / DROPS / NOTIFICATIONS / REVIEWS
# ════════════════════════════════════════════════════════════════
@app.route('/api/loyalty', methods=['GET'])
def api_loyalty():
    uid = get_user_id(request) or None
    sid = get_session_id(request)
    row = _one('SELECT * FROM loyalty WHERE user_id=? OR session_id=?', (uid or 0, sid))
    if not row:
        return jsonify({'points': 0, 'tier': 'Bronze', 'total_spent': 0})
    pts = row['points'] or 0
    tier = 'Platinum' if pts >= 50000 else 'Gold' if pts >= 25000 else 'Silver' if pts >= 10000 else 'Bronze'
    return jsonify({'points': pts, 'tier': tier, 'total_spent': row['total_spent'] or 0})

@app.route('/api/drops', methods=['GET', 'POST'])
def api_drops():
    if request.method == 'GET':
        rows = _q('SELECT d.*, p.name, p.price, p.icon, p.collection FROM drops d LEFT JOIN products p ON d.product_id=p.id ORDER BY d.launch_date ASC')
        return jsonify([dict(r) for r in rows])
    data = request.get_json()
    _q('INSERT INTO drops (product_id, launch_date) VALUES (?,?)',
       (data.get('product_id'), data.get('launch_date')))
    return ok()

@app.route('/api/drops/<int:did>', methods=['PUT', 'DELETE'])
def api_drop(did):
    if request.method == 'PUT':
        data = request.get_json() or {}
        fields = []
        vals = []
        for k in ('product_id','launch_date','status'):
            if k in data: fields.append(f'{k}=?'); vals.append(data[k])
        if fields:
            vals.append(did)
            _q(f'UPDATE drops SET {",".join(fields)} WHERE id=?', tuple(vals))
        return ok()
    _q('DELETE FROM drops WHERE id=?', (did,))
    return ok()

@app.route('/api/notifications', methods=['GET'])
def api_notifications():
    sid = get_session_id(request)
    uid = get_user_id(request)
    rows = _q('SELECT * FROM notifications WHERE session_id=? OR user_id=? ORDER BY created_at DESC LIMIT 20', (sid, uid or 0))
    return jsonify([dict(r) for r in rows])

@app.route('/api/notifications/read', methods=['POST'])
def api_mark_read():
    _q("UPDATE notifications SET read=1 WHERE read=0")
    return ok()

@app.route('/api/reviews', methods=['GET', 'POST'])
def api_reviews():
    if request.method == 'GET':
        pid = request.args.get('product_id')
        if pid:
            rows = _q('SELECT r.*, u.first_name FROM reviews r LEFT JOIN users u ON r.user_id=u.id WHERE product_id=? ORDER BY created_at DESC', (pid,))
        else:
            rows = _q('SELECT r.*, u.first_name, p.name as product_name FROM reviews r LEFT JOIN users u ON r.user_id=u.id LEFT JOIN products p ON r.product_id=p.id ORDER BY r.created_at DESC')
        return jsonify([dict(r) for r in rows])
    data = request.get_json()
    uid = get_user_id(request)
    _q('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?,?,?,?)',
       (data.get('product_id'), uid, data.get('rating',5), data.get('comment','')))
    return ok()

@app.route('/api/reviews/<int:rid>', methods=['PUT', 'DELETE'])
def api_review(rid):
    if request.method == 'PUT':
        data = request.get_json() or {}
        for k in ('rating','comment','status'):
            if k in data: _q(f'UPDATE reviews SET {k}=? WHERE id=?', (data[k], rid))
        return ok()
    _q('DELETE FROM reviews WHERE id=?', (rid,))
    return ok()

@app.route('/api/loyalty', methods=['POST'])
def api_loyalty_add():
    data = request.get_json() or {}
    uid = get_user_id(request)
    sid = get_session_id(request)
    existing = _one('SELECT * FROM loyalty WHERE user_id=? OR session_id=?', (uid or 0, sid))
    if existing:
        _q('UPDATE loyalty SET points=points+?, total_spent=total_spent+? WHERE id=?',
           (data.get('points', 0), data.get('spent', 0), existing['id']))
    else:
        _q('INSERT INTO loyalty (user_id, session_id, points, total_spent) VALUES (?,?,?,?)',
           (uid, sid, data.get('points', 0), data.get('spent', 0)))
    return ok()

@app.route('/api/customers', methods=['GET'])
def api_customers():
    rows = _q('SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.wilaya, u.address, u.created_at, '
              '(SELECT COUNT(*) FROM orders WHERE user_id=u.id) as order_count, '
              '(SELECT COALESCE(SUM(total),0) FROM orders WHERE user_id=u.id AND status!=\'cancelled\') as total_spent '
              'FROM users u WHERE u.id IS NOT NULL ORDER BY u.created_at DESC')
    guests = _q("SELECT first_name,last_name,phone,email,wilaya,address,COUNT(*) as order_count,"
                "COALESCE(SUM(total),0) as total_spent FROM orders "
                "WHERE (user_id IS NULL OR user_id=0) AND email IS NOT NULL AND email!='' "
                "GROUP BY email,phone ORDER BY order_count DESC")
    result = [dict(r) for r in rows]
    for g in guests:
        d = dict(g); d['id'] = 0; d['guest'] = True
        result.append(d)
    return jsonify(result)

# ════════════════════════════════════════════════════════════════
# AI CHAT
# ════════════════════════════════════════════════════════════════
@app.route('/api/chat', methods=['POST'])
@rate_limit(30, 60)
def api_chat():
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    lang = data.get('lang') or detect_lang(message)
    if not message:
        return jsonify({'reply': 'مرحباً! / Bonjour! / Hello! How can I help you?'})

    products = _q("SELECT * FROM products WHERE status != 'drop' ORDER BY featured DESC LIMIT 12")
    product_list = '\n'.join([f"- {p['name']} | {p['collection']} | {p['price']:,} DZD | Sizes: {p['sizes']} | Stock: {p['stock']} | {p['status']} | {p['tag'] or ''}" for p in products])

    system = f'''You are FLYRA AI Stylist — Algeria's premier fashion AI. FLYRA sells Old Money, Streetwear, Heritage, Sport fashion across 58 wilayas.

Catalog:
{product_list}

Rules:
- Speak in the user's language
- Under 80 words
- Recommend specific products by name
- Shipping: 2-5 days, FREE over 25,000 DZD
- Payment: COD, CCP, BaridiMob, Edahabia
- Returns: 7 days, unused with tags
- Contact: WhatsApp +213 555 123 456'''

    ar_system = f'''أنت المصمم الذكي FLYRA — مساعد الأزياء الأول في الجزائر.

المنتجات:
{product_list}

القواعد:
- أجب بنفس لغة المستخدم
- أقل من 80 كلمة
- اذكر أسماء المنتجات
- الشحن: 2-5 أيام، مجاني فوق 25,000 د.ج
- الدفع: عند الاستلام، CCP، بريدي موب، الذهبية'''

    system_prompt = system if lang != 'ar' else ar_system
    reply = None
    has_ollama = False
    try:
        import urllib.request
        req = urllib.request.Request('http://localhost:11434/api/tags')
        urllib.request.urlopen(req, timeout=2)
        has_ollama = True
    except: pass

    if has_ollama:
        try:
            import urllib.request
            payload = {'model': 'llama3.2', 'messages': [{'role':'system','content':system_prompt},
                       {'role':'user','content':message}], 'stream': False,
                       'options': {'temperature': 0.7, 'num_predict': 250}}
            req = urllib.request.Request('http://localhost:11434/api/chat',
                 data=json.dumps(payload).encode(),
                 headers={'Content-Type':'application/json'}, method='POST')
            with urllib.request.urlopen(req, timeout=30) as resp:
                reply = json.loads(resp.read())['message']['content']
        except: pass

    if not reply:
        fallback = {
            'en': [
                "FLYRA's PHANTOM STREET HOODIE is our top pick! Oversized with heavy-weight French terry. Pair with SKY RUNNER SNEAKERS for the ultimate street look.",
                "For Old Money style, the BLAZER is unmatched — Italian wool, structured shoulders. Add an AMBER TEE underneath for a sophisticated vibe.",
                "Heritage GANDOURA with hand embroidery from Tlemcen workshops — a true statement piece in sizes S-XXL.",
                "Sport TECH JOGGERS with reflective taping + SKY RUNNER SNEAKERS = track-to-street perfection.",
                "Free shipping over 25,000 DZD across all 58 wilayas. Cash on delivery available!",
                "The BROCADE VEST is limited edition — traditional Algerian brocade with gold thread. Only 4 left!",
            ],
            'ar': [
                "قميص PHANTOM STREET HOODIE هو اختيارنا الأول! قصّة أوفر مع قماش فرنسي ثقيل. أضف SKY RUNNER SNEAKERS.",
                "لأسلوب Old Money، البليزر لا يُضاهى — صوف إيطالي. أضف AMBER TEE من الداخل.",
                "الجلبوبة التراثية بالتطريز اليدوي من تلمسان — قطعة مميزة بمقاسات S-XXL.",
                "بنطلون TECH JOGGERS مع شريط عاكس + SKY RUNNER SNEAKERS = مثالية.",
                "شحن مجاني فوق 25,000 دج لجميع 58 ولاية. الدفع عند الاستلام متوفر!",
            ],
        }
        import random
        reply = random.choice(fallback.get(lang, fallback['en']))

    return jsonify({'reply': reply, 'lang': lang, 'timestamp': datetime.now().isoformat()})

@app.route('/api/chat/history', methods=['GET', 'POST'])
def api_chat_history():
    sid = get_session_id(request)
    hfile = BASE / f'chat_{sid[:16]}.json'
    if request.method == 'GET':
        if hfile.exists():
            return jsonify(json.loads(hfile.read_text()))
        return jsonify([])
    data = request.get_json() or []
    hfile.write_text(json.dumps(data[-50:]))
    return ok()

def detect_lang(text):
    arabic = len(re.findall(r'[\u0600-\u06FF]', text or ''))
    french = sum(1 for w in ['bonjour','merci','je','vous','comment','pour','une','des','les','dans','avec','mon'] if w.lower() in (text or '').lower())
    return 'ar' if arabic > 3 else 'fr' if french > 1 else 'en'

# ════════════════════════════════════════════════════════════════
# SEARCH
# ════════════════════════════════════════════════════════════════
@app.route('/api/search', methods=['GET'])
def api_search():
    q = request.args.get('q', '').strip()
    if not q or len(q) < 2: return jsonify([])
    rows = _q("SELECT * FROM products WHERE name LIKE ? OR collection LIKE ? OR desc LIKE ? OR tag LIKE ? LIMIT 20",
              (f'%{q}%', f'%{q}%', f'%{q}%', f'%{q}%'))
    return jsonify([dict(r) for r in rows])

@app.route('/api/search/suggest', methods=['GET'])
def api_search_suggest():
    q = request.args.get('q', '').strip()
    if not q: return jsonify([])
    rows = _q("SELECT DISTINCT name FROM products WHERE name LIKE ? LIMIT 8", (f'%{q}%',))
    return jsonify([r['name'] for r in rows])

# ════════════════════════════════════════════════════════════════
# UPLOAD
# ════════════════════════════════════════════════════════════════
@app.route('/api/upload', methods=['POST'])
def api_upload():
    if 'file' in request.files:
        f = request.files['file']
        if f.filename:
            fn = secure_filename(f'{uuid.uuid4().hex}_{f.filename}')
            f.save(str(UPLOAD_DIR / fn))
            return jsonify({'url': f'/uploads/{fn}', 'filename': fn})

    data = request.get_json() or {}
    img_data = data.get('image', '')
    if not img_data: return err('No image')
    try:
        fmt, b64 = img_data.split(',', 1) if ',' in img_data else ('png', img_data)
        fmt = fmt.replace('data:image/', '').replace(';base64', '').split(';')[0] or 'png'
        fn = f"{uuid.uuid4().hex}.{fmt}"
        (UPLOAD_DIR / fn).write_bytes(base64.b64decode(b64))
        return jsonify({'url': f'/uploads/{fn}', 'filename': fn})
    except Exception as e:
        return err(str(e))

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(str(UPLOAD_DIR), filename)

# ════════════════════════════════════════════════════════════════
# EXPORT
# ════════════════════════════════════════════════════════════════
@app.route('/api/export/orders', methods=['GET'])
def api_export_orders():
    rows = _q('SELECT * FROM orders ORDER BY created_at DESC')
    csv = 'ID,First Name,Last Name,Phone,Email,Wilaya,Address,Items,Subtotal,Shipping,Discount,Total,Payment,Status,Tracking,Created\n'
    for r in rows:
        items = json.loads(r['items'] or '[]')
        csv += f"{r['id']},{r['first_name']},{r['last_name']},{r['phone']},{r.get('email','')},{r['wilaya']},{r['address']},\"{items}\",{r['subtotal']},{r['shipping']},{r['discount']},{r['total']},{r['payment_method']},{r['status']},{r['tracking_code']},{r['created_at']}\n"
    return Response(csv, mimetype='text/csv',
                    headers={'Content-Disposition': 'attachment; filename=flyra_orders.csv'})

@app.route('/api/export/products', methods=['GET'])
def api_export_products():
    rows = _q('SELECT * FROM products')
    csv = 'ID,Name,Collection,Price,Old Price,Tag,Sizes,Stock,Status,Description\n'
    for r in rows:
        csv += f"{r['id']},{r['name']},{r['collection']},{r['price']},{r['old_price'] or ''},{r['tag'] or ''},{r['sizes']},{r['stock']},{r['status']},{r['desc']}\n"
    return Response(csv, mimetype='text/csv',
                    headers={'Content-Disposition': 'attachment; filename=flyra_products.csv'})

@app.route('/api/export/backup', methods=['GET'])
def api_export_backup():
    backup = {}
    for table in ['products','orders','users','coupons','settings','drops','reviews']:
        try:
            rows = _q(f'SELECT * FROM {table}')
            backup[table] = [dict(r) for r in rows]
        except: backup[table] = []
    return jsonify(backup)

# ════════════════════════════════════════════════════════════════
# WILAYAS / SETTINGS / HEALTH
# ════════════════════════════════════════════════════════════════
@app.route('/api/wilayas', methods=['GET'])
def api_wilayas():
    return jsonify({'wilayas': list(set([
        'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira',
        'Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda',
        'Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem','Mila','Mascara',
        'Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arreridj','El Tarf','Tindouf','Tissemsilt',
        'El Oued','Khenchela','Souk Ahras','Tipaza','Ksar El Boukhari','El Meghaier',
        'In Salah','In Guezzam','Touggourt','Djanet','Boumerdès','Aïn Defla','Naâma','Aïn Témouchent',
        'Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar','Ouled Djellal','Béni Abbès','El Meniaa'
    ]))})

@app.route('/api/settings', methods=['GET', 'POST'])
def api_settings():
    if request.method == 'GET':
        rows = _q('SELECT key, value FROM settings')
        result = {}
        for r in rows:
            try: result[r['key']] = json.loads(r['value'])
            except: result[r['key']] = r['value']
        return jsonify(result)
    data = request.get_json() or {}
    for k, v in data.items():
        _q('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)',
           (k, json.dumps(v) if isinstance(v, (dict, list)) else str(v)))
    return ok()

@app.route('/api/health', methods=['GET'])
def api_health():
    try:
        c = _val('SELECT COUNT(*) FROM products')
        health = 'ok'
    except:
        health = 'degraded'; c = 0
    return jsonify({
        'status': health, 'version': '3.0', 'platform': 'FLYRA',
        'database': 'postgresql' if USE_PG else 'sqlite',
        'uptime': int(time.time() - APP_START),
        'stats': {
            'products': c,
            'orders': _val("SELECT COUNT(*) FROM orders") if health == 'ok' else 0,
            'users': _val("SELECT COUNT(*) FROM users") if health == 'ok' else 0,
            'coupons': _val("SELECT COUNT(*) FROM coupons") if health == 'ok' else 0,
            'revenue': _val("SELECT COALESCE(SUM(total),0) FROM orders WHERE status!='cancelled'") if health == 'ok' else 0,
        }
    })

# ════════════════════════════════════════════════════════════════
# FRONTEND
# ════════════════════════════════════════════════════════════════
@app.route('/')
def serve_index():
    fp = BASE / 'index.html'
    if fp.exists(): return send_file(str(fp))
    return '<h1>FLYRA — صعود بلا حدود</h1><p><a href="/api/health">Health</a></p>'

@app.route('/admin')
@app.route('/admin.html')
def serve_admin():
    fp = BASE / 'admin.html'
    if fp.exists(): return send_file(str(fp))
    return '<h1>FLYRA Admin</h1>'

@app.route('/<path:page>.html')
def serve_page(page):
    fp = BASE / f'{page}.html'
    if fp.exists(): return send_file(str(fp))
    return ('', 404)

# ════════════════════════════════════════════════════════════════
# INIT
# ════════════════════════════════════════════════════════════════
migrate_schema()

if __name__ == '__main__':
    db_type = 'PostgreSQL' if USE_PG else 'SQLite'
    try: db_size = os.path.getsize(DB_PATH)/1024
    except: db_size = 0
    print(f"""
╔══════════════════════════════════════════════════════════╗
║              FLYRA BACKEND v3.0                          ║
╠══════════════════════════════════════════════════════════╣
║  Database:  {db_type:<39}║
║  Port:      5555                                         ║
║  Health:    http://localhost:5555/api/health             ║
║  Features:  Email • Coupons • Search • Export • Cache   ║
╠══════════════════════════════════════════════════════════╣
║  FLYRA — Algerian Fashion Platform v3                    ║
║  صعود بلا حدود                                          ║
╚══════════════════════════════════════════════════════════╝
""")
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5555)), debug=False)
