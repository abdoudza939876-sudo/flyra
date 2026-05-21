#!/usr/bin/env python3
"""
FLYRA Backend — Flask API Server
The Algerian Fashion Platform
Run: python flyra_backend.py
"""

import os, sys, json, time, sqlite3, hashlib, secrets, re, math
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, g, send_from_directory, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

DB_PATH = os.path.join(os.path.dirname(__file__), 'flyra.db')
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

IS_PG = 'DATABASE_URL' in os.environ

# ================================================================
# DATABASE ABSTRACTION (SQLite local / PostgreSQL on Render)
# ================================================================
class Row(dict):
    """Dict-like row that also supports integer indexing (for compatibility)."""
    def __getitem__(self, key):
        if isinstance(key, int):
            vals = list(self.values())
            return vals[key] if key < len(vals) else None
        return super().__getitem__(key)


class Result:
    def __init__(self, cursor, is_pg=False):
        self._cursor = cursor
        self._is_pg = is_pg

    def fetchone(self):
        row = self._cursor.fetchone()
        if row is None:
            return None
        if self._is_pg:
            return Row(row)
        return row

    def fetchall(self):
        rows = self._cursor.fetchall()
        if self._is_pg:
            return [Row(r) for r in rows]
        return rows

    @property
    def lastrowid(self):
        return self._cursor.lastrowid if hasattr(self._cursor, 'lastrowid') else None


class Db:
    def __init__(self, conn):
        self.conn = conn
        self.is_pg = IS_PG

    def sql(self, q):
        if not self.is_pg:
            return q
        q = q.replace('?', '%s')
        q = q.replace('date("now", ?)', "CURRENT_DATE - CAST(%s AS INTERVAL)")
        q = q.replace("date('now', ?)", "CURRENT_DATE - CAST(%s AS INTERVAL)")
        q = q.replace("date('now')", 'CURRENT_DATE')
        q = q.replace('date("now")', 'CURRENT_DATE')
        q = q.replace('datetime("now")', 'CURRENT_TIMESTAMP')
        q = q.replace("datetime('now')", 'CURRENT_TIMESTAMP')
        q = q.replace('"', "'")
        q = q.replace("LIKE '%'||p.name||'%'", "LIKE '%' || p.name || '%'")
        q = q.replace("LIKE '%'||p.name||'%'", "LIKE '%' || p.name || '%'")
        # INSERT OR REPLACE → INSERT ... ON CONFLICT DO UPDATE
        q = re.sub(
            r"INSERT OR REPLACE INTO (\w+) \((.*?)\) VALUES \((.*?)\)",
            r"INSERT INTO \1 (\2) VALUES (\3) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value",
            q
        )
        return q

    def _cursor(self):
        if self.is_pg:
            from psycopg2.extras import RealDictCursor
            return self.conn.cursor(cursor_factory=RealDictCursor)
        return self.conn.cursor()

    def execute(self, sql, params=None):
        if self.is_pg:
            sql = self.sql(sql)
        cur = self._cursor()
        if params:
            cur.execute(sql, params if isinstance(params, (tuple, list)) else (params,))
        else:
            cur.execute(sql)
        return Result(cur, self.is_pg)

    def executemany(self, sql, seq):
        if self.is_pg:
            sql = self.sql(sql)
            for params in seq:
                cur = self._cursor()
                cur.execute(sql, params)
        else:
            self.conn.executemany(sql, seq)

    def executescript(self, script):
        if self.is_pg:
            cur = self.conn.cursor()
            for stmt in script.split(';'):
                s = stmt.strip()
                if not s:
                    continue
                s = s.replace('AUTOINCREMENT', 'GENERATED ALWAYS AS IDENTITY')
                s = self.sql(s)
                s = s.replace("''", "'")
                s = s.replace("'s", "''s")
                try:
                    cur.execute(s)
                except Exception:
                    pass
        else:
            self.conn.executescript(script)

    def commit(self):
        if not self.is_pg:
            self.conn.commit()

    def last_insert_id(self):
        """Get last inserted row ID (works for both SQLite and PostgreSQL)."""
        if self.is_pg:
            cur = self._cursor()
            cur.execute('SELECT LASTVAL()')
            return cur.fetchone()[0]
        cur = self._cursor()
        cur.execute('SELECT last_insert_rowid()')
        return cur.fetchone()[0]

    def close(self):
        self.conn.close()


def make_db():
    if IS_PG:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        conn.autocommit = True
        return Db(conn)
    conn = sqlite3.connect(DB_PATH, timeout=20, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA busy_timeout=5000')
    return Db(conn)


def get_db():
    if 'db' not in g:
        g.db = make_db()
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    db = make_db()
    
    if IS_PG:
        db.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT, last_name TEXT,
                phone TEXT, wilaya TEXT,
                address TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL, collection TEXT,
                price INTEGER, old_price INTEGER,
                owner TEXT, tag TEXT, sizes TEXT,
                stock INTEGER DEFAULT 0, status TEXT DEFAULT 'active',
                desc TEXT, image TEXT, featured INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER, first_name TEXT, last_name TEXT,
                phone TEXT, wilaya TEXT, address TEXT,
                items TEXT, total INTEGER, subtotal INTEGER,
                shipping INTEGER DEFAULT 0, payment_method TEXT DEFAULT 'cod',
                status TEXT DEFAULT 'pending',
                tracking_code TEXT, notes TEXT,
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
                expires TEXT,
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
        ''')
    else:
        db.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT, last_name TEXT,
                phone TEXT, wilaya TEXT,
                address TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL, collection TEXT,
                price INTEGER, old_price INTEGER,
                owner TEXT, tag TEXT, sizes TEXT,
                stock INTEGER DEFAULT 0, status TEXT DEFAULT 'active',
                desc TEXT, image TEXT, featured INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER, first_name TEXT, last_name TEXT,
                phone TEXT, wilaya TEXT, address TEXT,
                items TEXT, total INTEGER, subtotal INTEGER,
                shipping INTEGER DEFAULT 0, payment_method TEXT DEFAULT 'cod',
                status TEXT DEFAULT 'pending',
                tracking_code TEXT, notes TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT, product_id INTEGER,
                quantity INTEGER DEFAULT 1, size TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS wishlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER, session_id TEXT, product_id INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS drops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER, launch_date TEXT,
                status TEXT DEFAULT 'scheduled',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER, session_id TEXT,
                title TEXT, message TEXT, read INTEGER DEFAULT 0,
                type TEXT DEFAULT 'info',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS loyalty (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER, session_id TEXT,
                points INTEGER DEFAULT 0, tier TEXT DEFAULT 'Bronze',
                total_spent INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER, user_id INTEGER,
                rating INTEGER, comment TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                token TEXT UNIQUE NOT NULL,
                expires TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );
            CREATE TABLE IF NOT EXISTS stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT, views INTEGER DEFAULT 0,
                orders INTEGER DEFAULT 0, revenue INTEGER DEFAULT 0
            );
        ''')
    
    row = db.execute('SELECT COUNT(*) FROM products').fetchone()
    count = row[0]
    if count == 0:
        seed_data(db)
    
    db.commit()
    db.close()

def seed_data(db):
    products = [
        ('HERITAGE GANDOURA', 'heritage', 28000, 35000, 'FLYRA Atelier', 'HERITAGE', 'S/M/L/XL/XXL', 8, 'active', 'Hand-embroidered traditional Algerian Gandoura. Pure linen from Tlemcen workshops.', 0),
        ('PHANTOM STREET HOODIE', 'street', 18000, 24000, 'FLYRA Studio', 'NEW', 'S/M/L/XL', 15, 'active', 'Oversized silhouette. Heavy-weight 420gsm French terry. Phantom collection.', 1),
        ('OLD MONEY BLAZER', 'oldmoney', 45000, 55000, 'FLYRA Haute', 'PREMIUM', 'S/M/L/XL', 5, 'active', 'Italian wool blend. Structured shoulders. The Algiers executive look.', 0),
        ('SKY RUNNER SNEAKERS', 'sport', 22000, 28000, 'FLYRA Sport', 'NEW', '38/40/42/44/46', 20, 'active', 'Algerian-designed upper. Memory foam insole. Street-to-stadium versatility.', 1),
        ('DJELLABA MODERNE', 'heritage', 24000, 30000, 'FLYRA Atelier', 'HERITAGE', 'S/M/L/XL/XXL', 10, 'active', 'Contemporary cut meets traditional silhouette. Breathable cotton blend.', 0),
        ('SILENT SHORTS', 'sport', 8500, None, 'FLYRA Sport', 'SALE', 'S/M/L/XL', 25, 'active', 'Technical woven fabric. Hidden zip pockets. Sport meets street.', 0),
        ('AMBER TEE', 'street', 6500, None, 'FLYRA Studio', None, 'XS/S/M/L/XL/XXL', 40, 'active', 'Premium 200gsm cotton. Embroidered FLYRA crest. The essential base layer.', 1),
        ('SPORT TECH JOGGERS', 'sport', 12000, 16000, 'FLYRA Sport', 'NEW', 'S/M/L/XL', 18, 'active', 'Track-inspired cut. Tapered leg. Reflective FLYRA taping.', 0),
        ('ALGIERS CAP', 'street', 4500, None, 'FLYRA Studio', None, 'M/L', 30, 'active', 'Structured six-panel. Embroidered skyline of Algiers. Adjustable strap.', 0),
        ('BROCADE VEST', 'heritage', 35000, 42000, 'FLYRA Atelier', 'LIMITED', 'S/M/L/XL', 4, 'limited', 'Traditional Algerian brocade fabric. Gold-thread patterns. Heritage luxury.', 0),
    ]
    
    db.executemany('''
        INSERT INTO products (name, collection, price, old_price, owner, tag, sizes, stock, status, desc, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', products)
    
    sample_orders = [
        ('Ahmed', 'Bensalah', '0555123456', 'Alger', 'Bab El Oued', '[{"id":1,"name":"HERITAGE GANDOURA","price":28000,"size":"M","qty":1}]', 28000, 28000, 0, 'cod', 'delivered', 'FLY2025060001'),
        ('Fatima', 'Zohra', '0661234567', 'Oran', 'Centre ville', '[{"id":2,"name":"PHANTOM STREET HOODIE","price":18000,"size":"L","qty":1},{"id":9,"name":"ALGIERS CAP","price":4500,"size":"M/L","qty":1}]', 22500, 22500, 0, 'ccp', 'shipped', 'FLY2025060002'),
        ('Mohammed', 'Benali', '0771234567', 'Constantine', 'Chteup', '[{"id":3,"name":"OLD MONEY BLAZER","price":45000,"size":"M","qty":1}]', 45000, 45000, 0, 'baridimob', 'pending', 'FLY2025060003'),
    ]
    for o in sample_orders:
        db.execute('''
            INSERT INTO orders (first_name, last_name, phone, wilaya, address, items, total, subtotal, shipping, payment_method, status, tracking_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', o)
    
    stats_data = [
        ('2026-05-01', 1247, 12, 386000),
        ('2026-05-02', 1580, 18, 524000),
        ('2026-05-03', 2134, 22, 612000),
        ('2026-05-04', 1892, 15, 441000),
        ('2026-05-05', 2456, 28, 789000),
        ('2026-05-06', 1823, 19, 534000),
        ('2026-05-07', 1567, 14, 398000),
        ('2026-05-08', 2345, 25, 712000),
        ('2026-05-09', 2789, 31, 891000),
        ('2026-05-10', 3102, 38, 1054000),
        ('2026-05-11', 2456, 29, 823000),
        ('2026-05-12', 1987, 21, 598000),
    ]
    db.executemany('INSERT INTO stats (date, views, orders, revenue) VALUES (?, ?, ?, ?)', stats_data)

# ================================================================
# AUTH HELPERS
# ================================================================
def hash_pw(pw): return hashlib.sha256(pw.encode()).hexdigest()
def make_token(): return secrets.token_hex(32)

def get_user_id(req):
    token = req.headers.get('Authorization', '').replace('Bearer ', '')
    if not token: return None
    db = get_db()
    cur = db.execute('SELECT user_id FROM sessions WHERE token=? AND expires>?', (token, datetime.now().isoformat()))
    row = cur.fetchone()
    return row['user_id'] if row else None

def get_session_id(req):
    return req.headers.get('X-Session', request.cookies.get('flyra_session', request.remote_addr or 'anon'))

# ================================================================
# LANGUAGE DETECTION
# ================================================================
def detect_lang(text):
    arabic = len(re.findall(r'[\u0600-\u06FF]', text or ''))
    french = sum(1 for w in ['bonjour','merci','je','vous','comment','pour','une','des','les','dans','avec','mon','ma','mes','nous'] if w.lower() in (text or '').lower())
    if arabic > 3: return 'ar'
    if french > 1: return 'fr'
    return 'en'

# ================================================================
# API: PRODUCTS
# ================================================================
@app.route('/api/products', methods=['GET', 'POST'])
def api_products():
    db = get_db()
    if request.method == 'GET':
        collection = request.args.get('collection', 'all')
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        limit = int(request.args.get('limit', 100))
        
        params = []
        q = 'SELECT * FROM products WHERE 1=1'
        if collection != 'all': q += ' AND collection=?'; params.append(collection)
        if search: q += ' AND (name LIKE ? OR desc LIKE ?)'; params.append(f'%{search}%'); params.append(f'%{search}%')
        if status: q += ' AND status=?'; params.append(status)
        q += f' ORDER BY featured DESC, id LIMIT ?'; params.append(limit)
        
        rows = db.execute(q, params).fetchall()
        return jsonify([dict(r) for r in rows])
    
    data = request.get_json()
    db.execute('''
        INSERT INTO products (name, owner, collection, price, old_price, tag, sizes, stock, status, desc, image, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (data.get('name'), data.get('owner',''), data.get('collection'), data.get('price'), data.get('old_price'),
           data.get('tag'), json.dumps(data.get('sizes',[])),
           data.get('stock',0), data.get('status','active'), data.get('desc',''),
           data.get('image',''), data.get('featured',0)))
    db.commit()
    return jsonify({'id': db.last_insert_id()})

@app.route('/api/products/<int:pid>', methods=['GET', 'PUT', 'DELETE'])
def api_product(pid):
    db = get_db()
    if request.method == 'GET':
        row = db.execute('SELECT * FROM products WHERE id=?', (pid,)).fetchone()
        return jsonify(dict(row)) if row else ('', 404)
    if request.method == 'PUT':
        data = request.get_json()
        allowed = ['name','collection','price','old_price','tag','sizes','stock','status','desc','image','featured','owner']
        sets = ', '.join([f"{k}=?" for k in data if k in allowed])
        if not sets: return jsonify({'error': 'No valid fields'}), 400
        vals = [data[k] for k in data if k in allowed]
        db.execute(f'UPDATE products SET {sets} WHERE id=?', (*vals, pid))
        db.commit()
        return jsonify({'ok': True})
    db.execute('DELETE FROM products WHERE id=?', (pid,))
    db.commit()
    return jsonify({'ok': True})

@app.route('/api/products/featured', methods=['GET'])
def api_featured():
    db = get_db()
    rows = db.execute('SELECT * FROM products WHERE featured=1 OR status IN ("NEW","LIMITED","HOT") LIMIT 6').fetchall()
    return jsonify([dict(r) for r in rows])

# ================================================================
# API: ORDERS
# ================================================================
@app.route('/api/orders', methods=['GET', 'POST'])
def api_orders():
    db = get_db()
    if request.method == 'GET':
        rows = db.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').fetchall()
        return jsonify([dict(r) for r in rows])
    
    data = request.get_json()
    items = json.dumps(data.get('items', []))
    subtotal = data.get('subtotal', 0)
    shipping = 0 if subtotal >= 25000 else 600
    total = subtotal + shipping
    
    tracking = f"FLY{datetime.now().strftime('%Y%m%d')}{secrets.token_hex(3).upper()[:6]}"
    
    db.execute('''
        INSERT INTO orders (first_name, last_name, phone, wilaya, address, items, subtotal, shipping, total, payment_method, tracking_code, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ''', (data.get('first_name'), data.get('last_name'), data.get('phone'),
           data.get('wilaya'), data.get('address',''), items, subtotal, shipping, total,
           data.get('payment_method','cod'), tracking))
    db.commit()
    oid = db.last_insert_id()
    
    user_id = get_user_id(request)
    if user_id:
        loyalty = db.execute('SELECT * FROM loyalty WHERE user_id=?', (user_id,)).fetchone()
        if loyalty:
            db.execute('UPDATE loyalty SET points=points+?, total_spent=total_spent+? WHERE user_id=?',
                       (int(total/1000), total, user_id))
        else:
            db.execute('INSERT INTO loyalty (user_id, points, total_spent, tier) VALUES (?, ?, ?, ?)',
                       (user_id, int(total/1000), total, 'Bronze'))
        db.commit()
    
    return jsonify({'id': oid, 'tracking': tracking, 'total': total})

@app.route('/api/orders/<int:oid>', methods=['GET', 'PUT'])
def api_order(oid):
    db = get_db()
    row = db.execute('SELECT * FROM orders WHERE id=?', (oid,)).fetchone()
    if not row: return jsonify({'error': 'Not found'}), 404
    
    if request.method == 'PUT':
        data = request.get_json()
        if 'status' in data: db.execute('UPDATE orders SET status=?, updated_at=? WHERE id=?', (data['status'], datetime.now().isoformat(), oid))
        if 'tracking_code' in data: db.execute('UPDATE orders SET tracking_code=? WHERE id=?', (data['tracking_code'], oid))
        db.commit()
        return jsonify({'ok': True})
    
    return jsonify(dict(row))

@app.route('/api/orders/track/<code>', methods=['GET'])
def api_track(code):
    db = get_db()
    row = db.execute('SELECT * FROM orders WHERE tracking_code=?', (code,)).fetchone()
    if not row: return jsonify({'error': 'Not found'}), 404
    d = dict(row)
    d['items'] = json.loads(d['items'])
    return jsonify(d)

# ================================================================
# API: CART
# ================================================================
@app.route('/api/cart', methods=['GET', 'POST', 'DELETE'])
def api_cart():
    db = get_db()
    sid = get_session_id(request)
    
    if request.method == 'GET':
        rows = db.execute('SELECT c.*, p.name, p.price, p.icon, p.stock, p.sizes FROM cart_items c LEFT JOIN products p ON c.product_id=p.id WHERE c.session_id=?', (sid,)).fetchall()
        return jsonify([dict(r) for r in rows])
    
    if request.method == 'POST':
        data = request.get_json()
        pid = data.get('product_id')
        qty = data.get('quantity', 1)
        size = data.get('size', '')
        
        existing = db.execute('SELECT * FROM cart_items WHERE session_id=? AND product_id=? AND size=?', (sid, pid, size)).fetchone()
        if existing:
            db.execute('UPDATE cart_items SET quantity=? WHERE id=?', (existing['quantity']+qty, existing['id']))
        else:
            db.execute('INSERT INTO cart_items (session_id, product_id, quantity, size) VALUES (?, ?, ?, ?)', (sid, pid, qty, size))
        db.commit()
        return jsonify({'ok': True})
    
    if request.method == 'DELETE':
        pid = request.args.get('product_id')
        if pid:
            db.execute('DELETE FROM cart_items WHERE session_id=? AND product_id=?', (sid, int(pid)))
        else:
            db.execute('DELETE FROM cart_items WHERE session_id=?', (sid,))
        db.commit()
        return jsonify({'ok': True})

# ================================================================
# API: WISHLIST
# ================================================================
@app.route('/api/wishlist', methods=['GET', 'POST', 'DELETE'])
def api_wishlist():
    db = get_db()
    sid = get_session_id(request)
    uid = get_user_id(request)
    
    if request.method == 'GET':
        rows = db.execute('''SELECT w.*, p.name, p.price, p.icon, p.stock, p.collection 
                          FROM wishlist w LEFT JOIN products p ON w.product_id=p.id 
                          WHERE w.session_id=? OR (w.user_id=? AND w.session_id IS NULL)''',
                          (sid, uid or 0)).fetchall()
        return jsonify([dict(r) for r in rows])
    
    if request.method == 'POST':
        pid = request.get_json().get('product_id')
        existing = db.execute('SELECT * FROM wishlist WHERE product_id=? AND (session_id=? OR user_id=?)', (pid, sid, uid)).fetchone()
        if not existing:
            db.execute('INSERT INTO wishlist (session_id, user_id, product_id) VALUES (?, ?, ?)', (sid, uid, pid))
            db.commit()
        return jsonify({'ok': True})
    
    if request.method == 'DELETE':
        pid = request.args.get('product_id')
        db.execute('DELETE FROM wishlist WHERE product_id=? AND (session_id=? OR user_id=?)', (pid, sid, uid or 0))
        db.commit()
        return jsonify({'ok': True})

# ================================================================
# API: AUTH
# ================================================================
@app.route('/api/auth/register', methods=['POST'])
def api_register():
    db = get_db()
    data = request.get_json()
    
    existing = db.execute('SELECT id FROM users WHERE email=?', (data.get('email'),)).fetchone()
    if existing: return jsonify({'error': 'Email already registered'}), 400
    
    db.execute('''
        INSERT INTO users (email, password_hash, first_name, last_name, phone, wilaya, address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (data.get('email'), hash_pw(data.get('password','')), data.get('first_name'), data.get('last_name'),
           data.get('phone'), data.get('wilaya'), data.get('address')))
    db.commit()
    
    uid = db.last_insert_id()
    token = make_token()
    db.execute('INSERT INTO sessions (user_id, token, expires) VALUES (?, ?, ?)',
               (uid, token, (datetime.now() + timedelta(days=30)).isoformat()))
    db.commit()
    
    db.execute('INSERT INTO loyalty (user_id, points, tier) VALUES (?, 0, ?)', (uid, 'Bronze'))
    db.commit()
    
    return jsonify({'token': token, 'user_id': uid})

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    db = get_db()
    data = request.get_json()
    
    row = db.execute('SELECT * FROM users WHERE email=? AND password_hash=?',
                     (data.get('email'), hash_pw(data.get('password','')))).fetchone()
    if not row: return jsonify({'error': 'Invalid credentials'}), 401
    
    token = make_token()
    db.execute('INSERT INTO sessions (user_id, token, expires) VALUES (?, ?, ?)',
               (row['id'], token, (datetime.now() + timedelta(days=30)).isoformat()))
    db.commit()
    
    return jsonify({'token': token, 'user_id': row['id'], 'email': row['email'], 'first_name': row['first_name']})

@app.route('/api/auth/profile', methods=['GET', 'PUT'])
def api_profile():
    db = get_db()
    uid = get_user_id(request)
    if not uid: return jsonify({'error': 'Unauthorized'}), 401
    
    if request.method == 'GET':
        row = db.execute('SELECT id, email, first_name, last_name, phone, wilaya, address, created_at FROM users WHERE id=?', (uid,)).fetchone()
        return jsonify(dict(row)) if row else ('', 404)
    
    data = request.get_json()
    for k in ['first_name','last_name','phone','wilaya','address']:
        if k in data: db.execute(f'UPDATE users SET {k}=? WHERE id=?', (data[k], uid))
    db.commit()
    return jsonify({'ok': True})

# ================================================================
# API: STATS / DASHBOARD
# ================================================================
@app.route('/api/stats', methods=['GET'])
def api_stats():
    db = get_db()
    
    total_orders = db.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    total_revenue = db.execute("SELECT SUM(total) FROM orders WHERE status!='cancelled'").fetchone()[0] or 0
    total_products = db.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    total_users = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    
    top_products = db.execute('''
        SELECT p.name, COUNT(o.id) as order_count 
        FROM orders o, products p 
        WHERE o.items LIKE '%'||p.name||'%'
        GROUP BY p.id ORDER BY order_count DESC LIMIT 5
    ''').fetchall()
    
    wilaya_breakdown = db.execute('''
        SELECT wilaya, COUNT(*) as orders, SUM(total) as revenue 
        FROM orders GROUP BY wilaya ORDER BY revenue DESC LIMIT 10
    ''').fetchall()
    
    daily_stats = db.execute('SELECT * FROM stats ORDER BY date DESC LIMIT 30').fetchall()
    
    low_stock = db.execute('SELECT * FROM products WHERE stock < 10 AND stock > 0').fetchall()
    out_of_stock = db.execute('SELECT * FROM products WHERE stock = 0').fetchall()
    
    recent_orders = db.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10').fetchall()
    
    return jsonify({
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'total_products': total_products,
        'total_users': total_users,
        'top_products': [dict(r) for r in top_products],
        'wilaya_breakdown': [dict(r) for r in wilaya_breakdown],
        'daily_stats': [dict(r) for r in daily_stats],
        'low_stock': [dict(r) for r in low_stock],
        'out_of_stock': [dict(r) for r in out_of_stock],
        'recent_orders': [dict(r) for r in recent_orders],
    })

@app.route('/api/stats/revenue', methods=['GET'])
def api_revenue():
    db = get_db()
    days = int(request.args.get('days', 30))
    rows = db.execute('SELECT date, SUM(total) as revenue, COUNT(*) as orders FROM orders WHERE date(created_at) >= date("now", ?) GROUP BY date(created_at) ORDER BY date', (f'-{days} days',)).fetchall()
    return jsonify([dict(r) for r in rows])

# ================================================================
# API: LOYALTY
# ================================================================
@app.route('/api/loyalty', methods=['GET'])
def api_loyalty():
    db = get_db()
    uid = get_user_id(request) or None
    sid = get_session_id(request)
    
    row = db.execute('SELECT * FROM loyalty WHERE user_id=? OR session_id=?', (uid or 0, sid)).fetchone()
    if not row:
        return jsonify({'points': 0, 'tier': 'Bronze', 'total_spent': 0})
    
    tier = 'Bronze'
    pts = row['points'] or 0
    if pts >= 50000: tier = 'Platinum'
    elif pts >= 25000: tier = 'Gold'
    elif pts >= 10000: tier = 'Silver'
    
    return jsonify({'points': pts, 'tier': tier, 'total_spent': row['total_spent'] or 0})

# ================================================================
# API: DROPS
# ================================================================
@app.route('/api/drops', methods=['GET', 'POST'])
def api_drops():
    db = get_db()
    if request.method == 'GET':
        rows = db.execute('''
            SELECT d.*, p.name, p.price, p.icon, p.collection 
            FROM drops d LEFT JOIN products p ON d.product_id=p.id 
            ORDER BY d.launch_date ASC
        ''').fetchall()
        return jsonify([dict(r) for r in rows])
    
    data = request.get_json()
    db.execute('INSERT INTO drops (product_id, launch_date) VALUES (?, ?)',
               (data.get('product_id'), data.get('launch_date')))
    db.commit()
    return jsonify({'ok': True})

# ================================================================
# API: NOTIFICATIONS
# ================================================================
@app.route('/api/notifications', methods=['GET'])
def api_notifications():
    db = get_db()
    sid = get_session_id(request)
    uid = get_user_id(request)
    rows = db.execute('SELECT * FROM notifications WHERE session_id=? OR user_id=? ORDER BY created_at DESC LIMIT 20',
                     (sid, uid or 0)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/notifications/read', methods=['POST'])
def api_mark_read():
    db = get_db()
    db.execute('UPDATE notifications SET read=1 WHERE read=0')
    db.commit()
    return jsonify({'ok': True})

# ================================================================
# API: REVIEWS
# ================================================================
@app.route('/api/reviews', methods=['GET', 'POST'])
def api_reviews():
    db = get_db()
    pid = request.args.get('product_id')
    if request.method == 'GET' and pid:
        rows = db.execute('SELECT r.*, u.first_name FROM reviews r LEFT JOIN users u ON r.user_id=u.id WHERE product_id=? ORDER BY created_at DESC', (pid,)).fetchall()
        return jsonify([dict(r) for r in rows])
    
    if request.method == 'POST':
        data = request.get_json()
        uid = get_user_id(request)
        db.execute('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
                   (data.get('product_id'), uid, data.get('rating',5), data.get('comment','')))
        db.commit()
        return jsonify({'ok': True})
    return jsonify([])

# ================================================================
# API: AI CHATBOT / STYLIST
# ================================================================
@app.route('/api/chat', methods=['POST'])
def api_chat():
    db = get_db()
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    lang = data.get('lang') or detect_lang(message)
    
    if not message:
        return jsonify({'reply': 'مرحباً! / Bonjour! / Hello! How can I help you today?'})
    
    products = db.execute('SELECT * FROM products WHERE status != "drop" ORDER BY featured DESC LIMIT 12').fetchall()
    product_list = '\n'.join([
        f"- {p['name']} | {p['collection']} | {p['price']:,} DZD | Sizes: {p['sizes']} | Stock: {p['stock']} | {p['status']} | {p['tag'] or ''} — {p['desc']}"
        for p in products
    ])
    
    system_en = f"""You are the FLYRA AI Stylist — Algeria's premier fashion AI assistant. FLYRA sells Old Money, Streetwear, Heritage, and Sport fashion across all 58 Algerian wilayas.

Product catalog:
{product_list}

Your role: Help customers find perfect outfits, recommend products, suggest sizes, discuss trends, and guide them through the FLYRA shopping experience. Be warm, knowledgeable, and persuasive. Always speak in the same language as the user.

Key info to know:
- Shipping: 2-5 days to all 58 wilayas, FREE over 25,000 DZD, else 600 DZD
- Payment: Cash on Delivery, CCP, BaridiMob, Edahabia
- Returns: 7 days if unused with tags
- Contact: WhatsApp +213 555 123 456 / hello@flyra.dz

Keep responses under 80 words. Recommend specific products by name. Always be helpful and enthusiastic about FLYRA fashion."""

    system_ar = f"""أنت المصمم الذكي لـ FLYRA — مساعد الأزياء الأول في الجزائر. تبيع FLYRA أزياء العظمة القديمة و الستريتوير و التراث والرياضة عبر جميع الولايات الـ 58 الجزائرية.

المنتجات:
{product_list}

ساعد العملاء في اختيار الإطلالات المثالية، اقترح المنتجات، وجّههم في تجربة التسوق. أجب بنفس لغة المستخدم. أقل من 80 كلمة. اذكر أسماء المنتجات."""

    system_fr = f"""Vous êtes le styliste IA FLYRA — l'assistant mode номер un d'Algérie. FLYRA vend Old Money, Streetwear, Heritage et Sport fashion dans les 58 wilayas.

Catalogue:
{product_list}

Aidez les clients à trouver des tenues parfaites. Répondez dans la même langue. Moins de 80 mots."""

    system_prompt = {'en': system_en, 'ar': system_ar, 'fr': system_fr}.get(lang, system_en)
    
    has_ollama = False
    try:
        import urllib.request
        req = urllib.request.Request('http://localhost:11434/api/tags')
        urllib.request.urlopen(req, timeout=3)
        has_ollama = True
    except: pass
    
    reply = None
    if has_ollama:
        try:
            import urllib.request, urllib.error
            payload = {
                'model': 'llama3.2',
                'messages': [{'role':'system','content':system_prompt}, {'role':'user','content':message}],
                'stream': False,
                'options': {'temperature': 0.7, 'num_predict': 250}
            }
            req = urllib.request.Request('http://localhost:11434/api/chat',
                data=json.dumps(payload).encode(), headers={'Content-Type':'application/json'}, method='POST')
            with urllib.request.urlopen(req, timeout=30) as resp:
                reply = json.loads(resp.read())['message']['content']
        except: pass
    
    if not reply:
        fallback = {
            'en': [
                "FLYRA's PHANTOM STREET HOODIE is our top pick! Perfect oversized fit with heavy-weight French terry. Pair with SKY RUNNER SNEAKERS for the ultimate street look.",
                "For Old Money style, you can't beat our BLAZER — Italian wool, structured shoulders, absolutely premium. Add an AMBER TEE underneath for a relaxed-yet-sophisticated vibe.",
                "Heritage collection is fire! The HERITAGE GANDOURA with hand embroidery from Tlemcen workshops is a statement piece. Available in sizes S-XXL.",
                "For sport, check out our TECH JOGGERS with reflective taping and four-way stretch. Paired with SKY RUNNER SNEAKERS = track-to-street perfection.",
                "Need help with sizing? Our sizes run true. For a relaxed fit, size up. M fits most. Free exchange if it doesn't fit!",
                "We ship FREE over 25,000 DZD. Cash on delivery across all 58 wilayas. WhatsApp us for personal styling advice!",
                "The BROCADE VEST is limited stock — traditional Algerian brocade with gold thread. Heritage luxury that stands out.",
            ],
            'ar': [
                "قميص FLYRA'S PHANTOM STREET HOODIE هو اختيارنا الأول! قصّة أوفر مع قماش فرنسي ثقيل. أضف حذاء SKY RUNNER SNEAKERS لإطلالة ستريت مثالية.",
                "لأسلوب العظمة القديمة، لا شيء يتفوق على البليزر — صوف إيطالي، أكتاف منظمة، فاخر جداً. أضف AMBER TEE من الداخل.",
                "مجموعة التراث رائعة! الجلبوبة التراثية بالتطريز اليدوي من ورش تلمسان.",
                "للرياضة، جرب بنطلون TECH JOGGERS مع شريط عاكس. مثالي من الاستاد للشارع.",
                "تحتاج مساعدة في المقاس؟ مقاساتنا حقيقية. للحصة المرتخية، خذ مقاس أكبر. تبادل مجاني!",
                "شحن مجاني فوق 25,000 دج. الدفع عند الاستلام عبر كل الولايات.",
            ],
            'fr': [
                "Le PHANTOM STREET HOODIE est notre coup de cœur! Coupe oversized, tissu français lourd. Associez aux SKY RUNNER SNEAKERS pour un look street parfait.",
                "Pour le style Old Money, le BLAZER est imbattable — laine italienne, épaules structurées, absolument premium. Ajoutez un AMBER TEE en dessous.",
                "La collection Heritage est incroyable! La GANDOURA avec broderie artisanale de Tlemcen.",
                "Pour le sport, essayez les TECH JOGGERS avec ruban réfléchissant. Du terrain à la rue.",
                "Besoin d'aide pour les tailles? Nos tailles sont standard. Pour un fit détendu, prenez une taille au-dessus. Échange gratuit!",
                "Livraison gratuite dès 25,000 DZD. Paiement à la livraison dans les 58 wilayas.",
            ],
        }
        import random
        all_fallback = fallback.get(lang, fallback['en'])
        reply = random.choice(all_fallback)
    
    return jsonify({'reply': reply, 'lang': lang, 'timestamp': datetime.now().isoformat()})

@app.route('/api/chat/history', methods=['GET'])
def api_chat_history():
    sid = get_session_id(request)
    history_file = os.path.join(os.path.dirname(__file__), f'chat_history_{sid[:16]}.json')
    if os.path.exists(history_file):
        with open(history_file) as f:
            return jsonify(json.load(f))
    return jsonify([])

@app.route('/api/chat/history', methods=['POST'])
def api_save_history():
    data = request.get_json() or []
    sid = get_session_id(request)
    history_file = os.path.join(os.path.dirname(__file__), f'chat_history_{sid[:16]}.json')
    with open(history_file, 'w') as f:
        json.dump(data[-50:], f)
    return jsonify({'ok': True})

# ================================================================
# API: SEARCH
# ================================================================
@app.route('/api/search', methods=['GET'])
def api_search():
    db = get_db()
    q = request.args.get('q', '').strip()
    if not q or len(q) < 2: return jsonify([])
    
    rows = db.execute("""
        SELECT * FROM products 
        WHERE name LIKE ? OR collection LIKE ? OR desc LIKE ? OR tag LIKE ?
        LIMIT 20
    """, (f'%{q}%', f'%{q}%', f'%{q}%', f'%{q}%')).fetchall()
    
    return jsonify([dict(r) for r in rows])

# ================================================================
# API: UPLOAD
# ================================================================
@app.route('/api/upload', methods=['POST'])
def api_upload():
    data = request.get_json() or {}
    img_data = data.get('image', '')
    
    if not img_data: return jsonify({'error': 'No image'}), 400
    
    import base64, uuid
    try:
        fmt, b64 = img_data.split(',', 1) if ',' in img_data else ('png', img_data)
        fmt = fmt.replace('data:image/', '').replace(';base64', '')
        fname = f"{uuid.uuid4().hex}.{fmt}"
        fpath = os.path.join(UPLOAD_DIR, fname)
        with open(fpath, 'wb') as f:
            f.write(base64.b64decode(b64))
        return jsonify({'url': f'/uploads/{fname}', 'filename': fname})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

# ================================================================
# API: EXPORT
# ================================================================
@app.route('/api/export/orders', methods=['GET'])
def api_export_orders():
    db = get_db()
    rows = db.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
    
    csv = 'ID,First Name,Last Name,Phone,Wilaya,Address,Items,Subtotal,Shipping,Total,Payment,Status,Tracking,Created\n'
    for r in rows:
        items = json.loads(r['items'] or '[]')
        csv += f"{r['id']},{r['first_name']},{r['last_name']},{r['phone']},{r['wilaya']},{r['address']},\"{items}\",{r['subtotal']},{r['shipping']},{r['total']},{r['payment_method']},{r['status']},{r['tracking_code']},{r['created_at']}\n"
    
    from io import BytesIO
    return send_file(
        BytesIO(csv.encode('utf-8-sig')),
        mimetype='text/csv',
        as_attachment=True,
        download_name='flyra_orders.csv'
    )

@app.route('/api/export/products', methods=['GET'])
def api_export_products():
    db = get_db()
    rows = db.execute('SELECT * FROM products').fetchall()
    
    csv = 'ID,Name,Collection,Price,Old Price,Icon,Tag,Sizes,Stock,Status,Description\n'
    for r in rows:
        csv += f"{r['id']},{r['name']},{r['collection']},{r['price']},{r['old_price'] or ''},{r['icon']},{r['tag'] or ''},{r['sizes']},{r['stock']},{r['status']},{r['desc']}\n"
    
    from io import BytesIO
    return send_file(
        BytesIO(csv.encode('utf-8-sig')),
        mimetype='text/csv',
        as_attachment=True,
        download_name='flyra_products.csv'
    )

# ================================================================
# API: WILAYAS
# ================================================================
@app.route('/api/wilayas', methods=['GET'])
def api_wilayas():
    wilayas = ['Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira',
               'Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda',
               'Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem','Mila','Mascara',
               'Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arreridj','El Tarf','Tindouf','Tissemsilt',
               'El Oued','Khenchela','Souk Ahras','Tipaza','Ksar El Boukhari','El Meghaier',
                'Sidi Khelil','In Salah','In Guezzam','Touggourt','Djanet','Algiers','Bab El Oued','Hydra',
               'Babeross','Ben Aknoun','Dely Ibrahim','Cheraga','Rouiba','Annaba']
    return jsonify({'wilayas': list(set(wilayas))})

# ================================================================
# HEALTH CHECK
# ================================================================
@app.route('/api/health', methods=['GET'])
def api_health():
    db = get_db()
    stats = {
        'products': db.execute('SELECT COUNT(*) FROM products').fetchone()[0],
        'orders': db.execute('SELECT COUNT(*) FROM orders').fetchone()[0],
        'users': db.execute('SELECT COUNT(*) FROM users').fetchone()[0],
        'revenue': db.execute("SELECT SUM(total) FROM orders WHERE status!='cancelled'").fetchone()[0] or 0,
    }
    return jsonify({'status': 'ok', 'version': '1.0', 'platform': 'FLYRA', 'stats': stats})

# ================================================================
# API: SETTINGS (WhatsApp number, collection images)
# ================================================================
@app.route('/api/settings', methods=['GET', 'POST'])
def api_settings():
    db = get_db()
    if request.method == 'GET':
        rows = db.execute('SELECT key, value FROM settings').fetchall()
        result = {}
        for r in rows:
            try: result[r['key']] = json.loads(r['value'])
            except: result[r['key']] = r['value']
        return jsonify(result)
    
    data = request.get_json() or {}
    for k, v in data.items():
        db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
                   (k, json.dumps(v) if isinstance(v, (dict, list)) else str(v)))
    db.commit()
    return jsonify({'ok': True})

# ================================================================
# FRONTEND ROUTES
# ================================================================
@app.route('/')
def serve_index():
    fp = os.path.join(os.path.dirname(__file__), 'index.html')
    if os.path.exists(fp): return send_file(fp)
    return '<h1>FLYRA — صعود بلا حدود</h1><p>Algerian Fashion Platform</p><p><a href="/api/health">API Health</a> · <a href="/app">Full App</a> · <a href="/mobile">Mobile</a></p>'

@app.route('/app')
@app.route('/app.html')
def serve_app():
    fp = os.path.join(os.path.dirname(__file__), 'app.html')
    if os.path.exists(fp): return send_file(fp)
    return '<h1>FLYRA App</h1><p><a href="/">Home</a></p>'

@app.route('/mobile')
@app.route('/mobile.html')
def serve_mobile():
    fp = os.path.join(os.path.dirname(__file__), 'mobile.html')
    if os.path.exists(fp): return send_file(fp)
    return '<h1>FLYRA Mobile</h1>'

@app.route('/admin')
@app.route('/admin.html')
def serve_admin():
    fp = os.path.join(os.path.dirname(__file__), 'admin.html')
    if os.path.exists(fp): return send_file(fp)
    return '<h1>FLYRA Admin</h1>'

@app.route('/about')
@app.route('/about.html')
def serve_about():
    fp = os.path.join(os.path.dirname(__file__), 'about.html')
    if os.path.exists(fp): return send_file(fp)
    return '<h1>About FLYRA</h1>'

# ================================================================
# MAIN
# ================================================================
init_db()

if __name__ == '__main__':
    print(f"""
╔═══════════════════════════════════════════════════╗
║          FLYRA BACKEND SERVER v1.0                ║
╠═══════════════════════════════════════════════════╣
║  Local:     http://localhost:5555                 ║
║  Network:   http://{{YOUR_IP}}:5555                ║
║  Health:    http://localhost:5555/api/health     ║
║  Products:  http://localhost:5555/api/products    ║
║  Orders:    http://localhost:5555/api/orders      ║
║  Chat:      http://localhost:5555/api/chat        ║
║  Stats:     http://localhost:5555/api/stats       ║
╠═══════════════════════════════════════════════════╣
║  SQLite:    flyra.db ({os.path.getsize(DB_PATH)/1024:.1f}KB)                      ║
║  Platform: FLYRA — Algerian Fashion Platform      ║
║  Version:  1.0 (Ascend Without Limits)            ║
╚═══════════════════════════════════════════════════╝
""")
    app.run(host='0.0.0.0', port=5555, debug=True)