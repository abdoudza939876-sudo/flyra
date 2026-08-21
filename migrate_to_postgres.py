#!/usr/bin/env python3
"""Migrate FLYRA data from local SQLite to production Postgres.
Usage: DATABASE_URL='postgres://...' python3 migrate_to_postgres.py
"""
import os, sqlite3, sys
from datetime import datetime

try:
    import psycopg2
except ImportError:
    sys.exit("pip install psycopg2-binary first")

DATABASE_URL = os.environ.get('DATABASE_URL', '')
if not DATABASE_URL.startswith('postgres'):
    sys.exit("Set DATABASE_URL to your Neon connection string")

if 'sslmode' not in DATABASE_URL:
    DATABASE_URL += ('&' if '?' in DATABASE_URL else '?') + 'sslmode=require'

local = sqlite3.connect('flyra.db')
local.row_factory = sqlite3.Row
pg = psycopg2.connect(DATABASE_URL)
cur = pg.cursor()

def pg_insert(table, cols, row):
    vals = [row[c] for c in cols]
    ph = ','.join(['%s'] * len(cols))
    cur.execute(f"INSERT INTO {table} ({','.join(cols)}) VALUES ({ph}) ON CONFLICT DO NOTHING", vals)

# Products
cols = ['name','collection','price','old_price','owner','tag','sizes','stock','status','desc','image','colors','icon','featured']
products = local.execute(f"SELECT {','.join(cols)} FROM products").fetchall()
for p in products:
    r = dict(p)
    for k in ('sizes','colors'):
        if isinstance(r[k], str) and r[k] and not r[k].startswith('['):
            pass
        elif r[k] is None:
            r[k] = ''
    pg_insert('products', cols, r)
print(f"products: {len(products)} migrated")

# Coupons
coupons = local.execute("SELECT code,discount,type,min_order,max_uses,used,expires,active FROM coupons").fetchall()
for c in coupons:
    pg_insert('coupons', ['code','discount','type','min_order','max_uses','used','expires','active'], dict(c))
print(f"coupons: {len(coupons)} migrated")

# Settings (WhatsApp number etc.)
settings = local.execute("SELECT key,value FROM settings").fetchall()
for s in settings:
    cur.execute("INSERT INTO settings (key,value) VALUES (%s,%s) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value", (s['key'], s['value']))
print(f"settings: {len(settings)} migrated")

pg.commit()
cur.execute("SELECT COUNT(*) FROM products")
print(f"Postgres now has {cur.fetchone()[0]} products. Done.")
pg.close()
